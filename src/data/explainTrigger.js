/**
 * Explain Trigger — utility for determining when to show an "Explain Your Answer"
 * follow-up prompt after a correct answer.
 *
 * The trigger fires only when ALL conditions are met:
 *   1. Game mode is NOT 'replayGate'
 *   2. The current question has explain data defined
 *   3. At least COOLDOWN_THRESHOLD correct answers since last prompt (or session start)
 *   4. Random value falls below TRIGGER_RATE (30% probability)
 */

/** Probability that an explain prompt appears (30%). */
export const TRIGGER_RATE = 0.3;

/** Minimum correct answers since last explain prompt before another can fire. */
export const COOLDOWN_THRESHOLD = 3;

/** Bonus points awarded for a correct explain response. */
export const BONUS_POINTS = 50;

/** Timeout in ms before the explain prompt auto-dismisses (15 seconds). */
export const TIMEOUT_MS = 15000;

/** Delay in ms after a response before the prompt dismisses (2 seconds). */
export const DISMISS_DELAY_MS = 2000;

/**
 * Determine whether an "Explain Your Answer" prompt should be shown.
 *
 * @param {Object} params
 * @param {string} params.gameMode - Current game mode ('playing', 'exam', 'dailyChallenge', 'replayGate')
 * @param {number} params.cooldownCount - Correct answers since last explain prompt (or session start)
 * @param {number} params.randomValue - A pre-generated random number in [0, 1)
 * @param {boolean} params.hasExplainData - Whether the current question has an explain object
 * @returns {boolean} True if the explain prompt should be displayed
 */
export function shouldTriggerExplain({ gameMode, cooldownCount, randomValue, hasExplainData }) {
  if (gameMode === 'replayGate') return false;
  if (!hasExplainData) return false;
  if (cooldownCount < COOLDOWN_THRESHOLD) return false;
  if (randomValue >= TRIGGER_RATE) return false;
  return true;
}
