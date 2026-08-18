import { defineStore } from 'pinia';
import { ref } from 'vue';
import { notificationService, type NotificationPermissionState } from '@/services/notification.service';
import { syncService } from '@/services/sync.service';
import { useAuthStore } from './auth.store';
import type { SyncStatus } from '@/types/sync';

export const useSettingsStore = defineStore('settings', () => {
  const notificationPermission = ref<NotificationPermissionState>(notificationService.getPermissionState());
  const soundEnabled = ref<boolean>(true);
  const isDarkMode = ref<boolean>(
    typeof window !== 'undefined' ? (localStorage.getItem('yjs_theme') === 'dark' || (!('yjs_theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) : false
  );
  const syncStatus = ref<SyncStatus>(syncService.getStatus());
  const authStore = useAuthStore();

  // Listen to sync status changes
  syncService.onStatusChange((status) => {
    syncStatus.value = status;
  });

  async function requestNotificationPermission(): Promise<boolean> {
    const result = await notificationService.requestPermission();
    notificationPermission.value = result;
    return result === 'granted';
  }

  function toggleSound() {
    soundEnabled.value = !soundEnabled.value;
  }

  function toggleDarkMode() {
    isDarkMode.value = !isDarkMode.value;
    if (isDarkMode.value) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('yjs_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('yjs_theme', 'light');
    }
  }

  function initTheme() {
    if (isDarkMode.value) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }

  async function triggerManualSync(): Promise<boolean> {
    return syncService.triggerSync(authStore.currentUserId);
  }

  return {
    notificationPermission,
    soundEnabled,
    isDarkMode,
    syncStatus,
    requestNotificationPermission,
    toggleSound,
    toggleDarkMode,
    initTheme,
    triggerManualSync,
  };
});
