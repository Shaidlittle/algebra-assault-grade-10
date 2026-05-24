import { QUESTIONS } from './questions.js';

// Constants
export const MAX_GENERATION_ATTEMPTS = 10;
export const DIFFICULTY_RANGES = {
  easy: { min: 1, max: 9, integerOnly: true, positiveOnly: true },
  medium: { min: -99, max: 99, integerOnly: true, excludeRange: [-9, 9] },
  hard: { denominators: [2, 3, 4, 5, 6], minOps: 3 }
};

// --- Utility helpers ---

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randEasy() {
  return randInt(1, 9);
}

function randMedium() {
  // integers in [-99, -10] ∪ [10, 99]
  const sign = Math.random() < 0.5 ? -1 : 1;
  return sign * randInt(10, 99);
}

function randHardDenom() {
  const denoms = DIFFICULTY_RANGES.hard.denominators;
  return denoms[randInt(0, denoms.length - 1)];
}

function gcd(a, b) {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) { [a, b] = [b, a % b]; }
  return a;
}

function formatFraction(num, den) {
  if (den === 1) return `${num}`;
  if (num < 0 && den < 0) { num = -num; den = -den; }
  if (den < 0) { num = -num; den = -den; }
  const g = gcd(Math.abs(num), den);
  num = num / g;
  den = den / g;
  if (den === 1) return `${num}`;
  if (num === 1 && den === 2) return '½';
  if (num === -1 && den === 2) return '−½';
  if (num === 1 && den === 3) return '⅓';
  if (num === 2 && den === 3) return '⅔';
  return `${num}/${den}`;
}

function formatAnswer(value) {
  if (Number.isInteger(value)) return `${value}`;
  // Check common fractions
  const fracs = [[1,2,'½'],[1,3,'⅓'],[2,3,'⅔'],[1,4,'¼'],[3,4,'¾'],[1,5,'⅕'],[2,5,'⅖'],[3,5,'⅗'],[4,5,'⅘'],[1,6,'⅙'],[5,6,'⅚']];
  for (const [n, d, sym] of fracs) {
    if (Math.abs(value - n/d) < 1e-10) return sym;
    if (Math.abs(value + n/d) < 1e-10) return `−${sym}`;
  }
  // Try to express as fraction
  for (let d = 2; d <= 6; d++) {
    const n = Math.round(value * d);
    if (Math.abs(n/d - value) < 1e-10) {
      return formatFraction(n, d);
    }
  }
  // Fallback: round to reasonable precision
  if (Math.abs(value - Math.round(value * 2) / 2) < 1e-10) {
    return `${Math.round(value * 10) / 10}`;
  }
  return `${Math.round(value * 100) / 100}`;
}

function formatCoeff(c, isFirst) {
  if (isFirst) {
    if (c === 1) return '';
    if (c === -1) return '−';
    return `${c}`;
  }
  if (c === 1) return ' + ';
  if (c === -1) return ' − ';
  if (c > 0) return ` + ${c}`;
  return ` − ${Math.abs(c)}`;
}

function formatTerm(coeff, variable, isFirst) {
  if (coeff === 0) return '';
  const sign = isFirst ? '' : (coeff > 0 ? ' + ' : ' − ');
  const absCoeff = Math.abs(coeff);
  const c = isFirst ? (coeff === 1 ? '' : coeff === -1 ? '−' : `${coeff}`) : (absCoeff === 1 ? '' : `${absCoeff}`);
  return `${sign}${c}${variable}`;
}

// --- Linear Equation Generator ---

