/**
 * Error Catalog — centralized map of Error_Tags to student-facing Diagnostic_Messages.
 *
 * Tags are unique across the entire catalog (flat map, not nested by topic).
 * Each message is 8–30 words, second-person, Grade 10 vocabulary.
 *
 * Topics covered:
 *   - Linear Equations
 *   - Quadratic Equations
 *   - Exponential Expressions
 *   - Exponential Equations
 *   - Inequalities
 *   - Simultaneous Equations
 */

export const ERROR_CATALOG = {
  // --- Linear Equations ---
  sign_error:
    "You made a sign mistake — check where negatives appear in each step.",
  arithmetic_error:
    "You made an arithmetic mistake with the numbers — recheck your calculations.",
  off_by_one:
    "Your answer is off by one — double-check your arithmetic in the last step.",
  general_miscalculation:
    "Your answer is not quite right — try working through each step again carefully.",

  // --- Quadratic Equations ---
  single_root_only:
    "You only found one solution — quadratics can have two roots.",

  // --- Exponential Expressions ---
  exponents_added_not_multiplied:
    "You added the exponents instead of multiplying them. Power-of-a-power means multiply.",
  exponents_multiplied_not_added:
    "You multiplied the exponents instead of adding them. Same-base multiplication means add.",

  // --- Exponential Equations ---
  exponent_add:
    "You added the exponents when you should have multiplied them.",
  exponent_multiply:
    "You multiplied the exponents when you should have added them.",

  // --- Inequalities ---
  sign_flip_forgotten:
    "You forgot to flip the inequality sign when dividing by a negative.",
  forgot_flip:
    "You forgot to flip the inequality sign when dividing by a negative number.",

  // --- Simultaneous Equations ---
  swapped_variables:
    "You swapped the x and y values — check which variable is which.",
};

/**
 * Look up a diagnostic message by Error_Tag.
 * @param {string|null|undefined} tag
 * @returns {string|null} The message, or null if tag is missing/unknown.
 */
export function getDiagnosticMessage(tag) {
  if (!tag) return null;
  return ERROR_CATALOG[tag] ?? null;
}
