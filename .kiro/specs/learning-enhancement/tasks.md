# Implementation Plan: Learning Enhancement

## Overview

This plan implements three learning enhancements for Algebra Assault: Micro-lessons (Reminder Cards) shown before topic missions, Progressive Hints offered in stages on wrong answers with HP/point costs, and "Explain Your Answer" follow-up prompts after correct answers. The implementation follows the existing modular architecture with new data modules, React components, and hook logic extensions.

## Tasks

- [x] 1. Create Reminder Card data module and component
  - [x] 1.1 Create `src/data/reminderCards.js` data module
    - Export a `REMINDER_CARDS` object mapping each of the six topic identifiers (`linear`, `quadratic`, `expExpr`, `expEqn`, `inequality`, `simultaneous`) to a Topic_Rule string of ≤15 words
    - Include the exact rules specified: "Whatever you do to one side, do to the other" for linear, "Standard form → Factor → Zero product" for quadratic, "Multiply or divide by negative → FLIP the sign" for inequality
    - Define appropriate ≤15-word rules for expExpr, expEqn, and simultaneous
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

  - [ ]* 1.2 Write property tests for Reminder Card data (Properties 1 & 2)
    - **Property 1: Reminder card rules satisfy word count constraint**
    - **Property 2: Reminder card displays only for playable topic missions**
    - Create `src/data/reminderCards.test.js` using fast-check
    - Verify all rule strings split to ≤15 words
    - Verify display logic returns true only for the six playable topics
    - **Validates: Requirements 1.2, 1.4, 2.1, 2.5**

  - [x] 1.3 Create `src/components/ReminderCard.jsx` component
    - Accept props: `topic`, `topicName`, `rule`, `onDismiss`
    - Render full-screen overlay with topic name, rule text, countdown (whole seconds), and "Got it" button
    - Implement 15-second auto-dismiss via `setTimeout`/`setInterval`
    - Clean up timers on unmount (back navigation support)
    - Use Tailwind CSS for styling consistent with existing game UI
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.6, 2.8_

  - [ ]* 1.4 Write unit tests for ReminderCard component
    - Create `src/components/ReminderCard.test.jsx`
    - Test that component renders topic name, rule text, and countdown
    - Test "Got it" button calls onDismiss
    - Test auto-dismiss after 15 seconds using fake timers
    - Test timer cleanup on unmount
    - **Validates: Requirements 2.2, 2.3, 2.4, 2.8**

- [x] 2. Integrate Reminder Card into game flow
  - [x] 2.1 Add reminder card state and logic to `src/hooks/useGameState.js`
    - Add `showReminderCard` (boolean) and `reminderTopic` (string|null) state variables
    - Add `handleReminderDismiss()` handler that sets `showReminderCard` to false and starts the mission
    - When a topic mission is selected from TopicSelectScreen, set `showReminderCard` to true and `reminderTopic` to the selected topic
    - Ensure the game loop does NOT start while `showReminderCard` is true
    - Do NOT show reminder card for Ultimate Challenge, Exam Simulator, or Daily Challenge modes
    - _Requirements: 2.1, 2.5, 2.6, 2.7, 2.8_

  - [x] 2.2 Render ReminderCard overlay in PlayingScreen
    - Import ReminderCard component and REMINDER_CARDS data
    - Conditionally render ReminderCard when `showReminderCard` is true
    - Pass topic identifier, display name, rule text from REMINDER_CARDS, and onDismiss handler
    - Ensure no alien spawning or gameplay timers start until card is dismissed
    - _Requirements: 2.1, 2.4, 2.6_

- [x] 3. Checkpoint - Reminder Card feature complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Create Progressive Hints data and resolution logic
  - [x] 4.1 Extend question data structure with `hints` arrays
    - Add `hints` arrays to question objects in `src/data/questions.js` for each question
    - Each hints array: index 0 = conceptual nudge (≤60 chars, no specific numbers), index 1 = specific operation (≤80 chars), index 2 = full solution steps array
    - _Requirements: 3.1, 3.3, 3.4, 3.5_

  - [x] 4.2 Create hint resolution utility in `src/data/hintResolver.js`
    - Export a `resolveHints(question)` function that returns a normalized 3-level hints structure
    - If question has a `hints` array with 3 valid entries, return it directly
    - If question has `hint` string and `steps` array but no `hints` array, generate: index 0 as a conceptual nudge (≤60 chars), index 1 as the existing `hint` value, index 2 as the existing `steps` array
    - If question has neither, return null (ineligible for intermediate hints)
    - Handle malformed hints arrays (fewer than 3 entries, null entries) by returning only the full solution
    - _Requirements: 3.2, 3.6, 6.5_

  - [ ]* 4.3 Write property tests for hint data and resolution (Properties 3, 4, 7)
    - **Property 3: Hints array entries satisfy type and length constraints**
    - **Property 4: Hints fallback resolution produces valid 3-level structure**
    - **Property 7: Malformed hints gracefully degrade to full solution only**
    - Create `src/data/hintResolver.test.js` using fast-check
    - Generate question objects with various hint configurations and verify constraints
    - **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 6.5**

