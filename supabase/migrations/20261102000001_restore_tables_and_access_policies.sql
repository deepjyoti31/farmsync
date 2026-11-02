-- Part 5: Restore missing tables and complete Row Level Security
--
-- The consolidated migrations (Parts 1-4) left three gaps:
--   1. Seven tables that the UI reads and writes were dropped:
--      tasks, inventory, inventory_categories, livestock, livestock_types,
--      expert_tips (plus the Community page queried a non-existent "posts" table).
--   2. About twenty tables had RLS enabled but no policies, which in Postgres
--      means "deny everything". Crops, harvests, sensors, organizations,
--      cooperatives, loans and insurance were therefore unusable.
--   3. Nothing created a profile or a personal workspace when a user signed up.
--
-- This migration is idempotent: it can be applied to a fresh database or to an
-- existing deployment.

-- -----------------------------------------------------------------------------
-- 1. Access helper functions
-- -----------------------------------------------------------------------------
-- SECURITY DEFINER lets policies check membership without recursively triggering
-- the RLS policies of organization_members itself.

CREATE OR REPLACE FUNCTION public.is_org_member(
    p_org_id UUID,
    p_roles TEXT[] DEFAULT ARRAY['owner', 'admin', 'editor', 'viewer']
) RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.organization_members m
        WHERE m.organization_id = p_org_id
          AND m.user_id = auth.uid()
          AND m.role = ANY (p_roles)
    );
$$;

-- Read access to a farm: its owner, or any member of the farm's organization.
CREATE OR REPLACE FUNCTION public.can_access_farm(p_farm_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.farms f
        WHERE f.id = p_farm_id
          AND (f.user_id = auth.uid() OR public.is_org_member(f.organization_id))
    );
$$;

-- Write access to a farm: its owner, or an organization member with one of the given roles.
CREATE OR REPLACE FUNCTION public.can_edit_farm(
    p_farm_id UUID,
    p_roles TEXT[] DEFAULT ARRAY['owner', 'admin', 'editor']
) RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.farms f
        WHERE f.id = p_farm_id
          AND (f.user_id = auth.uid() OR public.is_org_member(f.organization_id, p_roles))
    );
$$;

CREATE OR REPLACE FUNCTION public.field_farm_id(p_field_id UUID)
RETURNS UUID
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
    SELECT farm_id FROM public.fields WHERE id = p_field_id;
$$;

CREATE OR REPLACE FUNCTION public.field_crop_farm_id(p_field_crop_id UUID)
RETURNS UUID
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
    SELECT f.farm_id
    FROM public.field_crops fc
    JOIN public.fields f ON f.id = fc.field_id
    WHERE fc.id = p_field_crop_id;
$$;

