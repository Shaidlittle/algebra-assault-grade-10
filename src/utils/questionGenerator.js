/**
 * Seeded Question Generator for Friend Challenge feature.
 * Produces deterministic question sets given a numeric seed.
 * Exports: createRNG, solveLinearEquation, generateQuestion, generateQuestionSet
 */

// --- Seeded PRNG (mulberry32) ---

/**
 * Create a seeded mulberry32 PRNG returning values in [0, 1).
 * @param {number} seed - Integer seed
 * @returns {function} RNG function returning [0, 1)
 */
export function createRNG(seed) {
  let s = seed | 0;
  return function () {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// --- Difficulty tier ranges ---

const DIFFICULTY_RANGES = {
  easy: { coeffMin: 1, coeffMax: 5, constMin: 1, constMax: 20 },
  medium: { coeffMin: 1, coeffMax: 8, constMin: -15, constMax: 30 },
  hard: { coeffMin: 1, coeffMax: 10, constMin: -20, constMax: 40 },
};

// --- Conceptual technique keys ---

const CONCEPTUAL_KEYS = {
  easy: 'isolating-variables',
  medium: 'expanding-brackets',
  hard: 'cross-multiplication',
};

// --- Helper functions ---

function randIntSeeded(rng, min, max) {
  return Math.floor(rng() * (max - min + 1)) + min;
}

function pickSeeded(rng, arr) {
  return arr[Math.floor(rng() * arr.length)];
}

// --- Linear Equation Solver ---

/**
 * Parse and solve a linear equation string.
 * Supports forms: "ax + b = c", "ax + b = cx + d", "a(bx + c) = d(ex + f)"
 * Returns the solution as a string like "x = 3".
 * @param {string} equationStr - e.g., "3x + 5 = 14" or "2(3x + 7) = 4(x + 11)"
 * @returns {string} Solution string e.g., "x = 3"
 */
export function solveLinearEquation(equationStr) {
  const sides = equationStr.split('=');
  if (sides.length !== 2) return null;

  const left = parseLinearSide(sides[0].trim());
  const right = parseLinearSide(sides[1].trim());

  if (left === null || right === null) return null;

  // left.coeff * x + left.constant = right.coeff * x + right.constant
  // (left.coeff - right.coeff) * x = right.constant - left.constant
  const xCoeff = left.coeff - right.coeff;
  const constVal = right.constant - left.constant;

  if (xCoeff === 0) return null; // degenerate

  const solution = constVal / xCoeff;

  if (Number.isInteger(solution)) {
    return `x = ${solution}`;
  }
  // Simple fraction
  const g = gcd(Math.abs(constVal), Math.abs(xCoeff));
  const num = constVal / g;
  const den = xCoeff / g;
  if (den < 0) {
    return `x = ${-num}/${-den}`;
  }
  return `x = ${num}/${den}`;
}

/**
 * Parse one side of an equation, handling parenthesized terms like "4(3x + 5)" and plain terms.
 * Returns { coeff, constant } representing coeff*x + constant.
 */
function parseLinearSide(expr) {
  let coeff = 0;
  let constant = 0;

  // Normalize unicode minus
  let normalized = expr.replace(/−/g, '-');

  // Try to match and expand parenthesized groups: multiplier(expression)
  // Pattern: optional sign, optional number, then (...)
  // We'll process the string by finding all parenthesized groups and plain terms
  const parenRegex = /([+-]?\d*)\(([^)]+)\)/g;
  let hasParens = false;
  let remaining = normalized;

  let match;
  while ((match = parenRegex.exec(normalized)) !== null) {
    hasParens = true;
    let multiplierStr = match[1];
    const innerExpr = match[2];

    // Parse multiplier
    let multiplier;
    if (multiplierStr === '' || multiplierStr === '+') {
      multiplier = 1;
    } else if (multiplierStr === '-') {
      multiplier = -1;
    } else {
      multiplier = parseInt(multiplierStr, 10);
    }

    // Parse inner expression
    const inner = parseLinearExpression(innerExpr);
    if (inner === null) return null;

    coeff += multiplier * inner.coeff;
    constant += multiplier * inner.constant;

    // Remove this match from remaining
    remaining = remaining.replace(match[0], '');
  }

  // Parse any remaining non-parenthesized terms
  remaining = remaining.trim();
  if (remaining) {
    // Remove leading/trailing operators that are just separators
    remaining = remaining.replace(/^\s*[+]\s*/, '').replace(/\s*[+]\s*$/, '');
    if (remaining) {
      const extra = parseLinearExpression(remaining);
      if (extra === null && remaining.replace(/[+\-\s]/g, '').length > 0) return null;
      if (extra) {
        coeff += extra.coeff;
        constant += extra.constant;
      }
    }
  }

  if (!hasParens) {
    // No parentheses found, parse as plain expression
    return parseLinearExpression(normalized);
  }

  return { coeff, constant };
}

function gcd(a, b) {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) {
    [a, b] = [b, a % b];
  }
  return a;
}

