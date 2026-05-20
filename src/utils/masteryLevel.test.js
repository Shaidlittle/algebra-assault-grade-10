import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { getMasteryLevel, getMasteryColor, computeTopicMasteries } from './masteryLevel.js';

/**
 * **Validates: Requirements 36.2**
 */

describe('Mastery Level', () => {
  describe('36.2: Mastery level threshold correctness', () => {
    it('accuracy >= 90 returns diamond', () => {
      fc.assert(
        fc.property(
          fc.double({ min: 90, max: 100, noNaN: true, noDefaultInfinity: true }),
          (accuracy) => {
            expect(getMasteryLevel(accuracy)).toBe('diamond');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('accuracy >= 80 and < 90 returns gold', () => {
      fc.assert(
        fc.property(
          fc.double({ min: 80, max: 89.999, noNaN: true, noDefaultInfinity: true }),
          (accuracy) => {
            expect(getMasteryLevel(accuracy)).toBe('gold');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('accuracy >= 60 and < 80 returns silver', () => {
      fc.assert(
        fc.property(
          fc.double({ min: 60, max: 79.999, noNaN: true, noDefaultInfinity: true }),
          (accuracy) => {
            expect(getMasteryLevel(accuracy)).toBe('silver');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('accuracy >= 40 and < 60 returns bronze', () => {
      fc.assert(
        fc.property(
          fc.double({ min: 40, max: 59.999, noNaN: true, noDefaultInfinity: true }),
          (accuracy) => {
            expect(getMasteryLevel(accuracy)).toBe('bronze');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('accuracy < 40 returns none', () => {
      fc.assert(
        fc.property(
          fc.double({ min: 0, max: 39.999, noNaN: true, noDefaultInfinity: true }),
          (accuracy) => {
            expect(getMasteryLevel(accuracy)).toBe('none');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('null/undefined/negative accuracy returns none', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(null, undefined, -1, -100),
          (accuracy) => {
            expect(getMasteryLevel(accuracy)).toBe('none');
          }
        ),
        { numRuns: 10 }
      );
    });

    it('getMasteryColor returns a valid hex color for every level', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('none', 'bronze', 'silver', 'gold', 'diamond'),
          (level) => {
            const color = getMasteryColor(level);
            expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/);
          }
        ),
        { numRuns: 10 }
      );
    });

    it('computeTopicMasteries maps each topic to correct mastery level', () => {
      fc.assert(
        fc.property(
          fc.record({
            linear: fc.double({ min: 0, max: 100, noNaN: true, noDefaultInfinity: true }),
            quadratic: fc.double({ min: 0, max: 100, noNaN: true, noDefaultInfinity: true }),
            exponential: fc.double({ min: 0, max: 100, noNaN: true, noDefaultInfinity: true }),
          }),
          (perTopicAccuracy) => {
            const masteries = computeTopicMasteries(perTopicAccuracy);

            for (const [topic, accuracy] of Object.entries(perTopicAccuracy)) {
              expect(masteries[topic]).toBe(getMasteryLevel(accuracy));
            }
          }
        ),
        { numRuns: 200 }
      );
    });
  });
});
