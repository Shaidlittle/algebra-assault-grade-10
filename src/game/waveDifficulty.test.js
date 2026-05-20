import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { getWaveDifficulty } from './waveDifficulty.js';

/**
 * **Validates: Requirements 19.2, 19.3**
 */

describe('Wave Difficulty', () => {
  describe('19.2: Wave difficulty parameters within bounds', () => {
    it('all returned parameters are positive numbers for any wave number', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 100 }),
          (waveNumber) => {
            const params = getWaveDifficulty(waveNumber);

            expect(params.spawnInterval).toBeGreaterThan(0);
            expect(params.alienSpeed).toBeGreaterThan(0);
            expect(params.shootingInterval).toBeGreaterThan(0);
          }
        ),
        { numRuns: 200 }
      );
    });

    it('spawnInterval is between 30 and 100 for valid waves', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 4 }),
          (waveNumber) => {
            const params = getWaveDifficulty(waveNumber);
            expect(params.spawnInterval).toBeGreaterThanOrEqual(30);
            expect(params.spawnInterval).toBeLessThanOrEqual(100);
          }
        ),
        { numRuns: 20 }
      );
    });

    it('alienSpeed is between 1.0 and 3.0 for valid waves', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 4 }),
          (waveNumber) => {
            const params = getWaveDifficulty(waveNumber);
            expect(params.alienSpeed).toBeGreaterThanOrEqual(1.0);
            expect(params.alienSpeed).toBeLessThanOrEqual(3.0);
          }
        ),
        { numRuns: 20 }
      );
    });

    it('shootingInterval is between 700 and 1700 for valid waves', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 4 }),
          (waveNumber) => {
            const params = getWaveDifficulty(waveNumber);
            expect(params.shootingInterval).toBeGreaterThanOrEqual(700);
            expect(params.shootingInterval).toBeLessThanOrEqual(1700);
          }
        ),
        { numRuns: 20 }
      );
    });
  });

  describe('19.3: Wave difficulty monotonic progression', () => {
    it('spawnInterval decreases (or stays same) as wave number increases', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 3 }),
          (waveNumber) => {
            const current = getWaveDifficulty(waveNumber);
            const next = getWaveDifficulty(waveNumber + 1);
            expect(next.spawnInterval).toBeLessThanOrEqual(current.spawnInterval);
          }
        ),
        { numRuns: 20 }
      );
    });

    it('alienSpeed increases (or stays same) as wave number increases', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 3 }),
          (waveNumber) => {
            const current = getWaveDifficulty(waveNumber);
            const next = getWaveDifficulty(waveNumber + 1);
            expect(next.alienSpeed).toBeGreaterThanOrEqual(current.alienSpeed);
          }
        ),
        { numRuns: 20 }
      );
    });

    it('shootingInterval decreases (or stays same) as wave number increases', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 3 }),
          (waveNumber) => {
            const current = getWaveDifficulty(waveNumber);
            const next = getWaveDifficulty(waveNumber + 1);
            expect(next.shootingInterval).toBeLessThanOrEqual(current.shootingInterval);
          }
        ),
        { numRuns: 20 }
      );
    });
  });
});
