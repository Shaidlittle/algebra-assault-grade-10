# Implementation Plan: Modular File Split

## Overview

Split the monolithic `src/App.jsx` (~2300 lines) into focused ES modules following the natural seams already present in the code. The refactor is purely structural — no behavior changes. Each task extracts a logical unit, wires it back into the App Shell, and validates correctness through tests. Vitest + fast-check are set up first to enable property-based testing throughout.

## Tasks

- [x] 1. Set up testing infrastructure
  - [x] 1.1 Install Vitest and fast-check, configure vitest.config.js
    - Add `vitest` and `fast-check` as dev dependencies
    - Create `vitest.config.js` with jsdom environment for React component tests
    - Add a `"test"` script to package.json (`vitest --run`)
    - Verify the test runner executes with a trivial passing test
    - _Requirements: 7.1_

- [x] 2. Extract question data module
  - [x] 2.1 Create `src/data/questions.js` with QUESTIONS, TOPICS_ORDER, and PLAYABLE_TOPICS
    - Cut the QUESTIONS object, TOPICS_ORDER array, and PLAYABLE_TOPICS array from App.jsx
    - Place them in `src/data/questions.js` as named exports
    - _Requirements: 1.1, 1.2, 1.3_

  - [x] 2.2 Write property test for question data structure invariant
    - **Property 1: Question data structure invariant**
    - **Validates: Requirements 1.1**

  - [x] 2.3 Update App.jsx to import from `src/data/questions.js`
    - Add `import { QUESTIONS, TOPICS_ORDER, PLAYABLE_TOPICS } from './data/questions.js'` to App.jsx
    - Remove the original inline definitions
    - Verify the app builds without errors
    - _Requirements: 1.4, 8.1, 8.3_

- [x] 3. Extract constants module
  - [x] 3.1 Create `src/constants.js` with all game configuration values
    - Export all HP constants, wave settings, boss settings, power-up config, exam settings, canvas dimensions (W, H), and derived helpers (getMaxBossHp, getBossPhaseHp)
    - _Requirements: 2.1, 2.2, 2.3_

  - [x] 3.2 Write property test for getMaxBossHp and getBossPhaseHp
    - **Property 2: getMaxBossHp and getBossPhaseHp correctness**
    - **Validates: Requirements 2.5**

  - [x] 3.3 Update App.jsx to import from `src/constants.js`
    - Replace all inline constant definitions with imports from the constants module
    - Verify the app builds without errors
    - _Requirements: 2.4, 8.1, 8.3_

- [x] 4. Extract audio module
  - [x] 4.1 Create `src/audio.js` with the playSound function
    - Cut the `playSound` function from App.jsx into `src/audio.js` as a named export
    - Ensure it has no dependencies on other app modules
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_

  - [x] 4.2 Write property test for playSound never-throws guarantee
    - **Property 3: playSound never throws**
    - **Validates: Requirements 3.5, 3.6, 3.7**

  - [x] 4.3 Update App.jsx to import playSound from `src/audio.js`
    - Add `import { playSound } from './audio.js'` to App.jsx
    - Remove the original inline definition
    - Verify the app builds without errors
    - _Requirements: 8.1, 8.3_

- [x] 5. Checkpoint - Verify leaf modules
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Extract MathText shared component
  - [x] 6.1 Create `src/components/MathText.jsx` with the MathText component
    - Cut the MathText function and its supporting constants (SUPERSCRIPT_MAP, SUBSCRIPT_MAP, RUN_CONTINUE) from App.jsx
    - Export MathText as a named export
    - Import React at the top of the file
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

  - [x] 6.2 Write property test for MathText superscript/subscript character mapping
    - **Property 5: MathText superscript/subscript character mapping**
    - **Validates: Requirements 6.4**

  - [x] 6.3 Write property test for MathText consecutive character grouping
    - **Property 6: MathText consecutive character grouping**
    - **Validates: Requirements 6.5**

  - [x] 6.4 Update App.jsx to import MathText from `src/components/MathText.jsx`
    - Add `import { MathText } from './components/MathText.jsx'`
    - Remove the original inline definition and supporting constants
    - Verify the app builds without errors
    - _Requirements: 6.6, 8.1, 8.3_

- [x] 7. Extract game engine
  - [x] 7.1 Create `src/game/engine.js` with updateGame, drawGame, and helper functions
    - Extract the game loop logic (updateGame, drawGame, spawnParticles, damagePlayer, applyPowerup) from App.jsx
    - Import constants from `../constants.js` and playSound from `../audio.js`
    - Export all five functions as named exports
    - Keep private helpers (drawPowerup, etc.) as module-private functions
    - _Requirements: 4.1, 4.2, 4.3, 4.5, 4.6_

  - [x] 7.2 Write property test for updateGame player bounds preservation
    - **Property 4: updateGame preserves player bounds**
    - **Validates: Requirements 4.4**

  - [x] 7.3 Update App.jsx to import game engine functions
    - Add `import { updateGame, drawGame, spawnParticles, damagePlayer, applyPowerup } from './game/engine.js'`
    - Remove the original inline game loop logic
    - Wire the imported functions into the requestAnimationFrame loop and event handlers
    - _Requirements: 4.4, 8.1, 8.3_

