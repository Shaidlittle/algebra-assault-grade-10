import React, { useState, useEffect } from 'react';
import { Heart, Pause, Play, Volume2, VolumeX, Skull, Shield, Zap, Target } from 'lucide-react';
import { MathText } from '../components/MathText.jsx';
import { DiagnosticMessage } from '../components/DiagnosticMessage.jsx';
import { W, H, MAX_HP, DMG_WRONG, HP_CORRECT_BONUS, WAVES_BEFORE_BOSS, ALIENS_PER_WAVE, POWERUP_INFO, POWERUP_DURATIONS, getMaxBossHp } from '../constants.js';
import { QUESTIONS } from '../data/questions.js';
import { shuffleAnswers, getDisplayValue } from '../utils/shuffleAnswers.js';
import { getDiagnosticMessage } from '../data/errorCatalog.js';
import { resolveHints } from '../data/hintResolver.js';
import { formatHintButtonLabel } from '../data/hintCosts.js';
import { ExplainPrompt } from '../components/ExplainPrompt.jsx';

function FeedbackPanel({ feedback, question, diagnosticMessage, onDismiss, hintStage, onRequestHint, gameMode }) {
  const [visibleSteps, setVisibleSteps] = useState(0);
  const resolvedHints = resolveHints(question);
  const steps = question?.steps && question.steps.length > 0 ? question.steps : null;

  // Determine if we should use progressive hints or fall back to old behavior
  const isWrongAnswer = feedback.type === 'wrong';
  const hasProgressiveHints = isWrongAnswer && resolvedHints !== null;
  // If resolvedHints has null entries at index 0 or 1, it's a degraded case (show solution directly)
  const isDegradedHints = hasProgressiveHints && (resolvedHints[0] === null || resolvedHints[1] === null);

  // For fallback (no progressive hints available): show steps like before
  const showStepsFallback = isWrongAnswer && !hasProgressiveHints && steps;

  // For progressive hints stage 3 or degraded hints: show full solution steps
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

  // Determine which hint button to show
  const getHintButton = () => {
    if (!hasProgressiveHints || isDegradedHints) return null;
    if (hintStage >= 3) return null; // All hints revealed, no more buttons
    const label = formatHintButtonLabel(gameMode, hintStage);
    return (
      <button onClick={() => onRequestHint(gameMode)}
        className="bg-blue-500/40 hover:bg-blue-500/60 active:scale-95 text-white font-bold px-5 py-2.5 rounded-xl border border-blue-400/50 transition-all touch-manipulation text-sm">
        💡 {label}
      </button>
    );
  };

  return (
    <div className={`text-center p-4 sm:p-5 rounded-2xl ${feedback.type === 'correct' ? 'bg-emerald-500/30 border-2 border-emerald-300' : 'bg-red-500/30 border-2 border-red-300'} animate-pulse-fast`}>
      <div className="text-2xl sm:text-3xl font-black text-white mb-1">{feedback.text}</div>
      {feedback.points && <div className="text-lg sm:text-xl font-bold text-yellow-300">+{feedback.points}</div>}
      {feedback.hpBonus > 0 && <div className="text-sm sm:text-base font-bold text-emerald-300 mt-1">+{feedback.hpBonus} HP restored ❤️</div>}
      {feedback.shieldBonus && <div className="text-sm sm:text-base font-bold text-cyan-300 mt-1">Shield activated 🛡️</div>}
      {isWrongAnswer && diagnosticMessage && (
        <div className="mt-3 mb-2">
          <DiagnosticMessage message={diagnosticMessage} />
        </div>
      )}
      {feedback.correct && <div className="text-sm sm:text-base text-white mt-2">Correct: <span className="font-bold"><MathText>{feedback.correct}</MathText></span></div>}

      {/* Progressive Hint Flow */}
      {hasProgressiveHints && !isDegradedHints && (
        <div className="mt-3 space-y-2">
          {/* Stage 1: Conceptual hint */}
          {hintStage >= 1 && resolvedHints[0] && (
            <div className="bg-blue-500/20 border border-blue-400/40 rounded-xl p-3 text-left">
              <div className="text-[10px] uppercase tracking-wider text-blue-300 font-bold mb-1">💭 Think about it...</div>
              <div className="text-sm text-white/90">{resolvedHints[0]}</div>
            </div>
          )}
          {/* Stage 2: Specific hint */}
          {hintStage >= 2 && resolvedHints[1] && (
            <div className="bg-blue-500/20 border border-blue-400/40 rounded-xl p-3 text-left">
              <div className="text-[10px] uppercase tracking-wider text-blue-300 font-bold mb-1">🎯 Specific guidance</div>
              <div className="text-sm text-white/90">{resolvedHints[1]}</div>
            </div>
          )}
          {/* Stage 3: Full worked solution */}
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

      {/* Fallback: no progressive hints available, show steps like before */}
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
        !hasProgressiveHints && feedback.hint && <div className="text-xs sm:text-sm text-white/90 mt-1">💡 {feedback.hint}</div>
      )}

      {/* Action buttons */}
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

export function PlayingScreen({
  canvasRef,
  hp,
  score,
  bossActive,
  bossHp,
  waveNumber,
  aliensKilled,
  topic,
  showQuestion,
  feedback,
  paused,
  activePowerups,
  soundOn,
  questions,
  qIdx,
  handleAnswer,
  setPaused,
  setSoundOn,
  setScreen,
  handleMouseMove,
  handleMouseDown,
  handleMouseLeave,
  onTeachMe,
  onDismissTeachMe,
  hintStage,
  onRequestHint,
  explainPromptData,
  onExplainResponse,
}) {
  const [selectedAnswer, setSelectedAnswer] = useState(null);

  const topicData = QUESTIONS[topic];
  const q = questions[qIdx % Math.max(1, questions.length)];
  const allAnswers = q ? [q.a, ...q.wrong] : [];
  const shuffled = shuffleAnswers(allAnswers, qIdx);

  // Compute diagnostic message when a wrong answer is selected
  const diagnosticMessage = (() => {
    if (!feedback || feedback.type !== 'wrong' || !selectedAnswer || !q) return null;
    const selectedDisplay = getDisplayValue(selectedAnswer);
    const matchingDistractor = q.wrong.find(d => getDisplayValue(d) === selectedDisplay);
    if (!matchingDistractor) return null;
    const tag = typeof matchingDistractor === 'object' ? matchingDistractor.tag : null;
    return getDiagnosticMessage(tag);
  })();

  // Wrap handleAnswer to track the selected answer
  const wrappedHandleAnswer = (ans) => {
    setSelectedAnswer(ans);
    handleAnswer(getDisplayValue(ans));
  };

  // Clear selected answer when feedback is dismissed or question changes
  useEffect(() => {
    if (!feedback) setSelectedAnswer(null);
  }, [feedback]);

  const hpPct = (hp / MAX_HP) * 100;
  const hpColor = hp > 60 ? 'from-emerald-400 to-emerald-600' : hp > 30 ? 'from-amber-400 to-orange-500' : 'from-red-500 to-red-700';
  const hpLow = hp <= 30;

  return (
    <div className="w-full h-screen min-h-[600px] bg-black flex flex-col overflow-hidden relative" style={{ height: '100dvh' }}>
      {/* TOP HUD — in normal flow so it never covers the play area */}
      <div className="relative z-20 px-2 py-1.5 sm:py-2 bg-black/60 backdrop-blur-sm border-b border-white/10 flex-shrink-0">
        <div className="flex items-center gap-2 mb-1.5">
          <button onClick={() => setPaused(p => !p)}
            className="bg-white/10 hover:bg-white/20 active:bg-white/30 text-white p-2 rounded-full transition-colors flex-shrink-0 touch-manipulation">
            {paused ? <Play className="w-4 h-4 sm:w-5 sm:h-5" /> : <Pause className="w-4 h-4 sm:w-5 sm:h-5" />}
          </button>

          <div className="flex-1 flex items-center gap-1.5 min-w-0">
            <Heart className={`w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 ${hpLow ? 'text-red-400 animate-pulse fill-red-400' : 'text-red-300 fill-red-400'}`} />
            <div className="flex-1 h-3.5 sm:h-4 bg-slate-800 rounded-full border border-slate-600 overflow-hidden relative">
              <div className={`h-full bg-gradient-to-r ${hpColor} transition-all duration-300 ${hpLow ? 'animate-pulse' : ''}`}
                style={{ width: `${hpPct}%` }} />
              <div className="absolute inset-0 flex items-center justify-center text-[10px] sm:text-xs font-black text-white text-shadow leading-none tabular-nums">
                {hp}/{MAX_HP}
              </div>
            </div>
          </div>

          <button onClick={() => setSoundOn(s => !s)}
            className="bg-white/10 hover:bg-white/20 active:bg-white/30 text-white p-2 rounded-full transition-colors flex-shrink-0 touch-manipulation">
            {soundOn ? <Volume2 className="w-4 h-4 sm:w-5 sm:h-5" /> : <VolumeX className="w-4 h-4 sm:w-5 sm:h-5" />}
          </button>
        </div>

        <div className="flex items-center justify-around gap-2 mb-1">
          <div className="text-center">
            <div className="text-[9px] sm:text-[10px] text-slate-400 leading-none uppercase tracking-wider">Score</div>
            <div className="text-sm sm:text-base md:text-lg font-black text-white leading-tight tabular-nums">{score}</div>
          </div>

          {bossActive ? (
            <div className="text-center">
              <div className="text-[9px] sm:text-[10px] text-red-400 leading-none uppercase font-bold tracking-wider">Boss</div>
              <div className="flex gap-0.5 mt-0.5 justify-center">
                {Array.from({ length: getMaxBossHp(topic) }).map((_, i) => (
                  <div key={i} className={`w-2 h-3.5 sm:w-2.5 sm:h-4 rounded-sm ${i < bossHp ? 'bg-red-500' : 'bg-slate-700'}`} />
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center" key={aliensKilled}>
              <div className="text-[9px] sm:text-[10px] text-emerald-400 leading-none uppercase flex items-center justify-center gap-0.5 tracking-wider">
                <Skull className="w-2.5 h-2.5" /> Kills
              </div>
              <div className="text-sm sm:text-base md:text-lg font-black text-emerald-300 leading-tight tabular-nums">{aliensKilled}/{ALIENS_PER_WAVE}</div>
            </div>
          )}

          <div className="text-center">
            <div className="text-[9px] sm:text-[10px] text-slate-400 leading-none uppercase tracking-wider">{bossActive ? 'Phase' : 'Wave'}</div>
            <div className="text-sm sm:text-base md:text-lg font-black text-white leading-tight">
              {bossActive ? '👹' : `${waveNumber}/${WAVES_BEFORE_BOSS}`}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 justify-center flex-wrap min-h-[18px]">
          {Object.entries(activePowerups).map(([type, remaining]) => {
            if (remaining <= 0) return null;
            const info = POWERUP_INFO[type];
            const totalDur = POWERUP_DURATIONS[type];
            const pct = (remaining / totalDur) * 100;
            const Icon = type === 'shield' ? Shield : type === 'rapid' ? Zap : Target;
            return (
              <div key={type} className="flex items-center gap-1 bg-black/50 rounded-full px-2 py-0.5 border" style={{ borderColor: info.glow }}>
                <Icon className="w-3 h-3 sm:w-3.5 sm:h-3.5" style={{ color: info.glow }} />
                <div className="w-12 sm:w-16 h-1 sm:h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full transition-all" style={{ width: `${pct}%`, background: info.glow }} />
                </div>
                <span className="text-[9px] sm:text-[10px] font-bold text-white tabular-nums">{(remaining / 1000).toFixed(1)}s</span>
              </div>
            );
          })}
          {Object.values(activePowerups).every(r => r <= 0) && (
            <div className="text-[9px] sm:text-[10px] text-slate-500 tracking-widest">
              {bossActive ? '⚠ BOSS BATTLE ⚠' : `SECTOR: ${topicData.short.toUpperCase()}`}
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center relative overflow-hidden">
        <canvas ref={canvasRef} width={W} height={H}
          className={`touch-none select-none ${(!paused && !showQuestion) ? 'cursor-none' : 'cursor-default'}`}
          style={{ maxWidth: '100%', maxHeight: '100%', width: 'auto', height: 'auto', aspectRatio: `${W} / ${H}`, imageRendering: 'auto' }}
          onMouseMove={handleMouseMove} onMouseDown={handleMouseDown} onMouseLeave={handleMouseLeave} />
      </div>

      {paused && !showQuestion && (
        <div className="absolute inset-0 bg-black/85 backdrop-blur-sm z-30 flex items-center justify-center">
          <div className="text-center px-4">
            <div className="text-5xl font-black text-white mb-3">PAUSED</div>
            <p className="text-slate-300 mb-5 text-sm">Take a breath. Resume when ready.</p>
            <div className="flex gap-2 justify-center flex-wrap">
              <button onClick={() => setPaused(false)} className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-5 py-2.5 rounded-xl flex items-center gap-2 touch-manipulation">
                <Play className="w-4 h-4" /> Resume
              </button>
              <button onClick={() => setScreen('topicSelect')} className="bg-white/10 hover:bg-white/20 text-white font-bold px-5 py-2.5 rounded-xl touch-manipulation">Quit</button>
            </div>
          </div>
        </div>
      )}

      {showQuestion && q && (
        <div className="absolute inset-0 bg-black/90 backdrop-blur-md z-40 flex items-center justify-center p-3 sm:p-4">
          <div className={`max-w-md md:max-w-lg lg:max-w-xl w-full bg-gradient-to-br ${bossActive ? 'from-red-900 to-black border-red-400' : `${topicData.bgColor} border-white/30`} border-2 rounded-3xl p-4 sm:p-5 md:p-6 shadow-2xl`}>
            <div className="text-center mb-3 sm:mb-4">
              <div className={`inline-block px-3 py-0.5 rounded-full text-[10px] sm:text-xs font-black tracking-widest mb-2 ${bossActive ? 'bg-red-500/40 text-red-200' : 'bg-white/20 text-white'}`}>
                {bossActive ? `⚠ DAMAGE THE BOSS ⚠` : `⚡ CHECKPOINT ${qIdx + 1}/${WAVES_BEFORE_BOSS} ⚡`}
              </div>
              <div className="bg-black/60 rounded-2xl px-4 py-4 sm:px-6 sm:py-5 border border-white/20 my-2">
                <div className="text-2xl sm:text-3xl md:text-4xl font-black text-white whitespace-pre-line font-mono leading-tight"><MathText>{q.q}</MathText></div>
              </div>
              <div className="text-xs sm:text-sm text-white/80">
                {bossActive ? `Right answer = boss damage + shield bonus. Wrong = -${DMG_WRONG} HP.` : `Right answer = +${HP_CORRECT_BONUS} HP. Wrong = -${DMG_WRONG} HP.`}
              </div>
            </div>

            {feedback ? (
              <FeedbackPanel feedback={feedback} question={q} diagnosticMessage={diagnosticMessage} onDismiss={onDismissTeachMe} hintStage={hintStage} onRequestHint={onRequestHint} gameMode="playing" />
            ) : (
              <div>
                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                  {shuffled.map((ans, i) => (
                    <button key={i} onClick={() => wrappedHandleAnswer(ans)}
                      className="bg-white hover:bg-yellow-200 active:scale-95 active:bg-yellow-300 text-slate-900 font-mono font-black text-base sm:text-lg md:text-xl px-3 py-4 sm:py-5 md:py-6 rounded-xl shadow-lg border-2 border-slate-900 transition-all touch-manipulation">
                      <MathText>{getDisplayValue(ans)}</MathText>
                    </button>
                  ))}
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
        </div>
      )}

      {/* Explain Your Answer prompt overlay — game loop is already paused via explainPaused in useGameState */}
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
        .text-shadow { text-shadow: 0 0 3px rgba(0,0,0,0.9); }
        canvas { background: #000; touch-action: none; }
        .math-sup { font-size: 0.62em; vertical-align: super; line-height: 0; margin-left: 0.5px; }
        .math-sub { font-size: 0.62em; vertical-align: sub; line-height: 0; margin-left: 0.5px; }
      `}</style>
    </div>
  );
}
