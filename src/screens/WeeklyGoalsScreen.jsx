import React, { useState, useEffect } from 'react';
import { ArrowLeft, Trophy, Star, Gift } from 'lucide-react';
import { COSMETIC_REWARDS } from '../utils/weeklyGoals.js';

const OBJECTIVES = [
  { key: 'questionsCorrect', label: 'Questions Correct', target: 50, emoji: '✏️' },
  { key: 'sessionsStarted', label: 'Sessions Started', target: 5, emoji: '🚀' },
  { key: 'dailyChallengesCompleted', label: 'Daily Challenges', target: 3, emoji: '📅' },
];

/**
 * Calculate time remaining until next Monday midnight (local time).
 * @returns {{ days: number, hours: number, minutes: number }}
 */
function getTimeUntilReset() {
  const now = new Date();
  const day = now.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
  const daysUntilMonday = day === 0 ? 1 : day === 1 ? 7 : 8 - day;
  const nextMonday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + daysUntilMonday);
  nextMonday.setHours(0, 0, 0, 0);
  const diff = nextMonday.getTime() - now.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  return { days, hours, minutes };
}

/**
 * WeeklyGoalsScreen — displays progress toward weekly objectives,
 * unlocked cosmetic rewards, and current week status.
 *
 * Props:
 *   weeklyGoalData — the weekly goals state object { weekStart, progress, unlockedRewards, completed }
 *   onBack — callback to return to menu
 *   cosmeticRewards — optional array of cosmetic reward definitions (defaults to COSMETIC_REWARDS)
 */
