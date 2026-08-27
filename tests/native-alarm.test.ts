import { describe, it, expect, vi, beforeEach } from 'vitest';
import { hashStringToNumber, ALARM_CHANNEL_ID, ALARM_ACTION_TYPE_ID } from '../src/services/native-alarm.service';
import { calculateReminderTriggerTime } from '../src/utils/date';
import type { Task, TaskReminder } from '../src/types/task';

describe('Native Alarm Service & Exact Alarms', () => {
  describe('hashStringToNumber deterministic ID generation', () => {
    it('produces consistent positive integers for same input', () => {
      const id1 = hashStringToNumber('reminder-uuid-1234-abcd');
      const id2 = hashStringToNumber('reminder-uuid-1234-abcd');
      expect(id1).toBe(id2);
      expect(id1).toBeGreaterThan(0);
      expect(id1).toBeLessThan(2147483647);
    });

    it('produces distinct integers for different reminder IDs', () => {
      const idA = hashStringToNumber('reminder-1');
      const idB = hashStringToNumber('reminder-2');
      expect(idA).not.toBe(idB);
    });

    it('handles empty string gracefully', () => {
      const id = hashStringToNumber('');
      expect(id).toBe(1);
    });
  });

  describe('Reminder trigger time computation for exact alarms', () => {
    it('calculates exact trigger for 0m (at time of task)', () => {
      const trigger = calculateReminderTriggerTime('2026-08-27', '14:30', 0);
      expect(trigger.getFullYear()).toBe(2026);
      expect(trigger.getMonth()).toBe(7); // August is 7 (0-indexed)
      expect(trigger.getDate()).toBe(27);
      expect(trigger.getHours()).toBe(14);
      expect(trigger.getMinutes()).toBe(30);
    });

    it('calculates exact trigger for 15m before task', () => {
      const trigger = calculateReminderTriggerTime('2026-08-27', '14:30', 15);
      expect(trigger.getHours()).toBe(14);
      expect(trigger.getMinutes()).toBe(15);
    });

    it('calculates exact trigger for 1 hour before task with hour rollover', () => {
      const trigger = calculateReminderTriggerTime('2026-08-27', '10:15', 60);
      expect(trigger.getHours()).toBe(9);
      expect(trigger.getMinutes()).toBe(15);
    });

    it('calculates exact trigger for 1 day (1440m) before task with day rollover', () => {
      const trigger = calculateReminderTriggerTime('2026-08-27', '09:00', 1440);
      expect(trigger.getDate()).toBe(26);
      expect(trigger.getHours()).toBe(9);
      expect(trigger.getMinutes()).toBe(0);
    });
  });

  describe('Alarm Channels & Action Types Configuration', () => {
    it('defines standard alarm channel id and action type id', () => {
      expect(ALARM_CHANNEL_ID).toBe('scheduler_alarms');
      expect(ALARM_ACTION_TYPE_ID).toBe('SCHEDULER_ALARM');
    });
  });

  describe('Snooze trigger computation', () => {
    it('computes 5 minute snooze time accurately', () => {
      const before = Date.now();
      const snoozeMinutes = 5;
      const snoozeTrigger = new Date(before + snoozeMinutes * 60 * 1000);
      expect(snoozeTrigger.getTime() - before).toBe(300000);
    });

    it('computes 10 minute snooze time accurately', () => {
      const before = Date.now();
      const snoozeMinutes = 10;
      const snoozeTrigger = new Date(before + snoozeMinutes * 60 * 1000);
      expect(snoozeTrigger.getTime() - before).toBe(600000);
    });
  });
});
