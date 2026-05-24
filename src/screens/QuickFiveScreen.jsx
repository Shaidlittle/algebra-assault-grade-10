import React, { useState, useEffect, useCallback } from 'react';
import { ArrowLeft } from 'lucide-react';
import { MathText } from '../components/MathText.jsx';
import { shuffleAnswers, getDisplayValue } from '../utils/shuffleAnswers.js';
import { getDiagnosticMessage } from '../data/errorCatalog.js';
import { DiagnosticMessage } from '../components/DiagnosticMessage.jsx';
import { generateQuestionPool } from '../data/questionGenerator.js';
import { PLAYABLE_TOPICS } from '../data/questions.js';

const TOTAL_QUESTIONS = 5;
const XP_PER_CORRECT = 20;

/**
 * Pick 5 questions from random topics and random difficulties.
 * Each question is drawn from a different random topic/difficulty combination.
 */
function pickFiveQuestions() {
  const difficulties = ['easy', 'medium', 'hard'];
  const questions = [];

  for (let i = 0; i < TOTAL_QUESTIONS; i++) {
    const topic = PLAYABLE_TOPICS[Math.floor(Math.random() * PLAYABLE_TOPICS.length)];
    const difficulty = difficulties[Math.floor(Math.random() * difficulties.length)];
    const pool = generateQuestionPool(topic, difficulty, 1);
    if (pool.length > 0) {
      questions.push(pool[0]);
    }
  }

  // Fallback: if we couldn't get enough, fill with linear easy
  while (questions.length < TOTAL_QUESTIONS) {
    const pool = generateQuestionPool('linear', 'easy', 1);
    if (pool.length > 0) {
      questions.push(pool[0]);
    } else {
      break;
    }
  }

  return questions;
}

/**
 * QuickFiveScreen — a quick 5-question session without shooter gameplay.
 * Props:
 *   onBack — callback to return to menu
 *   onXPAward — callback(amount) to award XP
 *   soundOn — boolean for sound state
 */
