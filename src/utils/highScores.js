let STORAGE_KEY = 'default-highscores';

/**
 * Set the namespace prefix for storage keys.
 * Called when the active profile changes.
 * @param {string} prefix - The profile namespace prefix (e.g. 'sarah', 'james-jr')
 */
export function setNamespace(prefix) {
  STORAGE_KEY = `${prefix}-highscores`;
}

/**
 * Load all high scores from storage.
 * @returns {Promise<Object>} Map of topic keys to best scores, or {} on failure.
 */
export async function loadHighScores() {
  try {
    const result = await window.storage.get(STORAGE_KEY);
    return result?.value ? JSON.parse(result.value) : {};
  } catch (e) {
    return {};
  }
}

/**
 * Save a high score for a topic if it exceeds the stored best.
 * @param {string} topic - The topic key (e.g. 'linear', 'exam').
 * @param {number} score - The current session score.
 */
export async function saveHighScore(topic, score) {
  try {
    const scores = await loadHighScores();
    if (shouldUpdateHighScore(score, scores[topic] ?? null)) {
      scores[topic] = score;
      await window.storage.set(STORAGE_KEY, JSON.stringify(scores));
    }
  } catch (e) {
    // Persist failure is non-critical
  }
}

/**
 * Determine if the current score should replace the stored best.
 * @param {number} currentScore - The score from the current session.
 * @param {number|null|undefined} storedBest - The previously stored best score.
 * @returns {boolean} True if the score should be saved.
 */
export function shouldUpdateHighScore(currentScore, storedBest) {
  if (storedBest === null || storedBest === undefined) return true;
  return currentScore > storedBest;
}
