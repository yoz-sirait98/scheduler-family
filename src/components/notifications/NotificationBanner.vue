<template>
  <div
    v-if="shouldShowBanner"
    class="mb-4 p-4 rounded-2xl bg-gradient-to-r from-indigo-500/10 via-indigo-500/5 to-purple-500/10 border border-indigo-200/80 dark:border-indigo-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
  >
    <div class="flex items-start gap-3">
      <div class="p-2 rounded-xl bg-indigo-600 text-white shrink-0 shadow-xs">
        <Bell class="w-4 h-4" />
      </div>
      <div>
        <h4 class="text-sm font-bold text-slate-900 dark:text-white">
          Enable Task Reminders & Alarms
        </h4>
        <p class="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
          Allow browser notifications so you never miss family events, chores, and scheduled tasks.
        </p>
      </div>
    </div>

    <div class="flex items-center gap-2 self-end sm:self-auto shrink-0">
      <button
        @click="dismissBanner"
        class="px-3 py-1.5 rounded-xl text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
      >
        Later
      </button>
      <button
        @click="enableNotifications"
        class="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-xs transition-colors"
      >
        Enable Notifications
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { Bell } from 'lucide-vue-next';
import { useSettingsStore } from '@/stores/settings.store';

const settingsStore = useSettingsStore();
const isDismissed = ref(localStorage.getItem('yjs_notif_banner_dismissed') === 'true');

const shouldShowBanner = computed(() => {
  return (
    !isDismissed.value &&
    settingsStore.notificationPermission === 'default'
  );
});

async function enableNotifications() {
  await settingsStore.requestNotificationPermission();
  isDismissed.value = true;
}

function dismissBanner() {
  isDismissed.value = true;
  localStorage.setItem('yjs_notif_banner_dismissed', 'true');
}
</script>