/**
 * Parse a linear expression like "3x + 5" or "-2x - 7" into { coeff, constant }.
 */
function parseLinearExpression(expr) {
  let coeff = 0;
  let constant = 0;

  // Normalize: replace '−' with '-', remove spaces around operators for easier parsing
  let normalized = expr.replace(/−/g, '-').replace(/\s+/g, '');

  // Tokenize: split into terms by + or - (keeping the sign)
  const terms = [];
  let current = '';
  for (let i = 0; i < normalized.length; i++) {
    const ch = normalized[i];
    if ((ch === '+' || ch === '-') && i > 0) {
      terms.push(current);
      current = ch;
    } else {
      current += ch;
    }
  }
  if (current) terms.push(current);

  for (const term of terms) {
    if (term.includes('x')) {
      // Extract coefficient of x
      const xPart = term.replace('x', '');
      if (xPart === '' || xPart === '+') {
        coeff += 1;
      } else if (xPart === '-') {
        coeff += -1;
      } else {
        coeff += parseFloat(xPart);
      }
    } else {
      constant += parseFloat(term);
    }
  }

  if (isNaN(coeff) || isNaN(constant)) return null;
  return { coeff, constant };
}

// --- Question Generation ---

/**
 * Generate a single linear equation question deterministically using the provided RNG.
 * @param {string} topic - Topic key (currently supports 'linear')
 * @param {'easy'|'medium'|'hard'} difficulty - Difficulty tier
 * @param {function} rng - Seeded PRNG function returning [0,1)
 * @returns {{ q: string, a: string, wrong: string[], hint: string, steps: string[], conceptual: string }}
 */
export function generateQuestion(topic, difficulty, rng) {
  const ranges = DIFFICULTY_RANGES[difficulty] || DIFFICULTY_RANGES.easy;

  if (topic === 'linear' || !topic) {
    return generateLinearQuestion(difficulty, ranges, rng);
  }

  // For other topics, generate linear-style questions with appropriate conceptual keys
  return generateLinearQuestion(difficulty, ranges, rng);
}

function generateLinearQuestion(difficulty, ranges, rng) {
  const { coeffMin, coeffMax, constMin, constMax } = ranges;

  if (difficulty === 'easy') {
    return generateEasyLinear(coeffMin, coeffMax, constMin, constMax, rng);
  } else if (difficulty === 'medium') {
    return generateMediumLinear(coeffMin, coeffMax, constMin, constMax, rng);
  } else {
    return generateHardLinear(coeffMin, coeffMax, constMin, constMax, rng);
  }
}

function generateEasyLinear(coeffMin, coeffMax, constMin, constMax, rng) {
  // Form: ax + b = c, where solution x is an integer
  const a = randIntSeeded(rng, coeffMin, coeffMax);
  const x = randIntSeeded(rng, constMin, constMax);
  const b = randIntSeeded(rng, constMin, constMax);
  const c = a * x + b;

  const equation = `${a === 1 ? '' : a}x + ${b} = ${c}`;
  const answer = `x = ${x}`;

  const distractors = generateDistractors(x, a, b, c, rng);
  const hint = `Subtract ${b} from both sides, then divide by ${a}`;
  const steps = [
    `Subtract ${b} from both sides: ${a === 1 ? '' : a}x = ${c} - ${b} = ${c - b}`,
    `Divide both sides by ${a}: x = ${c - b} / ${a} = ${x}`,
  ];

  return {
    q: equation,
    a: answer,
    wrong: distractors,
    hint,
    steps,
    conceptual: 'isolating-variables',
  };
}

