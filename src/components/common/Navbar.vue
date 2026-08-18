<template>
  <header class="sticky top-0 z-30 w-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 pt-[env(safe-area-inset-top,0px)] pl-[env(safe-area-inset-left,0px)] pr-[env(safe-area-inset-right,0px)] transition-colors">
    <div class="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
      <!-- Brand / Page Context -->
      <div class="flex items-center gap-2.5">
        <div class="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 shrink-0">
          <CalendarCheck class="w-4 h-4" />
        </div>
        <div>
          <span class="font-black text-slate-900 dark:text-white tracking-tight text-base sm:text-lg">
            YJS <span class="text-indigo-600 dark:text-indigo-400 font-bold">Scheduler</span>
          </span>
        </div>
      </div>

      <!-- Actions & Status Badges -->
      <div class="flex items-center gap-1.5 sm:gap-2">
        <!-- 1. Dedicated Install App PWA Button (Visible when installable) -->
        <button
          v-if="!isStandalone"
          @click="handleInstallApp"
          class="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200 dark:border-indigo-800/80 text-indigo-600 dark:text-indigo-300 hover:bg-indigo-100 font-bold text-xs shadow-xs active:scale-95 transition-all"
          title="Install App to Home Screen"
          aria-label="Install App"
        >
          <Download class="w-3.5 h-3.5" />
          <span class="hidden sm:inline">Install</span>
        </button>

        <!-- 2. Online / Sync Status Button -->
        <button
          @click="handleSyncClick"
          :title="syncTooltip"
          class="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition-all active:scale-95 shrink-0"
          :class="syncButtonClasses"
        >
          <RefreshCw
            class="w-3.5 h-3.5"
            :class="{ 'animate-spin': settingsStore.syncStatus.state === 'syncing' }"
          />
          <span class="hidden sm:inline">{{ syncLabel }}</span>
          <span v-if="settingsStore.syncStatus.pendingCount > 0" class="w-2 h-2 rounded-full bg-amber-500"></span>
        </button>

        <!-- 3. Dark Mode Toggle -->
        <button
          @click="settingsStore.toggleDarkMode()"
          class="p-2 rounded-xl text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Toggle Dark Mode"
          aria-label="Toggle Dark Mode"
        >
          <Sun v-if="settingsStore.isDarkMode" class="w-4 h-4 text-amber-400" />
          <Moon v-else class="w-4 h-4 text-slate-600" />
        </button>

        <!-- 4. User / Guest Mode Badge -->
        <div class="flex items-center gap-1.5 pl-0.5">
          <div class="w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-black text-xs flex items-center justify-center border border-indigo-200 dark:border-indigo-700/50 shadow-2xs">
            {{ authStore.userDisplayName.charAt(0).toUpperCase() }}
          </div>
        </div>
      </div>
    </div>

    <!-- iOS Safari Install Instructions Sheet Modal -->
    <div
      v-if="showIosModal"
      class="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
    >
      <div class="fixed inset-0" @click="showIosModal = false"></div>
      <div class="relative w-full sm:max-w-md bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 z-10 pb-[env(safe-area-inset-bottom,24px)] animate-in slide-in-from-bottom duration-200">
        <div class="flex items-center justify-between mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
          <h3 class="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Smartphone class="w-4 h-4 text-indigo-600" />
            <span>Install YJS Scheduler on iPhone</span>
          </h3>
          <button @click="showIosModal = false" class="p-1 text-slate-400 hover:text-slate-600">
            <X class="w-5 h-5" />
          </button>
        </div>

        <div class="space-y-3 text-xs text-slate-600 dark:text-slate-300">
          <div class="flex items-start gap-3 p-3 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60">
            <span class="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center shrink-0 text-xs">1</span>
            <p>Tap the <strong>Share button (⎋)</strong> in Safari's bottom toolbar.</p>
          </div>
          <div class="flex items-start gap-3 p-3 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60">
            <span class="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center shrink-0 text-xs">2</span>
            <p>Scroll down and tap <strong>"Add to Home Screen" (⊞)</strong>.</p>
          </div>
          <div class="flex items-start gap-3 p-3 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60">
            <span class="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center shrink-0 text-xs">3</span>
            <p>Tap <strong>Add</strong> in the top-right corner to finish installing!</p>
          </div>
        </div>

        <button
          @click="showIosModal = false"
          class="w-full mt-5 py-2.5 px-4 rounded-xl bg-indigo-600 text-white text-xs font-bold shadow-xs active:scale-95"
        >
          Got it
        </button>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { CalendarCheck, RefreshCw, Moon, Sun, Download, Smartphone, X } from 'lucide-vue-next';
import { useSettingsStore } from '@/stores/settings.store';
import { useAuthStore } from '@/stores/auth.store';
import { useOnlineStatus } from '@/composables/useOnlineStatus';
import { usePwaInstall } from '@/composables/usePwaInstall';

const settingsStore = useSettingsStore();
const authStore = useAuthStore();
const { isOnline } = useOnlineStatus();
const { isStandalone, showIosModal, promptInstall } = usePwaInstall();

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

async function handleInstallApp() {
  await promptInstall();
}
</script>
