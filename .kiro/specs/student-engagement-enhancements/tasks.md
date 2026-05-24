# Implementation Plan: Student Engagement Enhancements

## Overview

This plan implements 13 engagement features for Algebra Assault across new utility modules (`src/utils/`), new screen components (`src/screens/`), new shared components (`src/components/`), and modifications to existing modules. Each task builds incrementally, with property-based tests validating correctness properties from the design document.

## Tasks

- [x] 1. Implement core utility modules (foundation layer)
  - [x] 1.1 Create `src/utils/questionGenerator.js` with `createRNG`, `solveLinearEquation`, `generateQuestion`, and `generateQuestionSet`
    - Implement seeded mulberry32 PRNG returning [0,1)
    - Implement linear equation solver that parses equation strings and returns solutions
    - Implement `generateQuestion` producing question objects with `q`, `a`, `wrong` (3 distractors), `hint`, `steps`, `conceptual` fields
    - Implement `generateQuestionSet` producing N unique questions using seed, with retry logic for duplicates
    - Coefficient/constant ranges per difficulty tier as defined in design (Easy: 1–5/1–20, Medium: 1–8/-15–30, Hard: 1–10/-20–40)
    - Distractor generation using sign error, operation error, coefficient error, and random offset strategies
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7_

  - [ ]* 1.2 Write property tests for question generator (Properties 1, 2, 3)
    - **Property 1: Question generation round-trip correctness** — For any generated question, parsing and solving the equation yields the stated correct answer
    - **Property 2: Generated question structural validity** — Output has exactly 1 correct answer, 3 distinct distractors, non-empty steps, valid conceptual key, coefficients within range
    - **Property 3: Question generation uniqueness** — For any seed/topic/difficulty, generating 200 questions produces 200 distinct equations
    - **Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 12.3**

  - [x] 1.3 Create `src/utils/streakSaver.js` with `updateStreakSaver`, `resetStreakSaver`, and `STREAK_THRESHOLD`
    - Implement state machine: track `consecutiveWrong`, activate at threshold of 3
    - Return `{ newState, shouldActivate }` from `updateStreakSaver`
    - Reset counter to 0 on activation regardless of chosen option
    - _Requirements: 3.1, 3.5, 3.6_

  - [ ]* 1.4 Write property tests for streak saver (Properties 7, 8)
    - **Property 7: Streak saver state machine** — Activates if and only if 3 consecutive incorrect answers since last reset; counter is zero after activation
    - **Property 8: Streak saver difficulty reduction** — When activated on medium/hard, easier version is exactly one tier lower
    - **Validates: Requirements 3.1, 3.3, 3.5**

  - [x] 1.5 Create `src/utils/encouragement.js` with message pool and selection functions
    - Implement `ENCOURAGEMENT_POOL` with at least 20 unique messages across categories (general, comeback, streak)
    - Implement `getEncouragementMessage(lastMessageId)` — random selection avoiding consecutive repeats
    - Implement `getComebackMessage()` — returns comeback-category message
    - Implement `getStreakCelebration(streakLength)` — returns streak celebration message
    - _Requirements: 4.1, 4.2, 4.3, 4.5_

  - [ ]* 1.6 Write property tests for encouragement system (Properties 9, 10)
    - **Property 9: Encouragement message selection** — Returns non-empty message from pool of ≥20; no two consecutive calls with same lastMessageId return same message
    - **Property 10: Comeback and streak celebration triggers** — Correct after wrong streak returns comeback message; streak ≥5 returns celebration
    - **Validates: Requirements 4.1, 4.2, 4.3, 4.5**

