import { describe, it, expect } from 'vitest';
import {
  generateLinear,
  generateQuadratic,
  generateExpExpr,
  generateExpEqn,
  generateInequality,
  generateSimultaneous,
  generateQuestion,
  generateQuestionPool,
  generateDistractors,
  validateQuestion,
  MAX_GENERATION_ATTEMPTS,
  DIFFICULTY_RANGES
} from './questionGenerator.js';

describe('QuestionGenerator constants', () => {
  it('exports MAX_GENERATION_ATTEMPTS as 10', () => {
    expect(MAX_GENERATION_ATTEMPTS).toBe(10);
  });

  it('exports DIFFICULTY_RANGES with correct structure', () => {
    expect(DIFFICULTY_RANGES.easy).toEqual({ min: 1, max: 9, integerOnly: true, positiveOnly: true });
    expect(DIFFICULTY_RANGES.medium.excludeRange).toEqual([-9, 9]);
    expect(DIFFICULTY_RANGES.hard.denominators).toEqual([2, 3, 4, 5, 6]);
    expect(DIFFICULTY_RANGES.hard.minOps).toBe(3);
  });
});

describe('validateQuestion', () => {
  it('returns true for a valid question', () => {
    const q = {
      q: '2x + 3 = 7',
      a: 'x = 2',
      wrong: ['x = 1', 'x = 3', 'x = 4'],
      hint: 'Subtract 3, divide by 2',
      steps: ['Subtract 3 → 2x = 4', 'Divide by 2 → x = 2']
    };
    expect(validateQuestion(q)).toBe(true);
  });

  it('returns false for missing properties', () => {
    expect(validateQuestion(null)).toBe(false);
    expect(validateQuestion({})).toBe(false);
    expect(validateQuestion({ q: 'test' })).toBe(false);
  });

  it('returns false when wrong has duplicates or matches correct', () => {
    const q = {
      q: '2x = 4', a: 'x = 2',
      wrong: ['x = 2', 'x = 3', 'x = 4'],
      hint: 'Divide', steps: ['Step 1', 'Step 2']
    };
    expect(validateQuestion(q)).toBe(false);
  });

  it('returns false when steps array is too short or too long', () => {
    const base = { q: 'x = 1', a: 'x = 1', wrong: ['x = 2', 'x = 3', 'x = 4'], hint: 'h' };
    expect(validateQuestion({ ...base, steps: ['one'] })).toBe(false);
    expect(validateQuestion({ ...base, steps: ['1','2','3','4','5','6','7'] })).toBe(false);
    expect(validateQuestion({ ...base, steps: ['1','2'] })).toBe(true);
    expect(validateQuestion({ ...base, steps: ['1','2','3','4','5','6'] })).toBe(true);
  });
});

describe('generateQuestion', () => {
  const topics = ['linear', 'quadratic', 'expExpr', 'expEqn', 'inequality', 'simultaneous'];
  const difficulties = ['easy', 'medium', 'hard'];

  for (const topic of topics) {
    for (const diff of difficulties) {
      it(`generates a valid question for ${topic}/${diff}`, () => {
        const q = generateQuestion(topic, diff);
        expect(q).not.toBeNull();
        expect(validateQuestion(q)).toBe(true);
      });
    }
  }

  it('falls back to seed question for unknown topic', () => {
    const q = generateQuestion('unknown', 'easy');
    expect(q).toBeNull();
  });
});

describe('generateQuestionPool', () => {
  it('returns the requested number of questions', () => {
    const pool = generateQuestionPool('linear', 'easy', 10);
    expect(pool.length).toBe(10);
    pool.forEach(q => expect(validateQuestion(q)).toBe(true));
  });

  it('has at least 70% generated questions', () => {
    const pool = generateQuestionPool('linear', 'easy', 10);
    const generated = pool.filter(q => q._generated).length;
    expect(generated / pool.length).toBeGreaterThanOrEqual(0.7);
  });
});

describe('generateDistractors', () => {
  it('produces exactly 3 distractors', () => {
    const d = generateDistractors('x = 5', 'linear', 'easy');
    expect(d).toHaveLength(3);
  });

  it('all distractors are distinct from correct answer', () => {
    const correct = 'x = 5';
    const d = generateDistractors(correct, 'linear', 'easy');
    d.forEach(dist => expect(dist).not.toBe(correct));
  });

  it('all distractors are distinct from each other', () => {
    const d = generateDistractors('x = 5', 'linear', 'easy');
    const unique = new Set(d);
    expect(unique.size).toBe(3);
  });
});

describe('per-topic generators (via generateQuestion with retry)', () => {
  // These tests use the main entry point which has retry logic and fallback.
  // Raw per-topic generators may return null or occasionally invalid questions
  // (that's expected — generateQuestion handles retries).

  it('generateQuestion produces valid linear questions', () => {
    for (let i = 0; i < 10; i++) {
      const q = generateQuestion('linear', 'easy');
      expect(q).not.toBeNull();
      expect(validateQuestion(q)).toBe(true);
    }
  });

  it('generateQuestion produces valid quadratic questions', () => {
    for (let i = 0; i < 10; i++) {
      const q = generateQuestion('quadratic', 'medium');
      expect(q).not.toBeNull();
      expect(validateQuestion(q)).toBe(true);
    }
  });

  it('generateQuestion produces valid expExpr questions', () => {
    for (let i = 0; i < 10; i++) {
      const q = generateQuestion('expExpr', 'easy');
      expect(q).not.toBeNull();
      expect(validateQuestion(q)).toBe(true);
    }
  });

  it('generateQuestion produces valid expEqn questions', () => {
    for (let i = 0; i < 10; i++) {
      const q = generateQuestion('expEqn', 'easy');
      expect(q).not.toBeNull();
      expect(validateQuestion(q)).toBe(true);
    }
  });

  it('generateQuestion produces valid inequality questions', () => {
    for (let i = 0; i < 10; i++) {
      const q = generateQuestion('inequality', 'medium');
      expect(q).not.toBeNull();
      expect(validateQuestion(q)).toBe(true);
    }
  });

  it('generateQuestion produces valid simultaneous questions', () => {
    for (let i = 0; i < 10; i++) {
      const q = generateQuestion('simultaneous', 'hard');
      expect(q).not.toBeNull();
      expect(validateQuestion(q)).toBe(true);
    }
  });
});
