<template>
  <nav class="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-t border-slate-200/80 dark:border-slate-800/80 pb-[env(safe-area-inset-bottom,8px)] transition-all">
    <div class="flex items-center justify-around px-2 py-1.5 max-w-lg mx-auto">
      <!-- 1. Today / Dashboard -->
      <router-link
        to="/dashboard"
        class="flex flex-col items-center justify-center flex-1 py-1 text-xs font-medium transition-colors"
        :class="isActive('/dashboard') ? 'text-indigo-600 dark:text-indigo-400 font-semibold' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'"
      >
        <div class="relative p-1 rounded-xl" :class="isActive('/dashboard') ? 'bg-indigo-50 dark:bg-indigo-950/60' : ''">
          <Clock class="w-5 h-5" />
          <span v-if="hasTodayPending" class="absolute top-0.5 right-0.5 w-2 h-2 rounded-full bg-indigo-600 ring-2 ring-white dark:ring-slate-900"></span>
        </div>
        <span class="mt-0.5">Today</span>
      </router-link>

      <!-- 2. Calendar -->
      <router-link
        to="/calendar"
        class="flex flex-col items-center justify-center flex-1 py-1 text-xs font-medium transition-colors"
        :class="isActive('/calendar') ? 'text-indigo-600 dark:text-indigo-400 font-semibold' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'"
      >
        <div class="p-1 rounded-xl" :class="isActive('/calendar') ? 'bg-indigo-50 dark:bg-indigo-950/60' : ''">
          <CalendarDays class="w-5 h-5" />
        </div>
        <span class="mt-0.5">Calendar</span>
      </router-link>

      <!-- 3. Center Quick Add Button (+) -->
      <div class="flex flex-col items-center justify-center px-2">
        <button
          @click="$emit('open-add')"
          class="w-12 h-12 -mt-5 rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white flex items-center justify-center shadow-lg shadow-indigo-500/35 active:scale-90 transition-all border-2 border-white dark:border-slate-900"
          title="Add New Task"
          aria-label="Add New Task"
        >
          <Plus class="w-6 h-6 stroke-[2.5]" />
        </button>
      </div>

      <!-- 4. Tasks List -->
      <router-link
        to="/tasks"
        class="flex flex-col items-center justify-center flex-1 py-1 text-xs font-medium transition-colors"
        :class="isActive('/tasks') ? 'text-indigo-600 dark:text-indigo-400 font-semibold' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'"
      >
        <div class="relative p-1 rounded-xl" :class="isActive('/tasks') ? 'bg-indigo-50 dark:bg-indigo-950/60' : ''">
          <CheckSquare class="w-5 h-5" />
          <span v-if="overdueCount > 0" class="absolute top-0.5 right-0.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white dark:ring-slate-900"></span>
        </div>
        <span class="mt-0.5">Tasks</span>
      </router-link>

      <!-- 5. Categories / Settings -->
      <router-link
        to="/settings"
        class="flex flex-col items-center justify-center flex-1 py-1 text-xs font-medium transition-colors"
        :class="isActive('/settings') ? 'text-indigo-600 dark:text-indigo-400 font-semibold' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'"
      >
        <div class="p-1 rounded-xl" :class="isActive('/settings') ? 'bg-indigo-50 dark:bg-indigo-950/60' : ''">
          <Settings class="w-5 h-5" />
        </div>
        <span class="mt-0.5">Settings</span>
      </router-link>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { Clock, CalendarDays, Plus, CheckSquare, Settings } from 'lucide-vue-next';
import { useTaskStore } from '@/stores/task.store';

defineEmits<{
  (e: 'open-add'): void;
}>();

const route = useRoute();
const taskStore = useTaskStore();

const isActive = (path: string) => {
  if (path === '/dashboard' && route.path === '/') return true;
  return route.path.startsWith(path);
};

const hasTodayPending = computed(() => {
  return taskStore.todayTasks.some((t) => t.status === 'pending');
});

const overdueCount = computed(() => {
  return taskStore.overdueTasks.length;
});
</script>