- [x] 8. Checkpoint - Verify core modules
  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. Extract screen components
  - [x] 9.1 Create `src/screens/MenuScreen.jsx`
    - Extract the menu screen JSX and any associated inline styles/animations into a standalone component
    - Accept props: soundOn, setSoundOn, setScreen, showDisclaimer, setShowDisclaimer
    - Import MathText from `../components/MathText.jsx` and lucide-react icons as needed
    - _Requirements: 5.2, 5.9_

  - [x] 9.2 Create `src/screens/TopicSelectScreen.jsx`
    - Extract the topic selection screen into a standalone component
    - Accept props: completed, startMission, setScreen, soundOn, setSoundOn
    - Import MathText and lucide-react icons as needed
    - _Requirements: 5.3_

  - [x] 9.3 Create `src/screens/PlayingScreen.jsx`
    - Extract the active gameplay screen (canvas + HUD + question modal) into a standalone component
    - Accept props: canvasRef, hp, score, bossActive, bossHp, waveNumber, aliensKilled, topic, showQuestion, feedback, paused, activePowerups, soundOn, and all handler callbacks
    - Include associated CSS animations (pulse-slow, etc.) as inline `<style>` blocks
    - _Requirements: 5.4_

  - [x] 9.4 Create `src/screens/ExamScreen.jsx`
    - Extract the exam simulator screen into a standalone component
    - Accept props: questions, qIdx, score, examTimer, examLives, examFeedback, soundOn, handleExamAnswer, setScreen
    - _Requirements: 5.5_

  - [x] 9.5 Create `src/screens/ExamResultsScreen.jsx`
    - Extract the exam results screen into a standalone component
    - Accept props: examCorrect, score, examLives, examDuration, startExam, setScreen
    - _Requirements: 5.6_

  - [x] 9.6 Create `src/screens/VictoryScreen.jsx`
    - Extract the victory screen into a standalone component
    - Accept props: topic, score, hp, bestStreak, completed, startMission, setScreen, soundOn
    - _Requirements: 5.7_

  - [x] 9.7 Create `src/screens/GameOverScreen.jsx`
    - Extract the game over screen into a standalone component
    - Accept props: topic, score, waveNumber, bossActive, startMission, setScreen
    - _Requirements: 5.8_

- [x] 10. Wire screen components into App Shell
  - [x] 10.1 Update App.jsx to import and render all screen components
    - Replace inline screen JSX with imported screen components
    - Pass appropriate props to each screen component
    - Implement fallback to MenuScreen for unknown screen states
    - Verify the app builds without errors
    - _Requirements: 5.1, 5.9, 7.2, 7.3, 8.1, 8.3_

- [x] 11. Checkpoint - Verify full extraction
  - Ensure all tests pass, ask the user if questions arise.

- [x] 12. Final validation and cleanup
  - [x] 12.1 Verify no circular dependencies and clean import structure
    - Confirm the module graph is a DAG with no circular imports
    - Verify `src/main.jsx` is unchanged (or only import paths updated if needed)
    - Run `npm run build` and confirm zero errors/warnings beyond any pre-existing ones
    - _Requirements: 8.2, 8.3, 8.4, 7.1_

  - [x] 12.2 Write property test for progress serialization round-trip
    - **Property 7: Progress serialization round-trip**
    - **Validates: Requirements 7.6**

  - [x] 12.3 Write unit tests for screen components render without error
    - Test that each screen component renders without throwing when given minimal valid props
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8_

- [x] 13. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 14. Implement Event Dispatcher and replace polling bridge
  - [x] 14.1 Create `src/game/eventDispatcher.js` with createEventDispatcher factory
    - Implement `createEventDispatcher()` returning an object with `on(eventType, callback)`, `onAny(callback)`, and `emit(event)` methods
    - Events are delivered synchronously (no queue, no batching)
    - Event shape: `{ type: string, ...payload }`
    - Supported event types: "damage", "waveComplete", "kill", "nuke"
    - _Requirements: 9.1, 9.2, 9.5_

  - [x] 14.2 Write property test for event dispatch delivering collision events individually
    - **Property 9: Event dispatch delivers collision events individually with correct shape**
    - **Validates: Requirements 9.2, 9.5**

  - [x] 14.3 Write property test for wave completion dispatching event
    - **Property 10: Wave completion dispatches event**
    - **Validates: Requirements 9.3**

  - [x] 14.4 Update `src/game/engine.js` to accept dispatcher parameter and emit events
    - Change `updateGame(game)` signature to `updateGame(game, dispatcher)`
    - Replace `game.pendingHpChange` accumulation with `dispatcher.emit({ type: "damage", source, amount })` at each collision point
    - Replace `game.triggerQuestion = true` with `dispatcher.emit({ type: "waveComplete", waveNumber })` when killCount reaches ALIENS_PER_WAVE
    - Emit `{ type: "kill", killCount }` on alien destruction
    - Emit `{ type: "nuke" }` when nuke power-up is collected
    - Remove `pendingHpChange` and `triggerQuestion` fields from game state
    - _Requirements: 9.1, 9.2, 9.3, 9.5, 9.7_

  - [x] 14.5 Update App Shell to use Event Dispatcher instead of polling
    - Create dispatcher with `useMemo(() => createEventDispatcher(), [])`
    - Register event handlers: damage → `setHp`, waveComplete → `setShowQuestion(true)`, kill → update kill count, nuke → trigger nuke effect
    - Pass dispatcher to `updateGame(gameRef.current, dispatcher)` in the animation frame loop
    - Remove the 80ms `setInterval` polling loop that read `pendingHpChange`, `triggerQuestion`, and `pendingNuke`
    - Implement immediate game-over check inside the damage handler (when HP - amount <= 0)
    - _Requirements: 9.4, 9.6, 9.7_

  - [x] 14.6 Write property test for immediate game-over on lethal damage
    - **Property 11: Immediate game-over on lethal damage**
    - **Validates: Requirements 9.6**

