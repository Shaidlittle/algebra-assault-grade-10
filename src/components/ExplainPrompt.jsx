import React, { useState, useEffect, useRef, useCallback } from 'react';
import { BONUS_POINTS, TIMEOUT_MS, DISMISS_DELAY_MS } from '../data/explainTrigger';

/**
 * ExplainPrompt — a follow-up multiple-choice question shown after a correct answer
 * to verify the student understood the method rather than guessing.
 *
 * @param {Object} props
 * @param {string} props.prompt - The follow-up question text
 * @param {string[]} props.options - Array of 3 option strings
 * @param {number} props.correctIndex - Index of correct option (0-2)
 * @param {function} props.onComplete - Called with { correct: boolean, bonusPoints: number }
 */
export function ExplainPrompt({ prompt, options, correctIndex, onComplete }) {
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [disabled, setDisabled] = useState(false);

  const timeoutRef = useRef(null);
  const dismissRef = useRef(null);

  const handleComplete = useCallback((result) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (dismissRef.current) clearTimeout(dismissRef.current);
    onComplete(result);
  }, [onComplete]);

  // Auto-dismiss after 15 seconds of inactivity
  useEffect(() => {
    timeoutRef.current = setTimeout(() => {
      handleComplete({ correct: false, bonusPoints: 0 });
    }, TIMEOUT_MS);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (dismissRef.current) clearTimeout(dismissRef.current);
    };
  }, [handleComplete]);

  const handleSelect = (index) => {
    if (disabled) return;

    // Clear the inactivity timeout
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    setSelectedIndex(index);
    setDisabled(true);

    const isCorrect = index === correctIndex;
    const result = {
      correct: isCorrect,
      bonusPoints: isCorrect ? BONUS_POINTS : 0,
    };

    // Auto-dismiss after 2 seconds
    dismissRef.current = setTimeout(() => {
      onComplete(result);
    }, DISMISS_DELAY_MS);
  };

  const getButtonClasses = (index) => {
    const base =
      'w-full min-h-[44px] px-4 py-3 rounded-xl font-semibold text-left transition-all touch-manipulation text-sm sm:text-base';

    if (selectedIndex === null) {
      // No selection yet — default state
      return `${base} bg-slate-700/80 border-2 border-slate-500/50 text-white hover:border-cyan-400/70 hover:bg-slate-600/80 active:scale-[0.98]`;
    }

    // After selection
    if (index === correctIndex) {
      // Correct option — always highlight green after any selection
      return `${base} bg-emerald-500/30 border-2 border-emerald-400 text-emerald-100`;
    }

    if (index === selectedIndex && index !== correctIndex) {
      // Selected wrong option — highlight red
      return `${base} bg-red-500/30 border-2 border-red-400 text-red-100`;
    }

    // Unselected, non-correct option after selection
    return `${base} bg-slate-700/40 border-2 border-slate-600/30 text-slate-400 opacity-60`;
  };

  return (
    <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-purple-400/50 rounded-2xl shadow-2xl max-w-md w-full p-5 sm:p-7">
        {/* Header */}
        <div className="flex items-center gap-2 mb-4">
          <span className="text-2xl">🧠</span>
          <h3 className="text-base sm:text-lg font-bold text-purple-300">
            Explain Your Answer
          </h3>
        </div>

        {/* Prompt text */}
        <p className="text-white text-base sm:text-lg font-semibold mb-5 leading-snug">
          {prompt}
        </p>

        {/* Option buttons */}
        <div className="flex flex-col gap-3 mb-4">
          {options.map((option, index) => (
            <button
              key={index}
              onClick={() => handleSelect(index)}
              disabled={disabled}
              className={getButtonClasses(index)}
              aria-label={`Option ${index + 1}: ${option}`}
            >
              <span className="inline-block w-6 text-center font-bold text-slate-400 mr-2">
                {String.fromCharCode(65 + index)}.
              </span>
              {option}
            </button>
          ))}
        </div>

        {/* Feedback message */}
        {selectedIndex !== null && selectedIndex === correctIndex && (
          <div className="bg-emerald-500/20 border border-emerald-400/40 rounded-xl px-4 py-3 text-center">
            <p className="text-emerald-100 font-bold text-sm sm:text-base">
              ✓ Nice! You understand the method.
            </p>
            <p className="text-emerald-300 font-black text-lg mt-1">
              +{BONUS_POINTS} pts
            </p>
          </div>
        )}

        {selectedIndex !== null && selectedIndex !== correctIndex && (
          <div className="bg-amber-500/20 border border-amber-400/40 rounded-xl px-4 py-3 text-center">
            <p className="text-amber-100 font-medium text-sm sm:text-base">
              The first step was: <span className="font-bold">{options[correctIndex]}</span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
