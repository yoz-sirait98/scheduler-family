<template>
  <header class="sticky top-0 z-30 w-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 transition-colors">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
      <!-- Brand / Page Context -->
      <div class="flex items-center gap-3">
        <div class="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
          <CalendarCheck class="w-4 h-4" />
        </div>
        <div>
          <span class="font-bold text-slate-900 dark:text-white tracking-tight text-base sm:text-lg">
            YJS <span class="text-indigo-600 dark:text-indigo-400 font-semibold">Scheduler</span>
          </span>
        </div>
      </div>

      <!-- Actions & Status Badges -->
      <div class="flex items-center gap-2 sm:gap-3">
        <!-- Online / Sync Status Button -->
        <button
          @click="handleSyncClick"
          :title="syncTooltip"
          class="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-all active:scale-95"
          :class="syncButtonClasses"
        >
          <RefreshCw
            class="w-3.5 h-3.5"
            :class="{ 'animate-spin': settingsStore.syncStatus.state === 'syncing' }"
          />
          <span class="hidden sm:inline">{{ syncLabel }}</span>
          <span v-if="settingsStore.syncStatus.pendingCount > 0" class="w-2 h-2 rounded-full bg-amber-500"></span>
        </button>

        <!-- Dark Mode Toggle -->
        <button
          @click="settingsStore.toggleDarkMode()"
          class="p-2 rounded-xl text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Toggle Dark Mode"
          aria-label="Toggle Dark Mode"
        >
          <Sun v-if="settingsStore.isDarkMode" class="w-4 h-4 text-amber-400" />
          <Moon v-else class="w-4 h-4 text-slate-600" />
        </button>

        <!-- User / Guest Mode Badge -->
        <div class="flex items-center gap-1.5 pl-1">
          <div class="w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-bold text-xs flex items-center justify-center border border-indigo-200 dark:border-indigo-700/50">
            {{ authStore.userDisplayName.charAt(0).toUpperCase() }}
          </div>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { CalendarCheck, RefreshCw, Moon, Sun } from 'lucide-vue-next';
import { useSettingsStore } from '@/stores/settings.store';
import { useAuthStore } from '@/stores/auth.store';
import { useOnlineStatus } from '@/composables/useOnlineStatus';

const settingsStore = useSettingsStore();
const authStore = useAuthStore();
const { isOnline } = useOnlineStatus();

const syncLabel = computed(() => {
  if (!isOnline.value) return 'Offline';
  if (settingsStore.syncStatus.state === 'syncing') return 'Syncing...';
  if (settingsStore.syncStatus.pendingCount > 0) return `${settingsStore.syncStatus.pendingCount} pending`;
  return 'Synced';
});

const syncTooltip = computed(() => {
  if (!isOnline.value) return 'Working offline (changes stored locally)';
  if (settingsStore.syncStatus.state === 'syncing') return 'Syncing with cloud...';
  return 'Click to trigger manual cloud sync';
});

const syncButtonClasses = computed(() => {
  if (!isOnline.value) {
    return 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/60';
  }
  if (settingsStore.syncStatus.state === 'syncing') {
    return 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800/60';
  }
  if (settingsStore.syncStatus.pendingCount > 0) {
    return 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/60';
  }
  return 'bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-indigo-300';
});

async function handleSyncClick() {
  await settingsStore.triggerManualSync();
}
</script>
