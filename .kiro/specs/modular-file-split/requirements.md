# Requirements Document

## Introduction

This specification defines the requirements for splitting the monolithic `src/App.jsx` file (~2300 lines) into separate, well-organized modules. The refactor is purely structural — no behavior changes, no new features. The game must work identically after the split. The goal is improved maintainability, readability, and developer experience through logical separation of concerns.

## Glossary

- **App_Shell**: The root React component (`App.jsx`) that orchestrates screen rendering and top-level state
- **Question_Data_Module**: The module containing all hardcoded algebra questions organized by topic and difficulty
- **Constants_Module**: The module containing game configuration values (HP, damage, timers, power-up config)
- **Audio_Module**: The module containing the Web Audio API sound system
- **Game_Engine**: The module containing the canvas game loop (update, draw, collision detection, spawning)
- **Screen_Component**: A React component representing a distinct UI screen (Menu, TopicSelect, Playing, Victory, GameOver, ExamSimulator)
- **Shared_Component**: A reusable React component used across multiple screens (e.g., MathText)
- **Build_System**: The Vite 5 development and production build pipeline
- **Storage_API**: The `window.storage` abstraction used for persisting game progress
- **State_Bridge**: The mechanism that communicates mutable game-loop state changes from the Game_Engine into React state for UI rendering
- **Event_Dispatcher**: A callback-based notification system that invokes registered listeners synchronously when a state change occurs
- **Answer_Shuffler**: The function responsible for ordering the four answer choices (one correct, three distractors) presented to the player during question prompts
- **Disclaimer_Screen**: The parent disclaimer overlay shown before the main menu, informing parents about the educational nature of the game
- **Canvas_Renderer**: The HTML5 Canvas 2D rendering surface used by the Game_Engine for gameplay visuals
- **Wave_Difficulty**: The set of parameters (alien spawn rate, alien movement speed, alien shooting interval) that scale per wave to create a noticeable difficulty curve across waves 1 through 4
- **Boss_Armor_Bar**: The boss's phase HP bar and its associated label displayed above the boss during boss fights, visually distinct from the player's Shield power-up
- **Exam_Feedback**: The visual feedback effects (screen shake and red flash) triggered in the Exam Simulator when the player answers incorrectly or a question times out
- **Package_Lock**: The `package-lock.json` file that records the exact dependency tree produced by npm, ensuring reproducible installs
- **Shared_AudioContext**: A single Web Audio API AudioContext instance maintained by the Audio_Module and reused across all playSound invocations for the lifetime of the page
- **Reduced_Motion_Mode**: The application state activated when the user's operating system reports `prefers-reduced-motion: reduce`, suppressing cosmetic motion effects while preserving gameplay functionality
- **High_Score_Store**: The per-topic best score record persisted via the Storage_API, keyed by topic identifier
- **Visibility_Pause**: The automatic pause behavior triggered when the browser document transitions to a hidden visibility state
- **Keyboard_Shortcuts**: The numeric key bindings (1–4) that allow players to select answer options during question modals without using a pointer device
- **PostCSS_Config**: The `postcss.config.js` file at the repository root that configures the Tailwind CSS and Autoprefixer plugins for the build pipeline
- **Progress_Tracker**: The subsystem responsible for recording, persisting, and displaying detailed per-session student learning statistics
- **Progress_Screen**: A dedicated UI screen accessible from the main menu that displays aggregated student learning statistics and trends
- **Solution_Walkthrough**: A multi-step breakdown of how to solve a question, displayed sequentially in the feedback panel after an incorrect answer, using the `steps` array from the question object
- **Mistake_Journal**: The persistent record of all questions the student has answered incorrectly, storing the question object, the student's wrong answer, and the timestamp of the mistake
- **Review_Mode**: A dedicated game mode accessible from the main menu where the student re-attempts previously missed questions without shooter gameplay, presented as question cards
- **Adaptive_Difficulty**: The question selection algorithm that adjusts the difficulty tier of questions presented to the student based on their demonstrated per-topic accuracy history
- **Teach_Me_Button**: A secondary button displayed on question modals that reveals the step-by-step solution without requiring the student to answer, forfeiting score for that question
- **Mastery_Indicator**: A colored badge displayed on topic cards in the topic selection screen, representing the student's accuracy-based mastery level (No mastery, Bronze, Silver, Gold, Diamond)
- **Daily_Challenge**: A daily 3-question quiz drawn from random topics at medium/hard difficulty, seeded by the calendar date, accessible from the main menu without shooter gameplay
- **Daily_Streak**: The count of consecutive calendar days the student has completed the Daily_Challenge, resetting to zero if a day is missed
- **XP_System**: The experience points accumulation system that awards XP for gameplay actions (correct answers, mission completions, daily challenges, streaks) and persists total XP via Storage_API
- **Level_System**: The player progression system that computes a level from total XP (Level = floor(totalXP / 200) + 1, capped at 50), displayed on the menu screen with a progress bar
- **Parent_Report**: A shareable plain-text summary of the student's learning statistics generated on demand from the Progress_Screen, formatted for pasting into messages or emails

## Requirements

### Requirement 1: Extract Question Data

**User Story:** As a developer, I want question data in a dedicated module, so that I can edit questions without navigating a 2300-line file.

#### Acceptance Criteria