export function generateLinear(difficulty) {
  try {
    if (difficulty === 'easy') {
      // ax + b = c, where a,b are positive integers 1-9, answer x is 1-9
      const a = randInt(1, 6);
      const x = randInt(1, 9);
      const b = randInt(1, 9);
      const c = a * x + b;
      if (c > 60) return null;
      const q = `${a === 1 ? '' : a}x + ${b} = ${c}`;
      const answer = x;
      return {
        q,
        a: `x = ${answer}`,
        wrong: generateDistractors(`x = ${answer}`, 'linear', difficulty),
        hint: `Subtract ${b}, then divide by ${a}`,
        steps: [
          `Subtract ${b} from both sides → ${a === 1 ? '' : a}x = ${c - b}`,
          `Divide both sides by ${a} → x = ${answer}`
        ]
      };
    }

    if (difficulty === 'medium') {
      // ax + b = cx + d, where all visible numbers stay within ±50
      const a = randInt(2, 8) * (Math.random() < 0.3 ? -1 : 1);
      const c = randInt(2, 8) * (Math.random() < 0.3 ? -1 : 1);
      if (a === c) return null;
      const x = randInt(-6, 6);
      if (x === 0) return null;
      const b = randInt(-12, 12);
      if (b === 0) return null;
      const d = a * x + b - c * x;
      // Reject if any number exceeds 50
      if (Math.abs(d) > 50 || Math.abs(a) > 50 || Math.abs(b) > 50) return null;
      const lhs = `${a}x ${b >= 0 ? '+' : '−'} ${Math.abs(b)}`;
      const rhs = `${c}x ${d >= 0 ? '+' : '−'} ${Math.abs(d)}`;
      return {
        q: `${lhs} = ${rhs}`,
        a: `x = ${x}`,
        wrong: generateDistractors(`x = ${x}`, 'linear', difficulty),
        hint: 'Move x-terms to one side, constants to the other',
        steps: [
          `Subtract ${c}x from both sides → ${a - c}x ${b >= 0 ? '+' : '−'} ${Math.abs(b)} = ${d}`,
          `Subtract ${b} from both sides → ${a - c}x = ${d - b}`,
          `Divide by ${a - c} → x = ${x}`
        ]
      };
    }

    if (difficulty === 'hard') {
      // Fraction-based: (ax+b)/d1 = (cx+e)/d2
      const d1 = randHardDenom();
      const d2 = randHardDenom();
      if (d1 === d2) return null;
      const a = randInt(1, 4);
      const c = randInt(1, 4);
      const x = randInt(-9, 9);
      if (x === 0) return null;
      if (a * d2 === c * d1) return null; // would make equation degenerate
      const b = randInt(-5, 5);
      const e_val = ((a * x + b) * d2 - c * x * d1) / d1;
      if (!Number.isInteger(e_val)) return null;
      const q = `(${a === 1 ? '' : a}x${b >= 0 ? '+' : ''}${b})/${d1} = (${c === 1 ? '' : c}x${e_val >= 0 ? '+' : ''}${e_val})/${d2}`;
      return {
        q,
        a: `x = ${x}`,
        wrong: generateDistractors(`x = ${x}`, 'linear', difficulty),
        hint: `Cross-multiply: ${d2}(${a === 1 ? '' : a}x${b >= 0 ? '+' : ''}${b}) = ${d1}(${c === 1 ? '' : c}x${e_val >= 0 ? '+' : ''}${e_val})`,
        steps: [
          `Cross-multiply: ${d2}(${a === 1 ? '' : a}x${b >= 0 ? '+' : ''}${b}) = ${d1}(${c === 1 ? '' : c}x${e_val >= 0 ? '+' : ''}${e_val})`,
          `Expand: ${a*d2}x ${b*d2 >= 0 ? '+' : '−'} ${Math.abs(b*d2)} = ${c*d1}x ${e_val*d1 >= 0 ? '+' : '−'} ${Math.abs(e_val*d1)}`,
          `Collect x terms: ${a*d2 - c*d1}x = ${e_val*d1 - b*d2}`,
          `Divide → x = ${x}`
        ]
      };
    }
  } catch (e) {
    return null;
  }
  return null;
}

// --- Quadratic Equation Generator ---

