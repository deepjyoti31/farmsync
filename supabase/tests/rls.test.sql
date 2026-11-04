-- Row Level Security regression tests.
-- Run with scripts/test-db.sh against a disposable database. Every check raises
-- an exception on failure, so psql exits non-zero (ON_ERROR_STOP).
--
-- Cast of characters:
--   Asha  owns a team organization and a farm in it
--   Ben   is a stranger, later added to Asha's team as a viewer

\set ON_ERROR_STOP on
\set QUIET on

BEGIN;

-- Fixed ids keep the assertions readable.
\set asha   '''aaaaaaaa-0000-0000-0000-000000000001'''
\set ben    '''bbbbbbbb-0000-0000-0000-000000000002'''
\set team   '''cccccccc-0000-0000-0000-000000000003'''
\set farm   '''dddddddd-0000-0000-0000-000000000004'''
\set field  '''eeeeeeee-0000-0000-0000-000000000005'''
\set crop   '''ffffffff-0000-0000-0000-000000000006'''

CREATE OR REPLACE FUNCTION pg_temp.expect(label TEXT, actual BIGINT, expected BIGINT) RETURNS VOID
LANGUAGE plpgsql AS $$
BEGIN
    IF actual IS DISTINCT FROM expected THEN
        RAISE EXCEPTION 'FAIL: % (expected %, got %)', label, expected, actual;
    END IF;
    RAISE NOTICE 'ok: %', label;
END $$;

-- Runs a statement that must be rejected by RLS.
CREATE OR REPLACE FUNCTION pg_temp.expect_denied(label TEXT, stmt TEXT) RETURNS VOID
LANGUAGE plpgsql AS $$
BEGIN
    BEGIN
        EXECUTE stmt;
    EXCEPTION WHEN insufficient_privilege THEN
        RAISE NOTICE 'ok: %', label;
        RETURN;
    END;
    RAISE EXCEPTION 'FAIL: % (statement was allowed)', label;
END $$;

-- Runs a statement that must be rejected by a CHECK constraint.
CREATE OR REPLACE FUNCTION pg_temp.expect_invalid(label TEXT, stmt TEXT) RETURNS VOID
LANGUAGE plpgsql AS $$
BEGIN
    BEGIN
        EXECUTE stmt;
    EXCEPTION WHEN check_violation THEN
        RAISE NOTICE 'ok: %', label;
        RETURN;
    END;
    RAISE EXCEPTION 'FAIL: % (statement was allowed)', label;
END $$;

GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA pg_temp TO authenticated;

-- 1. Signing up creates a profile and a personal workspace -----------------------
INSERT INTO auth.users (id, email, raw_user_meta_data) VALUES
    (:asha, 'asha@example.com', '{"first_name": "Asha", "last_name": "Kumar"}'),
    (:ben,  'ben@example.com',  '{"first_name": "Ben"}');

SELECT pg_temp.expect('signup creates profiles',
    (SELECT count(*) FROM public.profiles WHERE id IN (:asha, :ben)), 2);
SELECT pg_temp.expect('profile copies name from signup metadata',
    (SELECT count(*) FROM public.profiles WHERE id = :asha AND first_name = 'Asha'), 1);
SELECT pg_temp.expect('signup creates a personal workspace with owner membership',
    (SELECT count(*) FROM public.organization_members m
       JOIN public.organizations o ON o.id = m.organization_id
      WHERE o.is_personal AND m.role = 'owner' AND m.user_id IN (:asha, :ben)), 2);

-- 2. Asha builds a team farm ----------------------------------------------------
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claim.sub = 'aaaaaaaa-0000-0000-0000-000000000001';

INSERT INTO public.organizations (id, name, owner_id, is_personal) VALUES (:team, 'Asha Co-op', :asha, false);
INSERT INTO public.organization_members (organization_id, user_id, role) VALUES (:team, :asha, 'owner');
INSERT INTO public.farms (id, name, user_id, organization_id) VALUES (:farm, 'River Farm', :asha, :team);
INSERT INTO public.fields (id, farm_id, name, area, area_unit) VALUES (:field, :farm, 'North', 2, 'hectares');
INSERT INTO public.field_crops (id, field_id, name, planting_date, status) VALUES (:crop, :field, 'Rice', '2026-06-01', 'growing');
INSERT INTO public.harvests (field_crop_id, quantity, unit) VALUES (:crop, 35, 'quintal');
INSERT INTO public.tasks (farm_id, title, due_date) VALUES (:farm, 'Irrigate north field', '2026-11-05');
INSERT INTO public.inventory (farm_id, name, quantity) VALUES (:farm, 'Urea', 50);
INSERT INTO public.livestock (farm_id, livestock_type_id)
    SELECT :farm, id FROM public.livestock_types WHERE name = 'Goat';
INSERT INTO public.loans (farm_id, provider, amount, interest_rate, term_months) VALUES (:farm, 'Gramin Bank', 100000, 7, 12);
INSERT INTO public.sustainability_logs (field_id, type, product_name, quantity, unit) VALUES (:field, 'fertilizer', 'Vermicompost', 200, 'kg');
INSERT INTO public.forum_posts (forum_id, user_id, title, content)
    SELECT id, :asha, 'Hello', 'First post' FROM public.forums LIMIT 1;