1. THE Question_Data_Module SHALL export the QUESTIONS object containing one key per topic (linear, quadratic, expExpr, expEqn, inequality, simultaneous), where each topic contains metadata properties (name, short, color, bgColor, icon) and three difficulty arrays (easy, medium, hard), with each question object containing the fields: q (string), a (string), wrong (array of 3 strings), and hint (string)
2. THE Question_Data_Module SHALL be located at `src/data/questions.js`
3. THE Question_Data_Module SHALL provide QUESTIONS, TOPICS_ORDER, and PLAYABLE_TOPICS as named exports
4. WHEN the App_Shell imports QUESTIONS, TOPICS_ORDER, and PLAYABLE_TOPICS from the Question_Data_Module, THE App_Shell SHALL receive values that are strictly equal (===) in content and structure to the original inline definitions, verified by the application rendering and functioning without observable difference
5. IF the Question_Data_Module file is missing or contains a syntax error, THEN THE build tool SHALL report a module resolution or parse error at build time

### Requirement 2: Extract Game Constants

**User Story:** As a developer, I want game configuration values in a dedicated module, so that I can tune game balance in one place.

#### Acceptance Criteria

1. THE Constants_Module SHALL export named constants for each of the following categories: HP values (MAX_HP, DMG_BULLET, DMG_ALIEN, DMG_BOSS_BULLET, DMG_WRONG, HEALTH_RESTORE, HP_CORRECT_BONUS), wave settings (WAVES_BEFORE_BOSS, ALIENS_PER_WAVE), boss settings (BOSS_HP, ULTIMATE_BOSS_HP, BOSS_PHASE_HP, ULTIMATE_BOSS_PHASE_HP), power-up configuration (POWERUP_DROP_CHANCE, POWERUP_DURATIONS, BOSS_SHIELD_DURATION, POWERUP_INFO, POWERUP_TYPES), exam settings (EXAM_TIMER_SECONDS, EXAM_QUESTION_COUNT, EXAM_LIVES, EXAM_LOW_TIMER, EXAM_CRITICAL_TIMER), and canvas dimensions (W, H)
2. THE Constants_Module SHALL be located at `src/constants.js`
3. THE Constants_Module SHALL use ES module named exports for all constants and for the derived helper functions getMaxBossHp and getBossPhaseHp
4. WHEN any module imports a constant from the Constants_Module, THE Constants_Module SHALL provide a value equal in type and value to the original inline definition in App.jsx; IF the Constants_Module contains incorrect values, THEN the import SHALL still succeed and any mismatch SHALL surface as a runtime error rather than a build-time failure
5. WHEN getMaxBossHp is called with a topic string, THE Constants_Module SHALL return ULTIMATE_BOSS_HP if the topic is "ultimate", and BOSS_HP for any other topic string

### Requirement 3: Extract Audio System

**User Story:** As a developer, I want the sound system in a dedicated module, so that audio logic is isolated from game and UI logic.

#### Acceptance Criteria

1. THE Audio_Module SHALL export a playSound function that accepts a sound type parameter (one of: "shoot", "kill", "correct", "wrong", "hit", "levelUp", "boss", "powerup", "nuke", "heal", "tick", "tickHigh") and an enabled flag (boolean)
2. THE Audio_Module SHALL be located at `src/audio.js`
3. THE Audio_Module SHALL use the Web Audio API to generate sounds programmatically without requiring external audio files
4. WHEN the playSound function is called with a supported sound type and enabled set to true, THE Audio_Module SHALL produce audio output using the same oscillator frequencies, waveform types, durations, and gain values as the original inline implementation in App.jsx
5. IF the enabled flag is false, THEN THE Audio_Module SHALL not produce any audio output and shall return without creating an AudioContext
6. IF the Web Audio API is unavailable or sound generation throws an error, THEN THE Audio_Module SHALL silently suppress the error without propagating exceptions to the caller
7. WHEN the playSound function is called with a sound type not in the supported set, THE Audio_Module SHALL produce no audio output and shall not throw an error

### Requirement 4: Extract Game Engine

**User Story:** As a developer, I want the canvas game loop in a dedicated module, so that gameplay logic is separate from React UI rendering.

#### Acceptance Criteria

1. THE Game_Engine module SHALL export an `updateGame` function that encapsulates player movement, auto-firing, alien spawning, collision detection, bullet management, particle effects, power-up collection, damage number updates, and star scrolling
2. THE Game_Engine module SHALL export a `drawGame` function that encapsulates canvas rendering of the background, stars, particles, power-ups, aliens, boss, player bullets, enemy bullets, player ship, shield effect, HUD elements, and damage numbers
3. THE Game_Engine SHALL be located at `src/game/engine.js`
4. WHEN the App_Shell invokes `updateGame(gameState)` and `drawGame(ctx, gameState)` within a requestAnimationFrame loop, THE Game_Engine SHALL produce the same visual output and gameplay behavior as the original inline implementation (same entity positions, spawn rates, collision responses, and drawn elements per frame); this behavioral equivalence is only guaranteed when the functions are properly invoked within requestAnimationFrame and SHALL be required from the first working version with no allowance for temporary deviations
5. THE Game_Engine SHALL accept the mutable game state object (the `gameRef.current` structure) as its input parameter and communicate events back to the React layer by setting flags on that same state object (including `triggerQuestion`, `pendingHpChange`, and `killCount`)
6. THE Game_Engine module SHALL export all helper functions it depends on (`spawnParticles`, `damagePlayer`, `applyPowerup`, `playSound`) so that the App_Shell can also invoke them directly when handling question answers and boss transitions

### Requirement 5: Extract Screen Components

**User Story:** As a developer, I want each UI screen in its own file, so that I can work on one screen without scrolling through unrelated code.

#### Acceptance Criteria

