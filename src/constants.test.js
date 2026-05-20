import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  getMaxBossHp,
  getBossPhaseHp,
  BOSS_HP,
  ULTIMATE_BOSS_HP,
  BOSS_PHASE_HP,
  ULTIMATE_BOSS_PHASE_HP,
} from './constants.js';

/**
 * **Validates: Requirements 2.5**
 *
 * Property 2: getMaxBossHp and getBossPhaseHp correctness
 *
 * For any string input `t`, `getMaxBossHp(t)` SHALL return `ULTIMATE_BOSS_HP`
 * if `t === "ultimate"` and `BOSS_HP` for all other strings; similarly
 * `getBossPhaseHp(t)` SHALL return `ULTIMATE_BOSS_PHASE_HP` if `t === "ultimate"`
 * and `BOSS_PHASE_HP` otherwise.
 */
describe('getMaxBossHp and getBossPhaseHp correctness', () => {
  it('getMaxBossHp returns ULTIMATE_BOSS_HP for "ultimate"', () => {
    expect(getMaxBossHp('ultimate')).toBe(ULTIMATE_BOSS_HP);
  });

  it('getMaxBossHp returns BOSS_HP for any non-"ultimate" string', () => {
    fc.assert(
      fc.property(
        fc.string().filter((s) => s !== 'ultimate'),
        (t) => {
          expect(getMaxBossHp(t)).toBe(BOSS_HP);
        }
      ),
      { numRuns: 200 }
    );
  });

  it('getBossPhaseHp returns ULTIMATE_BOSS_PHASE_HP for "ultimate"', () => {
    expect(getBossPhaseHp('ultimate')).toBe(ULTIMATE_BOSS_PHASE_HP);
  });

  it('getBossPhaseHp returns BOSS_PHASE_HP for any non-"ultimate" string', () => {
    fc.assert(
      fc.property(
        fc.string().filter((s) => s !== 'ultimate'),
        (t) => {
          expect(getBossPhaseHp(t)).toBe(BOSS_PHASE_HP);
        }
      ),
      { numRuns: 200 }
    );
  });
});
