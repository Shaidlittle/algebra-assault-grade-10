const mql = window.matchMedia('(prefers-reduced-motion: reduce)');

/**
 * Returns the current reduced motion preference.
 * @returns {boolean} true if the user prefers reduced motion
 */
export function getReducedMotion() {
  return mql.matches;
}

/**
 * Registers a callback for reduced motion preference changes.
 * @param {function} callback - Called with a boolean when the preference changes
 * @returns {function} Cleanup function to remove the listener
 */
export function onReducedMotionChange(callback) {
  const handler = (e) => callback(e.matches);
  mql.addEventListener('change', handler);
  return () => mql.removeEventListener('change', handler);
}
