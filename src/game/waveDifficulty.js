/**
 * Wave difficulty parameters for each wave (1–4).
 * Controls alien spawn rate, movement speed, and shooting frequency.
 */
const WAVE_PARAMS = {
  1: { spawnInterval: 90, alienSpeed: 1.2, shootingInterval: 1600 },
  2: { spawnInterval: 70, alienSpeed: 1.5, shootingInterval: 1300 },
  3: { spawnInterval: 50, alienSpeed: 2.1, shootingInterval: 1000 },
  4: { spawnInterval: 35, alienSpeed: 2.7, shootingInterval: 750 },
};

/**
 * Returns difficulty parameters for the given wave number.
 * Falls back to wave 1 parameters for out-of-range wave numbers.
 *
 * @param {number} waveNumber - The current wave (1–4)
 * @returns {{ spawnInterval: number, alienSpeed: number, shootingInterval: number }}
 */
export function getWaveDifficulty(waveNumber) {
  return WAVE_PARAMS[waveNumber] || WAVE_PARAMS[1];
}