export function QuickFiveScreen({ onBack, onXPAward, soundOn }) {
  const [questions, setQuestions] = useState(() => pickFiveQuestions());
  const [currentIdx, setCurrentIdx] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [xpEarned, setXpEarned] = useState(0);

  const q = questions[currentIdx];

  // Keyboard support: number keys 1-4 to select answers
  useEffect(() => {
    if (feedback || completed || !q) return;

    const handleKeyDown = (e) => {
      const keyNum = parseInt(e.key);
      if (keyNum >= 1 && keyNum <= 4) {
        const shuffled = shuffleAnswers([q.a, ...q.wrong], currentIdx);
        if (shuffled[keyNum - 1]) {
          handleAnswer(getDisplayValue(shuffled[keyNum - 1]));
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [feedback, completed, q, currentIdx]);

  const handleAnswer = useCallback((answer) => {
    if (feedback || completed || !q) return;

    const correct = answer === q.a;

    // Look up diagnostic message for wrong answers
    let diagnosticMessage = null;
    if (!correct && q.wrong) {
      const matchedDistractor = q.wrong.find(d => getDisplayValue(d) === answer);
      if (matchedDistractor && matchedDistractor.tag) {
        diagnosticMessage = getDiagnosticMessage(matchedDistractor.tag);
      }
    }

    setFeedback({ correct, answer, correctAnswer: q.a, diagnosticMessage });

    if (correct) {
      const newCorrectCount = correctCount + 1;
      const newXp = xpEarned + XP_PER_CORRECT;
      setCorrectCount(newCorrectCount);
      setXpEarned(newXp);

      // Award XP via callback
      if (onXPAward) onXPAward(XP_PER_CORRECT);

      // Auto-advance after 1 second for correct answers
      setTimeout(() => {
        setFeedback(null);
        if (currentIdx + 1 >= TOTAL_QUESTIONS) {
          setCompleted(true);
        } else {
          setCurrentIdx(currentIdx + 1);
        }
      }, 1000);
    }
  }, [feedback, completed, q, correctCount, xpEarned, currentIdx, onXPAward]);

  const handleNext = () => {
    setFeedback(null);
    if (currentIdx + 1 >= TOTAL_QUESTIONS) {
      setCompleted(true);
    } else {
      setCurrentIdx(currentIdx + 1);
    }
  };

  // Loading state
  if (!questions || questions.length === 0) {
    return (
      <div className="w-full h-screen min-h-[600px] bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 flex items-center justify-center p-4" style={{ height: '100dvh' }}>
        <div className="text-center text-white">
          <p>Loading questions...</p>
        </div>
      </div>
    );
  }

  // Summary screen
  if (completed) {
    const accuracy = Math.round((correctCount / TOTAL_QUESTIONS) * 100);
    const emoji = correctCount === TOTAL_QUESTIONS ? '🏆' : correctCount >= 3 ? '⭐' : '💪';

    return (
      <div className="w-full h-screen min-h-[600px] bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 flex flex-col items-center justify-center p-4" style={{ height: '100dvh' }}>
        <div className="text-center max-w-sm w-full">
          <div className="text-5xl mb-4">{emoji}</div>
          <h2 className="text-2xl font-black text-white mb-4">Quick Five Complete!</h2>

          <div className="bg-black/40 backdrop-blur-sm rounded-2xl p-6 border border-white/20 space-y-3 mb-6">
            <div className="flex justify-between items-center">
              <span className="text-slate-300 text-sm">Correct</span>
              <span className="text-white font-bold text-lg">{correctCount} / {TOTAL_QUESTIONS}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-300 text-sm">Accuracy</span>
              <span className="text-cyan-300 font-bold text-lg">{accuracy}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-300 text-sm">XP Earned</span>
              <span className="text-amber-400 font-bold text-lg">+{xpEarned} XP</span>
            </div>
          </div>

          <button
            onClick={onBack}
            className="bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 active:scale-95 text-white font-bold px-8 py-3 rounded-xl transition-all touch-manipulation min-h-[44px]"
          >
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
        <button
          onClick={onBack}
          className="text-slate-300 hover:text-white flex items-center gap-1 text-sm min-h-[44px] min-w-[44px] touch-manipulation"
        >
          <ArrowLeft className="w-4 h-4" /> Menu
        </button>
        <div className="text-slate-400 text-sm font-bold">Quick Five</div>
      </div>

      {/* Progress indicator */}
      <div className="flex gap-2 mb-6 justify-center flex-shrink-0">
        {Array.from({ length: TOTAL_QUESTIONS }).map((_, i) => (
          <div
            key={i}
            className={`w-12 sm:w-16 h-2 rounded-full ${
              i < currentIdx ? 'bg-cyan-400' : i === currentIdx ? 'bg-white' : 'bg-slate-700'
            }`}
          />
        ))}
      </div>

      <div className="text-center text-slate-400 text-xs uppercase tracking-widest mb-2 flex-shrink-0">
        Question {currentIdx + 1} of {TOTAL_QUESTIONS}
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
        <div className={`max-w-lg mx-auto w-full text-center p-4 rounded-2xl border-2 ${
          feedback.correct ? 'bg-emerald-500/30 border-emerald-300' : 'bg-red-500/30 border-red-300'
        }`}>
          <div className="text-2xl font-black text-white mb-1">
            {feedback.correct ? '✓ CORRECT!' : '✗ WRONG'}
          </div>
          {!feedback.correct && (
            <>
              <DiagnosticMessage message={feedback.diagnosticMessage} />
              <div className="text-sm text-white mt-1">
                Correct: <span className="font-bold"><MathText>{feedback.correctAnswer}</MathText></span>
              </div>
              <button
                onClick={handleNext}
                className="mt-4 bg-white/20 hover:bg-white/30 active:scale-95 text-white font-bold px-6 py-2.5 rounded-xl border border-white/30 transition-all touch-manipulation min-h-[44px]"
              >
                Next →
              </button>
            </>
          )}
          {feedback.correct && (
            <div className="text-sm text-emerald-200 mt-1">+{XP_PER_CORRECT} XP</div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 max-w-lg mx-auto w-full">
          {shuffled.map((ans, i) => (
            <button
              key={i}
              onClick={() => handleAnswer(getDisplayValue(ans))}
              className="bg-white hover:bg-yellow-200 active:scale-95 active:bg-yellow-300 text-slate-900 font-mono font-black text-base sm:text-lg md:text-xl px-3 py-4 sm:py-5 rounded-xl shadow-lg border-2 border-slate-900 transition-all touch-manipulation min-h-[44px]"
            >
              <span className="text-slate-400 text-xs mr-2">{i + 1}</span>
              <MathText>{getDisplayValue(ans)}</MathText>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
