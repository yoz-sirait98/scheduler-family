import { describe, it, expect, beforeEach, vi } from 'vitest';
import { googleCalendarService } from '@/services/google-calendar.service';
import { taskRepository } from '@/db/task.repository';
import type { Task } from '@/types/task';
import type { GoogleCalendarEvent } from '@/types/google-calendar';

describe('Google Calendar Integration (Phase 2)', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    if (typeof window !== 'undefined') {
      localStorage.clear();
    }
  });

  const sampleTimedTask: Task = {
    id: 'test-task-1',
    user_id: 'user-123',
    title: 'Dentist Checkup',
    description: 'Dr. Jane Smith clinic',
    task_date: '2026-08-20',
    start_time: '14:30',
    end_time: '15:30',
    is_all_day: false,
    priority: 'high',
    status: 'pending',
    reminders: [
      {
        id: 'r-1',
        task_id: 'test-task-1',
        user_id: 'user-123',
        reminder_type: 'both',
        minutes_before: 30,
        is_enabled: true,
        created_at: '2026-08-18T10:00:00Z',
        updated_at: '2026-08-18T10:00:00Z',
      },
    ],
    created_at: '2026-08-18T10:00:00Z',
    updated_at: '2026-08-18T10:00:00Z',
  };

  const sampleAllDayTask: Task = {
    id: 'test-task-2',
    user_id: 'user-123',
    title: 'Family Roadtrip to Bandung',
    description: 'Bring snacks and camera',
    task_date: '2026-08-25',
    is_all_day: true,
    priority: 'medium',
    status: 'pending',
    created_at: '2026-08-18T10:00:00Z',
    updated_at: '2026-08-18T10:00:00Z',
  };

  describe('1-Click Web Export URL Generator', () => {
    it('generates a valid Google Calendar render URL for timed tasks', () => {
      const url = googleCalendarService.generateWebExportUrl(sampleTimedTask);
      expect(url).toContain('https://calendar.google.com/calendar/render?action=TEMPLATE');
      expect(url).toContain('text=Dentist%20Checkup');
      expect(url).toContain('dates=20260820T143000/20260820T153000');
      expect(url).toContain('ctz=Asia%2FJakarta');
      expect(url).toContain('HIGH');
    });

    it('generates a valid Google Calendar render URL for all-day tasks', () => {
      const url = googleCalendarService.generateWebExportUrl(sampleAllDayTask);
      expect(url).toContain('https://calendar.google.com/calendar/render?action=TEMPLATE');
      expect(url).toContain('text=Family%20Roadtrip%20to%20Bandung');
      expect(url).toContain('dates=20260825/20260826');
    });
  });

  describe('iCalendar (.ics) Generator', () => {
    it('generates valid RFC-5545 iCalendar content for timed tasks', () => {
      const ics = googleCalendarService.generateIcsContent(sampleTimedTask);
      expect(ics).toContain('BEGIN:VCALENDAR');
      expect(ics).toContain('VERSION:2.0');
      expect(ics).toContain('BEGIN:VEVENT');
      expect(ics).toContain('SUMMARY:Dentist Checkup');
      expect(ics).toContain('DTSTART:20260820T143000');
      expect(ics).toContain('DTEND:20260820T153000');
      expect(ics).toContain('STATUS:CONFIRMED');
      expect(ics).toContain('END:VEVENT');
      expect(ics).toContain('END:VCALENDAR');
    });

    it('generates valid RFC-5545 iCalendar content for all-day tasks', () => {
      const ics = googleCalendarService.generateIcsContent(sampleAllDayTask);
      expect(ics).toContain('DTSTART;VALUE=DATE:20260825');
      expect(ics).toContain('DTEND;VALUE=DATE:20260826');
      expect(ics).toContain('SUMMARY:Family Roadtrip to Bandung');
    });
  });

  describe('Task <-> Google Event Conversion', () => {
    it('converts local task to Google Calendar API insert input', () => {
      const payload = googleCalendarService.taskToGoogleEventInput(sampleTimedTask);
      expect(payload.summary).toBe('Dentist Checkup');
      expect(payload.description).toBe('Dr. Jane Smith clinic');
      expect(payload.start.dateTime).toBe('2026-08-20T14:30:00+07:00');
      expect(payload.end.dateTime).toBe('2026-08-20T15:30:00+07:00');
      expect(payload.reminders?.useDefault).toBe(false);
      expect(payload.reminders?.overrides?.[0].minutes).toBe(30);
    });

    it('converts Google Calendar API event to local TaskCreateInput', () => {
      const googleEvent: GoogleCalendarEvent = {
        id: 'g_evt_101',
        summary: 'Parent Teacher Meeting',
        description: 'Discuss semester 1 progress',
        start: { dateTime: '2026-08-22T09:00:00+07:00', timeZone: 'Asia/Jakarta' },
        end: { dateTime: '2026-08-22T10:00:00+07:00', timeZone: 'Asia/Jakarta' },
        htmlLink: 'https://calendar.google.com/calendar/event?eid=g_evt_101',
        status: 'confirmed',
        updated: '2026-08-18T12:00:00Z',
      };

      const taskInput = googleCalendarService.googleEventToTaskInput(googleEvent);
      expect(taskInput.title).toBe('Parent Teacher Meeting');
      expect(taskInput.description).toBe('Discuss semester 1 progress');
      expect(taskInput.task_date).toBe('2026-08-22');
      expect(taskInput.start_time).toBe('09:00');
      expect(taskInput.end_time).toBe('10:00');
      expect(taskInput.is_all_day).toBe(false);
      expect(taskInput.external_provider).toBe('google');
      expect(taskInput.external_event_id).toBe('g_evt_101');
      expect(taskInput.external_event_link).toBe('https://calendar.google.com/calendar/event?eid=g_evt_101');
    });

    it('converts all-day Google Calendar event to all-day TaskCreateInput', () => {
      const googleAllDayEvent: GoogleCalendarEvent = {
        id: 'g_evt_allday',
        summary: 'Independence Day',
        start: { date: '2026-08-17' },
        end: { date: '2026-08-18' },
        status: 'confirmed',
      };

      const taskInput = googleCalendarService.googleEventToTaskInput(googleAllDayEvent);
      expect(taskInput.title).toBe('Independence Day');
      expect(taskInput.task_date).toBe('2026-08-17');
      expect(taskInput.is_all_day).toBe(true);
      expect(taskInput.start_time).toBeUndefined();
    });
  });

  describe('Demo Simulator & Account Management', () => {
    it('enables and saves mock account correctly', () => {
      const mockAcc = googleCalendarService.enableMockAccount();
      expect(mockAcc.isConnected).toBe(true);
      expect(mockAcc.isMock).toBe(true);
      expect(mockAcc.email).toBe('family.scheduler@gmail.com');

      const saved = googleCalendarService.getSavedAccount();
      expect(saved?.email).toBe('family.scheduler@gmail.com');
      expect(googleCalendarService.isTokenValid(saved)).toBe(true);
    });

    it('fetches mock calendar list and mock events in demo mode', async () => {
      googleCalendarService.enableMockAccount();
      const calendars = await googleCalendarService.fetchCalendarList('mock_token');
      expect(calendars.length).toBeGreaterThan(0);
      expect(calendars[0].id).toBe('primary');

      const events = await googleCalendarService.fetchEvents('mock_token', 'primary');
      expect(events.length).toBeGreaterThan(0);
      expect(events[0].summary).toContain('Family');
    });

    it('logs out and clears account state', () => {
      googleCalendarService.enableMockAccount();
      expect(googleCalendarService.getSavedAccount()).not.toBeNull();

      googleCalendarService.logout();
      expect(googleCalendarService.getSavedAccount()).toBeNull();
    });
  });

  describe('Two-Way Synchronization Engine', () => {
    it('executes two-way sync, importing remote events and exporting local tasks', async () => {
      googleCalendarService.enableMockAccount();

      const memoryTasks: Task[] = [
        {
          id: 'local_piano_task',
          user_id: 'test-user-sync',
          title: 'Local Piano Practice',
          task_date: '2026-08-21',
          start_time: '16:00',
          end_time: '17:00',
          is_all_day: false,
          priority: 'medium',
          status: 'pending',
          is_deleted: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          external_event_id: null,
          external_provider: null,
        },
      ];

      vi.spyOn(taskRepository, 'getByDateRange').mockImplementation(async () => {
        return [...memoryTasks];
      });

      vi.spyOn(taskRepository, 'create').mockImplementation(async (input, userId) => {
        const newTask: Task = {
          id: 'imported_' + crypto.randomUUID(),
          user_id: userId || 'test-user-sync',
          title: input.title,
          description: input.description || null,
          task_date: input.task_date,
          start_time: input.start_time || null,
          end_time: input.end_time || null,
          is_all_day: !!input.is_all_day,
          priority: input.priority || 'medium',
          status: 'pending',
          is_deleted: false,
          external_provider: input.external_provider || null,
          external_calendar_id: input.external_calendar_id || null,
          external_event_id: input.external_event_id || null,
          external_event_link: input.external_event_link || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        memoryTasks.push(newTask);
        return newTask;
      });

      vi.spyOn(taskRepository, 'update').mockImplementation(async (id, updates) => {
        const t = memoryTasks.find((item) => item.id === id);
        if (t) {
          Object.assign(t, updates);
          return t;
        }
        return undefined;
      });

      vi.spyOn(taskRepository, 'delete').mockImplementation(async (id) => {
        const t = memoryTasks.find((item) => item.id === id);
        if (t) t.is_deleted = true;
      });

      // Run two-way sync
      const stats = await googleCalendarService.syncWithGoogle({}, 'test-user-sync');

      expect(stats.eventsImported).toBeGreaterThanOrEqual(1);
      expect(stats.tasksExported).toBeGreaterThanOrEqual(1);
      expect(stats.totalSynced).toBeGreaterThan(0);
      expect(stats.error).toBeNull();

      // Verify the local task was updated with an external event ID
      const updatedLocalTask = memoryTasks.find((t) => t.id === 'local_piano_task');
      expect(updatedLocalTask?.external_event_id).not.toBeNull();
      expect(updatedLocalTask?.external_provider).toBe('google');
    });
  });
});
