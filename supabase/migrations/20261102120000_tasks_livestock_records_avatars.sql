-- Part 6: Task manager, livestock records and profile pictures
--
-- 1. tasks: repeating tasks and completion time
-- 2. livestock_health_records: next due date for vaccination and treatment reminders
-- 3. livestock_production: allow herd/flock level entries (e.g. a day's eggs) by
--    recording the farm directly; livestock_id becomes optional
-- 4. Storage bucket for profile pictures, writable only inside the user's own folder
--
-- Idempotent: safe to re-run.

-- -----------------------------------------------------------------------------
-- 1. Tasks
-- -----------------------------------------------------------------------------
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS recurrence TEXT NOT NULL DEFAULT 'none';
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tasks_recurrence_check') THEN
        ALTER TABLE public.tasks ADD CONSTRAINT tasks_recurrence_check
            CHECK (recurrence IN ('none', 'daily', 'weekly', 'monthly', 'yearly'));
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON public.tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);

-- -----------------------------------------------------------------------------
-- 2. Livestock health records
-- -----------------------------------------------------------------------------
ALTER TABLE public.livestock_health_records ADD COLUMN IF NOT EXISTS next_due_date DATE;
CREATE INDEX IF NOT EXISTS idx_livestock_health_next_due ON public.livestock_health_records(next_due_date);

-- -----------------------------------------------------------------------------
-- 3. Livestock production: farm-level entries
-- -----------------------------------------------------------------------------
ALTER TABLE public.livestock_production
    ADD COLUMN IF NOT EXISTS farm_id UUID REFERENCES public.farms(id) ON DELETE CASCADE;

UPDATE public.livestock_production p
SET farm_id = l.farm_id
FROM public.livestock l
WHERE p.livestock_id = l.id AND p.farm_id IS NULL;

ALTER TABLE public.livestock_production ALTER COLUMN livestock_id DROP NOT NULL;

-- Keep farm_id filled in when an entry is recorded against a single animal,
-- so access checks only ever need farm_id.
CREATE OR REPLACE FUNCTION public.set_livestock_production_farm()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
    IF NEW.livestock_id IS NOT NULL THEN
        SELECT farm_id INTO NEW.farm_id FROM public.livestock WHERE id = NEW.livestock_id;
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_livestock_production_farm ON public.livestock_production;
CREATE TRIGGER set_livestock_production_farm
    BEFORE INSERT OR UPDATE OF livestock_id, farm_id ON public.livestock_production
    FOR EACH ROW EXECUTE FUNCTION public.set_livestock_production_farm();

ALTER TABLE public.livestock_production ALTER COLUMN farm_id SET NOT NULL;
CREATE INDEX IF NOT EXISTS idx_livestock_production_farm_date
    ON public.livestock_production(farm_id, production_date);

DROP POLICY IF EXISTS "View livestock_production" ON public.livestock_production;
CREATE POLICY "View livestock_production" ON public.livestock_production FOR SELECT
    USING (public.can_access_farm(farm_id));
DROP POLICY IF EXISTS "Manage livestock_production" ON public.livestock_production;
CREATE POLICY "Manage livestock_production" ON public.livestock_production FOR ALL
    USING (public.can_edit_farm(farm_id))
    WITH CHECK (public.can_edit_farm(farm_id));

-- -----------------------------------------------------------------------------
-- 4. Profile pictures
-- -----------------------------------------------------------------------------
-- Public bucket: anyone with the URL can view an avatar (they appear on forum
-- posts). Uploads are limited to 2 MB images inside the user's own folder:
-- avatars/<user-id>/<file>.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('avatars', 'avatars', true, 2097152, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO UPDATE SET
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Users read own avatar files" ON storage.objects;
CREATE POLICY "Users read own avatar files" ON storage.objects FOR SELECT TO authenticated
    USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Users upload own avatar" ON storage.objects;
CREATE POLICY "Users upload own avatar" ON storage.objects FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Users update own avatar" ON storage.objects;
CREATE POLICY "Users update own avatar" ON storage.objects FOR UPDATE TO authenticated
    USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Users delete own avatar" ON storage.objects;
CREATE POLICY "Users delete own avatar" ON storage.objects FOR DELETE TO authenticated
    USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
