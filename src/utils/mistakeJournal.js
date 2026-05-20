let STORAGE_KEY = 'default-mistakes';

/**
 * Set the namespace prefix for storage keys.
 * Called when the active profile changes.
 * @param {string} prefix - The profile namespace prefix (e.g. 'sarah', 'james-jr')
 */
export function setNamespace(prefix) {
  STORAGE_KEY = `${prefix}-mistakes`;
}

/**
 * Load all recorded mistakes from storage.
 * @returns {Promise<Array>} Array of MistakeEntry objects, or [] on failure.
 */
export async function loadMistakes() {
  try {
    const result = await window.storage.get(STORAGE_KEY);
    return result?.value ? JSON.parse(result.value) : [];
  } catch (e) {
    return [];
  }
}

/**
 * Record a new mistake entry. Adds resolved: false automatically.
 * @param {object} entry - { topic, question, selectedAnswer, correctAnswer, timestamp }
 */
export async function recordMistake(entry) {
  try {
    const mistakes = await loadMistakes();
    mistakes.push({ ...entry, resolved: false });
    await window.storage.set(STORAGE_KEY, JSON.stringify(mistakes));
  } catch (e) {
    // Persist failure is non-critical
  }
}

/**
 * Mark a mistake as resolved by topic and timestamp.
 * @param {string} topic - The topic key of the mistake.
 * @param {number} timestamp - The timestamp of the mistake entry.
 */
export async function markResolved(topic, timestamp) {
  try {
    const mistakes = await loadMistakes();
    const idx = mistakes.findIndex(
      m => m.topic === topic && m.timestamp === timestamp
    );
    if (idx !== -1) {
      mistakes[idx].resolved = true;
      await window.storage.set(STORAGE_KEY, JSON.stringify(mistakes));
    }
  } catch (e) {
    // Persist failure is non-critical
  }
}

/**
 * Group mistakes by topic (pure function).
 * @param {Array} mistakes - Array of MistakeEntry objects.
 * @returns {Object} Map of topic keys to arrays of MistakeEntry objects.
 */
export function groupMistakesByTopic(mistakes) {
  const groups = {};
  for (const m of mistakes) {
    if (!groups[m.topic]) groups[m.topic] = [];
    groups[m.topic].push(m);
  }
  return groups;
}

/**
 * Get summary statistics from mistakes (pure function).
 * @param {Array} mistakes - Array of MistakeEntry objects.
 * @returns {Object} { total, resolved, unresolved }
 */
export function getMistakeStats(mistakes) {
  const resolved = mistakes.filter(m => m.resolved).length;
  return {
    total: mistakes.length,
    resolved,
    unresolved: mistakes.length - resolved
  };
}
