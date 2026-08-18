import { db } from './database';
import type { TaskReminder } from '@/types/task';

export class ReminderRepository {
  async getByTaskId(taskId: string): Promise<TaskReminder[]> {
    return db.reminders.where('task_id').equals(taskId).toArray();
  }

  async getAllActive(): Promise<TaskReminder[]> {
    return db.reminders
      .filter((r) => r.is_enabled && !r.is_triggered)
      .toArray();
  }

  async create(reminder: Omit<TaskReminder, 'id' | 'created_at' | 'updated_at'>): Promise<TaskReminder> {
    const now = new Date().toISOString();
    const newReminder: TaskReminder = {
      ...reminder,
      id: crypto.randomUUID(),
      created_at: now,
      updated_at: now,
    };
    await db.reminders.add(newReminder);
    return newReminder;
  }

  async setTriggered(id: string, isTriggered: boolean = true): Promise<void> {
    const existing = await db.reminders.get(id);
    if (existing) {
      existing.is_triggered = isTriggered;
      existing.updated_at = new Date().toISOString();
      await db.reminders.put(existing);
    }
  }

  async deleteByTaskId(taskId: string): Promise<void> {
    const reminders = await this.getByTaskId(taskId);
    const ids = reminders.map((r) => r.id);
    await db.reminders.bulkDelete(ids);
  }

  async delete(id: string): Promise<void> {
    await db.reminders.delete(id);
  }
}

export const reminderRepository = new ReminderRepository();