- [x] 15. Implement seeded random answer shuffling
  - [x] 15.1 Create `src/utils/shuffleAnswers.js` with shuffleAnswers function
    - Implement `mulberry32(seed)` PRNG returning a function that produces floats in [0, 1)
    - Implement `shuffleAnswers(answers, seed)` using Fisher-Yates shuffle with the Mulberry32 PRNG
    - Input: array of 4 strings, integer seed
    - Output: new array of 4 strings in shuffled order (does not mutate input)
    - _Requirements: 10.1, 10.2, 10.3_

  - [x] 15.2 Write property test for shuffler output is a permutation of input
    - **Property 12: Shuffler output is a permutation of input**
    - **Validates: Requirements 10.1**

  - [x] 15.3 Write property test for shuffler determinism
    - **Property 13: Shuffler determinism**
    - **Validates: Requirements 10.2**

  - [x] 15.4 Write property test for shuffler uniform distribution
    - **Property 14: Shuffler uniform distribution**
    - **Validates: Requirements 10.3, 10.4**

  - [x] 15.5 Replace character-code-sum sorting with shuffleAnswers in App Shell
    - Import `shuffleAnswers` from `./utils/shuffleAnswers.js`
    - In mission question presentation: replace `[q.a, ...q.wrong].sort((a, b) => charSum(a) - charSum(b))` with `shuffleAnswers([q.a, ...q.wrong], qIdx)`
    - In exam question presentation: apply the same replacement
    - Remove the `charSum` helper function if no longer used elsewhere
    - _Requirements: 10.4, 10.5, 10.6_

- [x] 16. Persist disclaimer dismissal state
  - [x] 16.1 Add disclaimer persistence logic to App Shell
    - Add a `useEffect` that checks `window.storage.get('disclaimer-dismissed')` on mount
    - If the stored value is truthy, call `setShowDisclaimer(false)` to skip the disclaimer
    - If the read fails or returns falsy, keep `showDisclaimer` as `true` (safe default)
    - Update the dismissal handler to call `window.storage.set('disclaimer-dismissed', 'true')` when the user dismisses
    - Wrap the storage write in try/catch (fire-and-forget, non-critical)
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

  - [x] 16.2 Write property test for disclaimer visibility determined by storage value
    - **Property 15: Disclaimer visibility determined by storage value**
    - **Validates: Requirements 11.3, 11.4**

- [x] 17. Implement Canvas DPI scaling
  - [x] 17.1 Create `src/game/canvasSetup.js` with setupCanvas and updateCanvasScale
    - Implement `setupCanvas(canvas, logicalWidth, logicalHeight)` that reads `window.devicePixelRatio`, sets canvas width/height attributes to logical × DPR, sets CSS dimensions to logical size, gets 2D context, applies `ctx.scale(dpr, dpr)`, stores `canvas._lastDpr`, and returns the context
    - Implement `updateCanvasScale(canvas, ctx, logicalWidth, logicalHeight)` that checks if DPR changed since last call, and if so re-applies the scaling (update attributes, reset transform, re-apply scale)
    - _Requirements: 12.1, 12.2, 12.3, 12.5, 12.6_

  - [x] 17.2 Write property test for canvas DPI scaling dimensions
    - **Property 16: Canvas DPI scaling dimensions**
    - **Validates: Requirements 12.1, 12.2**

  - [x] 17.3 Write property test for canvas context scale matches DPR
    - **Property 17: Canvas context scale matches DPR**
    - **Validates: Requirements 12.3**

  - [x] 17.4 Write property test for dynamic DPR re-application
    - **Property 18: Dynamic DPR re-application**
    - **Validates: Requirements 12.6**

  - [x] 17.5 Integrate canvasSetup into App Shell game loop
    - Import `setupCanvas` and `updateCanvasScale` from `./game/canvasSetup.js`
    - Replace direct canvas context acquisition with `const ctx = setupCanvas(canvasRef.current, W, H)`
    - Add `updateCanvasScale(canvas, ctx, W, H)` at the top of each animation frame before `updateGame` and `drawGame`
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.6_

- [x] 18. Final checkpoint - Ensure all new feature tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 19. Implement wave difficulty progression
  - [x] 19.1 Create `src/game/waveDifficulty.js` with getWaveDifficulty function
    - Implement `getWaveDifficulty(waveNumber)` returning `{ spawnInterval, alienSpeed, shootingInterval }`
    - Define a lookup table (WAVE_PARAMS) with explicit values for waves 1–4: wave 1 (spawn: 90, speed: 1.2, shooting: 180), wave 2 (spawn: 70, speed: 1.5, shooting: 155), wave 3 (spawn: 50, speed: 2.1, shooting: 115), wave 4 (spawn: 35, speed: 2.7, shooting: 80)
    - Fallback to wave 1 parameters for out-of-range wave numbers
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5_

  - [x] 19.2 Write property test for wave difficulty parameters within bounds
    - **Property 19: Wave difficulty parameters within bounds**
    - **Validates: Requirements 13.1, 13.2, 13.3, 13.4**

  - [x] 19.3 Write property test for wave difficulty monotonic progression
    - **Property 20: Wave difficulty monotonic progression**
    - **Validates: Requirements 13.5**

  - [x] 19.4 Update `src/game/engine.js` to use getWaveDifficulty for alien spawning
    - Import `getWaveDifficulty` from `./waveDifficulty.js`
    - Replace the current minimal `diff` calculation in the alien spawning logic with `const diff = getWaveDifficulty(game.waveNumber)`
    - Use `diff.spawnInterval` for spawn timer reset, `diff.alienSpeed` for alien movement speed, and `diff.shootingInterval` for alien shooting interval
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5_