export function generateQuadratic(difficulty) {
  try {
    if (difficulty === 'easy') {
      // x² = n² (plus-minus) or (x-a)(x+b) = 0
      const type = Math.random() < 0.5 ? 'square' : 'factored';
      if (type === 'square') {
        const n = randEasy();
        const nSq = n * n;
        const q = `x² = ${nSq}`;
        return {
          q,
          a: `x = ±${n}`,
          wrong: generateDistractors(`x = ±${n}`, 'quadratic', difficulty),
          hint: `Square root both sides — remember ±`,
          steps: [
            `Take square root of both sides → x = ±√${nSq}`,
            `Simplify → x = ±${n}`
          ]
        };
      } else {
        const a = randInt(1, 9);
        const b = randInt(1, 9);
        if (a === b) return null;
        const signA = Math.random() < 0.5 ? 1 : -1;
        const signB = signA === 1 ? -1 : 1; // ensure different roots
        const r1 = signA * a;
        const r2 = signB * b;
        // (x - r1)(x - r2) = 0
        const q = `(x ${r1 >= 0 ? '−' : '+'} ${Math.abs(r1)})(x ${r2 >= 0 ? '−' : '+'} ${Math.abs(r2)}) = 0`;
        const sorted = [r1, r2].sort((a, b) => a - b);
        return {
          q,
          a: `x = ${sorted[0]} or ${sorted[1]}`,
          wrong: generateDistractors(`x = ${sorted[0]} or ${sorted[1]}`, 'quadratic', difficulty),
          hint: 'Set each bracket to zero',
          steps: [
            `Set x ${r1 >= 0 ? '−' : '+'} ${Math.abs(r1)} = 0 → x = ${r1}`,
            `Set x ${r2 >= 0 ? '−' : '+'} ${Math.abs(r2)} = 0 → x = ${r2}`
          ]
        };
      }
    }

    if (difficulty === 'medium') {
      // x² + bx + c = 0 with integer roots
      const r1 = randInt(-9, 9);
      const r2 = randInt(-9, 9);
      if (r1 === 0 || r2 === 0) return null;
      if (r1 === r2) return null;
      // (x - r1)(x - r2) = x² - (r1+r2)x + r1*r2
      const b = -(r1 + r2);
      const c = r1 * r2;
      const bStr = b === 0 ? '' : (b === 1 ? 'x' : b === -1 ? '−x' : `${b > 0 ? '' : '−'}${Math.abs(b) === 1 ? '' : Math.abs(b)}x`);
      let q = `x²`;
      if (b !== 0) q += ` ${b > 0 ? '+' : '−'} ${Math.abs(b) === 1 ? '' : Math.abs(b)}x`;
      if (c !== 0) q += ` ${c > 0 ? '+' : '−'} ${Math.abs(c)}`;
      q += ' = 0';
      const sorted = [r1, r2].sort((a, b) => a - b);
      return {
        q,
        a: `x = ${sorted[0]} or ${sorted[1]}`,
        wrong: generateDistractors(`x = ${sorted[0]} or ${sorted[1]}`, 'quadratic', difficulty),
        hint: `Two numbers: ×=${c}, +=${b}`,
        steps: [
          `Find two numbers that multiply to ${c} and add to ${b}: ${-r1} and ${-r2}`,
          `Factor: (x ${r1 >= 0 ? '−' : '+'} ${Math.abs(r1)})(x ${r2 >= 0 ? '−' : '+'} ${Math.abs(r2)}) = 0`,
          `Solve: x = ${sorted[0]} or x = ${sorted[1]}`
        ]
      };
    }

    if (difficulty === 'hard') {
      // ax² + bx + c = 0 with a > 1, or x² = k requiring ± answer
      const type = Math.random() < 0.5 ? 'leading' : 'plusminus';
      if (type === 'plusminus') {
        const a = randInt(2, 5);
        const n = randInt(1, 6);
        const nSq = n * n;
        // ax² = a*n²  =>  ax² - a*n² = 0  or  ax² = a*n²
        const q = `${a}x² = ${a * nSq}`;
        return {
          q,
          a: `x = ±${n}`,
          wrong: generateDistractors(`x = ±${n}`, 'quadratic', difficulty),
          hint: `Divide by ${a} first, then square root`,
          steps: [
            `Divide by ${a} → x² = ${nSq}`,
            `Take square root → x = ±${n}`,
            `Check: ${a}(${nSq}) = ${a * nSq} ✓`
          ]
        };
      } else {
        // (ax + b)(x + c) = 0 => ax² + (ac+b)x + bc = 0
        const a = randInt(2, 4);
        const r1Num = randInt(-5, 5); // numerator for first root: -b/a
        if (r1Num === 0) return null;
        const r2 = randInt(-6, 6);
        if (r2 === 0) return null;
        // roots are -r1Num/a and r2 (but we set up as (ax - (-r1Num))(x - r2))
        // Actually: (ax + r1Num)(x - r2) = 0 => roots are -r1Num/a and r2
        const bCoeff = a * (-r2) + r1Num;
        const cCoeff = r1Num * (-r2);
        let q = `${a}x²`;
        if (bCoeff !== 0) q += ` ${bCoeff > 0 ? '+' : '−'} ${Math.abs(bCoeff) === 1 ? '' : Math.abs(bCoeff)}x`;
        if (cCoeff !== 0) q += ` ${cCoeff > 0 ? '+' : '−'} ${Math.abs(cCoeff)}`;
        q += ' = 0';
        const root1 = -r1Num / a;
        const root2 = r2;
        if (root1 === root2) return null;
        const sorted = [root1, root2].sort((x, y) => x - y);
        const ans = `x = ${formatAnswer(sorted[0])} or ${formatAnswer(sorted[1])}`;
        return {
          q,
          a: ans,
          wrong: generateDistractors(ans, 'quadratic', difficulty),
          hint: `Factor: (${a}x${r1Num >= 0 ? '+' : '−'}${Math.abs(r1Num)})(x${r2 >= 0 ? '−' : '+'}${Math.abs(r2)}) = 0`,
          steps: [
            `Factor: (${a}x ${r1Num >= 0 ? '+' : '−'} ${Math.abs(r1Num)})(x ${r2 >= 0 ? '−' : '+'} ${Math.abs(r2)}) = 0`,
            `Set ${a}x ${r1Num >= 0 ? '+' : '−'} ${Math.abs(r1Num)} = 0 → x = ${formatAnswer(-r1Num/a)}`,
            `Set x ${r2 >= 0 ? '−' : '+'} ${Math.abs(r2)} = 0 → x = ${r2}`
          ]
        };
      }
    }
  } catch (e) {
    return null;
  }
  return null;
}

// --- Exponential Expression Generator ---

