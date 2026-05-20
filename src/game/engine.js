/**
 * Game Engine — Canvas game loop logic.
 *
 * Contains the core update/draw cycle and helper functions for the
 * space-shooter gameplay. Operates on a mutable game state object
 * passed by reference.
 *
 * Exported functions:
 *   updateGame(game, dispatcher, options)
 *   drawGame(ctx, game, options)
 *   spawnParticles(game, x, y, color, count, options)
 *   damagePlayer(game, dmg)
 *   applyPowerup(game, type, setScore)
 *   triggerWrongAnswerFeedback(game)
 */

import {
  W, H,
  DMG_BULLET, DMG_ALIEN, DMG_BOSS_BULLET,
  ALIENS_PER_WAVE,
  POWERUP_DROP_CHANCE, POWERUP_TYPES, POWERUP_INFO, POWERUP_DURATIONS,
  HEALTH_RESTORE,
} from '../constants.js';
import { playSound } from '../audio.js';
import { getWaveDifficulty } from './waveDifficulty.js';

// ========== HELPERS (module-private) ==========

/**
 * Draw a single power-up item on the canvas.
 * @param {CanvasRenderingContext2D} ctx
 * @param {object} pu - power-up entity
 */
function drawPowerup(ctx, pu) {
  const info = POWERUP_INFO[pu.type];
  const bobY = pu.y + Math.sin(pu.bob) * 3;
  const pulse = 1 + Math.sin(pu.bob * 2) * 0.1;
  const r = pu.radius * pulse;
  const fade = pu.life < 90 ? (Math.sin(pu.bob * 3) > 0 ? 0.4 : 1) : 1;

  ctx.save();
  ctx.globalAlpha = fade;

  const grad = ctx.createRadialGradient(pu.x, bobY, 0, pu.x, bobY, r * 2.2);
  grad.addColorStop(0, info.glow + 'cc');
  grad.addColorStop(1, info.glow + '00');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(pu.x, bobY, r * 2.2, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = info.color;
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2 + pu.bob * 0.3;
    const px = pu.x + Math.cos(angle) * r;
    const py = bobY + Math.sin(angle) * r;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#fff';
  ctx.font = 'bold 14px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(info.symbol, pu.x, bobY);

  ctx.restore();
}

// ========== EXPORTED FUNCTIONS ==========

/**
 * Spawn particle effects at a given position.
 * @param {object} game - mutable game state
 * @param {number} x - spawn x position
 * @param {number} y - spawn y position
 * @param {string} color - CSS color string
 * @param {number} count - number of particles to spawn
 * @param {object} [options] - { reducedMotion } — if reducedMotion is true, no particles are added
 */
export function spawnParticles(game, x, y, color, count, options) {
  if (options && options.reducedMotion) return;
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 2 + Math.random() * 5;
    game.particles.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      color,
      life: 35 + Math.random() * 25,
      maxLife: 60,
      radius: 2.5 + Math.random() * 3.5,
    });
  }
}

/**
 * Apply damage to the player — triggers invulnerability, shake, flash,
 * and accumulates pending HP change.
 * @param {object} game - mutable game state
 * @param {number} dmg - damage amount
 */
export function damagePlayer(game, dmg) {
  const p = game.player;
  spawnParticles(game, p.x, p.y, '#ef4444', 14);
  p.invuln = 50;
  game.shake = 14;
  game.flash = 14;
  game.flashColor = '#ef4444';
  game.damageNumbers.push({
    x: p.x, y: p.y - 30, vy: -2, life: 45, text: `-${dmg}`, color: '#ef4444',
  });
  game.pendingHpChange -= dmg;
  playSound('hit', game.soundOn);
}

/**
 * Apply a collected power-up to the player.
 * @param {object} game - mutable game state
 * @param {string} type - power-up type key
 * @param {function} setScore - React state setter for score (called for nuke kills)
 * @param {object|null} [dispatcher] - event dispatcher for emitting nuke/kill/waveComplete events
 * @param {object} [options] - { reducedMotion }
 */
