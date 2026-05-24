# Requirements Document

## Introduction

Algebra Assault currently provides error diagnostic feedback and solution steps when students answer incorrectly, but lacks proactive teaching moments that reinforce algebraic rules before and after answering. This feature adds three learning enhancements to improve student understanding and math marks:

1. **Micro-lessons (Reminder Cards)** — A brief 15-second reminder card shown before each topic mission displaying the key algebraic rule for that topic, matching the existing Field Manual structure.
2. **Progressive Hints** — Instead of immediately revealing the full solution on a wrong answer, hints are offered in stages (conceptual nudge → specific guidance → full worked solution), with each hint costing HP or points to incentivize independent problem-solving.
3. **"Explain Your Answer" Mode** — After answering correctly, the system occasionally presents a follow-up multiple-choice question asking the student to identify which step they performed first, catching students who guess correctly without understanding the method.

These enhancements apply across all game screens where questions appear (PlayingScreen, ExamScreen, DailyChallengeScreen, ReplayGateScreen) and integrate with the existing HP system, scoring, and wave-based progression.

## Glossary

- **Reminder_Card**: A brief overlay displayed before a topic mission begins, showing the key algebraic rule for the selected topic
- **Hint_Stage**: One of three progressive levels of assistance offered when a student answers incorrectly (conceptual, specific, or full solution)
- **Hint_Cost**: The HP or point penalty deducted from the student when they request a hint at any stage
- **Explain_Prompt**: A follow-up multiple-choice question presented after a correct answer, asking the student to identify the first step of their solution method
- **Explain_Options**: The set of 3 multiple-choice answers presented in an Explain_Prompt, where exactly one is correct
- **Trigger_Rate**: The probability (between 0 and 1) that an Explain_Prompt appears after a correct answer
- **Topic_Rule**: A short sentence summarizing the key algebraic principle for a given topic (e.g., "Whatever you do to one side, do to the other")
- **Feedback_Panel**: The UI component that displays correct/wrong feedback after a student answers a question
- **Question_Screen**: Any screen where algebra questions are presented to the student (PlayingScreen, ExamScreen, DailyChallengeScreen, ReplayGateScreen)
- **Field_Manual**: The existing in-game reference structure for algebraic rules and methods

## Requirements

### Requirement 1: Reminder Card Data Definition

**User Story:** As a developer, I want a centralized data structure mapping each topic to its key algebraic rule, so that reminder cards display consistent and accurate content.

#### Acceptance Criteria

1. THE Reminder_Card data module SHALL define a Topic_Rule entry for each of the six playable algebra topics, keyed by the same topic identifiers used in the question data module: Linear Equations, Quadratic Equations, Exponential Expressions, Exponential Equations, Inequalities, and Simultaneous Equations
2. THE Reminder_Card data module SHALL store each Topic_Rule as a string of no more than 15 words that summarizes the single most important algebraic principle for that topic
3. THE Reminder_Card data module SHALL include the following Topic_Rules: "Whatever you do to one side, do to the other" for Linear Equations, "Standard form → Factor → Zero product" for Quadratic Equations, and "Multiply or divide by negative → FLIP the sign" for Inequalities
4. THE Reminder_Card data module SHALL define Topic_Rules for Exponential Expressions, Exponential Equations, and Simultaneous Equations that each contain no more than 15 words and describe a single algebraic operation or sequence of operations for that topic
5. THE Reminder_Card data module SHALL export a single object that maps each topic identifier to its corresponding Topic_Rule string, enabling lookup by topic identifier in constant time

### Requirement 2: Reminder Card Display Before Topic Missions

**User Story:** As a student, I want to see a brief reminder of the key algebraic rule before starting a topic mission, so that I have the relevant method fresh in my mind.

#### Acceptance Criteria

