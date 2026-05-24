import React from 'react';
import { Clock, BookOpen } from 'lucide-react';

/**
 * SpacedRepetitionPrompt — modal overlay shown when spaced repetition
 * questions are due for review. Displays the count of due questions
 * and offers "Review Now" or "Skip" options.
 *
 * Props:
 *   dueCount  — number of questions due for review
 *   onReview  — callback to start the review session
 *   onSkip    — callback to dismiss the prompt
 */
export function SpacedRepetitionPrompt({ dueCount, onReview, onSkip }) {
  if (!dueCount || dueCount <= 0) return null;

  return (
    <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-cyan-400/50 rounded-2xl shadow-2xl max-w-sm w-full p-6 sm:p-8 text-center">
        {/* Icon */}
        <div className="flex items-center justify-center mb-4">
          <div className="bg-cyan-500/20 rounded-full p-3">
            <Clock className="w-8 h-8 text-cyan-300" />
          </div>
        </div>

        {/* Title */}
        <h2 className="text-lg sm:text-xl font-bold text-white mb-2">
          Review Time!
        </h2>

        {/* Due count message */}
        <p className="text-slate-300 text-sm sm:text-base mb-6">
          You have{' '}
          <span className="text-cyan-300 font-bold">{dueCount}</span>{' '}
          {dueCount === 1 ? 'question' : 'questions'} due for review.
        </p>

        {/* Review Now button (primary) */}
        <button
          onClick={onReview}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 active:scale-95 text-white font-black text-base py-3 rounded-xl shadow-lg border-2 border-white/20 transition-all touch-manipulation min-h-[44px] mb-3"
        >
          <BookOpen className="w-5 h-5" />
          Review Now
        </button>

        {/* Skip button (secondary) */}
        <button
          onClick={onSkip}
          className="w-full text-slate-400 hover:text-white text-sm font-medium py-3 rounded-xl hover:bg-slate-700/50 transition-all touch-manipulation min-h-[44px]"
        >
          Skip for now
        </button>
      </div>
    </div>
  );
}
