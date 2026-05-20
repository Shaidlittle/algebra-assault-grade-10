import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MathText } from './MathText.jsx';

/**
 * **Validates: Requirements 6.4**
 *
 * Property 5: MathText superscript/subscript character mapping
 *
 * For any input string containing Unicode superscript characters
 * (U+2070–U+207F, U+00B9, U+00B2, U+00B3, U+02E3) or subscript characters
 * (U+2080–U+208E), the MathText component SHALL render <sup> or <sub> elements
 * respectively, where the text content of each element contains only the
 * base-character equivalents from the mapping (digits 0-9, operators, letters).
 */

// The exact mapping from the MathText component
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

const SUPERSCRIPT_CHARS = Object.keys(SUPERSCRIPT_MAP);
const SUBSCRIPT_CHARS = Object.keys(SUBSCRIPT_MAP);

// Arbitrary for generating superscript characters
const supCharArb = fc.constantFrom(...SUPERSCRIPT_CHARS);
// Arbitrary for generating subscript characters
const subCharArb = fc.constantFrom(...SUBSCRIPT_CHARS);
// Arbitrary for plain text characters (not in sup/sub maps)
const allSupSubChars = new Set([...SUPERSCRIPT_CHARS, ...SUBSCRIPT_CHARS]);
const plainCharArb = fc.integer({ min: 0x20, max: 0x7E }).map(
  (code) => String.fromCharCode(code)
).filter((c) => !allSupSubChars.has(c));

describe('MathText superscript/subscript character mapping', () => {
  it('renders superscript characters inside <sup> with correct base equivalents', () => {
    fc.assert(
      fc.property(
        fc.array(supCharArb, { minLength: 1, maxLength: 10 }),
        (supChars) => {
          const input = supChars.join('');
          const html = renderToStaticMarkup(<MathText>{input}</MathText>);

          // Should contain a <sup> element
          expect(html).toContain('<sup');

          // Extract all <sup> content
          const supMatches = [...html.matchAll(/<sup[^>]*>(.*?)<\/sup>/g)];
          const supContent = supMatches.map((m) => m[1]).join('');

          // The content inside <sup> should be the mapped base equivalents
          const expectedContent = supChars.map((c) => SUPERSCRIPT_MAP[c]).join('');
          expect(supContent).toBe(expectedContent);
        }
      ),
      { numRuns: 200 }
    );
  });

  it('renders subscript characters inside <sub> with correct base equivalents', () => {
    fc.assert(
      fc.property(
        fc.array(subCharArb, { minLength: 1, maxLength: 10 }),
        (subChars) => {
          const input = subChars.join('');
          const html = renderToStaticMarkup(<MathText>{input}</MathText>);

          // Should contain a <sub> element
          expect(html).toContain('<sub');

          // Extract all <sub> content
          const subMatches = [...html.matchAll(/<sub[^>]*>(.*?)<\/sub>/g)];
          const subContent = subMatches.map((m) => m[1]).join('');

          // The content inside <sub> should be the mapped base equivalents
          const expectedContent = subChars.map((c) => SUBSCRIPT_MAP[c]).join('');
          expect(subContent).toBe(expectedContent);
        }
      ),
      { numRuns: 200 }
    );
  });

  it('plain text characters are not wrapped in <sup> or <sub>', () => {
    fc.assert(
      fc.property(
        fc.array(plainCharArb, { minLength: 1, maxLength: 20 }).map((arr) => arr.join('')),
        (plainText) => {
          const html = renderToStaticMarkup(<MathText>{plainText}</MathText>);

          // Should NOT contain <sup> or <sub> elements
          expect(html).not.toContain('<sup');
          expect(html).not.toContain('<sub');
        }
      ),
      { numRuns: 200 }
    );
  });

  it('mixed strings: superscript chars go in <sup>, subscript in <sub>, plain stays outside', () => {
    fc.assert(
      fc.property(
        fc.tuple(
          fc.array(plainCharArb, { minLength: 1, maxLength: 5 }).map((arr) => arr.join('')),
          fc.array(supCharArb, { minLength: 1, maxLength: 5 }),
          fc.array(plainCharArb, { minLength: 1, maxLength: 5 }).map((arr) => arr.join('')),
          fc.array(subCharArb, { minLength: 1, maxLength: 5 }),
          fc.array(plainCharArb, { minLength: 1, maxLength: 5 }).map((arr) => arr.join(''))
        ),
        ([plain1, supChars, plain2, subChars, plain3]) => {
          const input = plain1 + supChars.join('') + plain2 + subChars.join('') + plain3;
          const html = renderToStaticMarkup(<MathText>{input}</MathText>);

          // Extract <sup> content
          const supMatches = [...html.matchAll(/<sup[^>]*>(.*?)<\/sup>/g)];
          const supContent = supMatches.map((m) => m[1]).join('');
          const expectedSup = supChars.map((c) => SUPERSCRIPT_MAP[c]).join('');
          expect(supContent).toBe(expectedSup);

          // Extract <sub> content
          const subMatches = [...html.matchAll(/<sub[^>]*>(.*?)<\/sub>/g)];
          const subContent = subMatches.map((m) => m[1]).join('');
          const expectedSub = subChars.map((c) => SUBSCRIPT_MAP[c]).join('');
          expect(subContent).toBe(expectedSub);

          // Plain text should appear in the HTML but not inside sup/sub
          // Remove all sup/sub elements and check plain text is present
          const withoutSupSub = html
            .replace(/<sup[^>]*>.*?<\/sup>/g, '')
            .replace(/<sub[^>]*>.*?<\/sub>/g, '');
          // The plain text segments should be in the remaining HTML
          // (accounting for HTML entity encoding of special chars)
          expect(withoutSupSub).toContain(escapeHtml(plain1));
          expect(withoutSupSub).toContain(escapeHtml(plain3));
        }
      ),
      { numRuns: 200 }
    );
  });
});