export function applyPowerup(game, type, setScore, dispatcher, options) {
  const opts = options || {};
  const p = game.player;
  const now = Date.now();
  const info = POWERUP_INFO[type];

  spawnParticles(game, p.x, p.y, info.glow, 18);
  game.flash = 8;
  game.flashColor = info.color;

  if (type === 'shield' || type === 'rapid' || type === 'triple') {
    game.activePowerups[type] = now + POWERUP_DURATIONS[type];
    game.damageNumbers.push({
      x: p.x, y: p.y - 30, vy: -2, life: 60,
      text: info.name + '!', color: info.glow,
    });
    playSound('powerup', game.soundOn);
  } else if (type === 'health') {
    game.pendingHpChange += HEALTH_RESTORE;
    if (dispatcher && dispatcher.emit) {
      dispatcher.emit({ type: 'damage', source: 'health', amount: -HEALTH_RESTORE });
    }
    game.damageNumbers.push({
      x: p.x, y: p.y - 30, vy: -2, life: 60,
      text: `+${HEALTH_RESTORE} HP`, color: '#10b981',
    });
    playSound('heal', game.soundOn);
  } else if (type === 'nuke') {
    game.aliens.forEach(a => {
      spawnParticles(game, a.x, a.y, '#fbbf24', 18);
    });
    game.enemyBullets = [];
    const killed = game.aliens.length;
    game.aliens = [];
    game.flash = 25;
    game.flashColor = '#fbbf24';
    game.shake = 22;
    if (setScore) setScore(s => s + killed * 30);

    if (dispatcher && dispatcher.emit) {
      dispatcher.emit({ type: 'nuke' });
    }

    if (!game.bossActive) {
      const needed = ALIENS_PER_WAVE - game.killCount;
      const counted = Math.min(killed, needed);
      game.killCount += counted;
      if (game.killCount >= ALIENS_PER_WAVE) {
        game.killCount = 0;
        if (dispatcher && dispatcher.emit) {
          dispatcher.emit({ type: 'waveComplete', waveNumber: game.waveNumber });
        } else {
          game.triggerQuestion = true;
        }
      }
    }
    game.damageNumbers.push({
      x: p.x, y: p.y - 30, vy: -2, life: 60,
      text: 'NUKE!', color: '#fb923c',
    });
    playSound('nuke', game.soundOn);
  }
}

/**
 * Trigger visual feedback for a wrong answer — shake, flash red.
 * Used by both mission mode and exam mode for consistent feedback.
 * @param {object} game - mutable game state
 */
export function triggerWrongAnswerFeedback(game) {
  game.shake = 8;
  game.flash = 12;
  game.flashColor = '#ef4444';
}

/**
 * Update the game state for one frame.
 * Mutates the game object in place. Emits events via dispatcher when
 * collisions occur or waves complete. Falls back to setting flags on
 * game state if dispatcher is not provided (backward compatibility).
 *
 * @param {object} game - mutable game state (gameRef.current)
 * @param {object|null} dispatcher - event dispatcher with emit() method, or null
 * @param {object} [options] - { reducedMotion, setScore }
 */
