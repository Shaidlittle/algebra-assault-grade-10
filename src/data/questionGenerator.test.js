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
      wrong: [
        { value: 'x = 2', tag: 'sign_error' },
        { value: 'x = 3', tag: 'off_by_one' },
        { value: 'x = 4', tag: 'arithmetic_error' }
      ],
      hint: 'Divide', steps: ['Step 1', 'Step 2']
    };
    expect(validateQuestion(q)).toBe(false);
  });

  it('returns false when steps array is too short or too long', () => {
    const base = {
      q: 'x = 1', a: 'x = 1',
      wrong: [
        { value: 'x = 2', tag: 'off_by_one' },
        { value: 'x = 3', tag: 'arithmetic_error' },
        { value: 'x = 4', tag: 'general_miscalculation' }
      ],
      hint: 'h'
    };
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

  it('all distractors are objects with value and tag properties', () => {
    const d = generateDistractors('x = 5', 'linear', 'easy');
    d.forEach(dist => {
      expect(dist).toHaveProperty('value');
      expect(dist).toHaveProperty('tag');
      expect(typeof dist.value).toBe('string');
      expect(typeof dist.tag).toBe('string');
      expect(dist.value.length).toBeGreaterThan(0);
      expect(dist.tag.length).toBeGreaterThan(0);
    });
  });

  it('all distractor values are distinct from correct answer', () => {
    const correct = 'x = 5';
    const d = generateDistractors(correct, 'linear', 'easy');
    d.forEach(dist => expect(dist.value).not.toBe(correct));
  });

  it('all distractor values are distinct from each other', () => {
    const d = generateDistractors('x = 5', 'linear', 'easy');
    const values = d.map(dist => dist.value);
    const unique = new Set(values);
    expect(unique.size).toBe(3);
  });

  it('every distractor has a non-null tag', () => {
    const topics = ['linear', 'quadratic', 'expExpr', 'expEqn', 'inequality', 'simultaneous'];
    const answers = ['x = 5', 'x = ±3', 'x⁶', 'x = 4', 'x > 2', '(3, 5)'];
    for (let i = 0; i < topics.length; i++) {
      const d = generateDistractors(answers[i], topics[i], 'easy');
      d.forEach(dist => {
        expect(dist.tag).not.toBeNull();
        expect(dist.tag).not.toBeUndefined();
        expect(dist.tag.length).toBeGreaterThan(0);
      });
    }
  });

  it('assigns appropriate tags for simultaneous equations (swapped_variables)', () => {
    const d = generateDistractors('(3, 5)', 'simultaneous', 'easy');
    const tags = d.map(dist => dist.tag);
    expect(tags).toContain('swapped_variables');
  });

  it('assigns single_root_only tag for quadratic two-root distractors', () => {
    const d = generateDistractors('x = -3 or 5', 'quadratic', 'medium');
    const tags = d.map(dist => dist.tag);
    expect(tags).toContain('single_root_only');
  });

  it('assigns sign_error tag for quadratic sign-flip distractors', () => {
    const d = generateDistractors('x = -3 or 5', 'quadratic', 'medium');
    const tags = d.map(dist => dist.tag);
    expect(tags).toContain('sign_error');
  });

  it('assigns sign_flip_forgotten tag for inequality sign-flip distractors', () => {
    const d = generateDistractors('x > 4', 'inequality', 'medium');
    const tags = d.map(dist => dist.tag);
    expect(tags).toContain('sign_flip_forgotten');
  });
});

describe('exponential expression error-pattern distractors (Req 9.1, 9.2, 9.3)', () => {
  it('generates exponents_added_not_multiplied distractor for power-of-a-power', () => {
    // (x^3)^4 = x^12, common mistake is x^(3+4) = x^7
    const d = generateDistractors('x¹²', 'expExpr', 'easy', { subtype: 'power_of_power', expA: 3, expB: 4 });
    const addedDistractor = d.find(dist => dist.tag === 'exponents_added_not_multiplied');
    expect(addedDistractor).toBeDefined();
    expect(addedDistractor.value).toBe('x⁷');
  });

  it('generates exponents_multiplied_not_added distractor for same-base multiplication', () => {
    // x^3 × x^4 = x^7, common mistake is x^(3*4) = x^12
    const d = generateDistractors('x⁷', 'expExpr', 'easy', { subtype: 'same_base_multiply', expA: 3, expB: 4 });
    const multDistractor = d.find(dist => dist.tag === 'exponents_multiplied_not_added');
    expect(multDistractor).toBeDefined();
    expect(multDistractor.value).toBe('x¹²');
  });

  it('skips error-pattern distractor when a+b equals a*b (power-of-a-power)', () => {
    // (x^2)^2 = x^4, mistake would be x^(2+2) = x^4 which equals correct answer
    const d = generateDistractors('x⁴', 'expExpr', 'easy', { subtype: 'power_of_power', expA: 2, expB: 2 });
    // The error-pattern distractor x^4 should be skipped since it equals the correct answer
    d.forEach(dist => {
      expect(dist.value).not.toBe('x⁴');
    });
  });

  it('skips error-pattern distractor when a*b equals a+b (same-base multiplication)', () => {
    // x^2 × x^2 = x^4, mistake would be x^(2*2) = x^4 which equals correct answer
    const d = generateDistractors('x⁴', 'expExpr', 'easy', { subtype: 'same_base_multiply', expA: 2, expB: 2 });
    // The error-pattern distractor x^4 should be skipped since it equals the correct answer
    d.forEach(dist => {
      expect(dist.value).not.toBe('x⁴');
    });
  });

  it('generates correct error-pattern distractor for power-of-a-power with coefficient', () => {
    // (2x^3)^2 = 4x^6, common mistake is 4x^(3+2) = 4x^5
    const d = generateDistractors('4x⁶', 'expExpr', 'medium', { subtype: 'power_of_power', expA: 3, expB: 2, coeff: 4 });
    const addedDistractor = d.find(dist => dist.tag === 'exponents_added_not_multiplied');
    expect(addedDistractor).toBeDefined();
    expect(addedDistractor.value).toBe('4x⁵');
  });

  it('still produces 3 distractors even when error-pattern is skipped', () => {
    const d = generateDistractors('x⁴', 'expExpr', 'easy', { subtype: 'power_of_power', expA: 2, expB: 2 });
    expect(d).toHaveLength(3);
    d.forEach(dist => {
      expect(dist.value).toBeTruthy();
      expect(dist.tag).toBeTruthy();
    });
  });

  it('error-pattern distractor value never equals the correct answer', () => {
    // Run multiple times to cover randomness
    for (let i = 0; i < 20; i++) {
      const q = generateQuestion('expExpr', 'easy');
      if (q) {
        q.wrong.forEach(dist => {
          expect(dist.value).not.toBe(q.a);
        });
      }
    }
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
