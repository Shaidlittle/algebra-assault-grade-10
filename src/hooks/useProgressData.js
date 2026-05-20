import { useState } from 'react';
import { loadProgressHistory, recordSession, computeMetrics } from '../utils/progressTracker.js';
import { loadMistakes, recordMistake, markResolved } from '../utils/mistakeJournal.js';
import { completeDailyChallenge } from '../utils/dailyChallenge.js';
import { awardXP, detectLevelUp } from '../utils/xpSystem.js';
import { computeTopicMasteries } from '../utils/masteryLevel.js';
import { playSound } from '../audio.js';

/**
 * Hook managing progress/tracking state and handlers.
 */
export function useProgressData({ activeProfile, mistakes, setMistakes, dailyQuestions, setDailyCompleted, setStreakData, totalXP, setTotalXP, soundOn }) {
  const [progressMetrics, setProgressMetrics] = useState(null);
  const [sessionsCount, setSessionsCount] = useState(0);
  const [masteryData, setMasteryData] = useState({});

  // Navigate to progress screen — loads sessions and computes metrics
  const handleShowProgress = async () => {
    try {
      const sessions = await loadProgressHistory();
      setSessionsCount(sessions.length);
      if (sessions.length > 0) {
        const m = computeMetrics(sessions);
        setProgressMetrics(m);
        if (m.perTopicAccuracy) {
          setMasteryData(computeTopicMasteries(m.perTopicAccuracy));
        }
      } else {
        setProgressMetrics({});
      }
    } catch (e) {
      setProgressMetrics(null);
      setSessionsCount(0);
    }
  };

  // Review mode answer handler
  const handleReviewAnswer = async (topicKey, timestamp, selectedAnswer, correctAnswer) => {
    if (selectedAnswer === correctAnswer) {
      await markResolved(topicKey, timestamp);
      const updated = await loadMistakes();
      setMistakes(updated);
    }
  };

  // Daily challenge answer handler
  const handleDailyAnswer = (questionIndex, selectedAnswer, correct) => {
    if (!correct && dailyQuestions[questionIndex]) {
      const q = dailyQuestions[questionIndex];
      recordMistake({
        topic: q.topic || 'daily',
        question: q,
        selectedAnswer,
        correctAnswer: q.a,
        timestamp: Date.now()
      }).then(() => loadMistakes().then(setMistakes));
    }
    if (correct) {
      awardXP(20).then(setTotalXP);
    }
  };

  // Daily challenge completion handler
  const handleDailyComplete = async (correctCount) => {
    const updated = await completeDailyChallenge();
    setStreakData(updated);
    setDailyCompleted(true);
    let xpAward = 50;
    if (updated.currentStreak >= 7) xpAward += 30;
    const newXP = await awardXP(xpAward);
    setTotalXP(newXP);
  };

  // Helper to award XP and check for level up
  const awardXPAndCheck = async (amount) => {
    const prevXP = totalXP;
    const newXP = await awardXP(amount);
    setTotalXP(newXP);
    if (detectLevelUp(prevXP, newXP)) {
      playSound('levelUp', soundOn);
    }
  };

  return {
    progressMetrics,
    sessionsCount,
    masteryData,
    handleShowProgress,
    handleReviewAnswer,
    handleDailyAnswer,
    handleDailyComplete,
    awardXPAndCheck,
  };
}
