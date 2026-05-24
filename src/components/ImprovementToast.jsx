import React, { useEffect, useRef, useState } from 'react';

const DISMISS_DELAY = 4000;

/**
 * ImprovementToast — a non-blocking toast notification that appears when
 * the system detects measurable improvement in a student's accuracy or streak.
 *
 * Fixed-position overlay at the top of the screen. Auto-dismisses after 4 seconds.
 * Does not interrupt gameplay or block question answering.
 *
 * @param {Object} props
 * @param {string} props.message - The improvement message to display
 * @param {function} props.onDismiss - Callback when toast disappears (timer or animation end)
 */
export function ImprovementToast({ message, onDismiss }) {
  const [visible, setVisible] = useState(true);
  const timerRef = useRef(null);

  useEffect(() => {
    timerRef.current = setTimeout(() => {
      setVisible(false);
      // Allow exit animation to complete before calling onDismiss
      setTimeout(() => {
        if (onDismiss) onDismiss();
      }, 300);
    }, DISMISS_DELAY);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [onDismiss]);

  if (!message) return null;

  return (
    <div
      className={`fixed top-4 left-1/2 -translate-x-1/2 z-40 pointer-events-none transition-all duration-300 ease-out ${
        visible
          ? 'opacity-100 translate-y-0'
          : 'opacity-0 -translate-y-4'
      }`}
      style={{ willChange: 'transform, opacity' }}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center gap-2 bg-gradient-to-r from-yellow-500/90 to-amber-500/90 border border-yellow-300/60 rounded-xl px-4 py-3 shadow-lg shadow-yellow-500/20 backdrop-blur-sm">
        <span className="text-xl flex-shrink-0" aria-hidden="true">⭐</span>
        <p className="text-sm sm:text-base text-white font-bold leading-snug">
          {message}
        </p>
      </div>
    </div>
  );
}
