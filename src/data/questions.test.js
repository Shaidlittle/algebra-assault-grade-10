import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { QUESTIONS } from './questions.js';
import { ERROR_CATALOG } from './errorCatalog.js';

/**
 * **Validates: Requirements 1.1, 3.1, 3.2, 3.3, 3.4**
 *
 * Property 1: Question data structure invariant
 *
 * For any topic key in the QUESTIONS export (excluding those with isUltimate or
 * isExam set to true), the topic object SHALL contain name (string), short (string),
 * color (string), bgColor (string), icon (string), and three arrays easy, medium,
 * hard where every element has fields q (string), a (string), wrong (array of
 * exactly 3 tagged distractor objects), and hint (string).
 */
describe('Question data structure invariant', () => {
  // Get all topic keys that are not ultimate or exam
  const playableTopicKeys = Object.keys(QUESTIONS).filter(
    (key) => !QUESTIONS[key].isUltimate && !QUESTIONS[key].isExam
  );

  it('should have at least one playable topic', () => {
    expect(playableTopicKeys.length).toBeGreaterThan(0);
  });

  it('every playable topic has required metadata and difficulty arrays with valid question objects', () => {
    // Use fast-check to sample from all playable topic keys
    const topicKeyArb = fc.constantFrom(...playableTopicKeys);

    fc.assert(
      fc.property(topicKeyArb, (topicKey) => {
        const topic = QUESTIONS[topicKey];

        // Metadata checks
        expect(typeof topic.name).toBe('string');
        expect(typeof topic.short).toBe('string');
        expect(typeof topic.color).toBe('string');
        expect(typeof topic.bgColor).toBe('string');
        expect(typeof topic.icon).toBe('string');

        // Difficulty arrays exist and are arrays
        expect(Array.isArray(topic.easy)).toBe(true);
        expect(Array.isArray(topic.medium)).toBe(true);
        expect(Array.isArray(topic.hard)).toBe(true);

        // Each difficulty array has at least one question
        expect(topic.easy.length).toBeGreaterThan(0);
        expect(topic.medium.length).toBeGreaterThan(0);
        expect(topic.hard.length).toBeGreaterThan(0);

        // Validate every question in all difficulty tiers
        const allQuestions = [...topic.easy, ...topic.medium, ...topic.hard];
        for (const question of allQuestions) {
          expect(typeof question.q).toBe('string');
          expect(typeof question.a).toBe('string');
          expect(Array.isArray(question.wrong)).toBe(true);
          expect(question.wrong).toHaveLength(3);
          for (const w of question.wrong) {
            // Each distractor is a tagged object with value and tag
            expect(typeof w).toBe('object');
            expect(w).not.toBeNull();
            expect(typeof w.value).toBe('string');
            expect(typeof w.tag).toBe('string');
            expect(w.tag.length).toBeGreaterThan(0);
            // Tag must exist in the Error Catalog
            expect(ERROR_CATALOG).toHaveProperty(w.tag);
          }
          expect(typeof question.hint).toBe('string');
        }
      }),
      { numRuns: 100 }
    );
  });
});
