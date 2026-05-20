import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { loadHighScores, saveHighScore, shouldUpdateHighScore } from './highScores.js';

/**
 * **Validates: Requirements 26.2**
 */

describe('High Scores', () => {
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

  describe('26.2: High score persistence preserves maximum', () => {
    it('shouldUpdateHighScore returns true only when current > stored', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 10000 }),
          fc.integer({ min: 0, max: 10000 }),
          (currentScore, storedBest) => {
            const result = shouldUpdateHighScore(currentScore, storedBest);
            expect(result).toBe(currentScore > storedBest);
          }
        ),
        { numRuns: 500 }
      );
    });

    it('shouldUpdateHighScore returns true when no stored best exists', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 10000 }),
          fc.constantFrom(null, undefined),
          (currentScore, storedBest) => {
            const result = shouldUpdateHighScore(currentScore, storedBest);
            expect(result).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('saveHighScore only persists when score exceeds stored best', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 10 }),
          fc.integer({ min: 100, max: 500 }),
          fc.integer({ min: 0, max: 1000 }),
          async (topic, initialBest, newScore) => {
            // Set initial high score
            window.storage._data = {};
            window.storage._data['default-highscores'] = JSON.stringify({ [topic]: initialBest });

            await saveHighScore(topic, newScore);

            const scores = await loadHighScores();
            if (newScore > initialBest) {
              expect(scores[topic]).toBe(newScore);
            } else {
              expect(scores[topic]).toBe(initialBest);
            }
          }
        ),
        { numRuns: 200 }
      );
    });
  });
});
