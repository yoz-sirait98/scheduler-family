# Supabase Setup Guide for YJS Scheduler PWA

Follow these quick steps to set up your free Supabase cloud database:

### 1. Create a Supabase Project
1. Log in to [Supabase](https://supabase.com/).
2. Click **New Project**, select an organization, name it `yjs-scheduler`, set a secure database password, and select your preferred region (e.g. `Southeast Asia (Singapore)`).

### 2. Run Database Schema & Security Policies
1. In your project dashboard, navigate to the **SQL Editor** in the left navigation sidebar.
2. Click **New Query** (or the `+` button).
3. Open [`supabase/schema.sql`](./schema.sql), copy the entire SQL script, and paste it into the SQL Editor.
4. Click the **Run** button (or press `Ctrl+Enter`).
5. You should see `Success. No rows returned`.

### 3. Enable Email Authentication
1. Go to **Authentication** -> **Providers** -> **Email**.
2. Ensure **Email provider** is enabled.
3. (Optional for development) Disable *Confirm email* under Auth Settings if you want instant logins without clicking confirmation links during testing.

### 4. Copy API Keys to Your Application
1. Go to **Project Settings** (gear icon) -> **API**.
2. Find the **Project URL** and copy it.
3. Find the **Project API keys** -> `anon` (public key) and copy it.
4. Open or create `.env` in the root of the project:
   ```bash
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6...
   ```

### 5. Local Offline Fallback
- If no `.env` credentials are provided or if you are offline, **YJS Scheduler** will automatically use **Dexie (IndexedDB)** for local persistence and seamlessly queue all changes for later synchronization.
