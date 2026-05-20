let STORAGE_KEY = 'default-daily-challenge';

/**
 * Set the namespace prefix for storage keys.
 * Called when the active profile changes.
 * @param {string} prefix - The profile namespace prefix (e.g. 'sarah', 'james-jr')
 */
export function setNamespace(prefix) {
  STORAGE_KEY = `${prefix}-daily-challenge`;
}

/**
 * Simple seeded PRNG (mulberry32) for deterministic daily question selection.
 */
function mulberry32(seed) {
  let s = seed | 0;
  return function () {
    s = (s + 0x6D2B79F5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Convert a date string (YYYY-MM-DD) to a numeric seed.
 */
function dateSeed(dateString) {
  let hash = 0;
  for (let i = 0; i < dateString.length; i++) {
    hash = ((hash << 5) - hash + dateString.charCodeAt(i)) | 0;
  }
  return hash;
}

/**
 * Get today's date string in YYYY-MM-DD format.
 */
export function getTodayString() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * Get 3 daily challenge questions seeded by date.
 * Selects from medium and hard tiers across random topics.
 * @param {string} dateString - YYYY-MM-DD format
 * @param {Object} questionsBank - The QUESTIONS object
 * @returns {Array} Array of 3 question objects with added `topic` field
 */
export function getDailyQuestions(dateString, questionsBank) {
  const rng = mulberry32(dateSeed(dateString));
  const playableTopics = Object.keys(questionsBank).filter(
    k => !questionsBank[k].isUltimate && !questionsBank[k].isExam
  );

  // Collect all medium and hard questions with topic annotation
  const pool = [];
  for (const t of playableTopics) {
    const data = questionsBank[t];
    if (data.medium) {
      for (const q of data.medium) pool.push({ ...q, topic: t, difficulty: 'medium' });
    }
    if (data.hard) {
      for (const q of data.hard) pool.push({ ...q, topic: t, difficulty: 'hard' });
    }
  }

  // Fisher-Yates shuffle with seeded RNG, pick first 3
  const shuffled = [...pool];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled.slice(0, 3);
}

/**
 * Check if the daily challenge has been completed today.
 * @returns {Promise<boolean>}
 */
export async function isDailyCompleted() {
  try {
    const result = await window.storage.get(STORAGE_KEY);
    if (!result?.value) return false;
    const data = JSON.parse(result.value);
    return data.lastCompletedDate === getTodayString();
  } catch (e) {
    return false;
  }
}

/**
 * Mark the daily challenge as completed and update streak.
 * @returns {Promise<Object>} Updated streak data { lastCompletedDate, currentStreak }
 */
export async function completeDailyChallenge() {
  const today = getTodayString();
  const streakData = await loadStreakData();
  const updated = updateStreak(streakData, today);
  try {
    await window.storage.set(STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {}
  return updated;
}

/**
 * Load streak data from storage.
 * @returns {Promise<Object>} { lastCompletedDate, currentStreak }
 */
export async function loadStreakData() {
  try {
    const result = await window.storage.get(STORAGE_KEY);
    if (!result?.value) return { lastCompletedDate: null, currentStreak: 0 };
    return JSON.parse(result.value);
  } catch (e) {
    return { lastCompletedDate: null, currentStreak: 0 };
  }
}

/**
 * Compute updated streak based on completion date (pure function).
 * @param {Object} streakData - { lastCompletedDate, currentStreak }
 * @param {string} todayString - YYYY-MM-DD
 * @returns {Object} Updated streak data
 */
export function updateStreak(streakData, todayString) {
  const { lastCompletedDate, currentStreak } = streakData;

  // Same day — idempotent
  if (lastCompletedDate === todayString) {
    return { lastCompletedDate, currentStreak };
  }

  // Check if yesterday
  const today = new Date(todayString + 'T00:00:00');
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

  if (lastCompletedDate === yesterdayStr) {
    // Consecutive day — increment streak
    return { lastCompletedDate: todayString, currentStreak: currentStreak + 1 };
  }

  // Gap — reset streak to 1
  return { lastCompletedDate: todayString, currentStreak: 1 };
}
