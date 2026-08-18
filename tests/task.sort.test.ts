import { describe, it, expect } from 'vitest';
import { taskRepository } from '../src/db/task.repository';
import type { Task } from '../src/types/task';

describe('Task Sorting and Filtering', () => {
  const sampleTasks: Task[] = [
    {
      id: '1',
      title: 'Low Priority Meeting',
      task_date: '2026-08-19',
      start_time: '14:00',
      is_all_day: false,
      priority: 'low',
      status: 'pending',
      created_at: '2026-08-18T10:00:00Z',
      updated_at: '2026-08-18T10:00:00Z',
    },
    {
      id: '2',
      title: 'Urgent Doctor Visit',
      task_date: '2026-08-19',
      start_time: '09:00',
      is_all_day: false,
      priority: 'urgent',
      status: 'pending',
      created_at: '2026-08-18T11:00:00Z',
      updated_at: '2026-08-18T11:00:00Z',
    },
    {
      id: '3',
      title: 'High Priority Chore',
      task_date: '2026-08-19',
      start_time: '11:00',
      is_all_day: false,
      priority: 'high',
      status: 'pending',
      created_at: '2026-08-18T09:00:00Z',
      updated_at: '2026-08-18T09:00:00Z',
    },
  ];

  it('sorts tasks by priority (urgent -> high -> medium -> low)', () => {
    const sorted = taskRepository.sortTasks(sampleTasks, 'priority');
    expect(sorted[0].priority).toBe('urgent');
    expect(sorted[1].priority).toBe('high');
    expect(sorted[2].priority).toBe('low');
  });

  it('sorts tasks by time (09:00 -> 11:00 -> 14:00)', () => {
    const sorted = taskRepository.sortTasks(sampleTasks, 'time');
    expect(sorted[0].start_time).toBe('09:00');
    expect(sorted[1].start_time).toBe('11:00');
    expect(sorted[2].start_time).toBe('14:00');
  });

  it('sorts tasks by title alphabetically', () => {
    const sorted = taskRepository.sortTasks(sampleTasks, 'title');
    expect(sorted[0].title).toBe('High Priority Chore');
    expect(sorted[1].title).toBe('Low Priority Meeting');
    expect(sorted[2].title).toBe('Urgent Doctor Visit');
  });
});