export function generateExpExpr(difficulty) {
  try {
    if (difficulty === 'easy') {
      // x^a * x^b, x^a / x^b, or (x^a)^b
      const type = randInt(0, 2);
      if (type === 0) {
        // multiplication: x^a × x^b = x^(a+b)
        const a = randEasy();
        const b = randEasy();
        const result = a + b;
        return {
          q: `x${toSuperscript(a)} × x${toSuperscript(b)}`,
          a: `x${toSuperscript(result)}`,
          wrong: generateDistractors(`x${toSuperscript(result)}`, 'expExpr', difficulty, { subtype: 'same_base_multiply', expA: a, expB: b }),
          hint: 'Multiplying same base → ADD exponents',
          steps: [
            'Same base multiplication: add exponents',
            `${a} + ${b} = ${result} → x${toSuperscript(result)}`
          ]
        };
      } else if (type === 1) {
        // division: x^a ÷ x^b = x^(a-b), ensure a > b
        const b = randInt(1, 5);
        const a = b + randInt(1, 5);
        const result = a - b;
        return {
          q: `x${toSuperscript(a)} ÷ x${toSuperscript(b)}`,
          a: `x${toSuperscript(result)}`,
          wrong: generateDistractors(`x${toSuperscript(result)}`, 'expExpr', difficulty),
          hint: 'Dividing same base → SUBTRACT exponents',
          steps: [
            'Same base division: subtract exponents',
            `${a} − ${b} = ${result} → x${toSuperscript(result)}`
          ]
        };
      } else {
        // power of power: (x^a)^b = x^(a*b)
        const a = randInt(2, 4);
        const b = randInt(2, 4);
        const result = a * b;
        return {
          q: `(x${toSuperscript(a)})${toSuperscript(b)}`,
          a: `x${toSuperscript(result)}`,
          wrong: generateDistractors(`x${toSuperscript(result)}`, 'expExpr', difficulty, { subtype: 'power_of_power', expA: a, expB: b }),
          hint: 'Power of a power → MULTIPLY exponents',
          steps: [
            'Power of a power: multiply exponents',
            `${a} × ${b} = ${result} → x${toSuperscript(result)}`
          ]
        };
      }
    }

    if (difficulty === 'medium') {
      // (ax^m)^n = a^n * x^(mn)
      const a = randInt(2, 5);
      const m = randInt(2, 4);
      const n = randInt(2, 3);
      const coeff = Math.pow(a, n);
      const exp = m * n;
      return {
        q: `(${a}x${toSuperscript(m)})${toSuperscript(n)}`,
        a: `${coeff}x${toSuperscript(exp)}`,
        wrong: generateDistractors(`${coeff}x${toSuperscript(exp)}`, 'expExpr', difficulty, { subtype: 'power_of_power', expA: m, expB: n, coeff }),
        hint: `Raise BOTH the ${a} and the x${toSuperscript(m)} to the power of ${n}`,
        steps: [
          `Raise the coefficient: ${a}${toSuperscript(n)} = ${coeff}`,
          `Multiply exponent: ${m} × ${n} = ${exp} → x${toSuperscript(exp)}`,
          `Result: ${coeff}x${toSuperscript(exp)}`
        ]
      };
    }

    if (difficulty === 'hard') {
      // (ax^m)^n × bx^p
      const a = randInt(2, 3);
      const m = randInt(2, 3);
      const n = randInt(2, 3);
      const b = randInt(2, 4);
      const p = randInt(1, 3);
      const coeff1 = Math.pow(a, n);
      const exp1 = m * n;
      const finalCoeff = coeff1 * b;
      const finalExp = exp1 + p;
      return {
        q: `(${a}x${toSuperscript(m)})${toSuperscript(n)} × ${b}x${toSuperscript(p)}`,
        a: `${finalCoeff}x${toSuperscript(finalExp)}`,
        wrong: generateDistractors(`${finalCoeff}x${toSuperscript(finalExp)}`, 'expExpr', difficulty, { subtype: 'power_of_power', expA: m, expB: n, coeff: finalCoeff }),
        hint: `(${a}x${toSuperscript(m)})${toSuperscript(n)} = ${coeff1}x${toSuperscript(exp1)}, then × ${b}x${toSuperscript(p)}`,
        steps: [
          `Evaluate (${a}x${toSuperscript(m)})${toSuperscript(n)} = ${coeff1}x${toSuperscript(exp1)}`,
          `Multiply: ${coeff1} × ${b} = ${finalCoeff}`,
          `Add exponents: ${exp1} + ${p} = ${finalExp}`,
          `Result: ${finalCoeff}x${toSuperscript(finalExp)}`
        ]
      };
    }
  } catch (e) {
    return null;
  }
  return null;
}

// --- Exponential Equation Generator ---

export function generateExpEqn(difficulty) {
  try {
    if (difficulty === 'easy') {
      // base^x = base^n => x = n
      const bases = [2, 3, 4, 5, 10];
      const base = bases[randInt(0, bases.length - 1)];
      const exp = randInt(2, 5);
      const result = Math.pow(base, exp);
      return {
        q: `${base}ˣ = ${result}`,
        a: `x = ${exp}`,
        wrong: generateDistractors(`x = ${exp}`, 'expEqn', difficulty),
        hint: `${result} = ${base}${toSuperscript(exp)}`,
        steps: [
          `Rewrite ${result} as a power of ${base}: ${result} = ${base}${toSuperscript(exp)}`,
          `So ${base}ˣ = ${base}${toSuperscript(exp)} → x = ${exp}`
        ]
      };
    }

    if (difficulty === 'medium') {
      // base^(x+k) = base^n => x+k = n => x = n-k
      const bases = [2, 3, 5];
      const base = bases[randInt(0, bases.length - 1)];
      const n = randInt(2, 5);
      const k = randInt(-3, 3);
      if (k === 0) return null;
      const x = n - k;
      const result = Math.pow(base, n);
      const exprStr = k > 0 ? `x+${k}` : `x−${Math.abs(k)}`;
      return {
        q: `${base}^(${exprStr}) = ${result}`,
        a: `x = ${x}`,
        wrong: generateDistractors(`x = ${x}`, 'expEqn', difficulty),
        hint: `${result} = ${base}${toSuperscript(n)}, so ${exprStr} = ${n}`,
        steps: [
          `Rewrite ${result} as ${base}${toSuperscript(n)}`,
          `Set exponents equal: ${exprStr} = ${n}`,
          `Solve: x = ${x}`
        ]
      };
    }

    if (difficulty === 'hard') {
      // base1^x = base2 where both can be expressed as powers of a common base
      // e.g., 9^x = 27 => 3^(2x) = 3^3 => 2x = 3 => x = 1.5
      const commonBases = [2, 3, 5];
      const cb = commonBases[randInt(0, commonBases.length - 1)];
      const p1 = randInt(2, 3); // power for left base
      const p2 = randInt(2, 4); // power for right result
      if (p2 % p1 === 0) {
        // integer answer - still valid for hard
      }
      const leftBase = Math.pow(cb, p1);
      const rightResult = Math.pow(cb, p2);
      // leftBase^x = rightResult => cb^(p1*x) = cb^p2 => p1*x = p2 => x = p2/p1
      const x = p2 / p1;
      return {
        q: `${leftBase}ˣ = ${rightResult}`,
        a: `x = ${formatAnswer(x)}`,
        wrong: generateDistractors(`x = ${formatAnswer(x)}`, 'expEqn', difficulty),
        hint: `Rewrite as ${cb}^(${p1}x) = ${cb}${toSuperscript(p2)}`,
        steps: [
          `Rewrite ${leftBase} as ${cb}${toSuperscript(p1)}: (${cb}${toSuperscript(p1)})ˣ = ${cb}^(${p1}x)`,
          `Rewrite ${rightResult} as ${cb}${toSuperscript(p2)}`,
          `Set exponents equal: ${p1}x = ${p2}`,
          `Solve: x = ${formatAnswer(x)}`
        ]
      };
    }
  } catch (e) {
    return null;
  }
  return null;
}

