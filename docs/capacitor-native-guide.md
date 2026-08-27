# Capacitor Native Mobile App Guide — YJS Scheduler

This guide details how to build, run, and test **YJS Scheduler** as a native **Android** and **iOS** mobile application using Capacitor, and how native exact alarms operate.

---

## 1. Architecture Overview

YJS Scheduler uses a unified codebase for both Web/PWA and Native Mobile environments:

```text
                     Vue 3 Frontend App
                              │
             ┌────────────────┴────────────────┐
             ▼                                 ▼
      Capacitor Native                      Web / PWA
   (Android / iOS Wrapper)              (Chrome, Safari)
             │                                 │
   ┌─────────┴─────────┐                       ▼
   ▼                   ▼                Web Audio Chime
Android              iOS                Web Notifications
AlarmManager    UNUserNotification             │
Exact Alarms         Center                    ▼
(allowWhileIdle) (Exact Triggers)      Periodic setInterval
```

- **Android**: Uses `@capacitor/local-notifications` configured with `allowWhileIdle: true` to trigger Android `AlarmManager.setExactAndAllowWhileIdle()`.
- **iOS**: Uses `UNUserNotificationCenter` with exact calendar and time interval notification triggers.
- **Hardware Integrations**:
  - Tactile Haptics (`@capacitor/haptics`) for task completion, selection, and warning feedback.
  - Theme Status Bar (`@capacitor/status-bar`) matching dark/light mode.
  - Android Hardware Back Button (`@capacitor/app`) closing modals before navigating.
  - Splash Screen (`@capacitor/splash-screen`) smooth fade on startup.

---

## 2. Prerequisites

### For Android:
- **Android Studio** (Koala / Ladybug or newer)
- **Java Development Kit (JDK 17 or 21)**
- **Android SDK Platform API 34+** and Build-Tools

### For iOS (Mac required):
- **Xcode 15+**
- **CocoaPods** (`sudo gem install cocoapods`)

---

## 3. Quick Start Commands

```bash
# 1. Build web bundle and sync to native mobile folders
npm run cap:sync

# 2. Open Android Studio
npm run cap:open:android

# 3. Open Xcode (macOS only)
npm run cap:open:ios

# 4. Run directly on connected Android device / emulator
npm run cap:android
```

---

## 4. Android Manifest Permissions & Configuration

The Android project is configured in `android/app/src/main/AndroidManifest.xml` with the following permissions:

| Permission | Purpose |
|---|---|
| `SCHEDULE_EXACT_ALARM` | Permits scheduling exact timing alarms via `AlarmManager` |
| `USE_EXACT_ALARM` | Permits exact alarms for calendar/scheduler apps on Android 13+ |
| `POST_NOTIFICATIONS` | Allows posting urgent task notification banners on Android 13+ |
| `VIBRATE` | Enables vibration patterns during alarm ringing |
| `RECEIVE_BOOT_COMPLETED` | Restores scheduled alarms when device restarts |
| `WAKE_LOCK` | Wakes the device screen when an urgent alarm fires |

---

## 5. Notification Channels & Action Buttons

YJS Scheduler automatically registers an urgent notification channel:
- **Channel ID**: `scheduler_alarms`
- **Channel Name**: Task Alarms & Reminders
- **Importance**: High / Urgent (Level 5)
- **Sound**: `res_alarm_chime.wav` (with system fallback)
- **Vibration & Lights**: Enabled

### Interactive Notification Actions
When an alarm fires, the native notification displays 3 action buttons:
1. **Stop Alarm** (`stop`): Dismisses the alarm and marks reminder as completed.
2. **Snooze 5 Min** (`snooze_5`): Reschedules an exact native alarm in 5 minutes.
3. **Snooze 10 Min** (`snooze_10`): Reschedules an exact native alarm in 10 minutes.

---

## 6. Android Doze Mode & Battery Optimization Guide

Modern Android versions put background apps to sleep using **Doze mode**. To ensure alarms always fire at the exact second even when the phone is left untouched overnight:

1. On your Android device, open **Settings**.
2. Go to **Apps** > **YJS Scheduler**.
3. Tap **Battery** (or App Battery Usage).
4. Select **"Unrestricted"** (allows background alarms and exact timing without OS throttling).

---

## 7. Generating Android Release APK / AAB

1. Run `npm run cap:sync`.
2. Open Android Studio with `npm run cap:open:android`.
3. In Android Studio, go to **Build > Generate Signed Bundle / APK**.
4. Choose **Android App Bundle (AAB)** (for Google Play) or **APK** (for direct sideloading).
5. Select your Keystore (or create a new release keystore).
6. Build variant: `release`.
7. Output APK will be saved in `android/app/release/app-release.apk`.
