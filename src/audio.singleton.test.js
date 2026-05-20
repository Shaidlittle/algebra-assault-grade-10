import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';

/**
 * **Validates: Requirements 24.2, 24.3**
 */

describe('AudioContext', () => {
  let playSound;
  let _resetAudioContext;
  let constructionCount;
  let mockCtx;
  let shouldThrow;

  beforeEach(async () => {
    constructionCount = 0;
    shouldThrow = false;

    mockCtx = {
      currentTime: 0,
      state: 'running',
      destination: {},
      resume: vi.fn(),
      createOscillator: vi.fn(() => ({
        connect: vi.fn(),
        type: 'triangle',
        frequency: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
        start: vi.fn(),
        stop: vi.fn(),
      })),
      createGain: vi.fn(() => ({
        connect: vi.fn(),
        gain: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
      })),
    };

    // Set up AudioContext mock BEFORE importing the module
    window.AudioContext = function () {
      constructionCount++;
      if (shouldThrow) {
        shouldThrow = false; // Only throw once
        throw new Error('AudioContext creation failed');
      }
      return mockCtx;
    };
    window.webkitAudioContext = window.AudioContext;

    // Use dynamic import with cache busting to get a fresh module
    vi.resetModules();
    const audioModule = await import('./audio.js');
    playSound = audioModule.playSound;
    _resetAudioContext = audioModule._resetAudioContext;
    _resetAudioContext();
    constructionCount = 0;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('24.2: AudioContext singleton guarantee', () => {
    it('multiple playSound calls reuse the same AudioContext instance', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 2, max: 10 }),
          (callCount) => {
            _resetAudioContext();
            constructionCount = 0;

            for (let i = 0; i < callCount; i++) {
              playSound('shoot', true);
            }

            // AudioContext should only be created once
            expect(constructionCount).toBe(1);
          }
        ),
        { numRuns: 50 }
      );
    });

    it('different sound types all use the same AudioContext', () => {
      _resetAudioContext();
      constructionCount = 0;

      const soundTypes = ['shoot', 'kill', 'hit', 'wrong', 'tick', 'tickHigh'];

      for (const type of soundTypes) {
        playSound(type, true);
      }

      expect(constructionCount).toBe(1);
    });
  });

  describe('24.3: AudioContext retry after creation failure', () => {
    it('retries AudioContext creation on next call after initial failure', () => {
      _resetAudioContext();
      constructionCount = 0;
      shouldThrow = true;

      // First call fails (shouldThrow is true)
      playSound('shoot', true);
      expect(constructionCount).toBe(1);

      // Second call should retry (since sharedCtx is still null after failure)
      playSound('shoot', true);
      expect(constructionCount).toBe(2);
    });

    it('after successful retry, subsequent calls reuse the context', () => {
      _resetAudioContext();
      constructionCount = 0;
      shouldThrow = true;

      // First call fails
      playSound('shoot', true);
      // Second call succeeds (shouldThrow was reset to false after first throw)
      playSound('shoot', true);
      // Third call should reuse
      playSound('shoot', true);

      expect(constructionCount).toBe(2); // Only 2 construction attempts
    });
  });
});
