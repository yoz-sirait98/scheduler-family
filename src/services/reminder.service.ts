import { reminderRepository } from '@/db/reminder.repository';
import { taskRepository } from '@/db/task.repository';
import { notificationService } from './notification.service';
import { nativeAlarmService } from './native-alarm.service';
import { capacitorService } from './capacitor.service';
import { calculateReminderTriggerTime } from '@/utils/date';
import type { Task, TaskReminder } from '@/types/task';
import type { ActiveAlarm } from '@/types/notification';

type AlarmTriggerCallback = (alarm: ActiveAlarm) => void;

class ReminderService {
  private timer: any = null;
  private alarmCallbacks: Set<AlarmTriggerCallback> = new Set();
  private snoozedAlarms: Map<string, { task: Task; reminder: TaskReminder; triggerTime: Date }> = new Map();
  private cleanupAppState: (() => void) | null = null;

  /**
   * Start checking for due reminders every 15 seconds
   */
  start(): void {
    if (this.timer) return;
    this.checkReminders();
    this.timer = setInterval(() => this.checkReminders(), 15000);

    // Synchronize native exact alarms and listen for app resume
    if (capacitorService.isNative) {
      nativeAlarmService.rescheduleAllActiveReminders();
      this.cleanupAppState = capacitorService.onAppStateChange((isActive) => {
        if (isActive) {
          this.checkReminders();
          nativeAlarmService.rescheduleAllActiveReminders();
        }
      });
    }
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    if (this.cleanupAppState) {
      this.cleanupAppState();
      this.cleanupAppState = null;
    }
  }

  onAlarm(callback: AlarmTriggerCallback): () => void {
    this.alarmCallbacks.add(callback);
    return () => this.alarmCallbacks.delete(callback);
  }

  /**
   * Main check loop
   */
  async checkReminders(): Promise<void> {
    try {
      const now = new Date();

      // 1. Check snoozed alarms
      for (const [id, snoozed] of this.snoozedAlarms.entries()) {
        if (snoozed.triggerTime <= now) {
          this.snoozedAlarms.delete(id);
          this.triggerAlarm(snoozed.task, snoozed.reminder, true);
        }
      }

      // 2. Check active reminders from DB
      const activeReminders = await reminderRepository.getAllActive();
      for (const reminder of activeReminders) {
        const task = await taskRepository.getById(reminder.task_id);
        if (!task || task.status === 'completed' || task.is_deleted) {
          continue;
        }

        const triggerTime = calculateReminderTriggerTime(
          task.task_date,
          task.start_time,
          reminder.minutes_before
        );

        // If due now (within the past hour to prevent old stale reminders from firing unexpectedly)
        const diffMs = now.getTime() - triggerTime.getTime();
        if (diffMs >= 0 && diffMs < 3600000) {
          await reminderRepository.setTriggered(reminder.id, true);
          this.triggerAlarm(task, reminder);
        }
      }
    } catch (e) {
      console.error('Error during reminder check:', e);
    }
  }

  /**
   * Triggers the alarm UI and browser notification
   */
  private triggerAlarm(task: Task, reminder: TaskReminder, isSnoozed = false): void {
    const timeLabel = task.start_time ? `at ${task.start_time}` : 'Today';
    const message = reminder.minutes_before === 0
      ? `Task "${task.title}" starts now!`
      : `Task "${task.title}" starts in ${reminder.minutes_before} minutes (${timeLabel}).`;

    // 1. Show web notification
    notificationService.showNotification(`🔔 ${task.title}`, {
      body: message,
      data: { taskId: task.id },
    });

    // 2. Trigger native haptics if on mobile
    if (capacitorService.isNative) {
      capacitorService.triggerHaptic('heavy');
    }

    // 3. Notify subscribers (Alarm Modal)
    const activeAlarm: ActiveAlarm = {
      id: `${reminder.id}-${Date.now()}`,
      task,
      reminder,
      triggerTime: new Date(),
      isSnoozed,
    };

    this.alarmCallbacks.forEach((cb) => cb(activeAlarm));
  }

  /**
   * Snooze a triggered alarm for X minutes
   */
  snooze(alarm: ActiveAlarm, minutes: number): void {
    const snoozeUntil = new Date(Date.now() + minutes * 60 * 1000);
    this.snoozedAlarms.set(alarm.id, {
      task: alarm.task,
      reminder: alarm.reminder,
      triggerTime: snoozeUntil,
    });
  }
}

export const reminderService = new ReminderService();
