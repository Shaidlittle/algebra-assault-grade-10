import { useState, useEffect, useRef, useMemo } from 'react';
import { QUESTIONS, PLAYABLE_TOPICS } from '../data/questions.js';
import { generateQuestionPool } from '../data/questionGenerator.js';
import { W, H, MAX_HP, DMG_WRONG, HP_CORRECT_BONUS, WAVES_BEFORE_BOSS, BOSS_HP, BOSS_SHIELD_DURATION, EXAM_TIMER_SECONDS, EXAM_QUESTION_COUNT, EXAM_LIVES, EXAM_LOW_TIMER, EXAM_CRITICAL_TIMER, getMaxBossHp, getBossPhaseHp } from '../constants.js';
import { playSound } from '../audio.js';
import { getReducedMotion, onReducedMotionChange } from '../utils/reducedMotion.js';
import { updateGame, drawGame, triggerWrongAnswerFeedback } from '../game/engine.js';
import { createEventDispatcher } from '../game/eventDispatcher.js';
import { setupCanvas, updateCanvasScale } from '../game/canvasSetup.js';
import { shuffleAnswers, getDisplayValue } from '../utils/shuffleAnswers.js';
import { getDiagnosticMessage } from '../data/errorCatalog.js';
import { getHintCost } from '../data/hintCosts.js';
import { recordSession } from '../utils/progressTracker.js';
import { loadMistakes, recordMistake, markResolved } from '../utils/mistakeJournal.js';
import { evaluateGate, isExcludedTopic } from '../utils/replayGate.js';
import { saveAdaptiveState, getAdaptiveLevel, updateAdaptiveState } from '../utils/adaptiveDifficulty.js';
import { loadHighScores, saveHighScore } from '../utils/highScores.js';
import { REMINDER_CARDS } from '../data/reminderCards.js';
import { shouldTriggerExplain, BONUS_POINTS, COOLDOWN_THRESHOLD } from '../data/explainTrigger.js';

/**
 * Hook managing all game-related state, refs, and logic.
 */
