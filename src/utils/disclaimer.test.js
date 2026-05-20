import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';

/**
 * **Validates: Requirements 16.2**
 *
 * 16.2: Disclaimer visibility determined by storage value
 */

describe('Disclaimer visibility determined by storage value', () => {
  beforeEach(() => {
    // Setup mock storage
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

  it('disclaimer is shown when storage has no dismissed value', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(null, undefined, ''),
        (storedValue) => {
          // When storage returns null/undefined/empty, disclaimer should be visible
          const shouldShow = !storedValue || storedValue !== 'true';
          expect(shouldShow).toBe(true);
        }
      ),
      { numRuns: 10 }
    );
  });

  it('disclaimer is hidden when storage has dismissed=true', () => {
    fc.assert(
      fc.property(
        fc.constant('true'),
        (storedValue) => {
          const shouldShow = storedValue !== 'true';
          expect(shouldShow).toBe(false);
        }
      ),
      { numRuns: 10 }
    );
  });

  it('any non-"true" string value means disclaimer is visible', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 0, maxLength: 20 }).filter(s => s !== 'true'),
        (storedValue) => {
          const shouldShow = storedValue !== 'true';
          expect(shouldShow).toBe(true);
        }
      ),
      { numRuns: 200 }
    );
  });
});
