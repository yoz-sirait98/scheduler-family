# YJS Scheduler — Personal & Family Task Scheduler PWA

A modern, mobile-first, offline-first personal and family task scheduler Progressive Web App (PWA) built with **Vue 3**, **TypeScript**, **Vite**, **Tailwind CSS**, **Pinia**, **Dexie.js (IndexedDB)**, and **Supabase**.

Deployed to **[yjsfinance.web.id](https://yjsfinance.web.id)** via GitHub Pages.

---

## ✨ Features

- 📱 **Magical Mobile Experience**: Ergonomic bottom navigation, safe-area inset support (`viewport-fit=cover`), touch-friendly swipe sheets, and fast 1-tap completion checkboxes.
- ⚡ **Offline-First Storage**: Instant local CRUD using Dexie.js (IndexedDB) with no lag or network dependency.
- 🔄 **Cloud Synchronization**: Automatic background sync queue with Supabase PostgreSQL and Last-Write-Wins conflict resolution.
- 👨‍👩‍👧‍👦 **Family & Personal Context**: Seeded with family-centric categories (Family & Kids, Home & Chores, Work, Finance, Health & Medical, Personal).
- 📅 **Rich Calendar Views**:
  - **Day View**: 24-hour timeline with clickable empty slots to quickly schedule events.
  - **Week View**: 7-day mobile strip with day-by-day task lists.
  - **Month View**: Grid calendar with colored category dots.
  - **Agenda View**: Chronological list grouped by date.
- ⏰ **Reminders & Web Audio Alarm**:
  - Browser Notifications (Notification API & Service Worker).
  - Harmonic synthesized audio chimes generated via Web Audio API (zero audio file downloads required).
  - In-app active Alarm Modal with **STOP** and **SNOOZE (5m / 10m)** controls.
- 🔒 **Row Level Security (RLS)**: PostgreSQL database tables are locked down so users only access their own family data.
- 📦 **Installable PWA**: Standalone app experience on iOS, Android, and Desktop with offline caching.

---

## 🛠️ Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Framework** | Vue 3 (Composition API `<script setup>`) + TypeScript |
| **Build Tool** | Vite 6 |
| **Styling** | Tailwind CSS + Lucide Icons |
| **State & Routing** | Pinia + Vue Router 4 (Hash history for static GitHub Pages) |
| **Local Database** | Dexie.js (IndexedDB wrapper) |
| **Cloud Backend** | Supabase (PostgreSQL, Auth, RLS) |
| **PWA & Cache** | `vite-plugin-pwa` + Workbox |
| **Audio** | Web Audio API |
| **Testing** | Vitest |

---

## 🚀 Quick Start (Local Development)

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment (Optional)
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
*(If left empty, the app runs seamlessly in local Dexie IndexedDB mode without requiring immediate Supabase setup).*

### 3. Run Development Server
```bash
npm run dev
```
Open `http://localhost:3000` in your browser or mobile device.

### 4. Run Tests & Type Checking
```bash
npm run test
npm run type-check
```

### 5. Build for Production
```bash
npm run build
```

---

## 🗄️ Supabase Cloud Database Setup

Because Supabase is configured via the web dashboard, complete SQL setup files are provided:

1. Open your [Supabase Project Dashboard](https://supabase.com/dashboard).
2. Go to the **SQL Editor** tab.
3. Copy and paste the full script from [`supabase/schema.sql`](./supabase/schema.sql).
4. Click **Run**.
5. Copy your **Project URL** and **anon public key** from Project Settings -> API into your `.env` file or GitHub repository secrets.

For more details, see [`supabase/README.md`](./supabase/README.md).

---

## 🌐 GitHub Pages & Custom Domain Deployment

This repository includes a GitHub Actions workflow in [`.github/workflows/deploy.yml`](./.github/workflows/deploy.yml).

### Setting up `yjsfinance.web.id`:
1. In your GitHub repository: **Settings** -> **Pages** -> Source: **GitHub Actions**.
2. Add Custom Domain: `yjsfinance.web.id`.
3. Add Repository Secrets (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`).
4. On push to `main`, the app automatically tests, builds, and deploys to GitHub Pages!

See [`docs/deployment.md`](./docs/deployment.md) for DNS details.

---

## 📚 Documentation Index

- [Architecture & Data Flow](docs/architecture.md)
- [Database Schema & RLS Policies](docs/database.md)
- [Notifications & Alarm Limitations](docs/notifications.md)
- [Deployment & Custom Domain](docs/deployment.md)
- [Future Roadmap](docs/roadmap.md)

---

## 📄 License
MIT License
