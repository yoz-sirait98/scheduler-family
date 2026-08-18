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

    <!-- 1. PWA App Installation Card -->
    <div class="p-4 rounded-3xl bg-gradient-to-r from-indigo-900 via-indigo-950 to-slate-900 text-white shadow-md border border-indigo-500/30 space-y-3">
      <div class="flex items-center justify-between gap-3">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-md shrink-0">
            <Smartphone class="w-5 h-5" />
          </div>
          <div>
            <h3 class="text-xs font-bold">
              Install App on Phone / Desktop (PWA)
            </h3>
            <p class="text-[11px] text-indigo-200">
              {{ isStandalone ? '✓ App is already installed and running in standalone mode' : 'Run full-screen with offline support and alarm chimes' }}
            </p>
          </div>
        </div>

        <button
          v-if="!isStandalone && deferredPrompt"
          @click="handleInstallClick"
          class="px-3.5 py-1.5 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white text-xs font-bold shadow-xs active:scale-95 transition-all shrink-0"
        >
          Install Now
        </button>
      </div>

      <!-- Android & iOS Instructions if not already standalone -->
      <div v-if="!isStandalone" class="pt-2 border-t border-indigo-800/60 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-indigo-200">
        <div class="p-2.5 rounded-xl bg-white/5 border border-white/10 space-y-1">
          <strong class="text-white flex items-center gap-1">
            <span>🤖 Android (Chrome):</span>
          </strong>
          <p>Tap the <strong>3 dots (⋮)</strong> in Chrome menu -> tap <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong>.</p>
        </div>
        <div class="p-2.5 rounded-xl bg-white/5 border border-white/10 space-y-1">
          <strong class="text-white flex items-center gap-1">
            <span>🍏 iPhone (Safari):</span>
          </strong>
          <p>Tap <strong>Share (⎋)</strong> at the bottom of Safari -> tap <strong>"Add to Home Screen" (⊞)</strong>.</p>
        </div>
      </div>
    </div>

    <!-- 2. Notification & Alarm Preferences -->
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

    <!-- 3. Synchronization & Supabase Cloud Status -->
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

    <!-- 4. Google Calendar Integration (Phase 2) -->
    <div class="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-2xs space-y-3">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2.5">
          <div class="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
            <Calendar class="w-4 h-4" />
          </div>
          <div>
            <h3 class="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <span>Google Calendar Integration</span>
              <span
                class="px-2 py-0.2 rounded-full text-[9px] font-extrabold uppercase tracking-wider"
                :class="googleStore.isConnected ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'"
              >
                {{ googleStore.isConnected ? (googleStore.account?.isMock ? 'Demo Mode' : 'Connected') : 'Disconnected' }}
              </span>
            </h3>
            <p class="text-[11px] text-slate-500">Two-way event synchronization with Google Calendar</p>
          </div>
        </div>

        <!-- Disconnect / Settings icon -->
        <button
          v-if="googleStore.isConnected"
          @click="googleStore.disconnect()"
          class="px-2.5 py-1 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 text-[11px] font-bold transition-colors"
        >
          Disconnect
        </button>
      </div>

      <!-- NOT CONNECTED STATE -->
      <div v-if="!googleStore.isConnected" class="space-y-2.5 pt-1">
        <div class="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 space-y-3">
          <p class="text-[11px] leading-relaxed">
            Link your Google Calendar to sync family events both ways. Tasks created in YJS Scheduler will appear in Google Calendar, and your Google events will sync to YJS Scheduler.
          </p>

          <div class="flex flex-wrap items-center gap-2 pt-1">
            <!-- Connect with Google OAuth -->
            <button
              @click="handleGoogleConnect"
              :disabled="isGoogleConnecting"
              class="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-xs active:scale-95 transition-all flex items-center gap-2"
            >
              <svg class="w-3.5 h-3.5" viewBox="0 0 24 24">
                <path fill="#EA4335" d="M12 5c1.54 0 2.93.57 4.02 1.5l3.01-3.01C17.2 1.77 14.77 1 12 1 7.42 1 3.53 3.59 1.63 7.36l3.66 2.84C6.18 7.35 8.84 5 12 5z" />
                <path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58l3.71 2.88c2.16-2 3.71-4.94 3.71-8.7z" />
                <path fill="#FBBC05" d="M5.29 14.8c-.24-.72-.38-1.49-.38-2.3s.14-1.58.38-2.3L1.63 7.36C.59 9.44 0 11.66 0 14s.59 4.56 1.63 6.64l3.66-2.84z" />
                <path fill="#34A853" d="M12 23c3.24 0 5.95-1.08 7.93-2.91l-3.71-2.88c-1.07.72-2.45 1.16-4.22 1.16-3.16 0-5.82-2.35-6.71-5.2L1.63 15.99C3.53 19.41 7.42 23 12 23z" />
              </svg>
              <span>{{ isGoogleConnecting ? 'Connecting...' : 'Connect Google Calendar' }}</span>
            </button>

            <!-- One-Click Demo Mode -->
            <button
              @click="handleEnableMock"
              class="px-3 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 text-xs font-semibold active:scale-95 transition-all"
            >
              ⚡ Try Demo Simulator
            </button>

            <!-- Configure Client ID button -->
            <button
              @click="showClientIdModal = true"
              class="px-2.5 py-2 rounded-xl text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 text-xs underline font-medium"
            >
              Configure Client ID
            </button>
          </div>

          <div v-if="googleStore.errorMessage" class="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-[11px] text-rose-600 dark:text-rose-400">
            {{ googleStore.errorMessage }}
          </div>
        </div>
      </div>

      <!-- CONNECTED STATE -->
      <div v-else class="space-y-3 pt-1">
        <!-- Connected Account Card -->
        <div class="flex items-center justify-between p-3 rounded-2xl bg-blue-50/50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/60">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden shadow-xs">
              <img v-if="googleStore.account?.picture" :src="googleStore.account.picture" alt="Avatar" class="w-full h-full object-cover" />
              <span v-else>{{ googleStore.account?.name?.charAt(0) || 'G' }}</span>
            </div>
            <div>
              <h4 class="text-xs font-bold text-slate-900 dark:text-white">
                {{ googleStore.account?.name }}
              </h4>
              <span class="text-[10px] text-slate-500">
                {{ googleStore.account?.email }}
              </span>
            </div>
          </div>

          <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
            OAuth 2.0 Active
          </span>
        </div>

        <!-- Target Calendar Selector -->
        <div class="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-2">
          <div class="flex items-center justify-between">
            <label class="text-xs font-bold text-slate-800 dark:text-slate-200">
              Target Sync Calendar:
            </label>
            <button
              @click="googleStore.refreshCalendars()"
              class="text-[10px] text-blue-600 dark:text-blue-400 hover:underline font-semibold"
            >
              Refresh Lists
            </button>
          </div>

          <select
            :value="googleStore.selectedCalendarId"
            @change="handleCalendarChange"
            class="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="primary">Primary (Default Calendar)</option>
            <option
              v-for="cal in googleStore.calendars.filter(c => c.id !== 'primary')"
              :key="cal.id"
              :value="cal.id"
            >
              {{ cal.summary }} {{ cal.primary ? '(Primary)' : '' }}
            </option>
          </select>
        </div>

        <!-- Auto Sync Toggle -->
        <div class="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
          <div>
            <span class="text-xs font-bold text-slate-800 dark:text-slate-200 block">
              Auto-Sync with Google
            </span>
            <span class="text-[10px] text-slate-500">Automatically push new tasks and updates to Google Calendar</span>
          </div>

          <button
            @click="googleStore.toggleAutoSync()"
            class="relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none"
            :class="googleStore.autoSyncEnabled ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'"
          >
            <span
              class="pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out"
              :class="googleStore.autoSyncEnabled ? 'translate-x-5' : 'translate-x-0'"
            ></span>
          </button>
        </div>

        <!-- Sync Action & Stats -->
        <div class="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
          <div>
            <div class="flex items-center gap-1.5">
              <span class="text-xs font-bold text-slate-800 dark:text-slate-200">Sync Status:</span>
              <span class="text-[10px] font-semibold text-slate-500">
                {{ googleStore.lastSyncStats ? `Last synced ${formatTime(googleStore.lastSyncStats.lastSyncedAt)}` : 'Not synced yet' }}
              </span>
            </div>
            <p v-if="googleStore.lastSyncStats" class="text-[10px] text-blue-600 dark:text-blue-400 mt-0.5">
              ✓ {{ googleStore.lastSyncStats.eventsImported }} imported, {{ googleStore.lastSyncStats.tasksExported }} exported, {{ googleStore.lastSyncStats.eventsUpdated }} updated
            </p>
          </div>

          <button
            @click="triggerGoogleSync"
            :disabled="googleStore.isSyncing"
            class="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-xs disabled:opacity-50 flex items-center gap-1.5 active:scale-95 transition-all shrink-0"
          >
            <RefreshCw class="w-3.5 h-3.5" :class="{ 'animate-spin': googleStore.isSyncing }" />
            <span>{{ googleStore.isSyncing ? 'Syncing...' : 'Sync with Google' }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- 5. Account & Family Profile -->
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

    <!-- 6. App Info & Specs -->
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

    <!-- Client ID Configuration Modal -->
    <div v-if="showClientIdModal" class="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div class="fixed inset-0" @click="showClientIdModal = false"></div>
      <div class="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 z-10 p-5 space-y-4">
        <div class="flex items-center justify-between">
          <h3 class="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Calendar class="w-4 h-4 text-blue-600" />
            <span>Google OAuth Client ID</span>
          </h3>
          <button @click="showClientIdModal = false" class="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <X class="w-4 h-4" />
          </button>
        </div>

        <p class="text-xs text-slate-500 leading-relaxed">
          Enter your Google OAuth 2.0 Web Client ID from the
          <a href="https://console.cloud.google.com/apis/credentials" target="_blank" class="text-blue-600 underline">Google Cloud Console</a>.
          Make sure to add <code class="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px]">https://yjsfinance.web.id</code> and <code class="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px]">http://localhost:5173</code> to Authorized JavaScript Origins.
        </p>

        <div>
          <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
            Google Client ID
          </label>
          <input
            v-model="tempClientId"
            type="text"
            placeholder="e.g. 123456789-xxxxxx.apps.googleusercontent.com"
            class="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        <div class="flex items-center justify-end gap-2 pt-2">
          <button
            @click="showClientIdModal = false"
            class="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300"
          >
            Cancel
          </button>
          <button
            @click="saveClientId"
            class="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-xs active:scale-95 transition-all"
          >
            Save Client ID
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { Smartphone, Bell, Volume2, Cloud, User, RefreshCw, Calendar, X } from 'lucide-vue-next';
import { useSettingsStore } from '@/stores/settings.store';
import { useAuthStore } from '@/stores/auth.store';
import { useTaskStore } from '@/stores/task.store';
import { useGoogleCalendarStore } from '@/stores/google-calendar.store';
import { usePwaInstall } from '@/composables/usePwaInstall';
import { audioService } from '@/services/audio.service';
import { notificationService } from '@/services/notification.service';
import { isSupabaseConfigured } from '@/services/supabase.service';
import { formatDateLong } from '@/utils/date';

const settingsStore = useSettingsStore();
const authStore = useAuthStore();
const taskStore = useTaskStore();
const googleStore = useGoogleCalendarStore();
const { deferredPrompt, isStandalone, promptInstall } = usePwaInstall();
const isConfigured = isSupabaseConfigured;
const syncing = ref(false);
const isGoogleConnecting = ref(false);
const showClientIdModal = ref(false);
const tempClientId = ref(googleStore.clientId);

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

async function handleInstallClick() {
  await promptInstall();
}

async function handleGoogleConnect() {
  isGoogleConnecting.value = true;
  const ok = await googleStore.connect();
  if (ok) {
    // Run initial sync after successful connect
    await triggerGoogleSync();
  }
  isGoogleConnecting.value = false;
}

function handleEnableMock() {
  googleStore.connectMock();
  triggerGoogleSync();
}

function handleCalendarChange(e: Event) {
  const target = e.target as HTMLSelectElement;
  googleStore.setSelectedCalendar(target.value);
}

async function triggerGoogleSync() {
  const stats = await googleStore.syncNow(authStore.currentUserId);
  if (stats) {
    // Reload tasks in taskStore to show imported events immediately
    await taskStore.loadTasks();
  }
}

function saveClientId() {
  googleStore.updateClientId(tempClientId.value);
  showClientIdModal.value = false;
}
</script>
