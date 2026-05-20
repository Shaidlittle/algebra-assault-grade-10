/**
 * Audio Module — Web Audio API sound system.
 *
 * Generates all game sounds programmatically using oscillators.
 * No external audio files required.
 *
 * Uses a shared AudioContext singleton to avoid exhausting browser
 * AudioContext limits or triggering throttling on repeated playback.
 *
 * Supported sound types:
 *   "shoot", "kill", "correct", "wrong", "hit", "levelUp",
 *   "boss", "powerup", "nuke", "heal", "tick", "tickHigh"
 */

let sharedCtx = null;

export const playSound = (type, enabled) => {
  if (!enabled) return;
  try {
    // Lazily create the AudioContext on first enabled call
    if (!sharedCtx) {
      try {
        sharedCtx = new (window.AudioContext || window.webkitAudioContext)();
      } catch (e) {
        // Creation failed — keep sharedCtx as null so next call retries
        return;
      }
    }

    // Resume if suspended (browser autoplay policy)
    if (sharedCtx.state === 'suspended') {
      try {
        sharedCtx.resume();
      } catch (e) {
        // Silently suppress resume errors
      }
    }

    const ctx = sharedCtx;
    const now = ctx.currentTime;
    const make = (freq, dur, type = 'triangle', vol = 0.1, ramp = null) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = type;
      osc.frequency.setValueAtTime(freq, now);
      if (ramp) osc.frequency.exponentialRampToValueAtTime(ramp, now + dur);
      gain.gain.setValueAtTime(vol, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + dur);
      osc.start(now); osc.stop(now + dur);
    };
    if (type === 'shoot') make(800, 0.06, 'square', 0.04, 200);
    else if (type === 'kill') { make(440, 0.08, 'square', 0.1); make(660, 0.1, 'triangle', 0.08); }
    else if (type === 'correct') { [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => make(f, 0.2, 'triangle', 0.12), i * 60)); }
    else if (type === 'wrong') make(150, 0.3, 'sawtooth', 0.15, 60);
    else if (type === 'hit') make(80, 0.25, 'sawtooth', 0.18, 30);
    else if (type === 'levelUp') [392, 523, 659, 784, 1047, 1319].forEach((f, i) => setTimeout(() => make(f, 0.25, 'square', 0.1), i * 80));
    else if (type === 'boss') [110, 87, 73, 110, 130].forEach((f, i) => setTimeout(() => make(f, 0.3, 'sawtooth', 0.18), i * 100));
    else if (type === 'powerup') [659, 784, 988, 1319].forEach((f, i) => setTimeout(() => make(f, 0.15, 'triangle', 0.12), i * 50));
    else if (type === 'nuke') { make(40, 0.6, 'sawtooth', 0.25, 200); setTimeout(() => make(120, 0.4, 'square', 0.15, 800), 100); }
    else if (type === 'heal') [523, 784, 1047].forEach((f, i) => setTimeout(() => make(f, 0.2, 'sine', 0.12), i * 70));
    else if (type === 'tick') make(880, 0.06, 'square', 0.06);
    else if (type === 'tickHigh') make(1320, 0.08, 'square', 0.1);
  } catch (e) {}
};

/**
 * Reset the shared AudioContext (for testing purposes).
 * This allows tests to verify singleton behavior by clearing state between test runs.
 */
export const _resetAudioContext = () => {
  sharedCtx = null;
};
