/**
 * Mulberry32 seeded PRNG.
 * Returns a function that produces floats in [0, 1) on each call.
 * @param {number} seed - Integer seed value
 * @returns {() => number} PRNG function
 */
function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Shuffles an array of 4 answer strings using a seeded Fisher-Yates shuffle.
 * Does not mutate the input array.
 * @param {string[]} answers - Array of 4 answer strings
 * @param {number} seed - Integer seed (typically qIdx)
 * @returns {string[]} New array with answers in shuffled order
 */
export function shuffleAnswers(answers, seed) {
  // Mix in a hash of the first answer to add entropy beyond just qIdx
  // This ensures different questions at the same index get different orderings
  let mixedSeed = seed;
  if (answers.length > 0 && typeof answers[0] === 'string') {
    for (let i = 0; i < answers[0].length; i++) {
      mixedSeed = ((mixedSeed << 5) - mixedSeed + answers[0].charCodeAt(i)) | 0;
    }
  }
  const rng = mulberry32(mixedSeed);
  const result = [...answers];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