SELECT pg_temp.expect('owner sees own harvests', (SELECT count(*) FROM public.harvests), 1);
SELECT pg_temp.expect('owner sees own tasks', (SELECT count(*) FROM public.tasks), 1);
SELECT pg_temp.expect('owner sees own loans', (SELECT count(*) FROM public.loans), 1);
SELECT pg_temp.expect('reference data is readable',
    (SELECT count(*) FROM public.livestock_types) + (SELECT count(*) FROM public.inventory_categories), 16);

-- 3. Ben is a stranger: sees nothing private and cannot join uninvited ----------
SET LOCAL request.jwt.claim.sub = 'bbbbbbbb-0000-0000-0000-000000000002';

SELECT pg_temp.expect('stranger cannot see the farm', (SELECT count(*) FROM public.farms WHERE id = :farm), 0);
SELECT pg_temp.expect('stranger cannot see harvests', (SELECT count(*) FROM public.harvests), 0);
SELECT pg_temp.expect('stranger cannot see tasks', (SELECT count(*) FROM public.tasks), 0);
SELECT pg_temp.expect('stranger cannot see the team', (SELECT count(*) FROM public.organizations WHERE id = :team), 0);
SELECT pg_temp.expect('stranger can read community posts', (SELECT count(*) FROM public.forum_posts), 1);
SELECT pg_temp.expect_denied('stranger cannot add themselves to a team',
    format('INSERT INTO public.organization_members (organization_id, user_id, role) VALUES (%L, %L, %L)',
           'cccccccc-0000-0000-0000-000000000003', 'bbbbbbbb-0000-0000-0000-000000000002', 'owner'));
SELECT pg_temp.expect_denied('stranger cannot write to the farm',
    format('INSERT INTO public.tasks (farm_id, title) VALUES (%L, %L)', 'dddddddd-0000-0000-0000-000000000004', 'x'));

-- 4. Asha adds Ben as a viewer: read-only access --------------------------------
SET LOCAL request.jwt.claim.sub = 'aaaaaaaa-0000-0000-0000-000000000001';
INSERT INTO public.organization_members (organization_id, user_id, role) VALUES (:team, :ben, 'viewer');

SET LOCAL request.jwt.claim.sub = 'bbbbbbbb-0000-0000-0000-000000000002';
SELECT pg_temp.expect('viewer sees the team farm', (SELECT count(*) FROM public.farms WHERE id = :farm), 1);
SELECT pg_temp.expect('viewer sees harvests', (SELECT count(*) FROM public.harvests), 1);
SELECT pg_temp.expect('viewer sees input logs', (SELECT count(*) FROM public.sustainability_logs), 1);
SELECT pg_temp.expect_denied('viewer cannot add tasks',
    format('INSERT INTO public.tasks (farm_id, title) VALUES (%L, %L)', 'dddddddd-0000-0000-0000-000000000004', 'x'));

WITH changed AS (UPDATE public.tasks SET title = 'changed' RETURNING 1)
SELECT pg_temp.expect('viewer updates affect no rows', (SELECT count(*) FROM changed), 0);

-- 5. Farm-level production entries and profile pictures ----------------------
SET LOCAL request.jwt.claim.sub = 'aaaaaaaa-0000-0000-0000-000000000001';
INSERT INTO public.livestock_production (farm_id, production_type, quantity, unit)
    VALUES (:farm, 'eggs', 120, 'pieces');
INSERT INTO public.livestock_production (livestock_id, production_type, quantity, unit)
    SELECT id, 'milk', 4.5, 'litres' FROM public.livestock WHERE farm_id = :farm LIMIT 1;
SELECT pg_temp.expect('per-animal production entries inherit the farm',
    (SELECT count(*) FROM public.livestock_production WHERE farm_id = :farm), 2);
INSERT INTO public.tasks (farm_id, title, recurrence) VALUES (:farm, 'Clean water troughs', 'weekly');
SELECT pg_temp.expect_invalid('tasks reject an unknown recurrence',
    format('INSERT INTO public.tasks (farm_id, title, recurrence) VALUES (%L, %L, %L)',
           'dddddddd-0000-0000-0000-000000000004', 'x', 'fortnightly'));

SET LOCAL request.jwt.claim.sub = 'bbbbbbbb-0000-0000-0000-000000000002';
SELECT pg_temp.expect('viewer sees production entries', (SELECT count(*) FROM public.livestock_production), 2);
SELECT pg_temp.expect_denied('viewer cannot log production',
    format('INSERT INTO public.livestock_production (farm_id, production_type, quantity, unit) VALUES (%L, %L, 1, %L)',
           'dddddddd-0000-0000-0000-000000000004', 'eggs', 'pieces'));

