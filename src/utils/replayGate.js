/**
 * Replay Gate — Pure logic module for the Forced Mistake Replay feature.
 *
 * Determines whether a student must complete a replay session before starting
 * a mission, and builds the queue of questions to replay.
 */

/**
 * Determines if a topic is excluded from the replay gate.
 * Exam Simulator and Ultimate Challenge bypass the gate entirely.
 * @param {string} topic - Topic key
 * @returns {boolean} True if excluded (exam, ultimate)
 */
export function isExcludedTopic(topic) {
  return topic === 'exam' || topic === 'ultimate';
}

/**
 * Selects 2-3 oldest unresolved mistakes for the replay queue.
 * Skips entries with missing or invalid `question.wrong` field.
 * Sorts by timestamp ascending (oldest first) and returns the first
 * Math.min(3, validEntries.length) entries.
 *
 * @param {Array} unresolvedMistakes - Filtered unresolved entries
 * @returns {Array} Ordered queue of 2-3 mistake entries
 */
export function buildReplayQueue(unresolvedMistakes) {
  // Filter out entries with missing or invalid question.wrong field
  const valid = unresolvedMistakes.filter(
    entry =>
      entry.question &&
      Array.isArray(entry.question.wrong) &&
      entry.question.wrong.length > 0
  );

  // Sort by timestamp ascending (oldest first)
  const sorted = [...valid].sort((a, b) => a.timestamp - b.timestamp);

  // Return first min(3, length) entries
  return sorted.slice(0, Math.min(3, sorted.length));
}

/**
 * Determines whether the replay gate should activate.
 * Filters mistakes to only unresolved entries, checks if count >= 2,
 * and builds the replay queue if threshold is met.
 *
 * @param {Array} mistakes - All mistake entries from MistakeJournal
 * @param {string} topic - The topic being started
 * @returns {{ shouldActivate: boolean, queue: Array }}
 */
export function evaluateGate(mistakes, topic) {
  // Excluded topics always bypass the gate
  if (isExcludedTopic(topic)) {
    return { shouldActivate: false, queue: [] };
  }

  // Filter to unresolved entries only
  const unresolved = mistakes.filter(m => m.resolved === false);

  // Need at least 2 unresolved mistakes to activate
  if (unresolved.length < 2) {
    return { shouldActivate: false, queue: [] };
  }

  // Build the replay queue from unresolved entries
  const queue = buildReplayQueue(unresolved);

  // If after filtering invalid entries we have fewer than 2, don't activate
  if (queue.length < 2) {
    return { shouldActivate: false, queue: [] };
  }

  return { shouldActivate: true, queue };
}
