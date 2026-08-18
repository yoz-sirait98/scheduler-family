# YJS Scheduler — Architecture Documentation

## 1. High-Level System Architecture

YJS Scheduler is built using an **Offline-First Reactive Architecture**:

```text
                     YJS Scheduler PWA (Vue 3 + TS)
                                   │
          ┌────────────────────────┼────────────────────────┐
          │                        │                        │
       Vue UI                    Pinia                Service Worker
 (Mobile First + Web Audio) (Reactive State)        (PWA & Web Push)
          │                        │                        │
          └────────────────────────┼────────────────────────┘
                                   │
                               Local DB
                           (Dexie IndexedDB)
                                   │
                              Sync Engine
                       (Sync Queue & Last-Write-Wins)
                                   │
                                Supabase
                       (PostgreSQL + RLS + Auth)
```

## 2. Core Architectural Pillars

### 2.1 Offline-First by Design
- All user read and write operations (Task creation, edits, completions, category updates) execute immediately against **IndexedDB** using Dexie.js.
- UI responses are instantaneous (sub-10ms) without blocking on network roundtrips.
- When mutations happen, a record is pushed to the local `syncQueue` table.

### 2.2 Synchronization Engine
- The sync engine listens to browser `online` / `offline` events and also provides a manual "Sync Now" trigger.
- **Push Phase**: It drains the `syncQueue` by upserting changes to Supabase PostgreSQL.
- **Pull Phase**: Fetches latest delta updates from Supabase where `updated_at > last_sync_time`.
- **Conflict Resolution**: Last-Write-Wins (LWW) based on ISO-8601 `updated_at` timestamps.

### 2.3 Audio & Reminder Engine
- Reminder ticks run on an internal interval checking upcoming scheduled start times against `minutes_before`.
- Browser Notifications are fired using standard Web Notification API / Service Worker.
- Audio alarms are synthesized directly with the **Web Audio API** (zero MP3/WAV download requirements, zero missing asset errors, instant playback).
- In-app active alarm modal displays a pulse animation with one-tap Stop and 5m/10m Snooze options.

### 2.4 Mobile-First Ergonomics
- Responsive layout supporting mobile screens with a dedicated bottom navigation bar, safe-area insets (`env(safe-area-inset-bottom)`), and bottom-sheet touch modals.
- Responsive desktop layout with a collapsible sidebar and quick navigation.
