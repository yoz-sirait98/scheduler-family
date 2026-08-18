import { defineStore } from 'pinia';
import { ref } from 'vue';
import { audioService } from '@/services/audio.service';
import { reminderService } from '@/services/reminder.service';
import type { ActiveAlarm } from '@/types/notification';

export const useAlarmStore = defineStore('alarm', () => {
  const currentAlarm = ref<ActiveAlarm | null>(null);
  const isRinging = ref<boolean>(false);
  const soundEnabled = ref<boolean>(true);

  // Initialize reminder service listener
  reminderService.onAlarm((alarm) => {
    triggerAlarm(alarm);
  });

  function triggerAlarm(alarm: ActiveAlarm) {
    currentAlarm.value = alarm;
    isRinging.value = true;
    if (soundEnabled.value) {
      audioService.startAlarm(0.6);
    }
  }

  function stopAlarm() {
    isRinging.value = false;
    audioService.stopAlarm();
    currentAlarm.value = null;
  }

  function snoozeAlarm(minutes: number = 5) {
    if (currentAlarm.value) {
      reminderService.snooze(currentAlarm.value, minutes);
    }
    stopAlarm();
  }

  function setSoundEnabled(enabled: boolean) {
    soundEnabled.value = enabled;
  }

  return {
    currentAlarm,
    isRinging,
    soundEnabled,
    triggerAlarm,
    stopAlarm,
    snoozeAlarm,
    setSoundEnabled,
  };
});
