import React from 'react';
import { RotateCcw } from 'lucide-react';
import { EXAM_QUESTION_COUNT, EXAM_LIVES } from '../constants.js';

export function ExamResultsScreen({ examCorrect, score, examLives, examDuration, startExam, setScreen }) {
  const correctPct = (examCorrect / EXAM_QUESTION_COUNT) * 100;
  const grade = correctPct >= 90 ? 'A+' : correctPct >= 80 ? 'A' : correctPct >= 70 ? 'B' : correctPct >= 60 ? 'C' : correctPct >= 50 ? 'D' : 'F';
  const gradeColor = correctPct >= 80 ? 'text-emerald-400' : correctPct >= 60 ? 'text-amber-400' : 'text-red-400';
  const passed = correctPct >= 60;
  const durationSec = Math.floor(examDuration / 1000);
  const mins = Math.floor(durationSec / 60);
  const secs = durationSec % 60;

  return (
    <div className={`w-full h-screen min-h-[600px] flex items-center justify-center p-4 ${passed ? 'bg-gradient-to-br from-emerald-900 via-slate-900 to-amber-900' : 'bg-gradient-to-br from-red-950 via-slate-900 to-black'}`}>
      <div className="text-center max-w-md w-full">
        <div className="text-6xl sm:text-7xl mb-3">{passed ? '🎓' : '📝'}</div>
        <div className={`font-bold tracking-widest text-xs mb-1 ${passed ? 'text-emerald-300' : 'text-red-300'}`}>EXAM SIMULATOR COMPLETE</div>
        <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">{passed ? 'Test Ready!' : 'Keep Practicing'}</h2>

        <div className="bg-white/10 backdrop-blur-md rounded-3xl p-5 mb-4 border border-white/20">
          <div className={`text-7xl sm:text-8xl font-black ${gradeColor} mb-2`}>{grade}</div>
          <div className="text-xl text-white mb-3 tabular-nums">{examCorrect} / {EXAM_QUESTION_COUNT} correct</div>

          <div className="grid grid-cols-3 gap-3 text-center pt-3 border-t border-white/20">
            <div>
              <div className="text-[10px] text-slate-300 uppercase tracking-wider">Score</div>
              <div className="text-lg sm:text-xl font-black text-amber-300 tabular-nums">{score}</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-300 uppercase tracking-wider">Time</div>
              <div className="text-lg sm:text-xl font-black text-white tabular-nums">{mins}:{secs.toString().padStart(2, '0')}</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-300 uppercase tracking-wider">Lives</div>
              <div className="text-lg sm:text-xl font-black text-red-300 tabular-nums">{examLives}/{EXAM_LIVES}</div>
            </div>
          </div>
        </div>

        {passed && examCorrect === EXAM_QUESTION_COUNT && (
          <div className="bg-gradient-to-r from-amber-500 to-emerald-600 rounded-2xl p-3 mb-4 border-2 border-amber-300 animate-pulse-slow">
            <div className="text-white font-black">🏆 PERFECT SCORE!</div>
            <div className="text-white/90 text-xs">You're more than ready.</div>
          </div>
        )}

        <div className="flex flex-col gap-2">
          <button onClick={startExam}
            className="bg-gradient-to-r from-red-600 to-red-800 hover:from-red-700 hover:to-red-900 text-white font-black px-6 py-3 rounded-xl text-base hover:scale-105 active:scale-95 transition-all shadow-xl flex items-center justify-center gap-2 touch-manipulation">
            <RotateCcw className="w-4 h-4" /> Retake Exam
          </button>
          <button onClick={() => setScreen('topicSelect')}
            className="bg-white/10 hover:bg-white/20 text-white font-bold px-5 py-2.5 rounded-xl text-sm touch-manipulation">
            Different Sector
          </button>
          <button onClick={() => setScreen('menu')} className="text-slate-400 hover:text-white text-xs">Main Menu</button>
        </div>
      </div>

      <style>{`
        @keyframes pulse-slow { 0%, 100% { box-shadow: 0 0 20px rgba(251, 191, 36, 0.4); } 50% { box-shadow: 0 0 40px rgba(251, 191, 36, 0.8); } }
        .animate-pulse-slow { animation: pulse-slow 2s ease-in-out infinite; }
      `}</style>
    </div>
  );
}
