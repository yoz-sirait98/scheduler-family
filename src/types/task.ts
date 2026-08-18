export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskStatus = 'pending' | 'completed' | 'cancelled';

export interface Task {
  id: string;
  user_id?: string;
  category_id?: string | null;
  title: string;
  description?: string | null;
  task_date: string; // YYYY-MM-DD (local date)
  start_time?: string | null; // HH:MM
  end_time?: string | null; // HH:MM
  is_all_day: boolean;
  priority: TaskPriority;
  status: TaskStatus;
  is_deleted?: boolean;
  created_at: string; // ISO string
  updated_at: string; // ISO string
  completed_at?: string | null; // ISO string

  // Joined/transient properties
  category?: {
    id: string;
    name: string;
    icon: string;
    color: string;
  };
  reminders?: TaskReminder[];
  sync_status?: 'synced' | 'pending' | 'error';

  // External calendar synchronization (Google Calendar, etc.)
  external_provider?: 'google' | null;
  external_calendar_id?: string | null;
  external_event_id?: string | null;
  external_event_link?: string | null;
  external_synced_at?: string | null;
}

export interface TaskReminder {
  id: string;
  task_id: string;
  user_id?: string;
  reminder_type: 'notification' | 'alarm' | 'both';
  minutes_before: number; // 0 = at time, 5, 10, 15, 30, 60, 1440 (1 day)
  is_enabled: boolean;
  is_triggered?: boolean;
  created_at: string;
  updated_at: string;
}

export interface TaskRecurrence {
  id: string;
  task_id: string;
  user_id?: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval: number;
  days_of_week?: number[]; // 1=Mon, 7=Sun
  end_date?: string | null;
  created_at: string;
  updated_at: string;
}

export interface TaskCreateInput {
  title: string;
  description?: string | null;
  task_date: string;
  start_time?: string | null;
  end_time?: string | null;
  is_all_day?: boolean;
  priority?: TaskPriority;
  category_id?: string | null;
  reminders?: { minutes_before: number; reminder_type?: 'notification' | 'alarm' | 'both' }[];
  external_provider?: 'google' | null;
  external_calendar_id?: string | null;
  external_event_id?: string | null;
  external_event_link?: string | null;
  external_synced_at?: string | null;
}

export interface TaskUpdateInput extends Partial<TaskCreateInput> {
  status?: TaskStatus;
  completed_at?: string | null;
  is_deleted?: boolean;
}

export type TaskFilterType = 'all' | 'today' | 'upcoming' | 'overdue' | 'completed';
export type TaskSortOption = 'time' | 'priority' | 'created' | 'title';
