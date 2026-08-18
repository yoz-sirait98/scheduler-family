import Dexie, { type Table } from 'dexie';
import type { Task, TaskReminder, TaskRecurrence } from '@/types/task';
import type { Category } from '@/types/category';
import type { SyncQueueItem } from '@/types/sync';

export interface AppSetting {
  key: string;
  value: any;
}

export class AppDatabase extends Dexie {
  tasks!: Table<Task, string>;
  categories!: Table<Category, string>;
  reminders!: Table<TaskReminder, string>;
  recurrences!: Table<TaskRecurrence, string>;
  syncQueue!: Table<SyncQueueItem, string>;
  settings!: Table<AppSetting, string>;

  constructor() {
    super('YjsSchedulerDB');

    // Schema definition
    this.version(1).stores({
      tasks: 'id, user_id, category_id, task_date, start_time, priority, status, is_deleted, updated_at, created_at',
      categories: 'id, user_id, name, is_default, updated_at, created_at',
      reminders: 'id, task_id, user_id, minutes_before, is_enabled, is_triggered, updated_at',
      recurrences: 'id, task_id, user_id, updated_at',
      syncQueue: 'id, entity, action, record_id, timestamp, retries',
      settings: 'key'
    });

    this.version(2).stores({
      tasks: 'id, user_id, category_id, task_date, start_time, priority, status, is_deleted, updated_at, created_at, external_event_id, external_provider',
      categories: 'id, user_id, name, is_default, updated_at, created_at',
      reminders: 'id, task_id, user_id, minutes_before, is_enabled, is_triggered, updated_at',
      recurrences: 'id, task_id, user_id, updated_at',
      syncQueue: 'id, entity, action, record_id, timestamp, retries',
      settings: 'key'
    });
  }
}

export const db = new AppDatabase();
