<template>
  <div class="space-y-5 max-w-4xl mx-auto">
    <!-- Top Greeting & Date Header -->
    <div class="flex items-center justify-between gap-3 pb-1">
      <div>
        <div class="flex items-center gap-1.5 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-0.5">
          <Sparkles class="w-3.5 h-3.5" />
          <span>{{ greetingText }}</span>
        </div>
        <h1 class="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          {{ formattedToday }}
        </h1>
      </div>

      <!-- Quick Add Action for Mobile / Desktop -->
      <button
        @click="$emit('open-add', { date: todayDateStr })"
        class="inline-flex items-center justify-center gap-1.5 py-2 px-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/20 active:scale-95 transition-all shrink-0"
      >
        <Plus class="w-4 h-4 stroke-[2.5]" />
        <span>Add Task</span>
      </button>
    </div>

    <!-- Overview Stats Pill Grid -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
      <!-- 1. Today Tasks -->
      <div class="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-2xs">
        <div class="text-[11px] text-slate-500 dark:text-slate-400 font-semibold mb-1 flex items-center justify-between">
          <span>Today</span>
          <Clock class="w-3.5 h-3.5 text-indigo-500" />
        </div>
        <div class="text-xl font-black text-slate-900 dark:text-white">
          {{ taskStore.todayTasks.length }}
        </div>
      </div>

      <!-- 2. Completed Today -->
      <div class="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-2xs">
        <div class="text-[11px] text-slate-500 dark:text-slate-400 font-semibold mb-1 flex items-center justify-between">
          <span>Done</span>
          <CheckCircle2 class="w-3.5 h-3.5 text-emerald-500" />
        </div>
        <div class="text-xl font-black text-emerald-600 dark:text-emerald-400">
          {{ taskStore.completedTodayCount }}
        </div>
      </div>

      <!-- 3. Overdue -->
      <div
        class="p-3 rounded-2xl border shadow-2xs transition-colors"
        :class="taskStore.overdueTasks.length > 0 ? 'bg-rose-50/70 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800/80 text-rose-700 dark:text-rose-300' : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800/80'"
      >
        <div class="text-[11px] font-semibold mb-1 flex items-center justify-between" :class="taskStore.overdueTasks.length > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-500 dark:text-slate-400'">
          <span>Overdue</span>
          <AlertCircle class="w-3.5 h-3.5" :class="taskStore.overdueTasks.length > 0 ? 'text-rose-500' : 'text-slate-400'" />
        </div>
        <div class="text-xl font-black" :class="taskStore.overdueTasks.length > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'">
          {{ taskStore.overdueTasks.length }}
        </div>
      </div>

      <!-- 4. Upcoming -->
      <div class="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-2xs">
        <div class="text-[11px] text-slate-500 dark:text-slate-400 font-semibold mb-1 flex items-center justify-between">
          <span>Upcoming</span>
          <CalendarDays class="w-3.5 h-3.5 text-blue-500" />
        </div>
        <div class="text-xl font-black text-slate-900 dark:text-white">
          {{ taskStore.upcomingTasks.length }}
        </div>
      </div>
    </div>

    <!-- Next Scheduled Task Highlight Banner (if any) -->
    <div
      v-if="taskStore.nextScheduledTask"
      @click="selectedTask = taskStore.nextScheduledTask"
      class="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-600 to-indigo-700 text-white shadow-lg shadow-indigo-600/25 cursor-pointer hover:shadow-indigo-600/35 transition-all flex items-center justify-between gap-3 active:scale-[0.99]"
    >
      <div class="flex items-center gap-3">
        <div class="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-white shrink-0">
          <Bell class="w-4 h-4 animate-pulse" />
        </div>
        <div class="min-w-0">
          <span class="text-[10px] font-extrabold uppercase tracking-widest text-indigo-200 block">
            Next Up
          </span>
          <h3 class="text-sm sm:text-base font-bold leading-snug truncate">
            {{ taskStore.nextScheduledTask.title }}
          </h3>
          <p class="text-[11px] text-indigo-100 mt-0.5">
            {{ getRelativeTaskTime(taskStore.nextScheduledTask.task_date, taskStore.nextScheduledTask.start_time) }}
          </p>
        </div>
      </div>
      <ChevronRight class="w-5 h-5 text-indigo-200 shrink-0" />
    </div>

    <!-- Overdue Section (if any) -->
    <div v-if="taskStore.overdueTasks.length > 0" class="space-y-2">
      <div class="flex items-center justify-between px-1">
        <h3 class="text-[11px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
          <AlertCircle class="w-3.5 h-3.5" />
          <span>Needs Attention (Overdue)</span>
        </h3>
        <span class="text-[11px] text-rose-500 font-bold">{{ taskStore.overdueTasks.length }} tasks</span>
      </div>
      <div class="space-y-2">
        <TaskCard
          v-for="task in taskStore.overdueTasks"
          :key="task.id"
          :task="task"
          @select="selectedTask = $event"
          @toggle="taskStore.toggleTask"
        />
      </div>
    </div>

    <!-- Today's Schedule Section -->
    <div class="space-y-2.5">
      <div class="flex items-center justify-between px-1">
        <h3 class="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
          <Calendar class="w-3.5 h-3.5 text-indigo-500" />
          <span>Today's Schedule</span>
        </h3>
        <span class="text-[11px] text-slate-400 font-medium">
          {{ taskStore.todayTasks.filter(t => t.status === 'completed').length }}/{{ taskStore.todayTasks.length }} completed
        </span>
      </div>

      <!-- Empty State for Today -->
      <EmptyState
        v-if="taskStore.todayTasks.length === 0"
        title="No tasks scheduled for today 🎉"
        description="Enjoy your free time or tap below to plan something new for your family."
      >
        <template #action>
          <button
            @click="$emit('open-add', { date: todayDateStr })"
            class="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-xs"
          >
            + Add First Task
          </button>
        </template>
      </EmptyState>

      <!-- Today Tasks List -->
      <div v-else class="space-y-2">
        <TaskCard
          v-for="task in taskStore.todayTasks"
          :key="task.id"
          :task="task"
          @select="selectedTask = $event"
          @toggle="taskStore.toggleTask"
        />
      </div>
    </div>

    <!-- Upcoming Tasks Section -->
    <div v-if="taskStore.upcomingTasks.length > 0" class="space-y-2.5 pt-1">
      <div class="flex items-center justify-between px-1">
        <h3 class="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
          <CalendarDays class="w-3.5 h-3.5 text-blue-500" />
          <span>Upcoming Schedule</span>
        </h3>
        <router-link to="/tasks" class="text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline">View All</router-link>
      </div>

      <div class="space-y-2">
        <TaskCard
          v-for="task in taskStore.upcomingTasks.slice(0, 4)"
          :key="task.id"
          :task="task"
          @select="selectedTask = $event"
          @toggle="taskStore.toggleTask"
        />
      </div>
    </div>

    <!-- Task Detail Modal -->
    <TaskDetailModal
      :task="selectedTask"
      @close="selectedTask = null"
      @edit="handleEdit"
      @toggle="taskStore.toggleTask"
      @delete="taskStore.deleteTask"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import {
  Sparkles,
  Plus,
  Clock,
  CheckCircle2,
  AlertCircle,
  CalendarDays,
  Bell,
  ChevronRight,
  Calendar,
} from 'lucide-vue-next';
import TaskCard from '@/components/tasks/TaskCard.vue';
import TaskDetailModal from '@/components/tasks/TaskDetailModal.vue';
import EmptyState from '@/components/common/EmptyState.vue';
import { useTaskStore } from '@/stores/task.store';
import { useAuthStore } from '@/stores/auth.store';
import { formatDateLong, getTodayDateString, getRelativeTaskTime } from '@/utils/date';
import type { Task } from '@/types/task';

const emit = defineEmits<{
  (e: 'open-add', options?: { task?: Task; date?: string; time?: string }): void;
}>();

const taskStore = useTaskStore();
const authStore = useAuthStore();
const selectedTask = ref<Task | null>(null);

const todayDateStr = getTodayDateString();
const formattedToday = computed(() => formatDateLong(todayDateStr));

const greetingText = computed(() => {
  const hour = new Date().getHours();
  const name = authStore.userDisplayName;
  if (hour < 12) return `Good Morning, ${name} 👋`;
  if (hour < 18) return `Good Afternoon, ${name} 👋`;
  return `Good Evening, ${name} 👋`;
});

function handleEdit(task: Task) {
  selectedTask.value = null;
  emit('open-add', { task });
}
</script>
