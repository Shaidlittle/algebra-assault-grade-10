/**
 * Hint Cost Utility — defines the HP/point cost for each hint stage
 * across all game modes, and formats hint button labels.
 *
 * Game modes: 'playing', 'dailyChallenge', 'exam', 'replayGate'
 * Hint stages: 0 (conceptual), 1 (specific), 2 (full solution)
 */

/**
 * Cost table keyed by game mode, each entry is an array of
 * { amount, unit } objects indexed by hint stage.
 */
const COST_TABLE = {
  playing: [
    { amount: 5, unit: "HP" },
    { amount: 5, unit: "HP" },
    { amount: 10, unit: "HP" },
  ],
  dailyChallenge: [
    { amount: 5, unit: "HP" },
    { amount: 5, unit: "HP" },
    { amount: 10, unit: "HP" },
  ],
  exam: [
    { amount: 25, unit: "pts" },
    { amount: 25, unit: "pts" },
    { amount: 50, unit: "pts" },
  ],
  replayGate: [
    { amount: 0, unit: null },
    { amount: 0, unit: null },
    { amount: 0, unit: null },
  ],
};

/**
 * Returns the cost amount and unit for a given game mode and hint stage.
 *
 * @param {string} gameMode - One of 'playing', 'dailyChallenge', 'exam', 'replayGate'
 * @param {number} hintStage - 0 (conceptual), 1 (specific), or 2 (full solution)
 * @returns {{ amount: number, unit: string|null }} The cost to deduct and its unit
 */
export function getHintCost(gameMode, hintStage) {
  const modeCosts = COST_TABLE[gameMode];
  if (!modeCosts) {
    return { amount: 0, unit: null };
  }
  return modeCosts[hintStage] || { amount: 0, unit: null };
}

/**
 * Button label text for each hint stage.
 */
const STAGE_LABELS = ["Get Hint", "Next Hint", "Show Solution"];

/**
 * Returns the formatted button label for a hint request button,
 * including the cost indicator when applicable.
 *
 * @param {string} gameMode - One of 'playing', 'dailyChallenge', 'exam', 'replayGate'
 * @param {number} hintStage - 0 (conceptual), 1 (specific), or 2 (full solution)
 * @returns {string} Button text, e.g. "Get Hint (-5 HP)" or "Get Hint"
 */
export function formatHintButtonLabel(gameMode, hintStage) {
  const label = STAGE_LABELS[hintStage] || "Get Hint";
  const { amount, unit } = getHintCost(gameMode, hintStage);

  if (amount === 0 || unit === null) {
    return label;
  }

  return `${label} (-${amount} ${unit})`;
}
