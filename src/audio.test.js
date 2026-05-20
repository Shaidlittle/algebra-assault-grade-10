import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { playSound, _resetAudioContext } from './audio.js';

/**
 * **Validates: Requirements 3.5, 3.6, 3.7**
 *
 * Property 3: playSound never throws
 *
 * For any string `type` (including unsupported types, empty string, and random
 * Unicode) and for any boolean `enabled` value, calling `playSound(type, enabled)`
 * SHALL never throw an exception, regardless of whether the Web Audio API is
 * available or throws internally.
 */
describe('playSound never throws', () => {
  let originalAudioContext;
  let originalWebkitAudioContext;

  beforeEach(() => {
    originalAudioContext = window.AudioContext;
    originalWebkitAudioContext = window.webkitAudioContext;
    _resetAudioContext();
  });

  afterEach(() => {
    window.AudioContext = originalAudioContext;
    window.webkitAudioContext = originalWebkitAudioContext;
    vi.restoreAllMocks();
  });

  it('never throws for any string type and any boolean enabled when Web Audio API is available', () => {
    // Mock a working AudioContext
    const mockOscillator = {
      connect: vi.fn(),
      type: 'triangle',
      frequency: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
      start: vi.fn(),
      stop: vi.fn(),
    };
    const mockGain = {
      connect: vi.fn(),
      gain: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
    };
    const mockCtx = {
      currentTime: 0,
      destination: {},
      createOscillator: vi.fn(() => mockOscillator),
      createGain: vi.fn(() => mockGain),
    };
    window.AudioContext = vi.fn(() => mockCtx);
    window.webkitAudioContext = vi.fn(() => mockCtx);

    fc.assert(
      fc.property(
        fc.string({ minLength: 0, maxLength: 50 }),
        fc.boolean(),
        (type, enabled) => {
          expect(() => playSound(type, enabled)).not.toThrow();
        }
      ),
      { numRuns: 200 }
    );
  });

  it('never throws for any string type and any boolean enabled when Web Audio API is unavailable', () => {
    // Remove AudioContext entirely
    delete window.AudioContext;
    delete window.webkitAudioContext;

    fc.assert(
      fc.property(
        fc.string({ minLength: 0, maxLength: 50 }),
        fc.boolean(),
        (type, enabled) => {
          expect(() => playSound(type, enabled)).not.toThrow();
        }
      ),
      { numRuns: 200 }
    );
  });

  it('never throws for any string type and any boolean enabled when AudioContext constructor throws', () => {
    // Mock AudioContext that throws on construction
    window.AudioContext = vi.fn(() => {
      throw new Error('AudioContext not allowed');
    });
    window.webkitAudioContext = vi.fn(() => {
      throw new Error('webkitAudioContext not allowed');
    });

    fc.assert(
      fc.property(
        fc.string({ minLength: 0, maxLength: 50 }),
        fc.boolean(),
        (type, enabled) => {
          expect(() => playSound(type, enabled)).not.toThrow();
        }
      ),
      { numRuns: 200 }
    );
  });

  it('never throws for any string type when AudioContext methods throw internally', () => {
    // Mock AudioContext where methods throw
    const mockCtx = {
      currentTime: 0,
      destination: {},
      createOscillator: vi.fn(() => {
        throw new Error('createOscillator failed');
      }),
      createGain: vi.fn(() => {
        throw new Error('createGain failed');
      }),
    };
    window.AudioContext = vi.fn(() => mockCtx);
    window.webkitAudioContext = vi.fn(() => mockCtx);

    fc.assert(
      fc.property(
        fc.string({ minLength: 0, maxLength: 50, unit: 'grapheme-ascii' }),
        (type) => {
          expect(() => playSound(type, true)).not.toThrow();
        }
      ),
      { numRuns: 200 }
    );
  });

  it('never throws for random Unicode strings as type', () => {
    const mockOscillator = {
      connect: vi.fn(),
      type: 'triangle',
      frequency: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
      start: vi.fn(),
      stop: vi.fn(),
    };
    const mockGain = {
      connect: vi.fn(),
      gain: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
    };
    const mockCtx = {
      currentTime: 0,
      destination: {},
      createOscillator: vi.fn(() => mockOscillator),
      createGain: vi.fn(() => mockGain),
    };
    window.AudioContext = vi.fn(() => mockCtx);

    fc.assert(
      fc.property(
        fc.string({ minLength: 0, maxLength: 50, unit: 'grapheme' }),
        fc.boolean(),
        (type, enabled) => {
          expect(() => playSound(type, enabled)).not.toThrow();
        }
      ),
      { numRuns: 200 }
    );
  });
});
