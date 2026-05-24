/**
 * Improvement Toast Utility
 *
 * Detects measurable improvement in student accuracy or streak records
 * and returns toast notification data when thresholds are met.
 */

/** Minimum questions required for a topic before showing improvement toasts */
const MIN_QUESTIONS_FOR_TOAST = 10;

/** Minimum accuracy improvement (percentage points) to trigger a toast */
const IMPROVEMENT_THRESHOLD = 10;

/**
 * Check if the student's accuracy has improved enough to show a toast.
 * Compares currentAccuracy (rolling avg of last 10 questions) vs overall topic average.
 *
 * @param {object} progressData - { perTopicAccuracy: { [topic]: number }, totalQuestions: number, perTopicQuestions?: { [topic]: number } }
 * @param {string} topic - Topic key
 * @param {number} currentAccuracy - Current rolling accuracy (0-100)
 * @returns {{ show: boolean, message?: string, type?: string }}
 */
export function checkImprovementToast(progressData, topic, currentAccuracy) {
  // Guard: skip if progressData is missing or invalid
  if (!progressData || !topic) {
    return { show: false };
  }

  // Determine per-topic question count
  const perTopicQuestions = progressData.perTopicQuestions || {};
  const topicQuestionCount = perTopicQuestions[topic];

  // If perTopicQuestions is available, check the threshold
  if (topicQuestionCount !== undefined && topicQuestionCount < MIN_QUESTIONS_FOR_TOAST) {
    return { show: false };
  }

  // If perTopicQuestions is not available, check if topic exists in perTopicAccuracy
  // If it doesn't exist, there's no historical data to compare against
  const perTopicAccuracy = progressData.perTopicAccuracy || {};
  if (!(topic in perTopicAccuracy)) {
    return { show: false };
  }

  const overallAccuracy = perTopicAccuracy[topic];

  // Calculate improvement (current rolling avg vs overall avg)
  const improvement = currentAccuracy - overallAccuracy;

  if (improvement >= IMPROVEMENT_THRESHOLD) {
    const roundedImprovement = Math.round(improvement);
    return {
      show: true,
      message: `Your ${topic} accuracy improved by ${roundedImprovement}%!`,
      type: 'accuracy'
    };
  }

  return { show: false };
}

/**
 * Check if a new personal best streak was achieved.
 *
 * @param {number} currentStreak - Current correct-answer streak
 * @param {number} previousBest - Previous best streak for topic
 * @returns {{ show: boolean, message?: string, type?: string }}
 */
export function checkStreakRecord(currentStreak, previousBest) {
  if (currentStreak > previousBest) {
    return {
      show: true,
      message: `New personal best: ${currentStreak} correct in a row!`,
      type: 'streak'
    };
  }

  return { show: false };
}
