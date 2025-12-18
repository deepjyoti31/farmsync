-- Part 3: Security & Data
-- This file enables Row Level Security (RLS) policies, Triggers, and Seed Data.

-- -----------------------------------------------------------------------------
-- 1. Triggers & Functions
-- -----------------------------------------------------------------------------

-- Function to handle 'updated_at' column updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to relevant tables
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON public.organizations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_farms_updated_at BEFORE UPDATE ON public.farms FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_fields_updated_at BEFORE UPDATE ON public.fields FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_crops_updated_at BEFORE UPDATE ON public.crops FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_field_crops_updated_at BEFORE UPDATE ON public.field_crops FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_equipment_updated_at BEFORE UPDATE ON public.equipment FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_financial_categories_updated_at BEFORE UPDATE ON public.financial_categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_financial_transactions_updated_at BEFORE UPDATE ON public.financial_transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_forums_updated_at BEFORE UPDATE ON public.forums FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_forum_posts_updated_at BEFORE UPDATE ON public.forum_posts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_post_comments_updated_at BEFORE UPDATE ON public.post_comments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_testimonials_updated_at BEFORE UPDATE ON public.testimonials FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_app_screenshots_updated_at BEFORE UPDATE ON public.app_screenshots FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_market_data_updated_at BEFORE UPDATE ON public.market_data FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to auto-create personal organization for new users (Optional but recommended)
CREATE OR REPLACE FUNCTION migrate_users_to_organizations() RETURNS void AS $$
DECLARE
    user_record RECORD;
    org_id UUID;
BEGIN
    FOR user_record IN SELECT id, email FROM auth.users LOOP
        -- Check if user already has a personal org
        IF NOT EXISTS (
            SELECT 1 FROM public.organizations 
            WHERE owner_id = user_record.id AND is_personal = true
        ) THEN
            -- Create personal org
            INSERT INTO public.organizations (name, owner_id, is_personal)
            VALUES ('Personal Workspace', user_record.id, true)
            RETURNING id INTO org_id;

            -- Add user as owner member
            INSERT INTO public.organization_members (organization_id, user_id, role)
            VALUES (org_id, user_record.id, 'owner');

            -- Update user's farms
            UPDATE public.farms 
            SET organization_id = org_id 
            WHERE user_id = user_record.id 
            AND organization_id IS NULL;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- -----------------------------------------------------------------------------
-- 2. Row Level Security (RLS) Enablement
-- -----------------------------------------------------------------------------
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.farms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.field_crops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipment_maintenance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.harvests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sustainability_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.water_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.telemetry ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_screenshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compliance_standards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compliance_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.farm_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compliance_audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bulk_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bulk_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.produce_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.batch_contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.insurance_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.insurance_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;


-- -----------------------------------------------------------------------------
-- 3. RLS Policies
-- -----------------------------------------------------------------------------

-- --- Public Read Access ---
CREATE POLICY "Public read standards" ON public.compliance_standards FOR SELECT USING (true);
CREATE POLICY "Public read rules" ON public.compliance_rules FOR SELECT USING (true);
CREATE POLICY "Public read testimonials" ON public.testimonials FOR SELECT USING (true);
CREATE POLICY "Public read screenshots" ON public.app_screenshots FOR SELECT USING (true);
CREATE POLICY "Public read market_data" ON public.market_data FOR SELECT USING (true);
CREATE POLICY "Public read suppliers" ON public.suppliers FOR SELECT USING (true);
CREATE POLICY "Public read active listings" ON public.marketplace_listings FOR SELECT USING (true);
CREATE POLICY "Public read comments" ON public.post_comments FOR SELECT USING (true);
CREATE POLICY "Public read likes" ON public.post_likes FOR SELECT USING (true);

-- --- Organization & Farm Access (Core Logic) ---

