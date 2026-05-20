import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { W, H } from '../constants.js';

/**
 * **Validates: Requirements 4.4**
 *
 * Property 4: updateGame preserves player bounds
 *
 * For any valid game state object where the player position starts within
 * canvas bounds, after calling updateGame(game), the player position SHALL
 * remain within [player.radius, W - player.radius] for x and
 * [player.radius, H - player.radius] for y.
 */

// Mock the audio module to avoid Web Audio API issues in tests
vi.mock('../audio.js', () => ({
  playSound: vi.fn(),
}));

describe('updateGame preserves player bounds', () => {
  let updateGame;

  beforeEach(async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-01T00:00:00.000Z'));
    const engine = await import('./engine.js');
    updateGame = engine.updateGame;
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  /**
   * Generate a valid game state with arbitrary player position within bounds
   * and arbitrary key states.
   */
  function gameStateArb() {
    const radius = 16; // typical player radius

    return fc.record({
      playerX: fc.double({ min: radius, max: W - radius, noNaN: true, noDefaultInfinity: true }),
      playerY: fc.double({ min: radius, max: H - radius, noNaN: true, noDefaultInfinity: true }),
      arrowLeft: fc.boolean(),
      arrowRight: fc.boolean(),
      arrowUp: fc.boolean(),
      arrowDown: fc.boolean(),
      keyA: fc.boolean(),
      keyD: fc.boolean(),
      keyW: fc.boolean(),
      keyS: fc.boolean(),
      pointerActive: fc.boolean(),
      pointerX: fc.double({ min: 0, max: W, noNaN: true, noDefaultInfinity: true }),
      pointerY: fc.double({ min: 0, max: H, noNaN: true, noDefaultInfinity: true }),
    }).map(({
      playerX, playerY,
      arrowLeft, arrowRight, arrowUp, arrowDown,
      keyA, keyD, keyW, keyS,
      pointerActive, pointerX, pointerY,
    }) => ({
      player: {
        x: playerX,
        y: playerY,
        radius,
        vx: 0,
        vy: 0,
        invuln: 0,
        lastShot: 0,
      },
      keys: {
        arrowleft: arrowLeft,
        arrowright: arrowRight,
        arrowup: arrowUp,
        arrowdown: arrowDown,
        a: keyA,
        d: keyD,
        w: keyW,
        s: keyS,
      },
      pointer: {
        x: pointerX,
        y: pointerY,
        active: pointerActive,
      },
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
    }));
  }

  it('player x remains within [radius, W - radius] after updateGame for any valid input', () => {
    fc.assert(
      fc.property(
        gameStateArb(),
        (game) => {
          const radius = game.player.radius;

          updateGame(game, {});

          expect(game.player.x).toBeGreaterThanOrEqual(radius);
          expect(game.player.x).toBeLessThanOrEqual(W - radius);
        }
      ),
      { numRuns: 500 }
    );
  });

  it('player y remains within [radius, H - radius] after updateGame for any valid input', () => {
    fc.assert(
      fc.property(
        gameStateArb(),
        (game) => {
          const radius = game.player.radius;

          updateGame(game, {});

          expect(game.player.y).toBeGreaterThanOrEqual(radius);
          expect(game.player.y).toBeLessThanOrEqual(H - radius);
        }
      ),
      { numRuns: 500 }
    );
  });

  it('player position stays within bounds even with extreme movement inputs', () => {
    fc.assert(
      fc.property(
        fc.record({
          // Player at edge positions
          playerX: fc.oneof(
            fc.constant(16),       // at left edge
            fc.constant(W - 16),   // at right edge
            fc.double({ min: 16, max: W - 16, noNaN: true, noDefaultInfinity: true }),
          ),
          playerY: fc.oneof(
            fc.constant(16),       // at top edge
            fc.constant(H - 16),   // at bottom edge
            fc.double({ min: 16, max: H - 16, noNaN: true, noDefaultInfinity: true }),
          ),
          // All movement keys pressed simultaneously
          allKeysPressed: fc.boolean(),
        }),
        ({ playerX, playerY, allKeysPressed }) => {
          const radius = 16;
          const game = {
            player: { x: playerX, y: playerY, radius, vx: 0, vy: 0, invuln: 0, lastShot: 0 },
            keys: {
              arrowleft: allKeysPressed,
              arrowright: allKeysPressed,
              arrowup: allKeysPressed,
              arrowdown: allKeysPressed,
              a: false,
              d: false,
              w: false,
              s: false,
            },
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

          updateGame(game, {});

          expect(game.player.x).toBeGreaterThanOrEqual(radius);
          expect(game.player.x).toBeLessThanOrEqual(W - radius);
          expect(game.player.y).toBeGreaterThanOrEqual(radius);
          expect(game.player.y).toBeLessThanOrEqual(H - radius);
        }
      ),
      { numRuns: 300 }
    );
  });
});
