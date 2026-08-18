# YJS Scheduler — Notifications & Alarm Architecture

## 1. Web Notifications vs. Native Alarms

### Browser / PWA Capabilities & Limitations
Web applications and Progressive Web Apps (PWAs) run within standard browser security sandbox constraints:
- **Foreground / Active Tab**: Full Web Audio API synthesizers play loud chimes, and instant in-app Alarm Modals appear with Stop/Snooze actions.
- **Background / Minimized**: The Service Worker and Web Notification API trigger system banner alerts and vibrations (on Android / desktop).
- **Suspended / Closed Browser Limitation**: Standard browser engines may freeze timers if the mobile OS terminates or severely throttles background web processes to conserve battery.

### Honest Architectural Stance
We do not fake unsupported native OS alarms. Instead:
1. We maximize PWA capabilities using `Notification API`, `ServiceWorkerRegistration.showNotification()`, and Web Audio chime synthesis.
2. In future phases, the codebase is structured for direct wrapping with **Capacitor** for Android `AlarmManager` and iOS `UNUserNotificationCenter` native alarms.

---

## 2. Audio Chime Engine

Audio alerts are generated on-the-fly using the browser's native **Web Audio API**:
- **Synthesis**: Multi-tone harmonic chime arpeggio:
  - C6 (1046.5 Hz)
  - E6 (1318.5 Hz)
  - G6 (1567.98 Hz)
- **Zero Asset Dependencies**: No large MP3 files to download, no CORS issues, no missing file errors.
- **Volume & Control**: Full user control via Settings and in-app Stop / Snooze controls.

---

## 3. Reminder Presets Supported

- At time of task (0m)
- 5 minutes before
- 10 minutes before
- 15 minutes before
- 30 minutes before
- 1 hour before
- 1 day before