-- Helper policy for Farms: Owner OR Org Member
CREATE POLICY "Users view farms" ON public.farms FOR SELECT USING (
    user_id = auth.uid() OR
    EXISTS (
        SELECT 1 FROM public.organization_members 
        WHERE organization_id = farms.organization_id 
        AND user_id = auth.uid()
    )
);

CREATE POLICY "Users update farms" ON public.farms FOR UPDATE USING (
    user_id = auth.uid() OR
    EXISTS (
        SELECT 1 FROM public.organization_members 
        WHERE organization_id = farms.organization_id 
        AND user_id = auth.uid()
        AND role IN ('owner', 'admin')
    )
);

CREATE POLICY "Users insert farms" ON public.farms FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete farms" ON public.farms FOR DELETE USING (user_id = auth.uid()); -- Only owner can delete for now

-- Generic Policy Generator for Farm-Child Tables (Fields, Equipment, etc.)
-- Since we can't write a function to generate policies in SQL standardly in a migration without dynamic SQL,
-- we'll verify ownership via the parent farm relationship.

-- Fields
CREATE POLICY "View fields" ON public.fields FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.farms WHERE id = fields.farm_id AND (user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.organization_members WHERE organization_id = farms.organization_id AND user_id = auth.uid())))
);
CREATE POLICY "Manage fields" ON public.fields FOR ALL USING (
    EXISTS (SELECT 1 FROM public.farms WHERE id = fields.farm_id AND (user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.organization_members WHERE organization_id = farms.organization_id AND user_id = auth.uid() AND role IN ('owner', 'admin', 'editor'))))
);

-- Equipment
CREATE POLICY "View equipment" ON public.equipment FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.farms WHERE id = equipment.farm_id AND (user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.organization_members WHERE organization_id = farms.organization_id AND user_id = auth.uid())))
);
CREATE POLICY "Manage equipment" ON public.equipment FOR ALL USING (
    EXISTS (SELECT 1 FROM public.farms WHERE id = equipment.farm_id AND (user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.organization_members WHERE organization_id = farms.organization_id AND user_id = auth.uid() AND role IN ('owner', 'admin', 'editor'))))
);

-- Financial Transactions
CREATE POLICY "View finance" ON public.financial_transactions FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.farms WHERE id = financial_transactions.farm_id AND (user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.organization_members WHERE organization_id = farms.organization_id AND user_id = auth.uid())))
);
CREATE POLICY "Manage finance" ON public.financial_transactions FOR ALL USING (
    EXISTS (SELECT 1 FROM public.farms WHERE id = financial_transactions.farm_id AND (user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.organization_members WHERE organization_id = farms.organization_id AND user_id = auth.uid() AND role IN ('owner', 'admin'))))
);

-- --- Specific Policies ---
-- Post Comments (User own)
CREATE POLICY "Manage own comments" ON public.post_comments FOR ALL USING (auth.uid() = user_id);

-- Post Likes (User own)
CREATE POLICY "Manage own likes" ON public.post_likes FOR ALL USING (auth.uid() = user_id);

-- Marketplace Listings (Seller own)
CREATE POLICY "Manage own listings" ON public.marketplace_listings FOR ALL USING (auth.uid() = seller_id);

-- Marketplace Inquiries (Buyer or Seller)
CREATE POLICY "View inquiries" ON public.marketplace_inquiries FOR SELECT USING (
    auth.uid() = buyer_id OR 
    EXISTS (SELECT 1 FROM public.marketplace_listings WHERE id = listing_id AND seller_id = auth.uid())
);
CREATE POLICY "Create inquiries" ON public.marketplace_inquiries FOR INSERT WITH CHECK (auth.uid() = buyer_id);
CREATE POLICY "Update inquiries" ON public.marketplace_inquiries FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.marketplace_listings WHERE id = listing_id AND seller_id = auth.uid()) OR auth.uid() = buyer_id
);

-- Profiles
CREATE POLICY "View profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Edit own profile" ON public.profiles FOR UPDATE USING (id = auth.uid());


