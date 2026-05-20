/**
 * Canvas DPI scaling utilities for high-resolution displays.
 * Ensures the game canvas renders at native resolution while
 * maintaining logical coordinate system (W×H) for all drawing.
 */

/**
 * Sets up a canvas element for high-DPI rendering.
 * Scales the backing store to match devicePixelRatio while keeping
 * CSS dimensions at the logical size. Applies ctx.scale so all
 * drawing operations use logical coordinates.
 *
 * @param {HTMLCanvasElement} canvas - The canvas element to configure
 * @param {number} logicalWidth - Logical width in CSS pixels (e.g. 400)
 * @param {number} logicalHeight - Logical height in CSS pixels (e.g. 600)
 * @returns {CanvasRenderingContext2D} The 2D context with DPI scaling applied
 */
export function setupCanvas(canvas, logicalWidth, logicalHeight) {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = logicalWidth * dpr;
  canvas.height = logicalHeight * dpr;
  canvas.style.width = `${logicalWidth}px`;
  canvas.style.height = `${logicalHeight}px`;
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
  canvas._lastDpr = dpr;
  return ctx;
}

/**
 * Checks if devicePixelRatio has changed since the last call and
 * re-applies DPI scaling if needed. Call at the top of each animation
 * frame to handle dynamic DPR changes (e.g. window moved between monitors).
 *
 * @param {HTMLCanvasElement} canvas - The canvas element to update
 * @param {CanvasRenderingContext2D} ctx - The 2D rendering context
 * @param {number} logicalWidth - Logical width in CSS pixels
 * @param {number} logicalHeight - Logical height in CSS pixels
 */
export function updateCanvasScale(canvas, ctx, logicalWidth, logicalHeight) {
  const dpr = window.devicePixelRatio || 1;
  if (dpr !== canvas._lastDpr) {
    canvas.width = logicalWidth * dpr;
    canvas.height = logicalHeight * dpr;
    canvas.style.width = `${logicalWidth}px`;
    canvas.style.height = `${logicalHeight}px`;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);
    canvas._lastDpr = dpr;
  }
}
