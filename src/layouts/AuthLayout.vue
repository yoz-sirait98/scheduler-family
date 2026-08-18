<template>
  <div class="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 sm:p-6 transition-colors">
    <div class="w-full max-w-md">
      <!-- Logo Header -->
      <div class="text-center mb-8">
        <div class="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25 mx-auto mb-3">
          <CalendarCheck class="w-6 h-6" />
        </div>
        <h1 class="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          YJS <span class="text-indigo-600 dark:text-indigo-400 font-bold">Scheduler</span>
        </h1>
        <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Personal & Family Scheduler with Offline Reminders
        </p>
      </div>

      <!-- Content Box -->
      <div class="bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200/80 dark:border-slate-800/80 p-6 sm:p-8">
        <router-view />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { CalendarCheck } from 'lucide-vue-next';
</script>
