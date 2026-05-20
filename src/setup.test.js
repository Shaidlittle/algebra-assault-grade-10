import { describe, it, expect } from 'vitest';

describe('Test infrastructure', () => {
  it('should run a trivial passing test', () => {
    expect(1 + 1).toBe(2);
  });
});
