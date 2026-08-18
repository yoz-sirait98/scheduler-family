<template>
  <div class="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 p-2.5 sm:p-4 shadow-xs">
    <!-- Weekday Header Row -->
    <div class="grid grid-cols-7 gap-1 text-center text-[10px] sm:text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">
      <div v-for="d in ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']" :key="d" class="py-1">
        {{ d }}
      </div>
    </div>

    <!-- Month Grid Cells -->
    <div class="grid grid-cols-7 gap-1">
      <button
        v-for="cell in cells"
        :key="cell.dateString"
        @click="$emit('select-date', cell.dateString)"
        class="relative min-h-[52px] sm:min-h-[72px] p-1 sm:p-1.5 rounded-xl flex flex-col items-start justify-between text-left transition-all border"
        :class="[
          cell.isCurrentMonth
            ? 'bg-slate-50/50 dark:bg-slate-800/40 border-slate-100 dark:border-slate-800/60'
            : 'bg-transparent border-transparent opacity-25',
          cell.isSelected ? 'ring-2 ring-indigo-500 border-indigo-400 dark:border-indigo-600 bg-indigo-50/40 dark:bg-indigo-950/30 font-bold' : 'hover:border-slate-300 dark:hover:border-slate-700',
        ]"
      >
        <!-- Day Number Pill -->
        <span
          class="w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-[11px] sm:text-xs font-semibold"
          :class="cell.isToday
            ? 'bg-indigo-600 text-white font-bold shadow-xs'
            : cell.isSelected
            ? 'font-bold text-indigo-600 dark:text-indigo-400'
            : 'text-slate-700 dark:text-slate-300'"
        >
          {{ cell.date.getDate() }}
        </span>

        <!-- Task Indicators / Dots -->
        <div class="w-full flex items-center gap-0.5 overflow-hidden mt-0.5 flex-wrap">
          <span
            v-for="task in cell.tasks.slice(0, 3)"
            :key="task.id"
            class="w-1.5 h-1.5 rounded-full shrink-0"
            :style="{ backgroundColor: task.category?.color || '#6366f1' }"
            :title="task.title"
          ></span>
          <span v-if="cell.tasks.length > 3" class="text-[8px] font-bold text-slate-400">
            +{{ cell.tasks.length - 3 }}
          </span>
        </div>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { CalendarDayCell } from '@/types/calendar';

defineProps<{
  cells: CalendarDayCell[];
}>();

defineEmits<{
  (e: 'select-date', dateStr: string): void;
}>();
</script>
