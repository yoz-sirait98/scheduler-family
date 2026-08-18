import type { Task, TaskReminder } from './task';

export interface ActiveAlarm {
  id: string; // reminder_id or task_id
  task: Task;
  reminder: TaskReminder;
  triggerTime: Date;
  isSnoozed?: boolean;
}

export interface NotificationSettings {
  enabled: boolean;
  soundEnabled: boolean;
  alarmVolume: number; // 0.0 to 1.0
  defaultReminderMinutes: number;
}