export function updateGame(game, dispatcher, options) {
  const opts = options || {};
  const setScore = opts.setScore;
  const reducedMotion = opts.reducedMotion;

  // Suppress shake when reducedMotion is active
  if (reducedMotion) {
    game.shake = 0;
  }

  const p = game.player;
  const keys = game.keys;
  const speed = 4.5;
  const now = Date.now();

  // --- Player movement ---
  const keyboardActive = keys.arrowleft || keys.arrowright || keys.arrowup || keys.arrowdown || keys.a || keys.d || keys.w || keys.s;
  if (keyboardActive) {
    game.pointer.active = false;
    if (keys.arrowleft || keys.a) p.x -= speed;
    if (keys.arrowright || keys.d) p.x += speed;
    if (keys.arrowup || keys.w) p.y -= speed;
    if (keys.arrowdown || keys.s) p.y += speed;
  } else if (game.pointer.active && game.pointer.x !== null) {
    const dx = game.pointer.x - p.x;
    const dy = game.pointer.y - p.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > 2) {
      const moveSpeed = Math.min(dist * 0.25, 8);
      p.x += (dx / dist) * moveSpeed;
      p.y += (dy / dist) * moveSpeed;
    }
  }
  p.x = Math.max(p.radius, Math.min(W - p.radius, p.x));
  p.y = Math.max(p.radius, Math.min(H - p.radius, p.y));

  // --- Auto-fire ---
  const isRapid = game.activePowerups.rapid > now;
  const isTriple = game.activePowerups.triple > now;
  const shootInterval = isRapid ? 100 : 200;

  if (now - p.lastShot > shootInterval) {
    if (isTriple) {
      game.bullets.push({ x: p.x - 10, y: p.y - p.radius, vx: -0.8, vy: -9, radius: 3 });
      game.bullets.push({ x: p.x, y: p.y - p.radius, vx: 0, vy: -10, radius: 3 });
      game.bullets.push({ x: p.x + 10, y: p.y - p.radius, vx: 0.8, vy: -9, radius: 3 });
    } else {
      game.bullets.push({ x: p.x, y: p.y - p.radius, vx: 0, vy: -9, radius: 3 });
    }
    p.lastShot = now;
    if (Math.random() < 0.25) playSound('shoot', game.soundOn);
  }

  // --- Bullet movement ---
  game.bullets = game.bullets.filter(b => {
    b.x += b.vx; b.y += b.vy;
    return b.y > -10 && b.x > -10 && b.x < W + 10;
  });

  game.enemyBullets = game.enemyBullets.filter(b => {
    b.x += b.vx; b.y += b.vy;
    return b.y < H + 10 && b.x > -20 && b.x < W + 20 && b.y > -20;
  });

  // --- Alien spawning ---
  if (!game.bossActive) {
    game.spawnTimers.alien--;
    if (game.spawnTimers.alien <= 0) {
      const diff = getWaveDifficulty(game.waveNumber);
      const num = Math.random() < 0.2 + Math.min(game.waveNumber, 4) * 0.05 ? 2 : 1;
      for (let i = 0; i < num; i++) {
        game.aliens.push({
          x: 40 + Math.random() * (W - 80),
          y: -30 - i * 40,
          vx: (Math.random() - 0.5) * 1.5,
          vy: diff.alienSpeed + Math.random() * 0.4,
          radius: 17,
          lastShot: now + Math.random() * 500,
          shotInterval: diff.shootingInterval,
          type: Math.random() < 0.5 ? 'red' : 'green',
          wobble: Math.random() * Math.PI * 2,
        });
      }
      game.spawnTimers.alien = diff.spawnInterval;
    }
  }

  // --- Alien movement & shooting ---
  game.aliens = game.aliens.filter(a => {
    a.wobble += 0.06;
    a.x += a.vx + Math.sin(a.wobble) * 0.4;
    a.y += a.vy;
    if (a.x < a.radius || a.x > W - a.radius) a.vx *= -1;

    if (now - a.lastShot > a.shotInterval && a.y > 30 && a.y < H * 0.7) {
      const dx = p.x - a.x;
      const dy = p.y - a.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const bs = 3.5;
      game.enemyBullets.push({
        x: a.x, y: a.y + a.radius,
        vx: (dx / dist) * bs, vy: (dy / dist) * bs, radius: 4,
      });
      a.lastShot = now;
    }
    return a.y < H + 30;
  });

  // --- Boss movement & attacks ---
  if (game.bossActive && game.boss) {
    const boss = game.boss;
    boss.wobble += 0.025;
    boss.x += boss.vx;
    if (boss.x < 60) { boss.x = 60; boss.vx *= -1; }
    if (boss.x > W - 60) { boss.x = W - 60; boss.vx *= -1; }
    boss.y = 100 + Math.sin(boss.wobble) * 18;

    if (now - boss.lastShot > 700) {
      boss.attackPhase = (boss.attackPhase + 1) % 3;
      const dx = p.x - boss.x;
      const dy = p.y - boss.y;
      const baseAngle = Math.atan2(dy, dx);

      if (boss.attackPhase === 0) {
        for (let i = -2; i <= 2; i++) {
          const angle = baseAngle + i * 0.18;
          game.enemyBullets.push({
            x: boss.x, y: boss.y + boss.radius,
            vx: Math.cos(angle) * 4, vy: Math.sin(angle) * 4,
            radius: 5, isBoss: true,
          });
        }
      } else if (boss.attackPhase === 1) {
        game.enemyBullets.push({
          x: boss.x, y: boss.y + boss.radius,
          vx: Math.cos(baseAngle) * 6, vy: Math.sin(baseAngle) * 6,
          radius: 6, isBoss: true,
        });
      } else {
        for (let i = 0; i < 8; i++) {
          const angle = (i / 8) * Math.PI * 2;
          game.enemyBullets.push({
            x: boss.x, y: boss.y,
            vx: Math.cos(angle) * 3, vy: Math.sin(angle) * 3,
            radius: 5, isBoss: true,
          });
        }
      }
      boss.lastShot = now;
    }
  }

  // === COLLISIONS ===

  // --- Player bullets vs aliens ---
  for (let i = game.aliens.length - 1; i >= 0; i--) {
    const a = game.aliens[i];
    let hit = false;
    for (let j = game.bullets.length - 1; j >= 0; j--) {
      const b = game.bullets[j];
      const dx = a.x - b.x;
      const dy = a.y - b.y;
      if (Math.sqrt(dx * dx + dy * dy) < a.radius + b.radius) {
        game.bullets.splice(j, 1);
        hit = true;
        break;
      }
    }
    if (hit) {
      const wasOnScreen = a.y > 0;
      spawnParticles(game, a.x, a.y, a.type === 'red' ? '#ef4444' : '#10b981', 20);

      if (Math.random() < POWERUP_DROP_CHANCE) {
        const type = POWERUP_TYPES[Math.floor(Math.random() * POWERUP_TYPES.length)];
        game.powerups.push({
          x: a.x, y: a.y, vx: 0, vy: 1.4,
          radius: 14, type, bob: 0, life: 600,
        });
      }

      game.aliens.splice(i, 1);
      playSound('kill', game.soundOn);
      if (setScore) setScore(s => s + 50);

      if (!game.bossActive && wasOnScreen) {
        game.killCount += 1;
        game.killPulse = 12;

        if (dispatcher && dispatcher.emit) {
          dispatcher.emit({ type: 'kill', killCount: game.killCount });
        }

        if (game.killCount >= ALIENS_PER_WAVE) {
          game.killCount = 0;
          if (dispatcher && dispatcher.emit) {
            dispatcher.emit({ type: 'waveComplete', waveNumber: game.waveNumber });
          } else {
            game.triggerQuestion = true;
          }
        }
      }
    }
  }

  // --- Player bullets vs boss ---
  if (game.bossActive && game.boss) {
    const boss = game.boss;
    for (let j = game.bullets.length - 1; j >= 0; j--) {
      const b = game.bullets[j];
      const dx = boss.x - b.x;
      const dy = boss.y - b.y;
      if (Math.sqrt(dx * dx + dy * dy) < boss.radius + b.radius) {
        spawnParticles(game, b.x, b.y, '#fbbf24', 3);
        game.bullets.splice(j, 1);
        if (boss.phaseHp > 0) {
          boss.phaseHp -= 1;
          if (Math.random() < 0.06) {
            const type = POWERUP_TYPES[Math.floor(Math.random() * POWERUP_TYPES.length)];
            game.powerups.push({
              x: boss.x + (Math.random() - 0.5) * 40,
              y: boss.y + boss.radius - 4,
              vx: (Math.random() - 0.5) * 1.2, vy: 1.3,
              radius: 14, type, bob: Math.random() * Math.PI * 2, life: 600,
            });
          }
          if (boss.phaseHp <= 0) {
            boss.phaseHp = 0;
            spawnParticles(game, boss.x, boss.y, '#fbbf24', 32);
            game.flash = 22;
            game.flashColor = '#fbbf24';
            game.shake = 18;
            if (dispatcher && dispatcher.emit) {
              dispatcher.emit({ type: 'waveComplete', waveNumber: game.waveNumber });
            } else {
              game.triggerQuestion = true;
            }
            playSound('boss', game.soundOn);
            const type = POWERUP_TYPES[Math.floor(Math.random() * POWERUP_TYPES.length)];
            game.powerups.push({
              x: boss.x, y: boss.y + boss.radius,
              vx: 0, vy: 1.5,
              radius: 14, type, bob: Math.random() * Math.PI * 2, life: 600,
            });
          }
        }
      }
    }
  }

  // --- Power-up collection ---
  for (let i = game.powerups.length - 1; i >= 0; i--) {
    const pu = game.powerups[i];
    pu.y += pu.vy;
    pu.bob += 0.1;
    pu.life--;
    if (pu.y > H + 20 || pu.life <= 0) {
      game.powerups.splice(i, 1);
      continue;
    }
    const dx = pu.x - p.x;
    const dy = pu.y - p.y;
    if (Math.sqrt(dx * dx + dy * dy) < pu.radius + p.radius) {
      applyPowerup(game, pu.type, setScore, dispatcher, opts);
      game.powerups.splice(i, 1);
    }
  }

  // --- Damage numbers ---
  game.damageNumbers = game.damageNumbers.filter(dn => {
    dn.y += dn.vy;
    dn.vy *= 0.95;
    dn.life--;
    return dn.life > 0;
  });

  // --- Player collision with enemy bullets ---
  const shieldActive = game.activePowerups.shield > now;

  if (p.invuln > 0) p.invuln--;
  if (p.invuln <= 0 && !shieldActive) {
    for (let j = game.enemyBullets.length - 1; j >= 0; j--) {
      const b = game.enemyBullets[j];
      const dx = b.x - p.x;
      const dy = b.y - p.y;
      if (Math.sqrt(dx * dx + dy * dy) < b.radius + p.radius - 5) {
        game.enemyBullets.splice(j, 1);
        const dmg = b.isBoss ? DMG_BOSS_BULLET : DMG_BULLET;
        damagePlayer(game, dmg);
        if (dispatcher && dispatcher.emit) {
          dispatcher.emit({ type: 'damage', source: b.isBoss ? 'bossBullet' : 'bullet', amount: dmg });
        }
        break;
      }
    }
  } else if (shieldActive) {
    for (let j = game.enemyBullets.length - 1; j >= 0; j--) {
      const b = game.enemyBullets[j];
      const dx = b.x - p.x;
      const dy = b.y - p.y;
      if (Math.sqrt(dx * dx + dy * dy) < b.radius + p.radius + 8) {
        game.enemyBullets.splice(j, 1);
        spawnParticles(game, b.x, b.y, '#60a5fa', 6);
      }
    }
  }

  // --- Player collision with aliens ---
  if (p.invuln <= 0 && !shieldActive) {
    for (let i = game.aliens.length - 1; i >= 0; i--) {
      const a = game.aliens[i];
      const dx = a.x - p.x;
      const dy = a.y - p.y;
      if (Math.sqrt(dx * dx + dy * dy) < a.radius + p.radius - 4) {
        spawnParticles(game, a.x, a.y, '#ef4444', 16);
        game.aliens.splice(i, 1);
        damagePlayer(game, DMG_ALIEN);
        if (dispatcher && dispatcher.emit) {
          dispatcher.emit({ type: 'damage', source: 'alien', amount: DMG_ALIEN });
        }
        break;
      }
    }
  } else if (shieldActive) {
    for (let i = game.aliens.length - 1; i >= 0; i--) {
      const a = game.aliens[i];
      const dx = a.x - p.x;
      const dy = a.y - p.y;
      if (Math.sqrt(dx * dx + dy * dy) < a.radius + p.radius + 4) {
        spawnParticles(game, a.x, a.y, '#60a5fa', 14);
        game.aliens.splice(i, 1);
        if (setScore) setScore(s => s + 30);
        if (!game.bossActive) {
          game.killCount += 1;
          game.killPulse = 10;

          if (dispatcher && dispatcher.emit) {
            dispatcher.emit({ type: 'kill', killCount: game.killCount });
          }

          if (game.killCount >= ALIENS_PER_WAVE) {
            game.killCount = 0;
            if (dispatcher && dispatcher.emit) {
              dispatcher.emit({ type: 'waveComplete', waveNumber: game.waveNumber });
            } else {
              game.triggerQuestion = true;
            }
          }
        }
      }
    }
  }

  // --- Particles ---
  game.particles = game.particles.filter(part => {
    part.x += part.vx; part.y += part.vy;
    part.vx *= 0.94; part.vy *= 0.94;
    part.life--;
    return part.life > 0;
  });

  // --- Stars ---
  game.stars.forEach(s => {
    s.y += s.speed;
    if (s.y > H) { s.y = -2; s.x = Math.random() * W; }
  });

  // --- Decay timers ---
  if (game.shake > 0) game.shake--;
  if (game.flash > 0) game.flash--;
  if (game.killPulse > 0) game.killPulse--;
}