1. THE App_Shell SHALL render exactly one Screen_Component at a time based on the current screen state value
2. WHEN the screen state is "menu", THE App_Shell SHALL render the MenuScreen component from `src/screens/MenuScreen.jsx`
3. WHEN the screen state is "topicSelect", THE App_Shell SHALL render the TopicSelectScreen component from `src/screens/TopicSelectScreen.jsx`
4. WHEN the screen state is "playing", THE App_Shell SHALL render the PlayingScreen component from `src/screens/PlayingScreen.jsx`
5. WHEN the screen state is "exam", THE App_Shell SHALL render the ExamScreen component from `src/screens/ExamScreen.jsx`
6. WHEN the screen state is "examResults", THE App_Shell SHALL render the ExamResultsScreen component from `src/screens/ExamResultsScreen.jsx`
7. WHEN the screen state is "victory", THE App_Shell SHALL render the VictoryScreen component from `src/screens/VictoryScreen.jsx`
8. WHEN the screen state is "gameOver", THE App_Shell SHALL render the GameOverScreen component from `src/screens/GameOverScreen.jsx`
9. IF the screen state does not match any defined screen value, THEN THE App_Shell SHALL render the MenuScreen component as a fallback

### Requirement 6: Extract Shared Components

**User Story:** As a developer, I want reusable UI components in a shared directory, so that they can be imported by any screen that needs them.

#### Acceptance Criteria

1. THE MathText Shared_Component SHALL be located at `src/components/MathText.jsx`
2. THE MathText Shared_Component SHALL accept a `children` prop containing string content and an optional `className` prop, and SHALL render a wrapping `<span>` element with the provided className applied
3. IF the `children` prop is null or undefined, THEN THE MathText Shared_Component SHALL render an empty `<span>` without error
4. THE MathText Shared_Component SHALL convert Unicode superscript characters (U+2070–U+207F, U+00B9, U+00B2, U+00B3, U+02E3) to their base equivalents wrapped in HTML `<sup>` elements, and Unicode subscript characters (U+2080–U+208E) to their base equivalents wrapped in HTML `<sub>` elements, while rendering all other characters as plain text
5. WHEN consecutive Unicode superscript or subscript characters appear in the input string, THE MathText Shared_Component SHALL group them into a single `<sup>` or `<sub>` element respectively, including any intermediate decimal point (`.`) or middle dot (`·`) that is followed by another character of the same type
6. WHEN any Screen_Component imports MathText from `src/components/MathText.jsx`, THE MathText Shared_Component SHALL produce the same DOM structure and visual output as the inline MathText function currently defined in `src/App.jsx`

### Requirement 7: Preserve Functional Equivalence

**User Story:** As a developer, I want the refactored application to behave identically to the original, so that no regressions are introduced.

#### Acceptance Criteria

1. WHEN the application is built with the Build_System, THE Build_System SHALL produce a successful production build with zero errors and zero warnings that were not present in the original build
2. THE App_Shell SHALL maintain all existing React state hooks (useState for screen, topic, questions, qIdx, score, hp, aliensKilled, waveNumber, bossActive, bossHp, showQuestion, feedback, paused, completed, soundOn, bestStreak, activePowerups, showDisclaimer, examTimer, examLives, examCorrect, examFeedback, examStartTs, examDuration) and mutable game state (useRef for gameRef, canvasRef, animRef, bossQuestionTimerRef) with the same initial values
3. THE App_Shell SHALL maintain all existing keyboard (keydown/keyup), mouse (mousemove/mousedown/mouseup), and touch (touchstart/touchmove/touchend) input handling with the same event-to-action mappings
4. WHEN a user plays any topic mission, THE application SHALL produce gameplay using the same constants as the original: MAX_HP=100, DMG_BULLET=12, DMG_ALIEN=22, DMG_BOSS_BULLET=18, DMG_WRONG=25, HEALTH_RESTORE=30, HP_CORRECT_BONUS=18, ALIENS_PER_WAVE=10, WAVES_BEFORE_BOSS=4, BOSS_HP=3, ULTIMATE_BOSS_HP=3, BOSS_PHASE_HP=20, ULTIMATE_BOSS_PHASE_HP=30, and POWERUP_DROP_CHANCE=0.18
5. WHEN a user uses the Exam Simulator, THE application SHALL produce quiz behavior using the same parameters as the original: EXAM_TIMER_SECONDS=25, EXAM_LIVES=3, EXAM_QUESTION_COUNT=10, scoring of 100 points plus up to (remaining_seconds × 8) time bonus per correct answer, and question selection of 4 medium and 6 hard questions drawn from all playable topics
6. THE application SHALL persist and load progress via the Storage_API using the same key ("matteo-progress") and the same JSON-serialized format representing the completed-topics map
7. WHEN a user plays any topic mission, THE application SHALL use the same wave progression structure as the original: 4 waves of 10 aliens each followed by a boss fight, with difficulty-tiered question selection (easy, medium, hard) matching the original distribution per topic; IF the wave structure encounters a failure during active gameplay, THEN the mission SHALL continue functioning rather than halting

### Requirement 8: Maintain Import Structure

**User Story:** As a developer, I want clean ES module imports between the new files, so that dependencies are explicit and the module graph is clear.

#### Acceptance Criteria

1. THE App_Shell SHALL use ES module import statements to consume all extracted modules; IF non-ES import syntax is used, THE Build_System SHALL still allow the build to succeed
2. THE application SHALL contain no circular import dependencies between modules
3. WHEN the Build_System processes the module graph, THE Build_System SHALL resolve all imports without errors
4. THE `src/main.jsx` entry point SHALL remain unchanged except if import paths require updating


