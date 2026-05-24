import { generateQuestionSet } from './questionGenerator.js';

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
 * Get 7 daily challenge questions seeded by date.
 * Selects from easy, medium, and hard tiers across at least 3 different topics.
 * Difficulty mix: 2 easy, 3 medium, 2 hard.
 * Falls back to questionGenerator if static bank is insufficient.
 * @param {string} dateString - YYYY-MM-DD format
 * @param {Object} questionsBank - The QUESTIONS object
 * @returns {Array} Array of 7 question objects with added `topic` and `difficulty` fields
 */
export function getDailyQuestions(dateString, questionsBank) {
  const rng = mulberry32(dateSeed(dateString));
  const playableTopics = Object.keys(questionsBank).filter(
    k => !questionsBank[k].isUltimate && !questionsBank[k].isExam
  );

  // Collect questions by difficulty tier with topic annotation
  const easyPool = [];
  const mediumPool = [];
  const hardPool = [];

  for (const t of playableTopics) {
    const data = questionsBank[t];
    if (data.easy) {
      for (const q of data.easy) easyPool.push({ ...q, topic: t, difficulty: 'easy' });
    }
    if (data.medium) {
      for (const q of data.medium) mediumPool.push({ ...q, topic: t, difficulty: 'medium' });
    }
    if (data.hard) {
      for (const q of data.hard) hardPool.push({ ...q, topic: t, difficulty: 'hard' });
    }
  }

  // Fisher-Yates shuffle helper using seeded RNG
  function shufflePool(pool) {
    const arr = [...pool];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  // Shuffle each pool
  const shuffledEasy = shufflePool(easyPool);
  const shuffledMedium = shufflePool(mediumPool);
  const shuffledHard = shufflePool(hardPool);

  // Select: 2 easy, 3 medium, 2 hard
  let easyPicks = shuffledEasy.slice(0, 2);
  let mediumPicks = shuffledMedium.slice(0, 3);
  let hardPicks = shuffledHard.slice(0, 2);

  // Fall back to question generator if static bank is insufficient
  if (easyPicks.length < 2 || mediumPicks.length < 3 || hardPicks.length < 2) {
    try {
      const seed = dateSeed(dateString);
      const fallbackTopic = playableTopics[0] || 'linear';

      if (easyPicks.length < 2) {
        const needed = 2 - easyPicks.length;
        const generated = generateQuestionSet(seed + 100, fallbackTopic, 'easy', needed);
        easyPicks = [...easyPicks, ...generated.map(q => ({ ...q, topic: fallbackTopic, difficulty: 'easy' }))];
      }
      if (mediumPicks.length < 3) {
        const needed = 3 - mediumPicks.length;
        const generated = generateQuestionSet(seed + 200, fallbackTopic, 'medium', needed);
        mediumPicks = [...mediumPicks, ...generated.map(q => ({ ...q, topic: fallbackTopic, difficulty: 'medium' }))];
      }
      if (hardPicks.length < 2) {
        const needed = 2 - hardPicks.length;
        const generated = generateQuestionSet(seed + 300, fallbackTopic, 'hard', needed);
        hardPicks = [...hardPicks, ...generated.map(q => ({ ...q, topic: fallbackTopic, difficulty: 'hard' }))];
      }
    } catch (e) {
      // If question generator fails, use whatever we have
    }
  }

  // Combine all picks
  let selected = [...easyPicks, ...mediumPicks, ...hardPicks];

  // Ensure at least 3 different topics are represented
  const topicsPresent = new Set(selected.map(q => q.topic));
  if (topicsPresent.size < 3 && playableTopics.length >= 3) {
    // Try to swap in questions from underrepresented topics
    const missingTopics = playableTopics.filter(t => !topicsPresent.has(t));
    for (const missingTopic of missingTopics) {
      if (topicsPresent.size >= 3) break;
      const data = questionsBank[missingTopic];
      // Find a replacement question from the missing topic
      let replacement = null;
      let replaceDifficulty = null;

      if (data.medium && data.medium.length > 0) {
        replacement = { ...data.medium[Math.floor(rng() * data.medium.length)], topic: missingTopic, difficulty: 'medium' };
        replaceDifficulty = 'medium';
      } else if (data.easy && data.easy.length > 0) {
        replacement = { ...data.easy[Math.floor(rng() * data.easy.length)], topic: missingTopic, difficulty: 'easy' };
        replaceDifficulty = 'easy';
      } else if (data.hard && data.hard.length > 0) {
        replacement = { ...data.hard[Math.floor(rng() * data.hard.length)], topic: missingTopic, difficulty: 'hard' };
        replaceDifficulty = 'hard';
      }

      if (replacement) {
        // Find a question to replace — prefer one from a topic that has multiple entries
        const topicCounts = {};
        selected.forEach((q, i) => {
          if (!topicCounts[q.topic]) topicCounts[q.topic] = [];
          topicCounts[q.topic].push(i);
        });

        // Find a topic with more than 1 question and matching difficulty to swap
        let swapIdx = -1;
        for (const [topic, indices] of Object.entries(topicCounts)) {
          if (indices.length > 1) {
            // Prefer swapping same difficulty
            const sameDiffIdx = indices.find(i => selected[i].difficulty === replaceDifficulty);
            if (sameDiffIdx !== undefined) {
              swapIdx = sameDiffIdx;
              break;
            }
            swapIdx = indices[indices.length - 1];
          }
        }

        if (swapIdx >= 0) {
          selected[swapIdx] = replacement;
          topicsPresent.add(missingTopic);
        }
      }
    }
  }

  // Final shuffle to mix difficulties together
  for (let i = selected.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [selected[i], selected[j]] = [selected[j], selected[i]];
  }

  // Ensure we return exactly 7 (trim if somehow we have more)
  return selected.slice(0, 7);
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
