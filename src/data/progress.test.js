import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

/**
 * **Validates: Requirements 7.6**
 *
 * Property 8: Progress serialization round-trip
 *
 * For any object mapping a subset of valid topic keys to true, serializing
 * with JSON.stringify and deserializing with JSON.parse SHALL produce an object
 * deeply equal to the original, ensuring the Storage_API persistence format is lossless.
 */

const VALID_TOPIC_KEYS = [
  'linear',
  'quadratic',
  'expExpr',
  'expEqn',
  'inequality',
  'simultaneous',
  'ultimate',
];

/**
 * Arbitrary that generates a progress object: a subset of valid topic keys mapped to true.
 */
const progressArbitrary = fc
  .subarray(VALID_TOPIC_KEYS, { minLength: 0, maxLength: VALID_TOPIC_KEYS.length })
  .map((keys) => {
    const obj = {};
    for (const key of keys) {
      obj[key] = true;
    }
    return obj;
  });

describe('Progress serialization round-trip', () => {
  it('JSON.parse(JSON.stringify(progress)) deep-equals the original for any subset of valid topic keys', () => {
    fc.assert(
      fc.property(progressArbitrary, (progress) => {
        const serialized = JSON.stringify(progress);
        const deserialized = JSON.parse(serialized);
        expect(deserialized).toEqual(progress);
      }),
      { numRuns: 500 }
    );
  });

  it('serialized format contains only topic keys mapped to true', () => {
    fc.assert(
      fc.property(progressArbitrary, (progress) => {
        const serialized = JSON.stringify(progress);
        const deserialized = JSON.parse(serialized);

        // All keys in deserialized must be valid topic keys
        for (const key of Object.keys(deserialized)) {
          expect(VALID_TOPIC_KEYS).toContain(key);
        }

        // All values must be exactly true (boolean)
        for (const value of Object.values(deserialized)) {
          expect(value).toBe(true);
        }
      }),
      { numRuns: 500 }
    );
  });

  it('empty progress object round-trips correctly', () => {
    const empty = {};
    const deserialized = JSON.parse(JSON.stringify(empty));
    expect(deserialized).toEqual(empty);
  });

  it('full progress object (all topics completed) round-trips correctly', () => {
    const full = {};
    for (const key of VALID_TOPIC_KEYS) {
      full[key] = true;
    }
    const deserialized = JSON.parse(JSON.stringify(full));
    expect(deserialized).toEqual(full);
  });
});
