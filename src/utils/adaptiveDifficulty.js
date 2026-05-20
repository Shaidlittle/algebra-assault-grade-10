let STORAGE_KEY = 'default-adaptive';

/**
 * Set the namespace prefix for storage keys.
 * Called when the active profile changes.
 * @param {string} prefix - The profile namespace prefix (e.g. 'sarah', 'james-jr')
 */
export function setNamespace(prefix) {
  STORAGE_KEY = `${prefix}-adaptive`;
}

/**
 * Load adaptive difficulty state from storage.
 * @returns {Promise<Object>} Map of topic keys to adaptive state, or {} on failure.
 */
export async function loadAdaptiveState() {
  try {
    const result = await window.storage.get(STORAGE_KEY);
    return result?.value ? JSON.parse(result.value) : {};
  } catch (e) {
    return {};
  }
}

/**
 * Save adaptive difficulty state to storage.
 * @param {Object} state - The full adaptive state object.
 */
export async function saveAdaptiveState(state) {
  try {
    await window.storage.set(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    // Persist failure is non-critical
  }
}

/**
 * Determine the current difficulty level for a topic based on its adaptive state.
 * Priority: hard-wrong-drop > medium-promote > easy-skip > default easy.
 * @param {Object|null|undefined} topicState - The topic's streak data.
 * @returns {"easy"|"medium"|"hard"} The recommended difficulty tier.
 */
export function getAdaptiveLevel(topicState) {
  if (!topicState) return 'easy';
  // Drop to medium if struggling with hard
  if (topicState.hardWrongStreak >= 2) return 'medium';
  // Promote to hard if mastering medium
  if (topicState.mediumStreak >= 3) return 'hard';
  // Skip easy if mastering easy
  if (topicState.easyStreak >= 3) return 'medium';
  // Default starting level
  return 'easy';
}

/**
 * Update adaptive state after an answer (pure function).
 * @param {Object} state - The full adaptive state object.
 * @param {string} topic - The topic key.
 * @param {"easy"|"medium"|"hard"} difficulty - The difficulty tier of the answered question.
 * @param {boolean} correct - Whether the answer was correct.
 * @returns {Object} New state object (does not mutate input).
 */
export function updateAdaptiveState(state, topic, difficulty, correct) {
  const prev = state[topic] || { easyStreak: 0, mediumStreak: 0, hardWrongStreak: 0 };
  const next = { ...prev };

  if (difficulty === 'easy') {
    next.easyStreak = correct ? prev.easyStreak + 1 : 0;
  } else if (difficulty === 'medium') {
    next.mediumStreak = correct ? prev.mediumStreak + 1 : 0;
  } else if (difficulty === 'hard') {
    if (correct) {
      next.hardWrongStreak = 0;
    } else {
      next.hardWrongStreak = prev.hardWrongStreak + 1;
    }
  }

  return { ...state, [topic]: next };
}
