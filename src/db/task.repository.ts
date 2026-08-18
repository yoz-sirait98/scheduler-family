import { db } from './database';
import type { Task, TaskCreateInput, TaskUpdateInput, TaskFilterType, TaskSortOption } from '@/types/task';
import { reminderRepository } from './reminder.repository';
import { categoryRepository } from './category.repository';
import { getTodayDateString, isTaskOverdue } from '@/utils/date';

export class TaskRepository {
  /**
   * Helper to enrich a task with category and reminders
   */
  private async enrichTask(task: Task): Promise<Task> {
    if (task.category_id) {
      const category = await categoryRepository.getById(task.category_id);
      if (category) {
        task.category = {
          id: category.id,
          name: category.name,
          icon: category.icon,
          color: category.color,
        };
      }
    }
    task.reminders = await reminderRepository.getByTaskId(task.id);
    return task;
  }

  async getAll(userId?: string): Promise<Task[]> {
    let query = db.tasks.filter((t) => !t.is_deleted);
    if (userId) {
      query = db.tasks.filter((t) => !t.is_deleted && (!t.user_id || t.user_id === userId));
    }
    const tasks = await query.toArray();
    return Promise.all(tasks.map((t) => this.enrichTask(t)));
  }

  async getById(id: string): Promise<Task | undefined> {
    const task = await db.tasks.get(id);
    if (!task || task.is_deleted) return undefined;
    return this.enrichTask(task);
  }

  async getByDate(dateStr: string, userId?: string): Promise<Task[]> {
    const tasks = await db.tasks
      .where('task_date')
      .equals(dateStr)
      .filter((t) => !t.is_deleted && (!userId || !t.user_id || t.user_id === userId))
      .toArray();

    const enriched = await Promise.all(tasks.map((t) => this.enrichTask(t)));
    return this.sortTasks(enriched, 'time');
  }

  async getByDateRange(startDate: string, endDate: string, userId?: string): Promise<Task[]> {
    const tasks = await db.tasks
      .where('task_date')
      .between(startDate, endDate, true, true)
      .filter((t) => !t.is_deleted && (!userId || !t.user_id || t.user_id === userId))
      .toArray();

    const enriched = await Promise.all(tasks.map((t) => this.enrichTask(t)));
    return this.sortTasks(enriched, 'time');
  }

  async filterTasks(
    filter: TaskFilterType = 'all',
    categoryId?: string | null,
    searchQuery?: string,
    sortOption: TaskSortOption = 'time',
    userId?: string
  ): Promise<Task[]> {
    const allTasks = await this.getAll(userId);
    const today = getTodayDateString();

    let filtered = allTasks.filter((task) => {
      // Category filter
      if (categoryId && task.category_id !== categoryId) {
        return false;
      }

      // Search query
      if (searchQuery && searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase().trim();
        const matchesTitle = task.title.toLowerCase().includes(query);
        const matchesDesc = task.description?.toLowerCase().includes(query);
        if (!matchesTitle && !matchesDesc) return false;
      }

      // Status/Date Filter
      switch (filter) {
        case 'today':
          return task.task_date === today && task.status !== 'completed';
        case 'upcoming':
          return task.task_date > today && task.status !== 'completed';
        case 'overdue':
          return isTaskOverdue(task.task_date, task.start_time, task.status === 'completed');
        case 'completed':
          return task.status === 'completed';
        case 'all':
        default:
          return true;
      }
    });

    return this.sortTasks(filtered, sortOption);
  }

  sortTasks(tasks: Task[], sortOption: TaskSortOption): Task[] {
    const priorityWeights: Record<string, number> = {
      urgent: 4,
      high: 3,
      medium: 2,
      low: 1,
    };

    return [...tasks].sort((a, b) => {
      if (sortOption === 'priority') {
        const weightA = priorityWeights[a.priority] || 0;
        const weightB = priorityWeights[b.priority] || 0;
        return weightB - weightA;
      }

      if (sortOption === 'created') {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }

      if (sortOption === 'title') {
        return a.title.localeCompare(b.title);
      }

      // Default: sort by Date, then Time (all-day first or sorted by time string)
      if (a.task_date !== b.task_date) {
        return a.task_date.localeCompare(b.task_date);
      }
      if (a.is_all_day && !b.is_all_day) return -1;
      if (!a.is_all_day && b.is_all_day) return 1;
      const timeA = a.start_time || '00:00';
      const timeB = b.start_time || '00:00';
      return timeA.localeCompare(timeB);
    });
  }

  async create(input: TaskCreateInput, userId?: string): Promise<Task> {
    const now = new Date().toISOString();
    const taskId = crypto.randomUUID();

    const newTask: Task = {
      id: taskId,
      user_id: userId || 'local-user',
      title: input.title.trim(),
      description: input.description?.trim() || null,
      task_date: input.task_date,
      start_time: input.start_time || null,
      end_time: input.end_time || null,
      is_all_day: input.is_all_day ?? (!input.start_time),
      priority: input.priority || 'medium',
      status: 'pending',
      category_id: input.category_id || null,
      is_deleted: false,
      created_at: now,
      updated_at: now,
    };

    await db.tasks.add(newTask);

    // Add reminders if provided
    if (input.reminders && input.reminders.length > 0) {
      for (const r of input.reminders) {
        await reminderRepository.create({
          task_id: taskId,
          user_id: userId || 'local-user',
          minutes_before: r.minutes_before,
          reminder_type: r.reminder_type || 'both',
          is_enabled: true,
          is_triggered: false,
        });
      }
    }

    return this.enrichTask(newTask);
  }

  async update(id: string, updates: TaskUpdateInput): Promise<Task | undefined> {
    const existing = await db.tasks.get(id);
    if (!existing || existing.is_deleted) return undefined;

    const now = new Date().toISOString();
    const { reminders: _reminders, ...taskFields } = updates;
    const updated: Task = {
      ...existing,
      ...taskFields,
      updated_at: now,
    };

    if (updates.status === 'completed' && existing.status !== 'completed') {
      updated.completed_at = now;
    } else if (updates.status && updates.status !== 'completed') {
      updated.completed_at = null;
    }

    await db.tasks.put(updated);

    // Update reminders if explicitly passed
    if (updates.reminders !== undefined) {
      await reminderRepository.deleteByTaskId(id);
      for (const r of updates.reminders) {
        await reminderRepository.create({
          task_id: id,
          user_id: existing.user_id,
          minutes_before: r.minutes_before,
          reminder_type: r.reminder_type || 'both',
          is_enabled: true,
          is_triggered: false,
        });
      }
    }

    return this.enrichTask(updated);
  }

  async toggleComplete(id: string): Promise<Task | undefined> {
    const task = await db.tasks.get(id);
    if (!task) return undefined;

    const newStatus = task.status === 'completed' ? 'pending' : 'completed';
    return this.update(id, { status: newStatus });
  }

  async delete(id: string): Promise<void> {
    const existing = await db.tasks.get(id);
    if (!existing) return;

    // Soft delete to support sync queue tracking
    existing.is_deleted = true;
    existing.updated_at = new Date().toISOString();
    await db.tasks.put(existing);

    // Clean up local reminders
    await reminderRepository.deleteByTaskId(id);
  }

  async hardDelete(id: string): Promise<void> {
    await db.tasks.delete(id);
    await reminderRepository.deleteByTaskId(id);
  }
}

export const taskRepository = new TaskRepository();
