import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { loadMistakes, recordMistake, markResolved, groupMistakesByTopic, getMistakeStats } from './mistakeJournal.js';

/**
 * **Validates: Requirements 33.2, 33.3**
 */

describe('Mistake Journal', () => {
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

  const mistakeEntryArb = fc.record({
    topic: fc.constantFrom('linear', 'quadratic', 'exponential', 'inequalities', 'simultaneous'),
    question: fc.string({ minLength: 1, maxLength: 50 }),
    selectedAnswer: fc.string({ minLength: 1, maxLength: 20 }),
    correctAnswer: fc.string({ minLength: 1, maxLength: 20 }),
    timestamp: fc.integer({ min: 1700000000000, max: 1800000000000 }),
  });

  describe('33.2: Mistake journal round-trip persistence', () => {
    it('recorded mistakes can be loaded back with resolved=false', async () => {
      await fc.assert(
        fc.asyncProperty(
          mistakeEntryArb,
          async (entry) => {
            window.storage._data = {};

            await recordMistake(entry);
            const mistakes = await loadMistakes();

            expect(mistakes).toHaveLength(1);
            expect(mistakes[0].topic).toBe(entry.topic);
            expect(mistakes[0].question).toBe(entry.question);
            expect(mistakes[0].selectedAnswer).toBe(entry.selectedAnswer);
            expect(mistakes[0].correctAnswer).toBe(entry.correctAnswer);
            expect(mistakes[0].timestamp).toBe(entry.timestamp);
            expect(mistakes[0].resolved).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('markResolved changes resolved to true for matching entry', async () => {
      await fc.assert(
        fc.asyncProperty(
          mistakeEntryArb,
          async (entry) => {
            window.storage._data = {};

            await recordMistake(entry);
            await markResolved(entry.topic, entry.timestamp);
            const mistakes = await loadMistakes();

            expect(mistakes[0].resolved).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('multiple mistakes accumulate in storage', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(mistakeEntryArb, { minLength: 1, maxLength: 10 }),
          async (entries) => {
            window.storage._data = {};

            for (const entry of entries) {
              await recordMistake(entry);
            }

            const mistakes = await loadMistakes();
            expect(mistakes).toHaveLength(entries.length);
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  describe('33.3: Mistake grouping correctness', () => {
    it('groupMistakesByTopic groups all mistakes by their topic key', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              topic: fc.constantFrom('linear', 'quadratic', 'exponential'),
              question: fc.string({ minLength: 1, maxLength: 20 }),
              resolved: fc.boolean(),
            }),
            { minLength: 0, maxLength: 20 }
          ),
          (mistakes) => {
            const groups = groupMistakesByTopic(mistakes);

            // Every mistake should appear in its topic group
            for (const m of mistakes) {
              expect(groups[m.topic]).toBeDefined();
              expect(groups[m.topic]).toContain(m);
            }

            // Total count across groups equals input count
            const totalGrouped = Object.values(groups).reduce((s, arr) => s + arr.length, 0);
            expect(totalGrouped).toBe(mistakes.length);
          }
        ),
        { numRuns: 200 }
      );
    });

    it('getMistakeStats returns correct total, resolved, and unresolved counts', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              topic: fc.string({ minLength: 1, maxLength: 10 }),
              resolved: fc.boolean(),
            }),
            { minLength: 0, maxLength: 30 }
          ),
          (mistakes) => {
            const stats = getMistakeStats(mistakes);

            expect(stats.total).toBe(mistakes.length);
            expect(stats.resolved).toBe(mistakes.filter(m => m.resolved).length);
            expect(stats.unresolved).toBe(mistakes.filter(m => !m.resolved).length);
            expect(stats.resolved + stats.unresolved).toBe(stats.total);
          }
        ),
        { numRuns: 200 }
      );
    });
  });
});