export function useGameState({ soundOn, setSoundOn, activeProfile, adaptiveState, setAdaptiveState, mistakes, setMistakes, highScores, setHighScores, completed, setCompleted, awardXPAndCheck, totalXP }) {
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const bossQuestionTimerRef = useRef(null);

  const gameRef = useRef({
    player: { x: W / 2, y: H - 80, vx: 0, vy: 0, radius: 18, invuln: 60, lastShot: 0 },
    aliens: [], bullets: [], enemyBullets: [], particles: [], stars: [],
    powerups: [], damageNumbers: [], boss: null,
    keys: {}, pointer: { x: null, y: null, active: false },
    spawnTimers: { alien: 60 }, flash: 0, flashColor: '#ef4444', shake: 0,
    bossActive: false, paused: true, waveNumber: 1, soundOn: true,
    killCount: 0, triggerQuestion: false, killPulse: 0,
    activePowerups: { shield: 0, rapid: 0, triple: 0 },
    pendingHpChange: 0, pendingNuke: false,
  });

  const [screen, setScreen] = useState('menu');
  const [topic, setTopic] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [qIdx, setQIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [hp, setHp] = useState(MAX_HP);
  const [aliensKilled, setAliensKilled] = useState(0);
  const [waveNumber, setWaveNumber] = useState(1);
  const [bossActive, setBossActive] = useState(false);
  const [bossHp, setBossHp] = useState(BOSS_HP);
  const [showQuestion, setShowQuestion] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [hintStage, setHintStage] = useState(0); // 0=none, 1=conceptual, 2=specific, 3=full
  const [paused, setPaused] = useState(false);
  const [bestStreak, setBestStreak] = useState(0);
  const [activePowerups, setActivePowerups] = useState({ shield: 0, rapid: 0, triple: 0 });
  const [showDisclaimer, setShowDisclaimer] = useState(true);
  const [showLanding, setShowLanding] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(getReducedMotion());

  // Exam state
  const [examTimer, setExamTimer] = useState(EXAM_TIMER_SECONDS);
  const [examLives, setExamLives] = useState(EXAM_LIVES);
  const [examCorrect, setExamCorrect] = useState(0);
  const [examFeedback, setExamFeedback] = useState(null);
  const [examStartTs, setExamStartTs] = useState(0);
  const [examDuration, setExamDuration] = useState(0);

  // Replay gate state
  const [pendingTopic, setPendingTopic] = useState(null);
  const [replayQueue, setReplayQueue] = useState([]);

  // Reminder card state
  const [showReminderCard, setShowReminderCard] = useState(false);
  const [reminderTopic, setReminderTopic] = useState(null);

  // Explain prompt state
  const [explainPromptData, setExplainPromptData] = useState(null);
  const [explainCooldown, setExplainCooldown] = useState(0);
  const [explainPaused, setExplainPaused] = useState(false);

  const missionStartTsRef = useRef(0);
  const questionDifficultiesRef = useRef([]);

  const dispatcher = useMemo(() => createEventDispatcher(), []);

  // Register event handlers on the dispatcher
  useEffect(() => {
    dispatcher.on('damage', (event) => {
      setHp(prev => {
        const next = Math.max(0, Math.min(MAX_HP, prev - event.amount));
        if (next <= 0) setTimeout(() => setScreen('gameOver'), 600);
        return next;
      });
    });
    dispatcher.on('waveComplete', () => { setShowQuestion(true); });
    dispatcher.on('kill', (event) => { setAliensKilled(event.killCount); });
    dispatcher.on('nuke', () => {});
  }, []);

  // Init stars
  useEffect(() => {
    const stars = Array.from({ length: 60 }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      size: Math.random() * 1.5 + 0.5,
      speed: 0.3 + Math.random() * 1.2,
      opacity: Math.random() * 0.7 + 0.3,
    }));
    gameRef.current.stars = stars;
  }, []);

  // Load disclaimer dismissal state
  useEffect(() => {
    (async () => {
      try {
        const r = await window.storage.get('disclaimer-dismissed');
        if (r?.value) { setShowDisclaimer(false); setShowLanding(false); }
      } catch (e) {}
    })();
  }, []);

  // Listen for reduced motion preference changes
  useEffect(() => { return onReducedMotionChange(setReducedMotion); }, []);

  const saveProgress = async (newCompleted) => {
    const prefix = activeProfile?.id || 'default';
    try { await window.storage.set(`${prefix}-progress`, JSON.stringify(newCompleted)); } catch (e) {}
  };

  const handleDismissDisclaimer = () => {
    setShowDisclaimer(false);
    try { window.storage.set('disclaimer-dismissed', 'true'); } catch (e) {}
  };

  // Record session on game over (covers both alien damage and wrong-answer death)
  useEffect(() => {
    if (screen === 'gameOver' && topic) {
      const questionsAnswered = qIdx + 1;
      const questionsRight = bestStreak;
      const questionsWrong = questionsAnswered - questionsRight;
      recordSession({
        topic,
        questionsAttempted: questionsAnswered,
        questionsCorrect: questionsRight,
        questionsWrong,
        timeSpent: Math.round((Date.now() - missionStartTsRef.current) / 1000),
        difficultyBreakdown: getMissionDifficultyBreakdown(questionsAnswered, questionsRight),
        timestamp: Date.now(),
      });
    }
  }, [screen]); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync flags to ref
  useEffect(() => { gameRef.current.bossActive = bossActive; }, [bossActive]);
  useEffect(() => { gameRef.current.paused = paused || showQuestion || explainPaused || screen !== 'playing'; }, [paused, showQuestion, explainPaused, screen]);
  useEffect(() => { gameRef.current.soundOn = soundOn; }, [soundOn]);
  useEffect(() => { gameRef.current.waveNumber = waveNumber; }, [waveNumber]);

  // Pause on visibility change
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && screen === 'playing' && !gameRef.current.paused) {
        gameRef.current.paused = true;
        setPaused(true);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [screen]);

  // Also clear held keys whenever the game pauses or we leave playing screen
  useEffect(() => {
    if (paused || showQuestion || screen !== 'playing') gameRef.current.keys = {};
  }, [paused, showQuestion, screen]);

  const pickRandom = (arr, n) => {
    const copy = [...arr];
    const result = [];
    for (let i = 0; i < n && copy.length; i++) {
      const idx = Math.floor(Math.random() * copy.length);
      result.push(copy.splice(idx, 1)[0]);
    }
    return result;
  };

  const getMissionDifficultyBreakdown = (answeredCount, correctCount) => {
    const difficulties = questionDifficultiesRef.current;
    const breakdown = {
      easy: { attempted: 0, correct: 0 },
      medium: { attempted: 0, correct: 0 },
      hard: { attempted: 0, correct: 0 }
    };
    for (let i = 0; i < answeredCount && i < difficulties.length; i++) {
      const tier = difficulties[i] || 'medium';
      breakdown[tier].attempted++;
    }
    const totalAttempted = breakdown.easy.attempted + breakdown.medium.attempted + breakdown.hard.attempted;
    if (totalAttempted > 0 && correctCount > 0) {
      for (const tier of ['easy', 'medium', 'hard']) {
        if (breakdown[tier].attempted > 0) {
          breakdown[tier].correct = Math.round((breakdown[tier].attempted / totalAttempted) * correctCount);
        }
      }
      const sumCorrect = breakdown.easy.correct + breakdown.medium.correct + breakdown.hard.correct;
      const diff = correctCount - sumCorrect;
      if (diff !== 0) {
        const maxTier = ['easy', 'medium', 'hard'].reduce((a, b) =>
          breakdown[a].attempted >= breakdown[b].attempted ? a : b
        );
        breakdown[maxTier].correct = Math.max(0, Math.min(breakdown[maxTier].attempted, breakdown[maxTier].correct + diff));
      }
    }
    return breakdown;
  };

  const startMission = async (t) => {
    if (t === 'exam') { startExam(); return; }

    // Excluded topics bypass the replay gate entirely
    if (isExcludedTopic(t)) {
      startMissionDirect(t);
      return;
    }

    // Check replay gate: load mistakes and evaluate
    const allMistakes = await loadMistakes();
    const { shouldActivate, queue } = evaluateGate(allMistakes, t);

    if (shouldActivate) {
      setPendingTopic(t);
      setReplayQueue(queue);
      setScreen('replayGate');
      return;
    }

    // For regular playable topics (not 'ultimate'), show reminder card before starting
    if (t !== 'ultimate' && REMINDER_CARDS[t]) {
      setReminderTopic(t);
      setShowReminderCard(true);
      return;
    }

    // Ultimate or topics without reminder card data — proceed directly
    startMissionDirect(t);
  };

  const startMissionDirect = (t) => {
    let qs, difficulties;
    if (t === 'ultimate') {
      const regularTopics = PLAYABLE_TOPICS.filter(x => x !== 'ultimate');
      const allMedium = regularTopics.flatMap(tp => QUESTIONS[tp].medium);
      const allHard = regularTopics.flatMap(tp => QUESTIONS[tp].hard);
      const medPick = pickRandom(allMedium, 3);
      const hardPick1 = pickRandom(allHard, 4);
      const hardPick2 = pickRandom(allHard, 8);
      qs = [...medPick, ...hardPick1, ...hardPick2];
      difficulties = [...Array(3).fill('medium'), ...Array(4).fill('hard'), ...Array(8).fill('hard')];
    } else {
      const adaptiveLevel = getAdaptiveLevel(adaptiveState[t]);
      let easyCount, medCount, hardCount, mixedCount;
      if (adaptiveLevel === 'hard') { easyCount = 0; medCount = 2; hardCount = 5; mixedCount = 8; }
      else if (adaptiveLevel === 'medium') { easyCount = 1; medCount = 4; hardCount = 2; mixedCount = 8; }
      else { easyCount = 2; medCount = 3; hardCount = 2; mixedCount = 8; }
      const easyPool = easyCount > 0 ? generateQuestionPool(t, 'easy', easyCount) : [];
      const medPool = medCount > 0 ? generateQuestionPool(t, 'medium', medCount) : [];
      const hardPool = hardCount > 0 ? generateQuestionPool(t, 'hard', hardCount) : [];
      const mixedDifficulty = adaptiveLevel === 'hard' ? 'hard' : adaptiveLevel === 'medium' ? 'medium' : 'easy';
      const mixedPool = mixedCount > 0 ? generateQuestionPool(t, mixedDifficulty, mixedCount) : [];
      qs = [...easyPool, ...medPool, ...hardPool, ...mixedPool];
      difficulties = [
        ...Array(easyPool.length).fill('easy'),
        ...Array(medPool.length).fill('medium'),
        ...Array(hardPool.length).fill('hard'),
        ...Array(mixedPool.length).fill(mixedDifficulty),
      ];
    }
    missionStartTsRef.current = Date.now();
    questionDifficultiesRef.current = difficulties;
    setTopic(t); setQuestions(qs); setQIdx(0); setScore(0); setHp(MAX_HP);
    setAliensKilled(0); setWaveNumber(1); setBossActive(false);
    setBossHp(getMaxBossHp(t)); setShowQuestion(false); setFeedback(null);
    setPaused(false); setBestStreak(0); setActivePowerups({ shield: 0, rapid: 0, triple: 0 });
    setHintStage(0); setExplainCooldown(0); setExplainPromptData(null); setExplainPaused(false);
    if (bossQuestionTimerRef.current) clearTimeout(bossQuestionTimerRef.current);
    const game = gameRef.current;
    game.aliens = []; game.bullets = []; game.enemyBullets = [];
    game.particles = []; game.powerups = []; game.damageNumbers = [];
    game.boss = null; game.bossActive = false;
    game.player.x = W / 2; game.player.y = H - 80; game.player.invuln = 90;
    game.spawnTimers = { alien: 30 }; game.flash = 0; game.shake = 0;
    game.killCount = 0; game.triggerQuestion = false; game.killPulse = 0;
    game.activePowerups = { shield: 0, rapid: 0, triple: 0 };
    game.pendingHpChange = 0; game.pendingNuke = false;
    setScreen('playing');
  };

  // Handle replay gate completion: persist resolved statuses, reload mistakes, start pending mission
  const handleReplayComplete = async (resolvedItems) => {
    // Persist resolved status for each item (fire-and-forget on failure per req 6.3)
    for (const { topic: mistakeTopic, timestamp } of resolvedItems) {
      await markResolved(mistakeTopic, timestamp).catch(() => {});
    }
    // Reload mistakes state
    const updated = await loadMistakes();
    setMistakes(updated);
    // Start the originally requested mission
    const topicToStart = pendingTopic;
    setPendingTopic(null);
    setReplayQueue([]);
    startMissionDirect(topicToStart);
  };

  // Handle reminder card dismiss: hide the card and start the mission
  const handleReminderDismiss = () => {
    setShowReminderCard(false);
    startMissionDirect(reminderTopic);
  };

  const startBoss = () => {
    const maxHp = getMaxBossHp(topic);
    const phaseHp = getBossPhaseHp(topic);
    setBossActive(true); setBossHp(maxHp);
    const game = gameRef.current;
    game.boss = {
      x: W / 2, y: 100, vx: 2, vy: 0, radius: 38,
      lastShot: Date.now() + 1500, attackPhase: 0, wobble: 0,
      phaseHp, maxPhaseHp: phaseHp,
    };
    game.aliens = []; game.enemyBullets = []; game.bullets = [];
    game.bossActive = true; game.killCount = 0; game.triggerQuestion = false;
    game.activePowerups.shield = Date.now() + BOSS_SHIELD_DURATION;
    playSound('boss', soundOn);
    if (bossQuestionTimerRef.current) clearTimeout(bossQuestionTimerRef.current);
  };

  // ============ EXAM SIMULATOR ============
  const startExam = () => {
    const allMedium = PLAYABLE_TOPICS.flatMap(tp => QUESTIONS[tp].medium);
    const allHard = PLAYABLE_TOPICS.flatMap(tp => QUESTIONS[tp].hard);
    const qs = [...pickRandom(allMedium, 4), ...pickRandom(allHard, 6)];
    for (let i = qs.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [qs[i], qs[j]] = [qs[j], qs[i]];
    }
    setTopic('exam'); setQuestions(qs); setQIdx(0); setScore(0);
    setExamTimer(EXAM_TIMER_SECONDS); setExamLives(EXAM_LIVES);
    setExamCorrect(0); setExamFeedback(null); setHintStage(0);
    setExplainCooldown(0); setExplainPromptData(null); setExplainPaused(false);
    setExamStartTs(Date.now()); setExamDuration(0); setScreen('exam');
  };

  const advanceExam = (livesAfter) => {
    setExamFeedback(null);
    setHintStage(0);
    const nextIdx = qIdx + 1;
    if (livesAfter <= 0 || nextIdx >= EXAM_QUESTION_COUNT) {
      const duration = Date.now() - examStartTs;
      setExamDuration(duration);
      setScore(currentScore => {
        saveHighScore('exam', currentScore).then(() => loadHighScores().then(setHighScores));
        return currentScore;
      });
      const questionsAnswered = nextIdx;
      const questionsRight = examCorrect;
      const questionsWrong = questionsAnswered - questionsRight;
      const examDiffBreakdown = {
        easy: { attempted: 0, correct: 0 },
        medium: { attempted: Math.min(4, questionsAnswered), correct: Math.round((4 / EXAM_QUESTION_COUNT) * questionsRight) },
        hard: { attempted: Math.max(0, questionsAnswered - 4), correct: questionsRight - Math.round((4 / EXAM_QUESTION_COUNT) * questionsRight) }
      };
      recordSession({ topic: 'exam', questionsAttempted: questionsAnswered, questionsCorrect: questionsRight, questionsWrong, timeSpent: Math.round(duration / 1000), difficultyBreakdown: examDiffBreakdown, timestamp: Date.now() });
      setScreen('examResults');
    } else {
      setQIdx(nextIdx); setExamTimer(EXAM_TIMER_SECONDS);
    }
  };

  const handleExamAnswer = (answer) => {
    if (examFeedback) return;
    const q = questions[qIdx];
    if (!q) return;
    const correct = answer === q.a;
    if (correct) {
      const timeBonus = Math.max(0, examTimer * 8);
      const points = 100 + timeBonus;
      setScore(s => s + points); setExamCorrect(c => c + 1);
      playSound('correct', soundOn);
      setExamFeedback({ type: 'correct', text: '✓ CORRECT', points, time: examTimer });
      awardXPAndCheck(25);
      setTimeout(() => advanceExam(examLives), 1300);
    } else {
      playSound('wrong', soundOn);
      triggerWrongAnswerFeedback(gameRef.current);
      recordMistake({ topic: 'exam', question: q, selectedAnswer: answer, correctAnswer: q.a, timestamp: Date.now() }).then(() => loadMistakes().then(setMistakes));
      // Look up diagnostic message for the selected wrong answer
      const distractor = (q.wrong || []).find(d => getDisplayValue(d) === answer);
      const diagnosticMessage = distractor ? getDiagnosticMessage(distractor.tag) : null;
      setExamLives(prev => {
        const newLives = prev - 1;
        setExamFeedback({ type: 'wrong', text: '✗ WRONG', correct: q.a, hint: q.hint, livesLeft: newLives, diagnosticMessage });
        setTimeout(() => advanceExam(newLives), 1800);
        return newLives;
      });
    }
  };

  // Exam timer countdown
  useEffect(() => {
    if (screen !== 'exam' || examFeedback || examTimer <= 0 || explainPaused) return;
    const t = setTimeout(() => setExamTimer(prev => Math.max(0, prev - 1)), 1000);
    return () => clearTimeout(t);
  }, [screen, examTimer, examFeedback, explainPaused]);

  // Exam tick sound when timer low
  useEffect(() => {
    if (screen !== 'exam' || examFeedback || examTimer <= 0) return;
    if (examTimer <= EXAM_CRITICAL_TIMER) playSound('tickHigh', soundOn);
    else if (examTimer <= EXAM_LOW_TIMER) playSound('tick', soundOn);
  }, [examTimer, screen, examFeedback, soundOn]);

  // Exam timeout handler
  useEffect(() => {
    if (screen !== 'exam' || examFeedback || examTimer !== 0) return;
    const q = questions[qIdx];
    if (!q) return;
    playSound('wrong', soundOn);
    triggerWrongAnswerFeedback(gameRef.current);
    recordMistake({ topic: 'exam', question: q, selectedAnswer: '(timed out)', correctAnswer: q.a, timestamp: Date.now() }).then(() => loadMistakes().then(setMistakes));
    setExamLives(prev => {
      const newLives = prev - 1;
      setExamFeedback({ type: 'timeout', text: '⏱ TIME UP!', correct: q.a, hint: q.hint, livesLeft: newLives, diagnosticMessage: null });
      setTimeout(() => advanceExam(newLives), 1800);
      return newLives;
    });
  }, [examTimer, screen, examFeedback]);

  // Teach Me handler
  const handleTeachMe = (q) => {
    if (screen === 'playing') {
      setFeedback({ type: 'wrong', text: '📖 SOLUTION', correct: q.a, hint: q.hint, steps: q.steps, teachMe: true });
    } else if (screen === 'exam') {
      setExamFeedback({ type: 'wrong', text: '📖 SOLUTION', correct: q.a, hint: q.hint, steps: q.steps, teachMe: true });
      setExamLives(prev => prev - 1);
    }
  };

  // Progressive Hint handler
  const handleRequestHint = (gameMode) => {
    const { amount } = getHintCost(gameMode, hintStage);

    // Deduct cost based on game mode
    if (gameMode === 'playing' || gameMode === 'dailyChallenge') {
      // HP-based deduction
      setHp(prev => {
        const newHp = Math.max(0, prev - amount);
        if (newHp <= 0) {
          // Trigger game over after 2s delay
          setTimeout(() => {
            setShowQuestion(false);
            setScreen('gameOver');
          }, 2000);
        }
        return newHp;
      });
    } else if (gameMode === 'exam') {
      // Point-based deduction, floor at 0
      setScore(prev => Math.max(0, prev - amount));
    }
    // replayGate: no deduction (amount is 0)

    // Advance hint stage
    setHintStage(prev => Math.min(prev + 1, 3));
  };

  // Explain Your Answer response handler
  const handleExplainResponse = ({ correct, bonusPoints }) => {
    // Award bonus points if correct
    if (correct) {
      setScore(s => s + bonusPoints);
    }
    // Reset explain prompt state
    setExplainPromptData(null);
    setExplainPaused(false);
    // Increment cooldown counter (tracks correct answers since last prompt)
    setExplainCooldown(c => c + 1);

    // Resume normal gameplay progression
    const q = questions[qIdx % questions.length];
    const restoreBossPhase = () => {
      const game = gameRef.current;
      if (game.bossActive && game.boss) {
        game.boss.phaseHp = game.boss.maxPhaseHp;
        game.triggerQuestion = false;
        game.activePowerups.shield = Date.now() + BOSS_SHIELD_DURATION;
      }
    };

    if (bossActive) {
      setQIdx(qi => qi + 1); restoreBossPhase();
    } else {
      const nextQ = qIdx + 1;
      if (nextQ >= WAVES_BEFORE_BOSS) {
        setQIdx(nextQ); startBoss();
      } else {
        setQIdx(nextQ); setWaveNumber(w => w + 1); setAliensKilled(0); gameRef.current.killCount = 0;
      }
    }
  };

  // Called when player clicks "Continue" after viewing Teach Me solution
  const handleDismissTeachMe = () => {
    if (screen === 'playing') {
      setShowQuestion(false); setFeedback(null); setHintStage(0);
      if (bossActive) {
        setQIdx(qi => qi + 1);
        const game = gameRef.current;
        if (game.bossActive && game.boss) {
          game.boss.phaseHp = game.boss.maxPhaseHp;
          game.triggerQuestion = false;
          game.activePowerups.shield = Date.now() + BOSS_SHIELD_DURATION;
        }
      } else {
        const nextQ = qIdx + 1;
        if (nextQ >= WAVES_BEFORE_BOSS) { setQIdx(nextQ); startBoss(); }
        else { setQIdx(nextQ); setWaveNumber(w => w + 1); setAliensKilled(0); gameRef.current.killCount = 0; }
      }
    } else if (screen === 'exam') {
      setHintStage(0);
      advanceExam(examLives);
    }
  };

  // Keyboard
  useEffect(() => {
    const onDown = (e) => {
      const k = e.key.toLowerCase();
      gameRef.current.keys[k] = true;
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(k)) e.preventDefault();
    };
    const onUp = (e) => { gameRef.current.keys[e.key.toLowerCase()] = false; };
    const clearKeys = () => { gameRef.current.keys = {}; };
    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup', onUp);
    window.addEventListener('blur', clearKeys);
    return () => {
      window.removeEventListener('keydown', onDown);
      window.removeEventListener('keyup', onUp);
      window.removeEventListener('blur', clearKeys);
    };
  }, []);

  // Number key shortcuts (1-4) for answer selection
  useEffect(() => {
    const onNumberKey = (e) => {
      const questionModalActive = (showQuestion || screen === 'exam') && !feedback && !examFeedback;
      if (!questionModalActive) return;
      const keyNum = parseInt(e.key, 10);
      if (keyNum < 1 || keyNum > 4 || isNaN(keyNum)) return;
      const q = questions[qIdx % questions.length];
      if (!q) return;
      const shuffledOptions = shuffleAnswers([q.a, ...q.wrong], qIdx);
      const answerIndex = keyNum - 1;
      if (answerIndex >= shuffledOptions.length) return;
      e.preventDefault();
      if (screen === 'exam') handleExamAnswer(shuffledOptions[answerIndex]);
      else handleAnswer(shuffledOptions[answerIndex]);
    };
    window.addEventListener('keydown', onNumberKey);
    return () => window.removeEventListener('keydown', onNumberKey);
  }, [showQuestion, screen, feedback, examFeedback, questions, qIdx]);

  // Pointer handling
  const TOUCH_Y_OFFSET = 78;
  const updatePointer = (clientX, clientY, isTouch = false) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * W;
    let y = ((clientY - rect.top) / rect.height) * H;
    if (isTouch) y -= TOUCH_Y_OFFSET;
    gameRef.current.pointer.x = x;
    gameRef.current.pointer.y = y;
    gameRef.current.pointer.active = true;
  };
  const handleMouseMove = (e) => updatePointer(e.clientX, e.clientY);
  const handleMouseDown = (e) => updatePointer(e.clientX, e.clientY);
  const handleMouseLeave = () => { gameRef.current.pointer.active = false; };

  // Native touch listeners
  useEffect(() => {
    if (screen !== 'playing') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const onStart = (e) => { e.preventDefault(); if (e.touches[0]) updatePointer(e.touches[0].clientX, e.touches[0].clientY, true); };
    const onMove = (e) => { e.preventDefault(); if (e.touches[0]) updatePointer(e.touches[0].clientX, e.touches[0].clientY, true); };
    const onEnd = (e) => { e.preventDefault(); gameRef.current.pointer.active = false; };
    canvas.addEventListener('touchstart', onStart, { passive: false });
    canvas.addEventListener('touchmove', onMove, { passive: false });
    canvas.addEventListener('touchend', onEnd, { passive: false });
    canvas.addEventListener('touchcancel', onEnd, { passive: false });
    return () => {
      canvas.removeEventListener('touchstart', onStart);
      canvas.removeEventListener('touchmove', onMove);
      canvas.removeEventListener('touchend', onEnd);
      canvas.removeEventListener('touchcancel', onEnd);
    };
  }, [screen]);

  // Game loop
  useEffect(() => {
    if (screen !== 'playing') {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      return;
    }
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = setupCanvas(canvas, W, H);
    const tick = () => {
      updateCanvasScale(canvas, ctx, W, H);
      const game = gameRef.current;
      if (!game.paused) updateGame(game, dispatcher, { setScore, reducedMotion });
      drawGame(ctx, game, { reducedMotion });
      animRef.current = requestAnimationFrame(tick);
    };
    animRef.current = requestAnimationFrame(tick);
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [screen]);

  useEffect(() => {
    return () => { if (bossQuestionTimerRef.current) clearTimeout(bossQuestionTimerRef.current); };
  }, []);

  // Bridge: ref → React state (activePowerups)
  useEffect(() => {
    if (screen !== 'playing') return;
    const interval = setInterval(() => {
      const game = gameRef.current;
      const now = Date.now();
      const newActive = {
        shield: Math.max(0, game.activePowerups.shield - now),
        rapid: Math.max(0, game.activePowerups.rapid - now),
        triple: Math.max(0, game.activePowerups.triple - now),
      };
      setActivePowerups(prev => {
        if (prev.shield === newActive.shield && prev.rapid === newActive.rapid && prev.triple === newActive.triple) return prev;
        return newActive;
      });
    }, 80);
    return () => clearInterval(interval);
  }, [screen]);

  const handleAnswer = (answer) => {
    const q = questions[qIdx % questions.length];
    const correct = answer === q.a;
    const restoreBossPhase = () => {
      const game = gameRef.current;
      if (game.bossActive && game.boss) {
        game.boss.phaseHp = game.boss.maxPhaseHp;
        game.triggerQuestion = false;
        game.activePowerups.shield = Date.now() + BOSS_SHIELD_DURATION;
      }
    };
    if (correct) {
      const points = bossActive ? 300 : 200;
      setScore(s => s + points); setBestStreak(b => b + 1);
      playSound('correct', soundOn);
      awardXPAndCheck(20);
      const currentDifficulty = questionDifficultiesRef.current[qIdx] || 'medium';
      const newAdaptive = updateAdaptiveState(adaptiveState, topic, currentDifficulty, true);
      setAdaptiveState(newAdaptive); saveAdaptiveState(newAdaptive);
      if (!bossActive) setHp(prev => Math.min(MAX_HP, prev + HP_CORRECT_BONUS));
      setFeedback({ type: 'correct', text: '🎯 ON TARGET!', points, hpBonus: !bossActive ? HP_CORRECT_BONUS : 0, shieldBonus: bossActive });
      if (bossActive) {
        const newHp = bossHp - 1;
        setBossHp(newHp);
        if (newHp <= 0) {
          setTimeout(() => {
            setShowQuestion(false); setFeedback(null); setHintStage(0);
            const newCompleted = { ...completed, [topic]: true };
            setCompleted(newCompleted); saveProgress(newCompleted);
            playSound('levelUp', soundOn);
            const finalScore = score + points;
            saveHighScore(topic, finalScore).then(() => loadHighScores().then(setHighScores));
            const questionsAnswered = qIdx + 1;
            const questionsRight = bestStreak + 1;
            const questionsWrong = questionsAnswered - questionsRight;
            recordSession({ topic, questionsAttempted: questionsAnswered, questionsCorrect: questionsRight, questionsWrong, timeSpent: Math.round((Date.now() - missionStartTsRef.current) / 1000), difficultyBreakdown: getMissionDifficultyBreakdown(questionsAnswered, questionsRight), timestamp: Date.now() });
            awardXPAndCheck(100);
            setScreen('victory');
          }, 1400);
          return;
        } else {
          setTimeout(() => {
            setShowQuestion(false); setFeedback(null); setHintStage(0);
            // Check if explain prompt should trigger
            const hasExplainData = !!(q.explain && q.explain.prompt && q.explain.options && q.explain.options.length === 3);
            const shouldExplain = shouldTriggerExplain({
              gameMode: 'playing',
              cooldownCount: explainCooldown + 1, // +1 for this correct answer
              randomValue: Math.random(),
              hasExplainData,
            });
            if (shouldExplain) {
              setExplainCooldown(0); // Reset after triggering
              setExplainPromptData(q.explain);
              setExplainPaused(true);
            } else {
              setExplainCooldown(c => c + 1);
              setQIdx(qi => qi + 1); restoreBossPhase();
            }
          }, 1400);
        }
      } else {
        const nextQ = qIdx + 1;
        if (nextQ >= WAVES_BEFORE_BOSS) {
          setTimeout(() => {
            setShowQuestion(false); setFeedback(null); setHintStage(0);
            // Check if explain prompt should trigger
            const hasExplainData = !!(q.explain && q.explain.prompt && q.explain.options && q.explain.options.length === 3);
            const shouldExplain = shouldTriggerExplain({
              gameMode: 'playing',
              cooldownCount: explainCooldown + 1,
              randomValue: Math.random(),
              hasExplainData,
            });
            if (shouldExplain) {
              setExplainCooldown(0);
              setExplainPromptData(q.explain);
              setExplainPaused(true);
            } else {
              setExplainCooldown(c => c + 1);
              setQIdx(nextQ); startBoss();
            }
          }, 1400);
        } else {
          setTimeout(() => {
            setShowQuestion(false); setFeedback(null); setHintStage(0);
            // Check if explain prompt should trigger
            const hasExplainData = !!(q.explain && q.explain.prompt && q.explain.options && q.explain.options.length === 3);
            const shouldExplain = shouldTriggerExplain({
              gameMode: 'playing',
              cooldownCount: explainCooldown + 1,
              randomValue: Math.random(),
              hasExplainData,
            });
            if (shouldExplain) {
              setExplainCooldown(0);
              setExplainPromptData(q.explain);
              setExplainPaused(true);
            } else {
              setExplainCooldown(c => c + 1);
              setQIdx(nextQ); setWaveNumber(w => w + 1); setAliensKilled(0); gameRef.current.killCount = 0;
            }
          }, 1400);
        }
      }
    } else {
      playSound('wrong', soundOn);
      setFeedback({ type: 'wrong', text: '❌ MISSED!', correct: q.a, hint: q.hint });
      recordMistake({ topic, question: q, selectedAnswer: answer, correctAnswer: q.a, timestamp: Date.now() }).then(() => loadMistakes().then(setMistakes));
      const currentDifficulty = questionDifficultiesRef.current[qIdx] || 'medium';
      const newAdaptive = updateAdaptiveState(adaptiveState, topic, currentDifficulty, false);
      setAdaptiveState(newAdaptive); saveAdaptiveState(newAdaptive);
      setHp(prev => {
        const newHp = Math.max(0, prev - DMG_WRONG);
        if (newHp <= 0) setTimeout(() => { setShowQuestion(false); setScreen('gameOver'); }, 2400);
        return newHp;
      });
    }
  };

  return {
    // Refs
    canvasRef, gameRef,
    // Screen state
    screen, setScreen,
    // Game state
    topic, questions, qIdx, score, hp, aliensKilled, waveNumber,
    bossActive, bossHp, showQuestion, feedback, paused, setPaused,
    bestStreak, activePowerups, reducedMotion,
    // Exam state
    examTimer, examLives, examCorrect, examFeedback, examDuration,
    // Replay gate state
    pendingTopic, replayQueue, handleReplayComplete,
    // Reminder card state
    showReminderCard, reminderTopic, handleReminderDismiss,
    // Explain prompt state
    explainPromptData, explainPaused, handleExplainResponse,
    // UI state
    showDisclaimer, showLanding, setShowLanding,
    // Handlers
    startMission, startExam, handleAnswer, handleExamAnswer,
    handleTeachMe, handleDismissTeachMe, handleDismissDisclaimer,
    handleMouseMove, handleMouseDown, handleMouseLeave,
    handleRequestHint,
    // Progressive hint state
    hintStage,
    // Dispatcher
    dispatcher,
  };
}
