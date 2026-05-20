import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { loadProgressHistory, recordSession, computeMetrics } from './progressTracker.js';

/**
 * **Validates: Requirements 30.2, 30.3**
 */

describe('Progress Tracker', () => {
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

  const sessionArb = fc.record({
    topic: fc.constantFrom('linear', 'quadratic', 'exponential', 'inequalities', 'simultaneous'),
    questionsAttempted: fc.integer({ min: 1, max: 20 }),
    questionsCorrect: fc.integer({ min: 0, max: 20 }),
    timestamp: fc.integer({ min: 1700000000000, max: 1800000000000 }),
  }).map(s => ({
    ...s,
    questionsCorrect: Math.min(s.questionsCorrect, s.questionsAttempted),
  }));

  describe('30.2: Progress session history capped at 50', () => {
    it('history never exceeds 50 entries after recording sessions', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 45, max: 60 }),
          async (totalSessions) => {
            window.storage._data = {};

            for (let i = 0; i < totalSessions; i++) {
              await recordSession({
                topic: 'linear',
                questionsAttempted: 5,
                questionsCorrect: 3,
                timestamp: Date.now() + i,
              });
            }

            const history = await loadProgressHistory();
            expect(history.length).toBeLessThanOrEqual(50);
          }
        ),
        { numRuns: 20 }
      );
    });

    it('most recent sessions are preserved when trimming', async () => {
      window.storage._data = {};

      // Record 55 sessions
      for (let i = 0; i < 55; i++) {
        await recordSession({
          topic: 'linear',
          questionsAttempted: 5,
          questionsCorrect: i, // Use i as a marker
          timestamp: i,
        });
      }

      const history = await loadProgressHistory();
      expect(history.length).toBe(50);
      // The last entry should be the most recent (i=54)
      expect(history[history.length - 1].questionsCorrect).toBe(54);
      // The first entry should be i=5 (oldest 5 were trimmed)
      expect(history[0].questionsCorrect).toBe(5);
    });
  });

  describe('30.3: Progress metrics computation correctness', () => {
    it('overallAccuracy equals totalCorrect / totalAttempted * 100', () => {
      fc.assert(
        fc.property(
          fc.array(sessionArb, { minLength: 1, maxLength: 20 }),
          (sessions) => {
            const metrics = computeMetrics(sessions);
            const totalAttempted = sessions.reduce((s, r) => s + r.questionsAttempted, 0);
            const totalCorrect = sessions.reduce((s, r) => s + r.questionsCorrect, 0);
            const expectedAccuracy = totalAttempted > 0 ? (totalCorrect / totalAttempted) * 100 : 0;

            expect(metrics.overallAccuracy).toBeCloseTo(expectedAccuracy, 10);
          }
        ),
        { numRuns: 200 }
      );
    });

    it('totalQuestions equals sum of all questionsAttempted', () => {
      fc.assert(
        fc.property(
          fc.array(sessionArb, { minLength: 1, maxLength: 20 }),
          (sessions) => {
            const metrics = computeMetrics(sessions);
            const expected = sessions.reduce((s, r) => s + r.questionsAttempted, 0);
            expect(metrics.totalQuestions).toBe(expected);
          }
        ),
        { numRuns: 200 }
      );
    });

    it('empty sessions return zero metrics', () => {
      const metrics = computeMetrics([]);
      expect(metrics.overallAccuracy).toBe(0);
      expect(metrics.totalQuestions).toBe(0);
      expect(metrics.currentStreak).toBe(0);
      expect(metrics.bestStreak).toBe(0);
      expect(metrics.strongestTopic).toBeNull();
      expect(metrics.weakestTopic).toBeNull();
    });

    it('perTopicAccuracy is computed correctly per topic', () => {
      fc.assert(
        fc.property(
          fc.array(sessionArb, { minLength: 1, maxLength: 20 }),
          (sessions) => {
            const metrics = computeMetrics(sessions);

            for (const [topic, accuracy] of Object.entries(metrics.perTopicAccuracy)) {
              const topicSessions = sessions.filter(s => s.topic === topic);
              const attempted = topicSessions.reduce((s, r) => s + r.questionsAttempted, 0);
              const correct = topicSessions.reduce((s, r) => s + r.questionsCorrect, 0);
              const expected = attempted > 0 ? (correct / attempted) * 100 : 0;
              expect(accuracy).toBeCloseTo(expected, 10);
            }
          }
        ),
        { numRuns: 200 }
      );
    });
  });
});
