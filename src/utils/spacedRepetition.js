let STORAGE_KEY = 'default-spaced-repetition';

/**
 * Set the namespace prefix for storage keys.
 * Called when the active profile changes.
 * @param {string} prefix - The profile namespace prefix (e.g. 'sarah', 'james-jr')
 */
export function setNamespace(prefix) {
  STORAGE_KEY = `${prefix}-spaced-repetition`;
}

/** Interval stages in milliseconds */
export const INTERVALS = {
  stage1: 1 * 24 * 60 * 60 * 1000,   // 1 day  = 86400000
  stage2: 3 * 24 * 60 * 60 * 1000,   // 3 days = 259200000
  stage3: 7 * 24 * 60 * 60 * 1000,   // 7 days = 604800000
};

/**
 * Schedule a new mistake for spaced repetition (interval = stage1 / 1 day).
 * @param {object} mistake - Mistake journal entry { topic, question, selectedAnswer, correctAnswer, timestamp }
 * @returns {object} Schedule entry with stage=1 and nextReview set to now + 1 day
 */
export function scheduleNewMistake(mistake) {
  const now = Date.now();
  return {
    question: mistake.question || mistake,
    topic: mistake.topic,
    timestamp: mistake.timestamp || now,
    stage: 1,
    nextReview: now + INTERVALS.stage1,
  };
}

/**
 * Advance interval after correct review answer.
 * Intervals: stage1 → stage2 → stage3 → resolved (null)
 * @param {object} entry - Schedule entry
 * @returns {object|null} Updated entry with next stage, or null if resolved (was stage3)
 */
export function advanceInterval(entry) {
  const now = Date.now();

  if (entry.stage === 1) {
    return {
      ...entry,
      stage: 2,
      nextReview: now + INTERVALS.stage2,
    };
  }

  if (entry.stage === 2) {
    return {
      ...entry,
      stage: 3,
      nextReview: now + INTERVALS.stage3,
    };
  }

  // stage 3 → resolved
  return null;
}

/**
 * Reset interval after incorrect review answer (back to stage1 / 1 day).
 * @param {object} entry - Schedule entry
 * @returns {object} Updated entry with stage=1 and nextReview reset
 */
export function resetInterval(entry) {
  const now = Date.now();
  return {
    ...entry,
    stage: 1,
    nextReview: now + INTERVALS.stage1,
  };
}

/**
 * Get all questions due for review (nextReview <= now).
 * @param {Array} schedule - Full schedule array of entries
 * @param {number} now - Current timestamp (Date.now())
 * @returns {Array} Entries where nextReview <= now
 */
export function getDueQuestions(schedule, now) {
  return schedule.filter(entry => entry.nextReview <= now);
}

/**
 * Load spaced repetition schedule from storage.
 * @returns {Promise<Array>} Array of schedule entries, or [] on failure.
 */
export async function loadSchedule() {
  try {
    const result = await window.storage.get(STORAGE_KEY);
    return result?.value ? JSON.parse(result.value) : [];
  } catch (e) {
    return [];
  }
}

/**
 * Save spaced repetition schedule to storage.
 * @param {Array} schedule - Array of schedule entries to persist
 */
export async function saveSchedule(schedule) {
  try {
    await window.storage.set(STORAGE_KEY, JSON.stringify(schedule));
  } catch (e) {
    // Persist failure is non-critical
  }
}
