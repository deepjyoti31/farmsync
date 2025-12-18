-- Create harvests table
CREATE TABLE IF NOT EXISTS public.harvests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    field_crop_id UUID REFERENCES public.field_crops(id) ON DELETE CASCADE NOT NULL,
    harvest_date DATE DEFAULT CURRENT_DATE NOT NULL,
    quantity DECIMAL(10, 2) NOT NULL, -- The amount harvested
    unit TEXT NOT NULL, -- e.g., 'kg', 'tons', 'bushels'
    quality_rating INTEGER CHECK (quality_rating >= 1 AND quality_rating <= 5), -- 1-5 Scale
    notes TEXT,
    revenue DECIMAL(10, 2) -- Optional revenue from this specific harvest batch
);

-- Enable RLS on harvests
ALTER TABLE public.harvests ENABLE ROW LEVEL SECURITY;

-- Policies for harvests
-- Users can view harvests if they own the farm the crop belongs to
CREATE POLICY "Users can view harvests for their crops" ON public.harvests
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.field_crops
            JOIN public.fields ON public.fields.id = public.field_crops.field_id
            JOIN public.farms ON public.farms.id = public.fields.farm_id
            WHERE public.field_crops.id = public.harvests.field_crop_id
            AND public.farms.user_id = auth.uid()
        )
    );

-- Users can insert harvests if they own the farm
CREATE POLICY "Users can insert harvests for their crops" ON public.harvests
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.field_crops
            JOIN public.fields ON public.fields.id = public.field_crops.field_id
            JOIN public.farms ON public.farms.id = public.fields.farm_id
            WHERE public.field_crops.id = public.harvests.field_crop_id
            AND public.farms.user_id = auth.uid()
        )
    );

-- Users can update harvests if they own the farm
CREATE POLICY "Users can update harvests for their crops" ON public.harvests
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.field_crops
            JOIN public.fields ON public.fields.id = public.field_crops.field_id
            JOIN public.farms ON public.farms.id = public.fields.farm_id
            WHERE public.field_crops.id = public.harvests.field_crop_id
            AND public.farms.user_id = auth.uid()
        )
    );

-- Users can delete harvests if they own the farm
CREATE POLICY "Users can delete harvests for their crops" ON public.harvests
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.field_crops
            JOIN public.fields ON public.fields.id = public.field_crops.field_id
            JOIN public.farms ON public.farms.id = public.fields.farm_id
            WHERE public.field_crops.id = public.harvests.field_crop_id
            AND public.farms.user_id = auth.uid()
        )
    );

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_harvests_field_crop_id ON public.harvests(field_crop_id);
CREATE INDEX IF NOT EXISTS idx_harvests_date ON public.harvests(harvest_date);