### Requirement 9: Replace Polling State Bridge with Event Dispatch

**User Story:** As a developer, I want the game engine to notify React of state changes via synchronous callbacks, so that HP updates and game-over checks happen immediately when damage occurs rather than accumulating between 80ms poll intervals.

#### Acceptance Criteria

1. THE Game_Engine SHALL accept an Event_Dispatcher (a callback function or array of callback functions) as a parameter, which the App_Shell registers to receive state-change notifications
2. WHEN the Game_Engine processes a damage event (alien collision, enemy bullet hit, or boss bullet hit), THE Game_Engine SHALL invoke the Event_Dispatcher synchronously within the same game-loop frame, passing an event object that includes the event type and the damage amount
3. WHEN the Game_Engine detects a wave completion (killCount reaching ALIENS_PER_WAVE), THE Game_Engine SHALL invoke the Event_Dispatcher synchronously with a wave-complete event rather than relying on the App_Shell to poll the triggerQuestion flag
4. THE App_Shell SHALL remove the setInterval-based polling loop (previously running every 80ms) and instead process state changes exclusively through Event_Dispatcher callbacks
5. WHEN multiple damage events occur within a single game-loop frame, THE Event_Dispatcher SHALL deliver each event individually in the order they occurred, preventing accumulation of pendingHpChange between poll intervals
6. WHEN the Event_Dispatcher delivers a damage event that reduces HP to zero or below, THE App_Shell SHALL trigger the game-over transition immediately within that callback rather than deferring the check to a future poll cycle
7. THE State_Bridge replacement SHALL maintain the same observable gameplay behavior (same damage values, same game-over threshold, same wave progression) while eliminating timing-dependent bugs caused by the polling interval

### Requirement 10: Implement Seeded Random Answer Shuffling

**User Story:** As a player, I want answer choices to appear in a uniformly random order for each question, so that answer position is never predictable from the answer content.

#### Acceptance Criteria

1. WHEN a question is presented to the player, THE Answer_Shuffler SHALL arrange the four answer choices (one correct answer and three distractors) in a random order using a seeded pseudo-random number generator
2. THE Answer_Shuffler SHALL use the current question index (qIdx) as the seed value for the pseudo-random number generator, producing a deterministic but uniformly distributed permutation for each question position
3. THE Answer_Shuffler SHALL produce a uniform distribution across all 24 possible permutations of four answers, independent of the character content or character code sums of the answer strings
4. WHEN two different questions have answers with identical character code sums, THE Answer_Shuffler SHALL produce different orderings provided the questions appear at different qIdx positions
5. THE Answer_Shuffler SHALL replace the existing character-code-sum-based sorting logic with the seeded shuffle algorithm
6. THE Answer_Shuffler SHALL apply to both topic mission questions and exam simulator questions

### Requirement 11: Persist Disclaimer Dismissal State

**User Story:** As a returning parent, I want to skip the disclaimer after dismissing it once, so that I am not interrupted on every page load.

#### Acceptance Criteria

1. WHEN the user dismisses the Disclaimer_Screen, THE App_Shell SHALL persist the dismissal state via the Storage_API using a dedicated key ("disclaimer-dismissed") with a truthy value
2. WHEN the application loads, THE App_Shell SHALL check the Storage_API for the "disclaimer-dismissed" key before rendering the Disclaimer_Screen
3. IF the Storage_API contains a truthy value for "disclaimer-dismissed", THEN THE App_Shell SHALL skip the Disclaimer_Screen and proceed directly to the menu screen
4. IF the Storage_API does not contain the "disclaimer-dismissed" key or the value is falsy, THEN THE App_Shell SHALL display the Disclaimer_Screen as the first screen before the menu
5. IF the Storage_API read operation fails (throws an error), THEN THE App_Shell SHALL display the Disclaimer_Screen as a safe default without propagating the error

### Requirement 12: Canvas DPI Scaling for High-Resolution Displays

**User Story:** As a player on a high-DPI device, I want the game canvas to render at native resolution, so that gameplay visuals appear sharp rather than blurry.

#### Acceptance Criteria

1. WHEN the Canvas_Renderer initializes, THE Canvas_Renderer SHALL read the current `window.devicePixelRatio` value and scale the canvas backing store dimensions (width and height attributes) by that ratio
2. THE Canvas_Renderer SHALL set the canvas CSS dimensions to the logical size (W=400 CSS pixels wide, H=600 CSS pixels tall) while the canvas element attributes reflect the physical pixel dimensions (W × devicePixelRatio, H × devicePixelRatio)
3. WHEN the Canvas_Renderer obtains a 2D rendering context, THE Canvas_Renderer SHALL apply `ctx.scale(devicePixelRatio, devicePixelRatio)` so that all drawing operations use the same logical coordinate system (0–400 for x, 0–600 for y) regardless of the physical pixel density
4. THE Game_Engine SHALL continue to use W=400 and H=600 as the logical coordinate bounds for all position calculations, collision detection, and boundary checks without modification
5. WHEN devicePixelRatio is 1 (standard displays), THE Canvas_Renderer SHALL produce identical output to the current implementation with no additional scaling applied
6. IF devicePixelRatio changes during the session (e.g., window moved between displays), THEN THE Canvas_Renderer SHALL re-apply the scaling on the next animation frame to match the new ratio

### Requirement 13: Wave Difficulty Progression

**User Story:** As a player, I want each wave to feel noticeably harder than the previous one, so that the game builds tension and wave 4 feels distinctly more intense than wave 1.

#### Acceptance Criteria

