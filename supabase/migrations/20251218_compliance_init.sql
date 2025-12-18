
-- Compliance Standards Table
CREATE TABLE IF NOT EXISTS public.compliance_standards (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    version TEXT,
    authority TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Compliance Rules Table
CREATE TABLE IF NOT EXISTS public.compliance_rules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    standard_id UUID REFERENCES public.compliance_standards(id) ON DELETE CASCADE NOT NULL,
    category TEXT NOT NULL,
    rule_description TEXT NOT NULL,
    validation_logic JSONB NOT NULL,
    severity TEXT CHECK (severity IN ('critical', 'major', 'minor')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Farm Subscriptions Table
CREATE TABLE IF NOT EXISTS public.farm_subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    farm_id UUID REFERENCES public.farms(id) ON DELETE CASCADE NOT NULL,
    standard_id UUID REFERENCES public.compliance_standards(id) ON DELETE CASCADE NOT NULL,
    status TEXT CHECK (status IN ('active', 'suspended')) DEFAULT 'active',
    start_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(farm_id, standard_id)
);

-- Compliance Audits Table
CREATE TABLE IF NOT EXISTS public.compliance_audits (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    farm_id UUID REFERENCES public.farms(id) ON DELETE CASCADE NOT NULL,
    severity_score INT DEFAULT 0,
    generated_at TIMESTAMPTZ DEFAULT NOW(),
    results JSONB NOT NULL
);

-- Enable RLS
ALTER TABLE public.compliance_standards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compliance_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.farm_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compliance_audits ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Standards & Rules: Public read access
CREATE POLICY "Public read standards" ON public.compliance_standards FOR SELECT USING (true);
CREATE POLICY "Public read rules" ON public.compliance_rules FOR SELECT USING (true);

-- Subscriptions: Farm owners manage
CREATE POLICY "Manage subscriptions" 
ON public.farm_subscriptions FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM public.farms 
        WHERE id = farm_subscriptions.farm_id 
        AND auth.uid() = user_id
    )
);

-- Audits: Farm owners view
CREATE POLICY "View audits" 
ON public.compliance_audits FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.farms 
        WHERE id = compliance_audits.farm_id 
        AND auth.uid() = user_id
    )
);

-- Seed Data: Demo Organic Standard
INSERT INTO public.compliance_standards (name, description, version, authority)
VALUES ('Demo Organic', 'Basic organic certification for demonstration purposes', 'v1.0', 'FarmSync Authority');

-- Seed Data: Sample Rules
DO $$
DECLARE
    std_id UUID;
BEGIN
    SELECT id INTO std_id FROM public.compliance_standards WHERE name = 'Demo Organic' LIMIT 1;
    
    IF std_id IS NOT NULL THEN
        INSERT INTO public.compliance_rules (standard_id, category, rule_description, validation_logic, severity)
        VALUES 
            (std_id, 'Inputs', 'No Synthetic Pesticides', '{"banned": ["Glyphosate", "Atrazine"]}', 'critical'),
            (std_id, 'Soil', 'Maintain Buffer Zone', '{"min_buffer_meters": 10}', 'major');
    END IF;
END $$;
