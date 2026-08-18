<template>
  <div class="space-y-6 max-w-4xl mx-auto">
    <!-- Top Greeting & Date Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2">
      <div>
        <div class="flex items-center gap-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-0.5">
          <Sparkles class="w-3.5 h-3.5" />
          <span>{{ greetingText }}</span>
        </div>
        <h1 class="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          {{ formattedToday }}
        </h1>
      </div>

      <!-- Quick Add Action for Mobile / Desktop -->
      <button
        @click="$emit('open-add', { date: todayDateStr })"
        class="inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-md shadow-indigo-600/20 active:scale-95 transition-all self-start sm:self-auto"
      >
        <Plus class="w-4 h-4 stroke-[2.5]" />
        <span>Add Task</span>
      </button>
    </div>

    <!-- Overview Stats Pill Grid -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <!-- 1. Today Tasks -->
      <div class="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-2xs">
        <div class="text-xs text-slate-500 dark:text-slate-400 font-medium mb-1 flex items-center justify-between">
          <span>Today</span>
          <Clock class="w-3.5 h-3.5 text-indigo-500" />
        </div>
        <div class="text-xl font-extrabold text-slate-900 dark:text-white">
          {{ taskStore.todayTasks.length }}
        </div>
      </div>

      <!-- 2. Completed Today -->
      <div class="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-2xs">
        <div class="text-xs text-slate-500 dark:text-slate-400 font-medium mb-1 flex items-center justify-between">
          <span>Done Today</span>
          <CheckCircle2 class="w-3.5 h-3.5 text-emerald-500" />
        </div>
        <div class="text-xl font-extrabold text-emerald-600 dark:text-emerald-400">
          {{ taskStore.completedTodayCount }}
        </div>
      </div>

      <!-- 3. Overdue -->
      <div
        class="p-3.5 rounded-2xl border shadow-2xs transition-colors"
        :class="taskStore.overdueTasks.length > 0 ? 'bg-rose-50/70 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800/80 text-rose-700 dark:text-rose-300' : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800/80'"
      >
        <div class="text-xs font-medium mb-1 flex items-center justify-between" :class="taskStore.overdueTasks.length > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-500 dark:text-slate-400'">
          <span>Overdue</span>
          <AlertCircle class="w-3.5 h-3.5" :class="taskStore.overdueTasks.length > 0 ? 'text-rose-500' : 'text-slate-400'" />
        </div>
        <div class="text-xl font-extrabold" :class="taskStore.overdueTasks.length > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'">
          {{ taskStore.overdueTasks.length }}
        </div>
      </div>

      <!-- 4. Upcoming -->
      <div class="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-2xs">
        <div class="text-xs text-slate-500 dark:text-slate-400 font-medium mb-1 flex items-center justify-between">
          <span>Upcoming</span>
          <CalendarDays class="w-3.5 h-3.5 text-blue-500" />
        </div>
        <div class="text-xl font-extrabold text-slate-900 dark:text-white">
          {{ taskStore.upcomingTasks.length }}
        </div>
      </div>
    </div>

    <!-- Next Scheduled Task Highlight Banner (if any) -->
    <div
      v-if="taskStore.nextScheduledTask"
      @click="selectedTask = taskStore.nextScheduledTask"
      class="p-4 rounded-3xl bg-gradient-to-r from-indigo-600 via-indigo-600 to-indigo-700 text-white shadow-lg shadow-indigo-600/25 cursor-pointer hover:shadow-indigo-600/35 transition-all flex items-center justify-between gap-4"
    >
      <div class="flex items-center gap-3.5">
        <div class="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-white shrink-0">
          <Bell class="w-5 h-5 animate-pulse" />
        </div>
        <div>
          <span class="text-[11px] font-bold uppercase tracking-widest text-indigo-200">
            Next Up
          </span>
          <h3 class="text-base sm:text-lg font-bold leading-tight line-clamp-1">
            {{ taskStore.nextScheduledTask.title }}
          </h3>
          <p class="text-xs text-indigo-100 mt-0.5">
            {{ getRelativeTaskTime(taskStore.nextScheduledTask.task_date, taskStore.nextScheduledTask.start_time) }}
          </p>
        </div>
      </div>
      <ChevronRight class="w-5 h-5 text-indigo-200 shrink-0" />
    </div>

    <!-- Overdue Section (if any) -->
    <div v-if="taskStore.overdueTasks.length > 0" class="space-y-2">
      <div class="flex items-center justify-between px-1">
        <h3 class="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
          <AlertCircle class="w-3.5 h-3.5" />
          <span>Needs Attention (Overdue)</span>
        </h3>
        <span class="text-xs text-rose-500 font-semibold">{{ taskStore.overdueTasks.length }} tasks</span>
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
    <div class="space-y-3">
      <div class="flex items-center justify-between px-1">
        <h3 class="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
          <Calendar class="w-3.5 h-3.5 text-indigo-500" />
          <span>Today's Schedule</span>
        </h3>
        <span class="text-xs text-slate-400 font-medium">
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
    <div v-if="taskStore.upcomingTasks.length > 0" class="space-y-3 pt-2">
      <div class="flex items-center justify-between px-1">
        <h3 class="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
          <CalendarDays class="w-3.5 h-3.5 text-blue-500" />
          <span>Upcoming Schedule</span>
        </h3>
        <router-link to="/tasks" class="text-xs text-indigo-600 hover:underline">View All</router-link>
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
