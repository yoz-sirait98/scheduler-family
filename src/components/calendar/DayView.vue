<template>
  <div class="space-y-4">
    <!-- All Day Section if any -->
    <div v-if="allDayTasks.length > 0" class="p-3.5 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50">
      <h4 class="text-xs font-semibold text-indigo-950 dark:text-indigo-200 uppercase tracking-wider mb-2 flex items-center gap-1.5">
        <Sun class="w-3.5 h-3.5" />
        <span>All-Day Tasks ({{ allDayTasks.length }})</span>
      </h4>
      <div class="space-y-2">
        <div
          v-for="task in allDayTasks"
          :key="task.id"
          @click="$emit('select-task', task)"
          class="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs hover:border-indigo-400 cursor-pointer transition-all"
        >
          <div class="flex items-center gap-2">
            <span
              v-if="task.category"
              class="w-2.5 h-2.5 rounded-full"
              :style="{ backgroundColor: task.category.color }"
            ></span>
            <span class="text-sm font-medium text-slate-800 dark:text-slate-200" :class="{ 'line-through text-slate-400': task.status === 'completed' }">
              {{ task.title }}
            </span>
          </div>
          <span class="text-xs text-slate-400">All Day</span>
        </div>
      </div>
    </div>

    <!-- Timeline 24h Slots -->
    <div class="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 overflow-hidden shadow-xs divide-y divide-slate-100 dark:divide-slate-800/60">
      <div
        v-for="slot in hourlySlots"
        :key="slot.hour"
        class="flex items-start min-h-[64px] group hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
      >
        <!-- Hour Label -->
        <div class="w-16 sm:w-20 p-2.5 sm:p-3 text-right text-xs font-semibold text-slate-400 dark:text-slate-500 border-r border-slate-100 dark:border-slate-800 shrink-0">
          {{ slot.timeString }}
        </div>

        <!-- Slot Content -->
        <div
          @click="handleSlotClick(slot.timeString)"
          class="flex-1 p-2 sm:p-2.5 flex flex-col gap-1.5 cursor-pointer relative"
        >
          <!-- Tasks in this hour -->
          <div
            v-for="task in slot.tasks"
            :key="task.id"
            @click.stop="$emit('select-task', task)"
            class="flex items-center justify-between p-2 rounded-xl text-xs font-medium shadow-2xs transition-all hover:scale-[1.01]"
            :class="task.status === 'completed' ? 'opacity-60 line-through' : ''"
            :style="{
              backgroundColor: task.category ? `${task.category.color}15` : '#6366f115',
              color: task.category ? task.category.color : '#6366f1',
              borderLeft: `4px solid ${task.category ? task.category.color : '#6366f1'}`
            }"
          >
            <div class="flex items-center gap-2 truncate">
              <span class="font-semibold">{{ task.start_time }}</span>
              <span class="truncate">{{ task.title }}</span>
            </div>
            <div class="flex items-center gap-1 shrink-0 ml-2">
              <Bell v-if="task.reminders && task.reminders.length > 0" class="w-3 h-3" />
            </div>
          </div>

          <!-- Empty slot hover hint -->
          <div
            v-if="slot.tasks.length === 0"
            class="hidden group-hover:flex items-center gap-1 text-[11px] text-slate-400 dark:text-slate-500 py-1 px-2"
          >
            <Plus class="w-3 h-3" />
            <span>Click to schedule at {{ slot.timeString }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Sun, Plus, Bell } from 'lucide-vue-next';
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

function handleSlotClick(timeString: string) {
  emit('quick-add-slot', timeString, props.selectedDate);
}
</script>
