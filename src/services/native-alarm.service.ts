import { LocalNotifications, type LocalNotificationSchema, type PermissionStatus } from '@capacitor/local-notifications';
import { capacitorService } from './capacitor.service';
import { calculateReminderTriggerTime } from '@/utils/date';
import { reminderRepository } from '@/db/reminder.repository';
import { taskRepository } from '@/db/task.repository';
import type { Task, TaskReminder } from '@/types/task';

export const ALARM_CHANNEL_ID = 'scheduler_alarms';
export const ALARM_ACTION_TYPE_ID = 'SCHEDULER_ALARM';

/**
 * Generate a consistent 32-bit integer ID for LocalNotifications from string ID
 */
export function hashStringToNumber(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  // Ensure positive integer and within safe 31-bit range
  return Math.abs(hash) % 2147483647 || 1;
}

class NativeAlarmService {
  private isConfigured = false;
  private actionListenerRegistered = false;

  /**
   * Initialize native alarm notification channels and action buttons
   */
  async init(): Promise<void> {
    if (this.isConfigured || !capacitorService.isNative) {
      return;
    }

    try {
      // 1. Create High-Priority Notification Channel on Android
      if (capacitorService.platform === 'android') {
        await LocalNotifications.createChannel({
          id: ALARM_CHANNEL_ID,
          name: 'Task Alarms & Reminders',
          description: 'Urgent exact alarms and task reminders with sound, vibration, and snooze',
          importance: 5, // High / Urgent
          visibility: 1, // Public
          vibration: true,
          lights: true,
          lightColor: '#4F46E5',
          sound: 'res_alarm_chime.wav',
        });
      }

      // 2. Register Interactive Action Types (Stop & Snooze) for Android & iOS
      await LocalNotifications.registerActionTypes({
        types: [
          {
            id: ALARM_ACTION_TYPE_ID,
            actions: [
              {
                id: 'stop',
                title: 'Stop',
                destructive: true,
              },
              {
                id: 'snooze_5',
                title: 'Snooze 5m',
              },
              {
                id: 'snooze_10',
                title: 'Snooze 10m',
              },
            ],
          },
        ],
      });

      // 3. Register Action Performed Listener
      if (!this.actionListenerRegistered) {
        LocalNotifications.addListener('localNotificationActionPerformed', async (action) => {
          await this.handleNotificationAction(action);
        });
        this.actionListenerRegistered = true;
      }

      this.isConfigured = true;
    } catch (e) {
      console.warn('Failed to configure native alarm service:', e);
    }
  }

  /**
   * Check permissions status
   */
  async checkPermissions(): Promise<PermissionStatus> {
    if (!capacitorService.isNative) {
      return { display: 'granted' } as PermissionStatus;
    }
    return LocalNotifications.checkPermissions();
  }

  /**
   * Request native notification & exact alarm permissions
   */
  async requestPermissions(): Promise<PermissionStatus> {
    if (!capacitorService.isNative) {
      return { display: 'granted' } as PermissionStatus;
    }
    await this.init();
    return LocalNotifications.requestPermissions();
  }

  /**
   * Schedule exact native alarms for a task's reminders
   */
  async scheduleTaskReminders(task: Task, reminders: TaskReminder[]): Promise<void> {
    if (!capacitorService.isNative) return;
    await this.init();

    // Cancel existing scheduled notifications for this task first
    await this.cancelTaskReminders(task.id);

    if (task.status === 'completed' || task.is_deleted) {
      return;
    }

    const now = new Date();
    const notificationsToSchedule: LocalNotificationSchema[] = [];

    for (const reminder of reminders) {
      if (!reminder.is_enabled || reminder.is_triggered) continue;

      const triggerTime = calculateReminderTriggerTime(
        task.task_date,
        task.start_time,
        reminder.minutes_before
      );

      // Only schedule if trigger time is in the future
      if (triggerTime.getTime() > now.getTime()) {
        const notifId = hashStringToNumber(`${reminder.id}`);
        const timeLabel = task.start_time ? `at ${task.start_time}` : 'Today';
        const body = reminder.minutes_before === 0
          ? `Task "${task.title}" starts now!`
          : `Task "${task.title}" starts in ${reminder.minutes_before} minutes (${timeLabel}).`;

        notificationsToSchedule.push({
          id: notifId,
          title: `⏰ ${task.title}`,
          body,
          schedule: {
            at: triggerTime,
            allowWhileIdle: true, // Uses Android AlarmManager.setExactAndAllowWhileIdle
          },
          channelId: ALARM_CHANNEL_ID,
          actionTypeId: ALARM_ACTION_TYPE_ID,
          sound: 'res_alarm_chime.wav',
          extra: {
            taskId: task.id,
            reminderId: reminder.id,
            minutesBefore: reminder.minutes_before,
          },
        });
      }
    }

    if (notificationsToSchedule.length > 0) {
      try {
        await LocalNotifications.schedule({ notifications: notificationsToSchedule });
      } catch (err) {
        console.warn('Failed to schedule native exact alarms:', err);
      }
    }
  }

