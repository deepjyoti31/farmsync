-- Part 8: Repeating tasks keep their day of the month
--
-- A monthly task due on the 31st moved to the 28th in February and then stayed
-- on the 28th for good, because each occurrence was computed only from the one
-- before it. recurrence_day remembers the day the series aims for whenever a
-- short month moves an occurrence earlier, so March goes back to the 31st.
-- NULL means "the day of due_date", which covers every existing task.
--
-- Idempotent: safe to re-run.

ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS recurrence_day SMALLINT;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tasks_recurrence_day_check') THEN
        ALTER TABLE public.tasks ADD CONSTRAINT tasks_recurrence_day_check
            CHECK (recurrence_day IS NULL OR recurrence_day BETWEEN 1 AND 31);
    END IF;
END $$;
