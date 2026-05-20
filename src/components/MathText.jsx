import React from 'react';

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

export function MathText({ children, className = '' }) {
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
