import { describe, it, expect } from 'vitest';
import { resolveHints } from './hintResolver.js';

describe('resolveHints', () => {
  describe('Case 1: question with valid hints array', () => {
    it('returns the hints array directly when it has 3 valid entries', () => {
      const question = {
        q: '2x + 5 = 13',
        a: 'x = 4',
        wrong: [],
        hints: [
          'What operation undoes addition?',
          'Subtract 5, then divide by 2',
          ['Subtract 5 → 2x = 8', 'Divide by 2 → x = 4']
        ]
      };

      const result = resolveHints(question);
      expect(result).toBe(question.hints);
    });
  });

  describe('Case 2: question with hint + steps but no hints array', () => {
    it('generates a 3-level structure from hint and steps', () => {
      const question = {
        q: '2x + 5 = 13',
        a: 'x = 4',
        wrong: [],
        hint: 'Subtract 5, then divide by 2',
        steps: ['Subtract 5 from both sides → 2x = 8', 'Divide both sides by 2 → x = 4']
      };

      const result = resolveHints(question);
      expect(result).not.toBeNull();
      expect(result).toHaveLength(3);
      // Index 0: conceptual nudge ≤60 chars
      expect(typeof result[0]).toBe('string');
      expect(result[0].length).toBeLessThanOrEqual(60);
      // Index 1: the existing hint value
      expect(result[1]).toBe(question.hint);
      // Index 2: the existing steps array
      expect(result[2]).toBe(question.steps);
    });

    it('generates nudge for subtract-based hints', () => {
      const question = {
        q: 'x + 12 = 20',
        a: 'x = 8',
        wrong: [],
        hint: 'Subtract 12 from both sides',
        steps: ['Subtract 12 from both sides → x = 8']
      };

      const result = resolveHints(question);
      expect(result[0]).toBe('What operation undoes addition?');
    });

    it('generates nudge for divide-based hints', () => {
      const question = {
        q: '5x = 30',
        a: 'x = 6',
        wrong: [],
        hint: 'Divide both sides by 5',
        steps: ['Divide both sides by 5 → x = 6']
      };

      const result = resolveHints(question);
      expect(result[0]).toBe('What operation undoes multiplication?');
    });

    it('generates nudge for expand-based hints', () => {
      const question = {
        q: '5(x − 3) = 2x + 6',
        a: 'x = 7',
        wrong: [],
        hint: 'Expand the bracket first',
        steps: ['Expand: 5x − 15 = 2x + 6']
      };

      const result = resolveHints(question);
      expect(result[0]).toBe('Can you remove the brackets first?');
    });

    it('generates nudge for factor-based hints', () => {
      const question = {
        q: '2x² − 5x − 3 = 0',
        a: 'x = 3 or −½',
        wrong: [],
        hint: 'Factor: (2x+1)(x−3) = 0',
        steps: ['Factor the trinomial: (2x + 1)(x − 3) = 0']
      };

      const result = resolveHints(question);
      expect(result[0]).toBe('Can you write this as a product of two factors?');
    });

    it('generates generic nudge for unrecognized hint patterns', () => {
      const question = {
        q: 'some question',
        a: 'some answer',
        wrong: [],
        hint: 'Try a different approach',
        steps: ['Step 1', 'Step 2']
      };

      const result = resolveHints(question);
      expect(result[0]).toBe('What is the first operation you should do?');
      expect(result[0].length).toBeLessThanOrEqual(60);
    });
  });

  describe('Case 3: question with neither hint nor hints', () => {
    it('returns null when question has no hint and no hints', () => {
      const question = {
        q: 'some question',
        a: 'some answer',
        wrong: []
      };

      const result = resolveHints(question);
      expect(result).toBeNull();
    });

    it('returns null for null input', () => {
      expect(resolveHints(null)).toBeNull();
    });

    it('returns null for undefined input', () => {
      expect(resolveHints(undefined)).toBeNull();
    });

    it('returns null when hint exists but steps is missing', () => {
      const question = {
        q: 'some question',
        a: 'some answer',
        wrong: [],
        hint: 'Some hint'
      };

      const result = resolveHints(question);
      expect(result).toBeNull();
    });

    it('returns null when hint exists but steps is empty', () => {
      const question = {
        q: 'some question',
        a: 'some answer',
        wrong: [],
        hint: 'Some hint',
        steps: []
      };

      const result = resolveHints(question);
      expect(result).toBeNull();
    });
  });

  describe('Case 4: malformed hints arrays', () => {
    it('returns [null, null, solution] when hints has fewer than 3 entries', () => {
      const question = {
        q: 'some question',
        a: 'some answer',
        wrong: [],
        hints: ['Only one entry'],
        steps: ['Step 1', 'Step 2']
      };

      const result = resolveHints(question);
      expect(result).toEqual([null, null, ['Step 1', 'Step 2']]);
    });

    it('returns [null, null, solution] when hints has null entries at index 0', () => {
      const question = {
        q: 'some question',
        a: 'some answer',
        wrong: [],
        hints: [null, 'specific hint', ['Step 1']],
        steps: ['Step 1']
      };

      const result = resolveHints(question);
      expect(result).toEqual([null, null, ['Step 1']]);
    });

    it('returns [null, null, solution] when hints has empty string at index 0', () => {
      const question = {
        q: 'some question',
        a: 'some answer',
        wrong: [],
        hints: ['', 'specific hint', ['Step 1']],
        steps: ['Step 1']
      };

      const result = resolveHints(question);
      expect(result).toEqual([null, null, ['Step 1']]);
    });

    it('returns [null, null, solution] when hints has null at index 1', () => {
      const question = {
        q: 'some question',
        a: 'some answer',
        wrong: [],
        hints: ['conceptual', null, ['Step 1']],
        steps: ['Step 1']
      };

      const result = resolveHints(question);
      expect(result).toEqual([null, null, ['Step 1']]);
    });

    it('returns [null, null, solution] when full solution at index 2 is not an array', () => {
      const question = {
        q: 'some question',
        a: 'some answer',
        wrong: [],
        hints: ['conceptual', 'specific', 'not an array'],
        steps: ['Step 1']
      };

      const result = resolveHints(question);
      expect(result).toEqual([null, null, ['Step 1']]);
    });

    it('returns null when malformed hints and no steps fallback', () => {
      const question = {
        q: 'some question',
        a: 'some answer',
        wrong: [],
        hints: ['Only one entry']
      };

      const result = resolveHints(question);
      expect(result).toBeNull();
    });

    it('uses hints[2] as solution when available in malformed array', () => {
      const question = {
        q: 'some question',
        a: 'some answer',
        wrong: [],
        hints: [null, null, ['Full step 1', 'Full step 2']]
      };

      const result = resolveHints(question);
      expect(result).toEqual([null, null, ['Full step 1', 'Full step 2']]);
    });
  });
});
