import { useState, useEffect } from 'react';
import { QUESTIONS } from '../data/questions.js';
import { loadProgressHistory, computeMetrics, setNamespace as setProgressNamespace } from '../utils/progressTracker.js';
import { loadMistakes, setNamespace as setMistakesNamespace } from '../utils/mistakeJournal.js';
import { loadAdaptiveState, setNamespace as setAdaptiveNamespace } from '../utils/adaptiveDifficulty.js';
import { getDailyQuestions, isDailyCompleted, loadStreakData, getTodayString, setNamespace as setDailyNamespace } from '../utils/dailyChallenge.js';
import { loadXP, setNamespace as setXPNamespace } from '../utils/xpSystem.js';
import { loadProfiles, getActiveProfile } from '../utils/profileManager.js';
import { loadHighScores, setNamespace as setHighScoresNamespace } from '../utils/highScores.js';

/**
 * Hook managing profile/onboarding state and namespace switching.
 * Returns profile state and handlers for onboarding/profile switching.
 */
export function useProfileState() {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [activeProfile, setActiveProfile] = useState(null);
  const [profilesLoaded, setProfilesLoaded] = useState(false);

  // State that gets reloaded when profile switches
  const [highScores, setHighScores] = useState({});
  const [mistakes, setMistakes] = useState([]);
  const [adaptiveState, setAdaptiveState] = useState({});
  const [dailyQuestions, setDailyQuestions] = useState([]);
  const [dailyCompleted, setDailyCompleted] = useState(false);
  const [streakData, setStreakData] = useState({ lastCompletedDate: null, currentStreak: 0 });
  const [totalXP, setTotalXP] = useState(0);
  const [completed, setCompleted] = useState({});

  /**
   * Set the namespace on all storage-dependent modules and reload their state.
   * Called when the active profile is loaded or switched.
   */
  const applyProfileNamespace = async (prefix) => {
    setProgressNamespace(prefix);
    setMistakesNamespace(prefix);
    setXPNamespace(prefix);
    setAdaptiveNamespace(prefix);
    setDailyNamespace(prefix);
    setHighScoresNamespace(prefix);

    const [scores, m, state, completedFlag, streak, xp, progress] = await Promise.all([
      loadHighScores(),
      loadMistakes(),
      loadAdaptiveState(),
      isDailyCompleted(),
      loadStreakData(),
      loadXP(),
      window.storage.get(`${prefix}-progress`).then(r => r?.value ? JSON.parse(r.value) : {}).catch(() => ({})),
    ]);

    setHighScores(scores);
    setMistakes(m);
    setAdaptiveState(state);
    setDailyCompleted(completedFlag);
    setStreakData(streak);
    setTotalXP(xp);
    setCompleted(progress);

    const qs = getDailyQuestions(getTodayString(), QUESTIONS);
    setDailyQuestions(qs);
  };

  // Detect first launch: check if profiles exist, show onboarding if none
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const profiles = await loadProfiles();
        if (cancelled) return;
        if (profiles.length === 0) {
          setShowOnboarding(true);
        } else {
          const active = await getActiveProfile();
          if (cancelled) return;
          if (active) {
            setActiveProfile(active);
            await applyProfileNamespace(active.id);
          }
        }
      } catch (e) {
        // If loading fails, don't show onboarding (safe default)
      }
      if (!cancelled) setProfilesLoaded(true);
    })();
    return () => { cancelled = true; };
  }, []);

  const handleOnboardingComplete = async () => {
    const active = await getActiveProfile();
    if (active) {
      setActiveProfile(active);
      await applyProfileNamespace(active.id);
    }
    setShowOnboarding(false);
  };

  const handleProfileSwitch = async (profile) => {
    if (profile === null) {
      setActiveProfile(null);
      return;
    }
    setActiveProfile(profile);
    await applyProfileNamespace(profile.id);
  };

  return {
    showOnboarding,
    activeProfile,
    profilesLoaded,
    highScores,
    setHighScores,
    mistakes,
    setMistakes,
    adaptiveState,
    setAdaptiveState,
    dailyQuestions,
    dailyCompleted,
    setDailyCompleted,
    streakData,
    setStreakData,
    totalXP,
    setTotalXP,
    completed,
    setCompleted,
    applyProfileNamespace,
    handleOnboardingComplete,
    handleProfileSwitch,
  };
}
