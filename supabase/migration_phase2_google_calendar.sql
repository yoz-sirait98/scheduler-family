-- ==============================================================================
-- YJS Scheduler — Phase 2: Google Calendar Integration SQL Migration
-- ==============================================================================
-- Run this script in your Supabase Dashboard -> SQL Editor to upgrade an existing
-- tasks table with Google Calendar sync columns and performance index.
-- ==============================================================================

-- 1. Add Google Calendar Synchronization Columns to tasks table
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS external_provider TEXT;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS external_calendar_id TEXT;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS external_event_id TEXT;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS external_event_link TEXT;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS external_synced_at TIMESTAMPTZ;

-- 2. Create index on external_event_id for fast lookup during 2-way sync
CREATE INDEX IF NOT EXISTS idx_tasks_external_event_id ON public.tasks(external_event_id);
