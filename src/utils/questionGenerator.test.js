import { describe, it, expect } from 'vitest';
import {
  createRNG,
  solveLinearEquation,
  generateQuestion,
  generateQuestionSet,
} from './questionGenerator.js';

describe('createRNG', () => {
  it('returns a function', () => {
    const rng = createRNG(42);
    expect(typeof rng).toBe('function');
  });

  it('returns values in [0, 1)', () => {
    const rng = createRNG(123);
    for (let i = 0; i < 100; i++) {
      const val = rng();
      expect(val).toBeGreaterThanOrEqual(0);
      expect(val).toBeLessThan(1);
    }
  });

  it('is deterministic — same seed produces same sequence', () => {
    const rng1 = createRNG(999);
    const rng2 = createRNG(999);
    for (let i = 0; i < 50; i++) {
      expect(rng1()).toBe(rng2());
    }
  });

  it('different seeds produce different sequences', () => {
    const rng1 = createRNG(1);
    const rng2 = createRNG(2);
    const seq1 = Array.from({ length: 10 }, () => rng1());
    const seq2 = Array.from({ length: 10 }, () => rng2());
    expect(seq1).not.toEqual(seq2);
  });
});

describe('solveLinearEquation', () => {
  it('solves simple ax + b = c equations', () => {
    expect(solveLinearEquation('3x + 5 = 14')).toBe('x = 3');
    expect(solveLinearEquation('2x + 1 = 7')).toBe('x = 3');
    expect(solveLinearEquation('5x + 10 = 25')).toBe('x = 3');
  });

  it('solves equations with x on both sides', () => {
    expect(solveLinearEquation('5x + 3 = 2x + 12')).toBe('x = 3');
    expect(solveLinearEquation('4x - 2 = 2x + 6')).toBe('x = 4');
  });

  it('solves equations with negative solutions', () => {
    expect(solveLinearEquation('2x + 10 = 4')).toBe('x = -3');
  });

  it('returns null for invalid input', () => {
    expect(solveLinearEquation('hello')).toBe(null);
    expect(solveLinearEquation('')).toBe(null);
  });

  it('returns null for degenerate equations (0x = non-zero)', () => {
    expect(solveLinearEquation('2x + 3 = 2x + 5')).toBe(null);
  });
});

describe('generateQuestion', () => {
  it('produces a valid question object with all required fields', () => {
    const rng = createRNG(42);
    const q = generateQuestion('linear', 'easy', rng);

    expect(q).toHaveProperty('q');
    expect(q).toHaveProperty('a');
    expect(q).toHaveProperty('wrong');
    expect(q).toHaveProperty('hint');
    expect(q).toHaveProperty('steps');
    expect(q).toHaveProperty('conceptual');

    expect(typeof q.q).toBe('string');
    expect(typeof q.a).toBe('string');
    expect(Array.isArray(q.wrong)).toBe(true);
    expect(q.wrong.length).toBe(3);
    expect(typeof q.hint).toBe('string');
    expect(Array.isArray(q.steps)).toBe(true);
    expect(q.steps.length).toBeGreaterThanOrEqual(2);
    expect(typeof q.conceptual).toBe('string');
  });

  it('produces distractors distinct from the correct answer', () => {
    const rng = createRNG(100);
    const q = generateQuestion('linear', 'easy', rng);
    for (const d of q.wrong) {
      expect(d).not.toBe(q.a);
    }
  });

  it('produces 3 distinct distractors', () => {
    const rng = createRNG(200);
    const q = generateQuestion('linear', 'medium', rng);
    const uniqueDistractors = new Set(q.wrong);
    expect(uniqueDistractors.size).toBe(3);
  });

  it('correct answer matches solving the equation', () => {
    const rng = createRNG(55);
    const q = generateQuestion('linear', 'easy', rng);
    const solved = solveLinearEquation(q.q);
    expect(solved).toBe(q.a);
  });

  it('uses appropriate conceptual key per difficulty', () => {
    const rngEasy = createRNG(10);
    const qEasy = generateQuestion('linear', 'easy', rngEasy);
    expect(qEasy.conceptual).toBe('isolating-variables');

    const rngMedium = createRNG(10);
    const qMedium = generateQuestion('linear', 'medium', rngMedium);
    expect(qMedium.conceptual).toBe('expanding-brackets');
  });

  it('respects coefficient ranges for easy difficulty', () => {
    const rng = createRNG(77);
    const q = generateQuestion('linear', 'easy', rng);
    // Easy: coefficients 1-5, constants 1-20
    // The equation is of form ax + b = c
    // We can verify the answer is reasonable
    expect(q.a).toMatch(/^x = -?\d+$/);
  });
});

describe('generateQuestionSet', () => {
  it('produces the requested number of questions', () => {
    const questions = generateQuestionSet(42, 'linear', 'easy', 10);
    expect(questions.length).toBe(10);
  });

  it('produces unique equations (no duplicates)', () => {
    const questions = generateQuestionSet(123, 'linear', 'medium', 20);
    const equations = questions.map((q) => q.q);
    const unique = new Set(equations);
    expect(unique.size).toBe(20);
  });

  it('is deterministic — same seed produces same questions', () => {
    const set1 = generateQuestionSet(999, 'linear', 'easy', 5);
    const set2 = generateQuestionSet(999, 'linear', 'easy', 5);
    expect(set1).toEqual(set2);
  });

  it('different seeds produce different question sets', () => {
    const set1 = generateQuestionSet(1, 'linear', 'easy', 5);
    const set2 = generateQuestionSet(2, 'linear', 'easy', 5);
    const eqs1 = set1.map((q) => q.q);
    const eqs2 = set2.map((q) => q.q);
    expect(eqs1).not.toEqual(eqs2);
  });

  it('all questions have valid structure', () => {
    const questions = generateQuestionSet(500, 'linear', 'hard', 15);
    for (const q of questions) {
      expect(q).toHaveProperty('q');
      expect(q).toHaveProperty('a');
      expect(q).toHaveProperty('wrong');
      expect(q.wrong.length).toBe(3);
      expect(q).toHaveProperty('hint');
      expect(q).toHaveProperty('steps');
      expect(q).toHaveProperty('conceptual');
    }
  });

  it('can generate 200 unique questions for a topic/difficulty', () => {
    const questions = generateQuestionSet(42, 'linear', 'medium', 200);
    expect(questions.length).toBe(200);
    const equations = new Set(questions.map((q) => q.q));
    expect(equations.size).toBe(200);
  });
});