INSERT INTO storage.objects (bucket_id, name) VALUES ('avatars', 'bbbbbbbb-0000-0000-0000-000000000002/avatar.png');
SELECT pg_temp.expect('user can upload into own avatar folder',
    (SELECT count(*) FROM storage.objects WHERE name LIKE 'bbbbbbbb-%'), 1);
SELECT pg_temp.expect_denied('user cannot upload into another user''s avatar folder',
    format('INSERT INTO storage.objects (bucket_id, name) VALUES (%L, %L)',
           'avatars', 'aaaaaaaa-0000-0000-0000-000000000001/avatar.png'));

-- 6. Teams: no strangers' organizations, no owner escalation, invites work ----
\set carl '''cccccccc-1111-0000-0000-000000000007'''
\set dave '''dddddddd-1111-0000-0000-000000000008'''
RESET ROLE;
INSERT INTO auth.users (id, email, raw_user_meta_data, email_confirmed_at) VALUES
    (:carl, 'carl@example.com', '{"first_name": "Carl"}', now()),
    (:dave, 'dave@example.com', '{"first_name": "Dave"}', now());
SET LOCAL ROLE authenticated;

-- Ben (a viewer) may not create farms in Asha's team or move his own farm there.
SET LOCAL request.jwt.claim.sub = 'bbbbbbbb-0000-0000-0000-000000000002';
SELECT pg_temp.expect_denied('viewer cannot create a farm in the team',
    format('INSERT INTO public.farms (name, user_id, organization_id) VALUES (%L, %L, %L)',
           'Sneaky', 'bbbbbbbb-0000-0000-0000-000000000002', 'cccccccc-0000-0000-0000-000000000003'));

-- Asha makes Ben an admin. An admin cannot then make himself owner.
SET LOCAL request.jwt.claim.sub = 'aaaaaaaa-0000-0000-0000-000000000001';
UPDATE public.organization_members SET role = 'admin' WHERE organization_id = :team AND user_id = :ben;
SET LOCAL request.jwt.claim.sub = 'bbbbbbbb-0000-0000-0000-000000000002';
SELECT pg_temp.expect_denied('admin cannot promote himself to owner',
    format('UPDATE public.organization_members SET role = %L WHERE organization_id = %L AND user_id = %L',
           'owner', 'cccccccc-0000-0000-0000-000000000003', 'bbbbbbbb-0000-0000-0000-000000000002'));
WITH removed AS (DELETE FROM public.organization_members WHERE organization_id = :team AND user_id = :asha RETURNING 1)
SELECT pg_temp.expect('admin cannot remove the owner', (SELECT count(*) FROM removed), 0);
SELECT pg_temp.expect_denied('admin cannot invite a new owner',
    format('INSERT INTO public.organization_invites (organization_id, email, role, expires_at, created_by) VALUES (%L, %L, %L, now() + interval %L, %L)',
           'cccccccc-0000-0000-0000-000000000003', 'carl@example.com', 'owner', '7 days', 'bbbbbbbb-0000-0000-0000-000000000002'));

-- An admin can invite an editor, and the invitee joins on their next sign-in.
INSERT INTO public.organization_invites (organization_id, email, role, expires_at, created_by)
    VALUES (:team, 'Carl@Example.com', 'editor', now() + interval '7 days', :ben);
SET LOCAL request.jwt.claim.sub = 'cccccccc-1111-0000-0000-000000000007';
SELECT pg_temp.expect('invitee accepts one invitation', (SELECT public.accept_organization_invites()), 1);
SELECT pg_temp.expect('invitee is now an editor of the team',
    (SELECT count(*) FROM public.organization_members WHERE organization_id = :team AND user_id = :carl AND role = 'editor'), 1);
SELECT pg_temp.expect('accepting twice joins nothing new', (SELECT public.accept_organization_invites()), 0);

-- Listings may only name a farm the seller manages.
SET LOCAL request.jwt.claim.sub = 'dddddddd-1111-0000-0000-000000000008';
SELECT pg_temp.expect_denied('cannot list produce from another person''s farm',
    format('INSERT INTO public.marketplace_listings (farm_id, seller_id, title, category, price_per_unit, unit, quantity_available) VALUES (%L, %L, %L, %L, 1, %L, 1)',
           'dddddddd-0000-0000-0000-000000000004', 'dddddddd-1111-0000-0000-000000000008', 'x', 'grains', 'kg'));
SELECT pg_temp.expect('the crop catalog is seeded', (SELECT count(*) FROM public.crops WHERE name IN ('Wheat', 'Rice', 'Tomato')), 3);

-- 7. Every public table has RLS enabled and at least one policy -----------------
RESET ROLE;
SELECT pg_temp.expect('all public tables have RLS enabled',
    (SELECT count(*) FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public' AND c.relkind = 'r' AND NOT c.relrowsecurity), 0);
SELECT pg_temp.expect('all RLS tables have at least one policy',
    (SELECT count(*) FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public' AND c.relkind = 'r' AND c.relrowsecurity
        AND NOT EXISTS (SELECT 1 FROM pg_policy p WHERE p.polrelid = c.oid)), 0);

ROLLBACK;

\echo 'All RLS tests passed.'
