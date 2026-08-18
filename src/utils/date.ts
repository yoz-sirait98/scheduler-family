import {
  format,
  isTomorrow as dateFnsIsTomorrow,
  isYesterday as dateFnsIsYesterday,
  isBefore,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  startOfMonth,
  endOfMonth,
  subMinutes,
  differenceInMinutes,
} from 'date-fns';

/**
 * Returns today's local date string in YYYY-MM-DD format
 */
export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Returns current local time string in HH:MM format
 */
export function getCurrentTimeString(): string {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * Parses date string (YYYY-MM-DD) safely into local Date
 */
export function parseLocalDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, (month || 1) - 1, day || 1);
}

/**
 * Combines date string (YYYY-MM-DD) and optional time (HH:MM) into a local Date object
 */
export function parseLocalDateTime(dateStr: string, timeStr?: string | null): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  let hours = 0;
  let minutes = 0;

  if (timeStr) {
    const [h, m] = timeStr.split(':').map(Number);
    hours = h || 0;
    minutes = m || 0;
  }

  return new Date(year, (month || 1) - 1, day || 1, hours, minutes, 0, 0);
}

/**
 * Formats date into readable string, e.g. "Tuesday, 18 August 2026"
 */
export function formatDateLong(dateStr: string): string {
  try {
    const date = parseLocalDate(dateStr);
    return format(date, 'EEEE, d MMMM yyyy');
  } catch {
    return dateStr;
  }
}

/**
 * Formats date into short string, e.g. "18 Aug" or "18 Aug 2026"
 */
export function formatDateShort(dateStr: string): string {
  try {
    const date = parseLocalDate(dateStr);
    const today = new Date();
    if (date.getFullYear() === today.getFullYear()) {
      return format(date, 'd MMM');
    }
    return format(date, 'd MMM yyyy');
  } catch {
    return dateStr;
  }
}

/**
 * Formats time string, e.g. "10:00" -> "10:00" or with 12h if needed
 */
export function formatTimeString(timeStr?: string | null): string {
  if (!timeStr) return '';
  // Ensure HH:MM format
  const parts = timeStr.split(':');
  if (parts.length >= 2) {
    return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`;
  }
  return timeStr;
}

/**
 * Checks if date string is today
 */
export function isDateToday(dateStr: string): boolean {
  return dateStr === getTodayDateString();
}

/**
 * Checks if task date and start time is in the past (overdue)
 */
export function isTaskOverdue(dateStr: string, timeStr?: string | null, isCompleted: boolean = false): boolean {
  if (isCompleted) return false;

  const now = new Date();
  const taskDateTime = parseLocalDateTime(dateStr, timeStr || '23:59');
  return isBefore(taskDateTime, now);
}

/**
 * Calculates the exact Date when a reminder should fire
 */
export function calculateReminderTriggerTime(
  taskDateStr: string,
  startTimeStr: string | null | undefined,
  minutesBefore: number
): Date {
  const baseTime = startTimeStr || '09:00'; // Default to 9 AM for all-day tasks
  const taskDateTime = parseLocalDateTime(taskDateStr, baseTime);
  return subMinutes(taskDateTime, minutesBefore);
}

/**
 * Returns human friendly relative time description (e.g. "Today", "Tomorrow", "In 15 mins", "Overdue by 2 hours")
 */
export function getRelativeTaskTime(dateStr: string, timeStr?: string | null): string {
  const taskDate = parseLocalDate(dateStr);
  const now = new Date();

  if (isDateToday(dateStr)) {
    if (!timeStr) return 'Today (All Day)';
    const taskDateTime = parseLocalDateTime(dateStr, timeStr);
    const diffMins = differenceInMinutes(taskDateTime, now);

    if (diffMins > 0 && diffMins <= 60) {
      return `Starts in ${diffMins} min${diffMins > 1 ? 's' : ''}`;
    } else if (diffMins < 0 && Math.abs(diffMins) <= 60) {
      return `${Math.abs(diffMins)} min${Math.abs(diffMins) > 1 ? 's' : ''} overdue`;
    }
    return `Today at ${formatTimeString(timeStr)}`;
  }

  if (dateFnsIsTomorrow(taskDate)) {
    return timeStr ? `Tomorrow at ${formatTimeString(timeStr)}` : 'Tomorrow (All Day)';
  }

  if (dateFnsIsYesterday(taskDate)) {
    return timeStr ? `Yesterday at ${formatTimeString(timeStr)}` : 'Yesterday';
  }

  return timeStr ? `${formatDateShort(dateStr)} at ${formatTimeString(timeStr)}` : formatDateShort(dateStr);
}

/**
 * Generates an array of date objects for a month view calendar grid (including padding days from prev/next month)
 */
export function generateMonthGrid(targetDate: Date): Date[] {
  const monthStart = startOfMonth(targetDate);
  const monthEnd = endOfMonth(targetDate);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 }); // Monday start
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

  return eachDayOfInterval({ start: startDate, end: endDate });
}

/**
 * Generates the 7 days of the week for a given date
 */
export function generateWeekDays(targetDate: Date): Date[] {
  const weekStart = startOfWeek(targetDate, { weekStartsOn: 1 }); // Monday start
  const weekEnd = endOfWeek(targetDate, { weekStartsOn: 1 });
  return eachDayOfInterval({ start: weekStart, end: weekEnd });
}
