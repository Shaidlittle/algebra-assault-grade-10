import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fc from 'fast-check';
import { setupCanvas, updateCanvasScale } from './canvasSetup.js';

/**
 * **Validates: Requirements 17.2, 17.3, 17.4**
 */

describe('Canvas DPI Scaling', () => {
  let originalDpr;

  beforeEach(() => {
    originalDpr = window.devicePixelRatio;
  });

  afterEach(() => {
    Object.defineProperty(window, 'devicePixelRatio', {
      value: originalDpr,
      writable: true,
      configurable: true,
    });
  });

  function createMockCanvas() {
    const scaleCalls = [];
    const ctx = {
      scale: vi.fn((...args) => scaleCalls.push(args)),
      setTransform: vi.fn(),
      _scaleCalls: scaleCalls,
    };
    const canvas = {
      width: 0,
      height: 0,
      style: { width: '', height: '' },
      getContext: vi.fn(() => ctx),
      _lastDpr: undefined,
    };
    return { canvas, ctx };
  }

  describe('17.2: Canvas DPI scaling dimensions', () => {
    it('canvas backing store dimensions equal logical dimensions × DPR', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 100, max: 2000 }),
          fc.integer({ min: 100, max: 2000 }),
          fc.double({ min: 1, max: 4, noNaN: true, noDefaultInfinity: true }),
          (logicalWidth, logicalHeight, dpr) => {
            Object.defineProperty(window, 'devicePixelRatio', {
              value: dpr,
              writable: true,
              configurable: true,
            });

            const { canvas } = createMockCanvas();
            setupCanvas(canvas, logicalWidth, logicalHeight);

            expect(canvas.width).toBe(logicalWidth * dpr);
            expect(canvas.height).toBe(logicalHeight * dpr);
            expect(canvas.style.width).toBe(`${logicalWidth}px`);
            expect(canvas.style.height).toBe(`${logicalHeight}px`);
          }
        ),
        { numRuns: 200 }
      );
    });
  });

  describe('17.3: Canvas context scale matches DPR', () => {
    it('ctx.scale is called with (dpr, dpr) on setup', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 100, max: 1000 }),
          fc.integer({ min: 100, max: 1000 }),
          fc.double({ min: 1, max: 4, noNaN: true, noDefaultInfinity: true }),
          (logicalWidth, logicalHeight, dpr) => {
            Object.defineProperty(window, 'devicePixelRatio', {
              value: dpr,
              writable: true,
              configurable: true,
            });

            const { canvas, ctx } = createMockCanvas();
            setupCanvas(canvas, logicalWidth, logicalHeight);

            expect(ctx.scale).toHaveBeenCalledWith(dpr, dpr);
          }
        ),
        { numRuns: 200 }
      );
    });
  });

  describe('17.4: Dynamic DPR re-application', () => {
    it('updateCanvasScale re-applies scaling when DPR changes', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 100, max: 1000 }),
          fc.integer({ min: 100, max: 1000 }),
          fc.double({ min: 1, max: 2, noNaN: true, noDefaultInfinity: true }),
          fc.double({ min: 2.01, max: 4, noNaN: true, noDefaultInfinity: true }),
          (logicalWidth, logicalHeight, dpr1, dpr2) => {
            Object.defineProperty(window, 'devicePixelRatio', {
              value: dpr1,
              writable: true,
              configurable: true,
            });

            const { canvas, ctx } = createMockCanvas();
            setupCanvas(canvas, logicalWidth, logicalHeight);

            // Change DPR
            Object.defineProperty(window, 'devicePixelRatio', {
              value: dpr2,
              writable: true,
              configurable: true,
            });

            updateCanvasScale(canvas, ctx, logicalWidth, logicalHeight);

            expect(canvas.width).toBe(logicalWidth * dpr2);
            expect(canvas.height).toBe(logicalHeight * dpr2);
            expect(ctx.setTransform).toHaveBeenCalledWith(1, 0, 0, 1, 0, 0);
            expect(ctx.scale).toHaveBeenLastCalledWith(dpr2, dpr2);
          }
        ),
        { numRuns: 200 }
      );
    });

    it('updateCanvasScale does nothing when DPR has not changed', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 100, max: 1000 }),
          fc.integer({ min: 100, max: 1000 }),
          fc.double({ min: 1, max: 4, noNaN: true, noDefaultInfinity: true }),
          (logicalWidth, logicalHeight, dpr) => {
            Object.defineProperty(window, 'devicePixelRatio', {
              value: dpr,
              writable: true,
              configurable: true,
            });

            const { canvas, ctx } = createMockCanvas();
            setupCanvas(canvas, logicalWidth, logicalHeight);

            // Reset call counts
            ctx.scale.mockClear();
            ctx.setTransform.mockClear();

            updateCanvasScale(canvas, ctx, logicalWidth, logicalHeight);

            // Should not re-apply since DPR hasn't changed
            expect(ctx.setTransform).not.toHaveBeenCalled();
            expect(ctx.scale).not.toHaveBeenCalled();
          }
        ),
        { numRuns: 200 }
      );
    });
  });
});
