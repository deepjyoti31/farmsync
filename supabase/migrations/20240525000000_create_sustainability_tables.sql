-- Create sustainability_logs table
CREATE TABLE IF NOT EXISTS public.sustainability_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    field_id UUID REFERENCES public.fields(id) ON DELETE CASCADE,
    log_date DATE DEFAULT CURRENT_DATE NOT NULL,
    type TEXT NOT NULL, -- 'fertilizer', 'pesticide', 'herbicide', 'fungicide', 'other'
    product_name TEXT NOT NULL,
    quantity DECIMAL(10, 2) NOT NULL,
    unit TEXT NOT NULL,
    method TEXT, -- 'spraying', 'broadcasting', etc.
    notes TEXT
);

-- Create water_usage table
CREATE TABLE IF NOT EXISTS public.water_usage (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    field_id UUID REFERENCES public.fields(id) ON DELETE CASCADE,
    usage_date DATE DEFAULT CURRENT_DATE NOT NULL,
    volume DECIMAL(10, 2) NOT NULL,
    unit TEXT NOT NULL, -- 'liters', 'gallons', 'm3'
    source TEXT -- 'well', 'rainwater', 'municipal', 'canal'
);

-- Enable RLS
ALTER TABLE public.sustainability_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.water_usage ENABLE ROW LEVEL SECURITY;

-- Policies for sustainability_logs
CREATE POLICY "Users can view logs for their farms" ON public.sustainability_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.fields
            JOIN public.farms ON public.farms.id = public.fields.farm_id
            WHERE public.fields.id = public.sustainability_logs.field_id
            AND public.farms.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert logs for their farms" ON public.sustainability_logs
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.fields
            JOIN public.farms ON public.farms.id = public.fields.farm_id
            WHERE public.fields.id = public.sustainability_logs.field_id
            AND public.farms.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update logs for their farms" ON public.sustainability_logs
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.fields
            JOIN public.farms ON public.farms.id = public.fields.farm_id
            WHERE public.fields.id = public.sustainability_logs.field_id
            AND public.farms.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete logs for their farms" ON public.sustainability_logs
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.fields
            JOIN public.farms ON public.farms.id = public.fields.farm_id
            WHERE public.fields.id = public.sustainability_logs.field_id
            AND public.farms.user_id = auth.uid()
        )
    );

-- Policies for water_usage
CREATE POLICY "Users can view water usage for their farms" ON public.water_usage
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.fields
            JOIN public.farms ON public.farms.id = public.fields.farm_id
            WHERE public.fields.id = public.water_usage.field_id
            AND public.farms.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert water usage for their farms" ON public.water_usage
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.fields
            JOIN public.farms ON public.farms.id = public.fields.farm_id
            WHERE public.fields.id = public.water_usage.field_id
            AND public.farms.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update water usage for their farms" ON public.water_usage
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.fields
            JOIN public.farms ON public.farms.id = public.fields.farm_id
            WHERE public.fields.id = public.water_usage.field_id
            AND public.farms.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete water usage for their farms" ON public.water_usage
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.fields
            JOIN public.farms ON public.farms.id = public.fields.farm_id
            WHERE public.fields.id = public.water_usage.field_id
            AND public.farms.user_id = auth.uid()
        )
    );

-- Indexes
CREATE INDEX IF NOT EXISTS idx_sustainability_logs_field_id ON public.sustainability_logs(field_id);
CREATE INDEX IF NOT EXISTS idx_water_usage_field_id ON public.water_usage(field_id);
