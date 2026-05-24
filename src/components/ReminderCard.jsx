import React, { useState, useEffect, useRef } from 'react';

const DURATION_SECONDS = 15;

/**
 * ReminderCard — full-screen overlay displaying the key algebraic rule
 * for a topic before a mission begins. Auto-dismisses after 15 seconds
 * or when the student clicks "Got it".
 *
 * @param {Object} props
 * @param {string} props.topic - Topic identifier (e.g., 'linear')
 * @param {string} props.topicName - Display name (e.g., 'Linear Equations')
 * @param {string} props.rule - The Topic_Rule text to display
 * @param {function} props.onDismiss - Called when card is dismissed (timer or button)
 */
export function ReminderCard({ topic, topicName, rule, onDismiss }) {
  const [secondsLeft, setSecondsLeft] = useState(DURATION_SECONDS);
  const intervalRef = useRef(null);
  const timeoutRef = useRef(null);

  useEffect(() => {
    // Auto-dismiss after 15 seconds
    timeoutRef.current = setTimeout(() => {
      onDismiss();
    }, DURATION_SECONDS * 1000);

    // Countdown interval — tick every second
    intervalRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) return 0;
        return prev - 1;
      });
    }, 1000);

    // Cleanup on unmount (back navigation support)
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [onDismiss]);

  const handleDismiss = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);
    onDismiss();
  };

  return (
    <div className="absolute inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-cyan-400/50 rounded-2xl shadow-2xl max-w-md w-full p-6 sm:p-8 text-center">
        {/* Topic name */}
        <h2 className="text-lg sm:text-xl font-bold text-cyan-300 uppercase tracking-wide mb-4">
          {topicName}
        </h2>

        {/* Key rule icon */}
        <div className="text-4xl mb-4">📐</div>

        {/* Rule text */}
        <p className="text-white text-xl sm:text-2xl font-black leading-snug mb-6">
          {rule}
        </p>

        {/* Countdown */}
        <div className="text-slate-400 text-sm font-medium mb-6">
          Starting in <span className="text-cyan-300 font-bold">{secondsLeft}</span>s
        </div>

        {/* Got it button */}
        <button
          onClick={handleDismiss}
          className="w-full bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 active:scale-95 text-white font-black text-lg py-3 rounded-xl shadow-lg border-2 border-white/20 transition-all touch-manipulation"
        >
          Got it
        </button>
      </div>
    </div>
  );
}
