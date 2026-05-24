import React, { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, BookOpen, Shuffle } from 'lucide-react';
import { MathText } from '../components/MathText.jsx';
import { DiagnosticMessage } from '../components/DiagnosticMessage.jsx';
import { QUESTIONS, PLAYABLE_TOPICS } from '../data/questions.js';
import { generateQuestionPool } from '../data/questionGenerator.js';
import { shuffleAnswers, getDisplayValue } from '../utils/shuffleAnswers.js';
import { getDiagnosticMessage } from '../data/errorCatalog.js';
import { getEncouragementMessage, getComebackMessage, getStreakCelebration } from '../utils/encouragement.js';
import { updateStreakSaver, resetStreakSaver, STREAK_THRESHOLD } from '../utils/streakSaver.js';
import { getConceptualExplanation, identifyTechnique } from '../utils/conceptualExplanations.js';

const PRACTICE_XP_RATE = 0.5;
const STANDARD_XP = 20;
const PRACTICE_XP = Math.floor(STANDARD_XP * PRACTICE_XP_RATE); // 10 XP per correct

/**
 * PracticeModeScreen — pressure-free practice without shooter gameplay.
 * No HP, no timer, no canvas, no wave mechanics.
 *
 * Props:
 *   onBack - callback to return to menu
 *   onXPAward - callback to award XP (amount)
 *   soundOn - whether sound is enabled
 */