/**
 * Draw the entire game scene to the canvas.
 * Pure rendering — no mutations except resetting ctx state.
 *
 * @param {CanvasRenderingContext2D} ctx - 2D canvas context
 * @param {object} game - game state object (read-only during draw)
 * @param {object} [options] - { reducedMotion }
 */
export function drawGame(ctx, game, options) {
  const opts = options || {};
  const reducedMotion = opts.reducedMotion;

  let sx = 0, sy = 0;
  if (game.shake > 0 && !reducedMotion) {
    sx = (Math.random() - 0.5) * game.shake;
    sy = (Math.random() - 0.5) * game.shake;
  }

  ctx.save();
  ctx.translate(sx, sy);

  // --- Background ---
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  if (game.bossActive) {
    grad.addColorStop(0, '#3b0000');
    grad.addColorStop(1, '#0a0010');
  } else {
    grad.addColorStop(0, '#0a0a2a');
    grad.addColorStop(1, '#0a0015');
  }
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // --- Stars ---
  game.stars.forEach(s => {
    ctx.globalAlpha = s.opacity;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(s.x, s.y, s.size, s.size);
  });
  ctx.globalAlpha = 1;

  // --- Particles ---
  game.particles.forEach(p => {
    ctx.globalAlpha = p.life / p.maxLife;
    ctx.shadowColor = p.color;
    ctx.shadowBlur = 6;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.shadowBlur = 0;
  ctx.globalAlpha = 1;

  // --- Power-ups ---
  game.powerups.forEach(pu => drawPowerup(ctx, pu));

  // --- Aliens ---
  game.aliens.forEach(a => {
    ctx.save();
    ctx.translate(a.x, a.y);
    const isRed = a.type === 'red';
    const main = isRed ? '#dc2626' : '#16a34a';
    const light = isRed ? '#fca5a5' : '#86efac';

    ctx.fillStyle = main;
    ctx.beginPath();
    ctx.arc(0, -2, a.radius, Math.PI, 0);
    ctx.lineTo(a.radius, 4);
    for (let i = 4; i >= -4; i--) {
      const tx = (i / 4) * a.radius;
      const ty = i % 2 === 0 ? 8 : 2;
      ctx.lineTo(tx, ty);
    }
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = light;
    ctx.beginPath();
    ctx.arc(-5, -8, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(-6, -3, 4, 0, Math.PI * 2);
    ctx.arc(6, -3, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(-6, -3, 2, 0, Math.PI * 2);
    ctx.arc(6, -3, 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  });

  // --- Boss ---
  if (game.bossActive && game.boss) {
    const boss = game.boss;
    ctx.save();
    ctx.translate(boss.x, boss.y);

    const bg = ctx.createRadialGradient(0, 0, 0, 0, 0, boss.radius * 2);
    bg.addColorStop(0, 'rgba(220, 38, 38, 0.6)');
    bg.addColorStop(1, 'rgba(220, 38, 38, 0)');
    ctx.fillStyle = bg;
    ctx.beginPath();
    ctx.arc(0, 0, boss.radius * 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, boss.radius + 4, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = '#7f1d1d';
    ctx.beginPath();
    ctx.arc(0, 0, boss.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#dc2626';
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2 + boss.wobble;
      const px = Math.cos(angle) * boss.radius;
      const py = Math.sin(angle) * boss.radius;
      const ex = Math.cos(angle) * (boss.radius + 8);
      const ey = Math.sin(angle) * (boss.radius + 8);
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(ex, ey);
      ctx.lineTo(Math.cos(angle + 0.2) * boss.radius, Math.sin(angle + 0.2) * boss.radius);
      ctx.closePath();
      ctx.fill();
    }

    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.arc(-14, -4, 7, 0, Math.PI * 2);
    ctx.arc(14, -4, 7, 0, Math.PI * 2);
    ctx.arc(0, 12, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(-14, -4, 3, 0, Math.PI * 2);
    ctx.arc(14, -4, 3, 0, Math.PI * 2);
    ctx.arc(0, 12, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    // Phase shield HP bar above boss
    const barW = 90;
    const barH = 8;
    const phasePct = boss.maxPhaseHp ? Math.max(0, boss.phaseHp / boss.maxPhaseHp) : 0;
    const bx = boss.x - barW / 2;
    const by = boss.y - boss.radius - 22;

    ctx.fillStyle = '#fef3c7';
    ctx.font = 'bold 9px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 3;
    ctx.strokeText('ARMOR', boss.x, by - 4);
    ctx.fillText('ARMOR', boss.x, by - 4);

    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    ctx.fillRect(bx - 1, by - 1, barW + 2, barH + 2);
    ctx.fillStyle = '#1f2937';
    ctx.fillRect(bx, by, barW, barH);
    const phaseColor = phasePct > 0.5 ? '#fbbf24' : phasePct > 0.25 ? '#f97316' : '#dc2626';
    ctx.fillStyle = phaseColor;
    ctx.fillRect(bx, by, barW * phasePct, barH);
    ctx.strokeStyle = '#fef3c7';
    ctx.lineWidth = 1;
    ctx.strokeRect(bx, by, barW, barH);
  }

  // --- Player bullets ---
  const isTriple = game.activePowerups.triple > Date.now();
  const isRapid = game.activePowerups.rapid > Date.now();
  const bulletColor = isTriple ? '#c084fc' : isRapid ? '#fde047' : '#67e8f9';
  const bulletGlow = isTriple ? '#a855f7' : isRapid ? '#fbbf24' : '#22d3ee';

  game.bullets.forEach(b => {
    ctx.shadowColor = bulletGlow;
    ctx.shadowBlur = 12;
    ctx.fillStyle = bulletColor;
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.radius - 1, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.shadowBlur = 0;

  // --- Enemy bullets ---
  game.enemyBullets.forEach(b => {
    ctx.shadowColor = b.isBoss ? '#fbbf24' : '#ef4444';
    ctx.shadowBlur = 10;
    ctx.fillStyle = b.isBoss ? '#fbbf24' : '#ef4444';
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.radius * 0.4, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.shadowBlur = 0;

  // --- Player ship ---
  const p = game.player;
  const shieldActive = game.activePowerups.shield > Date.now();

  if (p.invuln === 0 || Math.floor(p.invuln / 4) % 2 === 0) {
    ctx.save();
    ctx.translate(p.x, p.y);

    // Engine flame
    const flameLen = 8 + Math.random() * 6;
    const fg = ctx.createLinearGradient(0, p.radius * 0.4, 0, p.radius * 0.4 + flameLen);
    fg.addColorStop(0, '#fbbf24');
    fg.addColorStop(0.5, '#f97316');
    fg.addColorStop(1, 'rgba(239, 68, 68, 0)');
    ctx.fillStyle = fg;
    ctx.beginPath();
    ctx.moveTo(-5, p.radius * 0.4);
    ctx.lineTo(0, p.radius * 0.4 + flameLen);
    ctx.lineTo(5, p.radius * 0.4);
    ctx.closePath();
    ctx.fill();

    // Wings
    ctx.fillStyle = '#0e7490';
    ctx.beginPath();
    ctx.moveTo(-p.radius, p.radius * 0.5);
    ctx.lineTo(-p.radius * 0.5, 0);
    ctx.lineTo(-p.radius * 0.3, p.radius * 0.6);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(p.radius, p.radius * 0.5);
    ctx.lineTo(p.radius * 0.5, 0);
    ctx.lineTo(p.radius * 0.3, p.radius * 0.6);
    ctx.closePath();
    ctx.fill();

    // Body
    ctx.fillStyle = '#06b6d4';
    ctx.beginPath();
    ctx.moveTo(0, -p.radius);
    ctx.lineTo(-p.radius * 0.55, p.radius * 0.5);
    ctx.lineTo(0, p.radius * 0.3);
    ctx.lineTo(p.radius * 0.55, p.radius * 0.5);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#a5f3fc';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Cockpit
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.arc(0, -3, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fef3c7';
    ctx.beginPath();
    ctx.arc(-1, -4, 1.5, 0, Math.PI * 2);
    ctx.fill();

    // Invulnerability ring (non-shield)
    if (p.invuln > 0 && !shieldActive) {
      ctx.strokeStyle = `rgba(103, 232, 249, ${0.5 + Math.sin(p.invuln * 0.3) * 0.3})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, p.radius + 6, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();
  }

  // --- Shield effect ---
  if (shieldActive) {
    const t = Date.now() * 0.005;
    const remaining = (game.activePowerups.shield - Date.now()) / 1000;
    const flicker = remaining < 1.5 ? Math.sin(Date.now() * 0.02) > 0 ? 1 : 0.4 : 1;

    ctx.save();
    ctx.translate(p.x, p.y);

    const sg = ctx.createRadialGradient(0, 0, p.radius, 0, 0, p.radius + 16);
    sg.addColorStop(0, `rgba(96, 165, 250, ${0.05 * flicker})`);
    sg.addColorStop(0.7, `rgba(96, 165, 250, ${0.4 * flicker})`);
    sg.addColorStop(1, `rgba(96, 165, 250, ${0.1 * flicker})`);
    ctx.fillStyle = sg;
    ctx.beginPath();
    ctx.arc(0, 0, p.radius + 14, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = `rgba(147, 197, 253, ${0.9 * flicker})`;
    ctx.lineWidth = 2;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.arc(0, 0, p.radius + 12 + Math.sin(t + i) * 2, 0, Math.PI * 2);
      ctx.stroke();
    }

    for (let i = 0; i < 6; i++) {
      const angle = t + (i / 6) * Math.PI * 2;
      const r = p.radius + 14;
      ctx.fillStyle = `rgba(219, 234, 254, ${0.8 * flicker})`;
      ctx.beginPath();
      ctx.arc(Math.cos(angle) * r, Math.sin(angle) * r, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  // --- Damage numbers ---
  game.damageNumbers.forEach(dn => {
    ctx.globalAlpha = Math.min(1, dn.life / 30);
    ctx.fillStyle = dn.color;
    ctx.font = 'bold 16px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 3;
    ctx.strokeText(dn.text, dn.x, dn.y);
    ctx.fillText(dn.text, dn.x, dn.y);
  });
  ctx.globalAlpha = 1;

  ctx.restore();

  // --- Flash overlay (drawn outside shake transform) ---
  if (game.flash > 0 && !reducedMotion) {
    const c = game.flashColor;
    const r = parseInt(c.slice(1, 3), 16);
    const g = parseInt(c.slice(3, 5), 16);
    const b = parseInt(c.slice(5, 7), 16);
    ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${game.flash / 32})`;
    ctx.fillRect(0, 0, W, H);
  }
}
