import React, { useState, useEffect } from 'react';
import { ArrowLeft, Flame } from 'lucide-react';
import { MathText } from '../components/MathText.jsx';
import { shuffleAnswers, getDisplayValue } from '../utils/shuffleAnswers.js';
import { getDiagnosticMessage } from '../data/errorCatalog.js';
import { DiagnosticMessage } from '../components/DiagnosticMessage.jsx';
import { resolveHints } from '../data/hintResolver.js';
import { formatHintButtonLabel } from '../data/hintCosts.js';
import { ExplainPrompt } from '../components/ExplainPrompt.jsx';

/**
 * DailyChallengeFeedbackPanel — feedback panel with progressive hint support.
 */
function DailyChallengeFeedbackPanel({ feedback, question, onDismiss, hintStage, onRequestHint }) {
  const [visibleSteps, setVisibleSteps] = useState(0);
  const resolvedHints = resolveHints(question);
  const steps = question?.steps && question.steps.length > 0 ? question.steps : null;

  const isWrongAnswer = !feedback.correct;
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
    const label = formatHintButtonLabel('dailyChallenge', hintStage);
    return (
      <button onClick={() => onRequestHint('dailyChallenge')}
        className="bg-blue-500/40 hover:bg-blue-500/60 active:scale-95 text-white font-bold px-5 py-2.5 rounded-xl border border-blue-400/50 transition-all touch-manipulation text-sm">
        💡 {label}
      </button>
    );
  };

  return (
    <div className={`max-w-lg mx-auto w-full text-center p-4 rounded-2xl border-2 ${feedback.correct ? 'bg-emerald-500/30 border-emerald-300' : 'bg-red-500/30 border-red-300'} animate-pulse-fast`}>
      <div className="text-2xl font-black text-white mb-1">{feedback.correct ? '✓ CORRECT!' : '✗ WRONG'}</div>
      {isWrongAnswer && (
        <>
          <DiagnosticMessage message={feedback.diagnosticMessage} />
          <div className="text-sm text-white mt-1">Correct: <span className="font-bold"><MathText>{feedback.correctAnswer}</MathText></span></div>
        </>
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
 * DailyChallengeScreen — a 3-question daily quiz without shooter gameplay.
 * Props:
 *   questions — array of 3 question objects (from getDailyQuestions)
 *   onAnswer — callback(questionIndex, selectedAnswer, correct) for each answer
 *   onComplete — callback(correctCount) when all 3 questions are answered
 *   streak — current daily streak count
 *   soundOn — boolean
 *   setScreen — navigation callback
 *   hintStage — current hint stage (0-3)
 *   onRequestHint — callback to request next hint
 */
export function DailyChallengeScreen({ questions = [], onAnswer, onComplete, streak = 0, soundOn, setScreen, hintStage = 0, onRequestHint, explainPromptData, onExplainResponse }) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [completed, setCompleted] = useState(false);

  const q = questions[currentIdx];
  const total = questions.length || 3;

  const handleDismissFeedback = () => {
    setFeedback(null);
    if (currentIdx + 1 >= total) {
      setCompleted(true);
      if (onComplete) onComplete(correctCount);
    } else {
      setCurrentIdx(currentIdx + 1);
    }
  };

  const handleAnswer = (answer) => {
    if (feedback || completed) return;
    if (!q) return;

    const correct = answer === q.a;
    const newCorrectCount = correct ? correctCount + 1 : correctCount;

    // Look up diagnostic message for wrong answers
    let diagnosticMessage = null;
    if (!correct && q.wrong) {
      const matchedDistractor = q.wrong.find(d => getDisplayValue(d) === answer);
      if (matchedDistractor && matchedDistractor.tag) {
        diagnosticMessage = getDiagnosticMessage(matchedDistractor.tag);
      }
    }

    setFeedback({ correct, answer, correctAnswer: q.a, diagnosticMessage });
    if (correct) setCorrectCount(newCorrectCount);

    if (onAnswer) onAnswer(currentIdx, answer, correct);

    // Only auto-advance for correct answers; wrong answers wait for user to click Continue
    if (correct) {
      setTimeout(() => {
        setFeedback(null);
        if (currentIdx + 1 >= total) {
          setCompleted(true);
          if (onComplete) onComplete(newCorrectCount);
        } else {
          setCurrentIdx(currentIdx + 1);
        }
      }, 1800);
    }
  };

  if (!questions || questions.length === 0) {
    return (
      <div className="w-full h-screen min-h-[600px] bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 flex items-center justify-center p-4" style={{ height: '100dvh' }}>
        <div className="text-center text-white">
          <p>Loading daily challenge...</p>
        </div>
      </div>
    );
  }

  if (completed) {
    return (
      <div className="w-full h-screen min-h-[600px] bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 flex flex-col items-center justify-center p-4" style={{ height: '100dvh' }}>
        <div className="text-center max-w-sm">
          <div className="text-5xl mb-4">{correctCount === total ? '🏆' : correctCount >= 2 ? '⭐' : '💪'}</div>
          <h2 className="text-2xl font-black text-white mb-2">Daily Challenge Complete!</h2>
          <div className="text-lg text-cyan-300 font-bold mb-1">{correctCount}/{total} Correct</div>
          {streak > 0 && (
            <div className="flex items-center justify-center gap-1 text-amber-400 font-bold text-sm mb-4">
              <Flame className="w-4 h-4" /> {streak} day streak!
            </div>
          )}
          <button onClick={() => setScreen('menu')}
            className="mt-4 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 active:scale-95 text-white font-bold px-8 py-3 rounded-xl transition-all touch-manipulation">
            Back to Menu
          </button>
        </div>
      </div>
    );
  }

  const shuffled = shuffleAnswers([q.a, ...q.wrong], currentIdx);

  return (
    <div className="w-full h-screen min-h-[600px] bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 flex flex-col p-4" style={{ height: '100dvh' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <button onClick={() => setScreen('menu')} className="text-slate-300 hover:text-white flex items-center gap-1 text-sm">
          <ArrowLeft className="w-4 h-4" /> Menu
        </button>
        <div className="flex items-center gap-2">
          {streak > 0 && (
            <div className="flex items-center gap-1 text-amber-400 text-sm font-bold">
              <Flame className="w-4 h-4" /> {streak}
            </div>
          )}
          <div className="text-slate-400 text-sm font-bold">Daily Challenge</div>
        </div>
      </div>

      {/* Progress indicator */}
      <div className="flex gap-2 mb-6 justify-center flex-shrink-0">
        {Array.from({ length: total }).map((_, i) => (
          <div key={i} className={`w-16 h-2 rounded-full ${i < currentIdx ? 'bg-cyan-400' : i === currentIdx ? 'bg-white' : 'bg-slate-700'}`} />
        ))}
      </div>

      <div className="text-center text-slate-400 text-xs uppercase tracking-widest mb-2 flex-shrink-0">
        Question {currentIdx + 1} of {total}
      </div>

      {/* Question */}
      <div className="flex-1 flex items-center justify-center mb-4">
        <div className="bg-black/50 backdrop-blur-sm rounded-2xl p-6 sm:p-8 border border-white/20 max-w-lg w-full">
          <div className="text-2xl sm:text-3xl md:text-4xl font-black text-white text-center font-mono whitespace-pre-line leading-tight">
            <MathText>{q.q}</MathText>
          </div>
        </div>
      </div>

      {/* Feedback or Answers */}
      {feedback ? (
        <DailyChallengeFeedbackPanel
          feedback={feedback}
          question={q}
          onDismiss={!feedback.correct ? handleDismissFeedback : null}
          hintStage={hintStage}
          onRequestHint={onRequestHint}
        />
      ) : (
        <div className="grid grid-cols-2 gap-2 sm:gap-3 max-w-lg mx-auto w-full">
          {shuffled.map((ans, i) => (
            <button key={i} onClick={() => handleAnswer(getDisplayValue(ans))}
              className="bg-white hover:bg-yellow-200 active:scale-95 active:bg-yellow-300 text-slate-900 font-mono font-black text-base sm:text-lg md:text-xl px-3 py-4 sm:py-5 rounded-xl shadow-lg border-2 border-slate-900 transition-all touch-manipulation">
              <MathText>{getDisplayValue(ans)}</MathText>
            </button>
          ))}
        </div>
      )}

      {/* Explain Your Answer prompt overlay — auto-advance timer is naturally paused since explain triggers after feedback */}
      {explainPromptData && (
        <ExplainPrompt
          prompt={explainPromptData.prompt}
          options={explainPromptData.options}
          correctIndex={explainPromptData.correctIndex}
          onComplete={onExplainResponse}
        />
      )}

      <style>{`
        @keyframes pulse-fast { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.04); } }
        .animate-pulse-fast { animation: pulse-fast 0.6s ease-in-out infinite; }
      `}</style>
    </div>
  );
}