function generateMediumLinear(coeffMin, coeffMax, constMin, constMax, rng) {
  // Form: ax + b = cx + d, where a != c and solution is integer
  const a = randIntSeeded(rng, coeffMin + 1, coeffMax);
  let cCoeff = randIntSeeded(rng, coeffMin, coeffMax - 1);
  if (cCoeff >= a) cCoeff = a - 1; // ensure a != c
  if (cCoeff <= 0) cCoeff = 1;

  const x = randIntSeeded(rng, constMin, constMax);
  const b = randIntSeeded(rng, constMin, constMax);
  const d = a * x + b - cCoeff * x;

  const bSign = b >= 0 ? '+' : '-';
  const dSign = d >= 0 ? '+' : '-';
  const equation = `${a}x ${bSign} ${Math.abs(b)} = ${cCoeff}x ${dSign} ${Math.abs(d)}`;
  const answer = `x = ${x}`;

  const distractors = generateDistractors(x, a - cCoeff, b, d, rng);
  const hint = 'Move x-terms to one side and constants to the other';
  const netCoeff = a - cCoeff;
  const netConst = d - b;
  const steps = [
    `Subtract ${cCoeff}x from both sides: ${netCoeff}x ${bSign} ${Math.abs(b)} = ${dSign === '+' ? '' : '-'}${Math.abs(d)}`,
    `Subtract ${b} from both sides: ${netCoeff}x = ${netConst}`,
    `Divide by ${netCoeff}: x = ${x}`,
  ];

  return {
    q: equation,
    a: answer,
    wrong: distractors,
    hint,
    steps,
    conceptual: 'expanding-brackets',
  };
}

function generateHardLinear(coeffMin, coeffMax, constMin, constMax, rng) {
  // Form: a(bx + c) = d(ex + f), ensuring integer solution
  const a = randIntSeeded(rng, 2, Math.min(coeffMax, 5));
  const b = randIntSeeded(rng, coeffMin, Math.min(coeffMax, 4));
  const e = randIntSeeded(rng, coeffMin, Math.min(coeffMax, 3));
  const dCoeff = randIntSeeded(rng, 2, Math.min(coeffMax, 4));

  // Ensure ab != de so equation isn't degenerate
  const leftXCoeff = a * b;
  const rightXCoeff = dCoeff * e;
  if (leftXCoeff === rightXCoeff) {
    // Fallback to simpler hard form
    return generateHardLinearFallback(coeffMin, coeffMax, constMin, constMax, rng);
  }

  const x = randIntSeeded(rng, constMin, constMax);
  const c = randIntSeeded(rng, constMin, constMax);
  // a(bx + c) = d(ex + f) => abx + ac = dex + df => f = (abx + ac - dex) / d
  const numerator = leftXCoeff * x + a * c - rightXCoeff * x;
  if (numerator % dCoeff !== 0) {
    return generateHardLinearFallback(coeffMin, coeffMax, constMin, constMax, rng);
  }
  const f = numerator / dCoeff;

  const cSign = c >= 0 ? '+' : '-';
  const fSign = f >= 0 ? '+' : '-';
  const equation = `${a}(${b === 1 ? '' : b}x ${cSign} ${Math.abs(c)}) = ${dCoeff}(${e === 1 ? '' : e}x ${fSign} ${Math.abs(f)})`;
  const answer = `x = ${x}`;

  const distractors = generateDistractors(x, leftXCoeff - rightXCoeff, a * c, dCoeff * f, rng);
  const hint = 'Expand both sides, then collect x-terms';
  const steps = [
    `Expand left: ${leftXCoeff}x ${a * c >= 0 ? '+' : '-'} ${Math.abs(a * c)}`,
    `Expand right: ${rightXCoeff}x ${dCoeff * f >= 0 ? '+' : '-'} ${Math.abs(dCoeff * f)}`,
    `Collect x-terms: ${leftXCoeff - rightXCoeff}x = ${dCoeff * f - a * c}`,
    `Divide: x = ${x}`,
  ];

  return {
    q: equation,
    a: answer,
    wrong: distractors,
    hint,
    steps,
    conceptual: 'cross-multiplication',
  };
}