// --- Inequality Generator ---

export function generateInequality(difficulty) {
  try {
    const signs = ['>', '<', '≥', '≤'];

    if (difficulty === 'easy') {
      // ax + b > c or ax < c (simple one-step or two-step)
      const a = randEasy();
      const x = randEasy();
      const b = randEasy();
      const c = a * x + b;
      const sign = signs[randInt(0, 3)];
      const q = `${a === 1 ? '' : a}x + ${b} ${sign} ${c}`;
      return {
        q,
        a: `x ${sign} ${x}`,
        wrong: generateDistractors(`x ${sign} ${x}`, 'inequality', difficulty),
        hint: `Subtract ${b}, then divide by ${a}`,
        steps: [
          `Subtract ${b} from both sides → ${a === 1 ? '' : a}x ${sign} ${c - b}`,
          `Divide by ${a} (positive) → x ${sign} ${x}`
        ]
      };
    }

    if (difficulty === 'medium') {
      // Include sign flip: -ax > b => x < -b/a
      const useNeg = Math.random() < 0.5;
      if (useNeg) {
        const a = randInt(2, 9);
        const x = randInt(-9, -1);
        const rhs = -a * x;
        const sign = signs[randInt(0, 3)];
        const flipped = flipSign(sign);
        const q = `−${a}x ${sign} ${rhs}`;
        return {
          q,
          a: `x ${flipped} ${x}`,
          wrong: generateDistractors(`x ${flipped} ${x}`, 'inequality', difficulty),
          hint: `Divide by −${a} → FLIP the sign!`,
          steps: [
            `Divide both sides by −${a}`,
            `FLIP the sign (dividing by negative)`,
            `x ${flipped} ${x}`
          ]
        };
      } else {
        const a = randInt(2, 9);
        const x = randInt(1, 9);
        const b = randInt(1, 20);
        const c = a * x + b;
        const sign = signs[randInt(0, 3)];
        const q = `${a}x + ${b} ${sign} ${c}`;
        return {
          q,
          a: `x ${sign} ${x}`,
          wrong: generateDistractors(`x ${sign} ${x}`, 'inequality', difficulty),
          hint: `Subtract ${b}, divide by ${a}`,
          steps: [
            `Subtract ${b} from both sides → ${a}x ${sign} ${c - b}`,
            `Divide by ${a} (positive) → x ${sign} ${x}`,
            'Sign stays the same'
          ]
        };
      }
    }

    if (difficulty === 'hard') {
      // a(x + b) > cx + d, requiring expansion and possibly sign flip
      const a = randInt(2, 5);
      const b = randInt(-5, 5);
      const c = randInt(1, 4);
      const sign = signs[randInt(0, 3)];
      // After expansion: ax + ab > cx + d
      // (a-c)x > d - ab
      const netCoeff = a - c;
      if (netCoeff === 0) return null;
      const x = randInt(-8, 8);
      if (x === 0) return null;
      const d = netCoeff * x + a * b;
      const finalSign = netCoeff < 0 ? flipSign(sign) : sign;
      const q = `${a}(x ${b >= 0 ? '+' : '−'} ${Math.abs(b)}) ${sign} ${c}x ${d >= 0 ? '+' : '−'} ${Math.abs(d)}`;
      return {
        q,
        a: `x ${finalSign} ${x}`,
        wrong: generateDistractors(`x ${finalSign} ${x}`, 'inequality', difficulty),
        hint: 'Expand, collect x terms, watch for sign flip',
        steps: [
          `Expand: ${a}x ${a*b >= 0 ? '+' : '−'} ${Math.abs(a*b)} ${sign} ${c}x ${d >= 0 ? '+' : '−'} ${Math.abs(d)}`,
          `Subtract ${c}x: ${netCoeff}x ${a*b >= 0 ? '+' : '−'} ${Math.abs(a*b)} ${sign} ${d}`,
          `Subtract ${a*b >= 0 ? a*b : `(${a*b})`}: ${netCoeff}x ${sign} ${d - a*b}`,
          `Divide by ${netCoeff}${netCoeff < 0 ? ' → FLIP sign' : ''}: x ${finalSign} ${x}`
        ]
      };
    }
  } catch (e) {
    return null;
  }
  return null;
}

function flipSign(sign) {
  const map = { '>': '<', '<': '>', '≥': '≤', '≤': '≥' };
  return map[sign] || sign;
}

// --- Simultaneous Equations Generator ---

