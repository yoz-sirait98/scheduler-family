# YJS Scheduler PWA — Antigravity Development Prompt

## 1. Role

You are a senior full-stack engineer and product architect.

Build a production-ready **Scheduler / To-Do Progressive Web App (PWA)** called **YJS Scheduler**.

The application is primarily a personal task scheduler where every task can optionally be tied to a specific date and time. It must support reminders, browser notifications, alarm-like behavior, calendar views, offline usage, and future calendar integration.

Prioritize:
- Clean architecture
- Excellent mobile UX
- PWA capabilities
- Offline-first behavior
- Maintainable code
- Simple MVP implementation before advanced features
- Avoid unnecessary backend complexity

Do not over-engineer the first version.

---

# 2. Product Goal

Create a modern personal scheduler that combines:

1. To-do list
2. Date-based scheduling
3. Time-based scheduling
4. Calendar
5. Reminders
6. Browser notifications
7. Alarm-like reminder experience
8. Offline-first usage
9. Cloud synchronization
10. Future Google Calendar integration

The main concept is:

> A task is not just a checkbox. A task can represent something that needs to happen at a specific date and/or time.

Example:

```text
Meeting with HR
19 August 2026
10:00 - 11:00
Reminder: 15 minutes before
Priority: High
```

Another example:

```text
Buy cat food
19 August 2026
All day
```

---

# 3. Important Existing Project Context

The owner already has experience with:

- Vue 3
- Vite
- Pinia
- Vue Router
- Tailwind CSS
- Laravel
- Supabase
- GitHub Pages
- PWA concepts

Therefore, use a modern frontend architecture but keep the implementation straightforward.

The owner prefers practical, readable code over unnecessary abstractions.

---

# 4. Target Deployment

The application must be deployable to:

```text
GitHub
    ↓
GitHub Pages
    ↓
Custom Domain
    ↓
yjsfinance.web.id
```

Important:

The application must work correctly when hosted under a GitHub Pages deployment environment.

Do not hard-code assumptions that only work with localhost.

Make the Vite base path and routing strategy compatible with GitHub Pages.

If the final deployment architecture requires a different custom-domain setup, document it clearly.

---

# 5. Technology Stack

Use:

## Frontend

- Vue 3
- Vite
- TypeScript
- Composition API
- `<script setup>`
- Pinia
- Vue Router
- Tailwind CSS
- PWA support
- Service Worker
- IndexedDB

Recommended PWA package:

```text
vite-plugin-pwa
```

Use a stable and well-maintained IndexedDB wrapper such as:

```text
Dexie
```

if appropriate.

## Backend / Cloud

Use:

```text
Supabase
```

for:

- PostgreSQL
- Authentication
- Row Level Security
- Cloud persistence
- Synchronization

Do not create a custom backend unless there is a clear requirement.

---

# 6. Architecture

Use this high-level architecture:

```text
                    YJS Scheduler PWA
                           │
            ┌──────────────┼──────────────┐
            │              │              │
         Vue UI          Pinia        Service Worker
            │              │              │
            └──────────────┼──────────────┘
                           │
                       Local DB
                       IndexedDB
                           │
                     Sync Engine
                           │
                        Supabase
                           │
                      PostgreSQL
```

The application should be **offline-first**.

The UI should primarily work against local IndexedDB.

Supabase synchronization happens when connectivity is available.

---

# 7. Core MVP Features

Implement the following features first.

## 7.1 Dashboard

The dashboard should show:

- Today's date
- Current day
- Upcoming tasks
- Overdue tasks
- Completed tasks
- Next scheduled task
- Quick add task button

Example:

```text
Good Morning 👋

Tuesday, 18 August 2026

TODAY

09:00   ✓ Daily Meeting
10:00   ○ Meeting HR          🔔
12:00   ○ Lunch
15:30   ○ Review ABAP         🔔

--------------------------------

Upcoming

19 Aug
○ Dentist Appointment

20 Aug
○ Submit Report

                 + Add Task
```

