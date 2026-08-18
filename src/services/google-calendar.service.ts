import { taskRepository } from '@/db/task.repository';
import type { Task, TaskCreateInput } from '@/types/task';
import type {
  GoogleCalendarAccount,
  GoogleCalendarItem,
  GoogleCalendarEvent,
  GoogleCalendarEventInsertInput,
  GoogleSyncOptions,
  GoogleSyncStats,
} from '@/types/google-calendar';

declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (response: { access_token?: string; error?: string; expires_in?: number }) => void;
            error_callback?: (err: any) => void;
          }) => {
            requestAccessToken: (overrideConfig?: { prompt?: string }) => void;
          };
        };
      };
    };
  }
}

const STORAGE_KEY_ACCOUNT = 'yjs_google_account';
const STORAGE_KEY_CLIENT_ID = 'yjs_google_client_id';
const STORAGE_KEY_SELECTED_CALENDAR = 'yjs_google_selected_cal';
const STORAGE_KEY_AUTO_SYNC = 'yjs_google_auto_sync';
const STORAGE_KEY_LAST_STATS = 'yjs_google_last_stats';

const DEFAULT_TIMEZONE = 'Asia/Jakarta';
const DEFAULT_TIMEZONE_OFFSET = '+07:00';

export class GoogleCalendarService {
  private gisLoaded = false;
  private tokenClient: any = null;
  private memoryStorage: Record<string, string> = {};

  private getItem(key: string): string | null {
    if (typeof localStorage !== 'undefined') {
      try {
        return localStorage.getItem(key);
      } catch {
        return this.memoryStorage[key] || null;
      }
    }
    return this.memoryStorage[key] || null;
  }

