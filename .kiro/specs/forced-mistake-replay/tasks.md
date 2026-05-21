# Implementation Plan: Forced Mistake Replay

## Overview

This plan implements a spaced repetition gate that intercepts the mission start flow when a student has 2+ unresolved mistakes. It adds a pure-logic module (`replayGate.js`), a new screen component (`ReplayGateScreen.jsx`), and integrates both into the existing `useGameState` hook and `App.jsx` routing. Property-based tests validate correctness properties using fast-check.

## Tasks

- [x] 1. Create the replay gate pure-logic module
  - [x] 1.1 Implement `src/utils/replayGate.js` with `evaluateGate`, `buildReplayQueue`, and `isExcludedTopic` functions
    - `isExcludedTopic(topic)` returns `true` for `'exam'` and `'ultimate'`, `false` otherwise
    - `evaluateGate(mistakes, topic)` filters to unresolved entries, checks count >= 2, calls `buildReplayQueue` if threshold met; returns `{ shouldActivate, queue }`
    - `buildReplayQueue(unresolvedMistakes)` sorts by `timestamp` ascending, returns first `Math.min(3, length)` entries (minimum 2 required by caller)
    - Skip entries with missing or invalid `question.wrong` field during queue building
    - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 7.1, 7.2_

  - [ ]* 1.2 Write property test: Gate activation threshold
    - **Property 1: Gate activation threshold**
    - For any array of mistake entries, `evaluateGate` returns `shouldActivate === true` iff unresolved count >= 2
    - **Validates: Requirements 1.1, 1.2, 1.3**

  - [ ]* 1.3 Write property test: Queue length invariant
    - **Property 2: Queue length invariant**
    - For any array of unresolved entries with length >= 2, `buildReplayQueue` returns queue with length `min(3, unresolvedCount)`
    - **Validates: Requirements 2.1**

  - [ ]* 1.4 Write property test: Oldest-first selection
    - **Property 3: Oldest-first selection**
    - For any array of unresolved entries with length > 3, every entry in the queue has a timestamp <= every entry not in the queue
    - **Validates: Requirements 2.2**

  - [ ]* 1.5 Write property test: Excluded topics always bypass gate
    - **Property 4: Excluded topics always bypass gate**
    - For any mistake array, when topic is `'exam'` or `'ultimate'`, `evaluateGate` returns `shouldActivate === false`
    - **Validates: Requirements 7.1, 7.2**

  - [ ]* 1.6 Write unit tests for `replayGate.js`
    - Test `evaluateGate` returns `shouldActivate: false` with 0 and 1 unresolved mistakes
    - Test `evaluateGate` returns `shouldActivate: true` with exactly 2 unresolved
    - Test `buildReplayQueue` returns 2 items when given exactly 2 unresolved
    - Test `buildReplayQueue` returns 3 items when given 5 unresolved
    - Test `isExcludedTopic` for 'exam', 'ultimate', and regular topics
    - Test entries with missing `wrong` field are skipped
    - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 7.1, 7.2_

- [x] 2. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 3. Create the ReplayGateScreen component
  - [x] 3.1 Implement `src/screens/ReplayGateScreen.jsx`
    - Accept props: `queue`, `onComplete`, `soundOn`
    - Manage internal state: `currentIndex`, `activeQueue` (mutable copy), `feedback`, `resolvedTimestamps`
    - Display questions one at a time in multiple-choice format matching `PlayingScreen` style
    - Use `shuffleAnswers` from `src/utils/shuffleAnswers.js` for option ordering
    - Show progress indicator "Question X of Y" where Y is total unique questions remaining
    - Show encouraging header "Quick Review"
    - On correct answer: green feedback, mark resolved, advance after 1200ms
    - On wrong answer: show correct answer + solution steps, re-append question to end of `activeQueue`, advance after 2000ms
    - When all unique questions answered correctly: call `onComplete(resolvedTimestamps)` after 1500ms transition delay
    - Handle edge case: if queue is empty, call `onComplete` immediately
    - Handle missing `steps` field gracefully (show correct answer only)
    - Use Tailwind CSS for styling consistent with existing screens
    - _Requirements: 2.3, 3.1, 3.2, 3.3, 4.1, 4.2, 4.3, 5.1, 5.2, 5.3, 5.4, 6.1_

  - [ ]* 3.2 Write property test: Re-queue guarantees all-correct termination
    - **Property 5: Re-queue guarantees all-correct termination**
    - For any initial queue and answer sequence, the session terminates only when every unique question has been answered correctly at least once
    - **Validates: Requirements 5.3, 5.4**

  - [ ]* 3.3 Write property test: Completion resolves exactly the queued items
    - **Property 6: Completion resolves exactly the queued items**
    - When the session completes, the set of resolved items equals exactly the set of unique `{topic, timestamp}` pairs from the original queue
    - **Validates: Requirements 4.2**

  - [ ]* 3.4 Write unit tests for ReplayGateScreen
    - Test renders progress indicator "Question 1 of 3"
    - Test renders "Quick Review" header
    - Test shows correct answer on wrong selection
    - Test shows solution steps on wrong selection
    - Test calls `onComplete` after all questions answered correctly
    - Test calls `onComplete` immediately when queue is empty
    - _Requirements: 3.1, 3.2, 3.3, 4.3, 5.1, 5.2_

- [x] 4. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Integrate replay gate into game state and routing
  - [x] 5.1 Modify `src/hooks/useGameState.js` to add replay gate interception
    - Add `pendingTopic` and `replayQueue` state variables
    - Modify `startMission` to check `isExcludedTopic` first, then call `loadMistakes` + `evaluateGate`
    - If gate activates: store pending topic, set replay queue, transition to `'replayGate'` screen
    - If gate does not activate: proceed with existing mission start logic
    - Add `handleReplayComplete` callback that persists resolved statuses (fire-and-forget on failure), reloads mistakes, then starts the pending mission
    - Export new state and handlers: `pendingTopic`, `replayQueue`, `handleReplayComplete`
    - _Requirements: 1.1, 1.2, 1.3, 4.2, 4.3, 6.2, 6.3, 7.1, 7.2_

  - [x] 5.2 Modify `src/App.jsx` to route the `'replayGate'` screen
    - Import `ReplayGateScreen` component
    - Add screen routing case for `screen === 'replayGate'` rendering `ReplayGateScreen` with `queue={replayQueue}`, `onComplete={handleReplayComplete}`, `soundOn={soundOn}`
    - Destructure new exports from `useGameState` (`replayQueue`, `handleReplayComplete`)
    - _Requirements: 3.1, 4.3, 6.1_

  - [ ]* 5.3 Write integration tests for the full replay gate flow
    - Test: startMission with >= 2 unresolved mistakes activates gate and shows replayGate screen
    - Test: startMission with < 2 unresolved mistakes proceeds directly to mission
    - Test: replay completion persists resolved status and starts the pending mission
    - Test: mission proceeds when `markResolved` throws (persistence failure)
    - _Requirements: 1.2, 1.3, 4.3, 6.2, 6.3_

- [x] 6. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document using fast-check
- Unit tests validate specific examples and edge cases
- The replay gate logic is a pure module (`replayGate.js`) testable without React
- All UI styling uses Tailwind CSS consistent with existing screens
- Storage failures are non-blocking per requirement 6.3

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2", "1.3", "1.4", "1.5", "1.6"] },
    { "id": 2, "tasks": ["3.1"] },
    { "id": 3, "tasks": ["3.2", "3.3", "3.4"] },
    { "id": 4, "tasks": ["5.1"] },
    { "id": 5, "tasks": ["5.2", "5.3"] }
  ]
}
```
