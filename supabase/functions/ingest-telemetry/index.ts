import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        // Get API Key from header
        const deviceApiKey = req.headers.get('x-device-api-key')

        if (!deviceApiKey) {
            return new Response(
                JSON.stringify({ error: 'Missing device API key' }),
                { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // Find device by API key
        const { data: device, error: deviceError } = await supabaseClient
            .from('devices')
            .select('id, farm_id')
            .eq('api_key', deviceApiKey)
            .single()

        if (deviceError || !device) {
            return new Response(
                JSON.stringify({ error: 'Invalid API key or device not found' }),
                { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // Parse body
        const payload = await req.json()

        // Insert telemetry
        const { error: insertError } = await supabaseClient
            .from('telemetry')
            .insert({
                device_id: device.id,
                data: payload,
                timestamp: new Date().toISOString(),
                type: payload.type || 'interval_reading'
            })

        if (insertError) {
            throw insertError
        }

        return new Response(
            JSON.stringify({ success: true, message: 'Telemetry received' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
})