- [x] 20. Rename boss shield label to ARMOR
  - [x] 20.1 Change boss HP bar label from "SHIELD" to "ARMOR" in `src/game/engine.js`
    - In the `drawGame` function's boss rendering section, replace the string literal `"SHIELD"` with `"ARMOR"` in the boss phase HP bar label
    - Ensure the player's Shield power-up indicator still uses "SHIELD" (separate code path, no change needed)
    - _Requirements: 14.1, 14.2, 14.3_

  - [x] 20.2 Write unit test verifying boss label is "ARMOR" and not "SHIELD"
    - **Property 21: Boss label correctness during active shield**
    - **Validates: Requirements 14.1, 14.2, 14.3**

- [x] 21. Implement exam wrong answer visual feedback
  - [x] 21.1 Create `triggerWrongAnswerFeedback(game)` utility function
    - Add the function to `src/game/engine.js` (or a suitable utility location) as a named export
    - Implementation: set `game.shake = 8`, `game.flash = 12`, `game.flashColor = '#ef4444'`
    - These values match the shooter mode's wrong-answer feedback intensity
    - _Requirements: 15.1, 15.2, 15.3_

  - [x] 21.2 Write property test for exam wrong-answer feedback values
    - **Property 22: Exam wrong-answer feedback matches shooter mode**
    - **Validates: Requirements 15.1, 15.2, 15.3**

  - [x] 21.3 Integrate triggerWrongAnswerFeedback into exam handlers in App Shell
    - Import `triggerWrongAnswerFeedback` from the game engine module
    - Call `triggerWrongAnswerFeedback(gameRef.current)` in `handleExamAnswer` when the answer is wrong
    - Call `triggerWrongAnswerFeedback(gameRef.current)` in the exam timer timeout handler when time expires
    - _Requirements: 15.1, 15.2, 15.3_

  - [x] 21.4 Update ExamScreen to apply shake/flash CSS effects from gameRef
    - Read `gameRef.current.shake` and `gameRef.current.flash` in ExamScreen component
    - Apply CSS translateX jitter when shake > 0 and red overlay with opacity fade when flash > 0
    - Ensure effects do not obscure question text or answer buttons for more than 300ms
    - _Requirements: 15.4_

- [x] 22. Generate and verify package-lock.json
  - [x] 22.1 Ensure package-lock.json exists and is not gitignored
    - Run `npm install` to generate/update `package-lock.json` at the repository root
    - Verify `.gitignore` does not contain `package-lock.json`
    - Confirm the file is tracked by version control
    - _Requirements: 16.1, 16.2, 16.3_

- [x] 23. Final checkpoint - Ensure all requirements 13-16 tasks pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 24. Implement AudioContext reuse in audio module
  - [x] 24.1 Enhance `src/audio.js` with shared AudioContext singleton
    - Add a module-level `let sharedCtx = null` variable
    - Update `playSound` to lazily create the AudioContext on first enabled call (not at module load time)
    - When `sharedCtx` exists, reuse it for all subsequent calls — never call the AudioContext constructor again
    - If `sharedCtx.state === 'suspended'`, call `sharedCtx.resume()` before scheduling oscillator nodes
    - If AudioContext creation fails (constructor throws), keep `sharedCtx` as `null` so the next call retries
    - Wrap all AudioContext creation and resume logic in try/catch (silently suppress errors)
    - _Requirements: 17.1, 17.2, 17.3, 17.4, 17.5_

  - [x] 24.2 Write property test for AudioContext singleton guarantee
    - **Property 23: AudioContext singleton guarantee**
    - **Validates: Requirements 17.1, 17.4**

  - [x] 24.3 Write property test for AudioContext retry after creation failure
    - **Property 24: AudioContext retry after creation failure**
    - **Validates: Requirements 17.5**