GRANT EXECUTE ON FUNCTION public.is_org_member(UUID, TEXT[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_access_farm(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_edit_farm(UUID, TEXT[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.field_farm_id(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.field_crop_farm_id(UUID) TO authenticated;


-- -----------------------------------------------------------------------------
-- 2. Restored tables
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    farm_id UUID REFERENCES public.farms(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    due_date DATE,
    priority TEXT CHECK (priority IN ('low', 'medium', 'high')) DEFAULT 'medium',
    status TEXT CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')) DEFAULT 'pending',
    task_type TEXT,
    related_id UUID,
    assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_tasks_farm_due ON public.tasks(farm_id, due_date);

CREATE TABLE IF NOT EXISTS public.inventory_categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    type TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.inventory (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    farm_id UUID REFERENCES public.farms(id) ON DELETE CASCADE NOT NULL,
    category_id UUID REFERENCES public.inventory_categories(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    description TEXT,
    quantity NUMERIC NOT NULL DEFAULT 0 CHECK (quantity >= 0),
    unit TEXT,
    minimum_stock NUMERIC,
    purchase_date DATE,
    purchase_price NUMERIC,
    expiry_date DATE,
    storage_location TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_inventory_farm ON public.inventory(farm_id);

CREATE TABLE IF NOT EXISTS public.inventory_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    inventory_id UUID REFERENCES public.inventory(id) ON DELETE CASCADE NOT NULL,
    transaction_type TEXT CHECK (transaction_type IN ('purchase', 'usage', 'sale', 'adjustment', 'loss')) NOT NULL,
    quantity NUMERIC NOT NULL,
    unit_price NUMERIC,
    total_price NUMERIC,
    transaction_date DATE DEFAULT CURRENT_DATE NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_inventory_tx_item ON public.inventory_transactions(inventory_id);

CREATE TABLE IF NOT EXISTS public.livestock_types (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    category TEXT,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.livestock (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    farm_id UUID REFERENCES public.farms(id) ON DELETE CASCADE NOT NULL,
    livestock_type_id UUID REFERENCES public.livestock_types(id) NOT NULL,
    tag_id TEXT,
    breed TEXT,
    gender TEXT,
    birth_date DATE,
    acquisition_date DATE,
    acquisition_cost NUMERIC,
    status TEXT DEFAULT 'active',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_livestock_farm ON public.livestock(farm_id);

CREATE TABLE IF NOT EXISTS public.livestock_health_records (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    livestock_id UUID REFERENCES public.livestock(id) ON DELETE CASCADE NOT NULL,
    record_date DATE DEFAULT CURRENT_DATE NOT NULL,
    record_type TEXT NOT NULL, -- 'vaccination', 'treatment', 'checkup', 'breeding'
    description TEXT,
    medicine TEXT,
    dosage TEXT,
    administered_by TEXT,
    cost NUMERIC,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_livestock_health_animal ON public.livestock_health_records(livestock_id);

CREATE TABLE IF NOT EXISTS public.livestock_production (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    livestock_id UUID REFERENCES public.livestock(id) ON DELETE CASCADE NOT NULL,
    production_date DATE DEFAULT CURRENT_DATE NOT NULL,
    production_type TEXT NOT NULL, -- 'milk', 'eggs', 'wool', 'weight'
    quantity NUMERIC NOT NULL,
    unit TEXT NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_livestock_production_animal ON public.livestock_production(livestock_id);

CREATE TABLE IF NOT EXISTS public.expert_tips (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT,
    is_verified BOOLEAN DEFAULT false,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Let PostgREST embed author profiles in forum posts: select('*, user:profiles(...)')
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'forum_posts_user_profile_fkey'
    ) THEN
        -- Every author needs a profile row before the constraint can be added.
        INSERT INTO public.profiles (id)
        SELECT DISTINCT p.user_id FROM public.forum_posts p
        WHERE NOT EXISTS (SELECT 1 FROM public.profiles pr WHERE pr.id = p.user_id);

        ALTER TABLE public.forum_posts
            ADD CONSTRAINT forum_posts_user_profile_fkey
            FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Wholesale (mandi) price detail used by the Market page. price_per_unit stays
-- as the canonical price; modal_price is the most common traded price.
ALTER TABLE public.market_data ADD COLUMN IF NOT EXISTS variety TEXT;
ALTER TABLE public.market_data ADD COLUMN IF NOT EXISTS state TEXT;
ALTER TABLE public.market_data ADD COLUMN IF NOT EXISTS district TEXT;
ALTER TABLE public.market_data ADD COLUMN IF NOT EXISTS min_price NUMERIC;
ALTER TABLE public.market_data ADD COLUMN IF NOT EXISTS max_price NUMERIC;
ALTER TABLE public.market_data ADD COLUMN IF NOT EXISTS modal_price NUMERIC;
CREATE INDEX IF NOT EXISTS idx_market_data_state ON public.market_data(state);

-- Additional indexes for common lookups
CREATE INDEX IF NOT EXISTS idx_equipment_maintenance_equipment ON public.equipment_maintenance(equipment_id);
CREATE INDEX IF NOT EXISTS idx_loans_farm ON public.loans(farm_id);
CREATE INDEX IF NOT EXISTS idx_insurance_farm ON public.insurance_policies(farm_id);
CREATE INDEX IF NOT EXISTS idx_bulk_orders_org ON public.bulk_orders(organization_id);
CREATE INDEX IF NOT EXISTS idx_produce_batches_org ON public.produce_batches(organization_id);

-- updated_at triggers for the restored tables
DO $$
DECLARE
    t TEXT;
BEGIN
    FOREACH t IN ARRAY ARRAY['tasks', 'inventory', 'inventory_categories', 'livestock', 'livestock_types', 'expert_tips'] LOOP
        IF NOT EXISTS (
            SELECT 1 FROM pg_trigger WHERE tgname = 'update_' || t || '_updated_at'
        ) THEN
            EXECUTE format(
                'CREATE TRIGGER %I BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()',
                'update_' || t || '_updated_at', t
            );
        END IF;
    END LOOP;
END $$;


-- -----------------------------------------------------------------------------
-- 3. New-user bootstrap: profile + personal workspace
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    new_org_id UUID;
BEGIN
    INSERT INTO public.profiles (id, first_name, last_name)
    VALUES (
        NEW.id,
        NEW.raw_user_meta_data ->> 'first_name',
        NEW.raw_user_meta_data ->> 'last_name'
    )
    ON CONFLICT (id) DO NOTHING;

    IF NOT EXISTS (
        SELECT 1 FROM public.organizations WHERE owner_id = NEW.id AND is_personal = true
    ) THEN
        INSERT INTO public.organizations (name, owner_id, is_personal)
        VALUES ('Personal Workspace', NEW.id, true)
        RETURNING id INTO new_org_id;

        INSERT INTO public.organization_members (organization_id, user_id, role)
        VALUES (new_org_id, NEW.id, 'owner');
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Backfill existing users
INSERT INTO public.profiles (id, first_name, last_name)
SELECT u.id, u.raw_user_meta_data ->> 'first_name', u.raw_user_meta_data ->> 'last_name'
FROM auth.users u
ON CONFLICT (id) DO NOTHING;

SELECT public.migrate_users_to_organizations();


-- -----------------------------------------------------------------------------
-- 4. Enable RLS on every table that lacked it
-- -----------------------------------------------------------------------------
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.livestock ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.livestock_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.livestock_health_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.livestock_production ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expert_tips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forums ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_posts ENABLE ROW LEVEL SECURITY;


-- -----------------------------------------------------------------------------
-- 5. Policies
-- -----------------------------------------------------------------------------
-- Each policy is dropped first so the migration can be re-run safely.

-- Organizations ----------------------------------------------------------------
DROP POLICY IF EXISTS "Members view organizations" ON public.organizations;
CREATE POLICY "Members view organizations" ON public.organizations FOR SELECT
    USING (owner_id = auth.uid() OR public.is_org_member(id));
DROP POLICY IF EXISTS "Users create organizations" ON public.organizations;
CREATE POLICY "Users create organizations" ON public.organizations FOR INSERT
    WITH CHECK (owner_id = auth.uid());
DROP POLICY IF EXISTS "Admins update organizations" ON public.organizations;
CREATE POLICY "Admins update organizations" ON public.organizations FOR UPDATE
    USING (owner_id = auth.uid() OR public.is_org_member(id, ARRAY['owner', 'admin']));
DROP POLICY IF EXISTS "Owners delete team organizations" ON public.organizations;
CREATE POLICY "Owners delete team organizations" ON public.organizations FOR DELETE
    USING (owner_id = auth.uid() AND is_personal = false);

-- Organization members -------------------------------------------------------
DROP POLICY IF EXISTS "View co-members" ON public.organization_members;
CREATE POLICY "View co-members" ON public.organization_members FOR SELECT
    USING (user_id = auth.uid() OR public.is_org_member(organization_id));
DROP POLICY IF EXISTS "Admins add members" ON public.organization_members;
CREATE POLICY "Admins add members" ON public.organization_members FOR INSERT
    WITH CHECK (
        public.is_org_member(organization_id, ARRAY['owner', 'admin'])
        -- The creator of a new organization adds themselves as its first owner.
        OR (
            user_id = auth.uid()
            AND role = 'owner'
            AND EXISTS (SELECT 1 FROM public.organizations o WHERE o.id = organization_id AND o.owner_id = auth.uid())
        )
    );
DROP POLICY IF EXISTS "Admins update members" ON public.organization_members;
CREATE POLICY "Admins update members" ON public.organization_members FOR UPDATE
    USING (public.is_org_member(organization_id, ARRAY['owner', 'admin']));
DROP POLICY IF EXISTS "Admins remove members or self leave" ON public.organization_members;
CREATE POLICY "Admins remove members or self leave" ON public.organization_members FOR DELETE
    USING (user_id = auth.uid() OR public.is_org_member(organization_id, ARRAY['owner', 'admin']));

-- Organization invites --------------------------------------------------------
DROP POLICY IF EXISTS "Admins and invitees view invites" ON public.organization_invites;
CREATE POLICY "Admins and invitees view invites" ON public.organization_invites FOR SELECT
    USING (
        public.is_org_member(organization_id, ARRAY['owner', 'admin'])
        OR lower(email) = lower(auth.jwt() ->> 'email')
    );
DROP POLICY IF EXISTS "Admins manage invites" ON public.organization_invites;
CREATE POLICY "Admins manage invites" ON public.organization_invites FOR ALL
    USING (public.is_org_member(organization_id, ARRAY['owner', 'admin']))
    WITH CHECK (public.is_org_member(organization_id, ARRAY['owner', 'admin']) AND created_by = auth.uid());

-- Profiles ---------------------------------------------------------------------
DROP POLICY IF EXISTS "Insert own profile" ON public.profiles;
CREATE POLICY "Insert own profile" ON public.profiles FOR INSERT WITH CHECK (id = auth.uid());

-- Notifications -----------------------------------------------------------------
DROP POLICY IF EXISTS "Users can delete their own notifications" ON public.notifications;
CREATE POLICY "Users can delete their own notifications" ON public.notifications FOR DELETE
    USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can create their own notifications" ON public.notifications;
CREATE POLICY "Users can create their own notifications" ON public.notifications FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Shared reference data (readable by everyone, written by admins via service role)
DROP POLICY IF EXISTS "Read crop catalog" ON public.crops;
CREATE POLICY "Read crop catalog" ON public.crops FOR SELECT USING (true);
DROP POLICY IF EXISTS "Authenticated add crops" ON public.crops;
CREATE POLICY "Authenticated add crops" ON public.crops FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Read livestock types" ON public.livestock_types;
CREATE POLICY "Read livestock types" ON public.livestock_types FOR SELECT USING (true);
DROP POLICY IF EXISTS "Read inventory categories" ON public.inventory_categories;
CREATE POLICY "Read inventory categories" ON public.inventory_categories FOR SELECT USING (true);
DROP POLICY IF EXISTS "Read expert tips" ON public.expert_tips;
CREATE POLICY "Read expert tips" ON public.expert_tips FOR SELECT USING (true);

-- Financial categories: system categories (user_id NULL) plus the user's own
DROP POLICY IF EXISTS "View financial categories" ON public.financial_categories;
CREATE POLICY "View financial categories" ON public.financial_categories FOR SELECT
    USING (user_id IS NULL OR user_id = auth.uid());
DROP POLICY IF EXISTS "Manage own financial categories" ON public.financial_categories;
CREATE POLICY "Manage own financial categories" ON public.financial_categories FOR ALL
    USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Forums --------------------------------------------------------------------------
DROP POLICY IF EXISTS "Read forums" ON public.forums;
CREATE POLICY "Read forums" ON public.forums FOR SELECT USING (true);
DROP POLICY IF EXISTS "Read forum posts" ON public.forum_posts;
CREATE POLICY "Read forum posts" ON public.forum_posts FOR SELECT USING (true);
DROP POLICY IF EXISTS "Manage own forum posts" ON public.forum_posts;
CREATE POLICY "Manage own forum posts" ON public.forum_posts FOR ALL
    USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Farm-scoped tables: read for anyone with farm access, write for editors.
-- Finance-sensitive tables (loans, insurance) are restricted to owners and admins.
DO $$
DECLARE
    t TEXT;
    write_roles TEXT;
BEGIN
    FOREACH t IN ARRAY ARRAY[
        'tasks', 'inventory', 'livestock', 'devices',
        'farm_subscriptions', 'compliance_audits', 'loans', 'insurance_policies'
    ] LOOP
        write_roles := CASE WHEN t IN ('loans', 'insurance_policies')
            THEN 'ARRAY[''owner'', ''admin'']'
            ELSE 'ARRAY[''owner'', ''admin'', ''editor'']' END;

        EXECUTE format('DROP POLICY IF EXISTS "View %1$s" ON public.%1$I', t);
        EXECUTE format(
            'CREATE POLICY "View %1$s" ON public.%1$I FOR SELECT USING (public.can_access_farm(farm_id))', t);
        EXECUTE format('DROP POLICY IF EXISTS "Manage %1$s" ON public.%1$I', t);
        EXECUTE format(
            'CREATE POLICY "Manage %1$s" ON public.%1$I FOR ALL USING (public.can_edit_farm(farm_id, %2$s)) WITH CHECK (public.can_edit_farm(farm_id, %2$s))',
            t, write_roles);
    END LOOP;
END $$;

-- Field-scoped tables -------------------------------------------------------------
DO $$
DECLARE
    t TEXT;
BEGIN
    FOREACH t IN ARRAY ARRAY['field_crops', 'sustainability_logs', 'water_usage'] LOOP
        EXECUTE format('DROP POLICY IF EXISTS "View %1$s" ON public.%1$I', t);
        EXECUTE format(
            'CREATE POLICY "View %1$s" ON public.%1$I FOR SELECT USING (public.can_access_farm(public.field_farm_id(field_id)))', t);
        EXECUTE format('DROP POLICY IF EXISTS "Manage %1$s" ON public.%1$I', t);
        EXECUTE format(
            'CREATE POLICY "Manage %1$s" ON public.%1$I FOR ALL USING (public.can_edit_farm(public.field_farm_id(field_id))) WITH CHECK (public.can_edit_farm(public.field_farm_id(field_id)))', t);
    END LOOP;
END $$;

-- Harvests (via field crop)
DROP POLICY IF EXISTS "View harvests" ON public.harvests;
CREATE POLICY "View harvests" ON public.harvests FOR SELECT
    USING (public.can_access_farm(public.field_crop_farm_id(field_crop_id)));
DROP POLICY IF EXISTS "Manage harvests" ON public.harvests;
CREATE POLICY "Manage harvests" ON public.harvests FOR ALL
    USING (public.can_edit_farm(public.field_crop_farm_id(field_crop_id)))
    WITH CHECK (public.can_edit_farm(public.field_crop_farm_id(field_crop_id)));

-- Child tables reached through a parent row ----------------------------------------
DROP POLICY IF EXISTS "View equipment maintenance" ON public.equipment_maintenance;
CREATE POLICY "View equipment maintenance" ON public.equipment_maintenance FOR SELECT
    USING (EXISTS (SELECT 1 FROM public.equipment e WHERE e.id = equipment_id AND public.can_access_farm(e.farm_id)));
DROP POLICY IF EXISTS "Manage equipment maintenance" ON public.equipment_maintenance;
CREATE POLICY "Manage equipment maintenance" ON public.equipment_maintenance FOR ALL
    USING (EXISTS (SELECT 1 FROM public.equipment e WHERE e.id = equipment_id AND public.can_edit_farm(e.farm_id)))
    WITH CHECK (EXISTS (SELECT 1 FROM public.equipment e WHERE e.id = equipment_id AND public.can_edit_farm(e.farm_id)));

DROP POLICY IF EXISTS "View inventory transactions" ON public.inventory_transactions;
CREATE POLICY "View inventory transactions" ON public.inventory_transactions FOR SELECT
    USING (EXISTS (SELECT 1 FROM public.inventory i WHERE i.id = inventory_id AND public.can_access_farm(i.farm_id)));
DROP POLICY IF EXISTS "Manage inventory transactions" ON public.inventory_transactions;
CREATE POLICY "Manage inventory transactions" ON public.inventory_transactions FOR ALL
    USING (EXISTS (SELECT 1 FROM public.inventory i WHERE i.id = inventory_id AND public.can_edit_farm(i.farm_id)))
    WITH CHECK (EXISTS (SELECT 1 FROM public.inventory i WHERE i.id = inventory_id AND public.can_edit_farm(i.farm_id)));

DO $$
DECLARE
    t TEXT;
BEGIN
    FOREACH t IN ARRAY ARRAY['livestock_health_records', 'livestock_production'] LOOP
        EXECUTE format('DROP POLICY IF EXISTS "View %1$s" ON public.%1$I', t);
        EXECUTE format(
            'CREATE POLICY "View %1$s" ON public.%1$I FOR SELECT USING (EXISTS (SELECT 1 FROM public.livestock l WHERE l.id = livestock_id AND public.can_access_farm(l.farm_id)))', t);
        EXECUTE format('DROP POLICY IF EXISTS "Manage %1$s" ON public.%1$I', t);
        EXECUTE format(
            'CREATE POLICY "Manage %1$s" ON public.%1$I FOR ALL USING (EXISTS (SELECT 1 FROM public.livestock l WHERE l.id = livestock_id AND public.can_edit_farm(l.farm_id))) WITH CHECK (EXISTS (SELECT 1 FROM public.livestock l WHERE l.id = livestock_id AND public.can_edit_farm(l.farm_id)))', t);
    END LOOP;
END $$;

-- Telemetry: readable by farm members; written only by the ingest-telemetry
-- edge function, which uses the service role and bypasses RLS.
DROP POLICY IF EXISTS "View telemetry" ON public.telemetry;
CREATE POLICY "View telemetry" ON public.telemetry FOR SELECT
    USING (EXISTS (SELECT 1 FROM public.devices d WHERE d.id = device_id AND public.can_access_farm(d.farm_id)));

DROP POLICY IF EXISTS "View insurance claims" ON public.insurance_claims;
CREATE POLICY "View insurance claims" ON public.insurance_claims FOR SELECT
    USING (EXISTS (SELECT 1 FROM public.insurance_policies p WHERE p.id = policy_id AND public.can_access_farm(p.farm_id)));
DROP POLICY IF EXISTS "Manage insurance claims" ON public.insurance_claims;
CREATE POLICY "Manage insurance claims" ON public.insurance_claims FOR ALL
    USING (EXISTS (SELECT 1 FROM public.insurance_policies p WHERE p.id = policy_id AND public.can_edit_farm(p.farm_id, ARRAY['owner', 'admin'])))
    WITH CHECK (EXISTS (SELECT 1 FROM public.insurance_policies p WHERE p.id = policy_id AND public.can_edit_farm(p.farm_id, ARRAY['owner', 'admin'])));

DROP POLICY IF EXISTS "View own payments" ON public.payments;
CREATE POLICY "View own payments" ON public.payments FOR SELECT USING (user_id = auth.uid());
DROP POLICY IF EXISTS "Create own payments" ON public.payments;
CREATE POLICY "Create own payments" ON public.payments FOR INSERT WITH CHECK (user_id = auth.uid());

-- Cooperatives: members read, owners and admins manage ------------------------------
DO $$
DECLARE
    t TEXT;
BEGIN
    FOREACH t IN ARRAY ARRAY['bulk_orders', 'produce_batches'] LOOP
        EXECUTE format('DROP POLICY IF EXISTS "Members view %1$s" ON public.%1$I', t);
        EXECUTE format(
            'CREATE POLICY "Members view %1$s" ON public.%1$I FOR SELECT USING (public.is_org_member(organization_id))', t);
        EXECUTE format('DROP POLICY IF EXISTS "Admins manage %1$s" ON public.%1$I', t);
        EXECUTE format(
            'CREATE POLICY "Admins manage %1$s" ON public.%1$I FOR ALL USING (public.is_org_member(organization_id, ARRAY[''owner'', ''admin''])) WITH CHECK (public.is_org_member(organization_id, ARRAY[''owner'', ''admin'']))', t);
    END LOOP;
END $$;

DROP POLICY IF EXISTS "Members view bulk order items" ON public.bulk_order_items;
CREATE POLICY "Members view bulk order items" ON public.bulk_order_items FOR SELECT
    USING (EXISTS (SELECT 1 FROM public.bulk_orders b WHERE b.id = bulk_order_id AND public.is_org_member(b.organization_id)));
DROP POLICY IF EXISTS "Admins manage bulk order items" ON public.bulk_order_items;
CREATE POLICY "Admins manage bulk order items" ON public.bulk_order_items FOR ALL
    USING (EXISTS (SELECT 1 FROM public.bulk_orders b WHERE b.id = bulk_order_id AND public.is_org_member(b.organization_id, ARRAY['owner', 'admin'])))
    WITH CHECK (EXISTS (SELECT 1 FROM public.bulk_orders b WHERE b.id = bulk_order_id AND public.is_org_member(b.organization_id, ARRAY['owner', 'admin'])));

DROP POLICY IF EXISTS "View member orders" ON public.member_orders;
CREATE POLICY "View member orders" ON public.member_orders FOR SELECT
    USING (
        user_id = auth.uid()
        OR EXISTS (SELECT 1 FROM public.bulk_orders b WHERE b.id = bulk_order_id AND public.is_org_member(b.organization_id, ARRAY['owner', 'admin']))
    );
DROP POLICY IF EXISTS "Members commit to orders" ON public.member_orders;
CREATE POLICY "Members commit to orders" ON public.member_orders FOR INSERT
    WITH CHECK (
        user_id = auth.uid()
        AND EXISTS (SELECT 1 FROM public.bulk_orders b WHERE b.id = bulk_order_id AND b.status = 'open' AND public.is_org_member(b.organization_id))
    );
DROP POLICY IF EXISTS "Members update own orders" ON public.member_orders;
CREATE POLICY "Members update own orders" ON public.member_orders FOR UPDATE USING (user_id = auth.uid());
DROP POLICY IF EXISTS "Members withdraw own orders" ON public.member_orders;
CREATE POLICY "Members withdraw own orders" ON public.member_orders FOR DELETE USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Members view batch contributions" ON public.batch_contributions;
CREATE POLICY "Members view batch contributions" ON public.batch_contributions FOR SELECT
    USING (EXISTS (SELECT 1 FROM public.produce_batches pb WHERE pb.id = batch_id AND public.is_org_member(pb.organization_id)));
DROP POLICY IF EXISTS "Editors add batch contributions" ON public.batch_contributions;
CREATE POLICY "Editors add batch contributions" ON public.batch_contributions FOR INSERT
    WITH CHECK (EXISTS (SELECT 1 FROM public.produce_batches pb WHERE pb.id = batch_id AND public.is_org_member(pb.organization_id, ARRAY['owner', 'admin', 'editor'])));


-- -----------------------------------------------------------------------------
-- 6. Reference data
-- -----------------------------------------------------------------------------
INSERT INTO public.livestock_types (name, category) VALUES
    ('Cattle', 'large'),
    ('Buffalo', 'large'),
    ('Goat', 'small'),
    ('Sheep', 'small'),
    ('Pig', 'medium'),
    ('Chicken', 'poultry'),
    ('Duck', 'poultry'),
    ('Horse', 'large')
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.inventory_categories (name, type) VALUES
    ('Seeds', 'input'),
    ('Fertilizers', 'input'),
    ('Pesticides', 'input'),
    ('Animal Feed', 'input'),
    ('Fuel', 'consumable'),
    ('Tools', 'equipment'),
    ('Spare Parts', 'equipment'),
    ('Harvested Produce', 'output')
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.financial_categories (name, type)
SELECT v.name, v.type
FROM (VALUES
    ('Crop Sales', 'income'),
    ('Livestock Sales', 'income'),
    ('Subsidies & Grants', 'income'),
    ('Other Income', 'income'),
    ('Seeds', 'expense'),
    ('Fertilizers', 'expense'),
    ('Pesticides', 'expense'),
    ('Labor', 'expense'),
    ('Fuel', 'expense'),
    ('Equipment & Repairs', 'expense'),
    ('Irrigation', 'expense'),
    ('Animal Feed', 'expense'),
    ('Veterinary', 'expense'),
    ('Other Expenses', 'expense')
) AS v(name, type)
WHERE NOT EXISTS (
    SELECT 1 FROM public.financial_categories fc WHERE fc.name = v.name AND fc.user_id IS NULL
);

INSERT INTO public.expert_tips (title, content, category, is_verified)
SELECT v.title, v.content, v.category, true
FROM (VALUES
    ('Crop Rotation Basics',
     'Rotating crops helps prevent soil depletion and reduces pest problems. Avoid planting the same crop family in the same spot for at least three years.',
     'crop'),
    ('Water Conservation',
     'Drip irrigation can use up to 60% less water than flood irrigation. A rainwater harvesting system can supplement supply in dry months.',
     'general'),
    ('Pre-season Equipment Checks',
     'Inspect belts, filters and tyre pressure before each season. Most breakdowns during harvest are caused by issues visible in a ten minute check.',
     'equipment')
) AS v(title, content, category)
WHERE NOT EXISTS (SELECT 1 FROM public.expert_tips e WHERE e.title = v.title);
