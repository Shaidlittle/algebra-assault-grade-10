import React, { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Copy, Check, Users } from 'lucide-react';
import { MathText } from '../components/MathText.jsx';
import { shuffleAnswers, getDisplayValue } from '../utils/shuffleAnswers.js';
import { getDiagnosticMessage } from '../data/errorCatalog.js';
import { DiagnosticMessage } from '../components/DiagnosticMessage.jsx';
import { PLAYABLE_TOPICS } from '../data/questions.js';
import {
  encodeChallenge,
  decodeChallenge,
  isValidChallengeCode,
} from '../utils/friendChallenge.js';
import { generateQuestionSet } from '../utils/questionGenerator.js';

const CHALLENGE_QUESTION_COUNT = 5;
const XP_PER_CORRECT = 20;

// Topic display names
const TOPIC_NAMES = {
  linear: 'Linear Equations',
  quadratic: 'Quadratic Equations',
  expExpr: 'Exponent Expressions',
  expEqn: 'Exponent Equations',
  inequality: 'Inequalities',
  simultaneous: 'Simultaneous Equations',
};

const DIFFICULTIES = ['easy', 'medium', 'hard'];

/**
 * Generate a deterministic set of questions from a seed, topic, and difficulty.
 * Uses the seeded PRNG from utils/questionGenerator.js.
 */
function generateChallengeQuestions(topic, difficulty, seed) {
  return generateQuestionSet(seed, topic, difficulty, CHALLENGE_QUESTION_COUNT);
}

/**
 * FriendChallengeScreen — challenge friends with shareable codes.
 * Two modes: "Create Challenge" (play questions, generate code) and
 * "Accept Challenge" (enter code, play same questions, compare scores).
 *
 * Props:
 *   onBack — callback to return to menu
 *   soundOn — boolean for sound state
 *   awardXPAndCheck — callback(amount) to award XP
 */