- [x] 25. Implement reduced motion accessibility
  - [x] 25.1 Create `src/utils/reducedMotion.js` with getReducedMotion and onReducedMotionChange
    - Implement `getReducedMotion()` that reads `window.matchMedia('(prefers-reduced-motion: reduce)').matches` and returns a boolean
    - Implement `onReducedMotionChange(callback)` that registers a listener on the matchMedia query and returns a cleanup function
    - _Requirements: 18.1, 18.6_

  - [x] 25.2 Update App Shell to read reduced motion preference and pass to engine
    - Add `const [reducedMotion, setReducedMotion] = useState(getReducedMotion())` state
    - Add `useEffect` that calls `onReducedMotionChange(setReducedMotion)` and returns the cleanup function
    - Pass `{ reducedMotion }` as an options parameter to `updateGame` and `drawGame`
    - _Requirements: 18.1, 18.6_

  - [x] 25.3 Update `src/game/engine.js` to suppress visual effects when reducedMotion is true
    - Accept `options` parameter in `updateGame(game, dispatcher, options)` and `drawGame(ctx, game, options)`
    - When `options.reducedMotion` is true: set `game.shake = 0` at start of frame, skip flash overlay rendering in `drawGame`, make `spawnParticles` return immediately without adding particles
    - All gameplay logic (collision, damage, scoring, wave progression) must remain identical regardless of reducedMotion
    - _Requirements: 18.2, 18.3, 18.4, 18.5_

  - [x] 25.4 Write property test for reduced motion suppresses visual effects
    - **Property 25: Reduced motion suppresses visual effects**
    - **Validates: Requirements 18.2, 18.3, 18.4**

  - [x] 25.5 Write property test for reduced motion preserves gameplay logic
    - **Property 26: Reduced motion preserves gameplay logic**
    - **Validates: Requirements 18.5**

- [x] 26. Implement high score persistence
  - [x] 26.1 Create `src/utils/highScores.js` with loadHighScores, saveHighScore, and shouldUpdateHighScore
    - Implement `loadHighScores()` — async, reads from storage key `"matteo-highscores"`, returns parsed object or `{}` on failure
    - Implement `saveHighScore(topic, score)` — async, loads current scores, saves if `shouldUpdateHighScore` returns true
    - Implement `shouldUpdateHighScore(currentScore, storedBest)` — pure function, returns true if storedBest is null/undefined or currentScore > storedBest
    - Storage format: `{ [topicKey]: number }`
    - _Requirements: 19.1, 19.2, 19.3, 19.4, 19.6_

  - [x] 26.2 Write property test for high score persistence preserves maximum
    - **Property 27: High score persistence preserves maximum**
    - **Validates: Requirements 19.1, 19.2, 19.3, 19.4**

  - [x] 26.3 Integrate high scores into App Shell and TopicSelectScreen
    - Load high scores on mount with `loadHighScores()` and store in state
    - Pass `highScores` as a prop to TopicSelectScreen
    - Call `saveHighScore(topic, score)` on victory screen transition
    - Call `saveHighScore('exam', score)` on exam results screen transition
    - Display stored best score next to each topic on TopicSelectScreen
    - _Requirements: 19.5, 19.7_

- [x] 27. Implement pause on visibility change
  - [x] 27.1 Add visibility change handler to App Shell
    - Add a `useEffect` that listens for `document.visibilitychange` events
    - When `document.visibilityState === 'hidden'` AND `screen === 'playing'` AND game is not already paused: set `gameRef.current.paused = true` and `setPaused(true)`
    - When visibility returns to `"visible"`: do nothing (stay paused, player resumes manually)
    - Do not trigger during non-gameplay screens (menu, topicSelect, exam, victory, gameOver)
    - If game is already paused when document becomes hidden, do not alter state
    - Include `screen` in the useEffect dependency array
    - _Requirements: 20.1, 20.2, 20.3, 20.4, 20.5_

  - [x] 27.2 Write property test for visibility pause only during active gameplay
    - **Property 28: Visibility pause only during active gameplay**
    - **Validates: Requirements 20.1, 20.2, 20.4, 20.5**

- [x] 28. Implement keyboard answer shortcuts
  - [x] 28.1 Enhance keydown handler in App Shell for number key answer selection
    - In the existing `handleKeyDown` function, add a guard: `if ((showQuestion || screen === 'exam') && !feedback && !examFeedback)`
    - Parse `e.key` as integer (1-4), map to `shuffledOptions[keyNum - 1]`
    - Key mapping: 1=top-left, 2=top-right, 3=bottom-left, 4=bottom-right (matches 2×2 grid layout)
    - Call `handleAnswer(shuffledOptions[answerIndex])` for mission questions
    - Call `handleExamAnswer(shuffledOptions[answerIndex])` for exam questions
    - Call `e.preventDefault()` when a valid number key is handled
    - Ensure keys 1-4 do not interfere with movement/pause keys when no question modal is active
    - _Requirements: 21.1, 21.2, 21.3, 21.4, 21.5_

  - [x] 28.2 Write property test for keyboard shortcuts select correct answer option
    - **Property 29: Keyboard shortcuts select correct answer option**
    - **Validates: Requirements 21.1, 21.2, 21.3**

  - [x] 28.3 Write property test for keyboard shortcuts inactive without question modal
    - **Property 30: Keyboard shortcuts inactive without question modal**
    - **Validates: Requirements 21.5**

- [x] 29. Verify PostCSS configuration
  - [x] 29.1 Verify `postcss.config.js` exists with correct content
    - Confirm `postcss.config.js` exists at repository root
    - Verify it exports a configuration object with `plugins` containing `tailwindcss` and `autoprefixer`
    - Run `npm run build` to confirm the PostCSS pipeline processes CSS correctly
    - _Requirements: 22.1, 22.2, 22.3, 22.4_

