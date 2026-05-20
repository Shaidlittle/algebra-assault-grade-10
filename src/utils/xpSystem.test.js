import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { getLevel, getLevelProgress, detectLevelUp, loadXP, awardXP } from './xpSystem.js';

/**
 * **Validates: Requirements 38.2**
 */

describe('XP System', () => {
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

  describe('38.2: XP level formula correctness', () => {
    it('level = min(floor(totalXP / 200) + 1, 50)', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 15000 }),
          (totalXP) => {
            const level = getLevel(totalXP);
            const expected = Math.min(Math.floor(totalXP / 200) + 1, 50);
            expect(level).toBe(expected);
          }
        ),
        { numRuns: 500 }
      );
    });

    it('level is always between 1 and 50', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 100000 }),
          (totalXP) => {
            const level = getLevel(totalXP);
            expect(level).toBeGreaterThanOrEqual(1);
            expect(level).toBeLessThanOrEqual(50);
          }
        ),
        { numRuns: 500 }
      );
    });

    it('level increases monotonically with XP', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 10000 }),
          fc.integer({ min: 0, max: 10000 }),
          (xp1, xp2) => {
            if (xp1 <= xp2) {
              expect(getLevel(xp1)).toBeLessThanOrEqual(getLevel(xp2));
            } else {
              expect(getLevel(xp1)).toBeGreaterThanOrEqual(getLevel(xp2));
            }
          }
        ),
        { numRuns: 500 }
      );
    });

    it('getLevelProgress returns value between 0 and 1', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 15000 }),
          (totalXP) => {
            const progress = getLevelProgress(totalXP);
            expect(progress).toBeGreaterThanOrEqual(0);
            expect(progress).toBeLessThanOrEqual(1);
          }
        ),
        { numRuns: 500 }
      );
    });

    it('detectLevelUp returns true only when level boundary is crossed', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 10000 }),
          fc.integer({ min: 1, max: 500 }),
          (prevXP, award) => {
            const newXP = prevXP + award;
            const levelUp = detectLevelUp(prevXP, newXP);
            const expectedLevelUp = getLevel(newXP) > getLevel(prevXP);
            expect(levelUp).toBe(expectedLevelUp);
          }
        ),
        { numRuns: 500 }
      );
    });

    it('0 XP is level 1 with 0 progress', () => {
      expect(getLevel(0)).toBe(1);
      expect(getLevelProgress(0)).toBe(0);
    });

    it('199 XP is still level 1', () => {
      expect(getLevel(199)).toBe(1);
    });

    it('200 XP is level 2', () => {
      expect(getLevel(200)).toBe(2);
    });

    it('max level is 50 even with very high XP', () => {
      expect(getLevel(100000)).toBe(50);
      expect(getLevelProgress(100000)).toBe(1);
    });
  });
});