export function FriendChallengeScreen({ onBack, soundOn, awardXPAndCheck }) {
  // Main view: 'menu' | 'createSetup' | 'createPlay' | 'createResult' |
  //            'acceptInput' | 'acceptPlay' | 'acceptResult'
  const [view, setView] = useState('menu');

  // Create challenge state
  const [createTopic, setCreateTopic] = useState('linear');
  const [createDifficulty, setCreateDifficulty] = useState('medium');
  const [createSeed] = useState(() => Math.floor(Math.random() * 65535));
  const [createQuestions, setCreateQuestions] = useState([]);
  const [createIdx, setCreateIdx] = useState(0);
  const [createScore, setCreateScore] = useState(0);
  const [createFeedback, setCreateFeedback] = useState(null);
  const [challengeCode, setChallengeCode] = useState('');
  const [copied, setCopied] = useState(false);

  // Accept challenge state
  const [codeInput, setCodeInput] = useState('');
  const [codeError, setCodeError] = useState('');
  const [acceptParams, setAcceptParams] = useState(null);
  const [acceptQuestions, setAcceptQuestions] = useState([]);
  const [acceptIdx, setAcceptIdx] = useState(0);
  const [acceptScore, setAcceptScore] = useState(0);
  const [acceptFeedback, setAcceptFeedback] = useState(null);
  const [challengerScore, setChallengerScore] = useState(0);

  // --- Create Challenge Flow ---

  const startCreateChallenge = () => {
    const questions = generateChallengeQuestions(createTopic, createDifficulty, createSeed);
    setCreateQuestions(questions);
    setCreateIdx(0);
    setCreateScore(0);
    setCreateFeedback(null);
    setView('createPlay');
  };

  const handleCreateAnswer = useCallback((answer) => {
    if (createFeedback || createIdx >= createQuestions.length) return;
    const q = createQuestions[createIdx];
    const correct = answer === q.a;

    let diagnosticMessage = null;
    if (!correct && q.wrong) {
      const matchedDistractor = q.wrong.find(d => getDisplayValue(d) === answer);
      if (matchedDistractor && matchedDistractor.tag) {
        diagnosticMessage = getDiagnosticMessage(matchedDistractor.tag);
      }
    }

    const newScore = correct ? createScore + 1 : createScore;
    setCreateScore(newScore);
    setCreateFeedback({ correct, answer, correctAnswer: q.a, diagnosticMessage });

    if (correct) {
      if (awardXPAndCheck) awardXPAndCheck(XP_PER_CORRECT);
      setTimeout(() => {
        setCreateFeedback(null);
        if (createIdx + 1 >= CHALLENGE_QUESTION_COUNT) {
          // Generate challenge code
          const code = encodeChallenge({
            topic: createTopic,
            difficulty: createDifficulty,
            seed: createSeed,
            score: newScore,
          });
          setChallengeCode(code);
          setView('createResult');
        } else {
          setCreateIdx(createIdx + 1);
        }
      }, 1000);
    }
  }, [createFeedback, createIdx, createQuestions, createScore, createTopic, createDifficulty, createSeed, awardXPAndCheck]);

  const handleCreateNext = () => {
    setCreateFeedback(null);
    if (createIdx + 1 >= CHALLENGE_QUESTION_COUNT) {
      const code = encodeChallenge({
        topic: createTopic,
        difficulty: createDifficulty,
        seed: createSeed,
        score: createScore,
      });
      setChallengeCode(code);
      setView('createResult');
    } else {
      setCreateIdx(createIdx + 1);
    }
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(challengeCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: select text for manual copy
      setCopied(false);
    }
  };

  // --- Accept Challenge Flow ---

  const handleSubmitCode = () => {
    const trimmed = codeInput.trim();
    if (!isValidChallengeCode(trimmed)) {
      setCodeError('Invalid code. Please check and try again.');
      return;
    }
    const params = decodeChallenge(trimmed);
    if (!params) {
      setCodeError('Invalid code. Please check and try again.');
      return;
    }
    setCodeError('');
    setAcceptParams(params);
    setChallengerScore(params.score);
    const questions = generateChallengeQuestions(params.topic, params.difficulty, params.seed);
    setAcceptQuestions(questions);
    setAcceptIdx(0);
    setAcceptScore(0);
    setAcceptFeedback(null);
    setView('acceptPlay');
  };

  const handleAcceptAnswer = useCallback((answer) => {
    if (acceptFeedback || acceptIdx >= acceptQuestions.length) return;
    const q = acceptQuestions[acceptIdx];
    const correct = answer === q.a;

    let diagnosticMessage = null;
    if (!correct && q.wrong) {
      const matchedDistractor = q.wrong.find(d => getDisplayValue(d) === answer);
      if (matchedDistractor && matchedDistractor.tag) {
        diagnosticMessage = getDiagnosticMessage(matchedDistractor.tag);
      }
    }

    const newScore = correct ? acceptScore + 1 : acceptScore;
    setAcceptScore(newScore);
    setAcceptFeedback({ correct, answer, correctAnswer: q.a, diagnosticMessage });

    if (correct) {
      if (awardXPAndCheck) awardXPAndCheck(XP_PER_CORRECT);
      setTimeout(() => {
        setAcceptFeedback(null);
        if (acceptIdx + 1 >= CHALLENGE_QUESTION_COUNT) {
          setView('acceptResult');
        } else {
          setAcceptIdx(acceptIdx + 1);
        }
      }, 1000);
    }
  }, [acceptFeedback, acceptIdx, acceptQuestions, acceptScore, awardXPAndCheck]);

  const handleAcceptNext = () => {
    setAcceptFeedback(null);
    if (acceptIdx + 1 >= CHALLENGE_QUESTION_COUNT) {
      setView('acceptResult');
    } else {
      setAcceptIdx(acceptIdx + 1);
    }
  };

  // --- Keyboard support ---

  useEffect(() => {
    if (view !== 'createPlay' && view !== 'acceptPlay') return;
    const isCreate = view === 'createPlay';
    const currentFeedback = isCreate ? createFeedback : acceptFeedback;
    const questions = isCreate ? createQuestions : acceptQuestions;
    const idx = isCreate ? createIdx : acceptIdx;
    const handler = isCreate ? handleCreateAnswer : handleAcceptAnswer;

    if (currentFeedback || !questions[idx]) return;

    const handleKeyDown = (e) => {
      const keyNum = parseInt(e.key);
      if (keyNum >= 1 && keyNum <= 4) {
        const q = questions[idx];
        const shuffled = shuffleAnswers([q.a, ...q.wrong], idx);
        if (shuffled[keyNum - 1]) {
          handler(getDisplayValue(shuffled[keyNum - 1]));
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [view, createFeedback, acceptFeedback, createQuestions, acceptQuestions, createIdx, acceptIdx, handleCreateAnswer, handleAcceptAnswer]);

  // --- Render helpers ---

  const renderQuestionView = (questions, idx, feedback, onAnswer, onNext) => {
    const q = questions[idx];
    if (!q) return null;
    const shuffled = shuffleAnswers([q.a, ...q.wrong], idx);

    return (
      <>
        {/* Progress indicator */}
        <div className="flex gap-2 mb-6 justify-center flex-shrink-0">
          {Array.from({ length: CHALLENGE_QUESTION_COUNT }).map((_, i) => (
            <div
              key={i}
              className={`w-12 sm:w-16 h-2 rounded-full ${
                i < idx ? 'bg-cyan-400' : i === idx ? 'bg-white' : 'bg-slate-700'
              }`}
            />
          ))}
        </div>

        <div className="text-center text-slate-400 text-xs uppercase tracking-widest mb-2 flex-shrink-0">
          Question {idx + 1} of {CHALLENGE_QUESTION_COUNT}
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
                  onClick={onNext}
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
                onClick={() => onAnswer(getDisplayValue(ans))}
                className="bg-white hover:bg-yellow-200 active:scale-95 active:bg-yellow-300 text-slate-900 font-mono font-black text-base sm:text-lg md:text-xl px-3 py-4 sm:py-5 rounded-xl shadow-lg border-2 border-slate-900 transition-all touch-manipulation min-h-[44px]"
              >
                <span className="text-slate-400 text-xs mr-2">{i + 1}</span>
                <MathText>{getDisplayValue(ans)}</MathText>
              </button>
            ))}
          </div>
        )}
      </>
    );
  };

  // --- Main Menu View ---

  if (view === 'menu') {
    return (
      <div className="w-full h-screen min-h-[600px] bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 flex flex-col items-center justify-center p-4" style={{ height: '100dvh' }}>
        <button
          onClick={onBack}
          className="absolute top-4 left-4 text-slate-300 hover:text-white flex items-center gap-1 text-sm min-h-[44px] min-w-[44px] touch-manipulation"
        >
          <ArrowLeft className="w-4 h-4" /> Menu
        </button>

        <div className="text-center max-w-sm w-full">
          <Users className="w-12 h-12 text-cyan-400 mx-auto mb-3" />
          <h2 className="text-2xl font-black text-white mb-2">Friend Challenge</h2>
          <p className="text-slate-400 text-sm mb-8">
            Challenge your friends to beat your score!
          </p>

          <div className="space-y-4">
            <button
              onClick={() => setView('createSetup')}
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 active:scale-95 text-white font-bold px-6 py-4 rounded-xl transition-all touch-manipulation min-h-[44px] text-lg"
            >
              🎯 Create Challenge
            </button>
            <button
              onClick={() => setView('acceptInput')}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 active:scale-95 text-white font-bold px-6 py-4 rounded-xl transition-all touch-manipulation min-h-[44px] text-lg"
            >
              🔑 Enter Code
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- Create Setup View (topic/difficulty selection) ---

  if (view === 'createSetup') {
    return (
      <div className="w-full h-screen min-h-[600px] bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 flex flex-col p-4 overflow-y-auto" style={{ height: '100dvh' }}>
        <button
          onClick={() => setView('menu')}
          className="text-slate-300 hover:text-white flex items-center gap-1 text-sm min-h-[44px] min-w-[44px] touch-manipulation mb-4 flex-shrink-0"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <div className="flex-1 flex flex-col items-center justify-center max-w-sm mx-auto w-full">
          <h2 className="text-xl font-black text-white mb-6 text-center">Create a Challenge</h2>

          {/* Topic selection */}
          <div className="w-full mb-6">
            <label className="text-slate-300 text-sm font-bold mb-2 block">Topic</label>
            <div className="grid grid-cols-1 gap-2">
              {PLAYABLE_TOPICS.map((topic) => (
                <button
                  key={topic}
                  onClick={() => setCreateTopic(topic)}
                  className={`px-4 py-3 rounded-xl text-sm font-bold transition-all touch-manipulation min-h-[44px] ${
                    createTopic === topic
                      ? 'bg-cyan-500 text-white border-2 border-cyan-300'
                      : 'bg-white/10 text-slate-300 border-2 border-transparent hover:bg-white/20'
                  }`}
                >
                  {TOPIC_NAMES[topic] || topic}
                </button>
              ))}
            </div>
          </div>

          {/* Difficulty selection */}
          <div className="w-full mb-8">
            <label className="text-slate-300 text-sm font-bold mb-2 block">Difficulty</label>
            <div className="grid grid-cols-3 gap-2">
              {DIFFICULTIES.map((diff) => (
                <button
                  key={diff}
                  onClick={() => setCreateDifficulty(diff)}
                  className={`px-4 py-3 rounded-xl text-sm font-bold capitalize transition-all touch-manipulation min-h-[44px] ${
                    createDifficulty === diff
                      ? 'bg-purple-500 text-white border-2 border-purple-300'
                      : 'bg-white/10 text-slate-300 border-2 border-transparent hover:bg-white/20'
                  }`}
                >
                  {diff}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={startCreateChallenge}
            className="w-full bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 active:scale-95 text-white font-bold px-8 py-4 rounded-xl transition-all touch-manipulation min-h-[44px] text-lg"
          >
            Start Challenge →
          </button>
        </div>
      </div>
    );
  }

  // --- Create Play View ---

  if (view === 'createPlay') {
    return (
      <div className="w-full h-screen min-h-[600px] bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 flex flex-col p-4" style={{ height: '100dvh' }}>
        <div className="flex items-center justify-between mb-4 flex-shrink-0">
          <button
            onClick={() => setView('menu')}
            className="text-slate-300 hover:text-white flex items-center gap-1 text-sm min-h-[44px] min-w-[44px] touch-manipulation"
          >
            <ArrowLeft className="w-4 h-4" /> Quit
          </button>
          <div className="text-slate-400 text-sm font-bold">Creating Challenge</div>
        </div>
        {renderQuestionView(createQuestions, createIdx, createFeedback, handleCreateAnswer, handleCreateNext)}
      </div>
    );
  }

  // --- Create Result View (show code) ---

  if (view === 'createResult') {
    return (
      <div className="w-full h-screen min-h-[600px] bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 flex flex-col items-center justify-center p-4" style={{ height: '100dvh' }}>
        <div className="text-center max-w-sm w-full">
          <div className="text-5xl mb-4">🏆</div>
          <h2 className="text-2xl font-black text-white mb-2">Challenge Created!</h2>
          <p className="text-slate-400 text-sm mb-6">
            You scored {createScore}/{CHALLENGE_QUESTION_COUNT}. Share this code with a friend!
          </p>

          {/* Challenge code display */}
          <div className="bg-black/50 backdrop-blur-sm rounded-2xl p-6 border border-white/20 mb-6">
            <div className="text-xs text-slate-400 uppercase tracking-widest mb-2">Challenge Code</div>
            <div className="text-3xl font-mono font-black text-cyan-300 tracking-wider mb-4 select-all">
              {challengeCode}
            </div>
            <button
              onClick={handleCopyCode}
              className="flex items-center gap-2 mx-auto bg-white/10 hover:bg-white/20 active:scale-95 text-white font-bold px-4 py-2.5 rounded-xl border border-white/20 transition-all touch-manipulation min-h-[44px]"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied!' : 'Copy Code'}
            </button>
          </div>

          <div className="bg-black/40 backdrop-blur-sm rounded-2xl p-4 border border-white/20 mb-6">
            <div className="flex justify-between items-center">
              <span className="text-slate-300 text-sm">Your Score</span>
              <span className="text-white font-bold text-lg">{createScore} / {CHALLENGE_QUESTION_COUNT}</span>
            </div>
          </div>

          <button
            onClick={onBack}
            className="w-full bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 active:scale-95 text-white font-bold px-8 py-3 rounded-xl transition-all touch-manipulation min-h-[44px]"
          >
            Back to Menu
          </button>
        </div>
      </div>
    );
  }

  // --- Accept Input View (enter code) ---

  if (view === 'acceptInput') {
    return (
      <div className="w-full h-screen min-h-[600px] bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 flex flex-col items-center justify-center p-4" style={{ height: '100dvh' }}>
        <button
          onClick={() => setView('menu')}
          className="absolute top-4 left-4 text-slate-300 hover:text-white flex items-center gap-1 text-sm min-h-[44px] min-w-[44px] touch-manipulation"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <div className="text-center max-w-sm w-full">
          <div className="text-4xl mb-4">🔑</div>
          <h2 className="text-xl font-black text-white mb-2">Enter Challenge Code</h2>
          <p className="text-slate-400 text-sm mb-6">
            Enter the code your friend shared to attempt their challenge.
          </p>

          <input
            type="text"
            value={codeInput}
            onChange={(e) => {
              setCodeInput(e.target.value);
              setCodeError('');
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSubmitCode();
            }}
            placeholder="Enter code here..."
            className="w-full bg-black/50 border-2 border-white/20 rounded-xl px-4 py-3 text-white text-center font-mono text-xl placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition-colors min-h-[44px] mb-3"
            maxLength={30}
            autoFocus
          />

          {codeError && (
            <div className="text-red-400 text-sm mb-4 font-medium">
              {codeError}
            </div>
          )}

          <button
            onClick={handleSubmitCode}
            disabled={!codeInput.trim()}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 active:scale-95 text-white font-bold px-8 py-3 rounded-xl transition-all touch-manipulation min-h-[44px] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Start Challenge →
          </button>
        </div>
      </div>
    );
  }

  // --- Accept Play View ---

  if (view === 'acceptPlay') {
    return (
      <div className="w-full h-screen min-h-[600px] bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 flex flex-col p-4" style={{ height: '100dvh' }}>
        <div className="flex items-center justify-between mb-4 flex-shrink-0">
          <button
            onClick={() => setView('menu')}
            className="text-slate-300 hover:text-white flex items-center gap-1 text-sm min-h-[44px] min-w-[44px] touch-manipulation"
          >
            <ArrowLeft className="w-4 h-4" /> Quit
          </button>
          <div className="text-slate-400 text-sm font-bold">Friend Challenge</div>
        </div>
        {renderQuestionView(acceptQuestions, acceptIdx, acceptFeedback, handleAcceptAnswer, handleAcceptNext)}
      </div>
    );
  }

  // --- Accept Result View (compare scores) ---

  if (view === 'acceptResult') {
    const youWon = acceptScore > challengerScore;
    const tied = acceptScore === challengerScore;
    const emoji = youWon ? '🎉' : tied ? '🤝' : '💪';
    const message = youWon ? 'You Win!' : tied ? "It's a Tie!" : 'Nice Try!';

    return (
      <div className="w-full h-screen min-h-[600px] bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 flex flex-col items-center justify-center p-4" style={{ height: '100dvh' }}>
        <div className="text-center max-w-sm w-full">
          <div className="text-5xl mb-4">{emoji}</div>
          <h2 className="text-2xl font-black text-white mb-6">{message}</h2>

          {/* Score comparison */}
          <div className="bg-black/40 backdrop-blur-sm rounded-2xl p-6 border border-white/20 mb-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-slate-400 text-xs uppercase tracking-widest mb-1">You</div>
                <div className={`text-3xl font-black ${youWon ? 'text-emerald-400' : 'text-white'}`}>
                  {acceptScore}
                </div>
                <div className="text-slate-500 text-xs">/ {CHALLENGE_QUESTION_COUNT}</div>
              </div>
              <div className="text-center">
                <div className="text-slate-400 text-xs uppercase tracking-widest mb-1">Friend</div>
                <div className={`text-3xl font-black ${!youWon && !tied ? 'text-emerald-400' : 'text-white'}`}>
                  {challengerScore}
                </div>
                <div className="text-slate-500 text-xs">/ {CHALLENGE_QUESTION_COUNT}</div>
              </div>
            </div>
          </div>

          {acceptParams && (
            <div className="bg-black/30 rounded-xl p-3 border border-white/10 mb-6">
              <div className="text-slate-400 text-xs">
                {TOPIC_NAMES[acceptParams.topic] || acceptParams.topic} • {acceptParams.difficulty}
              </div>
            </div>
          )}

          <button
            onClick={onBack}
            className="w-full bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 active:scale-95 text-white font-bold px-8 py-3 rounded-xl transition-all touch-manipulation min-h-[44px]"
          >
            Back to Menu
          </button>
        </div>
      </div>
    );
  }

  // Fallback
  return null;
}