// Helper to escape HTML special characters the same way React does
function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

/**
 * **Validates: Requirements 6.5**
 *
 * Property 6: MathText consecutive character grouping
 *
 * For any string containing N consecutive Unicode superscript characters (N ≥ 2),
 * the MathText component SHALL produce exactly one <sup> element containing all N
 * mapped characters concatenated, rather than N separate <sup> elements.
 * The same grouping rule applies to consecutive subscript characters and <sub> elements.
 */

// Arbitrary for picking N superscript char indices (N >= 2)
const supRunArb = fc.array(
  fc.integer({ min: 0, max: SUPERSCRIPT_CHARS.length - 1 }),
  { minLength: 2, maxLength: 10 }
);

// Arbitrary for picking N subscript char indices (N >= 2)
const subRunArb = fc.array(
  fc.integer({ min: 0, max: SUBSCRIPT_CHARS.length - 1 }),
  { minLength: 2, maxLength: 10 }
);

describe('MathText consecutive character grouping (Property 6)', () => {
  it('groups N consecutive superscript characters into exactly one <sup> element', () => {
    fc.assert(
      fc.property(supRunArb, (indices) => {
        const unicodeStr = indices.map(i => SUPERSCRIPT_CHARS[i]).join('');
        const expectedText = indices.map(i => SUPERSCRIPT_MAP[SUPERSCRIPT_CHARS[i]]).join('');

        const html = renderToStaticMarkup(<MathText>{unicodeStr}</MathText>);

        // Count <sup> elements — should be exactly 1
        const supMatches = html.match(/<sup[^>]*>/g);
        expect(supMatches).not.toBeNull();
        expect(supMatches.length).toBe(1);

        // Verify the single <sup> contains all N mapped characters concatenated
        const supContentMatch = html.match(/<sup[^>]*>(.*?)<\/sup>/);
        expect(supContentMatch).not.toBeNull();
        expect(supContentMatch[1]).toBe(expectedText);
      }),
      { numRuns: 100 }
    );
  });

  it('groups N consecutive subscript characters into exactly one <sub> element', () => {
    fc.assert(
      fc.property(subRunArb, (indices) => {
        const unicodeStr = indices.map(i => SUBSCRIPT_CHARS[i]).join('');
        const expectedText = indices.map(i => SUBSCRIPT_MAP[SUBSCRIPT_CHARS[i]]).join('');

        const html = renderToStaticMarkup(<MathText>{unicodeStr}</MathText>);

        // Count <sub> elements — should be exactly 1
        const subMatches = html.match(/<sub[^>]*>/g);
        expect(subMatches).not.toBeNull();
        expect(subMatches.length).toBe(1);

        // Verify the single <sub> contains all N mapped characters concatenated
        const subContentMatch = html.match(/<sub[^>]*>(.*?)<\/sub>/);
        expect(subContentMatch).not.toBeNull();
        expect(subContentMatch[1]).toBe(expectedText);
      }),
      { numRuns: 100 }
    );
  });

  it('includes intermediate dots in the same superscript group when followed by another superscript char', () => {
    const dotArb = fc.constantFrom('.', '\u00B7');
    const arbWithDot = fc.tuple(
      fc.integer({ min: 0, max: SUPERSCRIPT_CHARS.length - 1 }),
      dotArb,
      fc.array(
        fc.integer({ min: 0, max: SUPERSCRIPT_CHARS.length - 1 }),
        { minLength: 1, maxLength: 5 }
      )
    );

    fc.assert(
      fc.property(arbWithDot, ([firstIdx, dot, restIndices]) => {
        const firstChar = SUPERSCRIPT_CHARS[firstIdx];
        const restChars = restIndices.map(i => SUPERSCRIPT_CHARS[i]).join('');
        const unicodeStr = firstChar + dot + restChars;

        const expectedText = SUPERSCRIPT_MAP[firstChar] + dot +
          restIndices.map(i => SUPERSCRIPT_MAP[SUPERSCRIPT_CHARS[i]]).join('');

        const html = renderToStaticMarkup(<MathText>{unicodeStr}</MathText>);

        // Should still be exactly 1 <sup> element
        const supMatches = html.match(/<sup[^>]*>/g);
        expect(supMatches).not.toBeNull();
        expect(supMatches.length).toBe(1);

        // The content should include the dot
        const supContentMatch = html.match(/<sup[^>]*>(.*?)<\/sup>/);
        expect(supContentMatch).not.toBeNull();
        expect(supContentMatch[1]).toBe(expectedText);
      }),
      { numRuns: 100 }
    );
  });

  it('includes intermediate dots in the same subscript group when followed by another subscript char', () => {
    const dotArb = fc.constantFrom('.', '\u00B7');
    const arbWithDot = fc.tuple(
      fc.integer({ min: 0, max: SUBSCRIPT_CHARS.length - 1 }),
      dotArb,
      fc.array(
        fc.integer({ min: 0, max: SUBSCRIPT_CHARS.length - 1 }),
        { minLength: 1, maxLength: 5 }
      )
    );

    fc.assert(
      fc.property(arbWithDot, ([firstIdx, dot, restIndices]) => {
        const firstChar = SUBSCRIPT_CHARS[firstIdx];
        const restChars = restIndices.map(i => SUBSCRIPT_CHARS[i]).join('');
        const unicodeStr = firstChar + dot + restChars;

        const expectedText = SUBSCRIPT_MAP[firstChar] + dot +
          restIndices.map(i => SUBSCRIPT_MAP[SUBSCRIPT_CHARS[i]]).join('');

        const html = renderToStaticMarkup(<MathText>{unicodeStr}</MathText>);

        // Should still be exactly 1 <sub> element
        const subMatches = html.match(/<sub[^>]*>/g);
        expect(subMatches).not.toBeNull();
        expect(subMatches.length).toBe(1);

        // The content should include the dot
        const subContentMatch = html.match(/<sub[^>]*>(.*?)<\/sub>/);
        expect(subContentMatch).not.toBeNull();
        expect(subContentMatch[1]).toBe(expectedText);
      }),
      { numRuns: 100 }
    );
  });
});
