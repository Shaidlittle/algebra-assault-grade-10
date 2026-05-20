import React from 'react';

export function LandingScreen({ onContinue }) {
  return (
    <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-gradient-to-br from-slate-800 to-indigo-950 border-2 border-purple-400/50 rounded-2xl shadow-2xl max-w-md w-full p-5 sm:p-6 my-auto">
        {/* Badge */}
        <div className="inline-block px-3 py-1 mb-3 bg-purple-500/20 border border-purple-400 rounded-full text-purple-300 text-[10px] font-bold tracking-widest">
          MATHCOACH
        </div>

        {/* Title */}
        <h1 className="text-2xl sm:text-3xl font-black text-white mb-2 leading-tight">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">Algebra Assault</span>
        </h1>

        {/* Value Proposition */}
        <p className="text-slate-300 text-sm mb-4">
          Master Grade 10 algebra through an arcade-style space shooter. Answer questions, defeat bosses, and level up your math skills — all while having fun.
        </p>

        {/* Target Audience */}
        <div className="mb-4">
          <h2 className="text-xs font-bold text-cyan-300 uppercase tracking-wider mb-1">Who it's for</h2>
          <p className="text-slate-300 text-sm">Grade 10 students looking for engaging algebra practice.</p>
        </div>

        {/* Supported Curricula */}
        <div className="mb-4">
          <h2 className="text-xs font-bold text-cyan-300 uppercase tracking-wider mb-1">Curricula Supported</h2>
          <div className="flex flex-wrap gap-2">
            <span className="px-2.5 py-1 bg-slate-700/60 border border-slate-600 rounded-lg text-slate-200 text-xs font-semibold">CAPS</span>
            <span className="px-2.5 py-1 bg-slate-700/60 border border-slate-600 rounded-lg text-slate-200 text-xs font-semibold">IEB</span>
            <span className="px-2.5 py-1 bg-slate-700/60 border border-slate-600 rounded-lg text-slate-200 text-xs font-semibold">Cambridge</span>
          </div>
        </div>

        {/* Key Features */}
        <div className="mb-5">
          <h2 className="text-xs font-bold text-cyan-300 uppercase tracking-wider mb-2">Key Features</h2>
          <ul className="text-slate-300 text-sm space-y-1.5">
            <li className="flex items-start gap-2"><span className="text-purple-400">🎯</span> 6 algebra topics</li>
            <li className="flex items-start gap-2"><span className="text-purple-400">👾</span> Boss fights</li>
            <li className="flex items-start gap-2"><span className="text-purple-400">📊</span> Progress tracking</li>
            <li className="flex items-start gap-2"><span className="text-purple-400">⏱</span> Exam simulator</li>
          </ul>
        </div>

        {/* CTA Button */}
        <button
          onClick={onContinue}
          className="w-full bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 active:scale-95 text-white font-black text-lg py-3.5 rounded-xl shadow-lg border-2 border-white/20 transition-all touch-manipulation"
          style={{ minHeight: '44px', minWidth: '44px' }}
        >
          Start Playing
        </button>
      </div>
    </div>
  );
}