The dashboard must be optimized for mobile.

---

# 8. Task Model

Create a task entity with at least:

```text
id
user_id
title
description
task_date
start_time
end_time
is_all_day
priority
status
category_id
created_at
updated_at
completed_at
```

Suggested values:

### Priority

```text
low
medium
high
urgent
```

### Status

```text
pending
completed
cancelled
```

Use appropriate TypeScript types/enums.

Do not use magic strings throughout the application.

---

# 9. Task Creation

Users must be able to create a task quickly.

Required fields:

```text
Title
Date
Time
```

Optional:

```text
Description
Start time
End time
Priority
Category
Reminder
Repeat
```

Support:

### All-day task

```text
Buy groceries
19 August
All day
```

### Scheduled task

```text
Meeting HR
19 August
10:00 - 11:00
```

### Task with only start time

```text
Call Budi
19 August
14:00
```

The UI must make these distinctions clear.

---

# 10. Task List

Provide:

- Today
- Upcoming
- Overdue
- Completed
- All Tasks

Support:

- Complete task
- Uncomplete task
- Edit
- Delete
- Filter
- Search
- Sort

Useful sorting options:

```text
Time
Priority
Created date
Status
```

---

# 11. Calendar

Implement:

```text
Month View
Week View
Day View
Agenda View
```

For MVP, prioritize:

1. Day
2. Agenda
3. Month

The calendar must display scheduled tasks.

Example Day View:

```text
Tuesday, 18 August

08:00
│
09:00 ─── Daily Meeting
│
10:00 ─── Meeting HR
│
11:00
│
12:00 ─── Lunch
│
13:00
│
14:00
│
15:30 ─── Review ABAP
│
16:00
```

Clicking a calendar item should open the task detail/edit screen.

Clicking an empty time slot should allow quick task creation with the selected date/time pre-filled.

---

# 12. Reminder System

A task can have one or more reminders.

Suggested reminder options:

```text
At time
5 minutes before
10 minutes before
15 minutes before
30 minutes before
1 hour before
1 day before
Custom
```

Create a separate reminder model:

```text
task_reminders
---------------
id
task_id
reminder_type
minutes_before
is_enabled
created_at
updated_at
```

Allow multiple reminders per task.

Example:

```text
Meeting HR
10:00

Reminders:
🔔 30 minutes before
🔔 10 minutes before
```

---

# 13. Browser Notifications

Implement browser notification support.

Requirements:

- Ask for notification permission at an appropriate moment.
- Do not immediately request permission on the first page load.
- Explain why notification permission is useful.
- Provide a Settings page where users can manage notification preferences.
- Handle denied permission gracefully.

Example notification:

```text
YJS Scheduler

Meeting HR starts in 15 minutes.
```

Clicking a notification should open the relevant task.

---

# 14. Alarm Behavior

The product should have an alarm-like reminder experience.

Example:

```text
⏰ REMINDER

Meeting HR

Starts now

[ STOP ]
[ SNOOZE 5 MIN ]
[ SNOOZE 10 MIN ]
```

Important technical limitation:

A browser PWA cannot guarantee native-level alarm reliability when the browser/OS completely suspends the application.

Therefore:

- Implement the best possible PWA notification/reminder behavior.
- Use Service Worker / Web Push where appropriate.
- Clearly separate notification logic from UI alarm logic.
- Do not claim native alarm reliability.
- Design the architecture so native capabilities can be added later through Capacitor if necessary.

---

# 15. Offline-First

This is an important requirement.

The application should remain usable when there is no internet connection.

Offline users should be able to:

```text
View tasks        ✅
Create tasks      ✅
Edit tasks        ✅
Complete tasks    ✅
Delete tasks      ✅
View calendar     ✅
Create reminders  ✅
```

Store local application data in IndexedDB.

Recommended:

```text
Dexie
```

Implement a synchronization strategy:

```text
Local change
    ↓
IndexedDB
    ↓
Sync queue
    ↓
Internet available
    ↓
Supabase
```

