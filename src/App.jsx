import React, { useState, useEffect, useCallback, useRef } from 'react';
import { getLevel, getLevelProgress } from './utils/xpSystem.js';
import { useProfileState } from './hooks/useProfileState.js';
import { useProgressData } from './hooks/useProgressData.js';
import { useGameState } from './hooks/useGameState.js';
import { initSoundPreference, persistSoundPreference } from './audio.js';
import { MenuScreen } from './screens/MenuScreen.jsx';
import { TopicSelectScreen } from './screens/TopicSelectScreen.jsx';
import { PlayingScreen } from './screens/PlayingScreen.jsx';
import { ExamScreen } from './screens/ExamScreen.jsx';
import { ExamResultsScreen } from './screens/ExamResultsScreen.jsx';
import { VictoryScreen } from './screens/VictoryScreen.jsx';
import { GameOverScreen } from './screens/GameOverScreen.jsx';
import { ProgressScreen } from './screens/ProgressScreen.jsx';
import { ReviewScreen } from './screens/ReviewScreen.jsx';
import { DailyChallengeScreen } from './screens/DailyChallengeScreen.jsx';
import { OnboardingScreen } from './screens/OnboardingScreen.jsx';
import { ProfileScreen } from './screens/ProfileScreen.jsx';
import { ReplayGateScreen } from './screens/ReplayGateScreen.jsx';
import { PracticeModeScreen } from './screens/PracticeModeScreen.jsx';
import { QuickFiveScreen } from './screens/QuickFiveScreen.jsx';
import { WeeklyGoalsScreen } from './screens/WeeklyGoalsScreen.jsx';
import { FriendChallengeScreen } from './screens/FriendChallengeScreen.jsx';
import { ReminderCard } from './components/ReminderCard.jsx';
import { SpacedRepetitionPrompt } from './components/SpacedRepetitionPrompt.jsx';
import { ImprovementToast } from './components/ImprovementToast.jsx';
import { REMINDER_CARDS } from './data/reminderCards.js';
import { QUESTIONS } from './data/questions.js';
import { loadSchedule, getDueQuestions, saveSchedule, advanceInterval, resetInterval } from './utils/spacedRepetition.js';
import { loadWeeklyGoals, checkWeekReset, updateGoalProgress, checkGoalCompletion, saveWeeklyGoals } from './utils/weeklyGoals.js';
import { checkImprovementToast, checkStreakRecord } from './utils/improvementToast.js';

