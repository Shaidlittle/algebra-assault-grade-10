import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';

/**
 * **Validates: Requirements 25.4, 25.5**
 */

// Mock audio module
vi.mock('../audio.js', () => ({
  playSound: vi.fn(),
}));

describe('Reduced Motion', () => {
  let updateGame, spawnParticles;

  beforeEach(async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-01T00:00:00.000Z'));
    const engine = await import('./engine.js');
    updateGame = engine.updateGame;
    spawnParticles = engine.spawnParticles;
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('25.4: Reduced motion suppresses visual effects', () => {
    it('spawnParticles adds no particles when reducedMotion is true', () => {
      fc.assert(
        fc.property(
          fc.double({ min: 0, max: 400, noNaN: true, noDefaultInfinity: true }),
          fc.double({ min: 0, max: 600, noNaN: true, noDefaultInfinity: true }),
          fc.integer({ min: 1, max: 30 }),
          (x, y, count) => {
            const game = { particles: [] };
            spawnParticles(game, x, y, '#ff0000', count, { reducedMotion: true });
            expect(game.particles).toHaveLength(0);
          }
        ),
        { numRuns: 200 }
      );
    });

    it('updateGame suppresses shake when reducedMotion is active', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 50 }),
          (initialShake) => {
            const game = {
              player: { x: 200, y: 500, radius: 16, vx: 0, vy: 0, invuln: 0, lastShot: 0 },
              keys: { arrowleft: false, arrowright: false, arrowup: false, arrowdown: false, a: false, d: false, w: false, s: false },
              pointer: { x: null, y: null, active: false },
              aliens: [],
              bullets: [],
              enemyBullets: [],
              particles: [],
              stars: [],
              powerups: [],
              damageNumbers: [],
              boss: null,
              spawnTimers: { alien: 100 },
              flash: 0,
              flashColor: '#000000',
              shake: initialShake,
              bossActive: false,
              paused: false,
              waveNumber: 1,
              soundOn: false,
              killCount: 0,
              killPulse: 0,
              activePowerups: { shield: 0, rapid: 0, triple: 0 },
              pendingNuke: false,
              pendingHpChange: 0,
              triggerQuestion: false,
            };

            updateGame(game, null, { reducedMotion: true });

            expect(game.shake).toBe(0);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('25.5: Reduced motion preserves gameplay logic', () => {
    it('player movement still works with reducedMotion enabled', () => {
      fc.assert(
        fc.property(
          fc.boolean(),
          fc.boolean(),
          (moveLeft, moveRight) => {
            const game = {
              player: { x: 200, y: 500, radius: 16, vx: 0, vy: 0, invuln: 0, lastShot: 0 },
              keys: { arrowleft: moveLeft, arrowright: moveRight, arrowup: false, arrowdown: false, a: false, d: false, w: false, s: false },
              pointer: { x: null, y: null, active: false },
              aliens: [],
              bullets: [],
              enemyBullets: [],
              particles: [],
              stars: [],
              powerups: [],
              damageNumbers: [],
              boss: null,
              spawnTimers: { alien: 100 },
              flash: 0,
              flashColor: '#000000',
              shake: 0,
              bossActive: false,
              paused: false,
              waveNumber: 1,
              soundOn: false,
              killCount: 0,
              killPulse: 0,
              activePowerups: { shield: 0, rapid: 0, triple: 0 },
              pendingNuke: false,
              pendingHpChange: 0,
              triggerQuestion: false,
            };

            const initialX = game.player.x;
            updateGame(game, null, { reducedMotion: true });

            // Player should still move based on key input
            if (moveLeft && !moveRight) {
              expect(game.player.x).toBeLessThan(initialX);
            } else if (moveRight && !moveLeft) {
              expect(game.player.x).toBeGreaterThan(initialX);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('bullets are still spawned with reducedMotion enabled', () => {
      const game = {
        player: { x: 200, y: 500, radius: 16, vx: 0, vy: 0, invuln: 0, lastShot: 0 },
        keys: { arrowleft: false, arrowright: false, arrowup: false, arrowdown: false, a: false, d: false, w: false, s: false },
        pointer: { x: null, y: null, active: false },
        aliens: [],
        bullets: [],
        enemyBullets: [],
        particles: [],
        stars: [],
        powerups: [],
        damageNumbers: [],
        boss: null,
        spawnTimers: { alien: 100 },
        flash: 0,
        flashColor: '#000000',
        shake: 0,
        bossActive: false,
        paused: false,
        waveNumber: 1,
        soundOn: false,
        killCount: 0,
        killPulse: 0,
        activePowerups: { shield: 0, rapid: 0, triple: 0 },
        pendingNuke: false,
        pendingHpChange: 0,
        triggerQuestion: false,
      };

      updateGame(game, null, { reducedMotion: true });

      // Auto-fire should still produce bullets
      expect(game.bullets.length).toBeGreaterThan(0);
    });
  });
});