- [x] 2. Implement scheduling and goal utility modules
  - [x] 2.1 Create `src/utils/spacedRepetition.js` with interval progression and schedule management
    - Implement `INTERVALS` constant (stage1: 1 day, stage2: 3 days, stage3: 7 days in ms)
    - Implement `scheduleNewMistake(mistake)` — creates entry with stage1 interval
    - Implement `advanceInterval(entry)` — stage1→stage2→stage3→null (resolved)
    - Implement `resetInterval(entry)` — any stage back to stage1
    - Implement `getDueQuestions(schedule, now)` — filter entries where nextReview ≤ now
    - Implement `loadSchedule()` and `saveSchedule(schedule)` with `window.storage` and try/catch fallback
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_

  - [ ]* 2.2 Write property tests for spaced repetition (Properties 12, 13)
    - **Property 12: Spaced repetition interval progression** — scheduleNewMistake sets stage1; advance goes stage1→stage2→stage3→null; reset returns stage1
    - **Property 13: Due questions retrieval** — getDueQuestions returns exactly entries where nextReview ≤ now
    - **Validates: Requirements 7.1, 7.2, 7.3, 7.4**

  - [x] 2.3 Create `src/utils/weeklyGoals.js` with goal tracking and cosmetic rewards
    - Implement `COSMETIC_REWARDS` array with 12 distinct rewards (ship skins + trail colors)
    - Implement `getCurrentWeekStart()` — returns Monday midnight ISO date
    - Implement `checkWeekReset(state)` — clears progress if weekStart is in a previous week
    - Implement `updateGoalProgress(state, action, amount)` — increments objective counters
    - Implement `checkGoalCompletion(state)` — returns completed status, reward or bonus XP
    - Implement `loadWeeklyGoals()` with `window.storage` and try/catch fallback
    - _Requirements: 5.1, 5.2, 5.3, 5.5, 5.6_

  - [ ]* 2.4 Write property tests for weekly goals (Properties 15, 16)
    - **Property 15: Weekly goal reset on new week** — State with previous-week weekStart gets progress cleared and weekStart updated to current Monday
    - **Property 16: Weekly goal completion and reward** — All objectives met with <12 rewards unlocked returns completed:true with new reward; all 12 unlocked awards bonus XP
    - **Validates: Requirements 5.1, 5.3, 5.5**

  - [x] 2.5 Create `src/utils/friendChallenge.js` with encode/decode and validation
    - Implement `encodeChallenge(params)` — encodes topic (3-bit), difficulty (2-bit), seed (16-bit), score (12-bit) into base64url string ≤30 chars
    - Implement `decodeChallenge(code)` — decodes back to params, returns null for invalid codes
    - Implement `isValidChallengeCode(code)` — structural validation (URL-safe chars, correct length)
    - _Requirements: 6.1, 6.2, 6.5, 6.6_

  - [ ]* 2.6 Write property tests for friend challenge (Properties 4, 5, 6)
    - **Property 4: Challenge code encode/decode round-trip** — Encoding then decoding returns original params; encoded string is URL-safe and ≤30 chars
    - **Property 5: Challenge code deterministic question regeneration** — Decoding and regenerating questions from seed produces identical question set every time
    - **Property 6: Challenge code validation** — Random invalid strings decode to null; valid encoded strings decode to non-null
    - **Validates: Requirements 6.1, 6.2, 6.3, 6.5**

- [x] 3. Implement remaining utility modules
  - [x] 3.1 Create `src/utils/improvementToast.js` with accuracy and streak detection
    - Implement `checkImprovementToast(progressData, topic, currentAccuracy)` — returns show:true when rolling avg improves by ≥10 percentage points
    - Implement `checkStreakRecord(currentStreak, previousBest)` — returns show:true when current exceeds previous best
    - Skip toast if fewer than 10 questions answered for topic
    - _Requirements: 10.1, 10.2_

  - [ ]* 3.2 Write property tests for improvement detection (Property 17)
    - **Property 17: Improvement detection** — 10+ point accuracy improvement returns show:true; new best streak returns show:true
    - **Validates: Requirements 10.1, 10.2**

  - [x] 3.3 Create `src/utils/soundPreference.js` with load/save functions
    - Implement `loadSoundPreference()` — reads from `window.storage`, defaults to true if not found
    - Implement `saveSoundPreference(enabled)` — persists immediately via `window.storage`
    - Wrap in try/catch with fallback to enabled
    - _Requirements: 11.1, 11.2, 11.3_

  - [x] 3.4 Create `src/utils/conceptualExplanations.js` with technique mapping and explanations
    - Implement `TECHNIQUES` object covering: isolating-variables, expanding-brackets, cross-multiplication, factoring, completing-the-square
    - Implement `getConceptualExplanation(technique)` — returns explanation text or null
    - Implement `identifyTechnique(question)` — maps question to its primary technique key
    - _Requirements: 12.1, 12.2, 12.3, 12.4_