1. WHEN a student selects a topic mission from the TopicSelectScreen, THE system SHALL display a Reminder_Card overlay showing the Topic_Rule for the selected topic before the mission gameplay begins
2. WHEN the Reminder_Card has been displayed for 15 seconds, THE system SHALL automatically dismiss the card and begin the mission within 500 milliseconds
3. THE Reminder_Card SHALL include a dismiss button labelled "Got it" that allows the student to close the card and begin the mission before the 15-second timer expires
4. THE Reminder_Card SHALL display the topic name, the Topic_Rule text, and a numeric countdown indicator showing remaining whole seconds of display time
5. THE Reminder_Card SHALL NOT appear before the Ultimate Challenge, Exam Simulator, or Daily Challenge game modes
6. WHILE the Reminder_Card is displayed, THE system SHALL NOT start the game loop, spawn aliens, or begin any gameplay timers
7. WHEN a student selects a topic mission they have previously played, THE system SHALL still display the Reminder_Card before the mission begins
8. IF the student navigates back to the TopicSelectScreen while the Reminder_Card is displayed, THEN THE system SHALL dismiss the Reminder_Card, cancel the countdown timer, and return to the TopicSelectScreen without starting the mission

### Requirement 3: Progressive Hint Data Structure

**User Story:** As a developer, I want each question to have three levels of hints defined, so that the progressive hint system can offer staged assistance.

#### Acceptance Criteria

1. THE question data structure SHALL support a `hints` array containing exactly 3 entries for each question, ordered as: conceptual hint (index 0) stored as a string, specific hint (index 1) stored as a string, and full worked solution (index 2) stored as an array of step strings matching the format of the existing `steps` property
2. WHEN a question has an existing `hint` property (single string) and `steps` array but no `hints` array, THE system SHALL generate the conceptual hint (index 0) as a new question or nudge pointing toward the correct operation without revealing specific numbers, treat the existing `hint` property value as the specific hint (index 1), and use the existing `steps` array as the full worked solution (index 2)
3. THE conceptual hint (index 0) SHALL be a question or nudge of no more than 60 characters that points the student toward the correct operation without revealing the specific numbers or values from the equation (e.g., "What operation undoes multiplication?")
4. THE specific hint (index 1) SHALL name the exact operation and values to apply in the next step in no more than 80 characters (e.g., "Divide both sides by 3")
5. THE full worked solution (index 2) SHALL contain all solution steps as an array of strings, matching the existing step-by-step format already used in the Feedback_Panel
6. IF a question lacks both a `hint` property and a `hints` array, THEN THE system SHALL treat that question as having insufficient hint data, making it ineligible for intermediate hint stages as defined in Requirement 6 criterion 5

### Requirement 4: Progressive Hint Interaction Flow

**User Story:** As a student, I want to receive hints in stages when I answer incorrectly, so that I can try to solve the problem with minimal help before seeing the full solution.

#### Acceptance Criteria

1. WHEN a student selects a wrong answer, THE Feedback_Panel SHALL display a "Get Hint" button and a "Continue" button, without revealing any solution steps or hint content
2. WHEN the student presses "Get Hint" for the first time on a question, THE Feedback_Panel SHALL reveal the conceptual hint (index 0) and display a "Next Hint" button and a "Continue" button for further assistance
3. WHEN the student presses "Next Hint" after viewing the conceptual hint, THE Feedback_Panel SHALL reveal the specific hint (index 1) below the conceptual hint (index 0) so that all previously revealed hints remain visible, and SHALL display a "Show Solution" button and a "Continue" button
4. WHEN the student presses "Show Solution" after viewing the specific hint, THE Feedback_Panel SHALL reveal the full worked solution (index 2) matching the existing step-by-step display format, with all previously revealed hints remaining visible above the solution, and SHALL display a "Continue" button
5. WHEN the student presses "Continue" at any hint stage (including before any hint is revealed), THE Feedback_Panel SHALL dismiss the feedback overlay and resume gameplay progression without revealing further hints
6. WHILE the progressive hint flow is active, THE Feedback_Panel SHALL continue to display the correct answer text and the diagnostic message (from the error-diagnosis-feedback feature) alongside the current hint stage
7. WHILE the progressive hint flow is active, THE Feedback_Panel SHALL hide the existing "Teach Me" button, as the progressive hint flow replaces direct solution display on wrong answers

### Requirement 5: Hint Cost Mechanism

