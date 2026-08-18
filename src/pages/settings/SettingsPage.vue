<template>
  <div class="space-y-6 max-w-3xl mx-auto">
    <!-- Header -->
    <div class="pb-2 border-b border-slate-200/80 dark:border-slate-800/80">
      <h1 class="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
        Settings & Preferences
      </h1>
      <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
        Configure notifications, family profile, sync status, and sound preferences
      </p>
    </div>

    <!-- 1. Notification & Alarm Preferences -->
    <div class="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-2xs space-y-4">
      <div class="flex items-center gap-3">
        <div class="p-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
          <Bell class="w-5 h-5" />
        </div>
        <div>
          <h3 class="text-sm font-bold text-slate-900 dark:text-white">
            Notifications & Alarms
          </h3>
          <p class="text-xs text-slate-500">Manage browser alerts and reminder audio chime</p>
        </div>
      </div>

      <div class="space-y-3 pt-2">
        <!-- Permission State -->
        <div class="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
          <div>
            <span class="text-xs font-semibold text-slate-800 dark:text-slate-200 block">
              Browser Notification Permission
            </span>
            <span class="text-[11px] text-slate-500 capitalize">
              Status: <strong class="text-indigo-600 dark:text-indigo-400">{{ settingsStore.notificationPermission }}</strong>
            </span>
          </div>

          <button
            v-if="settingsStore.notificationPermission !== 'granted'"
            @click="settingsStore.requestNotificationPermission()"
            class="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-xs"
          >
            Enable
          </button>
          <button
            v-else
            @click="testNotification"
            class="px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-800 dark:text-slate-200 text-xs font-medium"
          >
            Test Notification
          </button>
        </div>

        <!-- Sound Chime Toggle & Test -->
        <div class="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
          <div>
            <span class="text-xs font-semibold text-slate-800 dark:text-slate-200 block">
              Alarm Sound & Chimes
            </span>
            <span class="text-[11px] text-slate-500">Play pleasant synthesized audio chime when reminders fire</span>
          </div>

          <div class="flex items-center gap-2">
            <button
              @click="testSound"
              class="px-2.5 py-1 rounded-lg text-xs font-medium text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40"
              title="Test Sound"
            >
              <Volume2 class="w-4 h-4" />
            </button>
            <button
              @click="settingsStore.toggleSound()"
              class="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none"
              :class="settingsStore.soundEnabled ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'"
            >
              <span
                class="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"
                :class="settingsStore.soundEnabled ? 'translate-x-5' : 'translate-x-0'"
              ></span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 2. Synchronization & Supabase Cloud Status -->
    <div class="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-2xs space-y-4">
      <div class="flex items-center gap-3">
        <div class="p-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
          <Cloud class="w-5 h-5" />
        </div>
        <div>
          <h3 class="text-sm font-bold text-slate-900 dark:text-white">
            Cloud Sync & Persistence
          </h3>
          <p class="text-xs text-slate-500">Offline-first local IndexedDB & Supabase cloud backup</p>
        </div>
      </div>

      <div class="space-y-3 pt-2">
        <div class="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
          <div>
            <div class="flex items-center gap-2">
              <span class="text-xs font-semibold text-slate-800 dark:text-slate-200">Supabase Connection:</span>
              <span
                class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold"
                :class="isConfigured ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300' : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'"
              >
                {{ isConfigured ? 'Connected' : 'Local Offline Mode' }}
              </span>
            </div>
            <p class="text-[11px] text-slate-500 mt-1">
              Last synced: {{ settingsStore.syncStatus.lastSyncedAt ? formatTime(settingsStore.syncStatus.lastSyncedAt) : 'Never (running locally)' }}
            </p>
          </div>

          <button
            @click="triggerSync"
            :disabled="syncing"
            class="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-xs disabled:opacity-50 flex items-center gap-1.5"
          >
            <RefreshCw class="w-3.5 h-3.5" :class="{ 'animate-spin': syncing }" />
            <span>{{ syncing ? 'Syncing...' : 'Sync Now' }}</span>
          </button>
        </div>

        <div v-if="!isConfigured" class="p-3.5 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900 text-xs text-slate-600 dark:text-slate-300 space-y-1.5">
          <p class="font-semibold text-indigo-900 dark:text-indigo-200 flex items-center gap-1.5">
            <Info class="w-4 h-4" />
            <span>How to Connect Cloud Sync</span>
          </p>
          <p>
            1. Copy <code class="px-1 py-0.5 rounded bg-white dark:bg-slate-800 font-mono text-[11px]">supabase/schema.sql</code> into your Supabase SQL Editor.
          </p>
          <p>
            2. Add your project URL and Anon Key into <code class="px-1 py-0.5 rounded bg-white dark:bg-slate-800 font-mono text-[11px]">.env</code> or environment variables.
          </p>
        </div>
      </div>
    </div>

    <!-- 3. Account & Family Profile -->
    <div class="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-2xs space-y-4">
      <div class="flex items-center gap-3">
        <div class="p-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
          <User class="w-5 h-5" />
        </div>
        <div>
          <h3 class="text-sm font-bold text-slate-900 dark:text-white">
            Family Profile
          </h3>
          <p class="text-xs text-slate-500">Current active user and account management</p>
        </div>
      </div>

      <div class="space-y-3 pt-2">
        <div class="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
          <div>
            <h4 class="text-sm font-bold text-slate-900 dark:text-white">
              {{ authStore.userDisplayName }}
            </h4>
            <span class="text-xs text-slate-500">
              {{ authStore.user?.email || 'Local Family Member (No Cloud Account)' }}
            </span>
          </div>

          <div v-if="authStore.user">
            <button
              @click="authStore.logout()"
              class="px-3 py-1.5 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-semibold transition-colors"
            >
              Sign Out
            </button>
          </div>
          <div v-else class="flex items-center gap-2">
            <router-link
              to="/login"
              class="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors"
            >
              Sign In
            </router-link>
          </div>
        </div>
      </div>
    </div>

    <!-- 4. App Info & PWA -->
    <div class="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-2xs text-xs text-slate-500 dark:text-slate-400 space-y-2">
      <div class="flex items-center justify-between">
        <span>Application Version</span>
        <span class="font-semibold text-slate-700 dark:text-slate-300">YJS Scheduler v1.0.0 (PWA)</span>
      </div>
      <div class="flex items-center justify-between">
        <span>Local Database</span>
        <span class="font-semibold text-slate-700 dark:text-slate-300">Dexie IndexedDB (Offline-Ready)</span>
      </div>
      <div class="flex items-center justify-between">
        <span>Target Timezone</span>
        <span class="font-semibold text-slate-700 dark:text-slate-300">Asia/Jakarta (UTC+07:00)</span>
      </div>
      <div class="flex items-center justify-between">
        <span>Domain</span>
        <span class="font-semibold text-indigo-600 dark:text-indigo-400">yjsfinance.web.id</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { Bell, Volume2, Cloud, User, RefreshCw, Info } from 'lucide-vue-next';
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