- [x] 5. Implement Progressive Hint interaction and cost logic
  - [x] 5.1 Create hint cost utility in `src/data/hintCosts.js`
    - Export a `getHintCost(gameMode, hintStage)` function returning the cost amount and unit
    - PlayingScreen/DailyChallengeScreen: 5 HP (stage 0), 5 HP (stage 1), 10 HP (stage 2)
    - ExamScreen: 25 pts (stage 0), 25 pts (stage 1), 50 pts (stage 2)
    - ReplayGateScreen: 0 (all stages)
    - Export a `formatHintButtonLabel(gameMode, hintStage)` function returning button text like "Get Hint (-5 HP)"
    - _Requirements: 5.1, 5.2, 5.3, 5.5, 5.6, 6.1, 6.2, 6.3, 6.4_

  - [ ]* 5.2 Write property tests for hint cost logic (Properties 5 & 6)
    - **Property 5: Hint stage progression is accumulative and ordered**
    - **Property 6: Hint cost deduction matches mode-specific cost table**
    - Add tests to `src/data/hintResolver.test.js` or create `src/data/hintCosts.test.js` using fast-check
    - Generate (gameMode, hintStage, currentResource) tuples and verify correct deduction
    - Verify stage transitions preserve previously revealed hints
    - **Validates: Requirements 4.2, 4.3, 4.4, 4.5, 5.1, 5.2, 5.3, 5.5, 6.1, 6.2, 6.3, 6.4**

  - [x] 5.3 Add progressive hint state and handlers to `src/hooks/useGameState.js`
    - Add `hintStage` state (0=none revealed, 1=conceptual, 2=specific, 3=full)
    - Add `handleRequestHint(gameMode)` handler that: advances hintStage, deducts HP/points via hintCosts utility, handles HP=0 → game-over after 2s delay, handles score floor at 0 for HP modes
    - Reset hintStage to 0 when moving to next question
    - Hide "Teach Me" button when progressive hint flow is active
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 5.1, 5.2, 5.3, 5.4, 5.7_

  - [x] 5.4 Enhance FeedbackPanel with progressive hint UI
    - Modify the existing feedback panel in PlayingScreen, ExamScreen, DailyChallengeScreen, and ReplayGateScreen
    - On wrong answer: show "Get Hint" button (with cost label) and "Continue" button
    - Stage 1: reveal conceptual hint, show "Next Hint" button and "Continue"
    - Stage 2: reveal specific hint below conceptual (both visible), show "Show Solution" button and "Continue"
    - Stage 3: reveal full worked solution below all hints, show "Continue" only
    - Continue at any stage dismisses feedback and resumes gameplay
    - Keep correct answer text and diagnostic message visible alongside hints
    - Hide "Teach Me" button when hint flow is active
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 5.6, 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7_

- [x] 6. Checkpoint - Progressive Hints feature complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Create Explain Your Answer data and trigger logic
  - [x] 7.1 Add `explain` objects to question data in `src/data/questions.js`
    - Add optional `explain` objects to questions: `prompt` (≤80 chars), `options` (array of 3 strings each ≤60 chars), `correctIndex` (0, 1, or 2)
    - Prompts use forms like "Which step did you do first?" or "What was the first thing you did?"
    - Options use plain language describing algebraic operations (no math notation)
    - Correct option matches the first entry of the question's `steps` array
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

  - [x] 7.2 Create explain trigger utility in `src/data/explainTrigger.js`
    - Export a `shouldTriggerExplain({ gameMode, cooldownCount, randomValue, hasExplainData })` function
    - Returns true only if: gameMode is NOT 'replayGate' AND hasExplainData is true AND cooldownCount ≥ 3 AND randomValue < 0.3
    - Export constants: `TRIGGER_RATE = 0.3`, `COOLDOWN_THRESHOLD = 3`, `BONUS_POINTS = 50`, `TIMEOUT_MS = 15000`, `DISMISS_DELAY_MS = 2000`
    - _Requirements: 8.1, 8.2, 8.4, 10.4_

  - [ ]* 7.3 Write property tests for explain data and trigger logic (Properties 8 & 9)
    - **Property 8: Explain prompt data satisfies structural constraints**
    - **Property 9: Explain trigger logic respects mode, cooldown, and probability**
    - Create `src/data/explainTrigger.test.js` using fast-check
    - Generate explain objects and verify structural constraints
    - Generate trigger condition tuples and verify boolean logic
    - **Validates: Requirements 7.1, 8.1, 8.2, 8.4, 10.1, 10.2, 10.3, 10.4**

