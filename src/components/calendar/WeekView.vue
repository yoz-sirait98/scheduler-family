<template>
  <div class="space-y-4">
    <!-- 7 Day Strip (Mobile horizontal scrollable or desktop 7-column) -->
    <div class="grid grid-cols-7 gap-1.5 sm:gap-2">
      <button
        v-for="day in weekDays"
        :key="day.dateString"
        @click="$emit('select-date', day.dateString)"
        class="flex flex-col items-center justify-center p-2 rounded-2xl border transition-all text-center"
        :class="[
          day.isSelected
            ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-500/20 font-bold'
            : day.isToday
            ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300'
            : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800/80 text-slate-700 dark:text-slate-300 hover:border-slate-300',
        ]"
      >
        <span class="text-[10px] uppercase font-semibold opacity-80">
          {{ ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][(day.date.getDay() + 6) % 7] }}
        </span>
        <span class="text-base sm:text-lg font-bold my-0.5">
          {{ day.date.getDate() }}
        </span>
        <!-- Task Count Badge -->
        <span
          class="w-4 h-4 rounded-full text-[10px] flex items-center justify-center font-bold"
          :class="day.isSelected ? 'bg-white/30 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'"
        >
          {{ day.tasks.length }}
        </span>
      </button>
    </div>

    <!-- Tasks on currently selected week day -->
    <div class="space-y-2">
      <h4 class="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">
        Tasks for {{ formattedSelectedDate }}
      </h4>
      <div v-if="selectedDayTasks.length === 0" class="p-6 text-center text-sm text-slate-400 border border-dashed rounded-2xl">
        No tasks scheduled for this day
      </div>
      <div v-else class="space-y-2">
        <TaskCard
          v-for="task in selectedDayTasks"
          :key="task.id"
          :task="task"
          @select="$emit('select-task', $event)"
          @toggle="$emit('toggle-task', $event)"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import TaskCard from '@/components/tasks/TaskCard.vue';
import { formatDateLong } from '@/utils/date';
import type { CalendarDayCell } from '@/types/calendar';
import type { Task } from '@/types/task';

const props = defineProps<{
  weekDays: CalendarDayCell[];
  selectedDate: string;
}>();

defineEmits<{
  (e: 'select-date', dateStr: string): void;
  (e: 'select-task', task: Task): void;
  (e: 'toggle-task', taskId: string): void;
}>();

const formattedSelectedDate = computed(() => {
  return formatDateLong(props.selectedDate);
});

const selectedDayTasks = computed(() => {
  const currentCell = props.weekDays.find((d) => d.dateString === props.selectedDate);
  return currentCell ? currentCell.tasks : [];
});
</script>
