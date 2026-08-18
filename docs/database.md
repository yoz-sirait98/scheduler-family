# YJS Scheduler — Database Documentation

## 1. Local Storage Schema (Dexie IndexedDB)

Database Name: `YjsSchedulerDB`

### Tables:
1. **`tasks`**: Stores task records locally.
   - Primary Key: `id` (UUID string)
   - Indexed fields: `task_date`, `status`, `priority`, `category_id`, `updated_at`, `user_id`, `is_deleted`, `external_event_id`, `external_provider`
   - Additional fields: `external_calendar_id`, `external_event_link`, `external_synced_at`
2. **`categories`**: Stores family & personal categories.
   - Primary Key: `id` (UUID string)
   - Indexed fields: `user_id`, `name`, `is_default`, `updated_at`
3. **`reminders`**: Stores scheduled reminders.
   - Primary Key: `id`
   - Indexed fields: `task_id`, `user_id`, `minutes_before`, `is_enabled`, `is_triggered`
4. **`syncQueue`**: Stores queued mutations to be pushed to Supabase.
   - Primary Key: `id`
   - Fields: `entity`, `action` ('create' | 'update' | 'delete'), `record_id`, `payload`, `timestamp`, `retries`, `last_error`
5. **`settings`**: Key-value pairs for local preferences (e.g. `lastSyncedAt`, `theme`).

---

## 2. Cloud Database Schema (Supabase PostgreSQL)

Full schema is defined in [`supabase/schema.sql`](../supabase/schema.sql).

### Tables:
- `public.profiles`: User profile data connected to `auth.users(id)`.
- `public.categories`: User categories with icons, colors, and default flags.
- `public.tasks`: Scheduled personal/family tasks with dates, times, priority, and status.
- `public.task_reminders`: Reminder schedules per task.
- `public.task_recurrences`: Recurrence patterns (daily, weekly, monthly, yearly).

### Row Level Security (RLS) Policies
Every table is locked down with Row Level Security:
- `SELECT`, `INSERT`, `UPDATE`, `DELETE` are restricted strictly to `auth.uid() = user_id`.

### Automated Triggers
- `handle_new_user`: On user registration in Supabase Auth, automatically inserts a `profiles` record and seeds 6 default family/personal categories:
  - 👨‍👩‍👧‍👦 Family & Kids (`#ec4899`)
  - 🏠 Home & Chores (`#10b981`)
  - 💼 Work (`#3b82f6`)
  - 💰 Finance (`#f59e0b`)
  - 🏥 Health & Medical (`#ef4444`)
  - 🌟 Personal (`#8b5cf6`)
