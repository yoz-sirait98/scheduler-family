# YJS Scheduler — Future Roadmap

## Completed in MVP (Phase 1)
- [x] Vue 3, Vite, TypeScript, Tailwind CSS, Pinia, Dexie (IndexedDB), and Supabase foundation.
- [x] Offline-First task storage and automatic sync queue.
- [x] Standalone Supabase SQL schema (`supabase/schema.sql`) with RLS policies and family default seed triggers.
- [x] Full mobile-first ergonomics: bottom navigation bar, safe-area insets, bottom sheets, 1-tap completion checkboxes.
- [x] Calendar views: Day View (with hourly timeline and quick-add slots), Week View, Month View, Agenda View.
- [x] Reminders & Alarm system with Web Audio API chime synthesis, Web Notifications, Stop and 5m/10m Snooze.
- [x] PWA manifest, service worker caching, and GitHub Pages deployment workflow.

## Completed in Phase 2: Google Calendar Integration
- [x] Connect Google Calendar via OAuth2 (Google Identity Services GIS token flow with custom Client ID & Demo Simulator).
- [x] Two-way event synchronization with Last-Write-Wins (LWW) conflict resolution and bidirectional deletion synchronization.
- [x] Instant direct export and automatic sync on task create/update/delete.
- [x] Universal calendar export options (1-click web render template URL & RFC-5545 `.ics` download).
- [x] Full UI integration across Settings, Task Details, Task Cards, and Calendar views (Day, Week, Month, Agenda).

## Phase 3: Advanced Recurrence & Web Push
- [ ] Complex recurrence rules (e.g. "every 2nd Tuesday of the month", "every weekday").
- [ ] Web Push Server integration using VAPID keys for remote background triggers.
- [ ] Notification history log.

## Phase 4: AI & Natural Language Scheduling
- [ ] Natural language task input parser (e.g. *"Doctor appointment tomorrow at 10 AM with reminder 15m"*).
- [ ] Smart conflict detection.

## Completed in Phase 5: Capacitor Native Mobile Wrapper
- [x] Wrap Vue PWA in Capacitor (`@capacitor/core`, `@capacitor/android`, `@capacitor/ios`).
- [x] Native Android `AlarmManager` exact alarms with `SCHEDULE_EXACT_ALARM`, `USE_EXACT_ALARM`, `POST_NOTIFICATIONS`, and urgent notification channels.
- [x] Native iOS `UNUserNotificationCenter` exact alarm triggers and action categories.
- [x] Interactive Lock Screen & Notification drawer action buttons: Stop Alarm, Snooze 5 Min, Snooze 10 Min.
- [x] Native hardware back button handling on Android (modal & sheet dismiss stack).
- [x] Tactile haptic feedback (`@capacitor/haptics`) for task completion, priority selections, and alarm triggers.
- [x] Theme Status Bar synchronization (`@capacitor/status-bar`) for seamless dark & light modes.
- [x] Native device diagnostics, exact alarm testing (5s trigger), and Android Doze battery optimization guide in Settings.

## Phase 6: Multi-User Family Collaboration
- [ ] Shared family lists & task assignment among family members.
- [ ] Family activity feeds & notifications.
