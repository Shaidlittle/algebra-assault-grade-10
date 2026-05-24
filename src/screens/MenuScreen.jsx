import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, Crosshair, ChevronRight, Flame, Download } from 'lucide-react';
import { LandingScreen } from './LandingScreen.jsx';
import { EmailCaptureModal } from '../components/EmailCaptureModal.jsx';

// Parent feedback survey — opens when the "Give Feedback" button is tapped.
const SURVEY_URL = 'https://www.surveymonkey.com/r/5JGZFDY';

export function MenuScreen({ soundOn, setSoundOn, setScreen, showDisclaimer, setShowDisclaimer, showLanding, onDismissLanding, onShowProgress, onShowReview, onStartDaily, onStartPractice, onStartQuickFive, onStartFriendChallenge, onShowWeeklyGoals, dailyCompleted, streakData, level, levelProgress, activeProfile, onShowProfiles }) {
  // PWA Install prompt state (Requirement 4.8)
  const [installReady, setInstallReady] = useState(!!window.__pwaInstallPrompt);

  // Email capture modal state (Requirement 5.1)
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [workbookDownloaded, setWorkbookDownloaded] = useState(false);

  const profileNamespace = activeProfile?.id || 'default';

  // Check workbook-downloaded flag on mount and when profile changes
  useEffect(() => {
    (async () => {
      try {
        const result = await window.storage.get(`${profileNamespace}-workbook-downloaded`);
        setWorkbookDownloaded(!!result?.value);
      } catch (e) {
        // Silently ignore storage read errors
      }
    })();
  }, [profileNamespace]);

  useEffect(() => {
    const handleInstallReady = () => setInstallReady(true);
    window.addEventListener('pwainstallready', handleInstallReady);
    // Check if already available on mount
    if (window.__pwaInstallPrompt) setInstallReady(true);
    return () => window.removeEventListener('pwainstallready', handleInstallReady);
  }, []);

  const handleInstallClick = async () => {
    const prompt = window.__pwaInstallPrompt;
    if (!prompt) return;
    prompt.prompt();
    const result = await prompt.userChoice;
    if (result.outcome === 'accepted') {
      window.__pwaInstallPrompt = null;
      setInstallReady(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center overflow-y-auto relative py-8" style={{ minHeight: '100dvh' }}>
      {/* LANDING SCREEN — shows before disclaimer on first session, no persistence */}
      {showLanding && showDisclaimer && (
        <LandingScreen onContinue={onDismissLanding} />
      )}
      {/* PARENT DISCLAIMER — shows on every load, before the menu */}
      {showDisclaimer && !showLanding && (
        <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-cyan-400/50 rounded-2xl shadow-2xl max-w-md w-full p-5 sm:p-6 my-auto">
            <div className="inline-block px-3 py-1 mb-3 bg-amber-500/20 border border-amber-400 rounded-full text-amber-300 text-[10px] font-bold tracking-widest">
              A QUICK NOTE FOR PARENTS
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white mb-3 leading-tight">
              Welcome to Algebra Assault
            </h2>
            <div className="text-slate-300 text-sm space-y-2.5 mb-5">
              <p>
                This is a <span className="text-cyan-300 font-semibold">practice tool from MathCoach</span>, built to make Grade 10 algebra revision feel less like a chore.
              </p>
              <p>
                It's a <span className="text-white font-semibold">supplement to learning, not a replacement</span> for teaching or tutoring. It covers core Grade 10 algebra suitable for CAPS, IEB and Cambridge learners — always check your child's specific test scope with their teacher.
              </p>
              <p>
                Questions? Feedback? Reach us at <span className="text-cyan-300 font-semibold">hello@mathcoach.co.za</span>
              </p>
            </div>
            <button
              onClick={() => setShowDisclaimer(false)}
              className="w-full bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 active:scale-95 text-white font-black text-lg py-3.5 rounded-xl shadow-lg border-2 border-white/20 transition-all touch-manipulation">
              Got it — Let's Play
            </button>
            <div className="text-center text-slate-500 text-[11px] mt-3">
              MathCoach · Grade 10 Algebra · CAPS / IEB / Cambridge
            </div>
          </div>
        </div>
      )}
      {Array.from({ length: 50 }).map((_, i) => (
        <div key={i} className="absolute rounded-full bg-white animate-twinkle"
          style={{
            left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`,
            width: `${Math.random() * 2 + 1}px`, height: `${Math.random() * 2 + 1}px`,
            opacity: Math.random() * 0.7 + 0.3, animationDelay: `${Math.random() * 3}s`
          }} />
      ))}

      <div className="text-center z-10 px-4">
        <div className="mb-2 inline-block px-4 py-1 bg-amber-500/20 border border-amber-400 rounded-full text-amber-300 text-xs font-bold tracking-widest">
          MATHCOACH PRESENTS
        </div>
        <h1 className="text-5xl md:text-7xl font-black text-white mb-1 tracking-tight">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400">ALGEBRA</span>
        </h1>
        <h1 className="text-5xl md:text-7xl font-black text-white mb-3 tracking-tight">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-orange-400 to-amber-400">ASSAULT</span>
        </h1>
        <div className="text-lg text-cyan-300 mb-1 font-bold">⚡ {activeProfile ? `${activeProfile.name.toUpperCase()}'S MATH MISSION` : "YOUR MATH MISSION"} ⚡</div>
        <div className="text-sm text-slate-300 mb-6">Grade 10 Algebra Practice · CAPS / IEB / Cambridge</div>

        <button onClick={() => setScreen('topicSelect')}
          className="group bg-gradient-to-r from-cyan-500 to-purple-600 text-white text-2xl font-black px-12 py-5 rounded-full shadow-2xl shadow-purple-500/50 hover:scale-110 active:scale-95 transition-all border-2 border-white/30">
          <span className="flex items-center gap-3">
            <Crosshair className="w-7 h-7 group-hover:rotate-180 transition-transform duration-500" />
            START MISSION
            <ChevronRight className="w-7 h-7 group-hover:translate-x-1 transition-transform" />
          </span>
        </button>

        {onShowProgress && (
          <button onClick={onShowProgress}
            className="mt-4 bg-slate-800/60 hover:bg-slate-700/60 active:scale-95 border border-cyan-400/40 text-cyan-200 font-bold text-sm px-6 py-2.5 rounded-xl transition-all touch-manipulation">
            📊 Progress
          </button>
        )}

        {/* Level and XP Progress Bar */}
        {level != null && (
          <div className="mt-3 max-w-xs mx-auto">
            <div className="flex items-center justify-center gap-2 mb-1">
              <span className="bg-gradient-to-r from-amber-400 to-yellow-500 text-black text-xs font-black px-2 py-0.5 rounded-full">LVL {level}</span>
            </div>
            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-600">
              <div className="h-full bg-gradient-to-r from-amber-400 to-yellow-500 transition-all duration-500" style={{ width: `${(levelProgress || 0) * 100}%` }} />
            </div>
          </div>
        )}

        {/* Action buttons row */}
        <div className="mt-4 flex flex-wrap gap-2 justify-center">
          {onStartPractice && (
            <button onClick={onStartPractice}
              className="bg-slate-800/60 hover:bg-slate-700/60 active:scale-95 border border-emerald-400/40 text-emerald-200 font-bold text-sm px-5 py-2.5 rounded-xl transition-all touch-manipulation">
              📖 Practice Mode
            </button>
          )}

          {onStartQuickFive && (
            <button onClick={onStartQuickFive}
              className="bg-slate-800/60 hover:bg-slate-700/60 active:scale-95 border border-cyan-400/40 text-cyan-200 font-bold text-sm px-5 py-2.5 rounded-xl transition-all touch-manipulation">
              ⚡ Quick Five
            </button>
          )}

          {onStartFriendChallenge && (
            <button onClick={onStartFriendChallenge}
              className="bg-slate-800/60 hover:bg-slate-700/60 active:scale-95 border border-pink-400/40 text-pink-200 font-bold text-sm px-5 py-2.5 rounded-xl transition-all touch-manipulation">
              🤝 Friend Challenge
            </button>
          )}

          {onShowWeeklyGoals && (
            <button onClick={onShowWeeklyGoals}
              className="bg-slate-800/60 hover:bg-slate-700/60 active:scale-95 border border-yellow-400/40 text-yellow-200 font-bold text-sm px-5 py-2.5 rounded-xl transition-all touch-manipulation">
              🎯 Weekly Goals
            </button>
          )}

          {onShowReview && (
            <button onClick={onShowReview}
              className="bg-slate-800/60 hover:bg-slate-700/60 active:scale-95 border border-red-400/40 text-red-200 font-bold text-sm px-5 py-2.5 rounded-xl transition-all touch-manipulation">
              📝 Review Mistakes
            </button>
          )}

          {onStartDaily && (
            <button onClick={onStartDaily} disabled={dailyCompleted}
              className={`bg-slate-800/60 hover:bg-slate-700/60 active:scale-95 border font-bold text-sm px-5 py-2.5 rounded-xl transition-all touch-manipulation flex items-center gap-1.5 ${dailyCompleted ? 'border-green-400/40 text-green-300 opacity-70' : 'border-amber-400/40 text-amber-200'}`}>
              {dailyCompleted ? '✓ Completed' : '⚡ Daily Challenge'}
              {streakData && streakData.currentStreak > 0 && (
                <span className="flex items-center gap-0.5 text-xs">
                  <Flame className="w-3 h-3" />{streakData.currentStreak}
                </span>
              )}
            </button>
          )}

          {/* PWA Install Button (Requirement 4.8) */}
          {installReady && (
            <button onClick={handleInstallClick}
              className="bg-slate-800/60 hover:bg-slate-700/60 active:scale-95 border border-emerald-400/40 text-emerald-200 font-bold text-sm px-5 py-2.5 rounded-xl transition-all touch-manipulation flex items-center gap-1.5">
              <Download className="w-4 h-4" />
              Install App
            </button>
          )}

          {/* Free Workbook Button (Requirement 5.1, 5.8) */}
          <button onClick={() => setShowEmailModal(true)}
            className="bg-slate-800/60 hover:bg-slate-700/60 active:scale-95 border border-purple-400/40 text-purple-200 font-bold text-sm px-5 py-2.5 rounded-xl transition-all touch-manipulation">
            {workbookDownloaded ? '📘 Field Manual' : '📘 Free Field Manual'}
          </button>

          {/* Switch Profile */}
          {onShowProfiles && (
            <button onClick={onShowProfiles}
              className="bg-slate-800/60 hover:bg-slate-700/60 active:scale-95 border border-slate-500/40 text-slate-300 font-bold text-sm px-5 py-2.5 rounded-xl transition-all touch-manipulation">
              👤 Profiles
            </button>
          )}
        </div>

        <div className="mt-4 flex flex-wrap gap-2 justify-center items-center">
          <button onClick={() => setSoundOn(!soundOn)}
            className="text-slate-400 hover:text-white transition-colors flex items-center gap-1.5 text-xs">
            {soundOn ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            Sound: {soundOn ? 'ON' : 'OFF'}
          </button>
          <span className="text-slate-600">·</span>
          <a href={SURVEY_URL} target="_blank" rel="noopener noreferrer"
            className="text-amber-300 hover:text-amber-200 text-xs font-bold transition-colors">
            💬 Feedback
          </a>
        </div>
      </div>

      {/* Email Capture Modal (Requirement 5.1) */}
      {showEmailModal && (
        <EmailCaptureModal
          onClose={() => {
            setShowEmailModal(false);
            // Re-check the workbook-downloaded flag after modal closes
            (async () => {
              try {
                const result = await window.storage.get(`${profileNamespace}-workbook-downloaded`);
                setWorkbookDownloaded(!!result?.value);
              } catch (e) {}
            })();
          }}
          profileNamespace={profileNamespace}
        />
      )}

      <style>{`
        @keyframes twinkle { 0%, 100% { opacity: 0.3; } 50% { opacity: 1; } }
        .animate-twinkle { animation: twinkle 3s ease-in-out infinite; }
      `}</style>
    </div>
  );
}
