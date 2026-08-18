<template>
  <div
    v-if="alarmStore.currentAlarm"
    class="fixed inset-0 z-50 overflow-y-auto bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
  >
    <div class="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border-2 border-indigo-500/50 p-6 text-center z-10 animate-bounce-subtle">
      <!-- Pulsing Alarm Bell Icon -->
      <div class="relative mx-auto mb-4 w-20 h-20 flex items-center justify-center">
        <div class="absolute inset-0 rounded-full bg-indigo-500/20 animate-ping"></div>
        <div class="relative w-16 h-16 rounded-full bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white flex items-center justify-center shadow-lg shadow-indigo-500/40">
          <BellRing class="w-8 h-8 animate-shake" />
        </div>
      </div>

      <!-- Label -->
      <span class="inline-block px-3 py-1 rounded-full text-xs font-bold bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 uppercase tracking-widest mb-2">
        ⏰ Scheduled Reminder
      </span>

      <!-- Task Title -->
      <h2 class="text-xl font-extrabold text-slate-900 dark:text-white mb-2 leading-tight">
        {{ alarmStore.currentAlarm.task.title }}
      </h2>

      <!-- Time or Category Context -->
      <p class="text-sm text-slate-600 dark:text-slate-300 mb-6 font-medium">
        {{ timeDescription }}
      </p>

      <!-- Buttons -->
      <div class="space-y-2.5">
        <!-- Main STOP Button -->
        <button
          @click="alarmStore.stopAlarm()"
          class="w-full py-3.5 px-4 rounded-2xl bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white font-bold text-base shadow-lg shadow-rose-600/30 active:scale-98 transition-all"
        >
          STOP ALARM
        </button>

        <!-- Snooze Options -->
        <div class="grid grid-cols-2 gap-2">
          <button
            @click="alarmStore.snoozeAlarm(5)"
            class="py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs transition-colors"
          >
            Snooze 5 Min
          </button>
          <button
            @click="alarmStore.snoozeAlarm(10)"
            class="py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs transition-colors"
          >
            Snooze 10 Min
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { BellRing } from 'lucide-vue-next';
import { useAlarmStore } from '@/stores/alarm.store';
import { formatTimeString } from '@/utils/date';

const alarmStore = useAlarmStore();

const timeDescription = computed(() => {
  if (!alarmStore.currentAlarm) return '';
  const task = alarmStore.currentAlarm.task;
  const reminder = alarmStore.currentAlarm.reminder;

  if (reminder.minutes_before === 0) {
    return task.start_time ? `Starts now at ${formatTimeString(task.start_time)}` : 'Starts now';
  }
  return `Starts in ${reminder.minutes_before} minutes${task.start_time ? ` (${formatTimeString(task.start_time)})` : ''}`;
});
</script>

<style scoped>
@keyframes shake {
  0%, 100% { transform: rotate(0deg); }
  20%, 60% { transform: rotate(-15deg); }
  40%, 80% { transform: rotate(15deg); }
}
.animate-shake {
  animation: shake 0.6s infinite ease-in-out;
}
</style>