export default function App() {
  const [soundOn, setSoundOn] = useState(true);

  // Load saved sound preference on mount (blocks audio until loaded)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const savedPref = await initSoundPreference();
      if (!cancelled) {
        setSoundOn(savedPref);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Wrap setSoundOn to persist preference on every toggle
  const handleSetSoundOn = useCallback((value) => {
    const newValue = typeof value === 'function' ? value(soundOn) : value;
    setSoundOn(newValue);
    persistSoundPreference(newValue);
  }, [soundOn]);

  // ========== SPACED REPETITION STATE ==========
  const [spacedRepSchedule, setSpacedRepSchedule] = useState([]);
  const [showSpacedRepPrompt, setShowSpacedRepPrompt] = useState(false);
  const [dueReviewCount, setDueReviewCount] = useState(0);

  // Load spaced repetition schedule on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const schedule = await loadSchedule();
        if (cancelled) return;
        setSpacedRepSchedule(schedule);
        const due = getDueQuestions(schedule, Date.now());
        if (due.length > 0) {
          setDueReviewCount(due.length);
          setShowSpacedRepPrompt(true);
        }
      } catch (e) {
        // Graceful degradation — continue without spaced repetition
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // ========== WEEKLY GOALS STATE ==========
  const [weeklyGoalData, setWeeklyGoalData] = useState(null);

  // Load weekly goals on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        let state = await loadWeeklyGoals();
        if (cancelled) return;
        state = checkWeekReset(state);
        setWeeklyGoalData(state);
        await saveWeeklyGoals(state);
      } catch (e) {
        // Graceful degradation
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // ========== IMPROVEMENT TOAST STATE ==========
  const [improvementToast, setImprovementToast] = useState(null);

  // Profile and namespace state
  const profile = useProfileState();
  const {
    showOnboarding, activeProfile, handleOnboardingComplete, handleProfileSwitch,
    highScores, setHighScores, mistakes, setMistakes,
    adaptiveState, setAdaptiveState, dailyQuestions,
    dailyCompleted, setDailyCompleted, streakData, setStreakData,
    totalXP, setTotalXP, completed, setCompleted,
  } = profile;

  // Progress/tracking data
  const progress = useProgressData({
    activeProfile, mistakes, setMistakes, dailyQuestions,
    setDailyCompleted, setStreakData, totalXP, setTotalXP, soundOn,
  });
  const {
    progressMetrics, sessionsCount, masteryData,
    handleShowProgress, handleReviewAnswer, handleDailyAnswer,
    handleDailyComplete, awardXPAndCheck,
  } = progress;

  // Game state and logic
  const game = useGameState({
    soundOn, setSoundOn: handleSetSoundOn, activeProfile,
    adaptiveState, setAdaptiveState,
    mistakes, setMistakes, highScores, setHighScores,
    completed, setCompleted, awardXPAndCheck, totalXP,
  });
  const {
    canvasRef, gameRef, screen, setScreen,
    topic, questions, qIdx, score, hp, aliensKilled, waveNumber,
    bossActive, bossHp, showQuestion, feedback, paused, setPaused,
    bestStreak, activePowerups, reducedMotion,
    examTimer, examLives, examCorrect, examFeedback, examDuration,
    replayQueue, handleReplayComplete,
    showReminderCard, reminderTopic, handleReminderDismiss,
    explainPromptData, explainPaused, handleExplainResponse,
    showDisclaimer, showLanding, setShowLanding,
    startMission, startExam, handleAnswer, handleExamAnswer,
    handleTeachMe, handleDismissTeachMe, handleDismissDisclaimer,
    handleMouseMove, handleMouseDown, handleMouseLeave,
    handleRequestHint, hintStage,
  } = game;

  // ========== WEEKLY GOALS PROGRESS TRACKING ==========
  const updateWeeklyGoals = useCallback(async (action, amount = 1) => {
    if (!weeklyGoalData) return;
    try {
      let updated = updateGoalProgress(weeklyGoalData, action, amount);
      const completion = checkGoalCompletion(updated);
      if (completion.completed) {
        updated = { ...updated, ...completion.newState, completed: true };
      }
      setWeeklyGoalData(updated);
      await saveWeeklyGoals(updated);
    } catch (e) {
      // Graceful degradation
    }
  }, [weeklyGoalData]);

  // Track session start for weekly goals
  const sessionTrackedRef = useRef(false);
  useEffect(() => {
    if (weeklyGoalData && !sessionTrackedRef.current) {
      sessionTrackedRef.current = true;
      updateWeeklyGoals('sessionsStarted', 1);
    }
  }, [weeklyGoalData, updateWeeklyGoals]);

  // ========== IMPROVEMENT TOAST HANDLER ==========
  const checkAndShowImprovement = useCallback((topic, currentAccuracy, currentStreak, previousBest) => {
    // Check accuracy improvement
    const accuracyResult = checkImprovementToast(progressMetrics, topic, currentAccuracy);
    if (accuracyResult.show) {
      setImprovementToast({ message: accuracyResult.message, type: 'accuracy' });
      return;
    }
    // Check streak record
    if (currentStreak != null && previousBest != null) {
      const streakResult = checkStreakRecord(currentStreak, previousBest);
      if (streakResult.show) {
        setImprovementToast({ message: streakResult.message, type: 'streak' });
      }
    }
  }, [progressMetrics]);

  // ========== SPACED REPETITION HANDLERS ==========
  const handleSpacedRepReview = useCallback(() => {
    setShowSpacedRepPrompt(false);
    setScreen('review');
  }, [setScreen]);

  const handleSpacedRepSkip = useCallback(() => {
    setShowSpacedRepPrompt(false);
  }, []);

  // ========== XP AWARD WRAPPER (for new screens) ==========
  const handleXPAward = useCallback((amount) => {
    awardXPAndCheck(amount);
    // Also track for weekly goals
    if (weeklyGoalData) {
      updateWeeklyGoals('questionsCorrect', 1);
    }
  }, [awardXPAndCheck, weeklyGoalData, updateWeeklyGoals]);

  // ========== REMINDER CARD OVERLAY ==========

  // Render the ReminderCard as a full-screen overlay on top of the current screen
  // (screen is still 'topicSelect' when the reminder card is showing)
  const reminderCardOverlay = showReminderCard && reminderTopic && REMINDER_CARDS[reminderTopic] ? (
    <div className="fixed inset-0 z-50">
      <ReminderCard
        topic={reminderTopic}
        topicName={QUESTIONS[reminderTopic]?.name || reminderTopic}
        rule={REMINDER_CARDS[reminderTopic]}
        onDismiss={handleReminderDismiss}
      />
    </div>
  ) : null;

  // ========== SCREEN ROUTING ==========

  if (showOnboarding) {
    return <OnboardingScreen onComplete={handleOnboardingComplete} />;
  }

  if (screen === 'profiles') {
    return (
      <ProfileScreen
        onBack={() => setScreen('menu')}
        onSwitch={handleProfileSwitch}
        activeProfileId={activeProfile?.id || null}
      />
    );
  }

  if (screen === 'menu') {
    return (
      <>
        {/* Spaced Repetition Prompt — shown on game load when reviews are due */}
        {showSpacedRepPrompt && (
          <SpacedRepetitionPrompt
            dueCount={dueReviewCount}
            onReview={handleSpacedRepReview}
            onSkip={handleSpacedRepSkip}
          />
        )}
        {/* Improvement Toast — non-blocking notification */}
        {improvementToast && (
          <ImprovementToast
            message={improvementToast.message}
            onDismiss={() => setImprovementToast(null)}
          />
        )}
        <MenuScreen
          soundOn={soundOn}
          setSoundOn={handleSetSoundOn}
          setScreen={setScreen}
          showDisclaimer={showDisclaimer}
          setShowDisclaimer={handleDismissDisclaimer}
          showLanding={showLanding}
          onDismissLanding={() => setShowLanding(false)}
          onShowProgress={() => { handleShowProgress(); setScreen('progress'); }}
          onShowReview={() => setScreen('review')}
          onStartDaily={() => setScreen('dailyChallenge')}
          onStartPractice={() => setScreen('practiceMode')}
          onStartQuickFive={() => setScreen('quickFive')}
          onStartFriendChallenge={() => setScreen('friendChallenge')}
          onShowWeeklyGoals={() => setScreen('weeklyGoals')}
          dailyCompleted={dailyCompleted}
          streakData={streakData}
          level={getLevel(totalXP)}
          levelProgress={getLevelProgress(totalXP)}
          activeProfile={activeProfile}
          onShowProfiles={() => setScreen('profiles')}
        />
      </>
    );
  }

  if (screen === 'progress') {
    return (
      <ProgressScreen
        metrics={progressMetrics}
        sessionsCount={sessionsCount}
        setScreen={setScreen}
        streakData={streakData}
        masteryData={masteryData}
        activeProfileName={activeProfile?.name}
      />
    );
  }

  if (screen === 'review') {
    return (
      <ReviewScreen
        mistakes={mistakes}
        onAnswer={handleReviewAnswer}
        onBack={() => setScreen('menu')}
      />
    );
  }

  if (screen === 'dailyChallenge') {
    return (
      <DailyChallengeScreen
        questions={dailyQuestions}
        onAnswer={handleDailyAnswer}
        onComplete={(correctCount) => {
          handleDailyComplete(correctCount);
          // Track daily challenge completion for weekly goals
          updateWeeklyGoals('dailyChallengesCompleted', 1);
        }}
        streak={streakData.currentStreak}
        soundOn={soundOn}
        setScreen={setScreen}
        hintStage={hintStage}
        onRequestHint={handleRequestHint}
        explainPromptData={explainPromptData}
        onExplainResponse={handleExplainResponse}
      />
    );
  }

  if (screen === 'practiceMode') {
    return (
      <>
        {improvementToast && (
          <ImprovementToast
            message={improvementToast.message}
            onDismiss={() => setImprovementToast(null)}
          />
        )}
        <PracticeModeScreen
          onBack={() => setScreen('menu')}
          onXPAward={handleXPAward}
          soundOn={soundOn}
        />
      </>
    );
  }

  if (screen === 'quickFive') {
    return (
      <>
        {improvementToast && (
          <ImprovementToast
            message={improvementToast.message}
            onDismiss={() => setImprovementToast(null)}
          />
        )}
        <QuickFiveScreen
          onBack={() => setScreen('menu')}
          onXPAward={handleXPAward}
          soundOn={soundOn}
        />
      </>
    );
  }

  if (screen === 'friendChallenge') {
    return (
      <>
        {improvementToast && (
          <ImprovementToast
            message={improvementToast.message}
            onDismiss={() => setImprovementToast(null)}
          />
        )}
        <FriendChallengeScreen
          onBack={() => setScreen('menu')}
          soundOn={soundOn}
          awardXPAndCheck={handleXPAward}
        />
      </>
    );
  }

  if (screen === 'weeklyGoals') {
    return (
      <WeeklyGoalsScreen
        weeklyGoalData={weeklyGoalData}
        onBack={() => setScreen('menu')}
      />
    );
  }

  if (screen === 'replayGate') {
    return (
      <ReplayGateScreen
        queue={replayQueue}
        onComplete={handleReplayComplete}
        soundOn={soundOn}
        hintStage={hintStage}
        onRequestHint={handleRequestHint}
      />
    );
  }

  if (screen === 'topicSelect') {
    return (
      <>
        {reminderCardOverlay}
        <TopicSelectScreen
          completed={completed}
          startMission={startMission}
          setScreen={setScreen}
          soundOn={soundOn}
          setSoundOn={handleSetSoundOn}
          highScores={highScores}
          masteryData={masteryData}
        />
      </>
    );
  }

  if (screen === 'exam') {
    return (
      <ExamScreen
        questions={questions}
        qIdx={qIdx}
        score={score}
        examTimer={examTimer}
        examLives={examLives}
        examFeedback={examFeedback}
        soundOn={soundOn}
        handleExamAnswer={handleExamAnswer}
        setScreen={setScreen}
        gameRef={gameRef}
        onTeachMe={handleTeachMe}
        onDismissTeachMe={handleDismissTeachMe}
        hintStage={hintStage}
        onRequestHint={handleRequestHint}
        explainPromptData={explainPromptData}
        explainPaused={explainPaused}
        onExplainResponse={handleExplainResponse}
      />
    );
  }

  if (screen === 'examResults') {
    return (
      <ExamResultsScreen
        examCorrect={examCorrect}
        score={score}
        examLives={examLives}
        examDuration={examDuration}
        startExam={startExam}
        setScreen={setScreen}
      />
    );
  }

  if (screen === 'playing') {
    return (
      <PlayingScreen
        canvasRef={canvasRef}
        hp={hp}
        score={score}
        bossActive={bossActive}
        bossHp={bossHp}
        waveNumber={waveNumber}
        aliensKilled={aliensKilled}
        topic={topic}
        showQuestion={showQuestion}
        feedback={feedback}
        paused={paused}
        activePowerups={activePowerups}
        soundOn={soundOn}
        questions={questions}
        qIdx={qIdx}
        handleAnswer={handleAnswer}
        setPaused={setPaused}
        setSoundOn={handleSetSoundOn}
        setScreen={setScreen}
        handleMouseMove={handleMouseMove}
        handleMouseDown={handleMouseDown}
        handleMouseLeave={handleMouseLeave}
        onTeachMe={handleTeachMe}
        onDismissTeachMe={handleDismissTeachMe}
        hintStage={hintStage}
        onRequestHint={handleRequestHint}
        explainPromptData={explainPromptData}
        onExplainResponse={handleExplainResponse}
      />
    );
  }

  if (screen === 'victory') {
    return (
      <VictoryScreen
        topic={topic}
        score={score}
        hp={hp}
        bestStreak={bestStreak}
        completed={completed}
        startMission={startMission}
        setScreen={setScreen}
        soundOn={soundOn}
      />
    );
  }

  if (screen === 'gameOver') {
    return (
      <GameOverScreen
        topic={topic}
        score={score}
        waveNumber={waveNumber}
        bossActive={bossActive}
        bossHp={bossHp}
        startMission={startMission}
        setScreen={setScreen}
      />
    );
  }

  // Fallback
  return (
    <MenuScreen
      soundOn={soundOn}
      setSoundOn={setSoundOn}
      setScreen={setScreen}
      showDisclaimer={showDisclaimer}
      setShowDisclaimer={handleDismissDisclaimer}
      showLanding={showLanding}
      onDismissLanding={() => setShowLanding(false)}
      onShowProgress={() => { handleShowProgress(); setScreen('progress'); }}
      onShowReview={() => setScreen('review')}
      onStartDaily={() => setScreen('dailyChallenge')}
      onStartPractice={() => setScreen('practiceMode')}
      onStartQuickFive={() => setScreen('quickFive')}
      onStartFriendChallenge={() => setScreen('friendChallenge')}
      onShowWeeklyGoals={() => setScreen('weeklyGoals')}
      dailyCompleted={dailyCompleted}
      streakData={streakData}
      level={getLevel(totalXP)}
      levelProgress={getLevelProgress(totalXP)}
      activeProfile={activeProfile}
      onShowProfiles={() => setScreen('profiles')}
    />
  );
}