export function WeeklyGoalsScreen({ weeklyGoalData, onBack, cosmeticRewards = COSMETIC_REWARDS }) {
  const goalsState = weeklyGoalData;
  const [countdown, setCountdown] = useState(getTimeUntilReset);

  // Update countdown every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown(getTimeUntilReset());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const progress = goalsState?.progress || {
    questionsCorrect: 0,
    sessionsStarted: 0,
    dailyChallengesCompleted: 0,
  };
  const unlockedRewards = goalsState?.unlockedRewards || [];
  const completed = goalsState?.completed || false;

  // Determine if all objectives are met
  const allObjectivesMet =
    progress.questionsCorrect >= 50 &&
    progress.sessionsStarted >= 5 &&
    progress.dailyChallengesCompleted >= 3;

  // Next reward to unlock
  const nextRewardIndex = unlockedRewards.length;
  const nextReward = nextRewardIndex < cosmeticRewards.length ? cosmeticRewards[nextRewardIndex] : null;
  const allRewardsEarned = unlockedRewards.length >= cosmeticRewards.length;

  return (
    <div className="w-full h-screen min-h-[600px] bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 flex flex-col p-4 overflow-y-auto" style={{ height: '100dvh' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <button
          onClick={onBack}
          className="text-slate-300 hover:text-white flex items-center gap-1 text-sm min-h-[44px] min-w-[44px] touch-manipulation"
        >
          <ArrowLeft className="w-4 h-4" /> Menu
        </button>
        <div className="text-slate-400 text-sm font-bold">Weekly Goals</div>
      </div>

      {/* Status badge */}
      {completed && (
        <div className="flex items-center justify-center gap-2 mb-4 flex-shrink-0">
          <div className="bg-emerald-500/30 border border-emerald-400 rounded-full px-4 py-2 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-emerald-300" />
            <span className="text-emerald-200 font-bold text-sm">Completed!</span>
          </div>
        </div>
      )}

      {!completed && allObjectivesMet && (
        <div className="flex items-center justify-center gap-2 mb-4 flex-shrink-0">
          <div className="bg-amber-500/30 border border-amber-400 rounded-full px-4 py-2 flex items-center gap-2">
            <Star className="w-5 h-5 text-amber-300" />
            <span className="text-amber-200 font-bold text-sm">All Objectives Met!</span>
          </div>
        </div>
      )}

      {/* Countdown to reset */}
      <div className="text-center mb-6 flex-shrink-0">
        <p className="text-slate-400 text-xs uppercase tracking-widest mb-1">Resets in</p>
        <p className="text-white font-bold text-lg">
          {countdown.days}d {countdown.hours}h {countdown.minutes}m
        </p>
      </div>

      {/* Progress bars */}
      <div className="max-w-lg mx-auto w-full space-y-4 mb-8 flex-shrink-0">
        {OBJECTIVES.map(({ key, label, target, emoji }) => {
          const current = Math.min(progress[key] || 0, target);
          const percent = Math.round((current / target) * 100);
          const isComplete = current >= target;

          return (
            <div key={key} className="bg-black/40 backdrop-blur-sm rounded-xl p-4 border border-white/10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-white text-sm font-medium flex items-center gap-2">
                  <span>{emoji}</span> {label}
                </span>
                <span className={`text-sm font-bold ${isComplete ? 'text-emerald-400' : 'text-slate-300'}`}>
                  {current}/{target}
                </span>
              </div>
              <div className="w-full h-3 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    isComplete
                      ? 'bg-gradient-to-r from-emerald-400 to-emerald-300'
                      : 'bg-gradient-to-r from-cyan-500 to-purple-500'
                  }`}
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Next reward preview or bonus XP notice */}
      {!completed && nextReward && !allRewardsEarned && (
        <div className="max-w-lg mx-auto w-full mb-6 flex-shrink-0">
          <div className="bg-black/40 backdrop-blur-sm rounded-xl p-4 border border-white/10 flex items-center gap-4">
            <div
              className="w-12 h-12 rounded-full border-2 border-white/30 flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: nextReward.value }}
            >
              <Gift className="w-5 h-5 text-white/80" />
            </div>
            <div>
              <p className="text-slate-400 text-xs uppercase tracking-wider">Next Reward</p>
              <p className="text-white font-bold text-sm">{nextReward.name}</p>
              <p className="text-slate-400 text-xs capitalize">{nextReward.type}</p>
            </div>
          </div>
        </div>
      )}

      {/* All rewards earned — bonus XP notice */}
      {!completed && allRewardsEarned && (
        <div className="max-w-lg mx-auto w-full mb-6 flex-shrink-0">
          <div className="bg-black/40 backdrop-blur-sm rounded-xl p-4 border border-amber-500/30 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full border-2 border-amber-400/50 bg-amber-500/20 flex items-center justify-center flex-shrink-0">
              <Star className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <p className="text-slate-400 text-xs uppercase tracking-wider">Weekly Reward</p>
              <p className="text-amber-200 font-bold text-sm">+200 Bonus XP</p>
              <p className="text-slate-400 text-xs">All cosmetics unlocked!</p>
            </div>
          </div>
        </div>
      )}

      {/* Unlocked rewards gallery */}
      <div className="max-w-lg mx-auto w-full flex-shrink-0">
        <h3 className="text-slate-300 text-sm font-bold mb-3 flex items-center gap-2">
          <Star className="w-4 h-4" /> Unlocked Rewards ({unlockedRewards.length}/{cosmeticRewards.length})
        </h3>
        <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
          {cosmeticRewards.map((reward) => {
            const isUnlocked = unlockedRewards.includes(reward.id);
            return (
              <div
                key={reward.id}
                className="flex flex-col items-center gap-1"
                title={isUnlocked ? reward.name : 'Locked'}
              >
                <div
                  className={`w-11 h-11 sm:w-12 sm:h-12 rounded-full border-2 flex items-center justify-center transition-all ${
                    isUnlocked
                      ? 'border-white/50 shadow-lg'
                      : 'border-slate-600 opacity-30'
                  }`}
                  style={{ backgroundColor: isUnlocked ? reward.value : '#334155' }}
                >
                  {isUnlocked && (
                    <span className="text-white text-xs font-bold">
                      {reward.type === 'skin' ? '🚀' : '✨'}
                    </span>
                  )}
                  {!isUnlocked && (
                    <span className="text-slate-500 text-lg">🔒</span>
                  )}
                </div>
                <span className={`text-[10px] text-center leading-tight ${isUnlocked ? 'text-slate-300' : 'text-slate-600'}`}>
                  {isUnlocked ? reward.name : '???'}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Back button at bottom for mobile */}
      <div className="mt-auto pt-6 flex justify-center flex-shrink-0">
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