- [x] 30. Implement student progress tracking
  - [x] 30.1 Create `src/utils/progressTracker.js` with loadProgressHistory, recordSession, and computeMetrics
    - Implement `loadProgressHistory()` — async, reads from storage key `"matteo-progress-history"`, returns parsed array or `[]` on failure
    - Implement `recordSession(sessionData)` — async, appends session to history, trims to last 50 entries, persists to storage
    - Implement `computeMetrics(sessions)` — pure function, computes: overallAccuracy, perTopicAccuracy, perDifficultyAccuracy, currentStreak, bestStreak, totalQuestions, strongestTopic, weakestTopic, trend (oldest 5 vs newest 5 accuracy, null if < 10 sessions)
    - SessionRecord shape: `{ topic, questionsAttempted, questionsCorrect, questionsWrong, timeSpent, difficultyBreakdown: { easy: {attempted, correct}, medium: {attempted, correct}, hard: {attempted, correct} }, timestamp }`
    - _Requirements: 23.1, 23.2, 23.3_

  - [x] 30.2 Write property test for progress session history capped at 50
    - **Property 31: Progress session history capped at 50**
    - **Validates: Requirements 23.1, 23.2**

  - [x] 30.3 Write property test for progress metrics computation correctness
    - **Property 32: Progress metrics computation correctness**
    - **Validates: Requirements 23.3, 23.4**

  - [x] 30.4 Create `src/screens/ProgressScreen.jsx`
    - Accept props: `metrics`, `sessionsCount`, `setScreen`
    - Display: overall accuracy percentage, per-topic accuracy breakdown, strongest topic (green), weakest topic (amber), total questions solved, improvement trend (arrow up/down or "Need more sessions")
    - If `sessionsCount < 2`: show available stats + "Play more sessions to see trends" message
    - If `metrics` is null: show "Progress data unavailable" message
    - If `sessionsCount === 0`: show "No sessions recorded yet. Complete a mission to start tracking!"
    - Include a back button to return to menu (`setScreen('menu')`)
    - _Requirements: 23.4, 23.5, 23.6_

  - [x] 30.5 Integrate progress tracking into App Shell and MenuScreen
    - Add "Progress" button to MenuScreen (pass `onShowProgress` prop)
    - Add `screen === 'progress'` rendering case in App Shell to render ProgressScreen
    - On navigation to progress: load sessions with `loadProgressHistory()`, compute metrics with `computeMetrics()`, pass to ProgressScreen
    - Record session data on mission completion (victory screen transition) and exam completion (exam results transition)
    - Session data includes: topic, questionsAttempted, questionsCorrect, questionsWrong, timeSpent, difficultyBreakdown, timestamp
    - _Requirements: 23.4, 23.7_

- [x] 31. Final checkpoint - Ensure all requirements 17-23 tasks pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 32. Implement step-by-step solution walkthrough
  - [x] 32.1 Add `steps` arrays to all questions in `src/data/questions.js`
    - Add a `steps` field (array of strings) to each question object across all topics and difficulty tiers
    - Each step describes one logical operation in solving the problem (e.g., "Subtract 5 from both sides → 2x = 8")
    - _Requirements: 24.1_

  - [x] 32.2 Update feedback panel in PlayingScreen and ExamScreen to show numbered steps
    - When the student answers incorrectly, expand the feedback area to display numbered steps from the question's `steps` array
    - Apply a sequential reveal animation (brief delay between each step appearing)
    - Include a dismiss button to close the walkthrough and continue gameplay
    - If `steps` is missing or empty, fall back to displaying the `hint` field
    - _Requirements: 24.2, 24.3, 24.4, 24.5, 24.7_

  - [x] 32.3 Write property test for solution walkthrough fallback behavior
    - **Property 33: Solution walkthrough fallback behavior**
    - **Validates: Requirements 24.2, 24.7**

  - [x] 32.4 Write property test for walkthrough preserves game state
    - **Property 34: Teach Me and walkthrough preserve game state**
    - **Validates: Requirements 24.6**

- [x] 33. Implement mistake journal and review mode
  - [x] 33.1 Create `src/utils/mistakeJournal.js` with loadMistakes, recordMistake, markResolved, groupMistakesByTopic, getMistakeStats
    - Implement storage-backed mistake recording with key `"matteo-mistakes"`
    - MistakeEntry shape: `{ topic, question, selectedAnswer, correctAnswer, timestamp, resolved }`
    - `markResolved(topic, timestamp)` finds entry by topic+timestamp and sets `resolved: true`
    - `groupMistakesByTopic` and `getMistakeStats` are pure functions
    - _Requirements: 25.1, 25.2, 25.4, 25.5, 25.6_

  - [x] 33.2 Write property test for mistake journal round-trip persistence
    - **Property 35: Mistake journal round-trip persistence**
    - **Validates: Requirements 25.1, 25.2**

  - [x] 33.3 Write property test for mistake grouping correctness
    - **Property 36: Mistake grouping correctness**
    - **Validates: Requirements 25.4, 25.5**

  - [x] 33.4 Create `src/screens/ReviewScreen.jsx`
    - Accept props: `mistakes`, `onAnswer`, `onBack`
    - Display summary stats (total, resolved, unresolved), topic-grouped mistake cards
    - Unresolved cards show interactive answer buttons; resolved cards show "Resolved ✓" badge
    - Show question text, student's wrong answer (red), correct answer (green), steps walkthrough
    - _Requirements: 25.3, 25.4, 25.5, 25.6, 25.8, 25.9_

  - [x] 33.5 Integrate mistake journal into App Shell
    - Add "Review Mistakes" button to MenuScreen
    - Record mistakes on wrong answers in mission, exam, and daily challenge modes
    - Handle `onAnswer` callback: mark resolved on correct, update timestamp on incorrect
    - No XP awarded for Review Mode answers
    - _Requirements: 25.1, 25.3, 25.6, 25.7_

