/**
 * Reminder Cards — maps each topic identifier to its key algebraic rule.
 *
 * Each rule is ≤15 words and summarizes the single most important
 * algebraic principle for that topic, matching the Field Manual structure.
 *
 * Topics:
 *   - linear: Linear Equations
 *   - quadratic: Quadratic Equations
 *   - expExpr: Exponential Expressions
 *   - expEqn: Exponential Equations
 *   - inequality: Inequalities
 *   - simultaneous: Simultaneous Equations
 */

export const REMINDER_CARDS = {
  linear: "Whatever you do to one side, do to the other",
  quadratic: "Standard form → Factor → Zero product",
  expExpr: "Same base: multiply → add exponents, divide → subtract exponents",
  expEqn: "Make bases equal, then set exponents equal",
  inequality: "Multiply or divide by negative → FLIP the sign",
  simultaneous: "Eliminate one variable by adding or subtracting equations",
};
