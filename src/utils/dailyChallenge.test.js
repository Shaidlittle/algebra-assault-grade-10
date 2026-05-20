import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { getDailyQuestions, updateStreak } from './dailyChallenge.js';

/**
 * **Validates: Requirements 37.2, 37.3**
 */

describe('Daily Challenge', () => {
  // Minimal question bank for testing
  const mockQuestionsBank = {
    linear: {
      medium: [
        { q: 'Solve 2x + 3 = 7', answers: ['x=2', 'x=3', 'x=4', 'x=5'] },
        { q: 'Solve x - 1 = 4', answers: ['x=5', 'x=3', 'x=4', 'x=6'] },
      ],
      hard: [
        { q: 'Solve 3x + 2 = 11', answers: ['x=3', 'x=4', 'x=2', 'x=5'] },
      ],
    },
    quadratic: {
      medium: [
        { q: 'Solve x² = 9', answers: ['x=±3', 'x=3', 'x=9', 'x=±9'] },
        { q: 'Solve x² - 4 = 0', answers: ['x=±2', 'x=2', 'x=4', 'x=±4'] },
      ],
      hard: [
        { q: 'Solve x² + 2x - 3 = 0', answers: ['x=1,-3', 'x=3,-1', 'x=1,3', 'x=-1,-3'] },
      ],
    },
    exponential: {
      medium: [
        { q: 'Simplify 2³', answers: ['8', '6', '9', '12'] },
      ],
      hard: [
        { q: 'Solve 2^x = 16', answers: ['x=4', 'x=3', 'x=5', 'x=8'] },
      ],
    },
  };

  describe('37.2: Daily challenge determinism and constraints', () => {
    it('same date always produces the same 3 questions', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 2024, max: 2030 }),
          fc.integer({ min: 1, max: 12 }),
          fc.integer({ min: 1, max: 28 }),
          (year, month, day) => {
            const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const result1 = getDailyQuestions(dateStr, mockQuestionsBank);
            const result2 = getDailyQuestions(dateStr, mockQuestionsBank);

            expect(result1).toEqual(result2);
          }
        ),
        { numRuns: 200 }
      );
    });

    it('always returns exactly 3 questions', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 2024, max: 2030 }),
          fc.integer({ min: 1, max: 12 }),
          fc.integer({ min: 1, max: 28 }),
          (year, month, day) => {
            const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const result = getDailyQuestions(dateStr, mockQuestionsBank);
            expect(result).toHaveLength(3);
          }
        ),
        { numRuns: 200 }
      );
    });

    it('each question has a topic field and difficulty of medium or hard', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 2024, max: 2030 }),
          fc.integer({ min: 1, max: 12 }),
          fc.integer({ min: 1, max: 28 }),
          (year, month, day) => {
            const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const result = getDailyQuestions(dateStr, mockQuestionsBank);

            for (const q of result) {
              expect(q.topic).toBeDefined();
              expect(['medium', 'hard']).toContain(q.difficulty);
            }
          }
        ),
        { numRuns: 200 }
      );
    });
  });

  describe('37.3: Daily streak update logic', () => {
    it('same day completion is idempotent (streak unchanged)', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 100 }),
          (currentStreak) => {
            const today = '2024-06-15';
            const streakData = { lastCompletedDate: today, currentStreak };
            const result = updateStreak(streakData, today);

            expect(result.currentStreak).toBe(currentStreak);
            expect(result.lastCompletedDate).toBe(today);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('consecutive day increments streak by 1', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 100 }),
          (currentStreak) => {
            const yesterday = '2024-06-14';
            const today = '2024-06-15';
            const streakData = { lastCompletedDate: yesterday, currentStreak };
            const result = updateStreak(streakData, today);

            expect(result.currentStreak).toBe(currentStreak + 1);
            expect(result.lastCompletedDate).toBe(today);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('gap of 2+ days resets streak to 1', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 100 }),
          (currentStreak) => {
            const twoDaysAgo = '2024-06-13';
            const today = '2024-06-15';
            const streakData = { lastCompletedDate: twoDaysAgo, currentStreak };
            const result = updateStreak(streakData, today);

            expect(result.currentStreak).toBe(1);
            expect(result.lastCompletedDate).toBe(today);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('null lastCompletedDate starts streak at 1', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 2024, max: 2030 }),
          fc.integer({ min: 1, max: 12 }),
          fc.integer({ min: 1, max: 28 }),
          (year, month, day) => {
            const today = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const streakData = { lastCompletedDate: null, currentStreak: 0 };
            const result = updateStreak(streakData, today);

            expect(result.currentStreak).toBe(1);
            expect(result.lastCompletedDate).toBe(today);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
