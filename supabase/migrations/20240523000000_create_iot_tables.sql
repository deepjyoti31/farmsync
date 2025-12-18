-- Create devices table
CREATE TABLE IF NOT EXISTS public.devices (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    farm_id UUID REFERENCES public.farms(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL, -- 'weather_station', 'soil_sensor', 'drone', 'generic'
    external_id TEXT, -- Hardware serial number
    api_key TEXT NOT NULL, -- Hashed or direct API key for the device
    configuration JSONB DEFAULT '{}'::jsonb,
    is_active BOOLEAN DEFAULT true
);

-- Enable RLS on devices
ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;

-- Policies for devices
CREATE POLICY "Users can view devices for their farms" ON public.devices
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.farms
            WHERE public.farms.id = public.devices.farm_id
            AND public.farms.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert devices for their farms" ON public.devices
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.farms
            WHERE public.farms.id = public.devices.farm_id
            AND public.farms.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update devices for their farms" ON public.devices
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.farms
            WHERE public.farms.id = public.devices.farm_id
            AND public.farms.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete devices for their farms" ON public.devices
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.farms
            WHERE public.farms.id = public.devices.farm_id
            AND public.farms.user_id = auth.uid()
        )
    );

-- Create telemetry table
CREATE TABLE IF NOT EXISTS public.telemetry (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    device_id UUID REFERENCES public.devices(id) ON DELETE CASCADE NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    data JSONB NOT NULL,
    type TEXT -- 'interval_reading', 'alert', etc.
);

-- Enable RLS on telemetry
ALTER TABLE public.telemetry ENABLE ROW LEVEL SECURITY;

-- Policies for telemetry
CREATE POLICY "Users can view telemetry for their devices" ON public.telemetry
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.devices
            JOIN public.farms ON public.farms.id = public.devices.farm_id
            WHERE public.devices.id = public.telemetry.device_id
            AND public.farms.user_id = auth.uid()
        )
    );

-- Allow Edge Functions (service role) to insert telemetry
-- Note: Service role bypasses RLS, but if we wanted to be explicit:
-- CREATE POLICY "Service role can insert telemetry" ON public.telemetry FOR INSERT WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_devices_farm_id ON public.devices(farm_id);
CREATE INDEX IF NOT EXISTS idx_telemetry_device_id ON public.telemetry(device_id);
CREATE INDEX IF NOT EXISTS idx_telemetry_timestamp ON public.telemetry(timestamp DESC);
