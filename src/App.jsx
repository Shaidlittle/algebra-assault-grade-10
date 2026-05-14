import React, { useState, useEffect, useRef } from 'react';
import { Heart, Trophy, Pause, Play, RotateCcw, ChevronRight, X, Volume2, VolumeX, Crosshair, Check, Flame, Skull, Shield, Zap, Target, Timer, AlertTriangle } from 'lucide-react';

/* ============================================================
   MathText — renders maths text safely on EVERY device.
   Many mobile fonts have no glyph for Unicode superscript
   characters (⁰⁴⁵⁶⁷⁸⁹ⁿˣ …), so "x⁵" was showing as "x□".
   This component converts those characters into real <sup>/<sub>
   tags using ordinary digits, which every font can render.
   The underlying answer strings are NEVER changed, so answer
   matching (answer === q.a) keeps working exactly as before.
   ============================================================ */
const SUPERSCRIPT_MAP = {
  '\u2070': '0', '\u00B9': '1', '\u00B2': '2', '\u00B3': '3', '\u2074': '4',
  '\u2075': '5', '\u2076': '6', '\u2077': '7', '\u2078': '8', '\u2079': '9',
  '\u207A': '+', '\u207B': '\u2212', '\u207C': '=', '\u207D': '(', '\u207E': ')',
  '\u207F': 'n', '\u02E3': 'x', '\u2071': 'i',
};
const SUBSCRIPT_MAP = {
  '\u2080': '0', '\u2081': '1', '\u2082': '2', '\u2083': '3', '\u2084': '4',
  '\u2085': '5', '\u2086': '6', '\u2087': '7', '\u2088': '8', '\u2089': '9',
  '\u208A': '+', '\u208B': '\u2212', '\u208C': '=', '\u208D': '(', '\u208E': ')',
};
// characters allowed to sit *inside* a run (e.g. the dot in x²·⁵)
const RUN_CONTINUE = { '.': true, '\u00B7': true };

function MathText({ children, className = '' }) {
  const text = String(children == null ? '' : children);
  const nodes = [];
  let buf = '';
  let run = '';
  let runType = null; // 'sup' | 'sub'
  let key = 0;

  const flushBuf = () => { if (buf) { nodes.push(buf); buf = ''; } };
  const flushRun = () => {
    if (run) {
      nodes.push(
        runType === 'sup'
          ? <sup key={'s' + key++} className="math-sup">{run}</sup>
          : <sub key={'s' + key++} className="math-sub">{run}</sub>
      );
      run = '';
    }
    runType = null;
  };

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const sup = SUPERSCRIPT_MAP[ch];
    const sub = SUBSCRIPT_MAP[ch];
    if (sup !== undefined) {
      if (runType === 'sub') flushRun();
      if (runType !== 'sup') { flushBuf(); runType = 'sup'; }
      run += sup;
    } else if (sub !== undefined) {
      if (runType === 'sup') flushRun();
      if (runType !== 'sub') { flushBuf(); runType = 'sub'; }
      run += sub;
    } else if (
      runType && RUN_CONTINUE[ch] && i + 1 < text.length &&
      ((runType === 'sup' && SUPERSCRIPT_MAP[text[i + 1]] !== undefined) ||
       (runType === 'sub' && SUBSCRIPT_MAP[text[i + 1]] !== undefined))
    ) {
      run += ch; // decimal point sandwiched between superscript digits
    } else {
      if (runType) flushRun();
      buf += ch;
    }
  }
  flushRun();
  flushBuf();

  return <span className={className}>{nodes}</span>;
}

// Parent feedback survey — opens when the "Give Feedback" button is tapped.
const SURVEY_URL = 'https://www.surveymonkey.com/r/5JGZFDY';