- [x] 8. Implement Explain Your Answer component and game integration
  - [x] 8.1 Create `src/components/ExplainPrompt.jsx` component
    - Accept props: `prompt`, `options`, `correctIndex`, `onComplete`
    - Render prompt text and 3 multiple-choice option buttons
    - On correct selection: show confirmation message, call onComplete with `{ correct: true, bonusPoints: 50 }`
    - On incorrect selection: highlight correct option, show "The first step was: [correct option text]", call onComplete with `{ correct: false, bonusPoints: 0 }`
    - Disable all buttons after selection, auto-dismiss after 2 seconds
    - Auto-dismiss after 15 seconds of inactivity with no points awarded
    - Clean up timers on unmount
    - Use Tailwind CSS styling consistent with game UI
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6_

  - [ ]* 8.2 Write unit tests for ExplainPrompt component
    - Create `src/components/ExplainPrompt.test.jsx`
    - Test renders 3 option buttons
    - Test correct selection shows confirmation and awards 50 points
    - Test incorrect selection highlights correct option
    - Test buttons disabled after selection
    - Test auto-dismiss after 15s timeout
    - Test timer cleanup on unmount
    - **Validates: Requirements 9.1, 9.2, 9.3, 9.5, 9.6**

  - [ ]* 8.3 Write property test for explain response scoring (Property 10)
    - **Property 10: Explain response scoring awards exactly +50 or +0 with no penalties**
    - Add to `src/data/explainTrigger.test.js` or `src/components/ExplainPrompt.test.jsx`
    - Generate (score, hp, isCorrect) tuples and verify scoring logic
    - **Validates: Requirements 9.2, 9.4**

  - [x] 8.4 Add explain prompt state and handlers to `src/hooks/useGameState.js`
    - Add `explainPromptData` (object|null), `explainCooldown` (number), `explainPaused` (boolean) state
    - After correct answer: check `shouldTriggerExplain()` with current cooldown and random value
    - If triggered: set `explainPromptData`, pause game loop/timers, set `explainPaused` to true
    - Add `handleExplainResponse(correct)` handler: award 50 bonus points if correct, reset explainPromptData, resume gameplay, increment cooldown counter
    - Reset cooldown counter to 0 on new mission/session start
    - _Requirements: 8.1, 8.2, 8.3, 8.5, 9.2, 9.4, 10.1, 10.2, 10.3_

  - [x] 8.5 Integrate ExplainPrompt into PlayingScreen, ExamScreen, and DailyChallengeScreen
    - Import ExplainPrompt component
    - Conditionally render when `explainPromptData` is not null
    - In PlayingScreen: pause game loop (no alien spawning, no bullet movement, no damage) while prompt is displayed
    - In ExamScreen: pause exam countdown timer while prompt is displayed
    - In DailyChallengeScreen: pause automatic question-advance timer while prompt is displayed
    - Do NOT render ExplainPrompt in ReplayGateScreen
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7_

- [x] 9. Final checkpoint - All learning enhancements complete
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties using fast-check (already installed)
- Unit tests validate specific examples and edge cases
- The project uses plain JSX (no TypeScript), Vitest for testing, and Tailwind CSS for styling
- All new data modules follow the existing pattern in `src/data/`
- All new components follow the existing pattern in `src/components/`

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "4.2", "5.1", "7.2"] },
    { "id": 1, "tasks": ["1.2", "1.3", "4.1", "4.3", "5.2", "7.1", "7.3"] },
    { "id": 2, "tasks": ["1.4", "2.1", "5.3", "8.1"] },
    { "id": 3, "tasks": ["2.2", "5.4", "8.2", "8.3", "8.4"] },
    { "id": 4, "tasks": ["8.5"] }
  ]
}
```
