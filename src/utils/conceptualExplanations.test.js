import { describe, it, expect } from 'vitest';
import {
  TECHNIQUES,
  getConceptualExplanation,
  identifyTechnique,
} from './conceptualExplanations.js';

describe('conceptualExplanations', () => {
  describe('TECHNIQUES', () => {
    it('contains all five required technique keys', () => {
      const expectedKeys = [
        'isolating-variables',
        'expanding-brackets',
        'cross-multiplication',
        'factoring',
        'completing-the-square',
      ];
      for (const key of expectedKeys) {
        expect(TECHNIQUES).toHaveProperty(key);
        expect(typeof TECHNIQUES[key]).toBe('string');
        expect(TECHNIQUES[key].length).toBeGreaterThan(0);
      }
    });
  });

  describe('getConceptualExplanation', () => {
    it('returns explanation string for valid technique keys', () => {
      expect(getConceptualExplanation('isolating-variables')).toBe(
        'We subtract/add from both sides to keep the equation balanced — like removing the same weight from both sides of a scale'
      );
      expect(getConceptualExplanation('factoring')).toBe(
        'Factoring rewrites an expression as a product — if a product equals zero, at least one factor must be zero'
      );
    });

    it('returns null for unknown technique keys', () => {
      expect(getConceptualExplanation('unknown-technique')).toBeNull();
      expect(getConceptualExplanation('')).toBeNull();
      expect(getConceptualExplanation('ISOLATING-VARIABLES')).toBeNull();
    });
  });

  describe('identifyTechnique', () => {
    it('identifies isolating-variables from steps mentioning subtract/add and both sides', () => {
      const question = {
        q: '2x + 5 = 13',
        steps: ['Subtract 5 from both sides → 2x = 8', 'Divide both sides by 2 → x = 4'],
      };
      expect(identifyTechnique(question)).toBe('isolating-variables');
    });

    it('identifies expanding-brackets from steps mentioning expand', () => {
      const question = {
        q: '5(x − 3) = 2x + 6',
        steps: ['Expand: 5x − 15 = 2x + 6', 'Subtract 2x → 3x − 15 = 6', 'x = 7'],
      };
      expect(identifyTechnique(question)).toBe('expanding-brackets');
    });

    it('identifies expanding-brackets from steps mentioning bracket', () => {
      const question = {
        q: '3(x + 2) = 15',
        steps: ['Open the bracket: 3x + 6 = 15', 'Subtract 6 → 3x = 9'],
      };
      expect(identifyTechnique(question)).toBe('expanding-brackets');
    });

    it('identifies cross-multiplication from steps mentioning cross-multiply', () => {
      const question = {
        q: '(2x+1)/3 = (x−1)/2',
        steps: ['Cross-multiply: 2(2x+1) = 3(x−1)', 'Expand: 4x + 2 = 3x − 3'],
      };
      expect(identifyTechnique(question)).toBe('cross-multiplication');
    });

    it('identifies factoring from steps mentioning factor', () => {
      const question = {
        q: 'x² − 5x + 6 = 0',
        steps: ['Factor: (x − 2)(x − 3) = 0', 'Solve: x = 2 or x = 3'],
      };
      expect(identifyTechnique(question)).toBe('factoring');
    });

    it('identifies completing-the-square from steps mentioning complete the square', () => {
      const question = {
        q: 'x² + 6x + 5 = 0',
        steps: ['Complete the square: (x + 3)² − 4 = 0', 'Take square root → x = -1 or x = -5'],
      };
      expect(identifyTechnique(question)).toBe('completing-the-square');
    });

    it('defaults to isolating-variables when no keywords match', () => {
      const question = {
        q: '5x = 30',
        steps: ['Divide by 5 → x = 6'],
      };
      expect(identifyTechnique(question)).toBe('isolating-variables');
    });

    it('handles questions with empty or missing steps', () => {
      expect(identifyTechnique({ q: 'x = 5', steps: [] })).toBe('isolating-variables');
      expect(identifyTechnique({ q: 'x = 5' })).toBe('isolating-variables');
    });

    it('prioritizes cross-multiplication over expanding-brackets', () => {
      // Cross-multiply steps often also mention "expand" later
      const question = {
        q: '(x+1)/2 = (x-1)/3',
        steps: ['Cross-multiply: 3(x+1) = 2(x-1)', 'Expand: 3x + 3 = 2x - 2'],
      };
      expect(identifyTechnique(question)).toBe('cross-multiplication');
    });

    it('prioritizes factoring over expanding-brackets when both appear', () => {
      const question = {
        q: 'x² + 5x + 6 = 0',
        steps: ['Factor the trinomial: (x + 2)(x + 3) = 0', 'Expand to verify if needed'],
      };
      expect(identifyTechnique(question)).toBe('factoring');
    });
  });
});
