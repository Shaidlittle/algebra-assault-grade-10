const THRESHOLDS = [
  { min: 90, level: 'diamond' },
  { min: 80, level: 'gold' },
  { min: 60, level: 'silver' },
  { min: 40, level: 'bronze' },
];

const COLORS = {
  none: '#6B7280',
  bronze: '#CD7F32',
  silver: '#C0C0C0',
  gold: '#FFD700',
  diamond: '#B9F2FF',
};

/**
 * Get mastery level from accuracy percentage.
 * @param {number|null|undefined} accuracy - Accuracy percentage (0-100)
 * @returns {'none'|'bronze'|'silver'|'gold'|'diamond'}
 */
export function getMasteryLevel(accuracy) {
  if (accuracy == null || accuracy < 0) return 'none';
  for (const { min, level } of THRESHOLDS) {
    if (accuracy >= min) return level;
  }
  return 'none';
}

/**
 * Get display color hex string for a mastery level.
 * @param {'none'|'bronze'|'silver'|'gold'|'diamond'} level
 * @returns {string} Hex color code
 */
export function getMasteryColor(level) {
  return COLORS[level] || COLORS.none;
}

/**
 * Compute mastery levels for all topics from per-topic accuracy data.
 * @param {Object<string, number>} perTopicAccuracy - Map of topic keys to accuracy percentages
 * @returns {Object<string, string>} Map of topic keys to mastery level strings
 */
export function computeTopicMasteries(perTopicAccuracy) {
  const result = {};
  for (const [topic, accuracy] of Object.entries(perTopicAccuracy)) {
    result[topic] = getMasteryLevel(accuracy);
  }
  return result;
}
