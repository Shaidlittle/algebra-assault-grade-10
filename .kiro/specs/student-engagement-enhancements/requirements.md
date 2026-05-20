# Requirements Document

## Introduction

This specification defines the requirements for enhancing student engagement in Algebra Assault, an educational math game for Grade 10 students. The enhancements target students who struggle with algebra, have difficulty focusing, and lack motivation. The changes introduce a pressure-free practice mode, procedurally generated questions, a streak-saver mechanic, an encouragement system, weekly goals with cosmetic rewards, a friend-challenge mode, spaced repetition for mistakes, and an expanded daily challenge — all within the existing client-side-only architecture (React 18, Vite 5, Tailwind CSS 3, plain JavaScript, localStorage via `window.storage`).

## Glossary

- **Practice_Mode**: A gameplay mode that presents algebra questions without the space-shooter canvas, timer pressure, or HP loss — allowing students to work at their own pace
- **Question_Generator**: A procedural generation module that creates linear equation questions algorithmically, producing unique coefficient/constant combinations to expand the question pool beyond the static bank
- **Streak_Saver**: A mechanic that detects three consecutive wrong answers and intervenes by offering an easier version of the question or displaying a conceptual explanation
- **Encouragement_System**: A module that displays motivational messages and positive reinforcement when a student answers incorrectly, replacing punitive-only feedback
- **Weekly_Goal**: A time-bounded objective (resetting each Monday) that tracks cumulative student actions (questions answered, sessions completed) and awards cosmetic rewards upon completion
- **Cosmetic_Reward**: A visual customization (ship skin or trail color) unlocked by completing Weekly_Goals, stored via Storage_API
- **Friend_Challenge**: A mode where a student generates a shareable challenge code encoding a set of questions, and another student can enter that code to attempt the same questions and compare scores
- **Challenge_Code**: A deterministic, URL-safe string that encodes topic, difficulty, question seed, and challenger score — enabling offline score comparison without a backend
- **Spaced_Repetition_Scheduler**: A module that resurfaces questions from the Mistake_Journal at increasing intervals (1 day, 3 days, 7 days) to reinforce retention
- **Expanded_Daily_Challenge**: An enhanced version of the existing Daily_Challenge that presents 7 questions (up from 3) with a mix of topics and difficulties
- **Quick_Five**: A shortcut mode that presents 5 random questions from any topic without shooter gameplay, accessible from the main menu
- **Improvement_Toast**: A non-blocking notification that appears when the system detects measurable improvement in a student's accuracy or streak
- **Sound_Preference**: The user's mute/unmute audio setting, persisted across sessions via Storage_API
- **Storage_API**: The `window.storage` abstraction used for persisting all game data to localStorage
- **XP_System**: The existing experience points system that awards XP for correct answers, completions, and streaks
- **Mistake_Journal**: The existing persistent record of incorrectly answered questions
- **Adaptive_Difficulty**: The existing algorithm that adjusts question difficulty tier based on per-topic accuracy streaks

## Requirements

### Requirement 1: Practice Mode

**User Story:** As a struggling student, I want to practice algebra questions without shooter gameplay pressure, so that I can focus purely on learning without anxiety.

#### Acceptance Criteria

1. WHEN the student selects Practice Mode from the main menu, THE Practice_Mode SHALL display algebra questions one at a time without the canvas shooter, HP bar, timer, or wave mechanics
2. WHEN the student answers a question in Practice Mode, THE Practice_Mode SHALL display whether the answer is correct or incorrect along with the full step-by-step solution
3. WHEN the student answers incorrectly in Practice Mode, THE Practice_Mode SHALL NOT deduct HP or penalize the student in any way
4. THE Practice_Mode SHALL allow the student to select a specific topic or choose mixed topics before starting
5. THE Practice_Mode SHALL allow the student to exit at any time and return to the main menu
6. WHEN the student completes a question in Practice Mode, THE XP_System SHALL award XP at a reduced rate (50% of normal) to acknowledge effort without incentivizing avoidance of the main game mode
7. THE Practice_Mode SHALL render responsively on mobile phones, tablets, and desktop screens using touch or keyboard input

### Requirement 2: Procedural Question Generation

**User Story:** As a student, I want a large variety of questions so that I do not encounter repeated questions within a single session.

#### Acceptance Criteria

1. THE Question_Generator SHALL produce linear equation questions by randomly selecting integer coefficients and constants within defined ranges per difficulty tier
2. THE Question_Generator SHALL generate a minimum of 200 unique questions per topic per difficulty tier without repeating the same equation within a session
3. WHEN generating a question, THE Question_Generator SHALL produce exactly one correct answer and three plausible distractor answers derived from common algebraic mistakes
4. WHEN generating a question, THE Question_Generator SHALL produce step-by-step solution text explaining how to solve the equation
5. THE Question_Generator SHALL produce questions that have integer or simple fractional solutions (no irrational or complex answers)
6. FOR ALL generated questions, parsing the equation string and solving it SHALL yield the stated correct answer (round-trip correctness property)
7. THE Question_Generator SHALL integrate with the existing question selection flow so that generated questions are used when the static bank for a topic is exhausted or as a supplement

