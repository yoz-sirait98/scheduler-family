import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { googleCalendarService } from '@/services/google-calendar.service';
import { taskRepository } from '@/db/task.repository';
import type { Task } from '@/types/task';
import type {
  GoogleCalendarAccount,
  GoogleCalendarItem,
  GoogleSyncStats,
} from '@/types/google-calendar';

export const useGoogleCalendarStore = defineStore('google-calendar', () => {
  const account = ref<GoogleCalendarAccount | null>(googleCalendarService.getSavedAccount());
  const calendars = ref<GoogleCalendarItem[]>([]);
  const selectedCalendarId = ref<string>(googleCalendarService.getSelectedCalendarId());
  const autoSyncEnabled = ref<boolean>(googleCalendarService.isAutoSyncEnabled());
  const clientId = ref<string>(googleCalendarService.getClientId());
  const isSyncing = ref<boolean>(false);
  const lastSyncStats = ref<GoogleSyncStats | null>(googleCalendarService.getLastSyncStats());
  const errorMessage = ref<string | null>(null);

  const isConnected = computed(() => {
    return !!account.value && account.value.isConnected;
  });

  const isTokenExpired = computed(() => {
    if (!account.value) return false;
    return !googleCalendarService.isTokenValid(account.value);
  });

  const selectedCalendar = computed(() => {
    return calendars.value.find((c) => c.id === selectedCalendarId.value) || calendars.value[0] || null;
  });

  async function init() {
    account.value = googleCalendarService.getSavedAccount();
    clientId.value = googleCalendarService.getClientId();
    selectedCalendarId.value = googleCalendarService.getSelectedCalendarId();
    autoSyncEnabled.value = googleCalendarService.isAutoSyncEnabled();
    lastSyncStats.value = googleCalendarService.getLastSyncStats();

    if (isConnected.value && !isTokenExpired.value) {
      await refreshCalendars();
    }
  }

  async function connect(): Promise<boolean> {
    errorMessage.value = null;
    try {
      const acc = await googleCalendarService.promptOAuthLogin();
      account.value = acc;
      await refreshCalendars();
      return true;
    } catch (err: any) {
      console.error('Google OAuth connection failed:', err);
      errorMessage.value = err.message || 'Google authentication failed';
      return false;
    }
  }

  function connectMock(): GoogleCalendarAccount {
    errorMessage.value = null;
    const mockAcc = googleCalendarService.enableMockAccount();
    account.value = mockAcc;
    refreshCalendars();
    return mockAcc;
  }

  function disconnect() {
    googleCalendarService.logout();
    account.value = null;
    calendars.value = [];
    errorMessage.value = null;
  }

  function updateClientId(newId: string) {
    clientId.value = newId;
    googleCalendarService.setClientId(newId);
  }

  function setSelectedCalendar(calId: string) {
    selectedCalendarId.value = calId;
    googleCalendarService.setSelectedCalendarId(calId);
  }

  function toggleAutoSync() {
    autoSyncEnabled.value = !autoSyncEnabled.value;
    googleCalendarService.setAutoSync(autoSyncEnabled.value);
  }

  async function refreshCalendars(): Promise<void> {
    if (!account.value?.accessToken) return;
    try {
      calendars.value = await googleCalendarService.fetchCalendarList(account.value.accessToken);
    } catch (err: any) {
      console.warn('Failed to load Google Calendars:', err);
    }
  }

  async function syncNow(userId?: string): Promise<GoogleSyncStats | null> {
    if (isSyncing.value) return null;
    if (!isConnected.value) return null;

    isSyncing.value = true;
    errorMessage.value = null;

    try {
      const stats = await googleCalendarService.syncWithGoogle(
        {
          calendarId: selectedCalendarId.value,
          autoSync: autoSyncEnabled.value,
        },
        userId
      );
      lastSyncStats.value = stats;
      return stats;
    } catch (err: any) {
      console.error('Google Calendar sync failed:', err);
      errorMessage.value = err.message || 'Synchronization failed';
      return null;
    } finally {
      isSyncing.value = false;
    }
  }

  async function exportSingleTask(task: Task): Promise<boolean> {
    if (!isConnected.value || !account.value) return false;

    try {
      const payload = googleCalendarService.taskToGoogleEventInput(task);
      if (task.external_event_id) {
        await googleCalendarService.updateEvent(
          account.value.accessToken,
          selectedCalendarId.value,
          task.external_event_id,
          payload
        );
        await taskRepository.update(task.id, {
          external_synced_at: new Date().toISOString(),
        });
      } else {
        const created = await googleCalendarService.createEvent(
          account.value.accessToken,
          selectedCalendarId.value,
          payload
        );
        await taskRepository.update(task.id, {
          external_provider: 'google',
          external_calendar_id: selectedCalendarId.value,
          external_event_id: created.id,
          external_event_link: created.htmlLink || null,
          external_synced_at: new Date().toISOString(),
        });
      }
      return true;
    } catch (err: any) {
      console.error('Export single task failed:', err);
      return false;
    }
  }

  function getWebExportUrl(task: Task): string {
    return googleCalendarService.generateWebExportUrl(task);
  }

  function downloadIcs(task: Task) {
    googleCalendarService.downloadIcsFile(task);
  }

  // Auto initialize on store load
  init();

  return {
    account,
    calendars,
    selectedCalendarId,
    selectedCalendar,
    autoSyncEnabled,
    clientId,
    isSyncing,
    lastSyncStats,
    errorMessage,
    isConnected,
    isTokenExpired,
    init,
    connect,
    connectMock,
    disconnect,
    updateClientId,
    setSelectedCalendar,
    toggleAutoSync,
    refreshCalendars,
    syncNow,
    exportSingleTask,
    getWebExportUrl,
    downloadIcs,
  };
});