And:

```text
Supabase changes
    ↓
Sync
    ↓
IndexedDB
    ↓
UI
```

Avoid data loss during synchronization.

Document the conflict-resolution strategy.

For MVP, a simple:

```text
last-write-wins
```

strategy is acceptable, but structure the code so it can evolve later.

---

# 16. Supabase Database

Create the required SQL migrations/schema.

Suggested tables:

## profiles

```text
id
email
display_name
avatar_url
created_at
updated_at
```

## categories

```text
id
user_id
name
icon
color
created_at
updated_at
```

## tasks

```text
id
user_id
title
description
task_date
start_time
end_time
is_all_day
priority
status
category_id
created_at
updated_at
completed_at
```

## task_reminders

```text
id
task_id
reminder_type
minutes_before
is_enabled
created_at
updated_at
```

## task_recurrences

```text
id
task_id
frequency
interval
days_of_week
end_date
created_at
updated_at
```

Add appropriate indexes.

Use UUIDs.

Use timestamps consistently.

---

# 17. Supabase Security

Implement Row Level Security.

A user must only be able to access their own:

- Tasks
- Categories
- Reminders
- Recurrences
- Profile

Never rely only on frontend filtering for security.

Create explicit RLS policies.

Document the policies.

---

# 18. Authentication

Use Supabase Auth.

MVP:

```text
Email
Password
```

Recommended future support:

```text
Google OAuth
```

Authentication flow:

```text
Login
  ↓
Supabase Auth
  ↓
Load profile
  ↓
Load local database
  ↓
Sync
  ↓
Dashboard
```

If the user is not authenticated, show the login page.

---

# 19. PWA Requirements

The app must be installable as a PWA.

Implement:

- Web App Manifest
- Service Worker
- App icons
- Splash/theme configuration
- Offline caching
- Installable experience
- Online/offline detection

The application should have:

```text
name:
YJS Scheduler

short_name:
Scheduler
```

Use an appropriate description.

Provide icons in the required PWA sizes.

---

# 20. UI / UX

The UI should be:

- Modern
- Minimal
- Clean
- Fast
- Mobile-first
- Responsive
- Accessible

Primary navigation on mobile:

```text
┌──────────────────────────┐
│                          │
│        Application       │
│                          │
│                          │
├──────────────────────────┤
│  Today  Calendar  Tasks  │
└──────────────────────────┘
```

Desktop can use a sidebar.

Use visual distinction for:

```text
Overdue
Today
Upcoming
Completed
High priority
Reminders
```

Avoid excessive animations.

Use subtle transitions only.

---

# 21. Recommended Screens

Create these screens:

```text
/login
/register

/
/dashboard

/calendar
/tasks
/tasks/:id
/tasks/new
/tasks/:id/edit

/categories

/settings
/settings/notifications
/settings/account
```

If a route is unnecessary, simplify it.

---

# 22. Quick Add

The application should make task creation extremely fast.

A floating button:

```text
+
```

opens:

```text
Add Task

Title
[________________]

Date
[ 19 Aug 2026 ]

Time
[ 10:00 ]

Reminder
[ 15 minutes before ]

        [ Save ]
```

Do not force users through a large multi-step form for simple tasks.

---

# 23. Recurring Tasks

Support recurring tasks in the data model.

MVP recurrence options:

```text
Daily
Weekly
Monthly
Yearly
```

Weekly should optionally support:

```text
Monday
Tuesday
Wednesday
Thursday
Friday
Saturday
Sunday
```

Example:

```text
Daily standup
Every weekday
09:00
```

Do not over-engineer recurrence calculations initially.

---

# 24. Categories

Provide categories such as:

```text
Work
Personal
Finance
Family
Health
Other
```

But allow users to create their own categories.

Categories should have:

```text
name
icon
color
```

Do not hard-code the default categories into the database logic.

---

# 25. Search and Filtering

Implement:

Search:

```text
"meeting"
```

