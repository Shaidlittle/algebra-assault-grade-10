import React from 'react';
import { X, Check, Timer } from 'lucide-react';
import { MathText } from '../components/MathText.jsx';
import { QUESTIONS, TOPICS_ORDER, PLAYABLE_TOPICS } from '../data/questions.js';
import { EXAM_QUESTION_COUNT, EXAM_LIVES } from '../constants.js';
import { getMasteryLevel, getMasteryColor } from '../utils/masteryLevel.js';

export function TopicSelectScreen({ completed, startMission, setScreen, soundOn, setSoundOn, highScores = {}, masteryData = {} }) {
  const completedCount = TOPICS_ORDER.filter(t => completed[t]).length;
  const allPlayableComplete = PLAYABLE_TOPICS.every(t => completed[t]);

  return (
    <div className="w-full h-screen min-h-[600px] bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 overflow-y-auto relative">
      <div className="relative z-10 max-w-5xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => setScreen('menu')} className="text-slate-300 hover:text-white flex items-center gap-2 font-medium">
            <X className="w-5 h-5" /> Menu
          </button>
          <div className="text-right">
            <div className="text-xs text-slate-400 uppercase tracking-widest">Completed</div>
            <div className="text-2xl font-black text-white">{completedCount} / {TOPICS_ORDER.length}</div>
          </div>
        </div>

        <h2 className="text-3xl md:text-4xl font-black text-white mb-1">Choose Your Sector</h2>
        <p className="text-slate-300 mb-5 text-sm">All sectors unlocked • Power-ups • Shield bonuses in boss fights</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-4">
          {TOPICS_ORDER.map((t, idx) => {
            const tt = QUESTIONS[t];
            const isDone = completed[t];
            const isExam = tt.isExam;
            const isUltimate = tt.isUltimate;
            const mastery = masteryData[t] || 'none';
            const masteryColor = getMasteryColor(mastery);
            return (
              <button key={t} onClick={() => startMission(t)}
                className={`relative p-5 rounded-2xl text-left text-white shadow-xl transition-all border-2 bg-gradient-to-br ${tt.bgColor} hover:scale-105 active:scale-95 ${isDone ? 'border-emerald-400' : isExam ? 'border-red-400 ring-2 ring-red-400/40 animate-pulse-glow' : isUltimate ? 'border-amber-400 ring-2 ring-amber-400/40' : 'border-white/20'} touch-manipulation`}>
                <div className="flex items-start justify-between mb-2">
                  <div className="text-4xl font-black opacity-90"><MathText>{tt.icon}</MathText></div>
                  <div className="flex items-center gap-1.5">
                    {mastery !== 'none' && (
                      <div className="px-1.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border" style={{ borderColor: masteryColor, color: masteryColor, backgroundColor: `${masteryColor}20` }}>
                        {mastery}
                      </div>
                    )}
                    {isDone && <div className="bg-emerald-500 rounded-full p-1.5 shadow-lg"><Check className="w-4 h-4 text-white" /></div>}
                    {isExam && !isDone && (
                      <div className="bg-red-500 rounded-full px-2 py-0.5 shadow-lg text-[9px] font-black text-white tracking-wider flex items-center gap-1">
                        <Timer className="w-2.5 h-2.5" /> TIMED
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-[10px] font-black tracking-wider mb-0.5 text-white/70">SECTOR {idx + 1}</div>
                <div className="text-xl font-black mb-0.5">{tt.name}</div>
                <div className="text-xs opacity-80">
                  {isExam ? `${EXAM_QUESTION_COUNT} timed Q · ${EXAM_LIVES} lives` : '4 waves • boss'}
                </div>
                {isDone && <div className="text-xs mt-1 text-emerald-200 font-bold">✓ COMPLETED</div>}
                {highScores[t] != null && (
                  <div className="text-xs mt-1 text-amber-200 font-bold">⭐ Best: {highScores[t].toLocaleString()}</div>
                )}
              </button>
            );
          })}
        </div>

        {allPlayableComplete && (
          <div className="bg-gradient-to-br from-rose-600 via-red-700 to-amber-700 rounded-2xl p-5 border-2 border-amber-400 text-center animate-pulse-slow">
            <div className="text-4xl mb-2">👑</div>
            <div className="text-xl font-black text-white">ALL SHOOTER SECTORS CLEARED</div>
            <div className="text-sm text-white/90">Now prove it under exam pressure ⏱</div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes pulse-slow { 0%, 100% { box-shadow: 0 0 20px rgba(251, 191, 36, 0.4); } 50% { box-shadow: 0 0 40px rgba(251, 191, 36, 0.8); } }
        .animate-pulse-slow { animation: pulse-slow 2s ease-in-out infinite; }
        @keyframes pulse-glow { 0%, 100% { box-shadow: 0 0 20px rgba(220, 38, 38, 0.3); } 50% { box-shadow: 0 0 40px rgba(220, 38, 38, 0.7); } }
        .animate-pulse-glow { animation: pulse-glow 2s ease-in-out infinite; }
        .math-sup { font-size: 0.62em; vertical-align: super; line-height: 0; margin-left: 0.5px; }
        .math-sub { font-size: 0.62em; vertical-align: sub; line-height: 0; margin-left: 0.5px; }
      `}</style>
    </div>
  );
}
