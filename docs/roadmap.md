# YJS Scheduler — Future Roadmap

## Completed in MVP (Phase 1)
- [x] Vue 3, Vite, TypeScript, Tailwind CSS, Pinia, Dexie (IndexedDB), and Supabase foundation.
- [x] Offline-First task storage and automatic sync queue.
- [x] Standalone Supabase SQL schema (`supabase/schema.sql`) with RLS policies and family default seed triggers.
- [x] Full mobile-first ergonomics: bottom navigation bar, safe-area insets, bottom sheets, 1-tap completion checkboxes.
- [x] Calendar views: Day View (with hourly timeline and quick-add slots), Week View, Month View, Agenda View.
- [x] Reminders & Alarm system with Web Audio API chime synthesis, Web Notifications, Stop and 5m/10m Snooze.
- [x] PWA manifest, service worker caching, and GitHub Pages deployment workflow.

## Phase 2: Google Calendar Integration (Completed)
- [x] Connect Google Calendar via OAuth2 (Google Identity Services GIS token flow with custom Client ID & Demo Simulator).
- [x] Two-way event synchronization with Last-Write-Wins (LWW) conflict resolution between Dexie/Supabase and Google Calendar.
- [x] Direct export of YJS tasks to Google Calendar (1-click web render URL, Google Calendar REST API, and RFC-5545 `.ics` export).

## Phase 3: Advanced Recurrence & Web Push
- [ ] Complex recurrence rules (e.g. "every 2nd Tuesday of the month", "every weekday").
- [ ] Web Push Server integration using VAPID keys for remote background triggers.
- [ ] Notification history log.

## Phase 4: AI & Natural Language Scheduling
- [ ] Natural language task input parser (e.g. *"Doctor appointment tomorrow at 10 AM with reminder 15m"*).
- [ ] Smart conflict detection.

## Phase 5: Capacitor Native Mobile Wrapper
- [ ] Wrap Vue PWA in Capacitor.
- [ ] Native Android `AlarmManager` exact alarms.
- [ ] Native iOS `UNUserNotificationCenter` alarms.

## Phase 6: Multi-User Family Collaboration
- [ ] Shared family lists & task assignment among family members.
- [ ] Family activity feeds & notifications.