Filters:

```text
Date
Status
Priority
Category
Has reminder
```

Sorting:

```text
Earliest
Latest
Priority
Recently created
```

---

# 26. Future Google Calendar Integration

Do NOT implement full two-way synchronization in MVP.

Prepare the architecture for future support.

Future functionality:

```text
Connect Google Calendar
        ↓
OAuth
        ↓
Google Calendar API
        ↓
Import events
        ↓
YJS Scheduler
```

And:

```text
YJS Task
   ↓
Add to Google Calendar
```

For MVP, the task model should have room for external calendar identifiers if needed later.

Possible future fields:

```text
external_calendar_id
external_event_id
external_provider
```

Do not add unnecessary complexity if it is not needed yet.

---

# 27. Notifications Architecture

Create a dedicated notification/reminder service.

Do not put notification logic directly inside Vue components.

Suggested structure:

```text
src/
├── services/
│   ├── notification.service.ts
│   ├── reminder.service.ts
│   ├── sync.service.ts
│   ├── supabase.service.ts
│   └── storage.service.ts
```

Responsibilities:

### notification.service

- Request permission
- Show notification
- Handle notification click
- Check browser support

### reminder.service

- Calculate upcoming reminders
- Schedule/check reminders
- Coordinate with notification service

### sync.service

- Push local changes
- Pull remote changes
- Resolve conflicts
- Maintain sync queue

---

# 28. Suggested Project Structure

Use a feature-oriented structure.

Example:

```text
src/
├── assets/
├── components/
│   ├── common/
│   ├── tasks/
│   ├── calendar/
│   └── notifications/
│
├── composables/
│   ├── useTasks.ts
│   ├── useCalendar.ts
│   ├── useNotifications.ts
│   ├── useOnlineStatus.ts
│   └── useAuth.ts
│
├── layouts/
│   ├── DefaultLayout.vue
│   └── AuthLayout.vue
│
├── pages/
│   ├── auth/
│   ├── dashboard/
│   ├── calendar/
│   ├── tasks/
│   └── settings/
│
├── router/
├── stores/
│   ├── auth.store.ts
│   ├── task.store.ts
│   ├── calendar.store.ts
│   └── settings.store.ts
│
├── services/
│   ├── supabase.service.ts
│   ├── notification.service.ts
│   ├── reminder.service.ts
│   ├── sync.service.ts
│   └── storage.service.ts
│
├── db/
│   ├── database.ts
│   ├── task.repository.ts
│   └── reminder.repository.ts
│
├── types/
│   ├── task.ts
│   ├── calendar.ts
│   └── notification.ts
│
├── utils/
└── App.vue
```

Adjust the structure if a better architecture is clearly justified.

---

# 29. Date and Time Handling

Be careful with timezone handling.

Target timezone:

```text
Asia/Jakarta
UTC+07:00
```

The UI should display local user time.

Do not blindly convert date-only fields into UTC timestamps.

For example:

```text
task_date = 2026-08-19
start_time = 10:00
```

should remain a local scheduled date/time concept.

Document how date/time values are stored and converted.

---

# 30. Performance

The app should feel instant.

Optimize:

- Initial bundle
- Calendar rendering
- IndexedDB access
- Supabase queries
- Notification processing
- Lazy loading of pages

Use route-level code splitting where appropriate.

Do not prematurely optimize trivial components.

---

# 31. Error Handling

Handle:

- Offline mode
- Supabase unavailable
- Authentication errors
- Notification permission denied
- Invalid task data
- Sync conflict
- Failed synchronization
- Browser without notification support

Never silently lose user data.

Show useful user-facing messages.

---

# 32. Loading States

Every asynchronous operation must have an appropriate loading state.

Examples:

```text
Saving...
Syncing...
Loading tasks...
```

Avoid blocking the entire application for small operations.

Prefer optimistic UI where safe.

---

# 33. Empty States

Design proper empty states.

Examples:

```text
No tasks today 🎉

You're all caught up.
```

