<template>
  <div
    @click="$emit('select', task)"
    class="group relative flex items-start gap-3.5 p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 hover:border-indigo-300 dark:hover:border-indigo-700/60 shadow-xs hover:shadow-md transition-all cursor-pointer active:scale-[0.99]"
    :class="{
      'opacity-60 bg-slate-50/60 dark:bg-slate-900/40': task.status === 'completed',
      'border-l-4 border-l-rose-500': isOverdue && task.status !== 'completed',
      'border-l-4 border-l-purple-500': task.priority === 'urgent' && !isOverdue,
      'border-l-4 border-l-amber-500': task.priority === 'high' && !isOverdue,
    }"
  >
    <!-- Toggle Complete Checkbox -->
    <button
      type="button"
      @click.stop="handleToggle"
      class="mt-0.5 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all shrink-0 active:scale-90"
      :class="task.status === 'completed'
        ? 'bg-emerald-500 border-emerald-500 text-white'
        : 'border-slate-300 dark:border-slate-600 hover:border-indigo-500 bg-white dark:bg-slate-800 text-transparent'"
      title="Toggle Complete"
      :aria-label="task.status === 'completed' ? 'Mark Incomplete' : 'Mark Complete'"
    >
      <Check class="w-3.5 h-3.5 stroke-[3]" />
    </button>

    <!-- Task Main Content -->
    <div class="flex-1 min-w-0">
      <div class="flex items-center gap-2 mb-1 flex-wrap">
        <!-- Title -->
        <h4
          class="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate flex-1"
          :class="{ 'line-through text-slate-400 dark:text-slate-500 font-normal': task.status === 'completed' }"
        >
          {{ task.title }}
        </h4>

        <!-- Category Chip -->
        <span
          v-if="task.category"
          class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium shrink-0"
          :style="{
            backgroundColor: `${task.category.color}15`,
            color: task.category.color,
            borderColor: `${task.category.color}30`
          }"
        >
          <CategoryIcon :name="task.category.icon" size="sm" />
          <span>{{ task.category.name }}</span>
        </span>
      </div>

      <!-- Optional Description Preview -->
      <p
        v-if="task.description"
        class="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mb-2"
        :class="{ 'line-through text-slate-400': task.status === 'completed' }"
      >
        {{ task.description }}
      </p>

      <!-- Meta Row: Date/Time, Reminder, Overdue Pill -->
      <div class="flex items-center gap-2.5 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
        <!-- Time badge -->
        <div class="flex items-center gap-1">
          <Clock class="w-3.5 h-3.5 text-slate-400" />
          <span v-if="task.is_all_day" class="font-medium text-slate-600 dark:text-slate-300">All Day</span>
          <span v-else-if="task.start_time" class="font-medium text-slate-700 dark:text-slate-200">
            {{ formatTimeString(task.start_time) }}
            <span v-if="task.end_time"> - {{ formatTimeString(task.end_time) }}</span>
          </span>
          <span v-else>Any time</span>
        </div>

        <!-- Relative date indicator if not viewing today -->
        <span v-if="!isToday" class="text-slate-400 dark:text-slate-500">
          • {{ formattedDate }}
        </span>

        <!-- Reminder Bell -->
        <div
          v-if="task.reminders && task.reminders.length > 0"
          class="flex items-center gap-0.5 text-indigo-600 dark:text-indigo-400 font-medium"
          title="Has active reminder"
        >
          <Bell class="w-3 h-3" />
          <span v-if="task.reminders[0].minutes_before > 0">{{ task.reminders[0].minutes_before }}m</span>
        </div>

        <!-- Google Calendar badge indicator -->
        <div
          v-if="task.external_provider === 'google'"
          class="flex items-center gap-0.5 text-blue-600 dark:text-blue-400 font-semibold text-[10px]"
          title="Synced with Google Calendar"
        >
          <CalendarSync class="w-3 h-3 text-blue-500" />
          <span>G-Cal</span>
        </div>

        <!-- Overdue Badge -->
        <span
          v-if="isOverdue && task.status !== 'completed'"
          class="px-1.5 py-0.2 rounded text-[10px] font-bold bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 uppercase tracking-wider"
        >
          Overdue
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Check, Clock, Bell, CalendarSync } from 'lucide-vue-next';
import CategoryIcon from '@/components/common/CategoryIcon.vue';
import { formatTimeString, formatDateShort, isDateToday, isTaskOverdue } from '@/utils/date';
import type { Task } from '@/types/task';

const props = defineProps<{
  task: Task;
}>();

const emit = defineEmits<{
  (e: 'select', task: Task): void;
  (e: 'toggle', taskId: string): void;
}>();

const isToday = computed(() => isDateToday(props.task.task_date));
const formattedDate = computed(() => formatDateShort(props.task.task_date));
const isOverdue = computed(() => isTaskOverdue(props.task.task_date, props.task.start_time, props.task.status === 'completed'));

function handleToggle() {
  emit('toggle', props.task.id);
}
</script>
