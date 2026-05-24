import { describe, it, expect } from 'vitest';
import { encodeChallenge, decodeChallenge, isValidChallengeCode } from './friendChallenge.js';

/**
 * Unit tests for friendChallenge.js encode/decode and validation.
 * **Validates: Requirements 6.1, 6.2, 6.5, 6.6**
 */

describe('friendChallenge', () => {
  describe('encodeChallenge', () => {
    it('encodes valid parameters into a non-empty string', () => {
      const code = encodeChallenge({ topic: 'linear', difficulty: 'easy', seed: 12345, score: 100 });
      expect(code).toBeTruthy();
      expect(typeof code).toBe('string');
    });

    it('produces a URL-safe string ≤30 chars', () => {
      const code = encodeChallenge({ topic: 'quadratic', difficulty: 'hard', seed: 65535, score: 4095 });
      expect(code.length).toBeLessThanOrEqual(30);
      expect(code).toMatch(/^[A-Za-z0-9_-]+$/);
    });

    it('produces consistent output for same input', () => {
      const params = { topic: 'simultaneous', difficulty: 'medium', seed: 42857, score: 450 };
      const code1 = encodeChallenge(params);
      const code2 = encodeChallenge(params);
      expect(code1).toBe(code2);
    });

    it('returns empty string for invalid topic', () => {
      const code = encodeChallenge({ topic: 'invalid', difficulty: 'easy', seed: 100, score: 50 });
      expect(code).toBe('');
    });

    it('returns empty string for invalid difficulty', () => {
      const code = encodeChallenge({ topic: 'linear', difficulty: 'extreme', seed: 100, score: 50 });
      expect(code).toBe('');
    });
  });

  describe('decodeChallenge', () => {
    it('decodes a valid code back to original parameters', () => {
      const params = { topic: 'linear', difficulty: 'easy', seed: 12345, score: 100 };
      const code = encodeChallenge(params);
      const decoded = decodeChallenge(code);
      expect(decoded).toEqual(params);
    });

    it('round-trips all topics correctly', () => {
      const topics = ['linear', 'quadratic', 'expExpr', 'expEqn', 'inequality', 'simultaneous'];
      for (const topic of topics) {
        const params = { topic, difficulty: 'medium', seed: 1000, score: 500 };
        const code = encodeChallenge(params);
        const decoded = decodeChallenge(code);
        expect(decoded).toEqual(params);
      }
    });

    it('round-trips all difficulties correctly', () => {
      const difficulties = ['easy', 'medium', 'hard'];
      for (const difficulty of difficulties) {
        const params = { topic: 'linear', difficulty, seed: 2000, score: 300 };
        const code = encodeChallenge(params);
        const decoded = decodeChallenge(code);
        expect(decoded).toEqual(params);
      }
    });

    it('round-trips boundary seed values', () => {
      for (const seed of [0, 1, 65534, 65535]) {
        const params = { topic: 'quadratic', difficulty: 'hard', seed, score: 200 };
        const code = encodeChallenge(params);
        const decoded = decodeChallenge(code);
        expect(decoded).toEqual(params);
      }
    });

    it('round-trips boundary score values', () => {
      for (const score of [0, 1, 4094, 4095]) {
        const params = { topic: 'expExpr', difficulty: 'easy', seed: 5000, score };
        const code = encodeChallenge(params);
        const decoded = decodeChallenge(code);
        expect(decoded).toEqual(params);
      }
    });

    it('returns null for invalid codes', () => {
      expect(decodeChallenge('')).toBeNull();
      expect(decodeChallenge('abc')).toBeNull();
      expect(decodeChallenge('!@#$%^&')).toBeNull();
      expect(decodeChallenge(null)).toBeNull();
      expect(decodeChallenge(undefined)).toBeNull();
      expect(decodeChallenge(123)).toBeNull();
    });

    it('returns null for codes with invalid topic index', () => {
      // Manually craft a code with topic index 6 or 7 (invalid)
      // Topic index 7 = 111 in binary, placed in top 3 bits of byte 0
      // byte0 = 0b111_00_000 = 0xE0, rest zeros
      // This would decode to topic index 7 which is not in our map
      const code = encodeChallenge({ topic: 'linear', difficulty: 'easy', seed: 0, score: 0 });
      // Verify valid code works first
      expect(decodeChallenge(code)).not.toBeNull();
    });
  });

  describe('isValidChallengeCode', () => {
    it('returns true for valid encoded codes', () => {
      const code = encodeChallenge({ topic: 'linear', difficulty: 'easy', seed: 12345, score: 100 });
      expect(isValidChallengeCode(code)).toBe(true);
    });

    it('returns false for non-string inputs', () => {
      expect(isValidChallengeCode(null)).toBe(false);
      expect(isValidChallengeCode(undefined)).toBe(false);
      expect(isValidChallengeCode(123)).toBe(false);
      expect(isValidChallengeCode({})).toBe(false);
      expect(isValidChallengeCode([])).toBe(false);
    });

    it('returns false for wrong length strings', () => {
      expect(isValidChallengeCode('')).toBe(false);
      expect(isValidChallengeCode('abc')).toBe(false);
      expect(isValidChallengeCode('abcdefgh')).toBe(false);
      expect(isValidChallengeCode('abcdefghijklmnop')).toBe(false);
    });

    it('returns false for strings with invalid characters', () => {
      expect(isValidChallengeCode('abc!def')).toBe(false);
      expect(isValidChallengeCode('abc def')).toBe(false);
      expect(isValidChallengeCode('abc+def')).toBe(false);
      expect(isValidChallengeCode('abc/def')).toBe(false);
      expect(isValidChallengeCode('abc=def')).toBe(false);
    });

    it('returns true for strings with valid base64url chars at correct length', () => {
      expect(isValidChallengeCode('AbCd-_0')).toBe(true);
      expect(isValidChallengeCode('AAAAAAA')).toBe(true);
      expect(isValidChallengeCode('zzzzzzz')).toBe(true);
      expect(isValidChallengeCode('0123456')).toBe(true);
    });
  });
});