1. WHEN wave 1 begins, THE Game_Engine SHALL configure Wave_Difficulty with an introductory spawn interval (no faster than 90 frames between alien spawns), alien movement speed no greater than 1.2 pixels per frame, and alien shooting intervals no shorter than 180 frames
2. WHEN wave 2 begins, THE Game_Engine SHALL configure Wave_Difficulty with a spawn interval between 60 and 80 frames, alien movement speed between 1.3 and 1.8 pixels per frame, and alien shooting intervals between 140 and 170 frames
3. WHEN wave 3 begins, THE Game_Engine SHALL configure Wave_Difficulty with a spawn interval between 40 and 60 frames, alien movement speed between 1.9 and 2.4 pixels per frame, and alien shooting intervals between 100 and 130 frames
4. WHEN wave 4 begins, THE Game_Engine SHALL configure Wave_Difficulty with an intense spawn interval no greater than 40 frames, alien movement speed no less than 2.5 pixels per frame, and alien shooting intervals no greater than 90 frames
5. THE Wave_Difficulty parameters SHALL produce a perceptible increase in challenge between each consecutive wave, such that a player can distinguish wave 4 gameplay from wave 1 gameplay without reading the wave counter

### Requirement 14: Rename Boss Shield Label to Avoid Confusion

**User Story:** As a player, I want the boss's HP bar label to be clearly distinct from my Shield power-up, so that I do not confuse the two during gameplay.

#### Acceptance Criteria

1. WHEN the boss fight begins, THE Boss_Armor_Bar SHALL display the label "ARMOR" above the boss's phase HP bar
2. THE Boss_Armor_Bar SHALL not use the word "SHIELD" in any label, tooltip, or HUD element associated with the boss's phase HP
3. WHEN the player has an active Shield power-up during a boss fight, THE Game_Engine SHALL display "SHIELD" only for the player's power-up indicator and "ARMOR" only for the boss's phase HP bar, ensuring no naming collision between the two elements

### Requirement 15: Exam Wrong Answer Visual Feedback

**User Story:** As a player in exam mode, I want wrong answers and timeouts to trigger screen shake and a red flash, so that the feedback feels as visceral as the shooter mode's wrong-answer response.

#### Acceptance Criteria

1. WHEN the player selects a wrong answer in the Exam Simulator, THE Exam_Feedback SHALL trigger a brief screen shake effect with the same intensity and duration as the shooter mode's wrong-answer screen shake
2. WHEN the player selects a wrong answer in the Exam Simulator, THE Exam_Feedback SHALL trigger a red flash overlay with the same color and fade duration as the shooter mode's wrong-answer flash
3. WHEN the exam question timer reaches zero without an answer, THE Exam_Feedback SHALL trigger the same screen shake and red flash effects as a wrong answer selection
4. THE Exam_Feedback effects SHALL not interfere with the exam UI layout or obscure the question text and answer buttons for more than 300 milliseconds

### Requirement 16: Generate Package Lock File

**User Story:** As a developer, I want a `package-lock.json` committed to the repository, so that all environments produce identical dependency trees on `npm install`.

#### Acceptance Criteria

1. THE Package_Lock file SHALL be present at the repository root as `package-lock.json`
2. THE Package_Lock file SHALL be committed to version control and not listed in `.gitignore`
3. WHEN a developer runs `npm install` on a fresh clone, THE Package_Lock SHALL ensure that the exact same versions of all direct and transitive dependencies are installed regardless of when the install occurs
4. IF the Package_Lock file is missing or deleted, THEN the repository README or contributing guide SHALL instruct developers to regenerate it by running `npm install` before committing

### Requirement 17: AudioContext Reuse

**User Story:** As a developer, I want the audio system to reuse a single AudioContext instance, so that the application does not exhaust browser AudioContext limits or trigger throttling on repeated sound playback.

#### Acceptance Criteria

1. THE Audio_Module SHALL maintain a single Shared_AudioContext instance that is reused across all playSound invocations for the lifetime of the page
2. THE Audio_Module SHALL create the Shared_AudioContext lazily on the first playSound call where enabled is true, rather than at module load time, to comply with browser autoplay policies that require a user gesture before AudioContext creation
3. WHEN the Shared_AudioContext is in a "suspended" state at the time playSound is called, THE Audio_Module SHALL call `resume()` on the Shared_AudioContext before scheduling audio nodes
4. THE Audio_Module SHALL not create a new AudioContext on subsequent playSound calls after the Shared_AudioContext has been initialized
5. IF the Shared_AudioContext creation fails (e.g., AudioContext constructor throws), THEN THE Audio_Module SHALL silently suppress the error and subsequent playSound calls SHALL attempt creation again until one succeeds

### Requirement 18: Reduced Motion Accessibility

**User Story:** As a player with motion sensitivity, I want cosmetic motion effects suppressed when my system requests reduced motion, so that I can play the game comfortably without screen shake, flashing, or rapid particle animations.

#### Acceptance Criteria

1. WHEN the user's operating system reports `prefers-reduced-motion: reduce`, THE application SHALL enter Reduced_Motion_Mode
2. WHILE in Reduced_Motion_Mode, THE Game_Engine SHALL suppress screen shake effects by treating all shake values as zero
3. WHILE in Reduced_Motion_Mode, THE Game_Engine SHALL suppress flash overlay effects by not rendering the colored flash overlay
4. WHILE in Reduced_Motion_Mode, THE Game_Engine SHALL suppress particle burst animations by not spawning new particles from explosions or power-up collections
5. WHILE in Reduced_Motion_Mode, THE application SHALL remain fully playable with all gameplay mechanics (shooting, collision detection, scoring, wave progression, boss fights, questions) functioning identically to normal mode
6. WHEN the user's `prefers-reduced-motion` preference changes during a session, THE application SHALL respond to the updated preference on the next animation frame without requiring a page reload

