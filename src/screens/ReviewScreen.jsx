import React, { useState } from 'react';
import { ArrowLeft, Check, X } from 'lucide-react';
import { MathText } from '../components/MathText.jsx';
import { QUESTIONS } from '../data/questions.js';
import { groupMistakesByTopic, getMistakeStats } from '../utils/mistakeJournal.js';
import { shuffleAnswers } from '../utils/shuffleAnswers.js';

/**
 * ReviewScreen — dedicated screen for reviewing previously missed questions.
 * Props:
 *   mistakes — array of MistakeEntry objects
 *   onAnswer — callback(topic, timestamp, selectedAnswer, correctAnswer) for answering review questions
 *   onBack — callback to return to menu
 */
export function ReviewScreen({ mistakes = [], onAnswer, onBack }) {
  const [expandedCard, setExpandedCard] = useState(null);

  const stats = getMistakeStats(mistakes);
  const grouped = groupMistakesByTopic(mistakes);

  const getTopicName = (topicKey) => {
    if (QUESTIONS[topicKey]) return QUESTIONS[topicKey].name;
    return topicKey.charAt(0).toUpperCase() + topicKey.slice(1);
  };

  const getTopicColor = (topicKey) => {
    return QUESTIONS[topicKey]?.color || '#94a3b8';
  };

  if (mistakes.length === 0) {
    return (
      <div className="w-full h-screen min-h-[600px] bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex flex-col items-center justify-center p-4" style={{ height: '100dvh' }}>
        <div className="text-center max-w-sm">
          <div className="text-5xl mb-4">🎉</div>
          <h2 className="text-xl font-bold text-white mb-2">No mistakes to review!</h2>
          <p className="text-slate-400 text-sm mb-6">Keep playing to build your mistake journal.</p>
          <button onClick={onBack}
            className="flex items-center gap-2 mx-auto text-cyan-300 hover:text-white transition-colors font-semibold">
            <ArrowLeft className="w-5 h-5" /> Back to Menu
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen min-h-[600px] bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex flex-col overflow-y-auto" style={{ height: '100dvh' }}>
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-slate-700/50 flex-shrink-0">
        <button onClick={onBack} className="text-cyan-300 hover:text-white transition-colors" aria-label="Back to menu">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-bold text-white">Review Mistakes</h1>
      </div>

      <div className="flex-1 p-4 space-y-4 max-w-lg mx-auto w-full">
        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-3 text-center">
            <div className="text-2xl font-black text-white">{stats.total}</div>
            <div className="text-[10px] text-slate-400 uppercase tracking-wider">Total</div>
          </div>
          <div className="bg-slate-800/60 border border-green-500/30 rounded-xl p-3 text-center">
            <div className="text-2xl font-black text-green-400">{stats.resolved}</div>
            <div className="text-[10px] text-slate-400 uppercase tracking-wider">Resolved</div>
          </div>
          <div className="bg-slate-800/60 border border-red-500/30 rounded-xl p-3 text-center">
            <div className="text-2xl font-black text-red-400">{stats.unresolved}</div>
            <div className="text-[10px] text-slate-400 uppercase tracking-wider">Unresolved</div>
          </div>
        </div>

        {/* Topic-grouped mistake cards */}
        {Object.entries(grouped).map(([topicKey, topicMistakes]) => (
          <div key={topicKey} className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: getTopicColor(topicKey) }} />
              <h3 className="text-sm font-bold text-white">{getTopicName(topicKey)}</h3>
              <span className="text-xs text-slate-400">({topicMistakes.length})</span>
            </div>

            {topicMistakes.map((mistake, idx) => {
              const isExpanded = expandedCard === `${topicKey}-${mistake.timestamp}`;
              const isResolved = mistake.resolved;

              return (
                <MistakeCard
                  key={`${topicKey}-${mistake.timestamp}-${idx}`}
                  mistake={mistake}
                  isExpanded={isExpanded}
                  isResolved={isResolved}
                  onToggle={() => setExpandedCard(isExpanded ? null : `${topicKey}-${mistake.timestamp}`)}
                  onAnswer={onAnswer}
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

function MistakeCard({ mistake, isExpanded, isResolved, onToggle, onAnswer }) {
  const [feedback, setFeedback] = useState(null);
  const question = mistake.question;
  const steps = question?.steps || [];

  const handleAnswer = (answer) => {
    if (feedback) return;
    const correct = answer === question.a;
    setFeedback(correct ? 'correct' : 'wrong');
    if (onAnswer) {
      onAnswer(mistake.topic, mistake.timestamp, answer, question.a);
    }
    // Auto-clear feedback after a delay
    setTimeout(() => setFeedback(null), 2000);
  };

  if (isResolved) {
    return (
      <div className="bg-slate-800/40 border border-green-500/20 rounded-xl p-3">
        <div className="flex items-center justify-between">
          <div className="text-sm text-white/80 font-mono truncate flex-1 mr-2">
            <MathText>{question?.q || 'Unknown question'}</MathText>
          </div>
          <div className="flex items-center gap-1 text-green-400 text-xs font-bold flex-shrink-0">
            <Check className="w-3.5 h-3.5" /> Resolved
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-800/60 border border-red-500/20 rounded-xl overflow-hidden">
      <button onClick={onToggle} className="w-full p-3 text-left flex items-center justify-between">
        <div className="text-sm text-white font-mono truncate flex-1 mr-2">
          <MathText>{question?.q || 'Unknown question'}</MathText>
        </div>
        <span className="text-slate-400 text-xs">{isExpanded ? '▲' : '▼'}</span>
      </button>

      {isExpanded && (
        <div className="px-3 pb-3 space-y-2 border-t border-slate-700/50 pt-2">
          <div className="flex gap-3 text-xs">
            <div><span className="text-red-400">Your answer:</span> <span className="text-white font-mono"><MathText>{mistake.selectedAnswer}</MathText></span></div>
            <div><span className="text-green-400">Correct:</span> <span className="text-white font-mono"><MathText>{mistake.correctAnswer}</MathText></span></div>
          </div>

          {steps.length > 0 && (
            <div className="space-y-1 mt-2">
              <div className="text-[10px] text-slate-400 uppercase tracking-wider">Solution Steps:</div>
              {steps.map((step, i) => (
                <div key={i} className="flex gap-2 items-start text-xs text-white/80">
                  <span className="bg-white/10 rounded-full w-4 h-4 flex items-center justify-center text-[9px] font-bold flex-shrink-0">{i + 1}</span>
                  <span>{step}</span>
                </div>
              ))}
            </div>
          )}

          {/* Interactive re-attempt */}
          {!feedback && question && (
            <div className="mt-2">
              <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">Try again:</div>
              <div className="grid grid-cols-2 gap-1.5">
                {shuffleAnswers([question.a, ...question.wrong], Date.now()).map((ans, i) => (
                  <button key={i} onClick={() => handleAnswer(ans)}
                    className="bg-white/10 hover:bg-white/20 active:scale-95 text-white font-mono text-xs py-2 px-2 rounded-lg border border-slate-600 transition-all touch-manipulation">
                    <MathText>{ans}</MathText>
                  </button>
                ))}
              </div>
            </div>
          )}

          {feedback === 'correct' && (
            <div className="text-center text-green-400 text-sm font-bold mt-2">✓ Correct! Marked as resolved.</div>
          )}
          {feedback === 'wrong' && (
            <div className="text-center text-red-400 text-sm font-bold mt-2">✗ Not quite. Keep practicing!</div>
          )}
        </div>
      )}
    </div>
  );
}