Calendar:

```text
No scheduled tasks
```

Search:

```text
No tasks found.
```

---

# 34. Accessibility

Follow basic accessibility practices:

- Semantic HTML
- Keyboard navigation
- Proper labels
- Focus states
- Accessible buttons
- Sufficient contrast
- Screen-reader friendly controls

Do not use icon-only buttons without accessible labels.

---

# 35. Testing

Add tests for critical logic.

At minimum:

### Unit tests

- Task validation
- Reminder calculation
- Recurrence calculation
- Date/time handling
- Sync conflict resolution

### Integration tests

- Authentication
- Task CRUD
- Offline task creation
- Sync

Do not attempt exhaustive testing before the MVP works.

---

# 36. Environment Variables

Use:

```text
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
```

Create:

```text
.env.example
```

Never commit real secrets.

Do not put Supabase service-role keys in the frontend.

---

# 37. GitHub Actions

Create a GitHub Actions workflow for deployment.

Expected flow:

```text
git push
   ↓
GitHub Actions
   ↓
npm install
   ↓
npm run build
   ↓
Deploy to GitHub Pages
```

Make the workflow production-ready.

Document required GitHub repository settings.

---

# 38. Custom Domain

Prepare deployment for:

```text
yjsfinance.web.id
```

Create/document the required GitHub Pages custom-domain configuration.

Do not assume DNS settings are already configured.

Provide a clear deployment checklist:

```text
GitHub Pages
DNS
Custom domain
HTTPS
PWA
Service Worker
```

---

# 39. Local Development

The project must run with:

```bash
npm install
npm run dev
```

Build:

```bash
npm run build
```

Preview:

```bash
npm run preview
```

Add useful scripts such as:

```text
lint
test
type-check
```

where appropriate.

---

# 40. Documentation

Create a strong `README.md`.

It must include:

- Project overview
- Features
- Tech stack
- Architecture
- Local setup
- Supabase setup
- Environment variables
- Database migration
- Authentication setup
- PWA setup
- GitHub Pages deployment
- Custom domain setup
- Notification limitations
- Offline synchronization behavior
- Future roadmap

Also create:

```text
docs/
├── architecture.md
├── database.md
├── notifications.md
├── deployment.md
└── roadmap.md
```

Do not create documentation that contradicts the actual implementation.

---

# 41. Development Rules

Follow these rules strictly:

1. Use TypeScript.
2. Use Vue 3 Composition API.
3. Use `<script setup>`.
4. Avoid Options API.
5. Keep components small and reusable.
6. Keep business logic outside UI components.
7. Use Pinia only where global/shared state is justified.
8. Use IndexedDB for offline persistence.
9. Use Supabase for cloud persistence.
10. Never expose service-role credentials.
11. Use RLS.
12. Never silently discard unsynchronized local changes.
13. Avoid unnecessary dependencies.
14. Prefer maintained libraries.
15. Avoid duplicated business logic.
16. Avoid hard-coded dates.
17. Handle timezone explicitly.
18. Make the UI mobile-first.
19. Make the app installable as a PWA.
20. Do not implement Google Calendar two-way sync in MVP.

---

# 42. Important PWA Reality Check

Do not pretend that a PWA has the same capabilities as a native mobile alarm application.

The implementation should distinguish:

```text
Web Notification
```

from:

```text
Native Alarm
```

Use the best browser-supported solution.

If a limitation cannot be solved reliably in a browser, document it instead of creating a fake implementation.

The architecture should remain upgradeable to:

```text
Vue PWA
   ↓
Capacitor
   ↓
Native Android / iOS
```

if native alarm functionality is required later.

---

# 43. MVP Scope

The first implementation must focus on:

```text
Authentication
        ↓
Dashboard
        ↓
Task CRUD
        ↓
Date + Time
        ↓
Calendar
        ↓
Reminder
        ↓
Browser Notification
        ↓
IndexedDB Offline
        ↓
Supabase Sync
        ↓
PWA Install
        ↓
GitHub Pages Deployment
```