const QUESTIONS = {
  linear: {
    name: 'Linear Equations', short: 'Linear', color: '#3b82f6',
    bgColor: 'from-blue-600 to-blue-900', icon: '➕',
    easy: [
      { q: '2x + 5 = 13', a: 'x = 4', wrong: ['x = 3', 'x = 5', 'x = 9'], hint: 'Subtract 5, then divide by 2' },
      { q: '3x − 7 = 8', a: 'x = 5', wrong: ['x = 1', 'x = 3', 'x = 15'], hint: 'Add 7, then divide by 3' },
      { q: 'x + 12 = 20', a: 'x = 8', wrong: ['x = 12', 'x = 32', 'x = −8'], hint: 'Subtract 12 from both sides' },
      { q: '5x = 30', a: 'x = 6', wrong: ['x = 5', 'x = 25', 'x = 35'], hint: 'Divide both sides by 5' },
      { q: 'x − 8 = 12', a: 'x = 20', wrong: ['x = 4', 'x = −4', 'x = 8'], hint: 'Add 8 to both sides' },
      { q: '4x + 3 = 19', a: 'x = 4', wrong: ['x = 3', 'x = 5', 'x = 22'], hint: 'Subtract 3, then divide by 4' },
    ],
    medium: [
      { q: '4x + 9 = 2x + 21', a: 'x = 6', wrong: ['x = 3', 'x = 12', 'x = 5'], hint: 'Move x-terms to one side' },
      { q: '5(x − 3) = 2x + 6', a: 'x = 7', wrong: ['x = 5', 'x = 3', 'x = 9'], hint: 'Expand the bracket first' },
      { q: '3(x + 2) = 2(x + 7)', a: 'x = 8', wrong: ['x = 4', 'x = 6', 'x = 12'], hint: 'Expand both sides first' },
      { q: '6x − 5 = 4x + 9', a: 'x = 7', wrong: ['x = 2', 'x = −2', 'x = 14'], hint: 'Subtract 4x, add 5, divide by 2' },
      { q: '2(x + 5) = 16', a: 'x = 3', wrong: ['x = 11', 'x = 8', 'x = −3'], hint: 'Expand: 2x + 10 = 16' },
      { q: '7 − 2x = 1', a: 'x = 3', wrong: ['x = −3', 'x = 4', 'x = −4'], hint: 'Subtract 7, then divide by −2' },
    ],
    hard: [
      { q: '(2x+1)/3 = (x−1)/2', a: 'x = −5', wrong: ['x = 5', 'x = −1', 'x = 1'], hint: 'Cross-multiply: 2(2x+1) = 3(x−1)' },
      { q: '3(2x−1) − 2(x+4) = 5', a: 'x = 4', wrong: ['x = 2', 'x = 3', 'x = 5'], hint: 'Expand carefully — watch the signs' },
      { q: '7x − 4 = 3(x + 4)', a: 'x = 4', wrong: ['x = 2', 'x = 8', 'x = −4'], hint: 'Expand right side, then collect' },
      { q: '(x−1)/2 + (x+1)/4 = 2', a: 'x = 3', wrong: ['x = 2', 'x = 4', 'x = 5'], hint: 'Multiply through by 4 to clear fractions' },
      { q: '2(3x − 1) + 3(x − 2) = 1', a: 'x = 1', wrong: ['x = 2', 'x = −1', 'x = 9'], hint: 'Expand: 6x − 2 + 3x − 6 = 1' },
      { q: '4(x + 1) − 3(x − 2) = 12', a: 'x = 2', wrong: ['x = 4', 'x = 10', 'x = −2'], hint: 'Watch the sign: −3(x−2) = −3x+6' },
    ]
  },
  quadratic: {
    name: 'Quadratic Equations', short: 'Quadratic', color: '#a855f7',
    bgColor: 'from-purple-600 to-purple-900', icon: 'x²',
    easy: [
      { q: 'x² = 25', a: 'x = ±5', wrong: ['x = 5', 'x = 25', 'x = ±25'], hint: 'Square root both sides — remember ±' },
      { q: 'x² − 9 = 0', a: 'x = ±3', wrong: ['x = 3', 'x = ±9', 'x = 9'], hint: 'Add 9, then square root' },
      { q: '(x − 2)(x + 3) = 0', a: 'x = 2 or −3', wrong: ['x = −2 or 3', 'x = 2 or 3', 'x = −2 or −3'], hint: 'Each factor must equal zero' },
      { q: '(x + 4)(x − 1) = 0', a: 'x = −4 or 1', wrong: ['x = 4 or −1', 'x = −4 or −1', 'x = 4 or 1'], hint: 'Set each bracket to zero' },
      { q: 'x² = 49', a: 'x = ±7', wrong: ['x = 7', 'x = 49', 'x = ±49'], hint: 'Both +7 and −7 squared give 49' },
      { q: 'x² − 16 = 0', a: 'x = ±4', wrong: ['x = 4', 'x = ±16', 'x = 8'], hint: 'Add 16, then square root' },
    ],
    medium: [
      { q: 'x² − 5x + 6 = 0', a: 'x = 2 or 3', wrong: ['x = −2 or −3', 'x = 1 or 6', 'x = 5 or 6'], hint: 'Two numbers: ×=6, +=−5' },
      { q: 'x² + 7x + 12 = 0', a: 'x = −3 or −4', wrong: ['x = 3 or 4', 'x = −3 or 4', 'x = 3 or −4'], hint: 'Two numbers: ×=12, +=7' },
      { q: 'x² − x − 6 = 0', a: 'x = 3 or −2', wrong: ['x = −3 or 2', 'x = 6 or −1', 'x = 3 or 2'], hint: 'Two numbers: ×=−6, +=−1' },
      { q: 'x² + 5x + 4 = 0', a: 'x = −1 or −4', wrong: ['x = 1 or 4', 'x = −1 or 4', 'x = 1 or −4'], hint: 'Two numbers: ×=4, +=5' },
      { q: 'x² − 7x + 10 = 0', a: 'x = 2 or 5', wrong: ['x = −2 or −5', 'x = 1 or 10', 'x = −1 or −10'], hint: 'Two numbers: ×=10, +=−7' },
      { q: 'x² + 2x − 8 = 0', a: 'x = −4 or 2', wrong: ['x = 4 or −2', 'x = −4 or −2', 'x = 4 or 2'], hint: 'Two numbers: ×=−8, +=2' },
    ],
    hard: [
      { q: '2x² − 5x − 3 = 0', a: 'x = 3 or −½', wrong: ['x = −3 or ½', 'x = 3 or ½', 'x = −3 or −½'], hint: 'Factor: (2x+1)(x−3) = 0' },
      { q: 'x² − 4x − 5 = 0', a: 'x = 5 or −1', wrong: ['x = −5 or 1', 'x = 5 or 1', 'x = −5 or −1'], hint: 'Two numbers: ×=−5, +=−4' },
      { q: '3x² − 12 = 0', a: 'x = ±2', wrong: ['x = ±4', 'x = ±6', 'x = 2'], hint: 'Divide by 3 first, then square root' },
      { q: '2x² = 18', a: 'x = ±3', wrong: ['x = ±9', 'x = 9', 'x = ±18'], hint: 'Divide by 2: x² = 9, then root' },
      { q: 'x² + 6x + 9 = 0', a: 'x = −3', wrong: ['x = 3', 'x = ±3', 'x = −3 or 3'], hint: 'Perfect square: (x+3)² = 0' },
      { q: '3x² + 5x − 2 = 0', a: 'x = ⅓ or −2', wrong: ['x = −⅓ or 2', 'x = ⅓ or 2', 'x = −⅓ or −2'], hint: 'Factor: (3x−1)(x+2) = 0' },
    ]
  },
  expExpr: {
    name: 'Exponential Expressions', short: 'Exp Expressions', color: '#f59e0b',
    bgColor: 'from-amber-500 to-orange-700', icon: 'xⁿ',
    easy: [
      { q: 'x³ × x²', a: 'x⁵', wrong: ['x⁶', 'x¹', '2x⁵'], hint: 'Multiplying same base → ADD exponents' },
      { q: 'x⁵ ÷ x²', a: 'x³', wrong: ['x⁷', 'x²·⁵', 'x¹⁰'], hint: 'Dividing same base → SUBTRACT exponents' },
      { q: '(x²)³', a: 'x⁶', wrong: ['x⁵', 'x⁸', '3x²'], hint: 'Power of a power → MULTIPLY exponents' },
      { q: 'x⁴ × x', a: 'x⁵', wrong: ['x⁴', '2x⁵', 'x³'], hint: 'x is x¹, so add: 4+1 = 5' },
      { q: '(x³)²', a: 'x⁶', wrong: ['x⁵', 'x⁹', '2x⁶'], hint: 'Multiply: 3 × 2 = 6' },
      { q: 'x⁶ ÷ x²', a: 'x⁴', wrong: ['x⁸', 'x³', 'x¹²'], hint: 'Subtract: 6 − 2 = 4' },
    ],
    medium: [
      { q: '2a²b × 3ab³', a: '6a³b⁴', wrong: ['5a³b⁴', '6a²b³', '6a²b⁴'], hint: 'Multiply numbers, add exponents per variable' },
      { q: '(2x³)²', a: '4x⁶', wrong: ['2x⁶', '4x⁵', '2x⁵'], hint: 'Square BOTH the 2 and the x³' },
      { q: '(3x²y)³', a: '27x⁶y³', wrong: ['9x⁶y³', '27x⁵y³', '27x⁶y⁴'], hint: 'Cube every part inside the bracket' },
      { q: '5x³ × 2x⁴', a: '10x⁷', wrong: ['7x⁷', '10x¹²', '7x¹²'], hint: '5×2 = 10, x³ × x⁴ = x⁷' },
      { q: '(4x²)²', a: '16x⁴', wrong: ['8x⁴', '16x²', '4x⁴'], hint: '4² = 16, (x²)² = x⁴' },
      { q: '(a²b)³', a: 'a⁶b³', wrong: ['a⁵b³', 'a⁶b', 'a⁵b'], hint: 'Cube each: (a²)³ × b³' },
    ],
    hard: [
      { q: '(2a²)³ × (3a)²', a: '72a⁸', wrong: ['36a⁸', '72a⁷', '72a⁶'], hint: '(2a²)³ = 8a⁶, (3a)² = 9a²' },
      { q: '√(16x⁴)', a: '4x²', wrong: ['8x²', '4x⁴', '16x²'], hint: '√16 = 4, √x⁴ = x²' },
      { q: '(a³b²)² ÷ (ab)³', a: 'a³b', wrong: ['a²b', 'a³b²', 'ab²'], hint: 'Top: a⁶b⁴. Bottom: a³b³.' },
      { q: '(2a²b)³ × ab', a: '8a⁷b⁴', wrong: ['6a⁷b⁴', '8a⁶b³', '2a⁷b⁴'], hint: '(2a²b)³ = 8a⁶b³, then × ab' },
      { q: '(x³)⁴ × x²', a: 'x¹⁴', wrong: ['x¹²', 'x⁹', 'x²⁴'], hint: 'x¹² × x² = x¹⁴' },
      { q: '(3a)² × (2a³)²', a: '36a⁸', wrong: ['6a⁸', '36a⁶', '12a⁸'], hint: '9a² × 4a⁶ = 36a⁸' },
    ]
  },
  expEqn: {
    name: 'Exponential Equations', short: 'Exp Equations', color: '#10b981',
    bgColor: 'from-emerald-500 to-emerald-800', icon: '2ˣ',
    easy: [
      { q: '2ˣ = 8', a: 'x = 3', wrong: ['x = 2', 'x = 4', 'x = 8'], hint: '8 = 2³' },
      { q: '3ˣ = 27', a: 'x = 3', wrong: ['x = 9', 'x = 27', 'x = 2'], hint: '27 = 3³' },
      { q: '5ˣ = 25', a: 'x = 2', wrong: ['x = 5', 'x = 25', 'x = 1'], hint: '25 = 5²' },
      { q: '2ˣ = 16', a: 'x = 4', wrong: ['x = 2', 'x = 8', 'x = 3'], hint: '16 = 2⁴' },
      { q: '4ˣ = 16', a: 'x = 2', wrong: ['x = 4', 'x = 8', 'x = 12'], hint: '16 = 4²' },
      { q: '10ˣ = 1000', a: 'x = 3', wrong: ['x = 10', 'x = 100', 'x = 2'], hint: '1000 = 10³' },
    ],
    medium: [
      { q: '2^(x+1) = 16', a: 'x = 3', wrong: ['x = 4', 'x = 2', 'x = 5'], hint: '16 = 2⁴, so x + 1 = 4' },
      { q: '3^(2x) = 81', a: 'x = 2', wrong: ['x = 4', 'x = 1', 'x = 3'], hint: '81 = 3⁴, so 2x = 4' },
      { q: '4ˣ = 64', a: 'x = 3', wrong: ['x = 16', 'x = 4', 'x = 2'], hint: '64 = 4³' },
      { q: '2^(x−1) = 8', a: 'x = 4', wrong: ['x = 3', 'x = 2', 'x = 5'], hint: '8 = 2³, so x − 1 = 3' },
      { q: '5^(x+1) = 125', a: 'x = 2', wrong: ['x = 3', 'x = 1', 'x = 4'], hint: '125 = 5³, so x + 1 = 3' },
      { q: '3ˣ = 1/9', a: 'x = −2', wrong: ['x = 2', 'x = −3', 'x = −9'], hint: '1/9 = 3⁻²' },
    ],
    hard: [
      { q: '9ˣ = 27', a: 'x = 1.5', wrong: ['x = 3', 'x = 2', 'x = 0.5'], hint: 'Rewrite as 3^(2x) = 3³' },
      { q: '2^(x+1) · 2^(x−1) = 64', a: 'x = 3', wrong: ['x = 6', 'x = 4', 'x = 2'], hint: 'Add exponents: 2^(2x) = 2⁶' },
      { q: '5^(x−2) = 125', a: 'x = 5', wrong: ['x = 3', 'x = 7', 'x = 25'], hint: '125 = 5³, so x − 2 = 3' },
      { q: '4ˣ = 32', a: 'x = 2.5', wrong: ['x = 8', 'x = 3', 'x = 2'], hint: '2^(2x) = 2⁵, so 2x = 5' },
      { q: '27ˣ = 9', a: 'x = ⅔', wrong: ['x = ⅓', 'x = 3', 'x = 2'], hint: '3^(3x) = 3², so 3x = 2' },
      { q: '8ˣ = 16', a: 'x = 4/3', wrong: ['x = ⅔', 'x = 2', 'x = ½'], hint: '2^(3x) = 2⁴, so 3x = 4' },
    ]
  },
  inequality: {
    name: 'Inequalities', short: 'Inequalities', color: '#ef4444',
    bgColor: 'from-red-500 to-red-800', icon: '≤',
    easy: [
      { q: 'x + 3 > 7', a: 'x > 4', wrong: ['x > 10', 'x < 4', 'x ≥ 4'], hint: 'Subtract 3 — sign stays' },
      { q: '2x < 10', a: 'x < 5', wrong: ['x > 5', 'x < 20', 'x < −5'], hint: 'Divide by 2 (positive) — no flip' },
      { q: 'x − 5 ≥ 2', a: 'x ≥ 7', wrong: ['x ≤ 7', 'x > 7', 'x ≥ −3'], hint: 'Add 5 to both sides' },
      { q: 'x + 5 < 12', a: 'x < 7', wrong: ['x > 7', 'x < 17', 'x < −7'], hint: 'Subtract 5 — sign stays' },
      { q: 'x − 3 > 0', a: 'x > 3', wrong: ['x < 3', 'x > −3', 'x ≥ 3'], hint: 'Add 3 to both sides' },
      { q: '4x ≤ 20', a: 'x ≤ 5', wrong: ['x ≥ 5', 'x ≤ 16', 'x ≤ 24'], hint: 'Divide by 4 (positive)' },
    ],
    medium: [
      { q: '3x + 2 ≤ 14', a: 'x ≤ 4', wrong: ['x ≥ 4', 'x ≤ 16', 'x ≤ −4'], hint: 'Subtract 2, divide by 3' },
      { q: '−2x > 8', a: 'x < −4', wrong: ['x > −4', 'x < 4', 'x > 4'], hint: 'Divide by NEGATIVE → FLIP!' },
      { q: '5 − x < 2', a: 'x > 3', wrong: ['x < 3', 'x > −3', 'x < −3'], hint: '−x < −3, then ÷ by −1 → flip!' },
      { q: '5x − 7 ≤ 8', a: 'x ≤ 3', wrong: ['x ≥ 3', 'x ≤ 15', 'x ≤ 1'], hint: 'Add 7, divide by 5' },
      { q: '−3x ≥ 9', a: 'x ≤ −3', wrong: ['x ≥ −3', 'x ≤ 3', 'x ≥ 3'], hint: 'Divide by −3 → FLIP sign!' },
      { q: '7 − 2x > 1', a: 'x < 3', wrong: ['x > 3', 'x < −3', 'x > −3'], hint: 'Subtract 7, ÷ by −2 → flip' },
    ],
    hard: [
      { q: '2(x − 3) > 4x + 6', a: 'x < −6', wrong: ['x > −6', 'x < 6', 'x > 6'], hint: 'Expand, collect, ÷ by neg → flip' },
      { q: '4 − 3x ≥ 2x − 11', a: 'x ≤ 3', wrong: ['x ≥ 3', 'x ≤ −3', 'x ≥ −3'], hint: '−5x ≥ −15, ÷ by −5 → flip' },
      { q: '3(x+1) < 2x + 8', a: 'x < 5', wrong: ['x > 5', 'x < −5', 'x ≤ 5'], hint: 'Expand and collect — sign stays' },
      { q: '3(x − 2) ≤ x + 4', a: 'x ≤ 5', wrong: ['x ≥ 5', 'x ≤ −5', 'x ≤ 1'], hint: 'Expand: 3x − 6 ≤ x + 4' },
      { q: '5x − 3 < 2x + 9', a: 'x < 4', wrong: ['x > 4', 'x < 12', 'x < −4'], hint: '3x < 12 — divide by positive' },
      { q: '2(x + 1) ≥ 3(x − 2)', a: 'x ≤ 8', wrong: ['x ≥ 8', 'x ≤ −8', 'x ≥ −8'], hint: '−x ≥ −8, ÷ by −1 → flip' },
    ]
  },
  simultaneous: {
    name: 'Simultaneous Equations', short: 'Simultaneous', color: '#06b6d4',
    bgColor: 'from-cyan-500 to-cyan-800', icon: '⚡',
    easy: [
      { q: 'x + y = 5\nx − y = 1', a: '(3, 2)', wrong: ['(2, 3)', '(4, 1)', '(1, 4)'], hint: 'Add equations: 2x = 6' },
      { q: '2x + y = 7\nx + y = 4', a: '(3, 1)', wrong: ['(1, 3)', '(2, 2)', '(4, −1)'], hint: 'Subtract eqn 2 from eqn 1' },
      { q: 'x + y = 10\nx − y = 4', a: '(7, 3)', wrong: ['(3, 7)', '(6, 4)', '(5, 5)'], hint: 'Add to eliminate y' },
      { q: 'x + y = 6\n2x − y = 0', a: '(2, 4)', wrong: ['(4, 2)', '(3, 3)', '(1, 5)'], hint: 'Add equations: 3x = 6' },
      { q: 'x + y = 8\nx − y = 2', a: '(5, 3)', wrong: ['(3, 5)', '(4, 4)', '(6, 2)'], hint: 'Add: 2x = 10' },
      { q: '2x + y = 9\nx − y = 0', a: '(3, 3)', wrong: ['(4, 2)', '(2, 4)', '(1, 1)'], hint: 'From eqn 2: x = y, sub' },
    ],
    medium: [
      { q: '2x + 3y = 12\nx − y = 1', a: '(3, 2)', wrong: ['(2, 3)', '(1, 0)', '(4, 3)'], hint: 'From eqn 2: x = y + 1' },
      { q: 'x + 2y = 8\n3x − y = 3', a: '(2, 3)', wrong: ['(3, 2)', '(1, 4)', '(4, 2)'], hint: 'Solve for x, substitute' },
      { q: '3x + y = 11\nx + y = 5', a: '(3, 2)', wrong: ['(2, 3)', '(4, 1)', '(2, 9)'], hint: 'Subtract: 2x = 6' },
      { q: '2x + y = 10\nx + y = 6', a: '(4, 2)', wrong: ['(2, 4)', '(3, 3)', '(5, 1)'], hint: 'Subtract eqn 2 from eqn 1' },
      { q: 'x + 3y = 11\nx − y = 3', a: '(5, 2)', wrong: ['(2, 5)', '(3, 4)', '(4, 3)'], hint: 'Subtract: 4y = 8' },
      { q: '3x − y = 5\nx + y = 7', a: '(3, 4)', wrong: ['(4, 3)', '(2, 5)', '(1, 6)'], hint: 'Add: 4x = 12' },
    ],
    hard: [
      { q: '3x + 2y = 16\n2x − 3y = −11', a: '(2, 5)', wrong: ['(5, 2)', '(1, 6)', '(4, 2)'], hint: '×3 and ×2 to match y' },
      { q: '4x − y = 7\n2x + 3y = 7', a: '(2, 1)', wrong: ['(1, 2)', '(3, 5)', '(2, −1)'], hint: 'Multiply eqn 1 by 3, then add' },
      { q: '5x + y = 13\n2x − y = 1', a: '(2, 3)', wrong: ['(3, 2)', '(1, 8)', '(2, −3)'], hint: 'Add equations: 7x = 14' },
      { q: '4x + 3y = 18\n2x − y = 4', a: '(3, 2)', wrong: ['(2, 3)', '(4, 2)', '(1, 5)'], hint: 'From eqn 2: y = 2x − 4' },
      { q: '4x + y = 15\n3x − 2y = 3', a: '(3, 3)', wrong: ['(2, 7)', '(1, 11)', '(4, −1)'], hint: 'Multiply eqn 1 by 2, then add' },
      { q: '2x − y = 1\n3x + 2y = 19', a: '(3, 5)', wrong: ['(5, 3)', '(2, 3)', '(1, −1)'], hint: 'From eqn 1: y = 2x − 1' },
    ]
  },
  ultimate: {
    name: 'Ultimate Challenge', short: 'Ultimate', color: '#fbbf24',
    bgColor: 'from-amber-500 via-rose-600 to-purple-800', icon: '👑',
    isUltimate: true,
  },
  exam: {
    name: 'Exam Simulator', short: 'Exam', color: '#dc2626',
    bgColor: 'from-red-700 via-red-900 to-black', icon: '⏱',
    isExam: true,
  }
};

const TOPICS_ORDER = ['linear', 'quadratic', 'expExpr', 'expEqn', 'inequality', 'simultaneous', 'ultimate', 'exam'];
const PLAYABLE_TOPICS = ['linear', 'quadratic', 'expExpr', 'expEqn', 'inequality', 'simultaneous', 'ultimate'];
const WAVES_BEFORE_BOSS = 4;
const ALIENS_PER_WAVE = 10;
const BOSS_HP = 3;
const ULTIMATE_BOSS_HP = 3;
const BOSS_PHASE_HP = 20;
const ULTIMATE_BOSS_PHASE_HP = 30;
const getMaxBossHp = (t) => t === 'ultimate' ? ULTIMATE_BOSS_HP : BOSS_HP;
const getBossPhaseHp = (t) => t === 'ultimate' ? ULTIMATE_BOSS_PHASE_HP : BOSS_PHASE_HP;

// HP system
const MAX_HP = 100;
const DMG_BULLET = 12;
const DMG_ALIEN = 22;
const DMG_BOSS_BULLET = 18;
const DMG_WRONG = 25;
const HEALTH_RESTORE = 30;
const HP_CORRECT_BONUS = 18; // healing reward for correct wave answer

// Exam Simulator
const EXAM_TIMER_SECONDS = 25;
const EXAM_QUESTION_COUNT = 10;
const EXAM_LIVES = 3;
const EXAM_LOW_TIMER = 10;
const EXAM_CRITICAL_TIMER = 5;

// Power-ups
const POWERUP_DROP_CHANCE = 0.18;
const POWERUP_DURATIONS = { shield: 6000, rapid: 8000, triple: 8000 };
const BOSS_SHIELD_DURATION = 5000; // shorter automatic shield in boss
const POWERUP_INFO = {
  shield:  { name: 'Shield',     color: '#3b82f6', glow: '#60a5fa', symbol: 'S' },
  rapid:   { name: 'Rapid Fire', color: '#fbbf24', glow: '#fde047', symbol: 'R' },
  triple:  { name: 'Triple Shot',color: '#a855f7', glow: '#c084fc', symbol: 'T' },
  health:  { name: '+30 HP',     color: '#10b981', glow: '#34d399', symbol: '+' },
  nuke:    { name: 'Nuke',       color: '#f97316', glow: '#fb923c', symbol: 'N' },
};
const POWERUP_TYPES = Object.keys(POWERUP_INFO);

