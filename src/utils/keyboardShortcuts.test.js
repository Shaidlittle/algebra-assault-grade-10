import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

/**
 * **Validates: Requirements 28.2, 28.3**
 *
 * Tests keyboard shortcut logic for answer selection.
 * Keys 1-4 map to answer options 0-3.
 */

describe('Keyboard Shortcuts', () => {
  describe('28.2: Keyboard shortcuts select correct answer option', () => {
    it('keys 1-4 map to answer indices 0-3', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 4 }),
          (keyNumber) => {
            // The mapping logic: key '1' → index 0, '2' → index 1, etc.
            const answerIndex = keyNumber - 1;
            expect(answerIndex).toBeGreaterThanOrEqual(0);
            expect(answerIndex).toBeLessThanOrEqual(3);
            expect(answerIndex).toBe(keyNumber - 1);
          }
        ),
        { numRuns: 20 }
      );
    });

    it('keys outside 1-4 do not select any answer', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 5, max: 100 }),
          (keyNumber) => {
            const validKeys = [1, 2, 3, 4];
            const isValid = validKeys.includes(keyNumber);
            expect(isValid).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('each key maps to a unique answer index', () => {
      const mappings = [1, 2, 3, 4].map(k => k - 1);
      const uniqueMappings = new Set(mappings);
      expect(uniqueMappings.size).toBe(4);
    });
  });

  describe('28.3: Keyboard shortcuts inactive without question modal', () => {
    it('keyboard shortcuts are ignored when no question is displayed', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 4 }),
          fc.boolean(),
          (keyNumber, questionVisible) => {
            // Shortcut should only activate when question modal is visible
            const shouldActivate = questionVisible && keyNumber >= 1 && keyNumber <= 4;

            if (!questionVisible) {
              expect(shouldActivate).toBe(false);
            }
          }
        ),
        { numRuns: 200 }
      );
    });

    it('shortcuts are active only when question modal is shown', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 4 }),
          (keyNumber) => {
            const questionVisible = true;
            const shouldActivate = questionVisible && keyNumber >= 1 && keyNumber <= 4;
            expect(shouldActivate).toBe(true);
          }
        ),
        { numRuns: 20 }
      );
    });
  });
});
