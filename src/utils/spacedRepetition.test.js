import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  INTERVALS,
  scheduleNewMistake,
  advanceInterval,
  resetInterval,
  getDueQuestions,
  loadSchedule,
  saveSchedule,
  setNamespace,
} from './spacedRepetition.js';

/**
 * **Validates: Requirements 7.1, 7.2, 7.3, 7.4, 7.5, 7.6**
 */

describe('Spaced Repetition', () => {
  beforeEach(() => {
    window.storage = {
      _data: {},
      async get(key) {
        return { value: this._data[key] || null };
      },
      async set(key, value) {
        this._data[key] = value;
      },
    };
  });

  describe('INTERVALS constant', () => {
    it('stage1 is 1 day in milliseconds', () => {
      expect(INTERVALS.stage1).toBe(86400000);
    });

    it('stage2 is 3 days in milliseconds', () => {
      expect(INTERVALS.stage2).toBe(259200000);
    });

    it('stage3 is 7 days in milliseconds', () => {
      expect(INTERVALS.stage3).toBe(604800000);
    });
  });

  describe('scheduleNewMistake', () => {
    it('creates an entry with stage 1 and nextReview = now + 1 day', () => {
      const now = Date.now();
      vi.spyOn(Date, 'now').mockReturnValue(now);

      const mistake = {
        topic: 'linear',
        question: { q: '2x + 3 = 7', a: 'x = 2', wrong: ['x = 3', 'x = 1', 'x = 5'] },
        timestamp: now - 1000,
      };

      const entry = scheduleNewMistake(mistake);

      expect(entry.stage).toBe(1);
      expect(entry.nextReview).toBe(now + INTERVALS.stage1);
      expect(entry.topic).toBe('linear');
      expect(entry.question).toBe(mistake.question);
      expect(entry.timestamp).toBe(mistake.timestamp);

      vi.restoreAllMocks();
    });

    it('uses Date.now() for timestamp if mistake has no timestamp', () => {
      const now = 1700000000000;
      vi.spyOn(Date, 'now').mockReturnValue(now);

      const mistake = { topic: 'quadratic', question: { q: 'x^2 = 4', a: 'x = 2' } };
      const entry = scheduleNewMistake(mistake);

      expect(entry.timestamp).toBe(now);
      expect(entry.nextReview).toBe(now + INTERVALS.stage1);

      vi.restoreAllMocks();
    });
  });

  describe('advanceInterval', () => {
    it('advances stage 1 to stage 2 with nextReview = now + 3 days', () => {
      const now = 1700000000000;
      vi.spyOn(Date, 'now').mockReturnValue(now);

      const entry = { question: {}, topic: 'linear', stage: 1, nextReview: 0, timestamp: 0 };
      const result = advanceInterval(entry);

      expect(result).not.toBeNull();
      expect(result.stage).toBe(2);
      expect(result.nextReview).toBe(now + INTERVALS.stage2);

      vi.restoreAllMocks();
    });

    it('advances stage 2 to stage 3 with nextReview = now + 7 days', () => {
      const now = 1700000000000;
      vi.spyOn(Date, 'now').mockReturnValue(now);

      const entry = { question: {}, topic: 'linear', stage: 2, nextReview: 0, timestamp: 0 };
      const result = advanceInterval(entry);

      expect(result).not.toBeNull();
      expect(result.stage).toBe(3);
      expect(result.nextReview).toBe(now + INTERVALS.stage3);

      vi.restoreAllMocks();
    });

    it('returns null when advancing stage 3 (resolved)', () => {
      const entry = { question: {}, topic: 'linear', stage: 3, nextReview: 0, timestamp: 0 };
      const result = advanceInterval(entry);

      expect(result).toBeNull();
    });

    it('does not mutate the original entry', () => {
      const now = 1700000000000;
      vi.spyOn(Date, 'now').mockReturnValue(now);

      const entry = { question: {}, topic: 'linear', stage: 1, nextReview: 0, timestamp: 0 };
      const originalStage = entry.stage;
      advanceInterval(entry);

      expect(entry.stage).toBe(originalStage);

      vi.restoreAllMocks();
    });
  });

  describe('resetInterval', () => {
    it('resets any stage back to stage 1 with nextReview = now + 1 day', () => {
      const now = 1700000000000;
      vi.spyOn(Date, 'now').mockReturnValue(now);

      const entry2 = { question: {}, topic: 'linear', stage: 2, nextReview: 0, timestamp: 0 };
      const result2 = resetInterval(entry2);
      expect(result2.stage).toBe(1);
      expect(result2.nextReview).toBe(now + INTERVALS.stage1);

      const entry3 = { question: {}, topic: 'linear', stage: 3, nextReview: 0, timestamp: 0 };
      const result3 = resetInterval(entry3);
      expect(result3.stage).toBe(1);
      expect(result3.nextReview).toBe(now + INTERVALS.stage1);

      vi.restoreAllMocks();
    });

    it('does not mutate the original entry', () => {
      const now = 1700000000000;
      vi.spyOn(Date, 'now').mockReturnValue(now);

      const entry = { question: {}, topic: 'linear', stage: 3, nextReview: 0, timestamp: 0 };
      resetInterval(entry);

      expect(entry.stage).toBe(3);

      vi.restoreAllMocks();
    });
  });

  describe('getDueQuestions', () => {
    it('returns entries where nextReview <= now', () => {
      const now = 1700000000000;
      const schedule = [
        { question: { q: 'a' }, topic: 'linear', stage: 1, nextReview: now - 1000, timestamp: 0 },
        { question: { q: 'b' }, topic: 'quadratic', stage: 2, nextReview: now, timestamp: 0 },
        { question: { q: 'c' }, topic: 'exponential', stage: 1, nextReview: now + 1000, timestamp: 0 },
      ];

      const due = getDueQuestions(schedule, now);

      expect(due).toHaveLength(2);
      expect(due[0].question.q).toBe('a');
      expect(due[1].question.q).toBe('b');
    });

    it('returns empty array when no entries are due', () => {
      const now = 1700000000000;
      const schedule = [
        { question: {}, topic: 'linear', stage: 1, nextReview: now + 86400000, timestamp: 0 },
      ];

      const due = getDueQuestions(schedule, now);
      expect(due).toHaveLength(0);
    });

    it('returns all entries when all are due', () => {
      const now = 1700000000000;
      const schedule = [
        { question: {}, topic: 'linear', stage: 1, nextReview: now - 1000, timestamp: 0 },
        { question: {}, topic: 'quadratic', stage: 2, nextReview: now - 500, timestamp: 0 },
      ];

      const due = getDueQuestions(schedule, now);
      expect(due).toHaveLength(2);
    });

    it('handles empty schedule', () => {
      const due = getDueQuestions([], Date.now());
      expect(due).toHaveLength(0);
    });
  });

  describe('loadSchedule and saveSchedule', () => {
    it('returns empty array when no data in storage', async () => {
      const schedule = await loadSchedule();
      expect(schedule).toEqual([]);
    });

    it('round-trips schedule data through storage', async () => {
      const entries = [
        { question: { q: '2x = 4' }, topic: 'linear', stage: 1, nextReview: 1700086400000, timestamp: 1700000000000 },
        { question: { q: 'x^2 = 9' }, topic: 'quadratic', stage: 2, nextReview: 1700259200000, timestamp: 1700000000000 },
      ];

      await saveSchedule(entries);
      const loaded = await loadSchedule();

      expect(loaded).toEqual(entries);
    });

    it('returns empty array when storage throws on get', async () => {
      window.storage.get = () => { throw new Error('storage error'); };

      const schedule = await loadSchedule();
      expect(schedule).toEqual([]);
    });

    it('does not throw when storage throws on set', async () => {
      window.storage.set = () => { throw new Error('storage error'); };

      await expect(saveSchedule([{ question: {}, stage: 1 }])).resolves.not.toThrow();
    });
  });

  describe('setNamespace', () => {
    it('changes the storage key used by load/save', async () => {
      const entries = [{ question: { q: 'test' }, topic: 'linear', stage: 1, nextReview: 0, timestamp: 0 }];

      setNamespace('alice');
      await saveSchedule(entries);

      // Verify it's stored under the namespaced key
      expect(window.storage._data['alice-spaced-repetition']).toBeDefined();

      const loaded = await loadSchedule();
      expect(loaded).toEqual(entries);

      // Reset to default for other tests
      setNamespace('default');
    });
  });
});