const playSound = (type, enabled) => {
  if (!enabled) return;
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const now = ctx.currentTime;
    const make = (freq, dur, type = 'triangle', vol = 0.1, ramp = null) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = type;
      osc.frequency.setValueAtTime(freq, now);
      if (ramp) osc.frequency.exponentialRampToValueAtTime(ramp, now + dur);
      gain.gain.setValueAtTime(vol, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + dur);
      osc.start(now); osc.stop(now + dur);
    };
    if (type === 'shoot') make(800, 0.06, 'square', 0.04, 200);
    else if (type === 'kill') { make(440, 0.08, 'square', 0.1); make(660, 0.1, 'triangle', 0.08); }
    else if (type === 'correct') { [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => make(f, 0.2, 'triangle', 0.12), i * 60)); }
    else if (type === 'wrong') make(150, 0.3, 'sawtooth', 0.15, 60);
    else if (type === 'hit') make(80, 0.25, 'sawtooth', 0.18, 30);
    else if (type === 'levelUp') [392, 523, 659, 784, 1047, 1319].forEach((f, i) => setTimeout(() => make(f, 0.25, 'square', 0.1), i * 80));
    else if (type === 'boss') [110, 87, 73, 110, 130].forEach((f, i) => setTimeout(() => make(f, 0.3, 'sawtooth', 0.18), i * 100));
    else if (type === 'powerup') [659, 784, 988, 1319].forEach((f, i) => setTimeout(() => make(f, 0.15, 'triangle', 0.12), i * 50));
    else if (type === 'nuke') { make(40, 0.6, 'sawtooth', 0.25, 200); setTimeout(() => make(120, 0.4, 'square', 0.15, 800), 100); }
    else if (type === 'heal') [523, 784, 1047].forEach((f, i) => setTimeout(() => make(f, 0.2, 'sine', 0.12), i * 70));
    else if (type === 'tick') make(880, 0.06, 'square', 0.06);
    else if (type === 'tickHigh') make(1320, 0.08, 'square', 0.1);
  } catch (e) {}
};

const W = 400;
const H = 600;

