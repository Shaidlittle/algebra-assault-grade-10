# Requirements Document

## Introduction

Forced Mistake Replay is a spaced repetition gate that requires students to correctly answer previously missed questions before starting a new topic mission. This ensures students actively learn from their errors rather than ignoring them, reinforcing correct understanding through mandatory review integrated into the natural game flow.

## Glossary

- **Replay_Gate**: The decision logic that checks whether a student has unresolved mistakes and blocks mission start until replay is completed
- **Mistake_Journal**: The existing persistence layer (`src/utils/mistakeJournal.js`) that stores mistake entries with topic, question, selectedAnswer, correctAnswer, timestamp, and resolved flag
- **Replay_Screen**: The UI screen presented to the student showing unresolved mistake questions in the same multiple-choice format as in-game questions
- **Unresolved_Mistake**: A mistake entry in the Mistake_Journal where the `resolved` flag is `false`
- **Replay_Queue**: The ordered list of 2-3 unresolved mistake questions selected for the current replay session
- **Mission_Start_Flow**: The sequence of actions triggered when a student taps "Start Mission" on the TopicSelectScreen

## Requirements

### Requirement 1: Replay Gate Activation

**User Story:** As a student, I want the game to check my unresolved mistakes before a mission starts, so that I am reminded to learn from my errors before tackling new content.

#### Acceptance Criteria

1. WHEN a student initiates the Mission_Start_Flow for any topic, THE Replay_Gate SHALL retrieve all Unresolved_Mistake entries from the Mistake_Journal
2. WHEN the Replay_Gate finds 2 or more Unresolved_Mistake entries, THE Replay_Gate SHALL intercept the Mission_Start_Flow and present the Replay_Screen
3. WHEN the Replay_Gate finds fewer than 2 Unresolved_Mistake entries, THE Mission_Start_Flow SHALL proceed directly to the mission without showing the Replay_Screen

### Requirement 2: Replay Question Selection

**User Story:** As a student, I want to review a small manageable set of my past mistakes, so that the replay feels focused and not overwhelming.

#### Acceptance Criteria

1. WHEN the Replay_Gate activates, THE Replay_Gate SHALL select between 2 and 3 Unresolved_Mistake entries for the Replay_Queue
2. WHEN more than 3 Unresolved_Mistake entries exist, THE Replay_Gate SHALL prioritize older mistakes by selecting those with the earliest timestamps
3. THE Replay_Queue SHALL present each question in the same multiple-choice format used during gameplay, with the correct answer and the same wrong answer options from the original question object

### Requirement 3: Replay Screen Presentation

**User Story:** As a student, I want the mistake replay to feel like part of the game, so that it does not feel like a punishment or separate chore.

#### Acceptance Criteria

1. THE Replay_Screen SHALL use the same visual styling, layout, and answer button format as the in-game question overlay
2. THE Replay_Screen SHALL display a progress indicator showing how many replay questions remain (e.g., "Question 1 of 3")
3. THE Replay_Screen SHALL display an encouraging header message (e.g., "Quick Review") to frame the replay positively

### Requirement 4: Correct Answer Handling During Replay

**User Story:** As a student, I want to progress through the replay when I answer correctly, so that I can get to my mission quickly.

#### Acceptance Criteria

1. WHEN a student selects the correct answer for a Replay_Queue question, THE Replay_Screen SHALL display positive feedback matching the in-game correct answer style
2. WHEN a student answers all Replay_Queue questions correctly, THE Replay_Screen SHALL mark each completed question as resolved in the Mistake_Journal
3. WHEN all Replay_Queue questions are answered correctly, THE Mission_Start_Flow SHALL proceed to start the originally selected mission

### Requirement 5: Incorrect Answer Handling During Replay

**User Story:** As a student, I want to see the correct answer and explanation when I get a replay question wrong, so that I can learn from the mistake before trying again.

#### Acceptance Criteria

1. WHEN a student selects an incorrect answer for a Replay_Queue question, THE Replay_Screen SHALL display the correct answer
2. WHEN a student selects an incorrect answer for a Replay_Queue question, THE Replay_Screen SHALL display the solution steps from the original question object
3. WHEN a student selects an incorrect answer for a Replay_Queue question, THE Replay_Screen SHALL re-queue that question to be asked again later in the same session
4. WHILE a re-queued question remains unanswered correctly, THE Replay_Screen SHALL continue presenting the Replay_Queue until all questions are answered correctly

### Requirement 6: Replay Completion and Mission Transition

**User Story:** As a student, I want a smooth transition from the replay into my mission, so that the experience feels seamless.

#### Acceptance Criteria

1. WHEN all Replay_Queue questions are answered correctly, THE Replay_Screen SHALL transition to the mission within 1500 milliseconds
2. WHEN the replay completes, THE Mistake_Journal SHALL persist the resolved status for each completed replay question before the mission begins
3. IF the Mistake_Journal fails to persist resolved status, THEN THE Mission_Start_Flow SHALL proceed to the mission regardless of persistence failure

### Requirement 7: Exam and Ultimate Challenge Exclusion

**User Story:** As a student, I want the replay gate to only apply to regular topic missions, so that exam simulations and ultimate challenges remain accessible without interruption.

#### Acceptance Criteria

1. WHEN a student initiates the Mission_Start_Flow for the Exam Simulator, THE Replay_Gate SHALL not activate
2. WHEN a student initiates the Mission_Start_Flow for the Ultimate Challenge, THE Replay_Gate SHALL not activate
