import { describe, it, expect } from 'vitest';
import { ERROR_CATALOG, getDiagnosticMessage } from './errorCatalog.js';

describe('ERROR_CATALOG', () => {
  it('contains all required tags', () => {
    const requiredTags = [
      // Linear Equations
      'sign_error',
      'arithmetic_error',
      'off_by_one',
      'general_miscalculation',
      // Quadratic Equations
      'single_root_only',
      // Exponential Expressions
      'exponents_added_not_multiplied',
      'exponents_multiplied_not_added',
      // Exponential Equations
      'exponent_add',
      'exponent_multiply',
      // Inequalities
      'sign_flip_forgotten',
      'forgot_flip',
      // Simultaneous Equations
      'swapped_variables',
    ];

    for (const tag of requiredTags) {
      expect(ERROR_CATALOG[tag]).toBeDefined();
    }
  });

  it('has at least 12 unique tags (minimum coverage across 6 topics)', () => {
    const tagCount = Object.keys(ERROR_CATALOG).length;
    expect(tagCount).toBeGreaterThanOrEqual(12);
  });

  it('every message is between 8 and 30 words', () => {
    for (const [tag, message] of Object.entries(ERROR_CATALOG)) {
      const wordCount = message.split(/\s+/).length;
      expect(wordCount).toBeGreaterThanOrEqual(8);
      expect(wordCount).toBeLessThanOrEqual(30);
    }
  });

  it('every message is a non-empty string', () => {
    for (const [tag, message] of Object.entries(ERROR_CATALOG)) {
      expect(typeof message).toBe('string');
      expect(message.length).toBeGreaterThan(0);
    }
  });

  it('every message uses second-person language (contains "you" or "your")', () => {
    for (const [tag, message] of Object.entries(ERROR_CATALOG)) {
      const lower = message.toLowerCase();
      const hasSecondPerson = lower.includes('you') || lower.includes('your');
      expect(hasSecondPerson).toBe(true);
    }
  });
});

describe('getDiagnosticMessage', () => {
  it('returns the message for a valid tag', () => {
    const msg = getDiagnosticMessage('sign_error');
    expect(msg).toBe(ERROR_CATALOG.sign_error);
  });

  it('returns null for null input', () => {
    expect(getDiagnosticMessage(null)).toBeNull();
  });

  it('returns null for undefined input', () => {
    expect(getDiagnosticMessage(undefined)).toBeNull();
  });

  it('returns null for empty string input', () => {
    expect(getDiagnosticMessage('')).toBeNull();
  });

  it('returns null for an unknown tag', () => {
    expect(getDiagnosticMessage('nonexistent_tag')).toBeNull();
  });

  it('returns the correct message for each catalog entry', () => {
    for (const [tag, message] of Object.entries(ERROR_CATALOG)) {
      expect(getDiagnosticMessage(tag)).toBe(message);
    }
  });
});
