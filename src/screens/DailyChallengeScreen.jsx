import React, { useState } from 'react';
import { ArrowLeft, Flame } from 'lucide-react';
import { MathText } from '../components/MathText.jsx';
import { shuffleAnswers } from '../utils/shuffleAnswers.js';

/**
 * DailyChallengeScreen — a 3-question daily quiz without shooter gameplay.
 * Props:
 *   questions — array of 3 question objects (from getDailyQuestions)
 *   onAnswer — callback(questionIndex, selectedAnswer, correct) for each answer
 *   onComplete — callback(correctCount) when all 3 questions are answered
 *   streak — current daily streak count
 *   soundOn — boolean
 *   setScreen — navigation callback
 */
export function DailyChallengeScreen({ questions = [], onAnswer, onComplete, streak = 0, soundOn, setScreen }) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [completed, setCompleted] = useState(false);

  const q = questions[currentIdx];
  const total = questions.length || 3;

  const handleAnswer = (answer) => {
    if (feedback || completed) return;
    if (!q) return;

    const correct = answer === q.a;
    const newCorrectCount = correct ? correctCount + 1 : correctCount;

    setFeedback({ correct, answer, correctAnswer: q.a });
    if (correct) setCorrectCount(newCorrectCount);

    if (onAnswer) onAnswer(currentIdx, answer, correct);

    // Advance after delay
    setTimeout(() => {
      setFeedback(null);
      if (currentIdx + 1 >= total) {
        setCompleted(true);
        if (onComplete) onComplete(newCorrectCount);
      } else {
        setCurrentIdx(currentIdx + 1);
      }
    }, 1800);
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
        <div className={`max-w-lg mx-auto w-full text-center p-4 rounded-2xl border-2 ${feedback.correct ? 'bg-emerald-500/30 border-emerald-300' : 'bg-red-500/30 border-red-300'}`}>
          <div className="text-2xl font-black text-white mb-1">{feedback.correct ? '✓ CORRECT!' : '✗ WRONG'}</div>
          {!feedback.correct && (
            <div className="text-sm text-white mt-1">Correct: <span className="font-bold"><MathText>{feedback.correctAnswer}</MathText></span></div>
          )}
          {!feedback.correct && q.steps && q.steps.length > 0 && (
            <div className="mt-2 text-left space-y-1 max-h-32 overflow-y-auto">
              {q.steps.map((step, i) => (
                <div key={i} className="flex gap-2 items-start text-xs text-white/80">
                  <span className="bg-white/20 rounded-full w-4 h-4 flex items-center justify-center text-[9px] font-bold flex-shrink-0">{i + 1}</span>
                  <span>{step}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2 sm:gap-3 max-w-lg mx-auto w-full">
          {shuffled.map((ans, i) => (
            <button key={i} onClick={() => handleAnswer(ans)}
              className="bg-white hover:bg-yellow-200 active:scale-95 active:bg-yellow-300 text-slate-900 font-mono font-black text-base sm:text-lg md:text-xl px-3 py-4 sm:py-5 rounded-xl shadow-lg border-2 border-slate-900 transition-all touch-manipulation">
              <MathText>{ans}</MathText>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