### Requirement 19: Score Persistence (High Scores)

**User Story:** As a player, I want my best score per topic saved and displayed, so that I can track my improvement and compete against my own records.

#### Acceptance Criteria

1. THE High_Score_Store SHALL persist the best score per topic via the Storage_API using a dedicated storage key
2. WHEN a topic mission is completed (victory screen reached), THE application SHALL compare the current session score to the stored best score for that topic
3. IF the current session score exceeds the stored best score for that topic, THEN THE application SHALL save the new score as the best score for that topic via the Storage_API
4. IF no best score exists for a topic (first completion), THEN THE application SHALL save the current session score as the best score for that topic
5. WHEN the TopicSelectScreen is rendered, THE application SHALL display the stored best score next to each topic sector that has a recorded high score
6. IF the Storage_API read operation fails when loading high scores, THEN THE application SHALL display no high scores without propagating the error or blocking topic selection
7. WHEN an exam is completed, THE application SHALL apply the same best-score comparison and persistence logic for the exam topic key

### Requirement 20: Pause on Visibility Change

**User Story:** As a player, I want the game to automatically pause when I switch tabs or minimize the browser, so that I do not take damage or miss gameplay while away.

#### Acceptance Criteria

1. WHEN the document visibility changes to "hidden" during active gameplay (screen state is "playing"), THE application SHALL automatically pause the game
2. WHEN the document visibility returns to "visible" after an automatic pause, THE application SHALL remain in the paused state with the pause overlay displayed, allowing the player to resume manually when ready
3. THE Visibility_Pause SHALL stop alien spawning, bullet movement, collision detection, and all game-loop updates while the document is hidden
4. THE Visibility_Pause SHALL not trigger during non-gameplay screens (menu, topic select, exam, victory, game over)
5. IF the game is already paused when the document becomes hidden, THEN THE Visibility_Pause SHALL not alter the existing pause state

### Requirement 21: Keyboard Answer Shortcuts

**User Story:** As a keyboard player, I want to press number keys 1–4 to select answers during question modals, so that I can respond quickly without switching to a pointer device.

#### Acceptance Criteria

1. WHEN a question modal is displayed during a topic mission, THE application SHALL accept key presses "1", "2", "3", and "4" as answer selections corresponding to the four answer options in the 2×2 grid layout (1=top-left, 2=top-right, 3=bottom-left, 4=bottom-right)
2. WHEN a question is displayed during the Exam Simulator, THE application SHALL accept the same key presses "1", "2", "3", and "4" with the same positional mapping
3. WHEN a valid number key is pressed, THE Keyboard_Shortcuts SHALL trigger the same answer-handling logic as clicking or tapping the corresponding answer button
4. IF feedback is currently being displayed (correct/wrong animation), THEN THE Keyboard_Shortcuts SHALL ignore number key presses until the next question is presented
5. THE Keyboard_Shortcuts SHALL not interfere with other keyboard controls (movement keys, pause key) when no question modal is active

### Requirement 22: PostCSS Config Verification

**User Story:** As a developer, I want the PostCSS configuration file present and correct, so that the Tailwind CSS and Autoprefixer build chain works reliably.

#### Acceptance Criteria

1. THE PostCSS_Config file SHALL exist at the repository root as `postcss.config.js`
2. THE PostCSS_Config file SHALL export a configuration object with a `plugins` property containing the `tailwindcss` plugin and the `autoprefixer` plugin
3. WHEN the Build_System processes CSS files, THE PostCSS_Config SHALL enable Tailwind CSS utility class generation and vendor prefix insertion via Autoprefixer
4. IF the PostCSS_Config file is missing or contains invalid configuration, THEN THE Build_System SHALL fail with a descriptive error indicating the missing or malformed PostCSS configuration

### Requirement 23: Student Progress Tracking

**User Story:** As a student, I want to see detailed statistics about my learning progress, so that I can identify my strengths, weaknesses, and improvement over time.

#### Acceptance Criteria

1. THE Progress_Tracker SHALL record the following per-session statistics after each mission or exam completion: questions attempted, questions answered correctly, questions answered incorrectly, time spent (in seconds), topic identifier, and difficulty tier breakdown (easy correct, medium correct, hard correct out of each attempted)
2. THE Progress_Tracker SHALL persist session records via the Storage_API using a dedicated storage key, maintaining a history of the last 50 sessions
3. THE Progress_Tracker SHALL compute and store the following aggregated metrics: overall accuracy percentage (total correct ÷ total attempted × 100), per-topic accuracy percentage, accuracy per difficulty tier (easy, medium, hard), current streak (consecutive correct answers in most recent session), and best streak across all sessions
4. WHEN the player navigates to the Progress_Screen from the main menu, THE Progress_Screen SHALL display: overall accuracy percentage, per-topic accuracy breakdown, strongest topic (highest accuracy), weakest topic (lowest accuracy), total questions solved across all sessions, and improvement trend (accuracy comparison between the oldest 5 and newest 5 sessions)
5. IF fewer than 2 sessions are recorded, THEN THE Progress_Screen SHALL display available statistics without showing trend data and SHALL indicate that more sessions are needed for trend analysis
6. IF the Storage_API read operation fails when loading progress data, THEN THE Progress_Screen SHALL display a user-friendly message indicating that progress data is unavailable without propagating the error
7. THE App_Shell SHALL add a "Progress" navigation option to the main menu that transitions to the Progress_Screen

