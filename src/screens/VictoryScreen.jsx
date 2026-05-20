import React from 'react';
import { Flame, ChevronRight, RotateCcw } from 'lucide-react';
import { QUESTIONS, TOPICS_ORDER, PLAYABLE_TOPICS } from '../data/questions.js';

// Parent feedback survey — opens when the "Give Feedback" button is tapped.
const SURVEY_URL = 'https://www.surveymonkey.com/r/5JGZFDY';

export function VictoryScreen({ topic, score, hp, bestStreak, completed, startMission, setScreen, soundOn }) {
  const grade = score >= 1500 ? 'A+' : score >= 1200 ? 'A' : score >= 900 ? 'B' : score >= 600 ? 'C' : 'D';
  const gradeColor = score >= 1200 ? 'text-emerald-400' : score >= 900 ? 'text-amber-400' : 'text-orange-400';
  const allPlayableComplete = PLAYABLE_TOPICS.every(t => completed[t]);

  return (
    <div className="w-full h-screen min-h-[600px] bg-gradient-to-br from-emerald-900 via-cyan-900 to-purple-900 flex items-center justify-center p-4 overflow-y-auto relative">
      {Array.from({ length: 25 }).map((_, i) => (
        <div key={i} className="absolute text-2xl animate-confetti pointer-events-none"
          style={{ left: `${Math.random() * 100}%`, top: `-10%`,
            animationDelay: `${Math.random() * 3}s`, animationDuration: `${3 + Math.random() * 2}s` }}>
          {['🎉', '⭐', '🎊', '✨'][Math.floor(Math.random() * 4)]}
        </div>
      ))}

      <div className="relative z-10 text-center max-w-md w-full">
        <div className="text-7xl mb-3 animate-bounce-slow">🏆</div>
        <div className="text-amber-300 font-bold tracking-widest text-xs mb-1">SECTOR CLEARED</div>
        <h2 className="text-3xl md:text-4xl font-black text-white mb-4">{QUESTIONS[topic].name}</h2>

        <div className="bg-white/10 backdrop-blur-md rounded-3xl p-5 mb-4 border border-white/20">
          <div className="grid grid-cols-3 gap-3 text-center mb-3">
            <div>
              <div className="text-[10px] text-slate-300 uppercase tracking-wider">Score</div>
              <div className="text-xl font-black text-white">{score}</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-300 uppercase tracking-wider">HP Left</div>
              <div className="text-xl font-black text-emerald-300">{hp}</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-300 uppercase tracking-wider">Streak</div>
              <div className="text-xl font-black text-orange-300 flex items-center justify-center gap-1">
                <Flame className="w-4 h-4" /> {bestStreak}
              </div>
            </div>
          </div>
          <div className="border-t border-white/20 pt-3">
            <div className="text-[10px] text-slate-300 uppercase tracking-wider mb-1">Grade</div>
            <div className={`text-5xl font-black ${gradeColor}`}>{grade}</div>
          </div>
        </div>

        {allPlayableComplete && (
          <div className="bg-gradient-to-r from-red-500 to-red-700 rounded-2xl p-3 mb-4 border-2 border-red-300 animate-pulse-slow">
            <div className="text-white font-black">⏱ Try the EXAM SIMULATOR!</div>
            <div className="text-white/90 text-xs">Time pressure mode • 10 questions</div>
          </div>
        )}

        <div className="flex flex-col gap-2">
          {(() => {
            const currentIdx = TOPICS_ORDER.indexOf(topic);
            const nextTopic = TOPICS_ORDER[currentIdx + 1];
            return nextTopic ? (
              <button onClick={() => startMission(nextTopic)} className="bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-black px-6 py-3 rounded-xl text-base hover:scale-105 active:scale-95 transition-all shadow-xl touch-manipulation">
                Sector {currentIdx + 2}: {QUESTIONS[nextTopic].short} <ChevronRight className="inline w-4 h-4" />
              </button>
            ) : (
              <button onClick={() => setScreen('menu')} className="bg-gradient-to-r from-amber-500 to-red-600 text-white font-black px-6 py-3 rounded-xl text-base hover:scale-105 active:scale-95 transition-all shadow-xl touch-manipulation">
                🎓 All Sectors Cleared! <ChevronRight className="inline w-4 h-4" />
              </button>
            );
          })()}
          <button onClick={() => startMission(topic)} className="bg-white/10 hover:bg-white/20 text-white font-bold px-5 py-2.5 rounded-xl flex items-center justify-center gap-2 text-sm touch-manipulation">
            <RotateCcw className="w-4 h-4" /> Replay
          </button>
          <button onClick={() => setScreen('topicSelect')} className="text-slate-300 hover:text-white text-xs">Choose Sector</button>
          <a href={SURVEY_URL} target="_blank" rel="noopener noreferrer"
            className="mt-1 inline-block bg-amber-500/20 hover:bg-amber-500/30 active:scale-95 border border-amber-400/60 text-amber-200 font-bold text-xs px-4 py-2 rounded-xl transition-all touch-manipulation">
            💬 Give Feedback
          </a>
        </div>
      </div>

      <style>{`
        @keyframes confetti { 0% { transform: translateY(-10vh) rotate(0); } 100% { transform: translateY(110vh) rotate(720deg); } }
        .animate-confetti { animation: confetti linear infinite; }
        @keyframes bounce-slow { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-12px); } }
        .animate-bounce-slow { animation: bounce-slow 1.5s ease-in-out infinite; }
        @keyframes pulse-slow { 0%, 100% { box-shadow: 0 0 20px rgba(251, 191, 36, 0.4); } 50% { box-shadow: 0 0 40px rgba(251, 191, 36, 0.8); } }
        .animate-pulse-slow { animation: pulse-slow 2s ease-in-out infinite; }
      `}</style>
    </div>
  );
}