export function generateSimultaneous(difficulty) {
  try {
    if (difficulty === 'easy') {
      // x + y = s, x - y = d => x = (s+d)/2, y = (s-d)/2
      const x = randEasy();
      const y = randEasy();
      const s = x + y;
      const d = x - y;
      if (d === 0) return null;
      return {
        q: `x + y = ${s}\nx − y = ${d}`,
        a: `(${x}, ${y})`,
        wrong: generateDistractors(`(${x}, ${y})`, 'simultaneous', difficulty),
        hint: 'Add equations to eliminate y',
        steps: [
          `Add equations: 2x = ${s + d} → x = ${x}`,
          `Substitute: ${x} + y = ${s} → y = ${y}`
        ]
      };
    }

    if (difficulty === 'medium') {
      // ax + by = c, dx + ey = f with integer solutions
      const x = randInt(1, 8);
      const y = randInt(1, 8);
      const a = randInt(1, 4);
      const b = randInt(1, 4);
      const d = randInt(1, 4);
      const e = randInt(-4, -1);
      if (a * e === b * d) return null; // parallel lines
      const c = a * x + b * y;
      const f = d * x + e * y;
      const eq1 = `${a === 1 ? '' : a}x + ${b === 1 ? '' : b}y = ${c}`;
      const eq2 = `${d === 1 ? '' : d}x ${e >= 0 ? '+' : '−'} ${Math.abs(e) === 1 ? '' : Math.abs(e)}y = ${f}`;
      return {
        q: `${eq1}\n${eq2}`,
        a: `(${x}, ${y})`,
        wrong: generateDistractors(`(${x}, ${y})`, 'simultaneous', difficulty),
        hint: 'Use substitution or elimination',
        steps: [
          `From eqn 2: express x or y`,
          `Substitute into eqn 1 and solve`,
          `x = ${x}, y = ${y}`
        ]
      };
    }

    if (difficulty === 'hard') {
      // ax + by = c, dx + ey = f with larger coefficients
      const x = randInt(-5, 8);
      const y = randInt(-5, 8);
      if (x === 0 && y === 0) return null;
      const a = randInt(2, 5);
      const b = randInt(2, 5);
      const d = randInt(2, 5);
      const e = randInt(-5, -1);
      if (a * e === b * d) return null;
      const c = a * x + b * y;
      const f = d * x + e * y;
      const eq1 = `${a}x + ${b}y = ${c}`;
      const eq2 = `${d}x ${e >= 0 ? '+' : '−'} ${Math.abs(e)}y = ${f}`;
      return {
        q: `${eq1}\n${eq2}`,
        a: `(${x}, ${y})`,
        wrong: generateDistractors(`(${x}, ${y})`, 'simultaneous', difficulty),
        hint: 'Multiply equations to match coefficients, then eliminate',
        steps: [
          `Multiply eqn 1 by ${Math.abs(e)}: ${a*Math.abs(e)}x + ${b*Math.abs(e)}y = ${c*Math.abs(e)}`,
          `Multiply eqn 2 by ${b}: ${d*b}x ${e*b >= 0 ? '+' : '−'} ${Math.abs(e*b)}y = ${f*b}`,
          `Add/subtract to eliminate y and solve for x = ${x}`,
          `Substitute back to find y = ${y}`
        ]
      };
    }
  } catch (e) {
    return null;
  }
  return null;
}

// --- Superscript helper ---

function toSuperscript(n) {
  const superscripts = { '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹' };
  return String(n).split('').map(c => superscripts[c] || c).join('');
}

// --- Distractor Generation ---

/**
 * @param {string} correctAnswer
 * @param {string} topic
 * @param {string} difficulty
 * @param {object} [meta] - Optional metadata for context-aware distractor generation
 * @param {string} [meta.subtype] - Question subtype (e.g., 'power_of_power', 'same_base_multiply')
 * @param {number} [meta.expA] - First exponent value
 * @param {number} [meta.expB] - Second exponent value
 * @returns {Array<{value: string, tag: string}>} Array of 3 tagged distractor objects
 */
export function generateDistractors(correctAnswer, topic, difficulty, meta) {
  const distractors = [];
  const seenValues = new Set();
  let attempts = 0;

  while (distractors.length < 3 && attempts < 30) {
    attempts++;
    const d = generateSingleDistractor(correctAnswer, topic, difficulty, distractors.length, meta);
    if (d && d.value && d.value !== correctAnswer && !seenValues.has(d.value)) {
      seenValues.add(d.value);
      distractors.push(d);
    }
  }

  // Fallback: if we couldn't generate 3 unique distractors, add simple variations
  if (distractors.length < 3) {
    const fallbacks = generateFallbackDistractors(correctAnswer, topic);
    for (const f of fallbacks) {
      if (distractors.length >= 3) break;
      if (f.value !== correctAnswer && !seenValues.has(f.value)) {
        seenValues.add(f.value);
        distractors.push(f);
      }
    }
  }

  return distractors.slice(0, 3);
}

/**
 * Generates a single tagged distractor object.
 * @returns {{value: string, tag: string}|null}
 */
