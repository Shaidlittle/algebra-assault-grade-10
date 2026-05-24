/**
 * Conceptual Explanations utility module.
 *
 * Maps algebraic techniques to "Why this works" explanations that describe
 * the underlying mathematical principle, not just the procedural steps.
 *
 * All functions are pure — no side effects, no storage access.
 */

/**
 * Supported algebraic techniques with conceptual explanations.
 * Each explanation describes WHY the technique works using analogies where helpful.
 */
export const TECHNIQUES = {
  'isolating-variables':
    'We subtract/add from both sides to keep the equation balanced — like removing the same weight from both sides of a scale',
  'expanding-brackets':
    'Multiplying each term inside the bracket distributes the multiplication — like handing out items to everyone in a group',
  'cross-multiplication':
    'Cross-multiplying eliminates fractions by multiplying both sides by both denominators',
  'factoring':
    'Factoring rewrites an expression as a product — if a product equals zero, at least one factor must be zero',
  'completing-the-square':
    'Completing the square rewrites the quadratic in a form where you can take the square root of both sides',
};

/**
 * Get the conceptual explanation for a given algebraic technique.
 *
 * @param {string} technique - Technique key (e.g., 'isolating-variables')
 * @returns {string|null} Explanation text, or null if technique not found
 */
export function getConceptualExplanation(technique) {
  return TECHNIQUES[technique] || null;
}

/**
 * Map a question object to its primary algebraic technique.
 *
 * Inspects the question's steps array (joined as a single string) to identify
 * keywords that indicate which technique is being used.
 *
 * @param {object} question - Question object with q, steps, hint fields
 * @returns {string} Technique key
 */
export function identifyTechnique(question) {
  const stepsText = (question.steps || []).join(' ').toLowerCase();

  if (stepsText.includes('cross-multiply') || stepsText.includes('cross multiply')) {
    return 'cross-multiplication';
  }

  if (stepsText.includes('complete the square') || stepsText.includes('completing the square')) {
    return 'completing-the-square';
  }

  if (stepsText.includes('factor')) {
    return 'factoring';
  }

  if (stepsText.includes('expand') || stepsText.includes('bracket')) {
    return 'expanding-brackets';
  }

  if (
    (stepsText.includes('subtract') || stepsText.includes('add')) &&
    stepsText.includes('both sides')
  ) {
    return 'isolating-variables';
  }

  return 'isolating-variables';
}
