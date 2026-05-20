import React, { useState } from 'react';
import { getLevel, getLevelProgress } from './utils/xpSystem.js';
import { useProfileState } from './hooks/useProfileState.js';
import { useProgressData } from './hooks/useProgressData.js';
import { useGameState } from './hooks/useGameState.js';
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

export default function App() {
  const [soundOn, setSoundOn] = useState(true);

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
    soundOn, setSoundOn, activeProfile,
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
    showDisclaimer, showLanding, setShowLanding,
    startMission, startExam, handleAnswer, handleExamAnswer,
    handleTeachMe, handleDismissTeachMe, handleDismissDisclaimer,
    handleMouseMove, handleMouseDown, handleMouseLeave,
  } = game;

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
        dailyCompleted={dailyCompleted}
        streakData={streakData}
        level={getLevel(totalXP)}
        levelProgress={getLevelProgress(totalXP)}
        activeProfile={activeProfile}
        onShowProfiles={() => setScreen('profiles')}
      />
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
        onComplete={handleDailyComplete}
        streak={streakData.currentStreak}
        soundOn={soundOn}
        setScreen={setScreen}
      />
    );
  }

  if (screen === 'topicSelect') {
    return (
      <TopicSelectScreen
        completed={completed}
        startMission={startMission}
        setScreen={setScreen}
        soundOn={soundOn}
        setSoundOn={setSoundOn}
        highScores={highScores}
        masteryData={masteryData}
      />
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
        setSoundOn={setSoundOn}
        setScreen={setScreen}
        handleMouseMove={handleMouseMove}
        handleMouseDown={handleMouseDown}
        handleMouseLeave={handleMouseLeave}
        onTeachMe={handleTeachMe}
        onDismissTeachMe={handleDismissTeachMe}
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
      dailyCompleted={dailyCompleted}
      streakData={streakData}
      level={getLevel(totalXP)}
      levelProgress={getLevelProgress(totalXP)}
      activeProfile={activeProfile}
      onShowProfiles={() => setScreen('profiles')}
    />
  );
}