- [x] 4. Checkpoint - Core utilities complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Implement new screen components
  - [x] 5.1 Create `src/screens/PracticeModeScreen.jsx`
    - Topic selector (specific topic or "mixed") before starting
    - Single question display with 4 answer options (keyboard 1-4 and touch support)
    - Full step-by-step solution reveal on answer (correct or incorrect)
    - Conceptual explanation display on wrong answers (from `conceptualExplanations.js`)
    - Streak saver integration (activates after 3 wrong via `streakSaver.js`)
    - Encouragement messages on wrong answers (from `encouragement.js`)
    - XP award at 50% rate via existing XP system
    - No HP, no timer, no canvas, no wave mechanics
    - Exit button always visible, returns to menu
    - Responsive: single-column on mobile (<640px), 44px min tap targets
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 3.2, 3.3, 3.4, 3.6, 4.1, 12.1, 13.1, 13.2, 13.3, 13.4_

  - [ ]* 5.2 Write property test for Practice Mode answer effects (Property 11)
    - **Property 11: Practice mode answer effects** — Incorrect answers leave HP/score unchanged; correct answers award exactly 50% XP (rounded down); feedback always includes correctness + steps
    - **Validates: Requirements 1.2, 1.3, 1.6**

  - [x] 5.3 Create `src/screens/QuickFiveScreen.jsx`
    - 5 random questions from all topics (uses `questionGenerator.js`)
    - Progress indicator (1/5, 2/5, etc.)
    - No shooter gameplay, no timer
    - Summary screen at end: correct count, XP earned, accuracy percentage
    - Standard XP awards for correct answers
    - Keyboard (1-4) and touch input support
    - Responsive layout with 44px tap targets on mobile
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 13.1, 13.2, 13.3, 13.4_

  - [ ]* 5.4 Write property test for Quick Five summary (Property 18)
    - **Property 18: Quick Five session summary** — For any 5 answers, correct count equals number correct, accuracy = (correct/5)*100, XP = correctCount × standard rate
    - **Validates: Requirements 9.1, 9.3, 9.4**

  - [x] 5.5 Create `src/screens/FriendChallengeScreen.jsx`
    - Two sub-views: "Create Challenge" and "Enter Code"
    - Create flow: complete questions → generate code via `encodeChallenge` → display code with copy button
    - Enter flow: input field → validate via `isValidChallengeCode` → decode → play same questions → compare scores side by side
    - Error handling: show "Invalid code" message for invalid codes, allow retry
    - Keyboard and touch input support
    - Responsive layout
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 13.1, 13.2, 13.3, 13.4_

  - [x] 5.6 Create `src/screens/WeeklyGoalsScreen.jsx`
    - Progress bars for each objective (questions correct, sessions started, daily challenges)
    - Countdown timer to weekly reset (next Monday midnight)
    - Unlocked cosmetic rewards gallery
    - Current week's reward preview (next to unlock)
    - Responsive layout
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.6, 13.1, 13.4_

- [x] 6. Implement shared UI components
  - [x] 6.1 Create `src/components/SpacedRepetitionPrompt.jsx`
    - Modal/overlay shown on game load when reviews are due (from `getDueQuestions`)
    - "Review Now" and "Skip" options
    - Question display with answer feedback
    - Interval advancement on correct (`advanceInterval`) / reset on incorrect (`resetInterval`)
    - Persists updated schedule via `saveSchedule`
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

  - [x] 6.2 Create `src/components/ImprovementToast.jsx`
    - Fixed-position toast notification (non-blocking, pointer-events: none on container)
    - Auto-dismiss after 4 seconds via setTimeout (with cleanup on unmount)
    - Slide-in animation (respects `prefers-reduced-motion`)
    - Accepts `message` and `type` props
    - _Requirements: 10.1, 10.2, 10.3, 10.4_

  - [x] 6.3 Create `src/components/EncouragementBanner.jsx`
    - Inline message below answer feedback area
    - Displays motivational text from encouragement system
    - Supports general, comeback, and streak celebration variants
    - Non-intrusive: does not block proceeding to next question
    - _Requirements: 4.1, 4.3, 4.4, 4.5_

