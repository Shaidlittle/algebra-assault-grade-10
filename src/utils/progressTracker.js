let STORAGE_KEY = 'default-progress-history';
const MAX_SESSIONS = 50;

/**
 * Set the namespace prefix for storage keys.
 * Called when the active profile changes.
 * @param {string} prefix - The profile namespace prefix (e.g. 'sarah', 'james-jr')
 */
export function setNamespace(prefix) {
  STORAGE_KEY = `${prefix}-progress-history`;
}

/**
 * Load session history from storage.
 * Returns parsed array or [] on failure.
 */
export async function loadProgressHistory() {
  try {
    const result = await window.storage.get(STORAGE_KEY);
    return result?.value ? JSON.parse(result.value) : [];
  } catch (e) {
    return [];
  }
}

/**
 * Record a new session — appends to history, trims to last 50 entries, persists.
 * @param {object} sessionData - SessionRecord shape
 */
export async function recordSession(sessionData) {
  try {
    const history = await loadProgressHistory();
    history.push(sessionData);
    // Trim to last 50 sessions
    const trimmed = history.slice(-MAX_SESSIONS);
    await window.storage.set(STORAGE_KEY, JSON.stringify(trimmed));
  } catch (e) {
    // Persist failure is non-critical
  }
}

/**
 * Compute aggregated metrics from session history (pure function).
 * @param {Array} sessions - Array of SessionRecord objects
 * @returns {object} Metrics object
 */
export function computeMetrics(sessions) {
  if (!sessions || sessions.length === 0) {
    return {
      overallAccuracy: 0,
      perTopicAccuracy: {},
      perDifficultyAccuracy: { easy: 0, medium: 0, hard: 0 },
      currentStreak: 0,
      bestStreak: 0,
      totalQuestions: 0,
      strongestTopic: null,
      weakestTopic: null,
      trend: null
    };
  }

  const totalAttempted = sessions.reduce((s, r) => s + r.questionsAttempted, 0);
  const totalCorrect = sessions.reduce((s, r) => s + r.questionsCorrect, 0);
  const overallAccuracy = totalAttempted > 0 ? (totalCorrect / totalAttempted) * 100 : 0;

  // Per-topic accuracy
  const topicStats = {};
  for (const s of sessions) {
    if (!topicStats[s.topic]) topicStats[s.topic] = { attempted: 0, correct: 0 };
    topicStats[s.topic].attempted += s.questionsAttempted;
    topicStats[s.topic].correct += s.questionsCorrect;
  }
  const perTopicAccuracy = {};
  for (const [topic, stats] of Object.entries(topicStats)) {
    perTopicAccuracy[topic] = stats.attempted > 0 ? (stats.correct / stats.attempted) * 100 : 0;
  }

  // Per-difficulty accuracy
  const diffStats = { easy: { a: 0, c: 0 }, medium: { a: 0, c: 0 }, hard: { a: 0, c: 0 } };
  for (const s of sessions) {
    if (s.difficultyBreakdown) {
      for (const tier of ['easy', 'medium', 'hard']) {
        diffStats[tier].a += s.difficultyBreakdown[tier]?.attempted || 0;
        diffStats[tier].c += s.difficultyBreakdown[tier]?.correct || 0;
      }
    }
  }
  const perDifficultyAccuracy = {
    easy: diffStats.easy.a > 0 ? (diffStats.easy.c / diffStats.easy.a) * 100 : 0,
    medium: diffStats.medium.a > 0 ? (diffStats.medium.c / diffStats.medium.a) * 100 : 0,
    hard: diffStats.hard.a > 0 ? (diffStats.hard.c / diffStats.hard.a) * 100 : 0,
  };

  // Streaks (from most recent session)
  const lastSession = sessions[sessions.length - 1];
  const currentStreak = lastSession.questionsCorrect;
  const bestStreak = Math.max(...sessions.map(s => s.questionsCorrect));

  // Strongest / weakest topic
  const topicEntries = Object.entries(perTopicAccuracy);
  const strongestTopic = topicEntries.length > 0
    ? topicEntries.reduce((a, b) => a[1] >= b[1] ? a : b)[0]
    : null;
  const weakestTopic = topicEntries.length > 0
    ? topicEntries.reduce((a, b) => a[1] <= b[1] ? a : b)[0]
    : null;

  // Trend: compare oldest 5 vs newest 5 accuracy (null if < 10 sessions)
  let trend = null;
  if (sessions.length >= 10) {
    const oldest5 = sessions.slice(0, 5);
    const newest5 = sessions.slice(-5);
    const olderAttempted = oldest5.reduce((s, r) => s + r.questionsAttempted, 0);
    const newerAttempted = newest5.reduce((s, r) => s + r.questionsAttempted, 0);
    const olderAcc = olderAttempted > 0
      ? (oldest5.reduce((s, r) => s + r.questionsCorrect, 0) / olderAttempted) * 100
      : 0;
    const newerAcc = newerAttempted > 0
      ? (newest5.reduce((s, r) => s + r.questionsCorrect, 0) / newerAttempted) * 100
      : 0;
    trend = { older: olderAcc, newer: newerAcc };
  }

  return {
    overallAccuracy,
    perTopicAccuracy,
    perDifficultyAccuracy,
    currentStreak,
    bestStreak,
    totalQuestions: totalAttempted,
    strongestTopic,
    weakestTopic,
    trend
  };
}
