import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MathText } from '../components/MathText.jsx';
import { shuffleAnswers, getDisplayValue } from '../utils/shuffleAnswers.js';
import { getDiagnosticMessage } from '../data/errorCatalog.js';
import { DiagnosticMessage } from '../components/DiagnosticMessage.jsx';
import { resolveHints } from '../data/hintResolver.js';
import { formatHintButtonLabel } from '../data/hintCosts.js';

/**
 * FeedbackPanel — shows correct/wrong feedback with progressive hint support.
 * ReplayGate mode has no cost for hints.
 */
function FeedbackPanel({ feedback, question, diagnosticMessage, onDismiss, hintStage, onRequestHint }) {
  const [visibleSteps, setVisibleSteps] = useState(0);
  const resolvedHints = resolveHints(question);
  const steps = question?.steps && question.steps.length > 0 ? question.steps : null;

  const isWrongAnswer = feedback.type === 'wrong';
  const hasProgressiveHints = isWrongAnswer && resolvedHints !== null;
  const isDegradedHints = hasProgressiveHints && (resolvedHints[0] === null || resolvedHints[1] === null);

  const showStepsFallback = isWrongAnswer && !hasProgressiveHints && steps;
  const solutionSteps = hasProgressiveHints && resolvedHints[2] ? resolvedHints[2] : steps;
  const showFullSolution = hasProgressiveHints && (hintStage === 3 || isDegradedHints);

  useEffect(() => {
    const shouldAnimate = showStepsFallback || showFullSolution;
    if (!shouldAnimate || !solutionSteps) return;
    setVisibleSteps(0);
    let count = 0;
    const timers = solutionSteps.map((_, i) =>
      setTimeout(() => { count++; setVisibleSteps(count); }, (i + 1) * 400)
    );
    return () => timers.forEach(clearTimeout);
  }, [showStepsFallback, showFullSolution, solutionSteps]);

  const getHintButton = () => {
    if (!hasProgressiveHints || isDegradedHints) return null;
    if (hintStage >= 3) return null;
    const label = formatHintButtonLabel('replayGate', hintStage);
    return (
      <button onClick={() => onRequestHint('replayGate')}
        className="bg-blue-500/40 hover:bg-blue-500/60 active:scale-95 text-white font-bold px-5 py-2.5 rounded-xl border border-blue-400/50 transition-all touch-manipulation text-sm">
        💡 {label}
      </button>
    );
  };

  return (
    <div className={`text-center p-4 sm:p-5 rounded-2xl ${feedback.type === 'correct' ? 'bg-emerald-500/30 border-2 border-emerald-300' : 'bg-red-500/30 border-2 border-red-300'} animate-pulse-fast`}>
      <div className="text-2xl sm:text-3xl font-black text-white mb-1">{feedback.text}</div>
      {isWrongAnswer && <DiagnosticMessage message={diagnosticMessage} />}
      {feedback.correct && (
        <div className="text-sm sm:text-base text-white mt-2">
          Correct answer: <span className="font-bold"><MathText>{feedback.correct}</MathText></span>
        </div>
      )}

      {/* Progressive Hint Flow */}
      {hasProgressiveHints && !isDegradedHints && (
        <div className="mt-3 space-y-2">
          {hintStage >= 1 && resolvedHints[0] && (
            <div className="bg-blue-500/20 border border-blue-400/40 rounded-xl p-3 text-left">
              <div className="text-[10px] uppercase tracking-wider text-blue-300 font-bold mb-1">💭 Think about it...</div>
              <div className="text-sm text-white/90">{resolvedHints[0]}</div>
            </div>
          )}
          {hintStage >= 2 && resolvedHints[1] && (
            <div className="bg-blue-500/20 border border-blue-400/40 rounded-xl p-3 text-left">
              <div className="text-[10px] uppercase tracking-wider text-blue-300 font-bold mb-1">🎯 Specific guidance</div>
              <div className="text-sm text-white/90">{resolvedHints[1]}</div>
            </div>
          )}
          {hintStage >= 3 && solutionSteps && (
            <div className="bg-blue-500/20 border border-blue-400/40 rounded-xl p-3 text-left">
              <div className="text-[10px] uppercase tracking-wider text-blue-300 font-bold mb-1">📝 Full solution</div>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {solutionSteps.map((step, i) => (
                  <div key={i} className={`flex gap-2 items-start text-xs sm:text-sm text-white/90 transition-all duration-300 ${i < visibleSteps ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
                    <span className="bg-white/20 rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-bold flex-shrink-0">{i + 1}</span>
                    <span>{step}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Degraded hints: show full solution directly */}
      {hasProgressiveHints && isDegradedHints && solutionSteps && (
        <div className="mt-3 text-left space-y-1.5 max-h-48 overflow-y-auto">
          {solutionSteps.map((step, i) => (
            <div key={i} className={`flex gap-2 items-start text-xs sm:text-sm text-white/90 transition-all duration-300 ${i < visibleSteps ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
              <span className="bg-white/20 rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-bold flex-shrink-0">{i + 1}</span>
              <span>{step}</span>
            </div>
          ))}
        </div>
      )}

      {/* Fallback: no progressive hints */}
      {showStepsFallback && (
        <div className="mt-3 text-left space-y-1.5 max-h-48 overflow-y-auto">
          {steps.map((step, i) => (
            <div key={i} className={`flex gap-2 items-start text-xs sm:text-sm text-white/90 transition-all duration-300 ${i < visibleSteps ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
              <span className="bg-white/20 rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-bold flex-shrink-0">{i + 1}</span>
              <span>{step}</span>
            </div>
          ))}
        </div>
      )}

      {/* Action buttons for wrong answers */}
      {isWrongAnswer && onDismiss && (
        <div className="mt-4 flex flex-wrap gap-2 justify-center">
          {getHintButton()}
          <button onClick={onDismiss}
            className="bg-white/20 hover:bg-white/30 active:scale-95 text-white font-bold px-6 py-2.5 rounded-xl border border-white/30 transition-all touch-manipulation">
            Continue →
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * ReplayGateScreen — Forced Mistake Replay screen.
 *
 * Presents 2-3 previously missed questions in a multiple-choice format.
 * Questions answered incorrectly are re-queued until all are answered correctly.
 *
 * Props:
 *   queue      - Array of mistake entries to replay
 *   onComplete - Callback when all questions answered correctly; receives resolvedTimestamps
 *   soundOn    - Boolean for sound effects (reserved for future use)
 *   hintStage  - Current hint stage (0-3)
 *   onRequestHint - Callback to request next hint
 */
export function ReplayGateScreen({ queue, onComplete, soundOn, hintStage = 0, onRequestHint }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [activeQueue, setActiveQueue] = useState(() => [...queue]);
  const [feedback, setFeedback] = useState(null);
  const [resolvedTimestamps, setResolvedTimestamps] = useState([]);
  const [completed, setCompleted] = useState(false);
  const [diagnosticMessage, setDiagnosticMessage] = useState(null);

  // Track which unique questions have been answered correctly
  const resolvedSetRef = useRef(new Set());

  // Total unique questions in the original queue
  const totalUnique = queue.length;

  // Handle edge case: empty queue
  useEffect(() => {
    if (queue.length === 0) {
      onComplete([]);
    }
  }, [queue, onComplete]);

  // Handle completion transition
  useEffect(() => {
    if (!completed) return;
    const timer = setTimeout(() => {
      onComplete(resolvedTimestamps);
    }, 1500);
    return () => clearTimeout(timer);
  }, [completed, resolvedTimestamps, onComplete]);

  const handleAnswer = useCallback((selectedAnswer) => {
    if (feedback) return; // Prevent double-tap while feedback is showing

    const currentItem = activeQueue[currentIndex];
    const question = currentItem.question;
    const isCorrect = selectedAnswer === question.a;

    if (isCorrect) {
      // Mark as resolved
      const key = `${currentItem.topic}:${currentItem.timestamp}`;
      if (!resolvedSetRef.current.has(key)) {
        resolvedSetRef.current.add(key);
        setResolvedTimestamps(prev => [
          ...prev,
          { topic: currentItem.topic, timestamp: currentItem.timestamp }
        ]);
      }

      setFeedback({ type: 'correct', text: '✓ Correct!' });
      setDiagnosticMessage(null);

      // Advance after 1200ms
      setTimeout(() => {
        setFeedback(null);
        const nextIndex = currentIndex + 1;

        // Check if all unique questions have been answered correctly
        if (resolvedSetRef.current.size >= totalUnique) {
          setCompleted(true);
        } else {
          setCurrentIndex(nextIndex);
        }
      }, 1200);
    } else {
      // Find the matching distractor to look up its error tag
      const distractor = (question.wrong || []).find(
        d => getDisplayValue(d) === selectedAnswer
      );
      const message = distractor ? getDiagnosticMessage(distractor.tag) : null;
      setDiagnosticMessage(message);

      // Show correct answer and steps — user must click Continue to advance
      setFeedback({
        type: 'wrong',
        text: '✗ Not quite',
        correct: question.a,
      });
    }
  }, [feedback, activeQueue, currentIndex, totalUnique]);

  // Dismiss feedback and advance to next question (re-queue wrong answer)
  const handleDismissFeedback = useCallback(() => {
    const currentItem = activeQueue[currentIndex];
    setFeedback(null);
    setActiveQueue(prev => [...prev, { ...currentItem, _requeued: true }]);
    setCurrentIndex(currentIndex + 1);
  }, [activeQueue, currentIndex]);

  // If queue is empty, render nothing (onComplete will fire via useEffect)
  if (queue.length === 0) return null;

  // If completed, show transition message
  if (completed) {
    return (
      <div className="w-full h-screen min-h-[600px] bg-black flex flex-col items-center justify-center" style={{ height: '100dvh' }}>
        <div className="text-center animate-pulse">
          <div className="text-3xl sm:text-4xl font-black text-emerald-400 mb-2">✓ All Clear!</div>
          <div className="text-sm sm:text-base text-white/70">Starting your mission...</div>
        </div>
      </div>
    );
  }

  const currentItem = activeQueue[currentIndex];
  // Safety check — if somehow we've gone past the queue, complete
  if (!currentItem) {
    if (!completed) {
      setCompleted(true);
    }
    return null;
  }

  const question = currentItem.question;
  const allAnswers = [question.a, ...(question.wrong || [])];
  const shuffled = shuffleAnswers(allAnswers, currentIndex);

  // Calculate how many unique questions remain (not yet resolved)
  const resolvedCount = resolvedSetRef.current.size;
  const remainingUnique = totalUnique - resolvedCount;
  const currentQuestionNumber = resolvedCount + 1;

  return (
    <div className="w-full h-screen min-h-[600px] bg-black flex flex-col items-center justify-center p-3 sm:p-4" style={{ height: '100dvh' }}>
      <div className="max-w-md md:max-w-lg lg:max-w-xl w-full bg-gradient-to-br from-indigo-900 to-black border-2 border-white/30 rounded-3xl p-4 sm:p-5 md:p-6 shadow-2xl">
        {/* Header */}
        <div className="text-center mb-3 sm:mb-4">
          <div className="inline-block px-3 py-0.5 rounded-full text-[10px] sm:text-xs font-black tracking-widest mb-2 bg-indigo-500/40 text-indigo-200">
            ⚡ QUICK REVIEW ⚡
          </div>
          <div className="text-xs sm:text-sm text-white/60 font-bold">
            Question {currentQuestionNumber} of {totalUnique}
          </div>
        </div>

        {/* Question */}
        <div className="bg-black/60 rounded-2xl px-4 py-4 sm:px-6 sm:py-5 border border-white/20 my-2">
          <div className="text-2xl sm:text-3xl md:text-4xl font-black text-white whitespace-pre-line font-mono leading-tight text-center">
            <MathText>{question.q}</MathText>
          </div>
        </div>

        <div className="text-xs sm:text-sm text-white/70 text-center mb-3">
          Answer correctly to continue to your mission
        </div>

        {/* Feedback or Answer Buttons */}
        {feedback ? (
          <FeedbackPanel
            feedback={feedback}
            question={question}
            diagnosticMessage={diagnosticMessage}
            onDismiss={feedback.type === 'wrong' ? handleDismissFeedback : null}
            hintStage={hintStage}
            onRequestHint={onRequestHint}
          />
        ) : (
          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            {shuffled.map((ans, i) => {
              const display = getDisplayValue(ans);
              return (
                <button key={i} onClick={() => handleAnswer(display)}
                  className="bg-white hover:bg-yellow-200 active:scale-95 active:bg-yellow-300 text-slate-900 font-mono font-black text-base sm:text-lg md:text-xl px-3 py-4 sm:py-5 md:py-6 rounded-xl shadow-lg border-2 border-slate-900 transition-all touch-manipulation">
                  <MathText>{display}</MathText>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <style>{`
        @keyframes pulse-fast { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.04); } }
        .animate-pulse-fast { animation: pulse-fast 0.6s ease-in-out infinite; }
      `}</style>
    </div>
  );
}