  private setItem(key: string, value: string) {
    this.memoryStorage[key] = value;
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(key, value);
      } catch {
        // Ignored
      }
    }
  }

  private removeItem(key: string) {
    delete this.memoryStorage[key];
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.removeItem(key);
      } catch {
        // Ignored
      }
    }
  }

  // --------------------------------------------------------------------------
  // Configuration & Credentials
  // --------------------------------------------------------------------------

  getClientId(): string {
    const stored = this.getItem(STORAGE_KEY_CLIENT_ID);
    if (stored && stored.trim() !== '') return stored.trim();
    return (import.meta.env?.VITE_GOOGLE_CLIENT_ID as string) || '';
  }

  setClientId(clientId: string) {
    if (clientId.trim()) {
      this.setItem(STORAGE_KEY_CLIENT_ID, clientId.trim());
    } else {
      this.removeItem(STORAGE_KEY_CLIENT_ID);
    }
  }

  getSelectedCalendarId(): string {
    return this.getItem(STORAGE_KEY_SELECTED_CALENDAR) || 'primary';
  }

  setSelectedCalendarId(calendarId: string) {
    this.setItem(STORAGE_KEY_SELECTED_CALENDAR, calendarId);
  }

  isAutoSyncEnabled(): boolean {
    return this.getItem(STORAGE_KEY_AUTO_SYNC) !== 'false';
  }

  setAutoSync(enabled: boolean) {
    this.setItem(STORAGE_KEY_AUTO_SYNC, enabled ? 'true' : 'false');
  }

  getSavedAccount(): GoogleCalendarAccount | null {
    try {
      const raw = this.getItem(STORAGE_KEY_ACCOUNT);
      if (!raw) return null;
      const parsed: GoogleCalendarAccount = JSON.parse(raw);
      return parsed;
    } catch {
      return null;
    }
  }

  saveAccount(account: GoogleCalendarAccount | null) {
    if (account) {
      this.setItem(STORAGE_KEY_ACCOUNT, JSON.stringify(account));
    } else {
      this.removeItem(STORAGE_KEY_ACCOUNT);
    }
  }

  getLastSyncStats(): GoogleSyncStats | null {
    try {
      const raw = this.getItem(STORAGE_KEY_LAST_STATS);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  saveLastSyncStats(stats: GoogleSyncStats) {
    this.setItem(STORAGE_KEY_LAST_STATS, JSON.stringify(stats));
  }

  isTokenValid(account: GoogleCalendarAccount | null): boolean {
    if (!account || !account.accessToken) return false;
    if (account.isMock) return true;
    // Buffer with 2 minutes
    return account.tokenExpiresAt > Date.now() + 2 * 60 * 1000;
  }

  // --------------------------------------------------------------------------
  // Google Identity Services (GIS) OAuth2 Flow
  // --------------------------------------------------------------------------

  async loadGisScript(): Promise<boolean> {
    if (typeof window === 'undefined') return false;
    if (this.gisLoaded && window.google?.accounts?.oauth2) return true;

    return new Promise((resolve) => {
      if (document.getElementById('google-gis-script')) {
        this.gisLoaded = true;
        resolve(true);
        return;
      }

      const script = document.createElement('script');
      script.id = 'google-gis-script';
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => {
        this.gisLoaded = true;
        resolve(true);
      };
      script.onerror = () => {
        console.warn('Failed to load Google Identity Services script.');
        resolve(false);
      };
      document.head.appendChild(script);
    });
  }

  async promptOAuthLogin(): Promise<GoogleCalendarAccount> {
    const clientId = this.getClientId();
    if (!clientId) {
      throw new Error(
        'Google Client ID is missing. Please provide a Google Client ID in Settings or configure VITE_GOOGLE_CLIENT_ID.'
      );
    }

    const loaded = await this.loadGisScript();
    const google = window.google;
    if (!loaded || !google?.accounts?.oauth2) {
      throw new Error('Google Identity Services library is not available.');
    }

    return new Promise((resolve, reject) => {
      try {
        this.tokenClient = google.accounts.oauth2.initTokenClient({
          client_id: clientId,
          scope: [
            'https://www.googleapis.com/auth/calendar.events',
            'https://www.googleapis.com/auth/calendar.readonly',
            'https://www.googleapis.com/auth/userinfo.profile',
            'https://www.googleapis.com/auth/userinfo.email',
          ].join(' '),
          callback: async (tokenResponse) => {
            if (tokenResponse.error) {
              reject(new Error(`Google OAuth error: ${tokenResponse.error}`));
              return;
            }
            if (!tokenResponse.access_token) {
              reject(new Error('No access token received from Google.'));
              return;
            }

            try {
              const expiresInMs = (tokenResponse.expires_in || 3600) * 1000;
              const tokenExpiresAt = Date.now() + expiresInMs;

              // Fetch User Profile
              const userInfo = await this.fetchUserInfo(tokenResponse.access_token);

              const account: GoogleCalendarAccount = {
                email: userInfo.email || 'user@gmail.com',
                name: userInfo.name || 'Google User',
                picture: userInfo.picture,
                accessToken: tokenResponse.access_token,
                tokenExpiresAt,
                isConnected: true,
                isMock: false,
              };

              this.saveAccount(account);
              resolve(account);
            } catch (err: any) {
              reject(err);
            }
          },
          error_callback: (err) => {
            reject(new Error(err?.message || 'Google OAuth prompt closed or failed.'));
          },
        });

        this.tokenClient.requestAccessToken({ prompt: 'consent' });
      } catch (err: any) {
        reject(err);
      }
    });
  }

  /**
   * Mock login for demo / test environments
   */
  enableMockAccount(): GoogleCalendarAccount {
    const mockAccount: GoogleCalendarAccount = {
      email: 'family.scheduler@gmail.com',
      name: 'YJS Family Demo',
      picture: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
      accessToken: 'mock_token_' + Date.now(),
      tokenExpiresAt: Date.now() + 30 * 24 * 3600 * 1000, // 30 days
      isConnected: true,
      isMock: true,
    };
    this.saveAccount(mockAccount);
    return mockAccount;
  }

  logout() {
    this.saveAccount(null);
  }

  // --------------------------------------------------------------------------
  // Google Calendar REST API v3 Client
  // --------------------------------------------------------------------------

  async fetchUserInfo(accessToken: string): Promise<{ email?: string; name?: string; picture?: string }> {
    const res = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) {
      throw new Error(`Failed to fetch Google user profile (${res.status})`);
    }
    return res.json();
  }

  async fetchCalendarList(accessToken: string): Promise<GoogleCalendarItem[]> {
    const account = this.getSavedAccount();
    if (account?.isMock) {
      return [
        {
          id: 'primary',
          summary: 'Primary (Personal)',
          primary: true,
          backgroundColor: '#4285F4',
          accessRole: 'owner',
        },
        {
          id: 'family-cal-id',
          summary: 'YJS Family Schedule',
          primary: false,
          backgroundColor: '#0F9D58',
          accessRole: 'owner',
        },
        {
          id: 'work-cal-id',
          summary: 'Work & Projects',
          primary: false,
          backgroundColor: '#DB4437',
          accessRole: 'writer',
        },
      ];
    }

    const res = await fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) {
      throw new Error(`Failed to fetch Google calendars (${res.status})`);
    }
    const data = await res.json();
    return (data.items || []).map((item: any) => ({
      id: item.id,
      summary: item.summary,
      description: item.description,
      primary: !!item.primary,
      backgroundColor: item.backgroundColor || '#4285F4',
      foregroundColor: item.foregroundColor,
      accessRole: item.accessRole,
    }));
  }

  async fetchEvents(
    accessToken: string,
    calendarId: string = 'primary',
    timeMin?: string,
    timeMax?: string
  ): Promise<GoogleCalendarEvent[]> {
    const account = this.getSavedAccount();
    if (account?.isMock) {
      return this.generateMockEvents();
    }

    const params = new URLSearchParams({
      singleEvents: 'true',
      orderBy: 'startTime',
      maxResults: '250',
    });
    if (timeMin) params.append('timeMin', timeMin);
    if (timeMax) params.append('timeMax', timeMax);

    const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(
      calendarId
    )}/events?${params.toString()}`;

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) {
      throw new Error(`Failed to fetch events from Google Calendar (${res.status})`);
    }
    const data = await res.json();
    return (data.items || []) as GoogleCalendarEvent[];
  }

  async createEvent(
    accessToken: string,
    calendarId: string = 'primary',
    eventData: GoogleCalendarEventInsertInput
  ): Promise<GoogleCalendarEvent> {
    const account = this.getSavedAccount();
    if (account?.isMock) {
      const mockId = 'mock_event_' + crypto.randomUUID();
      return {
        id: mockId,
        summary: eventData.summary,
        description: eventData.description,
        start: eventData.start,
        end: eventData.end,
        status: 'confirmed',
        htmlLink: `https://calendar.google.com/calendar/event?eid=${mockId}`,
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
      };
    }

    const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(eventData),
    });

    if (!res.ok) {
      const errBody = await res.text();
      throw new Error(`Failed to create Google Calendar event (${res.status}): ${errBody}`);
    }
    return res.json();
  }

  async updateEvent(
    accessToken: string,
    calendarId: string = 'primary',
    eventId: string,
    eventData: GoogleCalendarEventInsertInput
  ): Promise<GoogleCalendarEvent> {
    const account = this.getSavedAccount();
    if (account?.isMock) {
      return {
        id: eventId,
        summary: eventData.summary,
        description: eventData.description,
        start: eventData.start,
        end: eventData.end,
        status: 'confirmed',
        htmlLink: `https://calendar.google.com/calendar/event?eid=${eventId}`,
        updated: new Date().toISOString(),
      };
    }

    const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(
      calendarId
    )}/events/${encodeURIComponent(eventId)}`;
    const res = await fetch(url, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(eventData),
    });

    if (!res.ok) {
      const errBody = await res.text();
      throw new Error(`Failed to update Google Calendar event (${res.status}): ${errBody}`);
    }
    return res.json();
  }

  async deleteEvent(
    accessToken: string,
    calendarId: string = 'primary',
    eventId: string
  ): Promise<boolean> {
    const account = this.getSavedAccount();
    if (account?.isMock) {
      return true;
    }

    const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(
      calendarId
    )}/events/${encodeURIComponent(eventId)}`;
    const res = await fetch(url, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (res.status === 404) return true; // Already deleted
    if (!res.ok) {
      throw new Error(`Failed to delete Google Calendar event (${res.status})`);
    }
    return true;
  }

  // --------------------------------------------------------------------------
  // Direct Web Export & ICS Generators (No OAuth required!)
  // --------------------------------------------------------------------------

  /**
   * Generates a 1-click Google Calendar web template URL
   * e.g. https://calendar.google.com/calendar/render?action=TEMPLATE&text=...
   */
  generateWebExportUrl(task: Task): string {
    const title = encodeURIComponent(task.title);
    const details = encodeURIComponent(
      (task.description ? `${task.description}\n\n` : '') +
        `Created via YJS Scheduler (Priority: ${task.priority.toUpperCase()})`
    );

    let datesParam = '';
    const cleanDate = task.task_date.replace(/-/g, '');

    if (task.is_all_day || !task.start_time) {
      // For all-day events in Google Calendar render URL: YYYYMMDD/YYYYMMDD (end date + 1 day)
      const startDate = new Date(task.task_date);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 1);
      const endCleanDate = endDate.toISOString().split('T')[0].replace(/-/g, '');
      datesParam = `${cleanDate}/${endCleanDate}`;
    } else {
      // Timed event: YYYYMMDDTHHMMSS / YYYYMMDDTHHMMSS
      const startParts = task.start_time.split(':');
      const startH = startParts[0].padStart(2, '0');
      const startM = (startParts[1] || '00').padStart(2, '0');
      const startStr = `${cleanDate}T${startH}${startM}00`;

      let endStr = '';
      if (task.end_time) {
        const endParts = task.end_time.split(':');
        const endH = endParts[0].padStart(2, '0');
        const endM = (endParts[1] || '00').padStart(2, '0');
        endStr = `${cleanDate}T${endH}${endM}00`;
      } else {
        // Default to +1 hour
        const endHourNum = (parseInt(startH, 10) + 1) % 24;
        const endH = String(endHourNum).padStart(2, '0');
        endStr = `${cleanDate}T${endH}${startM}00`;
      }
      datesParam = `${startStr}/${endStr}`;
    }

    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&dates=${datesParam}&ctz=${encodeURIComponent(
      DEFAULT_TIMEZONE
    )}`;
  }

  /**
   * Generates standard iCalendar (.ics) format
   */
  generateIcsContent(task: Task): string {
    const cleanDate = task.task_date.replace(/-/g, '');
    const nowStamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const uid = `${task.id}@yjs-scheduler.local`;

    let dtStart = '';
    let dtEnd = '';

    if (task.is_all_day || !task.start_time) {
      dtStart = `;VALUE=DATE:${cleanDate}`;
      const startDate = new Date(task.task_date);
      const nextDate = new Date(startDate);
      nextDate.setDate(nextDate.getDate() + 1);
      const nextDateStr = nextDate.toISOString().split('T')[0].replace(/-/g, '');
      dtEnd = `;VALUE=DATE:${nextDateStr}`;
    } else {
      const startParts = task.start_time.split(':');
      const startH = startParts[0].padStart(2, '0');
      const startM = (startParts[1] || '00').padStart(2, '0');
      dtStart = `:${cleanDate}T${startH}${startM}00`;

      if (task.end_time) {
        const endParts = task.end_time.split(':');
        const endH = endParts[0].padStart(2, '0');
        const endM = (endParts[1] || '00').padStart(2, '0');
        dtEnd = `:${cleanDate}T${endH}${endM}00`;
      } else {
        const endHourNum = (parseInt(startH, 10) + 1) % 24;
        const endH = String(endHourNum).padStart(2, '0');
        dtEnd = `:${cleanDate}T${endH}${startM}00`;
      }
    }

    const lines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//YJS Scheduler//NONSGML v1.0//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTAMP:${nowStamp}`,
      `DTSTART${dtStart}`,
      `DTEND${dtEnd}`,
      `SUMMARY:${task.title.replace(/\n/g, ' ')}`,
      `DESCRIPTION:${(task.description || '').replace(/\n/g, '\\n')}`,
      `STATUS:${task.status === 'completed' ? 'COMPLETED' : 'CONFIRMED'}`,
      'END:VEVENT',
      'END:VCALENDAR',
    ];

    return lines.join('\r\n');
  }

  downloadIcsFile(task: Task) {
    if (typeof window === 'undefined') return;
    const ics = this.generateIcsContent(task);
    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${task.title.replace(/[^a-zA-Z0-9_-]/g, '_')}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  // --------------------------------------------------------------------------
  // Data Conversions: Task <-> Google Calendar Event
  // --------------------------------------------------------------------------

  taskToGoogleEventInput(task: Task): GoogleCalendarEventInsertInput {
    let start: GoogleCalendarEvent['start'];
    let end: GoogleCalendarEvent['end'];

    if (task.is_all_day || !task.start_time) {
      const startDate = task.task_date;
      const nextDateObj = new Date(startDate);
      nextDateObj.setDate(nextDateObj.getDate() + 1);
      const endDate = nextDateObj.toISOString().split('T')[0];

      start = { date: startDate };
      end = { date: endDate };
    } else {
      const startDateTime = `${task.task_date}T${task.start_time}:00${DEFAULT_TIMEZONE_OFFSET}`;
      let endDateTime: string;

      if (task.end_time) {
        endDateTime = `${task.task_date}T${task.end_time}:00${DEFAULT_TIMEZONE_OFFSET}`;
      } else {
        const startParts = task.start_time.split(':');
        const endHourNum = (parseInt(startParts[0], 10) + 1) % 24;
        const endH = String(endHourNum).padStart(2, '0');
        endDateTime = `${task.task_date}T${endH}:${startParts[1] || '00'}:00${DEFAULT_TIMEZONE_OFFSET}`;
      }

      start = { dateTime: startDateTime, timeZone: DEFAULT_TIMEZONE };
      end = { dateTime: endDateTime, timeZone: DEFAULT_TIMEZONE };
    }

    const remindersOverride = task.reminders && task.reminders.length > 0
      ? {
          useDefault: false,
          overrides: task.reminders.map((r) => ({
            method: 'popup' as const,
            minutes: r.minutes_before,
          })),
        }
      : { useDefault: true };

    return {
      summary: task.title,
      description: task.description || undefined,
      start,
      end,
      reminders: remindersOverride,
    };
  }

  googleEventToTaskInput(event: GoogleCalendarEvent): TaskCreateInput {
    const isAllDay = !event.start.dateTime && !!event.start.date;
    let taskDate = '';
    let startTime: string | undefined = undefined;
    let endTime: string | undefined = undefined;

    if (isAllDay && event.start.date) {
      taskDate = event.start.date;
    } else if (event.start.dateTime) {
      const parsedStart = this.parseIsoToLocalParts(event.start.dateTime, event.start.timeZone || DEFAULT_TIMEZONE);
      taskDate = parsedStart.date;
      startTime = parsedStart.time;

      if (event.end.dateTime) {
        const parsedEnd = this.parseIsoToLocalParts(event.end.dateTime, event.end.timeZone || DEFAULT_TIMEZONE);
        endTime = parsedEnd.time;
      }
    } else {
      taskDate = new Date().toISOString().split('T')[0];
    }

    return {
      title: event.summary || '(Untitled Event)',
      description: event.description || null,
      task_date: taskDate,
      start_time: startTime,
      end_time: endTime,
      is_all_day: isAllDay,
      priority: 'medium',
      external_provider: 'google',
      external_event_id: event.id,
      external_event_link: event.htmlLink || null,
      external_synced_at: new Date().toISOString(),
    };
  }

  /**
   * Helper to parse ISO date-time strings reliably across all server/runner timezones
   */
  private parseIsoToLocalParts(
    isoString: string,
    targetTimeZone = DEFAULT_TIMEZONE
  ): { date: string; time: string } {
    if (!isoString.includes('T')) {
      return { date: isoString, time: '' };
    }

    // Direct match for ISO strings with explicit offset (e.g. 2026-08-22T09:00:00+07:00)
    const offsetMatch = isoString.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})/);
    if (offsetMatch && !isoString.endsWith('Z')) {
      return { date: offsetMatch[1], time: offsetMatch[2] };
    }

    // Fallback for UTC strings ending with 'Z'
    try {
      const d = new Date(isoString);
      const formatter = new Intl.DateTimeFormat('en-CA', {
        timeZone: targetTimeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });

      const parts = formatter.formatToParts(d);
      const year = parts.find((p) => p.type === 'year')?.value || '1970';
      const month = parts.find((p) => p.type === 'month')?.value || '01';
      const day = parts.find((p) => p.type === 'day')?.value || '01';
      let hour = parts.find((p) => p.type === 'hour')?.value || '00';
      if (hour === '24') hour = '00';
      const minute = parts.find((p) => p.type === 'minute')?.value || '00';

      return {
        date: `${year}-${month}-${day}`,
        time: `${hour.padStart(2, '0')}:${minute.padStart(2, '0')}`,
      };
    } catch {
      const parts = isoString.split('T');
      return {
        date: parts[0],
        time: parts[1] ? parts[1].substring(0, 5) : '',
      };
    }
  }

  // --------------------------------------------------------------------------
  // Two-Way Synchronization Engine
  // --------------------------------------------------------------------------

  async syncWithGoogle(options?: Partial<GoogleSyncOptions>, userId?: string): Promise<GoogleSyncStats> {
    const account = this.getSavedAccount();
    if (!account || !account.isConnected) {
      throw new Error('Google Calendar is not connected. Please authenticate first.');
    }

    if (!account.isMock && !this.isTokenValid(account)) {
      throw new Error('Google authentication token has expired. Please sign in again.');
    }

    const calendarId = options?.calendarId || this.getSelectedCalendarId();
    const daysInPast = options?.daysInPast ?? 30;
    const daysInFuture = options?.daysInFuture ?? 90;
    const activeUserId = userId || 'local-user';

    const timeMinObj = new Date();
    timeMinObj.setDate(timeMinObj.getDate() - daysInPast);
    const timeMin = timeMinObj.toISOString();

    const timeMaxObj = new Date();
    timeMaxObj.setDate(timeMaxObj.getDate() + daysInFuture);
    const timeMax = timeMaxObj.toISOString();

    const stats: GoogleSyncStats = {
      lastSyncedAt: new Date().toISOString(),
      eventsImported: 0,
      eventsUpdated: 0,
      tasksExported: 0,
      tasksUpdated: 0,
      tasksDeleted: 0,
      totalSynced: 0,
      error: null,
    };

    try {
      // 1. Fetch Remote Events from Google Calendar
      const remoteEvents = await this.fetchEvents(account.accessToken, calendarId, timeMin, timeMax);

      // 2. Fetch all local tasks within the date window
      const localMinDate = timeMin.split('T')[0];
      const localMaxDate = timeMax.split('T')[0];
      const localTasks = await taskRepository.getByDateRange(localMinDate, localMaxDate, activeUserId);

      // Index local tasks by external_event_id
      const localByEventId = new Map<string, Task>();
      for (const t of localTasks) {
        if (t.external_event_id) {
          localByEventId.set(t.external_event_id, t);
        }
      }

      // ----------------------------------------------------------------------
      // PHASE A: PULL (Google Calendar -> Local Dexie)
      // ----------------------------------------------------------------------
      for (const event of remoteEvents) {
        if (event.status === 'cancelled') {
          // Event was cancelled in Google Calendar -> soft delete local task
          const existing = localByEventId.get(event.id);
          if (existing && !existing.is_deleted) {
            await taskRepository.delete(existing.id);
            stats.tasksDeleted++;
          }
          continue;
        }

        const existingLocal = localByEventId.get(event.id);

        if (!existingLocal) {
          // Check if there is an unlinked local task on the same date with exact same title
          const matchingUnlinked = localTasks.find(
            (t) =>
              !t.is_deleted &&
              !t.external_event_id &&
              t.task_date === (event.start.date || event.start.dateTime?.split('T')[0]) &&
              t.title.trim().toLowerCase() === (event.summary || '').trim().toLowerCase()
          );

          if (matchingUnlinked) {
            // Link existing task with Google Event ID
            await taskRepository.update(matchingUnlinked.id, {
              external_provider: 'google',
              external_calendar_id: calendarId,
              external_event_id: event.id,
              external_event_link: event.htmlLink || null,
              external_synced_at: new Date().toISOString(),
            });
            stats.eventsUpdated++;
          } else {
            // Create new Task locally
            const taskInput = this.googleEventToTaskInput(event);
            taskInput.external_calendar_id = calendarId;
            await taskRepository.create(taskInput, activeUserId);
            stats.eventsImported++;
          }
        } else {
          // Task already linked -> Check Last-Write-Wins (LWW)
          const remoteUpdated = event.updated ? new Date(event.updated).getTime() : 0;
          const localUpdated = new Date(existingLocal.updated_at).getTime();

          if (remoteUpdated > localUpdated) {
            // Google event is newer -> Update local task
            const taskInput = this.googleEventToTaskInput(event);
            await taskRepository.update(existingLocal.id, {
              title: taskInput.title,
              description: taskInput.description,
              task_date: taskInput.task_date,
              start_time: taskInput.start_time,
              end_time: taskInput.end_time,
              is_all_day: taskInput.is_all_day,
              external_event_link: event.htmlLink || existingLocal.external_event_link,
              external_synced_at: new Date().toISOString(),
            });
            stats.eventsUpdated++;
          }
        }
      }

      // ----------------------------------------------------------------------
      // PHASE B: PUSH (Local Dexie -> Google Calendar)
      // ----------------------------------------------------------------------
      // Re-read local tasks after pull
      const updatedLocalTasks = await taskRepository.getByDateRange(localMinDate, localMaxDate, activeUserId);

      for (const localTask of updatedLocalTasks) {
        if (localTask.is_deleted) continue;

        if (!localTask.external_event_id) {
          // New local task created in YJS -> Push to Google Calendar
          try {
            const eventPayload = this.taskToGoogleEventInput(localTask);
            const createdGoogleEvent = await this.createEvent(account.accessToken, calendarId, eventPayload);

            await taskRepository.update(localTask.id, {
              external_provider: 'google',
              external_calendar_id: calendarId,
              external_event_id: createdGoogleEvent.id,
              external_event_link: createdGoogleEvent.htmlLink || null,
              external_synced_at: new Date().toISOString(),
            });
            stats.tasksExported++;
          } catch (err: any) {
            console.warn(`Failed to export task ${localTask.id} to Google:`, err);
          }
        } else {
          // Existing linked task -> Check if modified locally since last external sync
          const localUpdated = new Date(localTask.updated_at).getTime();
          const lastSynced = localTask.external_synced_at
            ? new Date(localTask.external_synced_at).getTime()
            : 0;

          if (localUpdated > lastSynced + 2000) {
            // Local task was modified after last Google sync -> Update Google Calendar event
            try {
              const eventPayload = this.taskToGoogleEventInput(localTask);
              await this.updateEvent(
                account.accessToken,
                calendarId,
                localTask.external_event_id,
                eventPayload
              );

              await taskRepository.update(localTask.id, {
                external_synced_at: new Date().toISOString(),
              });
              stats.tasksUpdated++;
            } catch (err: any) {
              console.warn(`Failed to update Google event for task ${localTask.id}:`, err);
            }
          }
        }
      }

      stats.totalSynced =
        stats.eventsImported + stats.eventsUpdated + stats.tasksExported + stats.tasksUpdated;

      this.saveLastSyncStats(stats);
      return stats;
    } catch (err: any) {
      stats.error = err.message || 'Sync failed';
      this.saveLastSyncStats(stats);
      throw err;
    }
  }

  // --------------------------------------------------------------------------
  // Mock Data Helper
  // --------------------------------------------------------------------------

  private generateMockEvents(): GoogleCalendarEvent[] {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    const dayAfter = new Date(today);
    dayAfter.setDate(dayAfter.getDate() + 2);
    const dayAfterStr = dayAfter.toISOString().split('T')[0];

    return [
      {
        id: 'mock_evt_1',
        summary: 'Family Dinner & Budget Review',
        description: 'Monthly family finance review and meal planning with kids.',
        start: { dateTime: `${todayStr}T19:00:00+07:00`, timeZone: DEFAULT_TIMEZONE },
        end: { dateTime: `${todayStr}T20:30:00+07:00`, timeZone: DEFAULT_TIMEZONE },
        status: 'confirmed',
        htmlLink: 'https://calendar.google.com/calendar/event?eid=mock_evt_1',
        updated: new Date(Date.now() - 3600000).toISOString(),
      },
      {
        id: 'mock_evt_2',
        summary: 'Doctor Appointment & Health Checkup',
        description: 'Routine pediatric checkup at Siloam Hospital.',
        start: { dateTime: `${tomorrowStr}T10:00:00+07:00`, timeZone: DEFAULT_TIMEZONE },
        end: { dateTime: `${tomorrowStr}T11:00:00+07:00`, timeZone: DEFAULT_TIMEZONE },
        status: 'confirmed',
        htmlLink: 'https://calendar.google.com/calendar/event?eid=mock_evt_2',
        updated: new Date().toISOString(),
      },
      {
        id: 'mock_evt_3',
        summary: 'School Midterm Holiday (All Day)',
        description: 'Kids school holiday.',
        start: { date: dayAfterStr },
        end: { date: dayAfterStr },
        status: 'confirmed',
        htmlLink: 'https://calendar.google.com/calendar/event?eid=mock_evt_3',
        updated: new Date().toISOString(),
      },
    ];
  }
}

export const googleCalendarService = new GoogleCalendarService();
