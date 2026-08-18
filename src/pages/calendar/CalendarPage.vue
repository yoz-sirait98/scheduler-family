<template>
  <div class="space-y-5 max-w-4xl mx-auto">
    <!-- Header & Controls -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200/80 dark:border-slate-800/80">
      <!-- Title & Navigation -->
      <div class="flex items-center gap-3">
        <div>
          <h1 class="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {{ viewMode === 'month' ? formattedMonthYear : formattedSelectedDate }}
          </h1>
        </div>

        <!-- Prev / Today / Next Controls -->
        <div class="flex items-center gap-1 ml-auto sm:ml-2">
          <button
            @click="goPrev"
            class="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
            title="Previous"
          >
            <ChevronLeft class="w-4 h-4" />
          </button>
          <button
            @click="goToday"
            class="px-2.5 py-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors"
          >
            Today
          </button>
          <button
            @click="goNext"
            class="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
            title="Next"
          >
            <ChevronRight class="w-4 h-4" />
          </button>
        </div>
      </div>

      <!-- View Mode Segmented Switcher -->
      <div class="flex items-center p-1 rounded-2xl bg-slate-200/70 dark:bg-slate-800/70 backdrop-blur-xs self-start sm:self-auto">
        <button
          v-for="mode in (['day', 'week', 'month', 'agenda'] as const)"
          :key="mode"
          @click="viewMode = mode"
          class="px-3 py-1.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all"
          :class="viewMode === mode
            ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'"
        >
          {{ mode }}
        </button>
      </div>
    </div>

    <!-- Active View Component -->
    <div>
      <!-- 1. Day View -->
      <DayView
        v-if="viewMode === 'day'"
        :hourly-slots="hourlySlots"
        :all-day-tasks="allDayTasks"
        :selected-date="selectedDate"
        @select-task="selectedTask = $event"
        @quick-add-slot="handleSlotQuickAdd"
      />

      <!-- 2. Week View -->
      <WeekView
        v-else-if="viewMode === 'week'"
        :week-days="weekDays"
        :selected-date="selectedDate"
        @select-date="selectDate"
        @select-task="selectedTask = $event"
        @toggle-task="taskStore.toggleTask"
      />

      <!-- 3. Month View -->
      <MonthView
        v-else-if="viewMode === 'month'"
        :cells="monthCells"
        @select-date="handleMonthDateSelect"
      />

      <!-- 4. Agenda View -->
      <AgendaView
        v-else-if="viewMode === 'agenda'"
        :tasks="taskStore.tasks"
        @select-task="selectedTask = $event"
        @toggle-task="taskStore.toggleTask"
      />
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
import { ref } from 'vue';
import { ChevronLeft, ChevronRight } from 'lucide-vue-next';
import DayView from '@/components/calendar/DayView.vue';
import WeekView from '@/components/calendar/WeekView.vue';
import MonthView from '@/components/calendar/MonthView.vue';
import AgendaView from '@/components/calendar/AgendaView.vue';
import TaskDetailModal from '@/components/tasks/TaskDetailModal.vue';
import { useCalendar } from '@/composables/useCalendar';
import { useTaskStore } from '@/stores/task.store';
import type { Task } from '@/types/task';

const emit = defineEmits<{
  (e: 'open-add', options?: { task?: Task; date?: string; time?: string }): void;
}>();

const taskStore = useTaskStore();
const selectedTask = ref<Task | null>(null);

const {
  viewMode,
  selectedDate,
  formattedMonthYear,
  formattedSelectedDate,
  monthCells,
  weekDays,
  hourlySlots,
  allDayTasks,
  goToday,
  goNext,
  goPrev,
  selectDate,
} = useCalendar();

function handleMonthDateSelect(dateStr: string) {
  selectDate(dateStr);
  viewMode.value = 'day';
}

function handleSlotQuickAdd(time: string, date: string) {
  emit('open-add', { date, time });
}

function handleEdit(task: Task) {
  selectedTask.value = null;
  emit('open-add', { task });
}
</script>