function generateSingleDistractor(correctAnswer, topic, difficulty, index, meta) {
  if (topic === 'simultaneous') {
    return generateSimultaneousDistractor(correctAnswer, index);
  }
  if (topic === 'expExpr') {
    return generateExpExprDistractor(correctAnswer, index, meta);
  }

  // Extract numeric value(s) from answer
  const pmMatch = correctAnswer.match(/x = ±(\d+)/);
  if (pmMatch) {
    const n = parseInt(pmMatch[1]);
    // index 0: single_root_only (only one root shown)
    // index 1: off_by_one
    // index 2+: arithmetic_error
    const errorPatterns = [
      { value: `x = ${n}`, tag: 'single_root_only' },
      { value: `x = ±${n + 1}`, tag: 'off_by_one' },
      { value: `x = ±${n * 2}`, tag: 'arithmetic_error' },
      { value: `x = ±${n * n}`, tag: 'arithmetic_error' },
      { value: `x = ±${Math.max(1, Math.floor(n / 2))}`, tag: 'arithmetic_error' }
    ];
    const pick = errorPatterns[index % errorPatterns.length];
    if (pick.value === correctAnswer) {
      // Fallback if the generated value matches correct
      return { value: `x = ${n}`, tag: 'single_root_only' };
    }
    return pick;
  }

  const orMatch = correctAnswer.match(/x = (.+) or (.+)/);
  if (orMatch) {
    const v1 = orMatch[1].trim();
    const v2 = orMatch[2].trim();
    // Common errors: single root only, sign flip on both, sign flip on one
    const errorPatterns = [
      { value: `x = ${v1}`, tag: 'single_root_only' },
      { value: `x = ${flipNum(v1)} or ${flipNum(v2)}`, tag: 'sign_error' },
      { value: `x = ${v1} or ${flipNum(v2)}`, tag: 'sign_error' }
    ];
    return errorPatterns[index % errorPatterns.length];
  }

  // For inequality answers like "x > 4"
  const ineqMatch = correctAnswer.match(/x\s*([><=≥≤]+)\s*(.+)/);
  if (ineqMatch) {
    const sign = ineqMatch[1];
    const val = ineqMatch[2].trim();
    const numVal = parseFloat(val);
    if (!isNaN(numVal)) {
      const errorPatterns = [
        { value: `x ${flipSign(sign)} ${val}`, tag: topic === 'inequality' ? 'sign_flip_forgotten' : 'sign_error' },
        { value: `x ${sign} ${numVal + randInt(1, 3)}`, tag: 'arithmetic_error' },
        { value: `x ${sign} ${-numVal}`, tag: 'sign_error' }
      ];
      return errorPatterns[index % errorPatterns.length];
    }
  }

  // For "x = value" answers
  const simpleMatch = correctAnswer.match(/x = (.+)/);
  if (simpleMatch) {
    const val = simpleMatch[1].trim();
    const numVal = parseFloat(val.replace('−', '-'));
    if (!isNaN(numVal)) {
      const intVal = Math.round(numVal);
      const offset1 = randInt(1, 3);
      const offset2 = randInt(1, 3);
      const errorPatterns = [
        { value: `x = ${intVal + offset1}`, tag: offset1 === 1 ? 'off_by_one' : 'arithmetic_error' },
        { value: `x = ${intVal - offset2}`, tag: offset2 === 1 ? 'off_by_one' : 'arithmetic_error' },
        { value: `x = ${-intVal}`, tag: 'sign_error' }
      ];
      return errorPatterns[index % errorPatterns.length];
    }
    // Non-numeric (fraction etc)
    return { value: `x = ${randInt(1, 9)}`, tag: 'general_miscalculation' };
  }

  return null;
}

function generateSimultaneousDistractor(correctAnswer, index) {
  const match = correctAnswer.match(/\((.+),\s*(.+)\)/);
  if (!match) return { value: `(${randInt(1,9)}, ${randInt(1,9)})`, tag: 'general_miscalculation' };
  const x = parseInt(match[1]);
  const y = parseInt(match[2]);
  const errorPatterns = [
    { value: `(${y}, ${x})`, tag: 'swapped_variables' },
    { value: `(${x + 1}, ${y - 1})`, tag: 'arithmetic_error' },
    { value: `(${x - 1}, ${y + 1})`, tag: 'arithmetic_error' }
  ];
  return errorPatterns[index % errorPatterns.length];
}

function generateExpExprDistractor(correctAnswer, index, meta) {
  // If we have metadata about the question type, generate specific error-pattern distractors first
  if (meta && index === 0) {
    if (meta.subtype === 'power_of_power' && meta.expA != null && meta.expB != null) {
      // Common mistake: adding exponents instead of multiplying
      const errorExp = meta.expA + meta.expB;
      const correctExp = meta.expA * meta.expB;
      // Skip if error value equals correct answer
      if (errorExp !== correctExp) {
        const coeff = meta.coeff || 1;
        const value = `${coeff > 1 ? coeff : ''}x${toSuperscript(errorExp)}`;
        return { value, tag: 'exponents_added_not_multiplied' };
      }
    }
    if (meta.subtype === 'same_base_multiply' && meta.expA != null && meta.expB != null) {
      // Common mistake: multiplying exponents instead of adding
      const errorExp = meta.expA * meta.expB;
      const correctExp = meta.expA + meta.expB;
      // Skip if error value equals correct answer
      if (errorExp !== correctExp) {
        const coeff = meta.coeff || 1;
        const value = `${coeff > 1 ? coeff : ''}x${toSuperscript(errorExp)}`;
        return { value, tag: 'exponents_multiplied_not_added' };
      }
    }
  }

  // Try to parse x^n format
  const match = correctAnswer.match(/^(\d*)x(.+)$/);
  if (match) {
    const coeff = match[1] ? parseInt(match[1]) : 1;
    const expStr = match[2];
    // Parse superscript back to number
    const expNum = parseSuperscript(expStr);
    if (expNum !== null) {
      const errorPatterns = [
        { value: `${coeff}x${toSuperscript(expNum + 1)}`.replace(/^1x/, 'x'), tag: 'exponents_added_not_multiplied' },
        { value: `${coeff}x${toSuperscript(Math.max(1, expNum - 1))}`.replace(/^1x/, 'x'), tag: 'exponents_multiplied_not_added' },
        { value: `${coeff * 2}x${toSuperscript(expNum)}`.replace(/^1x/, 'x'), tag: 'arithmetic_error' }
      ];
      return errorPatterns[index % errorPatterns.length];
    }
  }
  return { value: `x${toSuperscript(randInt(2, 12))}`, tag: 'general_miscalculation' };
}

