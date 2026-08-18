<template>
  <div v-if="task" class="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
    <!-- Backdrop -->
    <div class="fixed inset-0" @click="$emit('close')"></div>

    <!-- Dialog -->
    <div class="relative w-full sm:max-w-md bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 z-10 pb-[env(safe-area-inset-bottom,24px)] animate-in fade-in zoom-in-95 duration-150">
      <!-- Sheet Handle -->
      <div class="sm:hidden w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mb-4"></div>

      <!-- Header & Badges -->
      <div class="flex items-start justify-between gap-3 mb-4">
        <div class="flex items-center gap-2 flex-wrap">
          <!-- Priority Badge -->
          <span
            class="px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider"
            :class="priorityBadgeClass"
          >
            {{ task.priority }} Priority
          </span>

          <!-- Category Badge -->
          <span
            v-if="task.category"
            class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
            :style="{
              backgroundColor: `${task.category.color}18`,
              color: task.category.color,
            }"
          >
            <CategoryIcon :name="task.category.icon" size="sm" />
            <span>{{ task.category.name }}</span>
          </span>
        </div>

        <button
          @click="$emit('close')"
          class="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- Task Title -->
      <h2
        class="text-xl font-bold text-slate-900 dark:text-white mb-2"
        :class="{ 'line-through text-slate-400': task.status === 'completed' }"
      >
        {{ task.title }}
      </h2>

      <!-- Description -->
      <p v-if="task.description" class="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-line mb-5 leading-relaxed bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800">
        {{ task.description }}
      </p>

      <!-- Details List -->
      <div class="space-y-3 mb-6 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 text-sm">
        <!-- Date -->
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2 text-slate-500 dark:text-slate-400">
            <Calendar class="w-4 h-4" />
            <span>Date</span>
          </div>
          <span class="font-medium text-slate-800 dark:text-slate-200">{{ formattedDate }}</span>
        </div>

        <!-- Time -->
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2 text-slate-500 dark:text-slate-400">
            <Clock class="w-4 h-4" />
            <span>Time</span>
          </div>
          <span class="font-medium text-slate-800 dark:text-slate-200">
            {{ task.is_all_day ? 'All Day' : (task.start_time ? `${task.start_time}${task.end_time ? ' - ' + task.end_time : ''}` : 'Any time') }}
          </span>
        </div>

        <!-- Reminder -->
        <div v-if="task.reminders && task.reminders.length > 0" class="flex items-center justify-between">
          <div class="flex items-center gap-2 text-slate-500 dark:text-slate-400">
            <Bell class="w-4 h-4 text-indigo-500" />
            <span>Reminder</span>
          </div>
          <span class="font-medium text-indigo-600 dark:text-indigo-400">
            {{ task.reminders[0].minutes_before === 0 ? 'At start time' : `${task.reminders[0].minutes_before} minutes before` }}
          </span>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="grid grid-cols-3 gap-2 pt-2">
        <button
          @click="$emit('toggle', task.id)"
          class="flex items-center justify-center gap-1.5 py-3 px-3 rounded-xl font-medium text-xs border transition-all active:scale-95"
          :class="task.status === 'completed'
            ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200'
            : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200'"
        >
          <CheckCircle2 class="w-4 h-4" />
          <span>{{ task.status === 'completed' ? 'Uncheck' : 'Complete' }}</span>
        </button>

        <button
          @click="$emit('edit', task)"
          class="flex items-center justify-center gap-1.5 py-3 px-3 rounded-xl font-medium text-xs bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 transition-all active:scale-95"
        >
          <Edit3 class="w-4 h-4" />
          <span>Edit</span>
        </button>

        <button
          @click="handleDelete"
          class="flex items-center justify-center gap-1.5 py-3 px-3 rounded-xl font-medium text-xs bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 transition-all active:scale-95"
        >
          <Trash2 class="w-4 h-4" />
          <span>Delete</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { X, Calendar, Clock, Bell, CheckCircle2, Edit3, Trash2 } from 'lucide-vue-next';
import CategoryIcon from '@/components/common/CategoryIcon.vue';
import { formatDateLong } from '@/utils/date';
import type { Task } from '@/types/task';

const props = defineProps<{
  task: Task | null;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'edit', task: Task): void;
  (e: 'toggle', taskId: string): void;
  (e: 'delete', taskId: string): void;
}>();

const formattedDate = computed(() => {
  return props.task ? formatDateLong(props.task.task_date) : '';
});

const priorityBadgeClass = computed(() => {
  switch (props.task?.priority) {
    case 'urgent':
      return 'bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200';
    case 'high':
      return 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200';
    case 'low':
      return 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200';
    case 'medium':
    default:
      return 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200';
  }
});

function handleDelete() {
  if (!props.task) return;
  if (confirm(`Are you sure you want to delete "${props.task.title}"?`)) {
    emit('delete', props.task.id);
    emit('close');
  }
}
</script>