  /**
   * Cancel all pending native notifications for a specific task
   */
  async cancelTaskReminders(taskId: string): Promise<void> {
    if (!capacitorService.isNative) return;
    try {
      const pending = await LocalNotifications.getPending();
      const idsToCancel = pending.notifications
        .filter((n) => n.extra?.taskId === taskId)
        .map((n) => ({ id: n.id }));

      if (idsToCancel.length > 0) {
        await LocalNotifications.cancel({ notifications: idsToCancel });
      }
    } catch (e) {
      console.warn('Failed to cancel native alarms:', e);
    }
  }

  /**
   * Reschedule all active reminders from database into native exact alarm queue
   */
  async rescheduleAllActiveReminders(): Promise<void> {
    if (!capacitorService.isNative) return;
    await this.init();

    try {
      const activeReminders = await reminderRepository.getAllActive();
      const remindersByTask = new Map<string, TaskReminder[]>();

      for (const r of activeReminders) {
        const list = remindersByTask.get(r.task_id) || [];
        list.push(r);
        remindersByTask.set(r.task_id, list);
      }

      for (const [taskId, reminders] of remindersByTask.entries()) {
        const task = await taskRepository.getById(taskId);
        if (task && task.status !== 'completed' && !task.is_deleted) {
          await this.scheduleTaskReminders(task, reminders);
        }
      }
    } catch (e) {
      console.warn('Failed to reschedule all active native reminders:', e);
    }
  }

  /**
   * Handle interactive notification actions (Stop / Snooze 5m / Snooze 10m / Tap)
   */
  async handleNotificationAction(action: any): Promise<void> {
    const extra = action.notification?.extra;
    const actionId = action.actionId;

    if (!extra?.taskId) return;

    if (actionId === 'stop') {
      // Mark reminder triggered
      if (extra.reminderId) {
        await reminderRepository.setTriggered(extra.reminderId, true);
      }
      await capacitorService.triggerHaptic('medium');
    } else if (actionId === 'snooze_5' || actionId === 'snooze_10') {
      const snoozeMinutes = actionId === 'snooze_5' ? 5 : 10;
      const snoozeTrigger = new Date(Date.now() + snoozeMinutes * 60 * 1000);
      const snoozeId = hashStringToNumber(`snooze-${extra.taskId}-${Date.now()}`);

      try {
        await LocalNotifications.schedule({
          notifications: [
            {
              id: snoozeId,
              title: `⏰ [Snoozed] ${action.notification.title || 'Task Reminder'}`,
              body: `Snoozed alarm for ${action.notification.body || 'your scheduled task'}`,
              schedule: {
                at: snoozeTrigger,
                allowWhileIdle: true,
              },
              channelId: ALARM_CHANNEL_ID,
              actionTypeId: ALARM_ACTION_TYPE_ID,
              sound: 'res_alarm_chime.wav',
              extra: {
                taskId: extra.taskId,
                isSnoozed: true,
              },
            },
          ],
        });
        await capacitorService.triggerHaptic('success');
      } catch (err) {
        console.warn('Failed to schedule snooze notification:', err);
      }
    } else {
      // Tapped body of notification -> focus/open task
      await capacitorService.triggerHaptic('light');
    }
  }

  /**
   * Schedule a test exact alarm in X seconds to verify system alarm delivery
   */
  async testExactAlarm(secondsFromNow = 5): Promise<boolean> {
    if (!capacitorService.isNative) return false;
    await this.init();

    const triggerAt = new Date(Date.now() + secondsFromNow * 1000);
    const testId = hashStringToNumber(`test-alarm-${Date.now()}`);

    try {
      await LocalNotifications.schedule({
        notifications: [
          {
            id: testId,
            title: '⏰ YJS Scheduler — Exact Alarm Test',
            body: `Exact alarm triggered successfully via native AlarmManager / UNUserNotificationCenter!`,
            schedule: {
              at: triggerAt,
              allowWhileIdle: true,
            },
            channelId: ALARM_CHANNEL_ID,
            actionTypeId: ALARM_ACTION_TYPE_ID,
            sound: 'res_alarm_chime.wav',
            extra: {
              taskId: 'test-exact-alarm',
              isTest: true,
            },
          },
        ],
      });
      return true;
    } catch (err) {
      console.warn('Test exact alarm failed:', err);
      return false;
    }
  }
}

export const nativeAlarmService = new NativeAlarmService();