- [x] 34. Implement adaptive difficulty
  - [x] 34.1 Create `src/utils/adaptiveDifficulty.js` with loadAdaptiveState, saveAdaptiveState, getAdaptiveLevel, updateAdaptiveState
    - Storage key: `"matteo-adaptive"`
    - AdaptiveState shape: `{ [topic]: { easyStreak, mediumStreak, hardWrongStreak } }`
    - `getAdaptiveLevel(topicState)` returns "easy", "medium", or "hard" based on streak thresholds
    - `updateAdaptiveState(state, topic, difficulty, correct)` returns new state (pure function)
    - _Requirements: 26.1, 26.2, 26.3, 26.4, 26.5, 26.6, 26.8_

  - [x] 34.2 Write property test for adaptive difficulty level transitions
    - **Property 37: Adaptive difficulty level transitions**
    - **Validates: Requirements 26.2, 26.3, 26.4, 26.5, 26.8**

  - [x] 34.3 Write property test for adaptive state persistence round-trip
    - **Property 38: Adaptive state persistence round-trip**
    - **Validates: Requirements 26.1, 26.6**

  - [x] 34.4 Replace fixed question distribution in App Shell with adaptive selection
    - Load adaptive state on mount
    - In `startMission`, use `getAdaptiveLevel(state[topic])` to determine difficulty tier for question selection
    - After each answer, call `updateAdaptiveState` and persist with `saveAdaptiveState`
    - _Requirements: 26.5, 26.7_

- [x] 35. Implement Teach Me button
  - [x] 35.1 Add Teach Me button to question modals in PlayingScreen and ExamScreen
    - Render a secondary-styled button ("Teach Me") below the answer grid
    - On tap: reveal the `steps` array content (same as Solution_Walkthrough), dismiss question, continue game
    - No score change, no HP change, no XP award, no streak update, no mistake recording
    - Keyboard shortcuts (1-4) do NOT map to Teach Me — requires deliberate click/tap
    - _Requirements: 27.1, 27.2, 27.3, 27.4, 27.5, 27.6, 27.7, 27.8_

  - [x] 35.2 Write unit test verifying Teach Me preserves game state
    - Test that score, HP, XP, and streak remain unchanged after Teach Me is used
    - _Requirements: 27.3, 27.4, 27.5_

- [x] 36. Implement topic mastery indicators
  - [x] 36.1 Create `src/utils/masteryLevel.js` with getMasteryLevel, getMasteryColor, computeTopicMasteries
    - Thresholds: none (<40%), bronze (40-59%), silver (60-79%), gold (80-89%), diamond (90-100%)
    - Colors: none=#6B7280, bronze=#CD7F32, silver=#C0C0C0, gold=#FFD700, diamond=#B9F2FF
    - `computeTopicMasteries(perTopicAccuracy)` maps all topics to mastery levels
    - _Requirements: 28.1, 28.2, 28.3_

  - [x] 36.2 Write property test for mastery level threshold correctness
    - **Property 42: Mastery level threshold correctness**
    - **Validates: Requirements 28.1, 28.2**

  - [x] 36.3 Display mastery badges on TopicSelectScreen
    - Compute mastery from Progress_Tracker per-topic accuracy data
    - Render colored badge/border on each topic card matching the mastery level
    - Show "No mastery" state when no progress data exists for a topic
    - _Requirements: 28.1, 28.4, 28.5, 28.6_

- [x] 37. Implement daily challenge and streak system
  - [x] 37.1 Create `src/utils/dailyChallenge.js` with getDailyQuestions, isDailyCompleted, completeDailyChallenge, loadStreakData, updateStreak
    - `getDailyQuestions(dateString, questionsBank)` — pure, date-seeded selection of 3 medium/hard questions
    - Storage key: `"matteo-daily-challenge"` for `{ lastCompletedDate, currentStreak }`
    - Streak logic: consecutive = yesterday's date, gap resets to 1, same-day is idempotent
    - _Requirements: 29.2, 29.3, 29.6, 29.7, 29.8_

  - [x] 37.2 Write property test for daily challenge determinism and constraints
    - **Property 39: Daily challenge determinism and constraints**
    - **Validates: Requirements 29.2, 29.3**

  - [x] 37.3 Write property test for daily streak update logic
    - **Property 40: Daily streak update logic**
    - **Validates: Requirements 29.6, 29.7, 29.8**

  - [x] 37.4 Create `src/screens/DailyChallengeScreen.jsx`
    - Accept props: `questions`, `onAnswer`, `onComplete`, `streak`, `soundOn`
    - Display progress indicator (1/3, 2/3, 3/3), question card with answer buttons, streak display
    - Show feedback after each answer (correct/wrong with steps on wrong)
    - No timer — untimed quiz
    - _Requirements: 29.1, 29.5_

  - [x] 37.5 Integrate daily challenge into App Shell and MenuScreen
    - Add "Daily Challenge" button to MenuScreen with streak count display
    - On completion: award XP, update streak, mark daily as completed
    - Disable button and show "Completed" state if already done today
    - Display streak count on menu
    - _Requirements: 29.1, 29.4, 29.9, 29.10_