### Requirement 3: Streak Saver Mechanic

**User Story:** As a student who is struggling, I want the game to help me when I get stuck rather than letting me fail repeatedly, so that I stay motivated and learn from my mistakes.

#### Acceptance Criteria

1. WHEN the student answers three consecutive questions incorrectly within a single session, THE Streak_Saver SHALL activate and present an intervention
2. WHEN the Streak_Saver activates, THE Streak_Saver SHALL offer the student a choice between receiving an easier version of the current question or viewing a conceptual explanation of the technique required
3. WHEN the student chooses the easier version, THE Streak_Saver SHALL present a question of the same type at a lower difficulty tier
4. WHEN the student chooses the explanation, THE Streak_Saver SHALL display a brief conceptual explanation of why the algebraic technique works, not just the procedural steps
5. WHEN the Streak_Saver activates after three consecutive wrong answers, THE Streak_Saver SHALL reset the consecutive-wrong counter to zero regardless of which option the student selects; the counter SHALL NOT reset for wrong answers that have not yet reached the three-wrong threshold
6. THE Streak_Saver SHALL operate in both the shooter game mode and Practice Mode

### Requirement 4: Encouragement System

**User Story:** As a student who lacks confidence in math, I want to receive positive reinforcement when I make mistakes, so that I feel supported rather than punished.

#### Acceptance Criteria

1. WHEN the student answers a question incorrectly, THE Encouragement_System SHALL display a motivational message alongside the correct answer feedback
2. THE Encouragement_System SHALL maintain a pool of at least 20 unique motivational messages and select one at random without repeating the same message consecutively
3. WHEN the student answers correctly after a streak of wrong answers, THE Encouragement_System SHALL display a "comeback" message acknowledging the recovery
4. THE Encouragement_System SHALL display messages in a non-intrusive manner that does not block the student from proceeding to the next question
5. WHEN the student achieves a correct-answer streak of 5 or more, THE Encouragement_System SHALL display a streak celebration message

### Requirement 5: Weekly Goals with Cosmetic Rewards

**User Story:** As a student, I want to work toward weekly goals and earn visual rewards, so that I have a reason to come back and practice regularly.

#### Acceptance Criteria

1. WHEN the Weekly_Goal resets every Monday at midnight (local time), THE Weekly_Goal SHALL clear all progress counters to zero and present the student with a new set of objectives
2. THE Weekly_Goal SHALL define objectives based on cumulative actions: questions answered correctly, total sessions started, and daily challenges completed within the week
3. WHEN the student completes all objectives for the week, THE Weekly_Goal SHALL unlock a Cosmetic_Reward (ship skin or trail color) and persist the unlock via Storage_API
4. THE Weekly_Goal SHALL display progress toward each objective on the main menu or a dedicated goals screen
5. WHEN the student has already earned all available Cosmetic_Rewards, THE Weekly_Goal SHALL continue tracking objectives and award bonus XP instead
6. THE Weekly_Goal SHALL define at least 12 distinct Cosmetic_Rewards to sustain engagement across 12 weeks of play

### Requirement 6: Friend Challenge Mode

**User Story:** As a student, I want to challenge my friends to beat my score on a specific set of questions, so that I have a social and competitive reason to practice.

#### Acceptance Criteria

1. WHEN the student completes a set of questions, THE Friend_Challenge SHALL generate a Challenge_Code that encodes the topic, difficulty, question seed, and the challenger's score
2. THE Challenge_Code SHALL be a URL-safe string of 30 characters or fewer that can be shared via text message, chat, or written down
3. WHEN a student enters a valid Challenge_Code, THE Friend_Challenge SHALL present the exact same questions (same order, same options) that the challenger received
4. WHEN the challenged student completes the questions, THE Friend_Challenge SHALL display both scores side by side for comparison
5. IF an invalid or corrupted Challenge_Code is entered, THEN THE Friend_Challenge SHALL display a clear error message and allow the student to re-enter the code; WHEN a valid Challenge_Code is successfully entered, THE Friend_Challenge SHALL NOT display any error message
6. THE Friend_Challenge SHALL operate entirely client-side without requiring network connectivity or a backend server

### Requirement 7: Spaced Repetition for Mistakes

**User Story:** As a student, I want the game to resurface questions I previously got wrong at spaced intervals, so that I can build long-term retention of difficult concepts.

#### Acceptance Criteria

