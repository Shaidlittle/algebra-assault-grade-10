let STORAGE_KEY = 'default-xp';
const XP_PER_LEVEL = 200;
const MAX_LEVEL = 50;

/**
 * Set the namespace prefix for storage keys.
 * Called when the active profile changes.
 * @param {string} prefix - The profile namespace prefix (e.g. 'sarah', 'james-jr')
 */
export function setNamespace(prefix) {
  STORAGE_KEY = `${prefix}-xp`;
}

/**
 * Load total XP from storage.
 * @returns {Promise<number>} Total XP value, or 0 on failure.
 */
export async function loadXP() {
  try {
    const result = await window.storage.get(STORAGE_KEY);
    if (!result?.value) return 0;
    const data = JSON.parse(result.value);
    return data.totalXP || 0;
  } catch (e) {
    return 0;
  }
}

/**
 * Award XP and persist to storage.
 * @param {number} amount - XP to add
 * @returns {Promise<number>} New total XP
 */
export async function awardXP(amount) {
  try {
    const current = await loadXP();
    const newTotal = current + amount;
    await window.storage.set(STORAGE_KEY, JSON.stringify({ totalXP: newTotal }));
    return newTotal;
  } catch (e) {
    return 0;
  }
}

/**
 * Compute level from total XP.
 * Level = min(floor(totalXP / 200) + 1, 50)
 * @param {number} totalXP
 * @returns {number} Level (1-50)
 */
export function getLevel(totalXP) {
  return Math.min(Math.floor((totalXP || 0) / XP_PER_LEVEL) + 1, MAX_LEVEL);
}

/**
 * Get progress toward next level as a fraction (0-1).
 * @param {number} totalXP
 * @returns {number} Progress fraction (0 to 1)
 */
export function getLevelProgress(totalXP) {
  const xp = totalXP || 0;
  const level = getLevel(xp);
  if (level >= MAX_LEVEL) return 1;
  const xpForCurrentLevel = (level - 1) * XP_PER_LEVEL;
  return (xp - xpForCurrentLevel) / XP_PER_LEVEL;
}

/**
 * Detect if a level boundary was crossed between two XP values.
 * @param {number} prevXP - XP before award
 * @param {number} newXP - XP after award
 * @returns {boolean} True if level increased
 */
export function detectLevelUp(prevXP, newXP) {
  return getLevel(newXP) > getLevel(prevXP);
}