- [x] 38. Implement XP and leveling system
  - [x] 38.1 Create `src/utils/xpSystem.js` with loadXP, awardXP, getLevel, getLevelProgress, detectLevelUp
    - Storage key: `"matteo-xp"` for `{ totalXP: number }`
    - Level formula: `min(floor(totalXP / 200) + 1, 50)`
    - `detectLevelUp(prevXP, newXP)` returns true if level boundary crossed
    - _Requirements: 30.2, 30.3, 30.8_

  - [x] 38.2 Write property test for XP level formula correctness
    - **Property 41: XP level formula correctness**
    - **Validates: Requirements 30.3, 30.5**

  - [x] 38.3 Integrate XP awards into App Shell
    - Award +20 XP on correct answer in topic mission
    - Award +25 XP on correct answer in Exam Simulator
    - Award +100 XP on mission completion (victory)
    - Award +50 XP on Daily Challenge completion, +30 bonus if streak ≥ 7
    - No XP for Teach Me or Review Mode
    - Trigger level-up animation and sound on level boundary crossing
    - _Requirements: 30.1, 30.5, 30.6, 30.7_

  - [x] 38.4 Display level and XP progress bar on MenuScreen
    - Show current level number and XP bar (progress toward next level)
    - Load XP on mount, pass level/progress data as props to MenuScreen
    - _Requirements: 30.4_

- [x] 39. Implement parent/teacher report generation
  - [x] 39.1 Create `src/utils/reportGenerator.js` with generateReport function
    - Accept `metrics` and `options` (studentName, dateRange, streakData, masteryLevels, totalTimeSpent)
    - Return plain-text string with sections: Overview, Topics Covered, Strengths & Improvement, Engagement
    - No HTML tags in output — suitable for pasting into messages/emails
    - _Requirements: 31.2, 31.4, 31.5_

  - [x] 39.2 Write property test for report generator content completeness
    - **Property 43: Report generator content completeness**
    - **Validates: Requirements 31.2, 31.4, 31.5**

  - [x] 39.3 Add "Generate Report" button to ProgressScreen with copy-to-clipboard modal
    - Render "Generate Report" button on ProgressScreen
    - On tap: generate report text, display in modal overlay
    - Include "Copy to Clipboard" button using `navigator.clipboard.writeText`
    - On clipboard failure: show fallback message instructing manual copy
    - _Requirements: 31.1, 31.3, 31.6, 31.7_

- [x] 40. Final checkpoint - Ensure all requirements 24-31 tasks pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- The extraction is purely mechanical — no logic changes, no new patterns introduced
- All modules use ES named exports (except App Shell which keeps its default export)
- Screen components receive all state/callbacks as props (props-down communication)
- Tasks 14-17 introduce structural improvements (event dispatch, answer shuffling, disclaimer persistence, DPI scaling) that build on the extracted module structure from tasks 1-13
- Tasks 19-22 add wave difficulty progression, boss label rename, exam visual feedback, and package lock verification (Requirements 13-16)
- Tasks 24-30 add AudioContext reuse, reduced motion accessibility, high score persistence, visibility pause, keyboard shortcuts, PostCSS verification, and student progress tracking (Requirements 17-23)
- Tasks 32-39 add learning-focused features: solution walkthroughs, mistake journal, adaptive difficulty, Teach Me button, mastery indicators, daily challenge, XP/leveling, and parent reports (Requirements 24-31)

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["2.1", "3.1", "4.1"] },
    { "id": 2, "tasks": ["2.2", "2.3", "3.2", "3.3", "4.2", "4.3"] },
    { "id": 3, "tasks": ["6.1", "7.1"] },
    { "id": 4, "tasks": ["6.2", "6.3", "6.4", "7.2", "7.3"] },
    { "id": 5, "tasks": ["9.1", "9.2", "9.3", "9.4", "9.5", "9.6", "9.7"] },
    { "id": 6, "tasks": ["10.1"] },
    { "id": 7, "tasks": ["12.1", "12.2", "12.3"] },
    { "id": 8, "tasks": ["14.1", "15.1", "16.1", "17.1", "19.1", "22.1", "24.1", "25.1", "26.1", "29.1", "30.1"] },
    { "id": 9, "tasks": ["14.2", "14.3", "14.4", "15.2", "15.3", "15.4", "16.2", "17.2", "17.3", "17.4", "19.2", "19.3", "19.4", "20.1", "21.1", "24.2", "24.3", "25.2", "25.3", "26.2", "27.1", "28.1", "30.2", "30.3", "30.4"] },
    { "id": 10, "tasks": ["14.5", "15.5", "17.5", "20.2", "21.2", "21.3", "25.4", "25.5", "26.3", "27.2", "28.2", "28.3", "30.5"] },
    { "id": 11, "tasks": ["14.6", "21.4"] },
    { "id": 12, "tasks": ["32.1", "33.1", "34.1", "36.1", "37.1", "38.1", "39.1"] },
    { "id": 13, "tasks": ["32.2", "32.3", "32.4", "33.2", "33.3", "33.4", "34.2", "34.3", "35.1", "36.2", "37.2", "37.3", "37.4", "38.2"] },
    { "id": 14, "tasks": ["33.5", "34.4", "35.2", "36.3", "37.5", "38.3", "38.4", "39.2", "39.3"] }
  ]
}
```