export default function App() {
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const bossQuestionTimerRef = useRef(null);
  
  const gameRef = useRef({
    player: { x: W / 2, y: H - 80, vx: 0, vy: 0, radius: 18, invuln: 60, lastShot: 0 },
    aliens: [],
    bullets: [],
    enemyBullets: [],
    particles: [],
    stars: [],
    powerups: [],
    damageNumbers: [],
    boss: null,
    keys: {},
    pointer: { x: null, y: null, active: false },
    spawnTimers: { alien: 60 },
    flash: 0,
    flashColor: '#ef4444',
    shake: 0,
    bossActive: false,
    paused: true,
    waveNumber: 1,
    soundOn: true,
    killCount: 0,
    triggerQuestion: false,
    killPulse: 0,
    activePowerups: { shield: 0, rapid: 0, triple: 0 },
    pendingHpChange: 0,
    pendingNuke: false,
  });
  
  const [screen, setScreen] = useState('menu');
  const [topic, setTopic] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [qIdx, setQIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [hp, setHp] = useState(MAX_HP);
  const [aliensKilled, setAliensKilled] = useState(0);
  const [waveNumber, setWaveNumber] = useState(1);
  const [bossActive, setBossActive] = useState(false);
  const [bossHp, setBossHp] = useState(BOSS_HP);
  const [showQuestion, setShowQuestion] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [paused, setPaused] = useState(false);
  const [completed, setCompleted] = useState({});
  const [soundOn, setSoundOn] = useState(true);
  const [bestStreak, setBestStreak] = useState(0);
  const [activePowerups, setActivePowerups] = useState({ shield: 0, rapid: 0, triple: 0 });
  // Parent disclaimer — shows every time the game loads, before the menu
  const [showDisclaimer, setShowDisclaimer] = useState(true);
  
  // Exam Simulator state
  const [examTimer, setExamTimer] = useState(EXAM_TIMER_SECONDS);
  const [examLives, setExamLives] = useState(EXAM_LIVES);
  const [examCorrect, setExamCorrect] = useState(0);
  const [examFeedback, setExamFeedback] = useState(null);
  const [examStartTs, setExamStartTs] = useState(0);
  const [examDuration, setExamDuration] = useState(0);
  
  // Init stars
  useEffect(() => {
    const stars = Array.from({ length: 60 }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      size: Math.random() * 1.5 + 0.5,
      speed: 0.3 + Math.random() * 1.2,
      opacity: Math.random() * 0.7 + 0.3,
    }));
    gameRef.current.stars = stars;
  }, []);
  
  // Load progress
  useEffect(() => {
    (async () => {
      try {
        const r = await window.storage.get('matteo-progress');
        if (r?.value) setCompleted(JSON.parse(r.value));
      } catch (e) {}
    })();
  }, []);
  
  const saveProgress = async (newCompleted) => {
    try { await window.storage.set('matteo-progress', JSON.stringify(newCompleted)); } catch (e) {}
  };
  
  // Sync flags to ref
  useEffect(() => { gameRef.current.bossActive = bossActive; }, [bossActive]);
  useEffect(() => { gameRef.current.paused = paused || showQuestion || screen !== 'playing'; }, [paused, showQuestion, screen]);
  useEffect(() => { gameRef.current.soundOn = soundOn; }, [soundOn]);
  useEffect(() => { gameRef.current.waveNumber = waveNumber; }, [waveNumber]);
  
  const pickRandom = (arr, n) => {
    const copy = [...arr];
    const result = [];
    for (let i = 0; i < n && copy.length; i++) {
      const idx = Math.floor(Math.random() * copy.length);
      result.push(copy.splice(idx, 1)[0]);
    }
    return result;
  };
  
  const startMission = (t) => {
    if (t === 'exam') { startExam(); return; }
    
    let qs;
    if (t === 'ultimate') {
      const regularTopics = PLAYABLE_TOPICS.filter(x => x !== 'ultimate');
      const allMedium = regularTopics.flatMap(tp => QUESTIONS[tp].medium);
      const allHard = regularTopics.flatMap(tp => QUESTIONS[tp].hard);
      qs = [
        ...pickRandom(allMedium, 3),
        ...pickRandom(allHard, 4),
        ...pickRandom(allHard, 8),
      ];
    } else {
      const data = QUESTIONS[t];
      qs = [
        ...pickRandom(data.easy, 2),
        ...pickRandom(data.medium, 3),
        ...pickRandom(data.hard, 2),
        ...pickRandom([...data.hard, ...data.medium, ...data.easy], 8),
      ];
    }
    
    setTopic(t);
    setQuestions(qs);
    setQIdx(0);
    setScore(0);
    setHp(MAX_HP);
    setAliensKilled(0);
    setWaveNumber(1);
    setBossActive(false);
    setBossHp(getMaxBossHp(t));
    setShowQuestion(false);
    setFeedback(null);
    setPaused(false);
    setBestStreak(0);
    setActivePowerups({ shield: 0, rapid: 0, triple: 0 });
    
    if (bossQuestionTimerRef.current) clearTimeout(bossQuestionTimerRef.current);
    
    const game = gameRef.current;
    game.aliens = [];
    game.bullets = [];
    game.enemyBullets = [];
    game.particles = [];
    game.powerups = [];
    game.damageNumbers = [];
    game.boss = null;
    game.bossActive = false;
    game.player.x = W / 2;
    game.player.y = H - 80;
    game.player.invuln = 90;
    game.spawnTimers = { alien: 30 };
    game.flash = 0;
    game.shake = 0;
    game.killCount = 0;
    game.triggerQuestion = false;
    game.killPulse = 0;
    game.activePowerups = { shield: 0, rapid: 0, triple: 0 };
    game.pendingHpChange = 0;
    game.pendingNuke = false;
    
    setScreen('playing');
  };
  
  const startBoss = () => {
    const maxHp = getMaxBossHp(topic);
    const phaseHp = getBossPhaseHp(topic);
    setBossActive(true);
    setBossHp(maxHp);
    const game = gameRef.current;
    game.boss = {
      x: W / 2, y: 100, vx: 2, vy: 0, radius: 38,
      lastShot: Date.now() + 1500,
      attackPhase: 0, wobble: 0,
      phaseHp, maxPhaseHp: phaseHp,
    };
    game.aliens = [];
    game.enemyBullets = [];
    game.bullets = [];
    game.bossActive = true;
    game.killCount = 0;
    game.triggerQuestion = false;
    // Automatic shield bonus on boss entry — protects during boss intro
    game.activePowerups.shield = Date.now() + BOSS_SHIELD_DURATION;
    playSound('boss', soundOn);
    
    if (bossQuestionTimerRef.current) clearTimeout(bossQuestionTimerRef.current);
  };
  
  // ============ EXAM SIMULATOR ============
  
  const startExam = () => {
    const allMedium = PLAYABLE_TOPICS.flatMap(tp => QUESTIONS[tp].medium);
    const allHard = PLAYABLE_TOPICS.flatMap(tp => QUESTIONS[tp].hard);
    const qs = [
      ...pickRandom(allMedium, 4),
      ...pickRandom(allHard, 6),
    ];
    // Shuffle final order
    for (let i = qs.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [qs[i], qs[j]] = [qs[j], qs[i]];
    }
    
    setTopic('exam');
    setQuestions(qs);
    setQIdx(0);
    setScore(0);
    setExamTimer(EXAM_TIMER_SECONDS);
    setExamLives(EXAM_LIVES);
    setExamCorrect(0);
    setExamFeedback(null);
    setExamStartTs(Date.now());
    setExamDuration(0);
    setScreen('exam');
  };
  
  const advanceExam = (livesAfter) => {
    setExamFeedback(null);
    const nextIdx = qIdx + 1;
    if (livesAfter <= 0 || nextIdx >= EXAM_QUESTION_COUNT) {
      setExamDuration(Date.now() - examStartTs);
      setScreen('examResults');
    } else {
      setQIdx(nextIdx);
      setExamTimer(EXAM_TIMER_SECONDS);
    }
  };
  
  const handleExamAnswer = (answer) => {
    if (examFeedback) return;
    const q = questions[qIdx];
    if (!q) return;
    const correct = answer === q.a;
    
    if (correct) {
      const timeBonus = Math.max(0, examTimer * 8);
      const points = 100 + timeBonus;
      setScore(s => s + points);
      setExamCorrect(c => c + 1);
      playSound('correct', soundOn);
      setExamFeedback({ type: 'correct', text: '✓ CORRECT', points, time: examTimer });
      setTimeout(() => advanceExam(examLives), 1300);
    } else {
      playSound('wrong', soundOn);
      setExamLives(prev => {
        const newLives = prev - 1;
        setExamFeedback({ type: 'wrong', text: '✗ WRONG', correct: q.a, hint: q.hint, livesLeft: newLives });
        setTimeout(() => advanceExam(newLives), 1800);
        return newLives;
      });
    }
  };
  
  // Exam timer countdown
  useEffect(() => {
    if (screen !== 'exam') return;
    if (examFeedback) return;
    if (examTimer <= 0) return;
    
    const t = setTimeout(() => {
      setExamTimer(prev => Math.max(0, prev - 1));
    }, 1000);
    return () => clearTimeout(t);
  }, [screen, examTimer, examFeedback]);
  
  // Exam tick sound when timer low
  useEffect(() => {
    if (screen !== 'exam') return;
    if (examFeedback) return;
    if (examTimer <= 0) return;
    if (examTimer <= EXAM_CRITICAL_TIMER) playSound('tickHigh', soundOn);
    else if (examTimer <= EXAM_LOW_TIMER) playSound('tick', soundOn);
  }, [examTimer, screen, examFeedback, soundOn]);
  
  // Exam timeout handler
  useEffect(() => {
    if (screen !== 'exam') return;
    if (examFeedback) return;
    if (examTimer === 0) {
      const q = questions[qIdx];
      if (!q) return;
      playSound('wrong', soundOn);
      setExamLives(prev => {
        const newLives = prev - 1;
        setExamFeedback({ type: 'timeout', text: '⏱ TIME UP!', correct: q.a, hint: q.hint, livesLeft: newLives });
        setTimeout(() => advanceExam(newLives), 1800);
        return newLives;
      });
    }
  }, [examTimer, screen, examFeedback]);
  
  // Keyboard
  useEffect(() => {
    const onDown = (e) => {
      const k = e.key.toLowerCase();
      gameRef.current.keys[k] = true;
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(k)) e.preventDefault();
    };
    const onUp = (e) => { gameRef.current.keys[e.key.toLowerCase()] = false; };
    // If the window loses focus (alt-tab, click away) keys can get
    // "stuck" down — the ship drifts on its own. Clear them on blur.
    const clearKeys = () => { gameRef.current.keys = {}; };
    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup', onUp);
    window.addEventListener('blur', clearKeys);
    return () => {
      window.removeEventListener('keydown', onDown);
      window.removeEventListener('keyup', onUp);
      window.removeEventListener('blur', clearKeys);
    };
  }, []);
  
  // Also clear held keys whenever the game pauses, a question modal
  // opens, or we leave the playing screen — otherwise the ship keeps
  // moving the instant play resumes.
  useEffect(() => {
    if (paused || showQuestion || screen !== 'playing') {
      gameRef.current.keys = {};
    }
  }, [paused, showQuestion, screen]);
  
  // Pointer
  // On touch, lift the ship ~78px above the finger so the thumb
  // doesn't cover the ship, its bullets, or incoming fire.
  const TOUCH_Y_OFFSET = 78;
  const updatePointer = (clientX, clientY, isTouch = false) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * W;
    let y = ((clientY - rect.top) / rect.height) * H;
    if (isTouch) y -= TOUCH_Y_OFFSET;
    gameRef.current.pointer.x = x;
    gameRef.current.pointer.y = y;
    gameRef.current.pointer.active = true;
  };
  
  const handleMouseMove = (e) => updatePointer(e.clientX, e.clientY);
  const handleMouseDown = (e) => updatePointer(e.clientX, e.clientY);
  const handleMouseLeave = () => { gameRef.current.pointer.active = false; };
  
  // Native, non-passive touch listeners on the canvas.
  // React's onTouch* handlers are passive — calling preventDefault()
  // inside them throws a console error and doesn't reliably block
  // pull-to-refresh / scroll. Attaching natively with passive:false fixes it.
  useEffect(() => {
    if (screen !== 'playing') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const onStart = (e) => { e.preventDefault(); if (e.touches[0]) updatePointer(e.touches[0].clientX, e.touches[0].clientY, true); };
    const onMove = (e) => { e.preventDefault(); if (e.touches[0]) updatePointer(e.touches[0].clientX, e.touches[0].clientY, true); };
    const onEnd = (e) => { e.preventDefault(); gameRef.current.pointer.active = false; };
    canvas.addEventListener('touchstart', onStart, { passive: false });
    canvas.addEventListener('touchmove', onMove, { passive: false });
    canvas.addEventListener('touchend', onEnd, { passive: false });
    canvas.addEventListener('touchcancel', onEnd, { passive: false });
    return () => {
      canvas.removeEventListener('touchstart', onStart);
      canvas.removeEventListener('touchmove', onMove);
      canvas.removeEventListener('touchend', onEnd);
      canvas.removeEventListener('touchcancel', onEnd);
    };
  }, [screen]);
  
  // Game loop
  useEffect(() => {
    if (screen !== 'playing') {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      return;
    }
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    const tick = () => {
      const game = gameRef.current;
      if (!game.paused) updateGame(game);
      drawGame(ctx, game);
      animRef.current = requestAnimationFrame(tick);
    };
    
    animRef.current = requestAnimationFrame(tick);
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [screen]);
  
  useEffect(() => {
    return () => { if (bossQuestionTimerRef.current) clearTimeout(bossQuestionTimerRef.current); };
  }, []);
  
  // Bridge: ref → React state
  useEffect(() => {
    if (screen !== 'playing') return;
    const interval = setInterval(() => {
      const game = gameRef.current;
      
      if (game.killCount !== aliensKilled && !game.bossActive) {
        setAliensKilled(game.killCount);
      }
      
      if (game.triggerQuestion) {
        game.triggerQuestion = false;
        setShowQuestion(true);
      }
      
      if (game.pendingHpChange !== 0) {
        const change = game.pendingHpChange;
        game.pendingHpChange = 0;
        setHp(prev => {
          const newHp = Math.max(0, Math.min(MAX_HP, prev + change));
          if (newHp <= 0) {
            setTimeout(() => setScreen('gameOver'), 600);
          }
          return newHp;
        });
      }
      
      const now = Date.now();
      const newActive = {
        shield: Math.max(0, game.activePowerups.shield - now),
        rapid: Math.max(0, game.activePowerups.rapid - now),
        triple: Math.max(0, game.activePowerups.triple - now),
      };
      setActivePowerups(prev => {
        if (prev.shield === newActive.shield && prev.rapid === newActive.rapid && prev.triple === newActive.triple) return prev;
        return newActive;
      });
    }, 80);
    return () => clearInterval(interval);
  }, [screen, aliensKilled]);
  
  const updateGame = (game) => {
    const p = game.player;
    const keys = game.keys;
    const speed = 4.5;
    const now = Date.now();
    
    const keyboardActive = keys.arrowleft || keys.arrowright || keys.arrowup || keys.arrowdown || keys.a || keys.d || keys.w || keys.s;
    if (keyboardActive) {
      game.pointer.active = false;
      if (keys.arrowleft || keys.a) p.x -= speed;
      if (keys.arrowright || keys.d) p.x += speed;
      if (keys.arrowup || keys.w) p.y -= speed;
      if (keys.arrowdown || keys.s) p.y += speed;
    } else if (game.pointer.active && game.pointer.x !== null) {
      const dx = game.pointer.x - p.x;
      const dy = game.pointer.y - p.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > 2) {
        const moveSpeed = Math.min(dist * 0.25, 8);
        p.x += (dx / dist) * moveSpeed;
        p.y += (dy / dist) * moveSpeed;
      }
    }
    p.x = Math.max(p.radius, Math.min(W - p.radius, p.x));
    p.y = Math.max(p.radius, Math.min(H - p.radius, p.y));
    
    const isRapid = game.activePowerups.rapid > now;
    const isTriple = game.activePowerups.triple > now;
    const shootInterval = isRapid ? 100 : 200;
    
    if (now - p.lastShot > shootInterval) {
      if (isTriple) {
        game.bullets.push({ x: p.x - 10, y: p.y - p.radius, vx: -0.8, vy: -9, radius: 3 });
        game.bullets.push({ x: p.x, y: p.y - p.radius, vx: 0, vy: -10, radius: 3 });
        game.bullets.push({ x: p.x + 10, y: p.y - p.radius, vx: 0.8, vy: -9, radius: 3 });
      } else {
        game.bullets.push({ x: p.x, y: p.y - p.radius, vx: 0, vy: -9, radius: 3 });
      }
      p.lastShot = now;
      if (Math.random() < 0.25) playSound('shoot', game.soundOn);
    }
    
    game.bullets = game.bullets.filter(b => {
      b.x += b.vx; b.y += b.vy;
      return b.y > -10 && b.x > -10 && b.x < W + 10;
    });
    
    game.enemyBullets = game.enemyBullets.filter(b => {
      b.x += b.vx; b.y += b.vy;
      return b.y < H + 10 && b.x > -20 && b.x < W + 20 && b.y > -20;
    });
    
    if (!game.bossActive) {
      game.spawnTimers.alien--;
      if (game.spawnTimers.alien <= 0) {
        const diff = Math.min(game.waveNumber, 4);
        const num = Math.random() < 0.2 + diff * 0.05 ? 2 : 1;
        for (let i = 0; i < num; i++) {
          game.aliens.push({
            x: 40 + Math.random() * (W - 80),
            y: -30 - i * 40,
            vx: (Math.random() - 0.5) * 1.5,
            vy: 0.7 + diff * 0.22 + Math.random() * 0.4,
            radius: 17,
            lastShot: now + Math.random() * 500,
            shotInterval: 1900 - diff * 220,
            type: Math.random() < 0.5 ? 'red' : 'green',
            wobble: Math.random() * Math.PI * 2,
          });
        }
        game.spawnTimers.alien = Math.max(45, 100 - diff * 10);
      }
    }
    
    game.aliens = game.aliens.filter(a => {
      a.wobble += 0.06;
      a.x += a.vx + Math.sin(a.wobble) * 0.4;
      a.y += a.vy;
      if (a.x < a.radius || a.x > W - a.radius) a.vx *= -1;
      
      if (now - a.lastShot > a.shotInterval && a.y > 30 && a.y < H * 0.7) {
        const dx = p.x - a.x;
        const dy = p.y - a.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const bs = 3.5;
        game.enemyBullets.push({
          x: a.x, y: a.y + a.radius,
          vx: (dx / dist) * bs, vy: (dy / dist) * bs, radius: 4,
        });
        a.lastShot = now;
      }
      return a.y < H + 30;
    });
    
    if (game.bossActive && game.boss) {
      const boss = game.boss;
      boss.wobble += 0.025;
      boss.x += boss.vx;
      if (boss.x < 60) { boss.x = 60; boss.vx *= -1; }
      if (boss.x > W - 60) { boss.x = W - 60; boss.vx *= -1; }
      boss.y = 100 + Math.sin(boss.wobble) * 18;
      
      if (now - boss.lastShot > 700) {
        boss.attackPhase = (boss.attackPhase + 1) % 3;
        const dx = p.x - boss.x;
        const dy = p.y - boss.y;
        const baseAngle = Math.atan2(dy, dx);
        
        if (boss.attackPhase === 0) {
          for (let i = -2; i <= 2; i++) {
            const angle = baseAngle + i * 0.18;
            game.enemyBullets.push({
              x: boss.x, y: boss.y + boss.radius,
              vx: Math.cos(angle) * 4, vy: Math.sin(angle) * 4,
              radius: 5, isBoss: true,
            });
          }
        } else if (boss.attackPhase === 1) {
          game.enemyBullets.push({
            x: boss.x, y: boss.y + boss.radius,
            vx: Math.cos(baseAngle) * 6, vy: Math.sin(baseAngle) * 6,
            radius: 6, isBoss: true,
          });
        } else {
          for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            game.enemyBullets.push({
              x: boss.x, y: boss.y,
              vx: Math.cos(angle) * 3, vy: Math.sin(angle) * 3,
              radius: 5, isBoss: true,
            });
          }
        }
        boss.lastShot = now;
      }
    }
    
    // === COLLISIONS ===
    
    for (let i = game.aliens.length - 1; i >= 0; i--) {
      const a = game.aliens[i];
      let hit = false;
      for (let j = game.bullets.length - 1; j >= 0; j--) {
        const b = game.bullets[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        if (Math.sqrt(dx * dx + dy * dy) < a.radius + b.radius) {
          game.bullets.splice(j, 1);
          hit = true;
          break;
        }
      }
      if (hit) {
        const wasOnScreen = a.y > 0;
        spawnParticles(game, a.x, a.y, a.type === 'red' ? '#ef4444' : '#10b981', 14);
        
        if (Math.random() < POWERUP_DROP_CHANCE) {
          const type = POWERUP_TYPES[Math.floor(Math.random() * POWERUP_TYPES.length)];
          game.powerups.push({
            x: a.x, y: a.y, vx: 0, vy: 1.4,
            radius: 14, type, bob: 0, life: 600,
          });
        }
        
        game.aliens.splice(i, 1);
        playSound('kill', game.soundOn);
        setScore(s => s + 50);
        
        if (!game.bossActive && wasOnScreen) {
          game.killCount += 1;
          game.killPulse = 12;
          if (game.killCount >= ALIENS_PER_WAVE) {
            game.killCount = 0;
            game.triggerQuestion = true;
          }
        }
      }
    }
    
    if (game.bossActive && game.boss) {
      const boss = game.boss;
      for (let j = game.bullets.length - 1; j >= 0; j--) {
        const b = game.bullets[j];
        const dx = boss.x - b.x;
        const dy = boss.y - b.y;
        if (Math.sqrt(dx * dx + dy * dy) < boss.radius + b.radius) {
          spawnParticles(game, b.x, b.y, '#fbbf24', 3);
          game.bullets.splice(j, 1);
          if (boss.phaseHp > 0) {
            boss.phaseHp -= 1;
            if (Math.random() < 0.06) {
              const type = POWERUP_TYPES[Math.floor(Math.random() * POWERUP_TYPES.length)];
              game.powerups.push({
                x: boss.x + (Math.random() - 0.5) * 40,
                y: boss.y + boss.radius - 4,
                vx: (Math.random() - 0.5) * 1.2, vy: 1.3,
                radius: 14, type, bob: Math.random() * Math.PI * 2, life: 600,
              });
            }
            if (boss.phaseHp <= 0) {
              boss.phaseHp = 0;
              spawnParticles(game, boss.x, boss.y, '#fbbf24', 32);
              game.flash = 22;
              game.flashColor = '#fbbf24';
              game.shake = 18;
              game.triggerQuestion = true;
              playSound('boss', game.soundOn);
              const type = POWERUP_TYPES[Math.floor(Math.random() * POWERUP_TYPES.length)];
              game.powerups.push({
                x: boss.x, y: boss.y + boss.radius,
                vx: 0, vy: 1.5,
                radius: 14, type, bob: Math.random() * Math.PI * 2, life: 600,
              });
            }
          }
        }
      }
    }
    
    for (let i = game.powerups.length - 1; i >= 0; i--) {
      const pu = game.powerups[i];
      pu.y += pu.vy;
      pu.bob += 0.1;
      pu.life--;
      if (pu.y > H + 20 || pu.life <= 0) {
        game.powerups.splice(i, 1);
        continue;
      }
      const dx = pu.x - p.x;
      const dy = pu.y - p.y;
      if (Math.sqrt(dx * dx + dy * dy) < pu.radius + p.radius) {
        applyPowerup(game, pu.type);
        game.powerups.splice(i, 1);
      }
    }
    
    game.damageNumbers = game.damageNumbers.filter(dn => {
      dn.y += dn.vy;
      dn.vy *= 0.95;
      dn.life--;
      return dn.life > 0;
    });
    
    const shieldActive = game.activePowerups.shield > now;
    
    if (p.invuln > 0) p.invuln--;
    if (p.invuln <= 0 && !shieldActive) {
      for (let j = game.enemyBullets.length - 1; j >= 0; j--) {
        const b = game.enemyBullets[j];
        const dx = b.x - p.x;
        const dy = b.y - p.y;
        if (Math.sqrt(dx * dx + dy * dy) < b.radius + p.radius - 5) {
          game.enemyBullets.splice(j, 1);
          const dmg = b.isBoss ? DMG_BOSS_BULLET : DMG_BULLET;
          damagePlayer(game, dmg);
          break;
        }
      }
    } else if (shieldActive) {
      for (let j = game.enemyBullets.length - 1; j >= 0; j--) {
        const b = game.enemyBullets[j];
        const dx = b.x - p.x;
        const dy = b.y - p.y;
        if (Math.sqrt(dx * dx + dy * dy) < b.radius + p.radius + 8) {
          game.enemyBullets.splice(j, 1);
          spawnParticles(game, b.x, b.y, '#60a5fa', 6);
        }
      }
    }
    
    if (p.invuln <= 0 && !shieldActive) {
      for (let i = game.aliens.length - 1; i >= 0; i--) {
        const a = game.aliens[i];
        const dx = a.x - p.x;
        const dy = a.y - p.y;
        if (Math.sqrt(dx * dx + dy * dy) < a.radius + p.radius - 4) {
          spawnParticles(game, a.x, a.y, '#ef4444', 16);
          game.aliens.splice(i, 1);
          damagePlayer(game, DMG_ALIEN);
          break;
        }
      }
    } else if (shieldActive) {
      for (let i = game.aliens.length - 1; i >= 0; i--) {
        const a = game.aliens[i];
        const dx = a.x - p.x;
        const dy = a.y - p.y;
        if (Math.sqrt(dx * dx + dy * dy) < a.radius + p.radius + 4) {
          spawnParticles(game, a.x, a.y, '#60a5fa', 14);
          game.aliens.splice(i, 1);
          setScore(s => s + 30);
          if (!game.bossActive) {
            game.killCount += 1;
            game.killPulse = 10;
            if (game.killCount >= ALIENS_PER_WAVE) {
              game.killCount = 0;
              game.triggerQuestion = true;
            }
          }
        }
      }
    }
    
    game.particles = game.particles.filter(part => {
      part.x += part.vx; part.y += part.vy;
      part.vx *= 0.94; part.vy *= 0.94;
      part.life--;
      return part.life > 0;
    });
    
    game.stars.forEach(s => {
      s.y += s.speed;
      if (s.y > H) { s.y = -2; s.x = Math.random() * W; }
    });
    
    if (game.shake > 0) game.shake--;
    if (game.flash > 0) game.flash--;
    if (game.killPulse > 0) game.killPulse--;
  };
  
  const damagePlayer = (game, dmg) => {
    const p = game.player;
    spawnParticles(game, p.x, p.y, '#ef4444', 14);
    p.invuln = 50;
    game.shake = 14;
    game.flash = 14;
    game.flashColor = '#ef4444';
    game.damageNumbers.push({
      x: p.x, y: p.y - 30, vy: -2, life: 45, text: `-${dmg}`, color: '#ef4444',
    });
    game.pendingHpChange -= dmg;
    playSound('hit', game.soundOn);
  };
  
  const applyPowerup = (game, type) => {
    const p = game.player;
    const now = Date.now();
    const info = POWERUP_INFO[type];
    
    spawnParticles(game, p.x, p.y, info.glow, 18);
    game.flash = 8;
    game.flashColor = info.color;
    
    if (type === 'shield' || type === 'rapid' || type === 'triple') {
      game.activePowerups[type] = now + POWERUP_DURATIONS[type];
      game.damageNumbers.push({
        x: p.x, y: p.y - 30, vy: -2, life: 60,
        text: info.name + '!', color: info.glow,
      });
      playSound('powerup', game.soundOn);
    } else if (type === 'health') {
      game.pendingHpChange += HEALTH_RESTORE;
      game.damageNumbers.push({
        x: p.x, y: p.y - 30, vy: -2, life: 60,
        text: `+${HEALTH_RESTORE} HP`, color: '#10b981',
      });
      playSound('heal', game.soundOn);
    } else if (type === 'nuke') {
      game.aliens.forEach(a => {
        spawnParticles(game, a.x, a.y, '#fbbf24', 18);
      });
      game.enemyBullets = [];
      const killed = game.aliens.length;
      game.aliens = [];
      game.flash = 25;
      game.flashColor = '#fbbf24';
      game.shake = 22;
      setScore(s => s + killed * 30);
      if (!game.bossActive) {
        const needed = ALIENS_PER_WAVE - game.killCount;
        const counted = Math.min(killed, needed);
        game.killCount += counted;
        if (game.killCount >= ALIENS_PER_WAVE) {
          game.killCount = 0;
          game.triggerQuestion = true;
        }
      }
      game.damageNumbers.push({
        x: p.x, y: p.y - 30, vy: -2, life: 60,
        text: 'NUKE!', color: '#fb923c',
      });
      playSound('nuke', game.soundOn);
    }
  };
  
  const spawnParticles = (game, x, y, color, count) => {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 4;
      game.particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        life: 25 + Math.random() * 20,
        maxLife: 45,
        radius: 1.5 + Math.random() * 2,
      });
    }
  };
  
  const drawPowerup = (ctx, pu) => {
    const info = POWERUP_INFO[pu.type];
    const bobY = pu.y + Math.sin(pu.bob) * 3;
    const pulse = 1 + Math.sin(pu.bob * 2) * 0.1;
    const r = pu.radius * pulse;
    const fade = pu.life < 90 ? (Math.sin(pu.bob * 3) > 0 ? 0.4 : 1) : 1;
    
    ctx.save();
    ctx.globalAlpha = fade;
    
    const grad = ctx.createRadialGradient(pu.x, bobY, 0, pu.x, bobY, r * 2.2);
    grad.addColorStop(0, info.glow + 'cc');
    grad.addColorStop(1, info.glow + '00');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(pu.x, bobY, r * 2.2, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = info.color;
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2 + pu.bob * 0.3;
      const px = pu.x + Math.cos(angle) * r;
      const py = bobY + Math.sin(angle) * r;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(info.symbol, pu.x, bobY);
    
    ctx.restore();
  };
  
  const drawGame = (ctx, game) => {
    let sx = 0, sy = 0;
    if (game.shake > 0) {
      sx = (Math.random() - 0.5) * game.shake;
      sy = (Math.random() - 0.5) * game.shake;
    }
    
    ctx.save();
    ctx.translate(sx, sy);
    
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    if (game.bossActive) {
      grad.addColorStop(0, '#3b0000');
      grad.addColorStop(1, '#0a0010');
    } else {
      grad.addColorStop(0, '#0a0a2a');
      grad.addColorStop(1, '#0a0015');
    }
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
    
    game.stars.forEach(s => {
      ctx.globalAlpha = s.opacity;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(s.x, s.y, s.size, s.size);
    });
    ctx.globalAlpha = 1;
    
    game.particles.forEach(p => {
      ctx.globalAlpha = p.life / p.maxLife;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
    
    game.powerups.forEach(pu => drawPowerup(ctx, pu));
    
    game.aliens.forEach(a => {
      ctx.save();
      ctx.translate(a.x, a.y);
      const isRed = a.type === 'red';
      const main = isRed ? '#dc2626' : '#16a34a';
      const light = isRed ? '#fca5a5' : '#86efac';
      
      ctx.fillStyle = main;
      ctx.beginPath();
      ctx.arc(0, -2, a.radius, Math.PI, 0);
      ctx.lineTo(a.radius, 4);
      for (let i = 4; i >= -4; i--) {
        const tx = (i / 4) * a.radius;
        const ty = i % 2 === 0 ? 8 : 2;
        ctx.lineTo(tx, ty);
      }
      ctx.closePath();
      ctx.fill();
      
      ctx.fillStyle = light;
      ctx.beginPath();
      ctx.arc(-5, -8, 4, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(-6, -3, 4, 0, Math.PI * 2);
      ctx.arc(6, -3, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(-6, -3, 2, 0, Math.PI * 2);
      ctx.arc(6, -3, 2, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.restore();
    });
    
    if (game.bossActive && game.boss) {
      const boss = game.boss;
      ctx.save();
      ctx.translate(boss.x, boss.y);
      
      const bg = ctx.createRadialGradient(0, 0, 0, 0, 0, boss.radius * 2);
      bg.addColorStop(0, 'rgba(220, 38, 38, 0.6)');
      bg.addColorStop(1, 'rgba(220, 38, 38, 0)');
      ctx.fillStyle = bg;
      ctx.beginPath();
      ctx.arc(0, 0, boss.radius * 2, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, boss.radius + 4, 0, Math.PI * 2);
      ctx.stroke();
      
      ctx.fillStyle = '#7f1d1d';
      ctx.beginPath();
      ctx.arc(0, 0, boss.radius, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.fillStyle = '#dc2626';
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2 + boss.wobble;
        const px = Math.cos(angle) * boss.radius;
        const py = Math.sin(angle) * boss.radius;
        const ex = Math.cos(angle) * (boss.radius + 8);
        const ey = Math.sin(angle) * (boss.radius + 8);
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(ex, ey);
        ctx.lineTo(Math.cos(angle + 0.2) * boss.radius, Math.sin(angle + 0.2) * boss.radius);
        ctx.closePath();
        ctx.fill();
      }
      
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.arc(-14, -4, 7, 0, Math.PI * 2);
      ctx.arc(14, -4, 7, 0, Math.PI * 2);
      ctx.arc(0, 12, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.arc(-14, -4, 3, 0, Math.PI * 2);
      ctx.arc(14, -4, 3, 0, Math.PI * 2);
      ctx.arc(0, 12, 3, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.restore();
      
      // Phase shield HP bar above boss
      const barW = 90;
      const barH = 8;
      const phasePct = boss.maxPhaseHp ? Math.max(0, boss.phaseHp / boss.maxPhaseHp) : 0;
      const bx = boss.x - barW / 2;
      const by = boss.y - boss.radius - 22;
      
      ctx.fillStyle = '#fef3c7';
      ctx.font = 'bold 9px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 3;
      ctx.strokeText('SHIELD', boss.x, by - 4);
      ctx.fillText('SHIELD', boss.x, by - 4);
      
      ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
      ctx.fillRect(bx - 1, by - 1, barW + 2, barH + 2);
      ctx.fillStyle = '#1f2937';
      ctx.fillRect(bx, by, barW, barH);
      const phaseColor = phasePct > 0.5 ? '#fbbf24' : phasePct > 0.25 ? '#f97316' : '#dc2626';
      ctx.fillStyle = phaseColor;
      ctx.fillRect(bx, by, barW * phasePct, barH);
      ctx.strokeStyle = '#fef3c7';
      ctx.lineWidth = 1;
      ctx.strokeRect(bx, by, barW, barH);
    }
    
    const isTriple = game.activePowerups.triple > Date.now();
    const isRapid = game.activePowerups.rapid > Date.now();
    const bulletColor = isTriple ? '#c084fc' : isRapid ? '#fde047' : '#67e8f9';
    const bulletGlow = isTriple ? '#a855f7' : isRapid ? '#fbbf24' : '#22d3ee';
    
    game.bullets.forEach(b => {
      ctx.shadowColor = bulletGlow;
      ctx.shadowBlur = 12;
      ctx.fillStyle = bulletColor;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.radius - 1, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.shadowBlur = 0;
    
    game.enemyBullets.forEach(b => {
      ctx.shadowColor = b.isBoss ? '#fbbf24' : '#ef4444';
      ctx.shadowBlur = 10;
      ctx.fillStyle = b.isBoss ? '#fbbf24' : '#ef4444';
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.radius * 0.4, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.shadowBlur = 0;
    
    const p = game.player;
    const shieldActive = game.activePowerups.shield > Date.now();
    
    if (p.invuln === 0 || Math.floor(p.invuln / 4) % 2 === 0) {
      ctx.save();
      ctx.translate(p.x, p.y);
      
      const flameLen = 8 + Math.random() * 6;
      const fg = ctx.createLinearGradient(0, p.radius * 0.4, 0, p.radius * 0.4 + flameLen);
      fg.addColorStop(0, '#fbbf24');
      fg.addColorStop(0.5, '#f97316');
      fg.addColorStop(1, 'rgba(239, 68, 68, 0)');
      ctx.fillStyle = fg;
      ctx.beginPath();
      ctx.moveTo(-5, p.radius * 0.4);
      ctx.lineTo(0, p.radius * 0.4 + flameLen);
      ctx.lineTo(5, p.radius * 0.4);
      ctx.closePath();
      ctx.fill();
      
      ctx.fillStyle = '#0e7490';
      ctx.beginPath();
      ctx.moveTo(-p.radius, p.radius * 0.5);
      ctx.lineTo(-p.radius * 0.5, 0);
      ctx.lineTo(-p.radius * 0.3, p.radius * 0.6);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(p.radius, p.radius * 0.5);
      ctx.lineTo(p.radius * 0.5, 0);
      ctx.lineTo(p.radius * 0.3, p.radius * 0.6);
      ctx.closePath();
      ctx.fill();
      
      ctx.fillStyle = '#06b6d4';
      ctx.beginPath();
      ctx.moveTo(0, -p.radius);
      ctx.lineTo(-p.radius * 0.55, p.radius * 0.5);
      ctx.lineTo(0, p.radius * 0.3);
      ctx.lineTo(p.radius * 0.55, p.radius * 0.5);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#a5f3fc';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.arc(0, -3, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fef3c7';
      ctx.beginPath();
      ctx.arc(-1, -4, 1.5, 0, Math.PI * 2);
      ctx.fill();
      
      if (p.invuln > 0 && !shieldActive) {
        ctx.strokeStyle = `rgba(103, 232, 249, ${0.5 + Math.sin(p.invuln * 0.3) * 0.3})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, p.radius + 6, 0, Math.PI * 2);
        ctx.stroke();
      }
      
      ctx.restore();
    }
    
    if (shieldActive) {
      const t = Date.now() * 0.005;
      const remaining = (game.activePowerups.shield - Date.now()) / 1000;
      const flicker = remaining < 1.5 ? Math.sin(Date.now() * 0.02) > 0 ? 1 : 0.4 : 1;
      
      ctx.save();
      ctx.translate(p.x, p.y);
      
      const sg = ctx.createRadialGradient(0, 0, p.radius, 0, 0, p.radius + 16);
      sg.addColorStop(0, `rgba(96, 165, 250, ${0.05 * flicker})`);
      sg.addColorStop(0.7, `rgba(96, 165, 250, ${0.4 * flicker})`);
      sg.addColorStop(1, `rgba(96, 165, 250, ${0.1 * flicker})`);
      ctx.fillStyle = sg;
      ctx.beginPath();
      ctx.arc(0, 0, p.radius + 14, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.strokeStyle = `rgba(147, 197, 253, ${0.9 * flicker})`;
      ctx.lineWidth = 2;
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.arc(0, 0, p.radius + 12 + Math.sin(t + i) * 2, 0, Math.PI * 2);
        ctx.stroke();
      }
      
      for (let i = 0; i < 6; i++) {
        const angle = t + (i / 6) * Math.PI * 2;
        const r = p.radius + 14;
        ctx.fillStyle = `rgba(219, 234, 254, ${0.8 * flicker})`;
        ctx.beginPath();
        ctx.arc(Math.cos(angle) * r, Math.sin(angle) * r, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
      
      ctx.restore();
    }
    
    game.damageNumbers.forEach(dn => {
      ctx.globalAlpha = Math.min(1, dn.life / 30);
      ctx.fillStyle = dn.color;
      ctx.font = 'bold 16px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 3;
      ctx.strokeText(dn.text, dn.x, dn.y);
      ctx.fillText(dn.text, dn.x, dn.y);
    });
    ctx.globalAlpha = 1;
    
    ctx.restore();
    
    if (game.flash > 0) {
      const c = game.flashColor;
      const r = parseInt(c.slice(1, 3), 16);
      const g = parseInt(c.slice(3, 5), 16);
      const b = parseInt(c.slice(5, 7), 16);
      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${game.flash / 32})`;
      ctx.fillRect(0, 0, W, H);
    }
  };
  
  const handleAnswer = (answer) => {
    const q = questions[qIdx % questions.length];
    const correct = answer === q.a;
    
    const restoreBossPhase = () => {
      const game = gameRef.current;
      if (game.bossActive && game.boss) {
        game.boss.phaseHp = game.boss.maxPhaseHp;
        game.triggerQuestion = false;
        // Shield bonus when re-entering boss combat phase
        game.activePowerups.shield = Date.now() + BOSS_SHIELD_DURATION;
      }
    };
    
    if (correct) {
      const points = bossActive ? 300 : 200;
      setScore(s => s + points);
      setBestStreak(b => b + 1);
      playSound('correct', soundOn);
      
      // Wave correct answer → bonus HP healing
      if (!bossActive) {
        setHp(prev => Math.min(MAX_HP, prev + HP_CORRECT_BONUS));
      }
      
      setFeedback({
        type: 'correct',
        text: '🎯 ON TARGET!',
        points,
        hpBonus: !bossActive ? HP_CORRECT_BONUS : 0,
        shieldBonus: bossActive,
      });
      
      if (bossActive) {
        const newHp = bossHp - 1;
        setBossHp(newHp);
        if (newHp <= 0) {
          setTimeout(() => {
            setShowQuestion(false);
            setFeedback(null);
            const newCompleted = { ...completed, [topic]: true };
            setCompleted(newCompleted);
            saveProgress(newCompleted);
            playSound('levelUp', soundOn);
            setScreen('victory');
          }, 1400);
          return;
        } else {
          setTimeout(() => {
            setShowQuestion(false);
            setFeedback(null);
            setQIdx(qi => qi + 1);
            restoreBossPhase();
          }, 1400);
        }
      } else {
        const nextQ = qIdx + 1;
        if (nextQ >= WAVES_BEFORE_BOSS) {
          setTimeout(() => {
            setShowQuestion(false);
            setFeedback(null);
            setQIdx(nextQ);
            startBoss();
          }, 1400);
        } else {
          setTimeout(() => {
            setShowQuestion(false);
            setFeedback(null);
            setQIdx(nextQ);
            setWaveNumber(w => w + 1);
            setAliensKilled(0);
            gameRef.current.killCount = 0;
          }, 1400);
        }
      }
    } else {
      playSound('wrong', soundOn);
      setFeedback({ type: 'wrong', text: '❌ MISSED!', correct: q.a, hint: q.hint });
      setHp(prev => {
        const newHp = Math.max(0, prev - DMG_WRONG);
        if (newHp <= 0) {
          setTimeout(() => {
            setShowQuestion(false);
            setScreen('gameOver');
          }, 2400);
          return newHp;
        }
        setTimeout(() => {
          setShowQuestion(false);
          setFeedback(null);
          if (bossActive) {
            setQIdx(qi => qi + 1);
            restoreBossPhase();
          } else {
            const nextQ = qIdx + 1;
            if (nextQ >= WAVES_BEFORE_BOSS) {
              setQIdx(nextQ);
              startBoss();
            } else {
              setQIdx(nextQ);
              setWaveNumber(w => w + 1);
              setAliensKilled(0);
              gameRef.current.killCount = 0;
            }
          }
        }, 2400);
        return newHp;
      });
    }
  };
  
  const completedCount = TOPICS_ORDER.filter(t => completed[t]).length;
  const allPlayableComplete = PLAYABLE_TOPICS.every(t => completed[t]);
  
  // ========== MENU ==========
  if (screen === 'menu') {
    return (
      <div className="w-full h-screen min-h-[600px] bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center overflow-hidden relative" style={{ height: '100dvh' }}>
        {/* PARENT DISCLAIMER — shows on every load, before the menu */}
        {showDisclaimer && (
          <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-cyan-400/50 rounded-2xl shadow-2xl max-w-md w-full p-5 sm:p-6 my-auto">
              <div className="inline-block px-3 py-1 mb-3 bg-amber-500/20 border border-amber-400 rounded-full text-amber-300 text-[10px] font-bold tracking-widest">
                A QUICK NOTE FOR PARENTS
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white mb-3 leading-tight">
                Welcome to Algebra Assault
              </h2>
              <div className="text-slate-300 text-sm space-y-2.5 mb-5">
                <p>
                  This is a <span className="text-cyan-300 font-semibold">free practice tool from MathCoach</span>, built to make Grade 10 algebra revision feel less like a chore.
                </p>
                <p>
                  It's a <span className="text-white font-semibold">supplement to learning, not a replacement</span> for teaching or tutoring. It covers core Grade 10 algebra suitable for CAPS, IEB and Cambridge learners — always check your child's specific test scope with their teacher.
                </p>
                <p>
                  This is an <span className="text-amber-300 font-semibold">early test version</span>. If something looks wrong or breaks, that feedback is exactly what we need. Thank you for testing it.
                </p>
              </div>
              <button
                onClick={() => setShowDisclaimer(false)}
                className="w-full bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 active:scale-95 text-white font-black text-lg py-3.5 rounded-xl shadow-lg border-2 border-white/20 transition-all touch-manipulation">
                Got it — Let's Play
              </button>
              <div className="text-center text-slate-500 text-[11px] mt-3">
                MathCoach · Grade 10 Algebra · CAPS / IEB / Cambridge
              </div>
            </div>
          </div>
        )}
        {Array.from({ length: 50 }).map((_, i) => (
          <div key={i} className="absolute rounded-full bg-white animate-twinkle"
            style={{
              left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`,
              width: `${Math.random() * 2 + 1}px`, height: `${Math.random() * 2 + 1}px`,
              opacity: Math.random() * 0.7 + 0.3, animationDelay: `${Math.random() * 3}s`
            }} />
        ))}
        
        <div className="text-center z-10 px-4">
          <div className="mb-2 inline-block px-4 py-1 bg-amber-500/20 border border-amber-400 rounded-full text-amber-300 text-xs font-bold tracking-widest">
            MATHCOACH PRESENTS
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-white mb-1 tracking-tight">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400">ALGEBRA</span>
          </h1>
          <h1 className="text-5xl md:text-7xl font-black text-white mb-3 tracking-tight">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-orange-400 to-amber-400">ASSAULT</span>
          </h1>
          <div className="text-lg text-cyan-300 mb-1 font-bold">⚡ MATTEO'S MATH MISSION ⚡</div>
          <div className="text-sm text-slate-300 mb-6">Grade 10 Algebra Practice · CAPS / IEB / Cambridge</div>
          
          <button onClick={() => setScreen('topicSelect')}
            className="group bg-gradient-to-r from-cyan-500 to-purple-600 text-white text-2xl font-black px-12 py-5 rounded-full shadow-2xl shadow-purple-500/50 hover:scale-110 active:scale-95 transition-all border-2 border-white/30">
            <span className="flex items-center gap-3">
              <Crosshair className="w-7 h-7 group-hover:rotate-180 transition-transform duration-500" />
              START MISSION
              <ChevronRight className="w-7 h-7 group-hover:translate-x-1 transition-transform" />
            </span>
          </button>
          
          <div className="mt-6 text-slate-400 text-xs space-y-1 max-w-xs mx-auto">
            <div>🚀 Mouse/drag or WASD/arrow keys to fly</div>
            <div>👾 Kill aliens, dodge bullets, solve math</div>
            <div>💎 Power-ups, boss fights, shield bonuses</div>
            <div>⏱ Try Exam Simulator for real test pressure</div>
          </div>
          
          <button onClick={() => setSoundOn(!soundOn)}
            className="mt-4 text-slate-400 hover:text-white transition-colors flex items-center gap-2 mx-auto text-sm">
            {soundOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            Sound: {soundOn ? 'ON' : 'OFF'}
          </button>
          
          <a href={SURVEY_URL} target="_blank" rel="noopener noreferrer"
            className="mt-3 inline-block bg-amber-500/20 hover:bg-amber-500/30 active:scale-95 border border-amber-400/60 text-amber-200 font-bold text-sm px-5 py-2.5 rounded-xl transition-all touch-manipulation">
            💬 Give Feedback
          </a>
        </div>
        
        <style>{`
          @keyframes twinkle { 0%, 100% { opacity: 0.3; } 50% { opacity: 1; } }
          .animate-twinkle { animation: twinkle 3s ease-in-out infinite; }
        `}</style>
      </div>
    );
  }
  
  // ========== TOPIC SELECT ==========
  if (screen === 'topicSelect') {
    return (
      <div className="w-full h-screen min-h-[600px] bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 overflow-y-auto relative">
        <div className="relative z-10 max-w-5xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => setScreen('menu')} className="text-slate-300 hover:text-white flex items-center gap-2 font-medium">
              <X className="w-5 h-5" /> Menu
            </button>
            <div className="text-right">
              <div className="text-xs text-slate-400 uppercase tracking-widest">Completed</div>
              <div className="text-2xl font-black text-white">{completedCount} / {TOPICS_ORDER.length}</div>
            </div>
          </div>
          
          <h2 className="text-3xl md:text-4xl font-black text-white mb-1">Choose Your Sector</h2>
          <p className="text-slate-300 mb-5 text-sm">All sectors unlocked • Power-ups • Shield bonuses in boss fights</p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-4">
            {TOPICS_ORDER.map((t, idx) => {
              const tt = QUESTIONS[t];
              const isDone = completed[t];
              const isExam = tt.isExam;
              const isUltimate = tt.isUltimate;
              return (
                <button key={t} onClick={() => startMission(t)}
                  className={`relative p-5 rounded-2xl text-left text-white shadow-xl transition-all border-2 bg-gradient-to-br ${tt.bgColor} hover:scale-105 active:scale-95 ${isDone ? 'border-emerald-400' : isExam ? 'border-red-400 ring-2 ring-red-400/40 animate-pulse-glow' : isUltimate ? 'border-amber-400 ring-2 ring-amber-400/40' : 'border-white/20'} touch-manipulation`}>
                  <div className="flex items-start justify-between mb-2">
                    <div className="text-4xl font-black opacity-90"><MathText>{tt.icon}</MathText></div>
                    {isDone && <div className="bg-emerald-500 rounded-full p-1.5 shadow-lg"><Check className="w-4 h-4 text-white" /></div>}
                    {isExam && !isDone && (
                      <div className="bg-red-500 rounded-full px-2 py-0.5 shadow-lg text-[9px] font-black text-white tracking-wider flex items-center gap-1">
                        <Timer className="w-2.5 h-2.5" /> TIMED
                      </div>
                    )}
                  </div>
                  <div className="text-[10px] font-black tracking-wider mb-0.5 text-white/70">SECTOR {idx + 1}</div>
                  <div className="text-xl font-black mb-0.5">{tt.name}</div>
                  <div className="text-xs opacity-80">
                    {isExam ? `${EXAM_QUESTION_COUNT} timed Q · ${EXAM_LIVES} lives` : '4 waves • boss'}
                  </div>
                  {isDone && <div className="text-xs mt-1 text-emerald-200 font-bold">✓ COMPLETED</div>}
                </button>
              );
            })}
          </div>
          
          {allPlayableComplete && (
            <div className="bg-gradient-to-br from-rose-600 via-red-700 to-amber-700 rounded-2xl p-5 border-2 border-amber-400 text-center animate-pulse-slow">
              <div className="text-4xl mb-2">👑</div>
              <div className="text-xl font-black text-white">ALL SHOOTER SECTORS CLEARED</div>
              <div className="text-sm text-white/90">Now prove it under exam pressure ⏱</div>
            </div>
          )}
        </div>
        
        <style>{`
          @keyframes pulse-slow { 0%, 100% { box-shadow: 0 0 20px rgba(251, 191, 36, 0.4); } 50% { box-shadow: 0 0 40px rgba(251, 191, 36, 0.8); } }
          .animate-pulse-slow { animation: pulse-slow 2s ease-in-out infinite; }
          @keyframes pulse-glow { 0%, 100% { box-shadow: 0 0 20px rgba(220, 38, 38, 0.3); } 50% { box-shadow: 0 0 40px rgba(220, 38, 38, 0.7); } }
          .animate-pulse-glow { animation: pulse-glow 2s ease-in-out infinite; }
          .math-sup { font-size: 0.62em; vertical-align: super; line-height: 0; margin-left: 0.5px; }
          .math-sub { font-size: 0.62em; vertical-align: sub; line-height: 0; margin-left: 0.5px; }
        `}</style>
      </div>
    );
  }
  
  // ========== EXAM SIMULATOR ==========
  if (screen === 'exam') {
    const q = questions[qIdx];
    if (!q) {
      return <div className="w-full h-screen bg-black flex items-center justify-center text-white">Loading...</div>;
    }
    
    const allAnswers = [q.a, ...q.wrong];
    const shuffled = [...allAnswers].sort((a, b) => {
      const ha = (a + qIdx).split('').reduce((s, c) => s + c.charCodeAt(0), 0);
      const hb = (b + qIdx).split('').reduce((s, c) => s + c.charCodeAt(0), 0);
      return ha - hb;
    });
    
    const timeLow = examTimer <= EXAM_LOW_TIMER;
    const timeCritical = examTimer <= EXAM_CRITICAL_TIMER;
    const timerPct = (examTimer / EXAM_TIMER_SECONDS) * 100;
    const timerColor = timeCritical ? 'text-red-500' : timeLow ? 'text-amber-400' : 'text-emerald-400';
    const timerBgColor = timeCritical ? 'from-red-500 to-red-700' : timeLow ? 'from-amber-400 to-orange-500' : 'from-emerald-400 to-emerald-600';
    
    return (
      <div className={`w-full h-screen min-h-[600px] bg-gradient-to-br from-red-950 via-black to-red-950 overflow-hidden relative ${timeCritical && !examFeedback ? 'animate-shake-fast' : ''}`} style={{ height: '100dvh' }}>
        {/* Pulsing red border indicating exam stress */}
        <div className={`absolute inset-0 pointer-events-none border-4 sm:border-8 ${timeCritical ? 'border-red-500 animate-pulse-fast' : timeLow ? 'border-red-600 animate-pulse' : 'border-red-700/50'}`} />
        
        {/* Background scanning effect */}
        <div className="absolute inset-0 pointer-events-none opacity-20"
          style={{
            backgroundImage: 'linear-gradient(transparent 50%, rgba(220,38,38,0.1) 50%)',
            backgroundSize: '100% 4px',
          }} />
        
        <div className="relative z-10 flex flex-col h-full p-3 sm:p-4 md:p-6">
          {/* Top HUD */}
          <div className="flex items-center justify-between mb-3 sm:mb-4 gap-2">
            <button onClick={() => {
              if (confirm('Abandon exam? Progress will be lost.')) setScreen('topicSelect');
            }} className="bg-white/10 hover:bg-white/20 active:bg-white/30 text-white p-2 rounded-full touch-manipulation">
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            
            <div className="text-center flex-1">
              <div className="text-[10px] sm:text-xs text-red-300 font-black tracking-widest uppercase">
                Exam Q {qIdx + 1} / {EXAM_QUESTION_COUNT}
              </div>
              <div className="text-[10px] sm:text-xs text-slate-400 tracking-widest">Score: <span className="text-amber-300 font-bold tabular-nums">{score}</span></div>
            </div>
            
            <div className="flex items-center gap-1">
              {Array.from({ length: EXAM_LIVES }).map((_, i) => (
                <Heart key={i} className={`w-4 h-4 sm:w-5 sm:h-5 ${i < examLives ? 'text-red-500 fill-red-500' : 'text-slate-700'} ${examLives <= 1 && i < examLives ? 'animate-pulse' : ''}`} />
              ))}
            </div>
          </div>
          
          {/* Question Progress Bar */}
          <div className="mb-3 sm:mb-4">
            <div className="h-1.5 bg-slate-900 rounded-full overflow-hidden border border-red-500/30">
              <div className="h-full bg-gradient-to-r from-red-500 to-amber-500 transition-all duration-500"
                style={{ width: `${((qIdx + 1) / EXAM_QUESTION_COUNT) * 100}%` }} />
            </div>
          </div>
          
          {/* Big Timer */}
          <div className="text-center mb-4 sm:mb-6">
            <div className="text-[10px] sm:text-xs text-slate-400 uppercase tracking-widest mb-1 flex items-center justify-center gap-1.5">
              <Timer className="w-3 h-3" /> Time Remaining
            </div>
            <div className={`text-6xl sm:text-7xl md:text-8xl font-black tabular-nums leading-none ${timerColor} ${timeCritical ? 'animate-pulse-fast' : ''}`}
              style={{ textShadow: timeCritical ? '0 0 20px rgba(239,68,68,0.8)' : timeLow ? '0 0 15px rgba(251,191,36,0.5)' : 'none' }}>
              {examTimer}
            </div>
            <div className="text-[10px] sm:text-xs text-slate-400 uppercase tracking-widest">seconds</div>
            
            {/* Timer bar */}
            <div className="mt-2 max-w-xs mx-auto h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-700">
              <div className={`h-full bg-gradient-to-r ${timerBgColor} transition-all duration-1000 ease-linear`}
                style={{ width: `${timerPct}%` }} />
            </div>
          </div>
          
          {/* Question */}
          <div className="flex-1 flex items-center justify-center mb-3 sm:mb-4">
            <div className={`bg-black/70 backdrop-blur-sm rounded-2xl p-5 sm:p-6 md:p-8 border-2 ${timeCritical ? 'border-red-500 shadow-lg shadow-red-500/50' : 'border-red-500/40'} max-w-2xl w-full`}>
              <div className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-white text-center font-mono whitespace-pre-line leading-tight">
                <MathText>{q.q}</MathText>
              </div>
            </div>
          </div>
          
          {/* Feedback or Answers */}
          {examFeedback ? (
            <div className={`max-w-2xl mx-auto w-full text-center p-4 sm:p-5 rounded-2xl border-2 ${
              examFeedback.type === 'correct' ? 'bg-emerald-500/30 border-emerald-300' :
              examFeedback.type === 'timeout' ? 'bg-orange-500/30 border-orange-300' :
              'bg-red-500/30 border-red-300'
            } animate-pulse-fast`}>
              <div className="text-2xl sm:text-3xl font-black text-white mb-1">{examFeedback.text}</div>
              {examFeedback.points && <div className="text-base sm:text-lg font-bold text-yellow-300">+{examFeedback.points} <span className="text-xs text-white/70">(+{examFeedback.time}s bonus)</span></div>}
              {examFeedback.correct && examFeedback.type !== 'correct' && <div className="text-sm sm:text-base text-white mt-2">Correct: <span className="font-bold"><MathText>{examFeedback.correct}</MathText></span></div>}
              {examFeedback.hint && <div className="text-xs sm:text-sm text-white/90 mt-1">💡 {examFeedback.hint}</div>}
              {examFeedback.livesLeft !== undefined && (
                <div className="text-xs sm:text-sm text-red-200 mt-2 font-bold">
                  {examFeedback.livesLeft > 0 ? `${examFeedback.livesLeft} ${examFeedback.livesLeft === 1 ? 'life' : 'lives'} remaining` : 'No lives left — exam over'}
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 sm:gap-3 max-w-2xl mx-auto w-full">
              {shuffled.map((ans, i) => (
                <button key={i} onClick={() => handleExamAnswer(ans)}
                  className="bg-white hover:bg-yellow-200 active:scale-95 active:bg-yellow-300 text-slate-900 font-mono font-black text-base sm:text-lg md:text-xl px-3 py-4 sm:py-5 md:py-6 rounded-xl shadow-lg border-2 border-slate-900 transition-all touch-manipulation">
                  <MathText>{ans}</MathText>
                </button>
              ))}
            </div>
          )}
        </div>
        
        <style>{`
          @keyframes pulse-fast { 0%, 100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.04); opacity: 0.85; } }
          .animate-pulse-fast { animation: pulse-fast 0.6s ease-in-out infinite; }
          @keyframes shake-fast { 0%, 100% { transform: translate(0, 0); } 25% { transform: translate(-2px, 1px); } 50% { transform: translate(2px, -1px); } 75% { transform: translate(-1px, -1px); } }
          .animate-shake-fast { animation: shake-fast 0.2s ease-in-out infinite; }
          .math-sup { font-size: 0.62em; vertical-align: super; line-height: 0; margin-left: 0.5px; }
          .math-sub { font-size: 0.62em; vertical-align: sub; line-height: 0; margin-left: 0.5px; }
        `}</style>
      </div>
    );
  }
  
  // ========== EXAM RESULTS ==========
  if (screen === 'examResults') {
    const correctPct = (examCorrect / EXAM_QUESTION_COUNT) * 100;
    const grade = correctPct >= 90 ? 'A+' : correctPct >= 80 ? 'A' : correctPct >= 70 ? 'B' : correctPct >= 60 ? 'C' : correctPct >= 50 ? 'D' : 'F';
    const gradeColor = correctPct >= 80 ? 'text-emerald-400' : correctPct >= 60 ? 'text-amber-400' : 'text-red-400';
    const passed = correctPct >= 60;
    const durationSec = Math.floor(examDuration / 1000);
    const mins = Math.floor(durationSec / 60);
    const secs = durationSec % 60;
    
    return (
      <div className={`w-full h-screen min-h-[600px] flex items-center justify-center p-4 ${passed ? 'bg-gradient-to-br from-emerald-900 via-slate-900 to-amber-900' : 'bg-gradient-to-br from-red-950 via-slate-900 to-black'}`}>
        <div className="text-center max-w-md w-full">
          <div className="text-6xl sm:text-7xl mb-3">{passed ? '🎓' : '📝'}</div>
          <div className={`font-bold tracking-widest text-xs mb-1 ${passed ? 'text-emerald-300' : 'text-red-300'}`}>EXAM SIMULATOR COMPLETE</div>
          <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">{passed ? 'Test Ready!' : 'Keep Practicing'}</h2>
          
          <div className="bg-white/10 backdrop-blur-md rounded-3xl p-5 mb-4 border border-white/20">
            <div className={`text-7xl sm:text-8xl font-black ${gradeColor} mb-2`}>{grade}</div>
            <div className="text-xl text-white mb-3 tabular-nums">{examCorrect} / {EXAM_QUESTION_COUNT} correct</div>
            
            <div className="grid grid-cols-3 gap-3 text-center pt-3 border-t border-white/20">
              <div>
                <div className="text-[10px] text-slate-300 uppercase tracking-wider">Score</div>
                <div className="text-lg sm:text-xl font-black text-amber-300 tabular-nums">{score}</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-300 uppercase tracking-wider">Time</div>
                <div className="text-lg sm:text-xl font-black text-white tabular-nums">{mins}:{secs.toString().padStart(2, '0')}</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-300 uppercase tracking-wider">Lives</div>
                <div className="text-lg sm:text-xl font-black text-red-300 tabular-nums">{examLives}/{EXAM_LIVES}</div>
              </div>
            </div>
          </div>
          
          {passed && examCorrect === EXAM_QUESTION_COUNT && (
            <div className="bg-gradient-to-r from-amber-500 to-emerald-600 rounded-2xl p-3 mb-4 border-2 border-amber-300 animate-pulse-slow">
              <div className="text-white font-black">🏆 PERFECT SCORE!</div>
              <div className="text-white/90 text-xs">You're more than ready.</div>
            </div>
          )}
          
          <div className="flex flex-col gap-2">
            <button onClick={startExam}
              className="bg-gradient-to-r from-red-600 to-red-800 hover:from-red-700 hover:to-red-900 text-white font-black px-6 py-3 rounded-xl text-base hover:scale-105 active:scale-95 transition-all shadow-xl flex items-center justify-center gap-2 touch-manipulation">
              <RotateCcw className="w-4 h-4" /> Retake Exam
            </button>
            <button onClick={() => setScreen('topicSelect')}
              className="bg-white/10 hover:bg-white/20 text-white font-bold px-5 py-2.5 rounded-xl text-sm touch-manipulation">
              Different Sector
            </button>
            <button onClick={() => setScreen('menu')} className="text-slate-400 hover:text-white text-xs">Main Menu</button>
          </div>
        </div>
        
        <style>{`
          @keyframes pulse-slow { 0%, 100% { box-shadow: 0 0 20px rgba(251, 191, 36, 0.4); } 50% { box-shadow: 0 0 40px rgba(251, 191, 36, 0.8); } }
          .animate-pulse-slow { animation: pulse-slow 2s ease-in-out infinite; }
        `}</style>
      </div>
    );
  }
  
  // ========== PLAYING ==========
  if (screen === 'playing') {
    const topicData = QUESTIONS[topic];
    const q = questions[qIdx % Math.max(1, questions.length)];
    const allAnswers = q ? [q.a, ...q.wrong] : [];
    const shuffled = [...allAnswers].sort((a, b) => {
      const ha = (a + qIdx).split('').reduce((s, c) => s + c.charCodeAt(0), 0);
      const hb = (b + qIdx).split('').reduce((s, c) => s + c.charCodeAt(0), 0);
      return ha - hb;
    });
    
    const hpPct = (hp / MAX_HP) * 100;
    const hpColor = hp > 60 ? 'from-emerald-400 to-emerald-600' : hp > 30 ? 'from-amber-400 to-orange-500' : 'from-red-500 to-red-700';
    const hpLow = hp <= 30;
    
    return (
      <div className="w-full h-screen min-h-[600px] bg-black flex flex-col overflow-hidden relative" style={{ height: '100dvh' }}>
        {/* TOP HUD — in normal flow so it never covers the play area */}
        <div className="relative z-20 px-2 py-1.5 sm:py-2 bg-black/60 backdrop-blur-sm border-b border-white/10 flex-shrink-0">
          <div className="flex items-center gap-2 mb-1.5">
            <button onClick={() => setPaused(p => !p)}
              className="bg-white/10 hover:bg-white/20 active:bg-white/30 text-white p-2 rounded-full transition-colors flex-shrink-0 touch-manipulation">
              {paused ? <Play className="w-4 h-4 sm:w-5 sm:h-5" /> : <Pause className="w-4 h-4 sm:w-5 sm:h-5" />}
            </button>
            
            <div className="flex-1 flex items-center gap-1.5 min-w-0">
              <Heart className={`w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 ${hpLow ? 'text-red-400 animate-pulse fill-red-400' : 'text-red-300 fill-red-400'}`} />
              <div className="flex-1 h-3.5 sm:h-4 bg-slate-800 rounded-full border border-slate-600 overflow-hidden relative">
                <div className={`h-full bg-gradient-to-r ${hpColor} transition-all duration-300 ${hpLow ? 'animate-pulse' : ''}`}
                  style={{ width: `${hpPct}%` }} />
                <div className="absolute inset-0 flex items-center justify-center text-[10px] sm:text-xs font-black text-white text-shadow leading-none tabular-nums">
                  {hp}/{MAX_HP}
                </div>
              </div>
            </div>
            
            <button onClick={() => setSoundOn(s => !s)}
              className="bg-white/10 hover:bg-white/20 active:bg-white/30 text-white p-2 rounded-full transition-colors flex-shrink-0 touch-manipulation">
              {soundOn ? <Volume2 className="w-4 h-4 sm:w-5 sm:h-5" /> : <VolumeX className="w-4 h-4 sm:w-5 sm:h-5" />}
            </button>
          </div>
          
          <div className="flex items-center justify-around gap-2 mb-1">
            <div className="text-center">
              <div className="text-[9px] sm:text-[10px] text-slate-400 leading-none uppercase tracking-wider">Score</div>
              <div className="text-sm sm:text-base md:text-lg font-black text-white leading-tight tabular-nums">{score}</div>
            </div>
            
            {bossActive ? (
              <div className="text-center">
                <div className="text-[9px] sm:text-[10px] text-red-400 leading-none uppercase font-bold tracking-wider">Boss</div>
                <div className="flex gap-0.5 mt-0.5 justify-center">
                  {Array.from({ length: getMaxBossHp(topic) }).map((_, i) => (
                    <div key={i} className={`w-2 h-3.5 sm:w-2.5 sm:h-4 rounded-sm ${i < bossHp ? 'bg-red-500' : 'bg-slate-700'}`} />
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center" key={aliensKilled}>
                <div className="text-[9px] sm:text-[10px] text-emerald-400 leading-none uppercase flex items-center justify-center gap-0.5 tracking-wider">
                  <Skull className="w-2.5 h-2.5" /> Kills
                </div>
                <div className="text-sm sm:text-base md:text-lg font-black text-emerald-300 leading-tight tabular-nums">{aliensKilled}/{ALIENS_PER_WAVE}</div>
              </div>
            )}
            
            <div className="text-center">
              <div className="text-[9px] sm:text-[10px] text-slate-400 leading-none uppercase tracking-wider">{bossActive ? 'Phase' : 'Wave'}</div>
              <div className="text-sm sm:text-base md:text-lg font-black text-white leading-tight">
                {bossActive ? '👹' : `${waveNumber}/${WAVES_BEFORE_BOSS}`}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-1.5 justify-center flex-wrap min-h-[18px]">
            {Object.entries(activePowerups).map(([type, remaining]) => {
              if (remaining <= 0) return null;
              const info = POWERUP_INFO[type];
              const totalDur = POWERUP_DURATIONS[type];
              const pct = (remaining / totalDur) * 100;
              const Icon = type === 'shield' ? Shield : type === 'rapid' ? Zap : Target;
              return (
                <div key={type} className="flex items-center gap-1 bg-black/50 rounded-full px-2 py-0.5 border" style={{ borderColor: info.glow }}>
                  <Icon className="w-3 h-3 sm:w-3.5 sm:h-3.5" style={{ color: info.glow }} />
                  <div className="w-12 sm:w-16 h-1 sm:h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full transition-all" style={{ width: `${pct}%`, background: info.glow }} />
                  </div>
                  <span className="text-[9px] sm:text-[10px] font-bold text-white tabular-nums">{(remaining / 1000).toFixed(1)}s</span>
                </div>
              );
            })}
            {Object.values(activePowerups).every(r => r <= 0) && (
              <div className="text-[9px] sm:text-[10px] text-slate-500 tracking-widest">
                {bossActive ? '⚠ BOSS BATTLE ⚠' : `SECTOR: ${topicData.short.toUpperCase()}`}
              </div>
            )}
          </div>
        </div>
        
        <div className="flex-1 flex items-center justify-center relative overflow-hidden">
          <canvas ref={canvasRef} width={W} height={H}
            className={`touch-none select-none ${(!paused && !showQuestion) ? 'cursor-none' : 'cursor-default'}`}
            style={{ maxWidth: '100%', maxHeight: '100%', width: 'auto', height: 'auto', aspectRatio: `${W} / ${H}`, imageRendering: 'auto' }}
            onMouseMove={handleMouseMove} onMouseDown={handleMouseDown} onMouseLeave={handleMouseLeave} />
        </div>
        
        {paused && !showQuestion && (
          <div className="absolute inset-0 bg-black/85 backdrop-blur-sm z-30 flex items-center justify-center">
            <div className="text-center px-4">
              <div className="text-5xl font-black text-white mb-3">PAUSED</div>
              <p className="text-slate-300 mb-5 text-sm">Take a breath. Resume when ready.</p>
              <div className="flex gap-2 justify-center flex-wrap">
                <button onClick={() => setPaused(false)} className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-5 py-2.5 rounded-xl flex items-center gap-2 touch-manipulation">
                  <Play className="w-4 h-4" /> Resume
                </button>
                <button onClick={() => setScreen('topicSelect')} className="bg-white/10 hover:bg-white/20 text-white font-bold px-5 py-2.5 rounded-xl touch-manipulation">Quit</button>
              </div>
            </div>
          </div>
        )}
        
        {showQuestion && q && (
          <div className="absolute inset-0 bg-black/90 backdrop-blur-md z-40 flex items-center justify-center p-3 sm:p-4">
            <div className={`max-w-md md:max-w-lg lg:max-w-xl w-full bg-gradient-to-br ${bossActive ? 'from-red-900 to-black border-red-400' : `${topicData.bgColor} border-white/30`} border-2 rounded-3xl p-4 sm:p-5 md:p-6 shadow-2xl`}>
              <div className="text-center mb-3 sm:mb-4">
                <div className={`inline-block px-3 py-0.5 rounded-full text-[10px] sm:text-xs font-black tracking-widest mb-2 ${bossActive ? 'bg-red-500/40 text-red-200' : 'bg-white/20 text-white'}`}>
                  {bossActive ? `⚠ DAMAGE THE BOSS ⚠` : `⚡ CHECKPOINT ${qIdx + 1}/${WAVES_BEFORE_BOSS} ⚡`}
                </div>
                <div className="bg-black/60 rounded-2xl px-4 py-4 sm:px-6 sm:py-5 border border-white/20 my-2">
                  <div className="text-2xl sm:text-3xl md:text-4xl font-black text-white whitespace-pre-line font-mono leading-tight"><MathText>{q.q}</MathText></div>
                </div>
                <div className="text-xs sm:text-sm text-white/80">
                  {bossActive ? `Right answer = boss damage + shield bonus. Wrong = -${DMG_WRONG} HP.` : `Right answer = +${HP_CORRECT_BONUS} HP. Wrong = -${DMG_WRONG} HP.`}
                </div>
              </div>
              
              {feedback ? (
                <div className={`text-center p-4 sm:p-5 rounded-2xl ${feedback.type === 'correct' ? 'bg-emerald-500/30 border-2 border-emerald-300' : 'bg-red-500/30 border-2 border-red-300'} animate-pulse-fast`}>
                  <div className="text-2xl sm:text-3xl font-black text-white mb-1">{feedback.text}</div>
                  {feedback.points && <div className="text-lg sm:text-xl font-bold text-yellow-300">+{feedback.points}</div>}
                  {feedback.hpBonus > 0 && <div className="text-sm sm:text-base font-bold text-emerald-300 mt-1">+{feedback.hpBonus} HP restored ❤️</div>}
                  {feedback.shieldBonus && <div className="text-sm sm:text-base font-bold text-cyan-300 mt-1">Shield activated 🛡️</div>}
                  {feedback.correct && <div className="text-sm sm:text-base text-white mt-2">Correct: <span className="font-bold"><MathText>{feedback.correct}</MathText></span></div>}
                  {feedback.hint && <div className="text-xs sm:text-sm text-white/90 mt-1">💡 {feedback.hint}</div>}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                  {shuffled.map((ans, i) => (
                    <button key={i} onClick={() => handleAnswer(ans)}
                      className="bg-white hover:bg-yellow-200 active:scale-95 active:bg-yellow-300 text-slate-900 font-mono font-black text-base sm:text-lg md:text-xl px-3 py-4 sm:py-5 md:py-6 rounded-xl shadow-lg border-2 border-slate-900 transition-all touch-manipulation">
                      <MathText>{ans}</MathText>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
        
        <style>{`
          @keyframes pulse-fast { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.04); } }
          .animate-pulse-fast { animation: pulse-fast 0.6s ease-in-out infinite; }
          .text-shadow { text-shadow: 0 0 3px rgba(0,0,0,0.9); }
          canvas { background: #000; touch-action: none; }
          .math-sup { font-size: 0.62em; vertical-align: super; line-height: 0; margin-left: 0.5px; }
          .math-sub { font-size: 0.62em; vertical-align: sub; line-height: 0; margin-left: 0.5px; }
        `}</style>
      </div>
    );
  }
  
  // ========== VICTORY ==========
  if (screen === 'victory') {
    const grade = score >= 1500 ? 'A+' : score >= 1200 ? 'A' : score >= 900 ? 'B' : score >= 600 ? 'C' : 'D';
    const gradeColor = score >= 1200 ? 'text-emerald-400' : score >= 900 ? 'text-amber-400' : 'text-orange-400';
    
    return (
      <div className="w-full h-screen min-h-[600px] bg-gradient-to-br from-emerald-900 via-cyan-900 to-purple-900 flex items-center justify-center p-4 overflow-y-auto relative">
        {Array.from({ length: 25 }).map((_, i) => (
          <div key={i} className="absolute text-2xl animate-confetti pointer-events-none"
            style={{ left: `${Math.random() * 100}%`, top: `-10%`,
              animationDelay: `${Math.random() * 3}s`, animationDuration: `${3 + Math.random() * 2}s` }}>
            {['🎉', '⭐', '🎊', '✨'][Math.floor(Math.random() * 4)]}
          </div>
        ))}
        
        <div className="relative z-10 text-center max-w-md w-full">
          <div className="text-7xl mb-3 animate-bounce-slow">🏆</div>
          <div className="text-amber-300 font-bold tracking-widest text-xs mb-1">SECTOR CLEARED</div>
          <h2 className="text-3xl md:text-4xl font-black text-white mb-4">{QUESTIONS[topic].name}</h2>
          
          <div className="bg-white/10 backdrop-blur-md rounded-3xl p-5 mb-4 border border-white/20">
            <div className="grid grid-cols-3 gap-3 text-center mb-3">
              <div>
                <div className="text-[10px] text-slate-300 uppercase tracking-wider">Score</div>
                <div className="text-xl font-black text-white">{score}</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-300 uppercase tracking-wider">HP Left</div>
                <div className="text-xl font-black text-emerald-300">{hp}</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-300 uppercase tracking-wider">Streak</div>
                <div className="text-xl font-black text-orange-300 flex items-center justify-center gap-1">
                  <Flame className="w-4 h-4" /> {bestStreak}
                </div>
              </div>
            </div>
            <div className="border-t border-white/20 pt-3">
              <div className="text-[10px] text-slate-300 uppercase tracking-wider mb-1">Grade</div>
              <div className={`text-5xl font-black ${gradeColor}`}>{grade}</div>
            </div>
          </div>
          
          {allPlayableComplete && (
            <div className="bg-gradient-to-r from-red-500 to-red-700 rounded-2xl p-3 mb-4 border-2 border-red-300 animate-pulse-slow">
              <div className="text-white font-black">⏱ Try the EXAM SIMULATOR!</div>
              <div className="text-white/90 text-xs">Time pressure mode • 10 questions</div>
            </div>
          )}
          
          <div className="flex flex-col gap-2">
            {(() => {
              const currentIdx = TOPICS_ORDER.indexOf(topic);
              const nextTopic = TOPICS_ORDER[currentIdx + 1];
              return nextTopic ? (
                <button onClick={() => startMission(nextTopic)} className="bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-black px-6 py-3 rounded-xl text-base hover:scale-105 active:scale-95 transition-all shadow-xl touch-manipulation">
                  Sector {currentIdx + 2}: {QUESTIONS[nextTopic].short} <ChevronRight className="inline w-4 h-4" />
                </button>
              ) : (
                <button onClick={() => setScreen('menu')} className="bg-gradient-to-r from-amber-500 to-red-600 text-white font-black px-6 py-3 rounded-xl text-base hover:scale-105 active:scale-95 transition-all shadow-xl touch-manipulation">
                  🎓 All Sectors Cleared! <ChevronRight className="inline w-4 h-4" />
                </button>
              );
            })()}
            <button onClick={() => startMission(topic)} className="bg-white/10 hover:bg-white/20 text-white font-bold px-5 py-2.5 rounded-xl flex items-center justify-center gap-2 text-sm touch-manipulation">
              <RotateCcw className="w-4 h-4" /> Replay
            </button>
            <button onClick={() => setScreen('topicSelect')} className="text-slate-300 hover:text-white text-xs">Choose Sector</button>
            <a href={SURVEY_URL} target="_blank" rel="noopener noreferrer"
              className="mt-1 inline-block bg-amber-500/20 hover:bg-amber-500/30 active:scale-95 border border-amber-400/60 text-amber-200 font-bold text-xs px-4 py-2 rounded-xl transition-all touch-manipulation">
              💬 Give Feedback
            </a>
          </div>
        </div>
        
        <style>{`
          @keyframes confetti { 0% { transform: translateY(-10vh) rotate(0); } 100% { transform: translateY(110vh) rotate(720deg); } }
          .animate-confetti { animation: confetti linear infinite; }
          @keyframes bounce-slow { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-12px); } }
          .animate-bounce-slow { animation: bounce-slow 1.5s ease-in-out infinite; }
          @keyframes pulse-slow { 0%, 100% { box-shadow: 0 0 20px rgba(251, 191, 36, 0.4); } 50% { box-shadow: 0 0 40px rgba(251, 191, 36, 0.8); } }
          .animate-pulse-slow { animation: pulse-slow 2s ease-in-out infinite; }
        `}</style>
      </div>
    );
  }
  
  // ========== GAME OVER ==========
  if (screen === 'gameOver') {
    return (
      <div className="w-full h-screen min-h-[600px] bg-gradient-to-br from-red-900 via-slate-900 to-black flex items-center justify-center p-4">
        <div className="text-center max-w-md w-full">
          <div className="text-7xl mb-3 animate-pulse">💥</div>
          <h2 className="text-4xl font-black text-red-400 mb-1">SHIP DOWN</h2>
          <p className="text-slate-300 mb-5 text-sm">No worries — every miss is data. Try again!</p>
          
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 mb-4 border border-white/20">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-[10px] text-slate-400 uppercase">{bossActive ? 'Boss Phase' : 'Wave'}</div>
                <div className="text-xl font-black text-white">{bossActive ? `${getMaxBossHp(topic) - bossHp + 1}/${getMaxBossHp(topic)}` : `${waveNumber}/${WAVES_BEFORE_BOSS}`}</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400 uppercase">Score</div>
                <div className="text-xl font-black text-white">{score}</div>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col gap-2">
            <button onClick={() => startMission(topic)} className="bg-gradient-to-r from-emerald-500 to-cyan-600 text-white font-black px-6 py-3 rounded-xl text-base hover:scale-105 active:scale-95 transition-all shadow-xl flex items-center justify-center gap-2 touch-manipulation">
              <RotateCcw className="w-4 h-4" /> Try Again
            </button>
            <button onClick={() => setScreen('topicSelect')} className="bg-white/10 hover:bg-white/20 text-white font-bold px-5 py-2.5 rounded-xl text-sm touch-manipulation">Different Sector</button>
            <button onClick={() => setScreen('menu')} className="text-slate-400 hover:text-white text-xs">Main Menu</button>
            <a href={SURVEY_URL} target="_blank" rel="noopener noreferrer"
              className="mt-1 inline-block bg-amber-500/20 hover:bg-amber-500/30 active:scale-95 border border-amber-400/60 text-amber-200 font-bold text-xs px-4 py-2 rounded-xl transition-all touch-manipulation">
              💬 Give Feedback
            </a>
          </div>
        </div>
      </div>
    );
  }
  
  return null;
}
