import { describe, it, expect } from 'vitest';
import {
  getTodayDateString,
  getCurrentTimeString,
  parseLocalDate,
  parseLocalDateTime,
  formatDateShort,
  isDateToday,
  isTaskOverdue,
  calculateReminderTriggerTime,
  getRelativeTaskTime,
} from '../src/utils/date';

describe('Date & Time Utilities', () => {
  it('returns today date in YYYY-MM-DD format', () => {
    const today = getTodayDateString();
    expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(isDateToday(today)).toBe(true);
    expect(isDateToday('1999-01-01')).toBe(false);
  });

  it('returns current time in HH:MM format', () => {
    const time = getCurrentTimeString();
    expect(time).toMatch(/^\d{2}:\d{2}$/);
  });

  it('parses local date and datetime accurately', () => {
    const parsedDate = parseLocalDate('2026-08-19');
    expect(parsedDate.getFullYear()).toBe(2026);
    expect(parsedDate.getMonth()).toBe(7); // August (0-indexed)
    expect(parsedDate.getDate()).toBe(19);

    const parsedDateTime = parseLocalDateTime('2026-08-19', '14:30');
    expect(parsedDateTime.getHours()).toBe(14);
    expect(parsedDateTime.getMinutes()).toBe(30);
  });

  it('calculates reminder trigger times correctly', () => {
    // 15 minutes before 10:00 should be 09:45
    const trigger15 = calculateReminderTriggerTime('2026-08-19', '10:00', 15);
    expect(trigger15.getHours()).toBe(9);
    expect(trigger15.getMinutes()).toBe(45);

    // 0 minutes before 10:00 should be 10:00
    const trigger0 = calculateReminderTriggerTime('2026-08-19', '10:00', 0);
    expect(trigger0.getHours()).toBe(10);
    expect(trigger0.getMinutes()).toBe(0);

    // 60 minutes before 10:00 should be 09:00
    const trigger60 = calculateReminderTriggerTime('2026-08-19', '10:00', 60);
    expect(trigger60.getHours()).toBe(9);
    expect(trigger60.getMinutes()).toBe(0);
  });

  it('identifies overdue tasks correctly', () => {
    // Past date is overdue
    expect(isTaskOverdue('2020-01-01', '10:00', false)).toBe(true);

    // Completed task is never overdue
    expect(isTaskOverdue('2020-01-01', '10:00', true)).toBe(false);

    // Far future date is not overdue
    expect(isTaskOverdue('2099-12-31', '23:59', false)).toBe(false);
  });

  it('formats short dates nicely', () => {
    const formatted = formatDateShort('2026-08-19');
    expect(formatted).toBeTruthy();
  });
});