-- -----------------------------------------------------------------------------
-- 4. Seed Data
-- -----------------------------------------------------------------------------

-- Forums
INSERT INTO public.forums (title, description)
SELECT 'Crop Management', 'Discuss best practices for crop management, planting techniques, and harvest strategies.'
WHERE NOT EXISTS (SELECT 1 FROM public.forums WHERE title = 'Crop Management');

INSERT INTO public.forums (title, description)
SELECT 'Equipment & Technology', 'Share experiences with farm equipment, technology solutions, and automation tools.'
WHERE NOT EXISTS (SELECT 1 FROM public.forums WHERE title = 'Equipment & Technology');

INSERT INTO public.forums (title, description)
SELECT 'Market Insights', 'Discuss market trends, pricing strategies, and selling opportunities for farm products.'
WHERE NOT EXISTS (SELECT 1 FROM public.forums WHERE title = 'Market Insights');

-- Demo App Screenshots
INSERT INTO public.app_screenshots (title, description, image_url, display_order, is_featured)
SELECT 'Dashboard Overview', 'Comprehensive dashboard showing farm status at a glance', '/dashboard-screenshot.jpg', 1, true
WHERE NOT EXISTS (SELECT 1 FROM public.app_screenshots WHERE title = 'Dashboard Overview');

-- Demo Testimonials
INSERT INTO public.testimonials (user_name, role, quote, image_url, rating, is_featured)
SELECT 'Vijay Singh', 'Mixed Farmer, Haryana', 'As a small-scale farmer, I never thought I''d be able to use technology like this. It''s easy and free!', 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6', 5, true
WHERE NOT EXISTS (SELECT 1 FROM public.testimonials WHERE user_name = 'Vijay Singh');

-- Demo Market Data
INSERT INTO public.market_data (crop_name, price_per_unit, unit, market_location, price_date, source)
SELECT 'Rice', 22.50, 'kg', 'National Commodity Exchange', CURRENT_DATE, 'Ministry of Agriculture'
WHERE NOT EXISTS (SELECT 1 FROM public.market_data WHERE crop_name = 'Rice');

-- Demo Suppliers
INSERT INTO public.suppliers (name, category, contact_info, location, description, verified, image_url)
SELECT 'Kisan Agro Center', 'Seeds', '{"phone": "+91-9876543210", "email": "contact@kisanagro.com"}', 'Nashik, Maharashtra', 'Certified supplier of high-yield vegetable seeds and fertilizers.', true, 'https://images.unsplash.com/photo-1563811771046-ba98c66a41f8?q=80&w=1000&auto=format&fit=crop'
WHERE NOT EXISTS (SELECT 1 FROM public.suppliers WHERE name = 'Kisan Agro Center');

-- Demo Compliance Standard
INSERT INTO public.compliance_standards (name, description, version, authority)
SELECT 'Demo Organic', 'Basic organic certification for demonstration purposes', 'v1.0', 'FarmSync Authority'
WHERE NOT EXISTS (SELECT 1 FROM public.compliance_standards WHERE name = 'Demo Organic');

-- Demo Rules (using DO block to find ID)
DO $$
DECLARE
    std_id UUID;
BEGIN
    SELECT id INTO std_id FROM public.compliance_standards WHERE name = 'Demo Organic' LIMIT 1;
    
    IF std_id IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM public.compliance_rules WHERE standard_id = std_id AND rule_description = 'No Synthetic Pesticides') THEN
            INSERT INTO public.compliance_rules (standard_id, category, rule_description, validation_logic, severity)
            VALUES 
                (std_id, 'Inputs', 'No Synthetic Pesticides', '{"banned": ["Glyphosate", "Atrazine"]}', 'critical'),
                (std_id, 'Soil', 'Maintain Buffer Zone', '{"min_buffer_meters": 10}', 'major');
        END IF;
    END IF;
END $$;
