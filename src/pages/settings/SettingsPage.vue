<template>
  <div class="space-y-4 max-w-3xl mx-auto">
    <!-- Header -->
    <div class="pb-2 border-b border-slate-200/80 dark:border-slate-800/80">
      <h1 class="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
        Settings & Preferences
      </h1>
      <p class="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
        Configure notifications, family profile, sync status, and sound preferences
      </p>
    </div>

    <!-- 1. Notification & Alarm Preferences -->
    <div class="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-2xs space-y-3">
      <div class="flex items-center gap-2.5">
        <div class="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
          <Bell class="w-4 h-4" />
        </div>
        <div>
          <h3 class="text-xs font-bold text-slate-900 dark:text-white">
            Notifications & Alarms
          </h3>
          <p class="text-[11px] text-slate-500">Manage browser alerts and reminder audio chime</p>
        </div>
      </div>

      <div class="space-y-2 pt-1">
        <!-- Permission State -->
        <div class="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
          <div>
            <span class="text-xs font-bold text-slate-800 dark:text-slate-200 block">
              Browser Alerts
            </span>
            <span class="text-[10px] text-slate-500 capitalize">
              Status: <strong class="text-indigo-600 dark:text-indigo-400">{{ settingsStore.notificationPermission }}</strong>
            </span>
          </div>

          <button
            v-if="settingsStore.notificationPermission !== 'granted'"
            @click="settingsStore.requestNotificationPermission()"
            class="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-xs active:scale-95"
          >
            Enable
          </button>
          <button
            v-else
            @click="testNotification"
            class="px-2.5 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-800 dark:text-slate-200 text-xs font-semibold"
          >
            Test Alert
          </button>
        </div>

        <!-- Sound Chime Toggle & Test -->
        <div class="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
          <div>
            <span class="text-xs font-bold text-slate-800 dark:text-slate-200 block">
              Alarm Sound & Chimes
            </span>
            <span class="text-[10px] text-slate-500">Play pleasant synthesized arpeggio chime when alarms fire</span>
          </div>

          <div class="flex items-center gap-2">
            <button
              @click="testSound"
              class="p-1.5 rounded-lg text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40"
              title="Test Sound"
            >
              <Volume2 class="w-4 h-4" />
            </button>
            <button
              @click="settingsStore.toggleSound()"
              class="relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none"
              :class="settingsStore.soundEnabled ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'"
            >
              <span
                class="pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out"
                :class="settingsStore.soundEnabled ? 'translate-x-5' : 'translate-x-0'"
              ></span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 2. Synchronization & Supabase Cloud Status -->
    <div class="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-2xs space-y-3">
      <div class="flex items-center gap-2.5">
        <div class="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
          <Cloud class="w-4 h-4" />
        </div>
        <div>
          <h3 class="text-xs font-bold text-slate-900 dark:text-white">
            Cloud Sync & Persistence
          </h3>
          <p class="text-[11px] text-slate-500">IndexedDB offline storage & Supabase cloud replication</p>
        </div>
      </div>

      <div class="space-y-2 pt-1">
        <div class="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
          <div>
            <div class="flex items-center gap-1.5">
              <span class="text-xs font-bold text-slate-800 dark:text-slate-200">Supabase:</span>
              <span
                class="inline-flex items-center gap-1 px-2 py-0.2 rounded-full text-[10px] font-bold"
                :class="isConfigured ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300' : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'"
              >
                {{ isConfigured ? 'Connected' : 'Offline Mode' }}
              </span>
            </div>
            <p class="text-[10px] text-slate-500 mt-0.5">
              Last synced: {{ settingsStore.syncStatus.lastSyncedAt ? formatTime(settingsStore.syncStatus.lastSyncedAt) : 'Never (running locally)' }}
            </p>
          </div>

          <button
            @click="triggerSync"
            :disabled="syncing"
            class="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-xs disabled:opacity-50 flex items-center gap-1.5 active:scale-95"
          >
            <RefreshCw class="w-3.5 h-3.5" :class="{ 'animate-spin': syncing }" />
            <span>{{ syncing ? 'Syncing...' : 'Sync Now' }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- 3. Account & Family Profile -->
    <div class="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-2xs space-y-3">
      <div class="flex items-center gap-2.5">
        <div class="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
          <User class="w-4 h-4" />
        </div>
        <div>
          <h3 class="text-xs font-bold text-slate-900 dark:text-white">
            Family Profile
          </h3>
          <p class="text-[11px] text-slate-500">Current active user and cloud account</p>
        </div>
      </div>

      <div class="space-y-2 pt-1">
        <div class="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
          <div>
            <h4 class="text-xs font-bold text-slate-900 dark:text-white">
              {{ authStore.userDisplayName }}
            </h4>
            <span class="text-[10px] text-slate-500">
              {{ authStore.user?.email || 'Local Family Member' }}
            </span>
          </div>

          <div v-if="authStore.user">
            <button
              @click="authStore.logout()"
              class="px-3 py-1.5 rounded-xl border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 hover:bg-rose-50 text-xs font-bold transition-colors"
            >
              Sign Out
            </button>
          </div>
          <div v-else class="flex items-center gap-2">
            <router-link
              to="/login"
              class="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-colors shadow-xs"
            >
              Sign In
            </router-link>
          </div>
        </div>
      </div>
    </div>

    <!-- 4. App Info & Specs -->
    <div class="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-2xs text-[11px] text-slate-500 dark:text-slate-400 space-y-1.5">
      <div class="flex items-center justify-between">
        <span>Application Version</span>
        <span class="font-bold text-slate-700 dark:text-slate-300">YJS Scheduler v1.0.0 (PWA)</span>
      </div>
      <div class="flex items-center justify-between">
        <span>Local Database</span>
        <span class="font-bold text-slate-700 dark:text-slate-300">Dexie IndexedDB (Offline-Ready)</span>
      </div>
      <div class="flex items-center justify-between">
        <span>Target Timezone</span>
        <span class="font-bold text-slate-700 dark:text-slate-300">Asia/Jakarta (UTC+07:00)</span>
      </div>
      <div class="flex items-center justify-between">
        <span>Domain</span>
        <span class="font-bold text-indigo-600 dark:text-indigo-400">yjsfinance.web.id</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { Bell, Volume2, Cloud, User, RefreshCw } from 'lucide-vue-next';
import { useSettingsStore } from '@/stores/settings.store';
import { useAuthStore } from '@/stores/auth.store';
import { audioService } from '@/services/audio.service';
import { notificationService } from '@/services/notification.service';
import { isSupabaseConfigured } from '@/services/supabase.service';
import { formatDateLong } from '@/utils/date';

const settingsStore = useSettingsStore();
const authStore = useAuthStore();
const isConfigured = isSupabaseConfigured;
const syncing = ref(false);

function testSound() {
  audioService.playConfirmSound();
}

function testNotification() {
  notificationService.showNotification('YJS Scheduler Test', {
    body: 'Browser notifications are working perfectly! 🎉',
  });
}

function formatTime(isoStr: string) {
  try {
    const d = new Date(isoStr);
    return `${formatDateLong(isoStr.split('T')[0])} at ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  } catch {
    return isoStr;
  }
}

async function triggerSync() {
  syncing.value = true;
  await settingsStore.triggerManualSync();
  syncing.value = false;
}
</script>