**User Story:** As a student, I want each hint to cost HP or points, so that I am incentivized to attempt the problem independently before requesting help.

#### Acceptance Criteria

1. WHEN the student requests the conceptual hint (index 0), THE system SHALL deduct 5 HP from the student's current HP total
2. WHEN the student requests the specific hint (index 1), THE system SHALL deduct 5 HP from the student's current HP total
3. WHEN the student requests the full worked solution (index 2), THE system SHALL deduct 10 HP from the student's current HP total
4. IF the student's HP would drop to 0 or below as a result of a hint cost deduction, THEN THE system SHALL set HP to 0, display the requested hint in full, and trigger the game-over sequence after a 2-second delay following the hint display
5. WHILE in ExamScreen mode, THE system SHALL deduct points instead of HP: 25 points for the conceptual hint, 25 points for the specific hint, and 50 points for the full solution, with the score floor set to 0 (score SHALL NOT drop below 0)
6. THE Feedback_Panel SHALL display the cost of the next unrevealed hint on the hint request button, showing the unit as "HP" in PlayingScreen and DailyChallengeScreen modes (e.g., "Get Hint (-5 HP)") and as "pts" in ExamScreen mode (e.g., "Get Hint (-25 pts)")
7. IF the student is in ExamScreen mode and their current score is 0, THEN THE system SHALL still allow hint requests and keep the score at 0 after the deduction

### Requirement 6: Progressive Hints in All Game Contexts

**User Story:** As a student, I want progressive hints to work in all game modes, so that I always have the option to learn incrementally.

#### Acceptance Criteria

1. WHEN a student selects a wrong answer in the PlayingScreen, THE Feedback_Panel SHALL offer the progressive hint flow with HP-based costs (5 HP for conceptual hint, 5 HP for specific hint, 10 HP for full solution)
2. WHEN a student selects a wrong answer in the ExamScreen, THE Feedback_Panel SHALL offer the progressive hint flow with point-based costs (25 points for conceptual hint, 25 points for specific hint, 50 points for full solution)
3. WHEN a student selects a wrong answer in the DailyChallengeScreen, THE Feedback_Panel SHALL offer the progressive hint flow with HP-based costs (5 HP for conceptual hint, 5 HP for specific hint, 10 HP for full solution)
4. WHEN a student selects a wrong answer in the ReplayGateScreen, THE Feedback_Panel SHALL offer the progressive hint flow without any HP or point cost, and hint request buttons SHALL display no cost indicator
5. IF a question's hints array contains fewer than 3 entries or any entry is null or empty, THEN THE Feedback_Panel SHALL skip the intermediate hint stages and display only the full worked solution (index 2) directly, or the existing step-by-step solution if no hints array is present
6. IF the student's current HP is 0 when a wrong answer is selected in PlayingScreen or DailyChallengeScreen, THEN THE Feedback_Panel SHALL still offer the progressive hint flow but SHALL trigger the game-over sequence immediately after the hint is displayed
7. IF the student's current point total is 0 or below when a wrong answer is selected in ExamScreen, THEN THE Feedback_Panel SHALL still offer the progressive hint flow and allow the point total to become negative

### Requirement 7: Explain Your Answer Prompt Data

**User Story:** As a developer, I want explain-your-answer prompts defined for questions, so that the system can test student understanding after correct answers.

#### Acceptance Criteria

1. THE question data structure SHALL support an optional `explain` object containing a `prompt` string of no more than 80 characters (the follow-up question text), an `options` array of exactly 3 strings each no more than 60 characters (the multiple-choice answers), and a `correctIndex` number (0, 1, or 2) identifying the correct option
2. WHEN an `explain` object is defined for a question, THE `prompt` property SHALL ask the student to identify the first step of the solution method using one of the following forms: "Which step did you do first?", "What was the first thing you did?", or "What operation did you start with?"
3. THE `options` array SHALL contain one correct description that matches the operation described in the first entry of the question's `steps` array, and two incorrect descriptions drawn from operations that appear in later entries of the `steps` array or that describe operations not used in the solution
4. THE Explain_Options SHALL use plain language describing algebraic operations (e.g., "Subtracted 5 from both sides", "Divided by 3", "Moved x to the left") without mathematical notation such as symbols, superscripts, or equation fragments

