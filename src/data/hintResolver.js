/**
 * Hint Resolver — normalizes question hint data into a consistent 3-level structure.
 *
 * The progressive hint system expects hints as:
 *   [0] conceptual nudge (string, ≤60 chars)
 *   [1] specific hint (string, ≤80 chars)
 *   [2] full worked solution (array of step strings)
 *
 * This utility handles three cases:
 *   1. Question already has a valid `hints` array with 3 entries → return as-is
 *   2. Question has legacy `hint` + `steps` but no `hints` → generate structure
 *   3. Question has neither → return null (ineligible for intermediate hints)
 *
 * Malformed hints arrays (fewer than 3 entries, null entries) degrade gracefully
 * to returning only the full solution.
 */

/**
 * Checks whether a hints array is well-formed (3 valid entries).
 * @param {any[]} hints
 * @returns {boolean}
 */
function isValidHintsArray(hints) {
  if (!Array.isArray(hints) || hints.length < 3) return false;

  const [conceptual, specific, solution] = hints;

  if (typeof conceptual !== 'string' || conceptual.length === 0) return false;
  if (typeof specific !== 'string' || specific.length === 0) return false;
  if (!Array.isArray(solution) || solution.length === 0) return false;

  return true;
}

/**
 * Generates a conceptual nudge from the existing hint string.
 * The nudge points toward the correct operation without revealing specific numbers.
 * Constrained to ≤60 characters.
 *
 * @param {string} hint - The existing hint string (specific guidance)
 * @returns {string} A conceptual nudge ≤60 chars
 */
function generateConceptualNudge(hint) {
  const lower = hint.toLowerCase();

  // Map common operations to conceptual nudges
  if (lower.includes('subtract')) {
    return 'What operation undoes addition?';
  }
  if (lower.includes('add')) {
    return 'What operation undoes subtraction?';
  }
  if (lower.includes('divide')) {
    return 'What operation undoes multiplication?';
  }
  if (lower.includes('multiply') || lower.includes('cross-multiply')) {
    return 'What operation undoes division?';
  }
  if (lower.includes('expand')) {
    return 'Can you remove the brackets first?';
  }
  if (lower.includes('factor')) {
    return 'Can you write this as a product of two factors?';
  }
  if (lower.includes('square root') || lower.includes('root')) {
    return 'What operation undoes squaring?';
  }
  if (lower.includes('base') || lower.includes('exponent')) {
    return 'Can you make the bases the same?';
  }
  if (lower.includes('eliminate') || lower.includes('simultaneous')) {
    return 'Can you remove one variable first?';
  }
  if (lower.includes('flip') || lower.includes('inequality')) {
    return 'Does the direction of the sign change?';
  }
  if (lower.includes('move')) {
    return 'Which terms should be on the same side?';
  }

  // Generic fallback — always ≤60 chars
  return 'What is the first operation you should do?';
}

/**
 * Resolves a question's hint data into a normalized 3-level hints structure.
 *
 * @param {Object} question - A question object with shape { q, a, wrong, hint?, steps?, hints? }
 * @returns {Array|null} A 3-element array [conceptualNudge, specificHint, fullSolution] or null
 */
export function resolveHints(question) {
  if (!question) return null;

  // Case 1: Question has a well-formed hints array → return directly
  if (question.hints && isValidHintsArray(question.hints)) {
    return question.hints;
  }

  // Case 4: Malformed hints array — degrade to full solution only
  if (question.hints && Array.isArray(question.hints)) {
    // Has a hints array but it's malformed (fewer than 3 entries or null entries)
    // Try to extract the full solution from index 2 (must be a valid array), or fall back to steps
    const hintsEntry = question.hints[2];
    const solution = (Array.isArray(hintsEntry) && hintsEntry.length > 0)
      ? hintsEntry
      : (Array.isArray(question.steps) && question.steps.length > 0 ? question.steps : null);

    if (solution) {
      return [null, null, solution];
    }
    return null;
  }

  // Case 2: Has legacy hint + steps but no hints array → generate structure
  if (question.hint && typeof question.hint === 'string' &&
      question.steps && Array.isArray(question.steps) && question.steps.length > 0) {
    const conceptualNudge = generateConceptualNudge(question.hint);
    return [conceptualNudge, question.hint, question.steps];
  }

  // Case 3: Has neither → ineligible for intermediate hints
  return null;
}