export function PracticeModeScreen({ onBack, onXPAward, soundOn }) {
  // Phase: 'topicSelect' | 'practicing'
  const [phase, setPhase] = useState('topicSelect');
  const [selectedTopic, setSelectedTopic] = useState(null);

  // Question state
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [isCorrect, setIsCorrect] = useState(null);

  // Stats
  const [totalAnswered, setTotalAnswered] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);

  // Streak tracking for encouragement
  const [correctStreak, setCorrectStreak] = useState(0);
  const [wrongStreak, setWrongStreak] = useState(0);
  const [lastEncouragementId, setLastEncouragementId] = useState(null);
  const [encouragementMsg, setEncouragementMsg] = useState(null);

  // Streak saver state
  const [streakSaverState, setStreakSaverState] = useState({ consecutiveWrong: 0 });
  const [showStreakSaver, setShowStreakSaver] = useState(false);

  // Generate questions when topic is selected
  const startPractice = useCallback((topic) => {
    setSelectedTopic(topic);
    const pool = generateMixedPool(topic);
    setQuestions(pool);
    setCurrentIndex(0);
    setAnswered(false);
    setSelectedAnswer(null);
    setIsCorrect(null);
    setTotalAnswered(0);
    setCorrectCount(0);
    setCorrectStreak(0);
    setWrongStreak(0);
    setStreakSaverState({ consecutiveWrong: 0 });
    setShowStreakSaver(false);
    setEncouragementMsg(null);
    setPhase('practicing');
  }, []);

  // Generate a pool of questions for the selected topic
  function generateMixedPool(topic) {
    if (topic === 'mixed') {
      // Pull from all topics, mix of difficulties
      const pool = [];
      const difficulties = ['easy', 'medium', 'hard'];
      for (const t of PLAYABLE_TOPICS) {
        for (const d of difficulties) {
          const batch = generateQuestionPool(t, d, 3);
          pool.push(...batch);
        }
      }
      // Shuffle the pool
      return shuffleArray(pool);
    }
    // Single topic: generate a mix of difficulties
    const pool = [
      ...generateQuestionPool(topic, 'easy', 5),
      ...generateQuestionPool(topic, 'medium', 5),
      ...generateQuestionPool(topic, 'hard', 5),
    ];
    return shuffleArray(pool);
  }

  function shuffleArray(arr) {
    const result = [...arr];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }

  // Handle answer selection
  const handleAnswer = useCallback((answer) => {
    if (answered) return;

    const q = questions[currentIndex];
    const correct = answer === q.a;

    setAnswered(true);
    setSelectedAnswer(answer);
    setIsCorrect(correct);
    setTotalAnswered(prev => prev + 1);

    if (correct) {
      setCorrectCount(prev => prev + 1);
      const prevWrongStreak = wrongStreak;
      setWrongStreak(0);
      setCorrectStreak(prev => prev + 1);

      // Award XP at 50% rate
      if (onXPAward) {
        onXPAward(PRACTICE_XP);
      }

      // Encouragement: comeback or streak celebration
      if (prevWrongStreak > 0) {
        const msg = getComebackMessage();
        setEncouragementMsg(msg);
        setLastEncouragementId(msg.id);
      } else if (correctStreak + 1 >= 5) {
        const msg = getStreakCelebration(correctStreak + 1);
        setEncouragementMsg(msg);
        setLastEncouragementId(msg.id);
      } else {
        setEncouragementMsg(null);
      }

      // Update streak saver (correct resets it)
      const { newState } = updateStreakSaver(streakSaverState, true);
      setStreakSaverState(newState);
    } else {
      setCorrectStreak(0);
      setWrongStreak(prev => prev + 1);

      // Encouragement message on wrong answer
      const msg = getEncouragementMessage(lastEncouragementId);
      setEncouragementMsg(msg);
      setLastEncouragementId(msg.id);

      // Update streak saver
      const { newState, shouldActivate } = updateStreakSaver(streakSaverState, false);
      setStreakSaverState(newState);
      if (shouldActivate) {
        setShowStreakSaver(true);
      }
    }
  }, [answered, questions, currentIndex, wrongStreak, correctStreak, onXPAward, streakSaverState, lastEncouragementId]);

  // Handle keyboard input (1-4 for answers)
  useEffect(() => {
    if (phase !== 'practicing' || answered) return;

    const handleKeyDown = (e) => {
      const key = parseInt(e.key);
      if (key >= 1 && key <= 4) {
        const q = questions[currentIndex];
        if (!q) return;
        const allAnswers = [q.a, ...q.wrong];
        const shuffled = shuffleAnswers(allAnswers, currentIndex);
        const display = getDisplayValue(shuffled[key - 1]);
        handleAnswer(display);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [phase, answered, questions, currentIndex, handleAnswer]);

  // Move to next question
  const nextQuestion = () => {
    setShowStreakSaver(false);
    if (currentIndex + 1 >= questions.length) {
      // Generate more questions
      const moreQuestions = generateMixedPool(selectedTopic);
      setQuestions(prev => [...prev, ...moreQuestions]);
    }
    setCurrentIndex(prev => prev + 1);
    setAnswered(false);
    setSelectedAnswer(null);
    setIsCorrect(null);
    setEncouragementMsg(null);
  };

  // Handle streak saver choice
  const handleStreakSaverChoice = (choice) => {
    setShowStreakSaver(false);
    setStreakSaverState(resetStreakSaver());

    if (choice === 'easier') {
      // Insert an easier question next
      const q = questions[currentIndex];
      const topic = selectedTopic === 'mixed'
        ? PLAYABLE_TOPICS[Math.floor(Math.random() * PLAYABLE_TOPICS.length)]
        : selectedTopic;
      const easierPool = generateQuestionPool(topic, 'easy', 1);
      if (easierPool.length > 0) {
        const newQuestions = [...questions];
        newQuestions.splice(currentIndex + 1, 0, easierPool[0]);
        setQuestions(newQuestions);
      }
    }
    // For 'explanation' choice, we just dismiss — the conceptual explanation is already shown
  };

  // Render topic selection phase
  if (phase === 'topicSelect') {
    return (
      <div className="w-full min-h-screen bg-gradient-to-br from-indigo-950 via-slate-900 to-purple-950 p-4 sm:p-6 md:p-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6 sm:mb-8">
            <button
              onClick={onBack}
              className="bg-white/10 hover:bg-white/20 active:bg-white/30 text-white p-2.5 rounded-full touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label="Back to menu"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-white">Practice Mode</h1>
              <p className="text-sm text-white/60">No pressure. Learn at your own pace.</p>
            </div>
          </div>

          {/* Topic Grid */}
          <h2 className="text-sm font-bold text-white/70 uppercase tracking-wider mb-3">Choose a topic</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Mixed option */}
            <button
              onClick={() => startPractice('mixed')}
              className="bg-gradient-to-br from-pink-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 active:scale-95 text-white font-bold p-4 sm:p-5 rounded-xl border border-white/20 transition-all touch-manipulation min-h-[44px] text-left"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl"><Shuffle className="w-6 h-6" /></span>
                <div>
                  <div className="font-black text-base sm:text-lg">Mixed Topics</div>
                  <div className="text-xs text-white/70">Questions from all topics</div>
                </div>
              </div>
            </button>

            {/* Individual topics */}
            {PLAYABLE_TOPICS.map((topicKey) => {
              const topicData = QUESTIONS[topicKey];
              return (
                <button
                  key={topicKey}
                  onClick={() => startPractice(topicKey)}
                  className={`bg-gradient-to-br ${topicData.bgColor} hover:brightness-110 active:scale-95 text-white font-bold p-4 sm:p-5 rounded-xl border border-white/20 transition-all touch-manipulation min-h-[44px] text-left`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{topicData.icon}</span>
                    <div>
                      <div className="font-black text-base sm:text-lg">{topicData.name}</div>
                      <div className="text-xs text-white/70">{topicData.short}</div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // Render practicing phase
  const q = questions[currentIndex];
  if (!q) {
    return (
      <div className="w-full min-h-screen bg-gradient-to-br from-indigo-950 via-slate-900 to-purple-950 flex items-center justify-center">
        <div className="text-white text-lg">Loading questions...</div>
      </div>
    );
  }

  const allAnswers = [q.a, ...q.wrong];
  const shuffled = shuffleAnswers(allAnswers, currentIndex);
  const accuracy = totalAnswered > 0 ? Math.round((correctCount / totalAnswered) * 100) : 0;

  // Get diagnostic message for wrong answer
  const diagnosticMessage = (!isCorrect && selectedAnswer !== null)
    ? getDiagnosticForAnswer(q, selectedAnswer)
    : null;

  // Get conceptual explanation for wrong answers
  const technique = identifyTechnique(q);
  const conceptualExplanation = getConceptualExplanation(technique);

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-indigo-950 via-slate-900 to-purple-950 p-3 sm:p-4 md:p-6 flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-3 sm:mb-4 max-w-2xl mx-auto w-full">
        <button
          onClick={onBack}
          className="bg-white/10 hover:bg-white/20 active:bg-white/30 text-white p-2.5 rounded-full touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
          aria-label="Exit practice"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="text-center flex-1 px-2">
          <div className="text-[10px] sm:text-xs text-white/60 uppercase tracking-wider font-bold">
            Practice Mode
          </div>
          <div className="text-xs sm:text-sm text-white/80">
            {selectedTopic === 'mixed' ? 'Mixed Topics' : QUESTIONS[selectedTopic]?.name}
          </div>
        </div>

        {/* Stats */}
        <div className="text-right">
          <div className="text-xs text-white/60">
            {correctCount}/{totalAnswered} correct
          </div>
          <div className="text-xs text-emerald-400 font-bold">
            {accuracy}% accuracy
          </div>
        </div>
      </div>

      {/* Question area */}
      <div className="flex-1 flex flex-col items-center justify-center max-w-2xl mx-auto w-full">
        {/* Question card */}
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-5 sm:p-6 md:p-8 border border-white/10 w-full mb-4">
          <div className="text-xl sm:text-2xl md:text-3xl font-black text-white text-center font-mono whitespace-pre-line leading-relaxed">
            <MathText>{q.q}</MathText>
          </div>
        </div>

        {/* Answer buttons */}
        {!answered && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 w-full">
            {shuffled.map((ans, i) => {
              const display = getDisplayValue(ans);
              return (
                <button
                  key={i}
                  onClick={() => handleAnswer(display)}
                  className="bg-white/90 hover:bg-yellow-200 active:scale-95 active:bg-yellow-300 text-slate-900 font-mono font-black text-base sm:text-lg px-4 py-4 sm:py-5 rounded-xl shadow-lg border-2 border-slate-200 transition-all touch-manipulation min-h-[44px]"
                >
                  <span className="text-xs text-slate-400 mr-2">{i + 1}.</span>
                  <MathText>{display}</MathText>
                </button>
              );
            })}
          </div>
        )}

        {/* Feedback area */}
        {answered && (
          <div className="w-full space-y-3">
            {/* Correct/Incorrect banner */}
            <div className={`text-center p-4 rounded-2xl border-2 ${
              isCorrect
                ? 'bg-emerald-500/20 border-emerald-400'
                : 'bg-red-500/20 border-red-400'
            }`}>
              <div className="text-2xl sm:text-3xl font-black text-white mb-1">
                {isCorrect ? '✓ Nice!' : '✗ Not quite'}
              </div>
              {isCorrect && (
                <div className="text-sm text-yellow-300 font-bold">+{PRACTICE_XP} XP</div>
              )}
              {!isCorrect && (
                <div className="text-sm text-white/80">
                  Correct answer: <span className="font-bold text-emerald-300"><MathText>{q.a}</MathText></span>
                </div>
              )}
            </div>

            {/* Diagnostic message for wrong answers */}
            {!isCorrect && diagnosticMessage && (
              <DiagnosticMessage message={diagnosticMessage} />
            )}

            {/* Encouragement message */}
            {encouragementMsg && (
              <div className={`text-center p-3 rounded-xl border ${
                encouragementMsg.category === 'comeback'
                  ? 'bg-blue-500/20 border-blue-400/40'
                  : encouragementMsg.category === 'streak'
                  ? 'bg-yellow-500/20 border-yellow-400/40'
                  : 'bg-purple-500/20 border-purple-400/40'
              }`}>
                <p className="text-sm text-white/90 font-medium">{encouragementMsg.message}</p>
              </div>
            )}

            {/* Step-by-step solution */}
            {q.steps && q.steps.length > 0 && (
              <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <div className="text-xs uppercase tracking-wider text-white/50 font-bold mb-2">
                  📝 Step-by-step solution
                </div>
                <div className="space-y-2">
                  {q.steps.map((step, i) => (
                    <div key={i} className="flex gap-2 items-start text-sm text-white/90">
                      <span className="bg-white/20 rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      <span><MathText>{step}</MathText></span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Conceptual explanation for wrong answers */}
            {!isCorrect && conceptualExplanation && (
              <div className="bg-indigo-500/10 border border-indigo-400/30 rounded-xl p-4">
                <div className="text-xs uppercase tracking-wider text-indigo-300 font-bold mb-2">
                  💡 Why this works
                </div>
                <p className="text-sm text-white/80 leading-relaxed">
                  {conceptualExplanation}
                </p>
              </div>
            )}

            {/* Streak Saver intervention */}
            {showStreakSaver && (
              <div className="bg-amber-500/20 border-2 border-amber-400/60 rounded-xl p-4">
                <div className="text-sm font-bold text-amber-200 mb-3">
                  🛟 Looks like you're stuck. Let's help!
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    onClick={() => handleStreakSaverChoice('easier')}
                    className="bg-emerald-500/30 hover:bg-emerald-500/50 active:scale-95 text-white font-bold py-3 px-4 rounded-xl border border-emerald-400/40 transition-all touch-manipulation min-h-[44px] text-sm"
                  >
                    📉 Try an easier question
                  </button>
                  <button
                    onClick={() => handleStreakSaverChoice('explanation')}
                    className="bg-blue-500/30 hover:bg-blue-500/50 active:scale-95 text-white font-bold py-3 px-4 rounded-xl border border-blue-400/40 transition-all touch-manipulation min-h-[44px] text-sm"
                  >
                    <BookOpen className="w-4 h-4 inline mr-1" />
                    Show me why it works
                  </button>
                </div>
              </div>
            )}

            {/* Next question button */}
            <button
              onClick={nextQuestion}
              className="w-full bg-white/20 hover:bg-white/30 active:scale-95 text-white font-bold py-4 rounded-xl border border-white/20 transition-all touch-manipulation min-h-[44px] text-base"
            >
              Next Question →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Get diagnostic message for a wrong answer by finding the matching distractor tag.
 */
function getDiagnosticForAnswer(question, selectedAnswer) {
  if (!question.wrong) return null;

  for (const distractor of question.wrong) {
    const display = getDisplayValue(distractor);
    if (display === selectedAnswer) {
      const tag = typeof distractor === 'object' ? distractor.tag : null;
      return getDiagnosticMessage(tag);
    }
  }
  return null;
}
