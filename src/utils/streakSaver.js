/**
 * Streak Saver utility module.
 *
 * Tracks consecutive wrong answers and determines when to activate
 * an intervention (easier question or conceptual explanation).
 *
 * All functions are pure — no side effects, no storage access.
 */

/** Number of consecutive wrong answers required to trigger intervention */
export const STREAK_THRESHOLD = 3;

/**
 * Update the streak saver state based on whether the latest answer was correct.
 *
 * - If correct: resets consecutiveWrong to 0, shouldActivate = false
 * - If wrong: increments consecutiveWrong
 *   - If reaches STREAK_THRESHOLD: shouldActivate = true, resets counter to 0
 *   - Otherwise: shouldActivate = false
 *
 * @param {{ consecutiveWrong: number }} state - Current streak saver state
 * @param {boolean} isCorrect - Whether the latest answer was correct
 * @returns {{ newState: { consecutiveWrong: number }, shouldActivate: boolean }}
 */
export function updateStreakSaver(state, isCorrect) {
  if (isCorrect) {
    return {
      newState: { consecutiveWrong: 0 },
      shouldActivate: false,
    };
  }

  const newCount = state.consecutiveWrong + 1;

  if (newCount >= STREAK_THRESHOLD) {
    return {
      newState: { consecutiveWrong: 0 },
      shouldActivate: true,
    };
  }

  return {
    newState: { consecutiveWrong: newCount },
    shouldActivate: false,
  };
}

/**
 * Reset the streak saver to its initial state.
 * Called after an intervention is shown, regardless of which option the student picks.
 *
 * @returns {{ consecutiveWrong: number }} Fresh initial state
 */
export function resetStreakSaver() {
  return { consecutiveWrong: 0 };
}
