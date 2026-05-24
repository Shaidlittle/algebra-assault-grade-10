import { describe, it, expect } from 'vitest';
import {
  ENCOURAGEMENT_POOL,
  getEncouragementMessage,
  getComebackMessage,
  getStreakCelebration,
} from './encouragement.js';

describe('encouragement.js', () => {
  describe('ENCOURAGEMENT_POOL', () => {
    it('contains at least 20 unique messages', () => {
      expect(ENCOURAGEMENT_POOL.length).toBeGreaterThanOrEqual(20);
    });

    it('has unique IDs for all messages', () => {
      const ids = ENCOURAGEMENT_POOL.map(m => m.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('contains messages in all three categories', () => {
      const categories = new Set(ENCOURAGEMENT_POOL.map(m => m.category));
      expect(categories.has('general')).toBe(true);
      expect(categories.has('comeback')).toBe(true);
      expect(categories.has('streak')).toBe(true);
    });

    it('each message has id, text, and category fields', () => {
      for (const msg of ENCOURAGEMENT_POOL) {
        expect(msg.id).toBeTruthy();
        expect(msg.text).toBeTruthy();
        expect(msg.category).toBeTruthy();
        expect(typeof msg.id).toBe('string');
        expect(typeof msg.text).toBe('string');
        expect(['general', 'comeback', 'streak']).toContain(msg.category);
      }
    });
  });

  describe('getEncouragementMessage', () => {
    it('returns an object with id, message, and category', () => {
      const result = getEncouragementMessage(null);
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('message');
      expect(result).toHaveProperty('category');
      expect(result.category).toBe('general');
    });

    it('returns a non-empty message', () => {
      const result = getEncouragementMessage(null);
      expect(result.message.length).toBeGreaterThan(0);
    });

    it('does not return the same message as lastMessageId', () => {
      // Run multiple times to increase confidence
      for (let i = 0; i < 50; i++) {
        const result = getEncouragementMessage('gen-01');
        expect(result.id).not.toBe('gen-01');
      }
    });

    it('works when lastMessageId is null', () => {
      const result = getEncouragementMessage(null);
      expect(result.id).toBeTruthy();
      expect(result.message).toBeTruthy();
    });
  });

  describe('getComebackMessage', () => {
    it('returns an object with id, message, and category', () => {
      const result = getComebackMessage();
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('message');
      expect(result).toHaveProperty('category');
    });

    it('returns a comeback-category message', () => {
      const result = getComebackMessage();
      expect(result.category).toBe('comeback');
    });

    it('returns a non-empty message', () => {
      const result = getComebackMessage();
      expect(result.message.length).toBeGreaterThan(0);
    });
  });

  describe('getStreakCelebration', () => {
    it('returns an object with id, message, and category', () => {
      const result = getStreakCelebration(5);
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('message');
      expect(result).toHaveProperty('category');
    });

    it('returns a streak-category message', () => {
      const result = getStreakCelebration(5);
      expect(result.category).toBe('streak');
    });

    it('includes the streak count in the message', () => {
      const result = getStreakCelebration(7);
      expect(result.message).toContain('7');
    });

    it('mentions the streak length for various values', () => {
      const result5 = getStreakCelebration(5);
      expect(result5.message).toContain('5 in a row');

      const result10 = getStreakCelebration(10);
      expect(result10.message).toContain('10 in a row');
    });

    it('returns a non-empty message', () => {
      const result = getStreakCelebration(5);
      expect(result.message.length).toBeGreaterThan(0);
    });
  });
});