Do NOT start with:

- AI scheduling
- Google Calendar two-way sync
- Complex analytics
- Team collaboration
- Sharing tasks
- Chat
- Native mobile apps
- Complex recurrence engine

Those belong to later phases.

---

# 44. Implementation Strategy

Work incrementally.

## Step 1

Inspect the existing repository.

If a project already exists, do not blindly overwrite it.

Explain:

- Existing structure
- Existing dependencies
- Existing architecture
- What can be reused
- What needs to change

## Step 2

Create the project foundation.

## Step 3

Implement UI shell and routing.

## Step 4

Implement authentication.

## Step 5

Implement local task storage.

## Step 6

Implement task CRUD.

## Step 7

Implement calendar.

## Step 8

Implement reminders and notifications.

## Step 9

Implement Supabase synchronization.

## Step 10

Implement PWA.

## Step 11

Implement GitHub Actions deployment.

## Step 12

Test production build.

---

# 45. Definition of Done

The MVP is considered complete when:

- [ ] User can register/login.
- [ ] User can create a task.
- [ ] Task can have a date.
- [ ] Task can have a start time.
- [ ] Task can have an end time.
- [ ] Task can be all-day.
- [ ] User can edit a task.
- [ ] User can delete a task.
- [ ] User can complete/uncomplete a task.
- [ ] User can assign priority.
- [ ] User can assign category.
- [ ] User can create reminders.
- [ ] Calendar displays tasks.
- [ ] Dashboard displays today's schedule.
- [ ] Browser notifications work where supported.
- [ ] Notification permission is handled correctly.
- [ ] Application works offline for core task operations.
- [ ] Offline changes synchronize with Supabase.
- [ ] User data is protected with RLS.
- [ ] Application is installable as a PWA.
- [ ] Production build succeeds.
- [ ] GitHub Pages deployment works.
- [ ] Custom domain configuration is documented.
- [ ] README is complete.
- [ ] No secrets are committed.

---

# 46. Product Design Principle

The most important UX principle is:

> Adding a task should be faster than writing it on paper.

A user should be able to open the app and create:

```text
"Meeting with Budi tomorrow 10 AM"
```

with minimal interaction.

However, natural-language task parsing is a future feature. MVP should prioritize a very fast structured form.

---

# 47. Future Roadmap

After MVP:

## Phase 2

- Google Calendar integration
- Google OAuth
- Add task to Google Calendar
- Import calendar events

## Phase 3

- Advanced recurring tasks
- Better notification scheduling
- Web Push
- Notification history
- Snooze

## Phase 4

- Natural language task creation
- AI scheduling suggestions
- Smart conflict detection

Example:

```text
"Schedule a meeting with Budi tomorrow at 10"
```

## Phase 5

- Capacitor wrapper
- Native Android
- Native iOS
- Native alarm capabilities

## Phase 6

- Shared tasks
- Family scheduler
- Multiple users
- Task assignment

---

# 48. Final Instructions to Antigravity

Before writing code:

1. Inspect the repository.
2. Identify the current framework and project state.
3. Do not destroy working code without justification.
4. Propose the implementation plan.
5. Identify required dependencies.
6. Identify required Supabase schema.
7. Then implement incrementally.

During implementation:

- Keep the project buildable after every major step.
- Run type checking.
- Run linting.
- Run tests where available.
- Fix errors before continuing.
- Do not leave placeholder implementations for core MVP functionality.
- Do not fake browser APIs that do not exist.
- Document browser/PWA limitations honestly.

At the end:

Provide a concise implementation report containing:

```text
1. What was implemented
2. Files created/modified
3. Dependencies added
4. Supabase setup required
5. Environment variables required
6. How to run locally
7. How to deploy
8. Known limitations
9. Recommended next steps
```

The final implementation should be production-oriented, clean, maintainable, mobile-first, offline-capable, and ready for GitHub Pages + Supabase deployment.
