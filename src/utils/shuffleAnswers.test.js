import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { shuffleAnswers, getDisplayValue } from './shuffleAnswers.js';

/**
 * **Validates: Requirements 15.2, 15.3, 15.4**
 */

describe('Shuffle Answers', () => {
  describe('15.2: Shuffler output is a permutation of input', () => {
    it('shuffled output contains exactly the same elements as input', () => {
      fc.assert(
        fc.property(
          fc.array(fc.string({ minLength: 1, maxLength: 30 }), { minLength: 4, maxLength: 4 }),
          fc.integer({ min: 0, max: 1000000 }),
          (answers, seed) => {
            const result = shuffleAnswers(answers, seed);

            expect(result).toHaveLength(answers.length);
            expect([...result].sort()).toEqual([...answers].sort());
          }
        ),
        { numRuns: 500 }
      );
    });

    it('does not mutate the original array', () => {
      fc.assert(
        fc.property(
          fc.array(fc.string({ minLength: 1, maxLength: 30 }), { minLength: 4, maxLength: 4 }),
          fc.integer({ min: 0, max: 1000000 }),
          (answers, seed) => {
            const original = [...answers];
            shuffleAnswers(answers, seed);
            expect(answers).toEqual(original);
          }
        ),
        { numRuns: 200 }
      );
    });
  });

  describe('15.3: Shuffler determinism (same seed → same output)', () => {
    it('same seed always produces the same shuffle', () => {
      fc.assert(
        fc.property(
          fc.array(fc.string({ minLength: 1, maxLength: 30 }), { minLength: 4, maxLength: 4 }),
          fc.integer({ min: 0, max: 1000000 }),
          (answers, seed) => {
            const result1 = shuffleAnswers(answers, seed);
            const result2 = shuffleAnswers(answers, seed);
            expect(result1).toEqual(result2);
          }
        ),
        { numRuns: 500 }
      );
    });
  });

  describe('15.4: Shuffler uniform distribution (chi-squared test across 2400+ seeds)', () => {
    it('all permutations appear with roughly equal frequency (chi-squared test)', () => {
      const answers = ['A', 'B', 'C', 'D'];
      const numSeeds = 2400;
      const permutationCounts = {};

      for (let seed = 0; seed < numSeeds; seed++) {
        const result = shuffleAnswers(answers, seed);
        const key = result.join(',');
        permutationCounts[key] = (permutationCounts[key] || 0) + 1;
      }

      // 4! = 24 possible permutations
      const numPermutations = 24;
      const expected = numSeeds / numPermutations; // 100 per permutation

      // Chi-squared test
      let chiSquared = 0;
      const keys = Object.keys(permutationCounts);

      // All 24 permutations should appear
      expect(keys.length).toBe(numPermutations);

      for (const key of keys) {
        const observed = permutationCounts[key];
        chiSquared += Math.pow(observed - expected, 2) / expected;
      }

      // Chi-squared critical value for df=23, p=0.01 is ~41.6
      // Use a generous threshold to avoid flaky tests
      expect(chiSquared).toBeLessThan(50);
    });
  });
});

/**
 * **Validates: Requirements 6.1, 6.2, 6.4**
 */
describe('getDisplayValue', () => {
  describe('6.1: Handles plain-string distractors (legacy format)', () => {
    it('returns the string itself for plain-string distractors', () => {
      expect(getDisplayValue('x = 5')).toBe('x = 5');
      expect(getDisplayValue('')).toBe('');
      expect(getDisplayValue('hello')).toBe('hello');
    });

    it('returns the string for any arbitrary string input (property)', () => {
      fc.assert(
        fc.property(fc.string(), (s) => {
          expect(getDisplayValue(s)).toBe(s);
        }),
        { numRuns: 200 }
      );
    });
  });

  describe('6.1: Handles { value, tag } object format', () => {
    it('returns the value property from object distractors', () => {
      expect(getDisplayValue({ value: 'x = 5', tag: 'sign_error' })).toBe('x = 5');
      expect(getDisplayValue({ value: '42', tag: 'off_by_one' })).toBe('42');
    });

    it('returns the value property for any object with value and tag (property)', () => {
      fc.assert(
        fc.property(
          fc.record({ value: fc.string(), tag: fc.string() }),
          (obj) => {
            expect(getDisplayValue(obj)).toBe(obj.value);
          }
        ),
        { numRuns: 200 }
      );
    });

    it('handles object with value but no tag', () => {
      expect(getDisplayValue({ value: 'x = 3' })).toBe('x = 3');
    });
  });

  describe('6.4: Returns empty string for null/undefined without throwing', () => {
    it('returns empty string for null', () => {
      expect(getDisplayValue(null)).toBe('');
    });

    it('returns empty string for undefined', () => {
      expect(getDisplayValue(undefined)).toBe('');
    });

    it('returns empty string when object value is null', () => {
      expect(getDisplayValue({ value: null, tag: 'sign_error' })).toBe('');
    });

    it('returns empty string when object value is undefined', () => {
      expect(getDisplayValue({ value: undefined, tag: 'sign_error' })).toBe('');
    });
  });

  describe('6.2: Handles mixed-format arrays', () => {
    it('correctly extracts display values from mixed arrays', () => {
      const mixed = [
        'plain string',
        { value: 'object value', tag: 'sign_error' },
        { value: 'another', tag: 'off_by_one' },
      ];
      const results = mixed.map(getDisplayValue);
      expect(results).toEqual(['plain string', 'object value', 'another']);
    });
  });

  describe('Edge cases', () => {
    it('converts numeric values to string via String()', () => {
      expect(getDisplayValue({ value: 42 })).toBe('42');
    });

    it('converts non-string/non-object primitives to string', () => {
      expect(getDisplayValue(123)).toBe('123');
      expect(getDisplayValue(true)).toBe('true');
    });
  });
});
