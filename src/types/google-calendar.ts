export interface GoogleCalendarItem {
  id: string;
  summary: string;
  description?: string;
  primary?: boolean;
  backgroundColor?: string;
  foregroundColor?: string;
  accessRole?: string;
}

export interface GoogleCalendarAccount {
  email: string;
  name: string;
  picture?: string;
  accessToken: string;
  tokenExpiresAt: number; // Unix timestamp in ms
  isConnected: boolean;
  isMock?: boolean;
}

export interface GoogleCalendarEventDateTime {
  dateTime?: string; // ISO 8601 (e.g. 2026-08-18T10:00:00+07:00)
  date?: string; // YYYY-MM-DD for all-day events
  timeZone?: string;
}

export interface GoogleCalendarEvent {
  id: string;
  summary: string;
  description?: string;
  location?: string;
  start: GoogleCalendarEventDateTime;
  end: GoogleCalendarEventDateTime;
  status?: 'confirmed' | 'tentative' | 'cancelled';
  htmlLink?: string;
  updated?: string; // ISO timestamp
  created?: string; // ISO timestamp
  recurrence?: string[];
  reminders?: {
    useDefault?: boolean;
    overrides?: { method: 'popup' | 'email'; minutes: number }[];
  };
}

export interface GoogleCalendarEventInsertInput {
  summary: string;
  description?: string;
  start: GoogleCalendarEventDateTime;
  end: GoogleCalendarEventDateTime;
  reminders?: {
    useDefault: boolean;
    overrides?: { method: 'popup' | 'email'; minutes: number }[];
  };
}

export interface GoogleSyncOptions {
  calendarId: string;
  direction: 'both' | 'import_only' | 'export_only';
  daysInPast?: number;
  daysInFuture?: number;
  autoSync?: boolean;
}

export interface GoogleSyncStats {
  lastSyncedAt: string;
  eventsImported: number;
  eventsUpdated: number;
  tasksExported: number;
  tasksUpdated: number;
  tasksDeleted: number;
  totalSynced: number;
  error?: string | null;
}
