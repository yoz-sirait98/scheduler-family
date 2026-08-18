import type { Task } from './task';

export type CalendarViewType = 'day' | 'agenda' | 'month' | 'week';

export interface CalendarDayCell {
  date: Date;
  dateString: string; // YYYY-MM-DD
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  tasks: Task[];
}

export interface HourlySlot {
  hour: number; // 0 to 23
  timeString: string; // "09:00"
  tasks: Task[];
}
