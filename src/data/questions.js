export const QUESTIONS = {
  linear: {
    name: 'Linear Equations', short: 'Linear', color: '#3b82f6',
    bgColor: 'from-blue-600 to-blue-900', icon: '➕',
    easy: [
      { q: '2x + 5 = 13', a: 'x = 4', wrong: ['x = 3', 'x = 5', 'x = 9'], hint: 'Subtract 5, then divide by 2', steps: ['Subtract 5 from both sides → 2x = 8', 'Divide both sides by 2 → x = 4'] },
      { q: '3x − 7 = 8', a: 'x = 5', wrong: ['x = 1', 'x = 3', 'x = 15'], hint: 'Add 7, then divide by 3', steps: ['Add 7 to both sides → 3x = 15', 'Divide both sides by 3 → x = 5'] },
      { q: 'x + 12 = 20', a: 'x = 8', wrong: ['x = 12', 'x = 32', 'x = −8'], hint: 'Subtract 12 from both sides', steps: ['Subtract 12 from both sides → x = 8', 'Check: 8 + 12 = 20 ✓'] },
      { q: '5x = 30', a: 'x = 6', wrong: ['x = 5', 'x = 25', 'x = 35'], hint: 'Divide both sides by 5', steps: ['Divide both sides by 5 → x = 6', 'Check: 5 × 6 = 30 ✓'] },
      { q: 'x − 8 = 12', a: 'x = 20', wrong: ['x = 4', 'x = −4', 'x = 8'], hint: 'Add 8 to both sides', steps: ['Add 8 to both sides → x = 20', 'Check: 20 − 8 = 12 ✓'] },
      { q: '4x + 3 = 19', a: 'x = 4', wrong: ['x = 3', 'x = 5', 'x = 22'], hint: 'Subtract 3, then divide by 4', steps: ['Subtract 3 from both sides → 4x = 16', 'Divide both sides by 4 → x = 4'] },
    ],
    medium: [
      { q: '4x + 9 = 2x + 21', a: 'x = 6', wrong: ['x = 3', 'x = 12', 'x = 5'], hint: 'Move x-terms to one side', steps: ['Subtract 2x from both sides → 2x + 9 = 21', 'Subtract 9 from both sides → 2x = 12', 'Divide both sides by 2 → x = 6'] },
      { q: '5(x − 3) = 2x + 6', a: 'x = 7', wrong: ['x = 5', 'x = 3', 'x = 9'], hint: 'Expand the bracket first', steps: ['Expand: 5x − 15 = 2x + 6', 'Subtract 2x from both sides → 3x − 15 = 6', 'Add 15 and divide by 3 → x = 7'] },
      { q: '3(x + 2) = 2(x + 7)', a: 'x = 8', wrong: ['x = 4', 'x = 6', 'x = 12'], hint: 'Expand both sides first', steps: ['Expand: 3x + 6 = 2x + 14', 'Subtract 2x from both sides → x + 6 = 14', 'Subtract 6 → x = 8'] },
      { q: '6x − 5 = 4x + 9', a: 'x = 7', wrong: ['x = 2', 'x = −2', 'x = 14'], hint: 'Subtract 4x, add 5, divide by 2', steps: ['Subtract 4x from both sides → 2x − 5 = 9', 'Add 5 to both sides → 2x = 14', 'Divide by 2 → x = 7'] },
      { q: '2(x + 5) = 16', a: 'x = 3', wrong: ['x = 11', 'x = 8', 'x = −3'], hint: 'Expand: 2x + 10 = 16', steps: ['Expand: 2x + 10 = 16', 'Subtract 10 → 2x = 6', 'Divide by 2 → x = 3'] },
      { q: '7 − 2x = 1', a: 'x = 3', wrong: ['x = −3', 'x = 4', 'x = −4'], hint: 'Subtract 7, then divide by −2', steps: ['Subtract 7 from both sides → −2x = −6', 'Divide both sides by −2 → x = 3'] },
    ],
    hard: [
      { q: '(2x+1)/3 = (x−1)/2', a: 'x = −5', wrong: ['x = 5', 'x = −1', 'x = 1'], hint: 'Cross-multiply: 2(2x+1) = 3(x−1)', steps: ['Cross-multiply: 2(2x+1) = 3(x−1)', 'Expand: 4x + 2 = 3x − 3', 'Subtract 3x and subtract 2 → x = −5'] },
      { q: '3(2x−1) − 2(x+4) = 5', a: 'x = 4', wrong: ['x = 2', 'x = 3', 'x = 5'], hint: 'Expand carefully — watch the signs', steps: ['Expand: 6x − 3 − 2x − 8 = 5', 'Simplify: 4x − 11 = 5', 'Add 11 → 4x = 16', 'Divide by 4 → x = 4'] },
      { q: '7x − 4 = 3(x + 4)', a: 'x = 4', wrong: ['x = 2', 'x = 8', 'x = −4'], hint: 'Expand right side, then collect', steps: ['Expand right: 7x − 4 = 3x + 12', 'Subtract 3x → 4x − 4 = 12', 'Add 4 → 4x = 16', 'Divide by 4 → x = 4'] },
      { q: '(x−1)/2 + (x+1)/4 = 2', a: 'x = 3', wrong: ['x = 2', 'x = 4', 'x = 5'], hint: 'Multiply through by 4 to clear fractions', steps: ['Multiply by 4: 2(x−1) + (x+1) = 8', 'Expand: 2x − 2 + x + 1 = 8', 'Simplify: 3x − 1 = 8', 'Add 1 and divide by 3 → x = 3'] },
      { q: '2(3x − 1) + 3(x − 2) = 1', a: 'x = 1', wrong: ['x = 2', 'x = −1', 'x = 9'], hint: 'Expand: 6x − 2 + 3x − 6 = 1', steps: ['Expand: 6x − 2 + 3x − 6 = 1', 'Simplify: 9x − 8 = 1', 'Add 8 → 9x = 9', 'Divide by 9 → x = 1'] },
      { q: '4(x + 1) − 3(x − 2) = 12', a: 'x = 2', wrong: ['x = 4', 'x = 10', 'x = −2'], hint: 'Watch the sign: −3(x−2) = −3x+6', steps: ['Expand: 4x + 4 − 3x + 6 = 12', 'Simplify: x + 10 = 12', 'Subtract 10 → x = 2'] },
    ]
  },
  quadratic: {
    name: 'Quadratic Equations', short: 'Quadratic', color: '#a855f7',
    bgColor: 'from-purple-600 to-purple-900', icon: 'x²',
    easy: [
      { q: 'x² = 25', a: 'x = ±5', wrong: ['x = 5', 'x = 25', 'x = ±25'], hint: 'Square root both sides — remember ±', steps: ['Take square root of both sides → x = ±√25', 'Simplify → x = ±5'] },
      { q: 'x² − 9 = 0', a: 'x = ±3', wrong: ['x = 3', 'x = ±9', 'x = 9'], hint: 'Add 9, then square root', steps: ['Add 9 to both sides → x² = 9', 'Take square root → x = ±3'] },
      { q: '(x − 2)(x + 3) = 0', a: 'x = 2 or −3', wrong: ['x = −2 or 3', 'x = 2 or 3', 'x = −2 or −3'], hint: 'Each factor must equal zero', steps: ['Set x − 2 = 0 → x = 2', 'Set x + 3 = 0 → x = −3'] },
      { q: '(x + 4)(x − 1) = 0', a: 'x = −4 or 1', wrong: ['x = 4 or −1', 'x = −4 or −1', 'x = 4 or 1'], hint: 'Set each bracket to zero', steps: ['Set x + 4 = 0 → x = −4', 'Set x − 1 = 0 → x = 1'] },
      { q: 'x² = 49', a: 'x = ±7', wrong: ['x = 7', 'x = 49', 'x = ±49'], hint: 'Both +7 and −7 squared give 49', steps: ['Take square root of both sides → x = ±√49', 'Simplify → x = ±7'] },
      { q: 'x² − 16 = 0', a: 'x = ±4', wrong: ['x = 4', 'x = ±16', 'x = 8'], hint: 'Add 16, then square root', steps: ['Add 16 to both sides → x² = 16', 'Take square root → x = ±4'] },
    ],
    medium: [
      { q: 'x² − 5x + 6 = 0', a: 'x = 2 or 3', wrong: ['x = −2 or −3', 'x = 1 or 6', 'x = 5 or 6'], hint: 'Two numbers: ×=6, +=−5', steps: ['Find two numbers that multiply to 6 and add to −5: −2 and −3', 'Factor: (x − 2)(x − 3) = 0', 'Solve: x = 2 or x = 3'] },
      { q: 'x² + 7x + 12 = 0', a: 'x = −3 or −4', wrong: ['x = 3 or 4', 'x = −3 or 4', 'x = 3 or −4'], hint: 'Two numbers: ×=12, +=7', steps: ['Find two numbers that multiply to 12 and add to 7: 3 and 4', 'Factor: (x + 3)(x + 4) = 0', 'Solve: x = −3 or x = −4'] },
      { q: 'x² − x − 6 = 0', a: 'x = 3 or −2', wrong: ['x = −3 or 2', 'x = 6 or −1', 'x = 3 or 2'], hint: 'Two numbers: ×=−6, +=−1', steps: ['Find two numbers that multiply to −6 and add to −1: −3 and 2', 'Factor: (x − 3)(x + 2) = 0', 'Solve: x = 3 or x = −2'] },
      { q: 'x² + 5x + 4 = 0', a: 'x = −1 or −4', wrong: ['x = 1 or 4', 'x = −1 or 4', 'x = 1 or −4'], hint: 'Two numbers: ×=4, +=5', steps: ['Find two numbers that multiply to 4 and add to 5: 1 and 4', 'Factor: (x + 1)(x + 4) = 0', 'Solve: x = −1 or x = −4'] },
      { q: 'x² − 7x + 10 = 0', a: 'x = 2 or 5', wrong: ['x = −2 or −5', 'x = 1 or 10', 'x = −1 or −10'], hint: 'Two numbers: ×=10, +=−7', steps: ['Find two numbers that multiply to 10 and add to −7: −2 and −5', 'Factor: (x − 2)(x − 5) = 0', 'Solve: x = 2 or x = 5'] },
      { q: 'x² + 2x − 8 = 0', a: 'x = −4 or 2', wrong: ['x = 4 or −2', 'x = −4 or −2', 'x = 4 or 2'], hint: 'Two numbers: ×=−8, +=2', steps: ['Find two numbers that multiply to −8 and add to 2: 4 and −2', 'Factor: (x + 4)(x − 2) = 0', 'Solve: x = −4 or x = 2'] },
    ],
    hard: [
      { q: '2x² − 5x − 3 = 0', a: 'x = 3 or −½', wrong: ['x = −3 or ½', 'x = 3 or ½', 'x = −3 or −½'], hint: 'Factor: (2x+1)(x−3) = 0', steps: ['Factor the trinomial: (2x + 1)(x − 3) = 0', 'Set 2x + 1 = 0 → x = −½', 'Set x − 3 = 0 → x = 3'] },
      { q: 'x² − 4x − 5 = 0', a: 'x = 5 or −1', wrong: ['x = −5 or 1', 'x = 5 or 1', 'x = −5 or −1'], hint: 'Two numbers: ×=−5, +=−4', steps: ['Find two numbers that multiply to −5 and add to −4: −5 and 1', 'Factor: (x − 5)(x + 1) = 0', 'Solve: x = 5 or x = −1'] },
      { q: '3x² − 12 = 0', a: 'x = ±2', wrong: ['x = ±4', 'x = ±6', 'x = 2'], hint: 'Divide by 3 first, then square root', steps: ['Divide by 3 → x² − 4 = 0', 'Add 4 → x² = 4', 'Take square root → x = ±2'] },
      { q: '2x² = 18', a: 'x = ±3', wrong: ['x = ±9', 'x = 9', 'x = ±18'], hint: 'Divide by 2: x² = 9, then root', steps: ['Divide both sides by 2 → x² = 9', 'Take square root → x = ±3', 'Check: 2(9) = 18 ✓'] },
      { q: 'x² + 6x + 9 = 0', a: 'x = −3', wrong: ['x = 3', 'x = ±3', 'x = −3 or 3'], hint: 'Perfect square: (x+3)² = 0', steps: ['Recognize perfect square: (x + 3)² = 0', 'Take square root → x + 3 = 0', 'Solve → x = −3 (repeated root)'] },
      { q: '3x² + 5x − 2 = 0', a: 'x = ⅓ or −2', wrong: ['x = −⅓ or 2', 'x = ⅓ or 2', 'x = −⅓ or −2'], hint: 'Factor: (3x−1)(x+2) = 0', steps: ['Factor the trinomial: (3x − 1)(x + 2) = 0', 'Set 3x − 1 = 0 → x = ⅓', 'Set x + 2 = 0 → x = −2'] },
    ]
  },
  expExpr: {
    name: 'Exponential Expressions', short: 'Exp Expressions', color: '#f59e0b',
    bgColor: 'from-amber-500 to-orange-700', icon: 'xⁿ',
    easy: [
      { q: 'x³ × x²', a: 'x⁵', wrong: ['x⁶', 'x¹', '2x⁵'], hint: 'Multiplying same base → ADD exponents', steps: ['Same base multiplication: add exponents', '3 + 2 = 5 → x⁵'] },
      { q: 'x⁵ ÷ x²', a: 'x³', wrong: ['x⁷', 'x²·⁵', 'x¹⁰'], hint: 'Dividing same base → SUBTRACT exponents', steps: ['Same base division: subtract exponents', '5 − 2 = 3 → x³'] },
      { q: '(x²)³', a: 'x⁶', wrong: ['x⁵', 'x⁸', '3x²'], hint: 'Power of a power → MULTIPLY exponents', steps: ['Power of a power: multiply exponents', '2 × 3 = 6 → x⁶'] },
      { q: 'x⁴ × x', a: 'x⁵', wrong: ['x⁴', '2x⁵', 'x³'], hint: 'x is x¹, so add: 4+1 = 5', steps: ['Rewrite x as x¹', 'Add exponents: 4 + 1 = 5 → x⁵'] },
      { q: '(x³)²', a: 'x⁶', wrong: ['x⁵', 'x⁹', '2x⁶'], hint: 'Multiply: 3 × 2 = 6', steps: ['Power of a power: multiply exponents', '3 × 2 = 6 → x⁶'] },
      { q: 'x⁶ ÷ x²', a: 'x⁴', wrong: ['x⁸', 'x³', 'x¹²'], hint: 'Subtract: 6 − 2 = 4', steps: ['Same base division: subtract exponents', '6 − 2 = 4 → x⁴'] },
    ],
    medium: [
      { q: '2a²b × 3ab³', a: '6a³b⁴', wrong: ['5a³b⁴', '6a²b³', '6a²b⁴'], hint: 'Multiply numbers, add exponents per variable', steps: ['Multiply coefficients: 2 × 3 = 6', 'Add a exponents: 2 + 1 = 3 → a³', 'Add b exponents: 1 + 3 = 4 → b⁴ → 6a³b⁴'] },
      { q: '(2x³)²', a: '4x⁶', wrong: ['2x⁶', '4x⁵', '2x⁵'], hint: 'Square BOTH the 2 and the x³', steps: ['Square the coefficient: 2² = 4', 'Multiply exponent: 3 × 2 = 6 → x⁶', 'Result: 4x⁶'] },
      { q: '(3x²y)³', a: '27x⁶y³', wrong: ['9x⁶y³', '27x⁵y³', '27x⁶y⁴'], hint: 'Cube every part inside the bracket', steps: ['Cube the coefficient: 3³ = 27', 'Multiply x exponent: 2 × 3 = 6 → x⁶', 'Multiply y exponent: 1 × 3 = 3 → y³ → 27x⁶y³'] },
      { q: '5x³ × 2x⁴', a: '10x⁷', wrong: ['7x⁷', '10x¹²', '7x¹²'], hint: '5×2 = 10, x³ × x⁴ = x⁷', steps: ['Multiply coefficients: 5 × 2 = 10', 'Add exponents: 3 + 4 = 7 → x⁷', 'Result: 10x⁷'] },
      { q: '(4x²)²', a: '16x⁴', wrong: ['8x⁴', '16x²', '4x⁴'], hint: '4² = 16, (x²)² = x⁴', steps: ['Square the coefficient: 4² = 16', 'Multiply exponent: 2 × 2 = 4 → x⁴', 'Result: 16x⁴'] },
      { q: '(a²b)³', a: 'a⁶b³', wrong: ['a⁵b³', 'a⁶b', 'a⁵b'], hint: 'Cube each: (a²)³ × b³', steps: ['Multiply a exponent: 2 × 3 = 6 → a⁶', 'Multiply b exponent: 1 × 3 = 3 → b³', 'Result: a⁶b³'] },
    ],
    hard: [
      { q: '(2a²)³ × (3a)²', a: '72a⁸', wrong: ['36a⁸', '72a⁷', '72a⁶'], hint: '(2a²)³ = 8a⁶, (3a)² = 9a²', steps: ['Evaluate (2a²)³ = 8a⁶', 'Evaluate (3a)² = 9a²', 'Multiply: 8 × 9 = 72, a⁶ × a² = a⁸', 'Result: 72a⁸'] },
      { q: '√(16x⁴)', a: '4x²', wrong: ['8x²', '4x⁴', '16x²'], hint: '√16 = 4, √x⁴ = x²', steps: ['Take square root of coefficient: √16 = 4', 'Take square root of variable: √x⁴ = x²', 'Halve the exponent: 4 ÷ 2 = 2', 'Result: 4x²'] },
      { q: '(a³b²)² ÷ (ab)³', a: 'a³b', wrong: ['a²b', 'a³b²', 'ab²'], hint: 'Top: a⁶b⁴. Bottom: a³b³.', steps: ['Expand numerator: (a³b²)² = a⁶b⁴', 'Expand denominator: (ab)³ = a³b³', 'Subtract exponents: a⁶⁻³b⁴⁻³ = a³b¹', 'Result: a³b'] },
      { q: '(2a²b)³ × ab', a: '8a⁷b⁴', wrong: ['6a⁷b⁴', '8a⁶b³', '2a⁷b⁴'], hint: '(2a²b)³ = 8a⁶b³, then × ab', steps: ['Evaluate (2a²b)³ = 8a⁶b³', 'Multiply by ab: 8a⁶⁺¹b³⁺¹', 'Add exponents: a⁷, b⁴', 'Result: 8a⁷b⁴'] },
      { q: '(x³)⁴ × x²', a: 'x¹⁴', wrong: ['x¹²', 'x⁹', 'x²⁴'], hint: 'x¹² × x² = x¹⁴', steps: ['Evaluate (x³)⁴: multiply 3 × 4 = 12 → x¹²', 'Multiply x¹² × x²: add 12 + 2 = 14', 'Result: x¹⁴'] },
      { q: '(3a)² × (2a³)²', a: '36a⁸', wrong: ['6a⁸', '36a⁶', '12a⁸'], hint: '9a² × 4a⁶ = 36a⁸', steps: ['Evaluate (3a)² = 9a²', 'Evaluate (2a³)² = 4a⁶', 'Multiply: 9 × 4 = 36, a² × a⁶ = a⁸', 'Result: 36a⁸'] },
    ]
  },
  expEqn: {
    name: 'Exponential Equations', short: 'Exp Equations', color: '#10b981',
    bgColor: 'from-emerald-500 to-emerald-800', icon: '2ˣ',
    easy: [
      { q: '2ˣ = 8', a: 'x = 3', wrong: ['x = 2', 'x = 4', 'x = 8'], hint: '8 = 2³', steps: ['Rewrite 8 as a power of 2: 8 = 2³', 'So 2ˣ = 2³ → x = 3'] },
      { q: '3ˣ = 27', a: 'x = 3', wrong: ['x = 9', 'x = 27', 'x = 2'], hint: '27 = 3³', steps: ['Rewrite 27 as a power of 3: 27 = 3³', 'So 3ˣ = 3³ → x = 3'] },
      { q: '5ˣ = 25', a: 'x = 2', wrong: ['x = 5', 'x = 25', 'x = 1'], hint: '25 = 5²', steps: ['Rewrite 25 as a power of 5: 25 = 5²', 'So 5ˣ = 5² → x = 2'] },
      { q: '2ˣ = 16', a: 'x = 4', wrong: ['x = 2', 'x = 8', 'x = 3'], hint: '16 = 2⁴', steps: ['Rewrite 16 as a power of 2: 16 = 2⁴', 'So 2ˣ = 2⁴ → x = 4'] },
      { q: '4ˣ = 16', a: 'x = 2', wrong: ['x = 4', 'x = 8', 'x = 12'], hint: '16 = 4²', steps: ['Rewrite 16 as a power of 4: 16 = 4²', 'So 4ˣ = 4² → x = 2'] },
      { q: '10ˣ = 1000', a: 'x = 3', wrong: ['x = 10', 'x = 100', 'x = 2'], hint: '1000 = 10³', steps: ['Rewrite 1000 as a power of 10: 1000 = 10³', 'So 10ˣ = 10³ → x = 3'] },
    ],
    medium: [
      { q: '2^(x+1) = 16', a: 'x = 3', wrong: ['x = 4', 'x = 2', 'x = 5'], hint: '16 = 2⁴, so x + 1 = 4', steps: ['Rewrite 16 as 2⁴', 'Set exponents equal: x + 1 = 4', 'Solve: x = 3'] },
      { q: '3^(2x) = 81', a: 'x = 2', wrong: ['x = 4', 'x = 1', 'x = 3'], hint: '81 = 3⁴, so 2x = 4', steps: ['Rewrite 81 as 3⁴', 'Set exponents equal: 2x = 4', 'Solve: x = 2'] },
      { q: '4ˣ = 64', a: 'x = 3', wrong: ['x = 16', 'x = 4', 'x = 2'], hint: '64 = 4³', steps: ['Rewrite 64 as a power of 4: 64 = 4³', 'Set exponents equal: x = 3', 'Check: 4³ = 64 ✓'] },
      { q: '2^(x−1) = 8', a: 'x = 4', wrong: ['x = 3', 'x = 2', 'x = 5'], hint: '8 = 2³, so x − 1 = 3', steps: ['Rewrite 8 as 2³', 'Set exponents equal: x − 1 = 3', 'Solve: x = 4'] },
      { q: '5^(x+1) = 125', a: 'x = 2', wrong: ['x = 3', 'x = 1', 'x = 4'], hint: '125 = 5³, so x + 1 = 3', steps: ['Rewrite 125 as 5³', 'Set exponents equal: x + 1 = 3', 'Solve: x = 2'] },
      { q: '3ˣ = 1/9', a: 'x = −2', wrong: ['x = 2', 'x = −3', 'x = −9'], hint: '1/9 = 3⁻²', steps: ['Rewrite 1/9 as 3⁻²', 'Set exponents equal: x = −2', 'Check: 3⁻² = 1/9 ✓'] },
    ],
    hard: [
      { q: '9ˣ = 27', a: 'x = 1.5', wrong: ['x = 3', 'x = 2', 'x = 0.5'], hint: 'Rewrite as 3^(2x) = 3³', steps: ['Rewrite 9 as 3²: (3²)ˣ = 3^(2x)', 'Rewrite 27 as 3³', 'Set exponents equal: 2x = 3', 'Solve: x = 1.5'] },
      { q: '2^(x+1) · 2^(x−1) = 64', a: 'x = 3', wrong: ['x = 6', 'x = 4', 'x = 2'], hint: 'Add exponents: 2^(2x) = 2⁶', steps: ['Add exponents: 2^(x+1+x−1) = 2^(2x)', 'Rewrite 64 as 2⁶', 'Set equal: 2x = 6', 'Solve: x = 3'] },
      { q: '5^(x−2) = 125', a: 'x = 5', wrong: ['x = 3', 'x = 7', 'x = 25'], hint: '125 = 5³, so x − 2 = 3', steps: ['Rewrite 125 as 5³', 'Set exponents equal: x − 2 = 3', 'Solve: x = 5', 'Check: 5^(5−2) = 5³ = 125 ✓'] },
      { q: '4ˣ = 32', a: 'x = 2.5', wrong: ['x = 8', 'x = 3', 'x = 2'], hint: '2^(2x) = 2⁵, so 2x = 5', steps: ['Rewrite 4 as 2²: (2²)ˣ = 2^(2x)', 'Rewrite 32 as 2⁵', 'Set exponents equal: 2x = 5', 'Solve: x = 2.5'] },
      { q: '27ˣ = 9', a: 'x = ⅔', wrong: ['x = ⅓', 'x = 3', 'x = 2'], hint: '3^(3x) = 3², so 3x = 2', steps: ['Rewrite 27 as 3³: (3³)ˣ = 3^(3x)', 'Rewrite 9 as 3²', 'Set exponents equal: 3x = 2', 'Solve: x = ⅔'] },
      { q: '8ˣ = 16', a: 'x = 4/3', wrong: ['x = ⅔', 'x = 2', 'x = ½'], hint: '2^(3x) = 2⁴, so 3x = 4', steps: ['Rewrite 8 as 2³: (2³)ˣ = 2^(3x)', 'Rewrite 16 as 2⁴', 'Set exponents equal: 3x = 4', 'Solve: x = 4/3'] },
    ]
  },
  inequality: {
    name: 'Inequalities', short: 'Inequalities', color: '#ef4444',
    bgColor: 'from-red-500 to-red-800', icon: '≤',
    easy: [
      { q: 'x + 3 > 7', a: 'x > 4', wrong: ['x > 10', 'x < 4', 'x ≥ 4'], hint: 'Subtract 3 — sign stays', steps: ['Subtract 3 from both sides → x > 4', 'Sign stays the same (positive operation)'] },
      { q: '2x < 10', a: 'x < 5', wrong: ['x > 5', 'x < 20', 'x < −5'], hint: 'Divide by 2 (positive) — no flip', steps: ['Divide both sides by 2 → x < 5', 'Sign stays (dividing by positive)'] },
      { q: 'x − 5 ≥ 2', a: 'x ≥ 7', wrong: ['x ≤ 7', 'x > 7', 'x ≥ −3'], hint: 'Add 5 to both sides', steps: ['Add 5 to both sides → x ≥ 7', 'Sign stays the same (positive operation)'] },
      { q: 'x + 5 < 12', a: 'x < 7', wrong: ['x > 7', 'x < 17', 'x < −7'], hint: 'Subtract 5 — sign stays', steps: ['Subtract 5 from both sides → x < 7', 'Sign stays the same (positive operation)'] },
      { q: 'x − 3 > 0', a: 'x > 3', wrong: ['x < 3', 'x > −3', 'x ≥ 3'], hint: 'Add 3 to both sides', steps: ['Add 3 to both sides → x > 3', 'Sign stays the same (positive operation)'] },
      { q: '4x ≤ 20', a: 'x ≤ 5', wrong: ['x ≥ 5', 'x ≤ 16', 'x ≤ 24'], hint: 'Divide by 4 (positive)', steps: ['Divide both sides by 4 → x ≤ 5', 'Sign stays (dividing by positive)'] },
    ],
    medium: [
      { q: '3x + 2 ≤ 14', a: 'x ≤ 4', wrong: ['x ≥ 4', 'x ≤ 16', 'x ≤ −4'], hint: 'Subtract 2, divide by 3', steps: ['Subtract 2 from both sides → 3x ≤ 12', 'Divide by 3 (positive) → x ≤ 4', 'Sign stays the same'] },
      { q: '−2x > 8', a: 'x < −4', wrong: ['x > −4', 'x < 4', 'x > 4'], hint: 'Divide by NEGATIVE → FLIP!', steps: ['Divide both sides by −2', 'FLIP the sign (dividing by negative)', 'x < −4'] },
      { q: '5 − x < 2', a: 'x > 3', wrong: ['x < 3', 'x > −3', 'x < −3'], hint: '−x < −3, then ÷ by −1 → flip!', steps: ['Subtract 5 from both sides → −x < −3', 'Divide by −1 → FLIP sign', 'x > 3'] },
      { q: '5x − 7 ≤ 8', a: 'x ≤ 3', wrong: ['x ≥ 3', 'x ≤ 15', 'x ≤ 1'], hint: 'Add 7, divide by 5', steps: ['Add 7 to both sides → 5x ≤ 15', 'Divide by 5 (positive) → x ≤ 3', 'Sign stays the same'] },
      { q: '−3x ≥ 9', a: 'x ≤ −3', wrong: ['x ≥ −3', 'x ≤ 3', 'x ≥ 3'], hint: 'Divide by −3 → FLIP sign!', steps: ['Divide both sides by −3', 'FLIP the sign (dividing by negative)', 'x ≤ −3'] },
      { q: '7 − 2x > 1', a: 'x < 3', wrong: ['x > 3', 'x < −3', 'x > −3'], hint: 'Subtract 7, ÷ by −2 → flip', steps: ['Subtract 7 → −2x > −6', 'Divide by −2 → FLIP sign', 'x < 3'] },
    ],
    hard: [
      { q: '2(x − 3) > 4x + 6', a: 'x < −6', wrong: ['x > −6', 'x < 6', 'x > 6'], hint: 'Expand, collect, ÷ by neg → flip', steps: ['Expand: 2x − 6 > 4x + 6', 'Subtract 4x: −2x − 6 > 6', 'Add 6: −2x > 12', 'Divide by −2 → FLIP: x < −6'] },
      { q: '4 − 3x ≥ 2x − 11', a: 'x ≤ 3', wrong: ['x ≥ 3', 'x ≤ −3', 'x ≥ −3'], hint: '−5x ≥ −15, ÷ by −5 → flip', steps: ['Subtract 2x: 4 − 5x ≥ −11', 'Subtract 4: −5x ≥ −15', 'Divide by −5 → FLIP: x ≤ 3'] },
      { q: '3(x+1) < 2x + 8', a: 'x < 5', wrong: ['x > 5', 'x < −5', 'x ≤ 5'], hint: 'Expand and collect — sign stays', steps: ['Expand: 3x + 3 < 2x + 8', 'Subtract 2x: x + 3 < 8', 'Subtract 3: x < 5', 'No flip needed (positive coefficient)'] },
      { q: '3(x − 2) ≤ x + 4', a: 'x ≤ 5', wrong: ['x ≥ 5', 'x ≤ −5', 'x ≤ 1'], hint: 'Expand: 3x − 6 ≤ x + 4', steps: ['Expand: 3x − 6 ≤ x + 4', 'Subtract x: 2x − 6 ≤ 4', 'Add 6: 2x ≤ 10', 'Divide by 2: x ≤ 5'] },
      { q: '5x − 3 < 2x + 9', a: 'x < 4', wrong: ['x > 4', 'x < 12', 'x < −4'], hint: '3x < 12 — divide by positive', steps: ['Subtract 2x: 3x − 3 < 9', 'Add 3: 3x < 12', 'Divide by 3: x < 4', 'No flip needed (positive coefficient)'] },
      { q: '2(x + 1) ≥ 3(x − 2)', a: 'x ≤ 8', wrong: ['x ≥ 8', 'x ≤ −8', 'x ≥ −8'], hint: '−x ≥ −8, ÷ by −1 → flip', steps: ['Expand: 2x + 2 ≥ 3x − 6', 'Subtract 3x: −x + 2 ≥ −6', 'Subtract 2: −x ≥ −8', 'Divide by −1 → FLIP: x ≤ 8'] },
    ]
  },
  simultaneous: {
    name: 'Simultaneous Equations', short: 'Simultaneous', color: '#06b6d4',
    bgColor: 'from-cyan-500 to-cyan-800', icon: '⚡',
    easy: [
      { q: 'x + y = 5\nx − y = 1', a: '(3, 2)', wrong: ['(2, 3)', '(4, 1)', '(1, 4)'], hint: 'Add equations: 2x = 6', steps: ['Add equations: 2x = 6 → x = 3', 'Substitute: 3 + y = 5 → y = 2'] },
      { q: '2x + y = 7\nx + y = 4', a: '(3, 1)', wrong: ['(1, 3)', '(2, 2)', '(4, −1)'], hint: 'Subtract eqn 2 from eqn 1', steps: ['Subtract eqn 2 from eqn 1: x = 3', 'Substitute: 3 + y = 4 → y = 1'] },
      { q: 'x + y = 10\nx − y = 4', a: '(7, 3)', wrong: ['(3, 7)', '(6, 4)', '(5, 5)'], hint: 'Add to eliminate y', steps: ['Add equations: 2x = 14 → x = 7', 'Substitute: 7 + y = 10 → y = 3'] },
      { q: 'x + y = 6\n2x − y = 0', a: '(2, 4)', wrong: ['(4, 2)', '(3, 3)', '(1, 5)'], hint: 'Add equations: 3x = 6', steps: ['Add equations: 3x = 6 → x = 2', 'Substitute: 2 + y = 6 → y = 4'] },
      { q: 'x + y = 8\nx − y = 2', a: '(5, 3)', wrong: ['(3, 5)', '(4, 4)', '(6, 2)'], hint: 'Add: 2x = 10', steps: ['Add equations: 2x = 10 → x = 5', 'Substitute: 5 + y = 8 → y = 3'] },
      { q: '2x + y = 9\nx − y = 0', a: '(3, 3)', wrong: ['(4, 2)', '(2, 4)', '(1, 1)'], hint: 'From eqn 2: x = y, sub', steps: ['From eqn 2: x = y', 'Substitute into eqn 1: 2x + x = 9 → x = 3, y = 3'] },
    ],
    medium: [
      { q: '2x + 3y = 12\nx − y = 1', a: '(3, 2)', wrong: ['(2, 3)', '(1, 0)', '(4, 3)'], hint: 'From eqn 2: x = y + 1', steps: ['From eqn 2: x = y + 1', 'Substitute into eqn 1: 2(y+1) + 3y = 12', 'Solve: 5y + 2 = 12 → y = 2, x = 3'] },
      { q: 'x + 2y = 8\n3x − y = 3', a: '(2, 3)', wrong: ['(3, 2)', '(1, 4)', '(4, 2)'], hint: 'Solve for x, substitute', steps: ['From eqn 1: x = 8 − 2y', 'Substitute into eqn 2: 3(8−2y) − y = 3', 'Solve: 24 − 7y = 3 → y = 3, x = 2'] },
      { q: '3x + y = 11\nx + y = 5', a: '(3, 2)', wrong: ['(2, 3)', '(4, 1)', '(2, 9)'], hint: 'Subtract: 2x = 6', steps: ['Subtract eqn 2 from eqn 1: 2x = 6 → x = 3', 'Substitute: 3 + y = 5 → y = 2'] },
      { q: '2x + y = 10\nx + y = 6', a: '(4, 2)', wrong: ['(2, 4)', '(3, 3)', '(5, 1)'], hint: 'Subtract eqn 2 from eqn 1', steps: ['Subtract eqn 2 from eqn 1: x = 4', 'Substitute: 4 + y = 6 → y = 2'] },
      { q: 'x + 3y = 11\nx − y = 3', a: '(5, 2)', wrong: ['(2, 5)', '(3, 4)', '(4, 3)'], hint: 'Subtract: 4y = 8', steps: ['Subtract eqn 2 from eqn 1: 4y = 8 → y = 2', 'Substitute: x − 2 = 3 → x = 5'] },
      { q: '3x − y = 5\nx + y = 7', a: '(3, 4)', wrong: ['(4, 3)', '(2, 5)', '(1, 6)'], hint: 'Add: 4x = 12', steps: ['Add equations: 4x = 12 → x = 3', 'Substitute: 3 + y = 7 → y = 4'] },
    ],
    hard: [
      { q: '3x + 2y = 16\n2x − 3y = −11', a: '(2, 5)', wrong: ['(5, 2)', '(1, 6)', '(4, 2)'], hint: '×3 and ×2 to match y', steps: ['Multiply eqn 1 by 3: 9x + 6y = 48', 'Multiply eqn 2 by 2: 4x − 6y = −22', 'Add: 13x = 26 → x = 2', 'Substitute: 6 + 2y = 16 → y = 5'] },
      { q: '4x − y = 7\n2x + 3y = 7', a: '(2, 1)', wrong: ['(1, 2)', '(3, 5)', '(2, −1)'], hint: 'Multiply eqn 1 by 3, then add', steps: ['Multiply eqn 1 by 3: 12x − 3y = 21', 'Add to eqn 2: 14x = 28 → x = 2', 'Substitute: 8 − y = 7 → y = 1'] },
      { q: '5x + y = 13\n2x − y = 1', a: '(2, 3)', wrong: ['(3, 2)', '(1, 8)', '(2, −3)'], hint: 'Add equations: 7x = 14', steps: ['Add equations: 7x = 14 → x = 2', 'Substitute: 10 + y = 13 → y = 3', 'Check eqn 2: 4 − 3 = 1 ✓'] },
      { q: '4x + 3y = 18\n2x − y = 4', a: '(3, 2)', wrong: ['(2, 3)', '(4, 2)', '(1, 5)'], hint: 'From eqn 2: y = 2x − 4', steps: ['From eqn 2: y = 2x − 4', 'Substitute into eqn 1: 4x + 3(2x−4) = 18', 'Solve: 10x − 12 = 18 → x = 3', 'Find y: y = 6 − 4 = 2'] },
      { q: '4x + y = 15\n3x − 2y = 3', a: '(3, 3)', wrong: ['(2, 7)', '(1, 11)', '(4, −1)'], hint: 'Multiply eqn 1 by 2, then add', steps: ['Multiply eqn 1 by 2: 8x + 2y = 30', 'Add to eqn 2: 11x = 33 → x = 3', 'Substitute: 12 + y = 15 → y = 3'] },
      { q: '2x − y = 1\n3x + 2y = 19', a: '(3, 5)', wrong: ['(5, 3)', '(2, 3)', '(1, −1)'], hint: 'From eqn 1: y = 2x − 1', steps: ['From eqn 1: y = 2x − 1', 'Substitute into eqn 2: 3x + 2(2x−1) = 19', 'Solve: 7x − 2 = 19 → x = 3', 'Find y: y = 6 − 1 = 5'] },
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

export const TOPICS_ORDER = ['linear', 'quadratic', 'expExpr', 'expEqn', 'inequality', 'simultaneous', 'ultimate', 'exam'];
export const PLAYABLE_TOPICS = ['linear', 'quadratic', 'expExpr', 'expEqn', 'inequality', 'simultaneous', 'ultimate'];