function generateHardLinearFallback(coeffMin, coeffMax, constMin, constMax, rng) {
  // Simpler hard form: ax + b = c with larger ranges
  const a = randIntSeeded(rng, 2, coeffMax);
  const x = randIntSeeded(rng, constMin, constMax);
  const b = randIntSeeded(rng, constMin, constMax);
  const c = a * x + b;

  const bSign = b >= 0 ? '+' : '-';
  const equation = `${a}x ${bSign} ${Math.abs(b)} = ${c}`;
  const answer = `x = ${x}`;

  const distractors = generateDistractors(x, a, b, c, rng);
  const hint = `Subtract ${b >= 0 ? b : `(${b})`} from both sides, then divide by ${a}`;
  const steps = [
    `Subtract ${b} from both sides: ${a}x = ${c - b}`,
    `Divide by ${a}: x = ${x}`,
  ];

  return {
    q: equation,
    a: answer,
    wrong: distractors,
    hint,
    steps,
    conceptual: 'isolating-variables',
  };
}

// --- Distractor Generation ---

/**
 * Generate 3 plausible distractor answers using common mistake strategies.
 * Strategies: sign error, operation error, coefficient error, random offset.
 */
function generateDistractors(correctX, a, b, c, rng) {
  const distractors = new Set();

  // Strategy 1: Sign error — negate the correct answer
  const signError = -correctX;
  if (signError !== correctX) {
    distractors.add(`x = ${signError}`);
  }

  // Strategy 2: Operation error — add instead of subtract (or vice versa)
  const opError = (c + b) / a;
  if (Number.isInteger(opError) && opError !== correctX) {
    distractors.add(`x = ${opError}`);
  }

  // Strategy 3: Coefficient error — forget to divide by leading coefficient
  const coeffError = c - b;
  if (coeffError !== correctX) {
    distractors.add(`x = ${coeffError}`);
  }

  // Strategy 4: Random offset
  const offsets = [1, -1, 2, -2, 3, -3];
  for (const offset of offsets) {
    if (distractors.size >= 3) break;
    const val = correctX + offset;
    if (val !== correctX && !distractors.has(`x = ${val}`)) {
      distractors.add(`x = ${val}`);
    }
  }

  // Ensure we have exactly 3
  let attempts = 0;
  while (distractors.size < 3 && attempts < 20) {
    attempts++;
    const randomOffset = randIntSeeded(rng, -10, 10);
    const val = correctX + randomOffset;
    if (val !== correctX && !distractors.has(`x = ${val}`)) {
      distractors.add(`x = ${val}`);
    }
  }

  return Array.from(distractors).slice(0, 3);
}

// --- Question Set Generation ---

/**
 * Generate N unique questions for a session using a seed, with retry logic for duplicates.
 * @param {number} seed - Numeric seed for PRNG
 * @param {string} topic - Topic key
 * @param {'easy'|'medium'|'hard'} difficulty - Difficulty tier
 * @param {number} count - Number of questions to generate
 * @returns {Array} Array of question objects
 */
export function generateQuestionSet(seed, topic, difficulty, count) {
  const rng = createRNG(seed);
  const questions = [];
  const seenEquations = new Set();
  let retries = 0;
  const maxRetries = count * 10; // Allow generous retries

  while (questions.length < count && retries < maxRetries) {
    const question = generateQuestion(topic, difficulty, rng);

    if (question && !seenEquations.has(question.q)) {
      seenEquations.add(question.q);
      questions.push(question);
    } else {
      retries++;
    }
  }

  return questions;
}
