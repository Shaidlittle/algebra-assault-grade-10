/**
 * Weekly Goals Utility — tracks weekly objectives and cosmetic reward unlocks.
 *
 * Storage key: '{namespace}-weekly-goals'
 *
 * State shape:
 * {
 *   weekStart: string (ISO date of Monday midnight),
 *   progress: { questionsCorrect: number, sessionsStarted: number, dailyChallengesCompleted: number },
 *   unlockedRewards: string[],
 *   completed: boolean
 * }
 *
 * Weekly objectives:
 *   questionsCorrect >= 50
 *   sessionsStarted >= 5
 *   dailyChallengesCompleted >= 3
 *
 * All pure functions except load/save.
 */

let storagePrefix = 'weekly-goals';

/**
 * Set the namespace prefix for multi-profile support.
 * @param {string} prefix - Profile prefix (e.g. 'matteo')
 */
export function setNamespace(prefix) {
  storagePrefix = prefix ? `${prefix}-weekly-goals` : 'weekly-goals';
}

/**
 * Get the current storage key (internal helper).
 * @returns {string}
 */
function getStorageKey() {
  return storagePrefix;
}

/** 12 cosmetic rewards (ship skins + trail colors) */
export const COSMETIC_REWARDS = [
  { id: 'skin-flame', name: 'Flame Ship', type: 'skin', value: '#ef4444' },
  { id: 'trail-purple', name: 'Purple Trail', type: 'trail', value: '#8b5cf6' },
  { id: 'skin-nebula', name: 'Nebula Ship', type: 'skin', value: '#6366f1' },
  { id: 'trail-gold', name: 'Gold Trail', type: 'trail', value: '#eab308' },
  { id: 'skin-arctic', name: 'Arctic Ship', type: 'skin', value: '#06b6d4' },
  { id: 'trail-emerald', name: 'Emerald Trail', type: 'trail', value: '#10b981' },
  { id: 'skin-shadow', name: 'Shadow Ship', type: 'skin', value: '#1e293b' },
  { id: 'trail-crimson', name: 'Crimson Trail', type: 'trail', value: '#dc2626' },
  { id: 'skin-solar', name: 'Solar Ship', type: 'skin', value: '#f59e0b' },
  { id: 'trail-cyan', name: 'Cyan Trail', type: 'trail', value: '#22d3ee' },
  { id: 'skin-phantom', name: 'Phantom Ship', type: 'skin', value: '#a855f7' },
  { id: 'trail-rainbow', name: 'Rainbow Trail', type: 'trail', value: '#ec4899' },
];

/** Map action names to progress field names */
const ACTION_MAP = {
  questionCorrect: 'questionsCorrect',
  sessionStarted: 'sessionsStarted',
  dailyChallengeCompleted: 'dailyChallengesCompleted',
};

/**
 * Get the ISO date string of the most recent Monday at midnight (local time).
 * @returns {string} ISO date string e.g. "2024-01-15T00:00:00.000Z"
 */
export function getCurrentWeekStart() {
  const now = new Date();
  const day = now.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
  const diff = day === 0 ? 6 : day - 1; // days since Monday
  const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - diff);
  monday.setHours(0, 0, 0, 0);
  return monday.toISOString();
}

/**
 * Create a default fresh state for a new week.
 * @returns {object} Default weekly goals state
 */
function createDefaultState() {
  return {
    weekStart: getCurrentWeekStart(),
    progress: {
      questionsCorrect: 0,
      sessionsStarted: 0,
      dailyChallengesCompleted: 0,
    },
    unlockedRewards: [],
    completed: false,
  };
}

/**
 * Check if the current week has reset and initialize new objectives if needed.
 * If state.weekStart !== getCurrentWeekStart(), reset progress to zeros and update weekStart.
 * @param {object} state - Current weekly goal state
 * @returns {object} Updated state (may have reset progress)
 */
export function checkWeekReset(state) {
  const currentWeekStart = getCurrentWeekStart();
  if (state.weekStart !== currentWeekStart) {
    return {
      ...state,
      weekStart: currentWeekStart,
      progress: {
        questionsCorrect: 0,
        sessionsStarted: 0,
        dailyChallengesCompleted: 0,
      },
      completed: false,
    };
  }
  return state;
}

/**
 * Update progress toward weekly objectives.
 * Accepts action names: 'questionCorrect', 'sessionStarted', 'dailyChallengeCompleted'
 * Also accepts direct field names: 'questionsCorrect', 'sessionsStarted', 'dailyChallengesCompleted'
 * @param {object} state - Current state
 * @param {string} action - Action name or progress field name
 * @param {number} amount - Increment amount
 * @returns {object} Updated state
 */
export function updateGoalProgress(state, action, amount) {
  const field = ACTION_MAP[action] || action;
  if (!(field in state.progress)) {
    return state;
  }
  return {
    ...state,
    progress: {
      ...state.progress,
      [field]: state.progress[field] + amount,
    },
  };
}

/**
 * Check if all objectives are complete and award reward.
 * Weekly objectives: questionsCorrect >= 50, sessionsStarted >= 5, dailyChallengesCompleted >= 3
 *
 * @param {object} state - Current state
 * @returns {{ completed: boolean, reward: object|null, bonusXP: number }}
 */
export function checkGoalCompletion(state) {
  const { progress, completed, unlockedRewards } = state;

  const allMet =
    progress.questionsCorrect >= 50 &&
    progress.sessionsStarted >= 5 &&
    progress.dailyChallengesCompleted >= 3;

  if (!allMet || completed) {
    return { completed: false, reward: null, bonusXP: 0 };
  }

  // All objectives met and not yet completed this week
  if (unlockedRewards.length < 12) {
    const nextReward = COSMETIC_REWARDS[unlockedRewards.length];
    return { completed: true, reward: nextReward, bonusXP: 0 };
  }

  // All 12 rewards already unlocked — award 200 bonus XP
  return { completed: true, reward: null, bonusXP: 200 };
}

/**
 * Load weekly goal state from storage.
 * @returns {Promise<object>} Weekly goals state or default state on failure
 */
export async function loadWeeklyGoals() {
  try {
    const result = await window.storage.get(getStorageKey());
    if (result && result.value != null) {
      return JSON.parse(result.value);
    }
    return createDefaultState();
  } catch (e) {
    return createDefaultState();
  }
}

/**
 * Save weekly goal state to storage.
 * @param {object} state - Weekly goals state to persist
 */
export async function saveWeeklyGoals(state) {
  try {
    await window.storage.set(getStorageKey(), JSON.stringify(state));
  } catch (e) {
    // Silently fail — state will be recreated on next load
  }
}