### Requirement 24: Step-by-Step Solution Walkthrough

**User Story:** As a student, I want to see a multi-step breakdown of how to solve a problem after answering incorrectly, so that I can learn the method rather than just seeing the correct answer.

#### Acceptance Criteria

1. THE Question_Data_Module SHALL include a `steps` field (array of strings) on each question object in addition to the existing `hint` field, where each string represents one step in the solution process
2. WHEN the student answers a question incorrectly during a topic mission, THE Solution_Walkthrough SHALL expand the feedback panel to display the numbered steps sequentially (e.g., "Step 1: Subtract 5 from both sides → 2x = 8", "Step 2: Divide by 2 → x = 4")
3. WHEN the student answers a question incorrectly during the Exam Simulator, THE Solution_Walkthrough SHALL display the same numbered steps in the exam feedback area
4. THE Solution_Walkthrough SHALL display each step with a brief animation delay between steps to create a sequential reveal effect
5. WHEN the Solution_Walkthrough is displayed, THE application SHALL provide a dismiss button that allows the student to close the walkthrough and continue gameplay
6. THE Solution_Walkthrough SHALL not affect the student's score, HP, or any gameplay state — the walkthrough is purely educational
7. IF a question object does not contain a `steps` field or the `steps` array is empty, THEN THE Solution_Walkthrough SHALL fall back to displaying only the existing `hint` field

### Requirement 25: Mistake Journal and Review Mistakes Mode

**User Story:** As a student, I want to review the questions I previously answered incorrectly, so that I can practice my weak areas and track which mistakes I have resolved.

#### Acceptance Criteria

1. WHEN the student answers a question incorrectly (in any mode: mission, exam, or daily challenge), THE Mistake_Journal SHALL record the question object, the student's selected wrong answer, the correct answer, and the timestamp
2. THE Mistake_Journal SHALL persist all recorded mistakes via the Storage_API using a dedicated storage key
3. THE App_Shell SHALL add a "Review Mistakes" navigation option to the main menu that transitions to the Review_Mode screen
4. WHEN the student enters Review_Mode, THE application SHALL display mistake cards grouped by topic, showing: the question text, the student's wrong answer, the correct answer, and the step-by-step solution
5. THE Review_Mode screen SHALL display summary statistics: total mistakes recorded, unresolved count, and resolved count
6. WHEN the student attempts a previously-missed question in Review_Mode and answers correctly, THE Mistake_Journal SHALL mark that mistake entry as "resolved" while retaining it in the history
7. WHEN the student attempts a previously-missed question in Review_Mode and answers incorrectly again, THE Mistake_Journal SHALL keep the entry as "unresolved" and update the timestamp
8. THE Review_Mode SHALL present questions as interactive cards without shooter gameplay — the student taps an answer option directly on the card
9. IF the Storage_API read operation fails when loading mistake data, THEN THE Review_Mode screen SHALL display a user-friendly message indicating that mistake data is unavailable without propagating the error

### Requirement 26: Adaptive Difficulty

**User Story:** As a student, I want the game to adjust question difficulty based on my demonstrated ability per topic, so that I am appropriately challenged without being overwhelmed or bored.

#### Acceptance Criteria

1. THE Adaptive_Difficulty system SHALL track the student's consecutive correct answer count per topic and per difficulty tier, persisted via the Storage_API
2. WHEN the student answers 3 or more easy questions correctly in a row for a given topic, THE Adaptive_Difficulty system SHALL skip the easy tier and begin question selection at medium difficulty for that topic
3. WHEN the student answers 3 or more medium questions correctly in a row for a given topic, THE Adaptive_Difficulty system SHALL prioritize hard questions for that topic
4. WHEN the student answers 2 or more hard questions incorrectly in a row for a given topic, THE Adaptive_Difficulty system SHALL drop back to medium difficulty for that topic
5. THE Adaptive_Difficulty adaptation SHALL be computed per-topic independently, so that mastery in one topic does not affect difficulty selection in another topic
6. THE Adaptive_Difficulty state SHALL persist across sessions via the Storage_API, so that returning students resume at their demonstrated level
7. THE Adaptive_Difficulty system SHALL replace the fixed question distribution (2 easy, 3 medium, 2 hard per mission) with an adaptive selection that draws from the appropriate difficulty tier based on the student's current demonstrated level for that topic
8. WHEN a new topic is played for the first time (no adaptive data exists), THE Adaptive_Difficulty system SHALL use the original fixed distribution as the default starting point

### Requirement 27: Teach Me Button on Question Modals

**User Story:** As a student, I want to request the solution explanation before answering, so that I can learn the method for questions I do not know how to approach.

#### Acceptance Criteria

1. WHEN a question modal is displayed (during both topic missions and the Exam Simulator), THE application SHALL display a Teach_Me_Button alongside the answer options
2. WHEN the student taps the Teach_Me_Button, THE application SHALL reveal the step-by-step solution (using the same `steps` data as the Solution_Walkthrough) without requiring the student to submit an answer
3. WHEN the Teach_Me_Button is used, THE application SHALL not award score points for that question
4. WHEN the Teach_Me_Button is used, THE application SHALL not count the question as a correct answer for streak or progress tracking purposes
5. WHEN the Teach_Me_Button is used, THE application SHALL not penalize the student's HP
6. WHEN the student has viewed the solution via the Teach_Me_Button, THE application SHALL dismiss the question and continue to the next wave or question
7. THE Teach_Me_Button SHALL be styled with secondary visual treatment (smaller size, muted color) so that it does not visually compete with the primary answer buttons
8. THE Keyboard_Shortcuts SHALL not assign a number key to the Teach_Me_Button to prevent accidental activation — the button requires a deliberate tap or click

