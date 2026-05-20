import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { loadAdaptiveState, saveAdaptiveState, getAdaptiveLevel, updateAdaptiveState } from './adaptiveDifficulty.js';

/**
 * **Validates: Requirements 34.2, 34.3**
 */

describe('Adaptive Difficulty', () => {
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

  describe('34.2: Adaptive difficulty level transitions', () => {
    it('null/undefined topicState returns easy', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(null, undefined),
          (topicState) => {
            expect(getAdaptiveLevel(topicState)).toBe('easy');
          }
        ),
        { numRuns: 10 }
      );
    });

    it('easyStreak >= 3 promotes to medium', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 3, max: 20 }),
          (easyStreak) => {
            const state = { easyStreak, mediumStreak: 0, hardWrongStreak: 0 };
            expect(getAdaptiveLevel(state)).toBe('medium');
          }
        ),
        { numRuns: 50 }
      );
    });

    it('mediumStreak >= 3 promotes to hard', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 3, max: 20 }),
          (mediumStreak) => {
            const state = { easyStreak: 0, mediumStreak, hardWrongStreak: 0 };
            expect(getAdaptiveLevel(state)).toBe('hard');
          }
        ),
        { numRuns: 50 }
      );
    });

    it('hardWrongStreak >= 2 drops to medium', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 2, max: 20 }),
          (hardWrongStreak) => {
            const state = { easyStreak: 0, mediumStreak: 0, hardWrongStreak };
            expect(getAdaptiveLevel(state)).toBe('medium');
          }
        ),
        { numRuns: 50 }
      );
    });

    it('hardWrongStreak takes priority over mediumStreak', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 2, max: 20 }),
          fc.integer({ min: 3, max: 20 }),
          (hardWrongStreak, mediumStreak) => {
            const state = { easyStreak: 0, mediumStreak, hardWrongStreak };
            // hardWrongStreak >= 2 should take priority
            expect(getAdaptiveLevel(state)).toBe('medium');
          }
        ),
        { numRuns: 50 }
      );
    });

    it('updateAdaptiveState increments correct streaks', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('easy', 'medium', 'hard'),
          fc.constantFrom('linear', 'quadratic', 'exponential', 'inequalities', 'simultaneous'),
          (difficulty, topic) => {
            const state = {};
            const newState = updateAdaptiveState(state, topic, difficulty, true);

            if (difficulty === 'easy') {
              expect(newState[topic].easyStreak).toBe(1);
            } else if (difficulty === 'medium') {
              expect(newState[topic].mediumStreak).toBe(1);
            } else if (difficulty === 'hard') {
              expect(newState[topic].hardWrongStreak).toBe(0);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('updateAdaptiveState resets streak on wrong answer', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('easy', 'medium'),
          fc.constantFrom('linear', 'quadratic', 'exponential', 'inequalities', 'simultaneous'),
          fc.integer({ min: 1, max: 10 }),
          (difficulty, topic, prevStreak) => {
            const prev = { easyStreak: prevStreak, mediumStreak: prevStreak, hardWrongStreak: 0 };
            const state = { [topic]: prev };
            const newState = updateAdaptiveState(state, topic, difficulty, false);

            if (difficulty === 'easy') {
              expect(newState[topic].easyStreak).toBe(0);
            } else if (difficulty === 'medium') {
              expect(newState[topic].mediumStreak).toBe(0);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('updateAdaptiveState does not mutate input state', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('easy', 'medium', 'hard'),
          fc.constantFrom('linear', 'quadratic', 'exponential', 'inequalities', 'simultaneous'),
          fc.boolean(),
          (difficulty, topic, correct) => {
            const original = { [topic]: { easyStreak: 2, mediumStreak: 1, hardWrongStreak: 0 } };
            const originalCopy = JSON.parse(JSON.stringify(original));

            updateAdaptiveState(original, topic, difficulty, correct);

            expect(original).toEqual(originalCopy);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('34.3: Adaptive state persistence round-trip', () => {
    it('saved state can be loaded back identically', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            linear: fc.record({
              easyStreak: fc.integer({ min: 0, max: 10 }),
              mediumStreak: fc.integer({ min: 0, max: 10 }),
              hardWrongStreak: fc.integer({ min: 0, max: 10 }),
            }),
          }),
          async (state) => {
            window.storage._data = {};

            await saveAdaptiveState(state);
            const loaded = await loadAdaptiveState();

            expect(loaded).toEqual(state);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
