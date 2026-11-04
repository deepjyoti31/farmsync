-- Part 7: Access fixes, invitation acceptance and the crop catalog
--
-- 1. Farms could be created in, or moved into, an organization the user does
--    not belong to, putting data in front of strangers.
-- 2. Organization admins could promote anyone (themselves included) to owner,
--    demote or remove the owner, and invite new owners.
-- 3. Invitations could be created but never accepted.
-- 4. Marketplace listings could name any farm, not just one the seller manages.
-- 5. migrate_users_to_organizations() ran as SECURITY DEFINER for any caller,
--    with no fixed search_path.
-- 6. The crop catalog was empty, so "Plan a crop" had nothing to choose from.
--
-- Idempotent: safe to re-run.

-- -----------------------------------------------------------------------------
-- 1. Farms: the organization must be one the user can add farms to
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users insert farms" ON public.farms;
CREATE POLICY "Users insert farms" ON public.farms FOR INSERT
    WITH CHECK (
        auth.uid() = user_id
        AND (organization_id IS NULL OR public.is_org_member(organization_id, ARRAY['owner', 'admin', 'editor']))
    );

DROP POLICY IF EXISTS "Users update farms" ON public.farms;
CREATE POLICY "Users update farms" ON public.farms FOR UPDATE
    USING (user_id = auth.uid() OR public.is_org_member(organization_id, ARRAY['owner', 'admin']))
    WITH CHECK (
        (user_id = auth.uid() OR public.is_org_member(organization_id, ARRAY['owner', 'admin']))
        AND (organization_id IS NULL OR public.is_org_member(organization_id, ARRAY['owner', 'admin', 'editor']))
    );

-- -----------------------------------------------------------------------------
-- 2. Organization members: only owners grant, change or remove the owner role
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Admins add members" ON public.organization_members;
CREATE POLICY "Admins add members" ON public.organization_members FOR INSERT
    WITH CHECK (
        public.is_org_member(organization_id, ARRAY['owner'])
        OR (public.is_org_member(organization_id, ARRAY['admin']) AND role <> 'owner')
        -- The creator of a new organization adds themselves as its first owner.
        OR (
            user_id = auth.uid()
            AND role = 'owner'
            AND EXISTS (SELECT 1 FROM public.organizations o WHERE o.id = organization_id AND o.owner_id = auth.uid())
        )
    );

DROP POLICY IF EXISTS "Admins update members" ON public.organization_members;
CREATE POLICY "Admins update members" ON public.organization_members FOR UPDATE
    USING (
        public.is_org_member(organization_id, ARRAY['owner'])
        OR (public.is_org_member(organization_id, ARRAY['admin']) AND role <> 'owner')
    )
    WITH CHECK (
        public.is_org_member(organization_id, ARRAY['owner'])
        OR (public.is_org_member(organization_id, ARRAY['admin']) AND role <> 'owner')
    );

DROP POLICY IF EXISTS "Admins remove members or self leave" ON public.organization_members;
CREATE POLICY "Admins remove members or self leave" ON public.organization_members FOR DELETE
    USING (
        user_id = auth.uid()
        OR public.is_org_member(organization_id, ARRAY['owner'])
        OR (public.is_org_member(organization_id, ARRAY['admin']) AND role <> 'owner')
    );

DROP POLICY IF EXISTS "Admins manage invites" ON public.organization_invites;
CREATE POLICY "Admins manage invites" ON public.organization_invites FOR ALL
    USING (public.is_org_member(organization_id, ARRAY['owner', 'admin']))
    WITH CHECK (
        created_by = auth.uid()
        AND (
            public.is_org_member(organization_id, ARRAY['owner'])
            OR (public.is_org_member(organization_id, ARRAY['admin']) AND role <> 'owner')
        )
    );

-- -----------------------------------------------------------------------------
-- 3. Accepting invitations
-- -----------------------------------------------------------------------------
-- Called by the app after sign-in. Joins every pending, unexpired invitation
-- for the caller's confirmed email address. Existing memberships are left as
-- they are, so an invitation can never change someone's current role.
CREATE OR REPLACE FUNCTION public.accept_organization_invites()
RETURNS INTEGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_email TEXT;
    v_joined INTEGER := 0;
    v_invite RECORD;
