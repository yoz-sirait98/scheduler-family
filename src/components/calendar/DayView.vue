<template>
  <div class="space-y-4">
    <!-- All Day Section if any -->
    <div v-if="allDayTasks.length > 0" class="p-3.5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60 shadow-xs">
      <h4 class="text-[11px] font-bold text-indigo-900 dark:text-indigo-200 uppercase tracking-wider mb-2 flex items-center gap-1.5">
        <Sun class="w-3.5 h-3.5 text-indigo-500" />
        <span>All-Day Tasks ({{ allDayTasks.length }})</span>
      </h4>
      <div class="space-y-1.5">
        <div
          v-for="task in allDayTasks"
          :key="task.id"
          @click="$emit('select-task', task)"
          class="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs hover:border-indigo-400 cursor-pointer transition-all"
        >
          <div class="flex items-center gap-2">
            <span
              v-if="task.category"
              class="w-2.5 h-2.5 rounded-full shrink-0"
              :style="{ backgroundColor: task.category.color }"
            ></span>
            <span class="text-xs font-semibold text-slate-800 dark:text-slate-200" :class="{ 'line-through text-slate-400': task.status === 'completed' }">
              {{ task.title }}
            </span>
          </div>
          <span class="text-[10px] font-semibold text-slate-400 uppercase">All Day</span>
        </div>
      </div>
    </div>

    <!-- Timeline 24h Slots -->
    <div class="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 overflow-hidden shadow-xs divide-y divide-slate-100 dark:divide-slate-800/60 relative">
      <!-- Live Current Time Indicator (if viewing today) -->
      <div
        v-if="isViewingToday && currentTimeTopPercent >= 0 && currentTimeTopPercent <= 100"
        class="absolute left-0 right-0 z-20 pointer-events-none flex items-center"
        :style="{ top: `${currentTimeTopPercent}%` }"
      >
        <div class="w-2 h-2 rounded-full bg-rose-500 -ml-1 ring-2 ring-white dark:ring-slate-900"></div>
        <div class="flex-1 h-[2px] bg-rose-500 shadow-xs"></div>
        <span class="bg-rose-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full mr-2 shadow-xs">
          NOW
        </span>
      </div>

      <div
        v-for="slot in hourlySlots"
        :key="slot.hour"
        class="flex items-start min-h-[50px] sm:min-h-[56px] group hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
      >
        <!-- Hour Label -->
        <div class="w-14 sm:w-18 p-2 text-right text-[11px] font-bold text-slate-400 dark:text-slate-500 border-r border-slate-100 dark:border-slate-800 shrink-0 select-none">
          {{ slot.timeString }}
        </div>

        <!-- Slot Content -->
        <div
          @click="handleSlotClick(slot.timeString)"
          class="flex-1 p-1.5 sm:p-2 flex flex-col gap-1.5 cursor-pointer relative min-h-[50px]"
        >
          <!-- Tasks in this hour -->
          <div
            v-for="task in slot.tasks"
            :key="task.id"
            @click.stop="$emit('select-task', task)"
            class="flex items-center justify-between p-2 rounded-xl text-xs font-semibold shadow-2xs transition-all hover:scale-[1.01]"
            :class="task.status === 'completed' ? 'opacity-60 line-through' : ''"
            :style="{
              backgroundColor: task.category ? `${task.category.color}15` : '#6366f115',
              color: task.category ? task.category.color : '#6366f1',
              borderLeft: `3px solid ${task.category ? task.category.color : '#6366f1'}`
            }"
          >
            <div class="flex items-center gap-2 truncate">
              <span class="font-bold text-[11px]">{{ task.start_time }}</span>
              <span class="truncate">{{ task.title }}</span>
            </div>
            <div class="flex items-center gap-1 shrink-0 ml-2">
              <Bell v-if="task.reminders && task.reminders.length > 0" class="w-3 h-3" />
            </div>
          </div>

          <!-- Empty slot hover hint -->
          <div
            v-if="slot.tasks.length === 0"
            class="hidden group-hover:flex items-center gap-1 text-[10px] font-medium text-slate-400 dark:text-slate-500 py-1 px-2"
          >
            <Plus class="w-3 h-3" />
            <span>Schedule at {{ slot.timeString }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Sun, Plus, Bell } from 'lucide-vue-next';
import { isDateToday } from '@/utils/date';
import type { HourlySlot } from '@/types/calendar';
import type { Task } from '@/types/task';

const props = defineProps<{
  hourlySlots: HourlySlot[];
  allDayTasks: Task[];
  selectedDate: string;
}>();

const emit = defineEmits<{
  (e: 'select-task', task: Task): void;
  (e: 'quick-add-slot', time: string, date: string): void;
}>();

const isViewingToday = computed(() => isDateToday(props.selectedDate));

const currentTimeTopPercent = computed(() => {
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const totalMinutesInDay = 24 * 60;
  const currentMinutes = hours * 60 + minutes;
  return (currentMinutes / totalMinutesInDay) * 100;
});

function handleSlotClick(timeString: string) {
  emit('quick-add-slot', timeString, props.selectedDate);
}
</script>