1. WHEN the student answers a question incorrectly, THE Spaced_Repetition_Scheduler SHALL record the question with a next-review timestamp set to 1 day from the current time
2. WHEN the student correctly answers a spaced-repetition question on review, THE Spaced_Repetition_Scheduler SHALL advance the next-review interval to the next stage (1 day → 3 days → 7 days → resolved)
3. WHEN the student incorrectly answers a spaced-repetition question on review, THE Spaced_Repetition_Scheduler SHALL reset the interval back to 1 day
4. WHEN the student opens the game and spaced-repetition questions are due for review, THE Spaced_Repetition_Scheduler SHALL prompt the student to review them before starting a new session
5. THE Spaced_Repetition_Scheduler SHALL integrate with the existing Mistake_Journal data, using recorded mistakes as the source of questions to schedule
6. THE Spaced_Repetition_Scheduler SHALL persist all scheduling state via Storage_API

### Requirement 8: Expanded Daily Challenge

**User Story:** As a student, I want a longer daily challenge that takes more than 90 seconds, so that I can build a meaningful daily practice habit.

#### Acceptance Criteria

1. THE Expanded_Daily_Challenge SHALL present 7 questions per day (increased from 3), drawn from at least 3 different topics
2. THE Expanded_Daily_Challenge SHALL include a mix of difficulty tiers: at least 2 easy, 3 medium, and 2 hard questions
3. THE Expanded_Daily_Challenge SHALL maintain the existing date-seeded deterministic selection so that all students receive the same daily challenge on the same day
4. WHEN the student completes all 7 questions of the Expanded_Daily_Challenge, THE Daily_Streak SHALL update and THE XP_System SHALL award XP proportional to the number of correct answers; IF the student exits before completing all questions, THEN THE Daily_Streak SHALL NOT update
5. THE Expanded_Daily_Challenge SHALL display a progress indicator showing how many questions remain

### Requirement 9: Quick Five Mode

**User Story:** As a student with limited time, I want a quick 5-question session without shooter gameplay, so that I can practice in short bursts.

#### Acceptance Criteria

1. WHEN the student selects Quick Five from the main menu, THE Quick_Five SHALL present 5 randomly selected questions from across all topics without shooter gameplay
2. THE Quick_Five SHALL complete in under 3 minutes for an average student
3. WHEN the student completes all 5 questions, THE Quick_Five SHALL display a summary showing correct count, XP earned, and accuracy percentage
4. THE Quick_Five SHALL award standard XP for each correct answer
5. THE Quick_Five SHALL render responsively on mobile phones, tablets, and desktop screens

### Requirement 10: Improvement Toast Notifications

**User Story:** As a student, I want to be notified when I am improving, so that I feel a sense of progress even when I am not yet achieving high scores.

#### Acceptance Criteria

1. WHEN the student's accuracy on a topic improves by 10 percentage points or more compared to their previous 10-question rolling average, THE Improvement_Toast SHALL display a congratulatory notification
2. WHEN the student achieves a new personal best streak on any topic, THE Improvement_Toast SHALL display a notification acknowledging the achievement
3. THE Improvement_Toast SHALL appear as a non-blocking overlay that auto-dismisses after 4 seconds
4. THE Improvement_Toast SHALL not interrupt active gameplay on the canvas or block question answering

### Requirement 11: Persist Sound Preference

**User Story:** As a student, I want my sound on/off preference to be remembered between sessions, so that I do not have to toggle it every time I open the game.

#### Acceptance Criteria

1. WHEN the student toggles the sound setting, THE Sound_Preference SHALL persist the mute/unmute state via Storage_API immediately
2. WHEN the game loads, THE Sound_Preference SHALL block all audio playback until the previously saved audio state is restored, even if restoration delays game startup
3. IF no saved Sound_Preference exists, THEN THE Sound_Preference SHALL default to sound enabled

### Requirement 12: Conceptual Explanations

**User Story:** As a struggling student, I want to understand why an algebraic technique works (not just the steps), so that I can build genuine understanding and apply the technique to new problems.

#### Acceptance Criteria

1. WHEN the student views a solution after answering incorrectly, THE Encouragement_System SHALL display a brief "Why this works" explanation below the procedural steps; IF the conceptual explanation is unavailable, THE system SHALL still allow solution viewing without the conceptual section
2. THE conceptual explanation SHALL describe the underlying mathematical principle (e.g., "We subtract from both sides to keep the equation balanced — like removing the same weight from both sides of a scale")
3. THE Question_Generator SHALL include a conceptual explanation field for each generated question, mapped to the algebraic technique used
4. THE conceptual explanations SHALL cover at least the following techniques: isolating variables, expanding brackets, cross-multiplication, factoring, and completing the square

### Requirement 13: Cross-Platform Responsiveness

**User Story:** As a student, I want the game to work smoothly on my phone, tablet, and computer, so that I can practice anywhere.

#### Acceptance Criteria

1. THE Practice_Mode, Quick_Five, Friend_Challenge, and Expanded_Daily_Challenge SHALL render correctly on viewports from 320px to 1920px wide
2. THE new UI screens SHALL support touch input on mobile and tablet devices without requiring a mouse or keyboard
3. THE new UI screens SHALL support keyboard navigation and answer selection via number keys (1-4) on desktop
4. WHILE the device viewport is narrower than 640px, THE new UI screens SHALL use a single-column layout with touch-friendly button sizes (minimum 44px tap target)
