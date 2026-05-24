import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Heart, Timer } from 'lucide-react';
import { MathText } from '../components/MathText.jsx';
import { DiagnosticMessage } from '../components/DiagnosticMessage.jsx';
import { EXAM_TIMER_SECONDS, EXAM_QUESTION_COUNT, EXAM_LIVES, EXAM_LOW_TIMER, EXAM_CRITICAL_TIMER } from '../constants.js';
import { shuffleAnswers, getDisplayValue } from '../utils/shuffleAnswers.js';
import { getDiagnosticMessage } from '../data/errorCatalog.js';
import { resolveHints } from '../data/hintResolver.js';
import { formatHintButtonLabel } from '../data/hintCosts.js';
import { ExplainPrompt } from '../components/ExplainPrompt.jsx';

function ExamFeedbackPanel({ examFeedback, question, onDismiss, hintStage, onRequestHint }) {
  const [visibleSteps, setVisibleSteps] = useState(0);
  const resolvedHints = resolveHints(question);
  const steps = question?.steps && question.steps.length > 0 ? question.steps : null;

  const isWrongAnswer = examFeedback.type === 'wrong' || examFeedback.type === 'timeout';
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
    const label = formatHintButtonLabel('exam', hintStage);
    return (
      <button onClick={() => onRequestHint('exam')}
        className="bg-blue-500/40 hover:bg-blue-500/60 active:scale-95 text-white font-bold px-5 py-2.5 rounded-xl border border-blue-400/50 transition-all touch-manipulation text-sm">
        💡 {label}
      </button>
    );
  };

  return (
    <div className={`max-w-2xl mx-auto w-full text-center p-4 sm:p-5 rounded-2xl border-2 ${
      examFeedback.type === 'correct' ? 'bg-emerald-500/30 border-emerald-300' :
      examFeedback.type === 'timeout' ? 'bg-orange-500/30 border-orange-300' :
      'bg-red-500/30 border-red-300'
    } animate-pulse-fast`}>
      <div className="text-2xl sm:text-3xl font-black text-white mb-1">{examFeedback.text}</div>
      {examFeedback.points && <div className="text-base sm:text-lg font-bold text-yellow-300">+{examFeedback.points} <span className="text-xs text-white/70">(+{examFeedback.time}s bonus)</span></div>}
      {isWrongAnswer && <DiagnosticMessage message={examFeedback.diagnosticMessage} />}
      {examFeedback.correct && examFeedback.type !== 'correct' && <div className="text-sm sm:text-base text-white mt-2">Correct: <span className="font-bold"><MathText>{examFeedback.correct}</MathText></span></div>}

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
      {showStepsFallback ? (
        <div className="mt-3 text-left space-y-1.5 max-h-48 overflow-y-auto">
          {steps.map((step, i) => (
            <div key={i} className={`flex gap-2 items-start text-xs sm:text-sm text-white/90 transition-all duration-300 ${i < visibleSteps ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
              <span className="bg-white/20 rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-bold flex-shrink-0">{i + 1}</span>
              <span>{step}</span>
            </div>
          ))}
        </div>
      ) : (
        !hasProgressiveHints && examFeedback.hint && <div className="text-xs sm:text-sm text-white/90 mt-1">💡 {examFeedback.hint}</div>
      )}

      {examFeedback.livesLeft !== undefined && (
        <div className="text-xs sm:text-sm text-red-200 mt-2 font-bold">
          {examFeedback.livesLeft > 0 ? `${examFeedback.livesLeft} ${examFeedback.livesLeft === 1 ? 'life' : 'lives'} remaining` : 'No lives left — exam over'}
        </div>
      )}

      {/* Action buttons for wrong/timeout answers */}
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

export function ExamScreen({ questions, qIdx, score, examTimer, examLives, examFeedback, soundOn, handleExamAnswer, setScreen, gameRef, onTeachMe, onDismissTeachMe, hintStage, onRequestHint, explainPromptData, explainPaused, onExplainResponse }) {
  const [shakeOffset, setShakeOffset] = useState(0);
  const [flashOpacity, setFlashOpacity] = useState(0);
  const [flashColor, setFlashColor] = useState('#ef4444');
  const rafRef = useRef(null);

  // Decay shake/flash values on gameRef and update local CSS state via rAF
  const decayEffects = useCallback(() => {
    if (!gameRef || !gameRef.current) {
      rafRef.current = requestAnimationFrame(decayEffects);
      return;
    }
    const game = gameRef.current;

    if (game.shake > 0) {
      setShakeOffset((Math.random() - 0.5) * game.shake);
      game.shake--;
    } else {
      setShakeOffset(0);
    }

    if (game.flash > 0) {
      setFlashColor(game.flashColor || '#ef4444');
      setFlashOpacity(game.flash / 32);
      game.flash--;
    } else {
      setFlashOpacity(0);
    }

    rafRef.current = requestAnimationFrame(decayEffects);
  }, [gameRef]);

  useEffect(() => {
    rafRef.current = requestAnimationFrame(decayEffects);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [decayEffects]);

  const q = questions[qIdx];
  if (!q) {
    return <div className="w-full h-screen bg-black flex items-center justify-center text-white">Loading...</div>;
  }

  const allAnswers = [q.a, ...q.wrong];
  const shuffled = shuffleAnswers(allAnswers, qIdx);

  const timeLow = examTimer <= EXAM_LOW_TIMER;
  const timeCritical = examTimer <= EXAM_CRITICAL_TIMER;
  const timerPct = (examTimer / EXAM_TIMER_SECONDS) * 100;
  const timerColor = timeCritical ? 'text-red-500' : timeLow ? 'text-amber-400' : 'text-emerald-400';
  const timerBgColor = timeCritical ? 'from-red-500 to-red-700' : timeLow ? 'from-amber-400 to-orange-500' : 'from-emerald-400 to-emerald-600';

  // Parse flash color for rgba overlay
  const parseHexColor = (hex) => {
    const c = hex || '#ef4444';
    const r = parseInt(c.slice(1, 3), 16);
    const g = parseInt(c.slice(3, 5), 16);
    const b = parseInt(c.slice(5, 7), 16);
    return { r, g, b };
  };

  const { r, g, b } = parseHexColor(flashColor);

  return (
    <div
      className={`w-full h-screen min-h-[600px] bg-gradient-to-br from-red-950 via-black to-red-950 overflow-hidden relative ${timeCritical && !examFeedback ? 'animate-shake-fast' : ''}`}
      style={{
        height: '100dvh',
        transform: shakeOffset !== 0 ? `translateX(${shakeOffset}px)` : undefined,
      }}
    >
      {/* Pulsing red border indicating exam stress */}
      <div className={`absolute inset-0 pointer-events-none border-4 sm:border-8 ${timeCritical ? 'border-red-500 animate-pulse-fast' : timeLow ? 'border-red-600 animate-pulse' : 'border-red-700/50'}`} />

      {/* Background scanning effect */}
      <div className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: 'linear-gradient(transparent 50%, rgba(220,38,38,0.1) 50%)',
          backgroundSize: '100% 4px',
        }} />

      {/* Flash overlay from wrong answer feedback */}
      {flashOpacity > 0 && (
        <div
          className="absolute inset-0 pointer-events-none z-50"
          style={{ backgroundColor: `rgba(${r}, ${g}, ${b}, ${flashOpacity})` }}
        />
      )}

      <div className="relative z-10 flex flex-col h-full p-3 sm:p-4 md:p-6">
        {/* Top HUD */}
        <div className="flex items-center justify-between mb-3 sm:mb-4 gap-2">
          <button onClick={() => {
            if (confirm('Abandon exam? Progress will be lost.')) setScreen('topicSelect');
          }} className="bg-white/10 hover:bg-white/20 active:bg-white/30 text-white p-2 rounded-full touch-manipulation">
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          <div className="text-center flex-1">
            <div className="text-[10px] sm:text-xs text-red-300 font-black tracking-widest uppercase">
              Exam Q {qIdx + 1} / {EXAM_QUESTION_COUNT}
            </div>
            <div className="text-[10px] sm:text-xs text-slate-400 tracking-widest">Score: <span className="text-amber-300 font-bold tabular-nums">{score}</span></div>
          </div>

          <div className="flex items-center gap-1">
            {Array.from({ length: EXAM_LIVES }).map((_, i) => (
              <Heart key={i} className={`w-4 h-4 sm:w-5 sm:h-5 ${i < examLives ? 'text-red-500 fill-red-500' : 'text-slate-700'} ${examLives <= 1 && i < examLives ? 'animate-pulse' : ''}`} />
            ))}
          </div>
        </div>

        {/* Question Progress Bar */}
        <div className="mb-3 sm:mb-4">
          <div className="h-1.5 bg-slate-900 rounded-full overflow-hidden border border-red-500/30">
            <div className="h-full bg-gradient-to-r from-red-500 to-amber-500 transition-all duration-500"
              style={{ width: `${((qIdx + 1) / EXAM_QUESTION_COUNT) * 100}%` }} />
          </div>
        </div>

        {/* Big Timer */}
        <div className="text-center mb-4 sm:mb-6">
          <div className="text-[10px] sm:text-xs text-slate-400 uppercase tracking-widest mb-1 flex items-center justify-center gap-1.5">
            <Timer className="w-3 h-3" /> Time Remaining
          </div>
          <div className={`text-6xl sm:text-7xl md:text-8xl font-black tabular-nums leading-none ${timerColor} ${timeCritical ? 'animate-pulse-fast' : ''}`}
            style={{ textShadow: timeCritical ? '0 0 20px rgba(239,68,68,0.8)' : timeLow ? '0 0 15px rgba(251,191,36,0.5)' : 'none' }}>
            {examTimer}
          </div>
          <div className="text-[10px] sm:text-xs text-slate-400 uppercase tracking-widest">seconds</div>

          {/* Timer bar */}
          <div className="mt-2 max-w-xs mx-auto h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-700">
            <div className={`h-full bg-gradient-to-r ${timerBgColor} transition-all duration-1000 ease-linear`}
              style={{ width: `${timerPct}%` }} />
          </div>
        </div>

        {/* Question */}
        <div className="flex-1 flex items-center justify-center mb-3 sm:mb-4">
          <div className={`bg-black/70 backdrop-blur-sm rounded-2xl p-5 sm:p-6 md:p-8 border-2 ${timeCritical ? 'border-red-500 shadow-lg shadow-red-500/50' : 'border-red-500/40'} max-w-2xl w-full`}>
            <div className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-white text-center font-mono whitespace-pre-line leading-tight">
              <MathText>{q.q}</MathText>
            </div>
          </div>
        </div>

        {/* Feedback or Answers */}
        {examFeedback ? (
          <ExamFeedbackPanel examFeedback={examFeedback} question={q} onDismiss={onDismissTeachMe} hintStage={hintStage} onRequestHint={onRequestHint} />
        ) : (
          <div className="max-w-2xl mx-auto w-full">
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              {shuffled.map((ans, i) => {
                const display = getDisplayValue(ans);
                return (
                  <button key={i} onClick={() => handleExamAnswer(display)}
                    className="bg-white hover:bg-yellow-200 active:scale-95 active:bg-yellow-300 text-slate-900 font-mono font-black text-base sm:text-lg md:text-xl px-3 py-4 sm:py-5 md:py-6 rounded-xl shadow-lg border-2 border-slate-900 transition-all touch-manipulation">
                    <MathText>{display}</MathText>
                  </button>
                );
              })}
            </div>
            {q.steps && q.steps.length > 0 && onTeachMe && hintStage === 0 && (
              <button onClick={() => onTeachMe(q)}
                className="mt-3 w-full bg-purple-600/60 hover:bg-purple-500/70 active:scale-95 text-white font-bold text-sm py-2.5 rounded-xl border border-purple-400/40 transition-all touch-manipulation">
                💡 Teach Me
              </button>
            )}
          </div>
        )}
      </div>

      {/* Explain Your Answer prompt overlay — exam timer is paused via explainPaused */}
      {explainPromptData && (
        <ExplainPrompt
          prompt={explainPromptData.prompt}
          options={explainPromptData.options}
          correctIndex={explainPromptData.correctIndex}
          onComplete={onExplainResponse}
        />
      )}

      <style>{`
        @keyframes pulse-fast { 0%, 100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.04); opacity: 0.85; } }
        .animate-pulse-fast { animation: pulse-fast 0.6s ease-in-out infinite; }
        @keyframes shake-fast { 0%, 100% { transform: translate(0, 0); } 25% { transform: translate(-2px, 1px); } 50% { transform: translate(2px, -1px); } 75% { transform: translate(-1px, -1px); } }
        .animate-shake-fast { animation: shake-fast 0.2s ease-in-out infinite; }
        .math-sup { font-size: 0.62em; vertical-align: super; line-height: 0; margin-left: 0.5px; }
        .math-sub { font-size: 0.62em; vertical-align: sub; line-height: 0; margin-left: 0.5px; }
      `}</style>
    </div>
  );
}