- [~] 7. Checkpoint - New screens and components complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Modify existing modules and wire everything together
  - [x] 8.1 Enhance `src/utils/dailyChallenge.js` to return 7 questions from 3+ topics with difficulty mix
    - Update `getDailyQuestions()` to return 7 questions (2 easy, 3 medium, 2 hard) from ≥3 topics
    - Maintain date-seeded deterministic selection
    - Fall back to `questionGenerator.js` if static bank is insufficient
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

  - [ ]* 8.2 Write property test for expanded daily challenge (Property 14)
    - **Property 14: Expanded daily challenge composition** — For any date string, returns exactly 7 questions from ≥3 topics with ≥2 easy, ≥3 medium, ≥2 hard; same date produces identical results
    - **Validates: Requirements 8.1, 8.2, 8.3**

  - [x] 8.3 Modify `src/audio.js` to integrate sound preference persistence
    - On module load, call `loadSoundPreference()` before creating AudioContext
    - Block all playback until preference is loaded
    - On toggle, call `saveSoundPreference(enabled)` immediately
    - _Requirements: 11.1, 11.2, 11.3_

  - [x] 8.4 Modify `src/App.jsx` to integrate all new features
    - Add screen routing for PracticeModeScreen, QuickFiveScreen, FriendChallengeScreen, WeeklyGoalsScreen
    - Add menu buttons for Practice Mode, Quick Five, Friend Challenge, Weekly Goals
    - Integrate streak saver state tracking across shooter and practice modes
    - Integrate improvement toast trigger logic (check after each answer)
    - Load sound preference on mount before any audio plays
    - Add weekly goals progress tracking (increment on correct answers, session starts, daily challenge completions)
    - Show SpacedRepetitionPrompt on load when reviews are due
    - Pass callbacks and state to new screen components
    - _Requirements: 1.1, 3.6, 5.4, 7.4, 9.1, 10.1, 10.4, 11.2_

- [ ] 9. Implement unit and integration tests
  - [ ]* 9.1 Write unit tests for new screen components
    - PracticeModeScreen: renders without canvas/HP/timer; topic selector works; exit returns to menu
    - QuickFiveScreen: renders 5 questions; shows summary at end
    - FriendChallengeScreen: code display/copy; score comparison layout; error on invalid code
    - WeeklyGoalsScreen: progress bars render; countdown displays
    - _Requirements: 1.1, 1.5, 6.4, 6.5, 5.4, 9.3_

  - [ ]* 9.2 Write unit tests for shared components
    - ImprovementToast: auto-dismisses after 4s; non-blocking positioning
    - EncouragementBanner: displays message text; supports variants
    - SpacedRepetitionPrompt: shows when reviews due; advances/resets intervals
    - _Requirements: 4.4, 7.4, 10.3, 10.4_

  - [ ]* 9.3 Write integration tests for cross-module interactions
    - Question generator + daily challenge: generated questions used when bank exhausted
    - Spaced repetition + mistake journal: mistakes flow into schedule correctly
    - Weekly goals + XP system: XP awarded on goal completion
    - Streak saver in both modes: triggers in shooter and practice mode
    - Sound preference + audio module: preference blocks audio until loaded
    - _Requirements: 2.7, 7.5, 5.3, 3.6, 11.2_

- [~] 10. Final checkpoint - All features integrated and tested
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document (18 properties total)
- Unit tests validate specific examples and edge cases
- All new modules use `window.storage` with try/catch fallback for resilience
- All new screens support keyboard (1-4) and touch input with responsive layouts
- The implementation language is JavaScript (ES modules) with JSX for React components

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.3", "1.5", "2.5", "3.1", "3.3", "3.4"] },
    { "id": 1, "tasks": ["1.2", "1.4", "1.6", "2.1", "2.3", "2.6", "3.2"] },
    { "id": 2, "tasks": ["2.2", "2.4", "5.1", "5.3", "5.5", "5.6", "6.1", "6.2", "6.3"] },
    { "id": 3, "tasks": ["5.2", "5.4", "8.1"] },
    { "id": 4, "tasks": ["8.2", "8.3", "8.4"] },
    { "id": 5, "tasks": ["9.1", "9.2", "9.3"] }
  ]
}
```
