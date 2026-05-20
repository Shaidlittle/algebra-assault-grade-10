import React from 'react';
import { RotateCcw } from 'lucide-react';
import { getMaxBossHp, WAVES_BEFORE_BOSS } from '../constants.js';

// Parent feedback survey — opens when the "Give Feedback" button is tapped.
const SURVEY_URL = 'https://www.surveymonkey.com/r/5JGZFDY';

export function GameOverScreen({ topic, score, waveNumber, bossActive, bossHp, startMission, setScreen }) {
  return (
    <div className="w-full h-screen min-h-[600px] bg-gradient-to-br from-red-900 via-slate-900 to-black flex items-center justify-center p-4">
      <div className="text-center max-w-md w-full">
        <div className="text-7xl mb-3 animate-pulse">💥</div>
        <h2 className="text-4xl font-black text-red-400 mb-1">SHIP DOWN</h2>
        <p className="text-slate-300 mb-5 text-sm">No worries — every miss is data. Try again!</p>
        
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 mb-4 border border-white/20">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-[10px] text-slate-400 uppercase">{bossActive ? 'Boss Phase' : 'Wave'}</div>
              <div className="text-xl font-black text-white">{bossActive ? `${getMaxBossHp(topic) - bossHp + 1}/${getMaxBossHp(topic)}` : `${waveNumber}/${WAVES_BEFORE_BOSS}`}</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-400 uppercase">Score</div>
              <div className="text-xl font-black text-white">{score}</div>
            </div>
          </div>
        </div>
        
        <div className="flex flex-col gap-2">
          <button onClick={() => startMission(topic)} className="bg-gradient-to-r from-emerald-500 to-cyan-600 text-white font-black px-6 py-3 rounded-xl text-base hover:scale-105 active:scale-95 transition-all shadow-xl flex items-center justify-center gap-2 touch-manipulation">
            <RotateCcw className="w-4 h-4" /> Try Again
          </button>
          <button onClick={() => setScreen('topicSelect')} className="bg-white/10 hover:bg-white/20 text-white font-bold px-5 py-2.5 rounded-xl text-sm touch-manipulation">Different Sector</button>
          <button onClick={() => setScreen('menu')} className="text-slate-400 hover:text-white text-xs">Main Menu</button>
          <a href={SURVEY_URL} target="_blank" rel="noopener noreferrer"
            className="mt-1 inline-block bg-amber-500/20 hover:bg-amber-500/30 active:scale-95 border border-amber-400/60 text-amber-200 font-bold text-xs px-4 py-2 rounded-xl transition-all touch-manipulation">
            💬 Give Feedback
          </a>
        </div>
      </div>
    </div>
  );
}