### Requirement 8: Explain Your Answer Trigger Logic

**User Story:** As a student, I want the explain-your-answer prompt to appear occasionally after correct answers, so that I stay engaged without feeling fatigued by constant follow-ups.

#### Acceptance Criteria

1. WHEN a student answers a question correctly AND the question has an `explain` object defined, THE system SHALL use a Trigger_Rate of 0.3 (30% probability) to determine whether to display the Explain_Prompt
2. THE system SHALL NOT display an Explain_Prompt unless at least 3 correct answers have been given since the last Explain_Prompt was displayed (or since the mission started if no Explain_Prompt has yet been shown), regardless of the Trigger_Rate probability; wrong answers between correct answers SHALL NOT reset this counter
3. WHEN the Trigger_Rate check passes and the cooldown condition is met, THE system SHALL display the Explain_Prompt immediately after the correct-answer feedback animation completes (after the "+points" display)
4. WHILE in ReplayGateScreen mode, THE system SHALL NOT display Explain_Prompts
5. WHEN a new mission or game mode session begins, THE system SHALL reset the Explain_Prompt cooldown counter to 0

### Requirement 9: Explain Your Answer Interaction

**User Story:** As a student, I want to answer the explain-your-answer prompt and receive immediate feedback, so that I know whether I truly understood the method.

#### Acceptance Criteria

1. WHEN the Explain_Prompt is displayed, THE system SHALL show the prompt text and 3 multiple-choice option buttons, pausing gameplay progression until the student selects an option or 15 seconds elapse without interaction
2. WHEN the student selects the correct Explain_Option, THE system SHALL display a confirmation message indicating the student understands the method, award 50 bonus points, and show the bonus points in the same "+points" format used for correct-answer scoring
3. WHEN the student selects an incorrect Explain_Option, THE system SHALL visually distinguish the correct option from the selected wrong option and display the correct first step description (e.g., "The first step was: Subtracted 5 from both sides"), awarding 0 bonus points
4. WHEN the student selects an incorrect Explain_Option, THE system SHALL NOT deduct HP or points as a penalty
5. WHEN the student responds to the Explain_Prompt (correct or incorrect), THE system SHALL disable all option buttons to prevent additional selections, dismiss the prompt after 2 seconds, and resume normal gameplay progression
6. IF 15 seconds elapse without the student selecting an Explain_Option, THEN THE system SHALL dismiss the Explain_Prompt without awarding or deducting any points and resume normal gameplay progression

### Requirement 10: Explain Your Answer in Game Contexts

**User Story:** As a student, I want the explain-your-answer feature to work across applicable game modes, so that my understanding is tested regardless of how I play.

#### Acceptance Criteria

1. WHEN a student answers correctly in the PlayingScreen, THE system SHALL apply the Explain_Prompt trigger logic (Trigger_Rate of 0.3 and cooldown of 3 consecutive correct answers) and display the Explain_Prompt when both conditions pass
2. WHEN a student answers correctly in the ExamScreen, THE system SHALL apply the Explain_Prompt trigger logic (Trigger_Rate of 0.3 and cooldown of 3 consecutive correct answers) and display the Explain_Prompt when both conditions pass
3. WHEN a student answers correctly in the DailyChallengeScreen, THE system SHALL apply the Explain_Prompt trigger logic (Trigger_Rate of 0.3 and cooldown of 3 consecutive correct answers) and display the Explain_Prompt when both conditions pass
4. THE system SHALL NOT display Explain_Prompts in the ReplayGateScreen
5. WHILE an Explain_Prompt is displayed in the PlayingScreen, THE system SHALL pause the game loop (no alien spawning, no bullet movement, no damage) until the prompt is dismissed
6. WHILE an Explain_Prompt is displayed in the ExamScreen, THE system SHALL pause the exam countdown timer until the prompt is dismissed
7. WHILE an Explain_Prompt is displayed in the DailyChallengeScreen, THE system SHALL pause the automatic question-advance timer until the prompt is dismissed