BEGIN
    IF auth.uid() IS NULL THEN
        RETURN 0;
    END IF;

    SELECT lower(u.email) INTO v_email
    FROM auth.users u
    WHERE u.id = auth.uid() AND u.email_confirmed_at IS NOT NULL;

    IF v_email IS NULL THEN
        RETURN 0;
    END IF;

    FOR v_invite IN
        SELECT i.id, i.organization_id, i.role
        FROM public.organization_invites i
        WHERE lower(i.email) = v_email AND i.status = 'pending' AND i.expires_at > now()
        FOR UPDATE
    LOOP
        INSERT INTO public.organization_members (organization_id, user_id, role)
        VALUES (v_invite.organization_id, auth.uid(), v_invite.role)
        ON CONFLICT (organization_id, user_id) DO NOTHING;

        UPDATE public.organization_invites SET status = 'accepted' WHERE id = v_invite.id;
        v_joined := v_joined + 1;
    END LOOP;

    UPDATE public.organization_invites
    SET status = 'expired'
    WHERE lower(email) = v_email AND status = 'pending' AND expires_at <= now();

    RETURN v_joined;
END;
$$;

REVOKE ALL ON FUNCTION public.accept_organization_invites() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.accept_organization_invites() TO authenticated;

-- -----------------------------------------------------------------------------
-- 4. Marketplace listings: only for farms the seller can manage
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Manage own listings" ON public.marketplace_listings;
CREATE POLICY "Manage own listings" ON public.marketplace_listings FOR ALL
    USING (auth.uid() = seller_id)
    WITH CHECK (auth.uid() = seller_id AND public.can_edit_farm(farm_id));

-- -----------------------------------------------------------------------------
-- 5. Maintenance function: not callable from the API
-- -----------------------------------------------------------------------------
ALTER FUNCTION public.migrate_users_to_organizations() SET search_path = public;
REVOKE ALL ON FUNCTION public.migrate_users_to_organizations() FROM PUBLIC, anon, authenticated;

-- -----------------------------------------------------------------------------
-- 6. Crop catalog
-- -----------------------------------------------------------------------------
-- The names match the categories in the Plan a crop form. Durations are typical
-- days from sowing to first harvest and only prefill the expected harvest date.
INSERT INTO public.crops (name, growing_season, growing_duration)
SELECT v.name, v.season, v.days
FROM (VALUES
    ('Tomato', 'Rabi / Kharif', 110),
    ('Potato', 'Rabi', 100),
    ('Onion', 'Rabi / Kharif', 130),
    ('Carrot', 'Rabi', 85),
    ('Cabbage', 'Rabi', 90),
    ('Spinach', 'Rabi', 45),
    ('Broccoli', 'Rabi', 80),
    ('Apple', 'Perennial', NULL::INTEGER),
    ('Banana', 'Perennial', 300),
    ('Orange', 'Perennial', NULL),
    ('Mango', 'Perennial', NULL),
    ('Grapes', 'Perennial', NULL),
    ('Watermelon', 'Zaid', 85),
    ('Rice', 'Kharif', 120),
    ('Wheat', 'Rabi', 130),
    ('Maize', 'Kharif / Rabi', 100),
    ('Barley', 'Rabi', 120),
    ('Oats', 'Rabi', 110),
    ('Millet', 'Kharif', 85),
    ('Rose', 'Perennial', NULL),
    ('Sunflower', 'Kharif / Rabi', 95),
    ('Tulip', 'Rabi', NULL),
    ('Lily', 'Perennial', NULL),
    ('Marigold', 'Rabi / Kharif', 60),
    ('Jasmine', 'Perennial', NULL)
) AS v(name, season, days)
WHERE NOT EXISTS (SELECT 1 FROM public.crops c WHERE lower(c.name) = lower(v.name));
