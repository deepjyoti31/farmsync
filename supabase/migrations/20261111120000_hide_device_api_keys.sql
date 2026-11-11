-- Part 9: Device API keys are write-only for app users
--
-- Every member of a farm, viewers included, could read the API keys of its
-- devices straight from the devices table, and with a key anyone can post
-- readings as that device. The app only ever shows a key once, when the device
-- is registered, and the ingest-telemetry function reads keys with the service
-- role, so signed-in users do not need to read the column at all.
--
-- Column privileges do this: SELECT is granted on every column except api_key.
-- Inserting a device (with its key) and updating or deleting one are unchanged
-- and still governed by row level security.
--
-- Idempotent: safe to re-run.

REVOKE SELECT ON public.devices FROM anon, authenticated;
GRANT SELECT (id, created_at, farm_id, name, type, external_id, configuration, is_active)
    ON public.devices TO authenticated;

-- ingest-telemetry looks a device up by its key on every reading.
CREATE INDEX IF NOT EXISTS idx_devices_api_key ON public.devices(api_key);