### Requirement 28: Topic Mastery Indicators

**User Story:** As a student, I want to see my mastery level for each topic on the topic selection screen, so that I can quickly identify which topics I have mastered and which need more practice.

#### Acceptance Criteria

1. WHEN the TopicSelectScreen is rendered, THE application SHALL display a Mastery_Indicator badge on each topic card based on the student's per-topic accuracy percentage
2. THE Mastery_Indicator SHALL compute mastery levels using the following thresholds: No mastery (below 40% accuracy or no data), Bronze (40–59% accuracy), Silver (60–79% accuracy), Gold (80–89% accuracy), Diamond (90–100% accuracy)
3. THE Mastery_Indicator SHALL compute accuracy from the student's per-topic data stored in the Progress_Tracker
4. THE Mastery_Indicator SHALL be displayed as a colored icon or border treatment on the topic card that is visually distinct per mastery level
5. WHEN the student's per-topic accuracy changes after completing a session, THE Mastery_Indicator SHALL reflect the updated mastery level on the next visit to the TopicSelectScreen — mastery can increase or decrease
6. IF no progress data exists for a topic, THEN THE Mastery_Indicator SHALL display the "No mastery" state

### Requirement 29: Daily Challenge and Streak System

**User Story:** As a student, I want a short daily quiz challenge with a streak tracker, so that I am motivated to practice consistently every day.

#### Acceptance Criteria

1. THE App_Shell SHALL add a "Daily Challenge" navigation option to the main menu that transitions to the Daily_Challenge screen
2. THE Daily_Challenge SHALL consist of 3 questions drawn from random topics at medium and hard difficulty
3. THE Daily_Challenge question selection SHALL be seeded by the current calendar date (YYYY-MM-DD), producing the same 3 questions for all attempts on the same day
4. WHEN the student completes the Daily_Challenge (answers all 3 questions), THE application SHALL award bonus XP as defined by the XP_System
5. THE Daily_Challenge SHALL use the same answer UI as the Exam Simulator (question card with answer buttons, no shooter gameplay)
6. THE application SHALL track the Daily_Streak — the count of consecutive calendar days the student has completed the Daily_Challenge, persisted via the Storage_API
7. WHEN the student completes the Daily_Challenge for the current day, THE application SHALL increment the Daily_Streak if the previous completion was yesterday, or set it to 1 if starting fresh
8. IF the student misses a calendar day without completing the Daily_Challenge, THEN THE Daily_Streak SHALL reset to zero on the next completion
9. THE Daily_Streak count SHALL be displayed on the main menu screen
10. IF the student has already completed the Daily_Challenge for the current day, THEN THE application SHALL display a "Completed" state on the Daily Challenge button and prevent re-entry

### Requirement 30: XP and Leveling System

**User Story:** As a student, I want to earn experience points and level up through gameplay, so that I have a long-term sense of progression and achievement beyond individual sessions.

#### Acceptance Criteria

1. THE XP_System SHALL award experience points for the following actions: correct answer in a topic mission (+20 XP), correct answer in the Exam Simulator (+25 XP), completing a topic mission (victory screen reached, +100 XP), completing the Daily_Challenge (+50 XP), and maintaining a Daily_Streak of 7 or more days (+30 bonus XP per Daily_Challenge completion)
2. THE XP_System SHALL accumulate XP across all sessions and persist the total via the Storage_API using a dedicated storage key
3. THE Level_System SHALL compute the student's level using the formula: Level = floor(totalXP / 200) + 1, capped at a maximum of level 50
4. WHEN the main menu screen is rendered, THE application SHALL display the current level and an XP progress bar showing progress toward the next level
5. WHEN the student's total XP crosses a level threshold (multiples of 200), THE application SHALL trigger a celebratory level-up animation and sound effect
6. THE XP_System SHALL not award XP for questions where the Teach_Me_Button was used
7. THE XP_System SHALL not award XP for questions attempted in Review_Mode
8. IF the Storage_API read operation fails when loading XP data, THEN THE application SHALL default to 0 XP (level 1) without propagating the error

### Requirement 31: Parent/Teacher Report Generation

**User Story:** As a parent or teacher, I want to generate a shareable text summary of the student's learning progress, so that I can review performance and identify areas needing support without navigating the app myself.

#### Acceptance Criteria

1. THE Progress_Screen SHALL display a "Generate Report" button
2. WHEN the "Generate Report" button is tapped, THE application SHALL generate a plain-text summary displayed in a modal overlay
3. THE Parent_Report modal SHALL include a "Copy to Clipboard" button that copies the full report text to the system clipboard
4. THE Parent_Report SHALL include the following information: student name (from a configurable setting stored via Storage_API, defaulting to "Matteo"), date range of sessions included, topics covered, per-topic accuracy percentage, total questions attempted and total correct, time spent across all sessions, strongest topic (highest accuracy), weakest topic (lowest accuracy), mastery levels per topic, current Daily_Streak, and areas needing improvement (topics below 60% accuracy)
5. THE Parent_Report SHALL format the content as plain text suitable for pasting into a message, email, or chat application
6. IF fewer than 2 sessions are recorded, THEN THE Parent_Report SHALL include available data and indicate that more sessions are needed for comprehensive analysis
7. IF the clipboard write operation fails, THEN THE application SHALL display a fallback message instructing the user to manually select and copy the text