function parseSuperscript(str) {
  const map = { '⁰': '0', '¹': '1', '²': '2', '³': '3', '⁴': '4', '⁵': '5', '⁶': '6', '⁷': '7', '⁸': '8', '⁹': '9' };
  const digits = str.split('').map(c => map[c]).filter(Boolean).join('');
  return digits ? parseInt(digits) : null;
}

function flipNum(val) {
  const str = String(val).trim();
  if (str.startsWith('−') || str.startsWith('-')) {
    return str.slice(1);
  }
  return `−${str}`;
}

function generateFallbackDistractors(correctAnswer, topic) {
  // Generate simple numeric variations as last resort
  const results = [];
  for (let i = 1; i <= 5; i++) {
    if (topic === 'simultaneous') {
      results.push({ value: `(${randInt(1, 9)}, ${randInt(1, 9)})`, tag: 'general_miscalculation' });
    } else if (topic === 'expExpr') {
      results.push({ value: `x${toSuperscript(randInt(2, 15))}`, tag: 'general_miscalculation' });
    } else {
      results.push({ value: `x = ${randInt(-9, 9)}`, tag: 'general_miscalculation' });
    }
  }
  return results;
}

// --- Question Validation ---

export function validateQuestion(question) {
  if (!question || typeof question !== 'object') return false;
  if (typeof question.q !== 'string' || question.q.length === 0) return false;
  if (typeof question.a !== 'string' || question.a.length === 0) return false;
  if (!Array.isArray(question.wrong) || question.wrong.length !== 3) return false;
  // Support both plain strings and {value, tag} objects
  const wrongValues = question.wrong.map(w => {
    if (typeof w === 'string') return w;
    if (w && typeof w === 'object' && typeof w.value === 'string') return w.value;
    return null;
  });
  if (wrongValues.some(v => v === null || v.length === 0)) return false;
  // Check all wrong answers are distinct from correct and from each other
  const allAnswers = new Set([question.a, ...wrongValues]);
  if (allAnswers.size !== 4) return false;
  if (typeof question.hint !== 'string' || question.hint.length === 0) return false;
  if (!Array.isArray(question.steps)) return false;
  if (question.steps.length < 2 || question.steps.length > 6) return false;
  if (question.steps.some(s => typeof s !== 'string' || s.length === 0)) return false;
  return true;
}

// --- Main Entry Points ---

const GENERATORS = {
  linear: generateLinear,
  quadratic: generateQuadratic,
  expExpr: generateExpExpr,
  expEqn: generateExpEqn,
  inequality: generateInequality,
  simultaneous: generateSimultaneous
};

export function generateQuestion(topic, difficulty) {
  const generator = GENERATORS[topic];
  if (!generator) {
    return getFallbackSeedQuestion(topic, difficulty);
  }

  for (let attempt = 0; attempt < MAX_GENERATION_ATTEMPTS; attempt++) {
    const question = generator(difficulty);
    if (question && validateQuestion(question)) {
      question._generated = true;
      return question;
    }
  }

  // Fallback to seed question
  return getFallbackSeedQuestion(topic, difficulty);
}

export function generateQuestionPool(topic, difficulty, count) {
  const pool = [];
  const targetGenerated = Math.ceil(count * 0.7);
  let generatedCount = 0;

  // First, try to generate the required number of questions
  for (let i = 0; i < targetGenerated; i++) {
    const q = generateQuestion(topic, difficulty);
    if (q) {
      pool.push(q);
      if (q._generated) generatedCount++;
    }
  }

  // Fill remaining with seed questions
  const seedQuestions = getSeedQuestions(topic, difficulty);
  const remaining = count - pool.length;
  for (let i = 0; i < remaining && i < seedQuestions.length; i++) {
    pool.push({ ...seedQuestions[i], _generated: false });
  }

  // If we still don't have enough, generate more
  while (pool.length < count) {
    const q = generateQuestion(topic, difficulty);
    if (q) pool.push(q);
    else break;
  }

  return pool;
}

function getFallbackSeedQuestion(topic, difficulty) {
  const seedQuestions = getSeedQuestions(topic, difficulty);
  if (seedQuestions.length === 0) return null;
  const idx = randInt(0, seedQuestions.length - 1);
  return { ...seedQuestions[idx], _generated: false };
}

function getSeedQuestions(topic, difficulty) {
  const topicData = QUESTIONS[topic];
  if (!topicData) return [];
  const questions = topicData[difficulty];
  if (!Array.isArray(questions)) return [];
  return questions;
}
