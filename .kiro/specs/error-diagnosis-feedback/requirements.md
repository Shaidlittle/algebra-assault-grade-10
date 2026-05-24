# Requirements Document

## Introduction

When a student selects a wrong answer in Algebra Assault, the system currently shows the correct answer and solution steps but does not explain what specific mistake the student made. This feature adds targeted diagnostic feedback by mapping each distractor (wrong answer) to a specific algebraic error type. When a student picks a wrong answer, they see a short, plain-language message explaining the nature of their mistake (e.g., "You forgot to flip the sign when dividing by a negative"). This applies across all gameplay contexts: PlayingScreen, ExamScreen, ReplayGateScreen, and DailyChallengeScreen.

## Glossary

- **Distractor**: A wrong answer option presented alongside the correct answer in a multiple-choice question
- **Error_Tag**: A short machine-readable identifier for a category of algebraic mistake (e.g., `sign_flip_forgotten`, `single_root_only`)
- **Diagnostic_Message**: A student-facing plain-language sentence explaining what algebraic mistake led to a particular distractor
- **Error_Catalog**: A data structure mapping Error_Tags to their corresponding Diagnostic_Messages
- **Question_Generator**: The module (`src/data/questionGenerator.js`) that dynamically creates questions and distractors
- **Static_Question_Bank**: The hardcoded question set in `src/data/questions.js`
- **Feedback_Panel**: The UI component that displays correct/wrong feedback after a student answers a question

## Requirements

### Requirement 1: Error Catalog Definition

**User Story:** As a developer, I want a centralized catalog of algebraic error types and their diagnostic messages, so that error feedback is consistent and maintainable across all topics.

#### Acceptance Criteria

1. THE Error_Catalog SHALL define entries containing an Error_Tag (a unique string identifier describing the misconception, e.g., "added_exponents_instead_of_multiplying") and a Diagnostic_Message (a student-facing explanation string) for each algebraic mistake that corresponds to a distractor in the Question_Data_Module
2. THE Error_Catalog SHALL cover error types for all six algebra topics: Linear Equations, Quadratic Equations, Exponential Expressions, Exponential Equations, Inequalities, and Simultaneous Equations
3. THE Error_Catalog SHALL contain a minimum of 3 and no more than 10 Error_Tags per topic
4. WHEN a Diagnostic_Message is displayed, THE Error_Catalog SHALL provide messages written in second-person plain language using vocabulary and sentence structures appropriate for Grade 10 students, where each message is between 8 and 30 words and contains no mathematical terminology beyond what appears in the Grade 10 curriculum for that topic
5. THE Error_Catalog SHALL assign each Error_Tag a unique identifier across the entire catalog, such that no two entries share the same Error_Tag string regardless of topic

### Requirement 2: Distractor Labeling in Generated Questions

**User Story:** As a student, I want each wrong answer to be linked to a specific error type, so that I receive targeted feedback when I make a mistake.

#### Acceptance Criteria

1. WHEN the Question_Generator produces distractors, THE Question_Generator SHALL return each distractor as an object containing a `value` property (the distractor string) and a `tag` property (the associated Error_Tag string)
2. THE Question_Generator SHALL assign an Error_Tag to every generated distractor, ensuring no distractor object has a null or empty `tag` property
3. WHEN a distractor is produced by a known algebraic error pattern, THE Question_Generator SHALL assign the Error_Tag corresponding to that pattern from the following minimum set: "sign_error" (sign flip or negation mistake), "exponent_add" (added exponents instead of multiplying), "exponent_multiply" (multiplied exponents instead of adding), "off_by_one" (answer differs from correct by ±1), "forgot_flip" (failed to flip inequality when dividing by negative), "swapped_variables" (x and y values transposed), and "arithmetic_error" (incorrect arithmetic on coefficients or constants)
4. WHEN a distractor is a fallback variation without a matching known error pattern, THE Question_Generator SHALL assign the Error_Tag "general_miscalculation"
5. WHEN any module consumes the `wrong` array from a generated question, THE Question_Generator SHALL ensure the distractor objects can be used to extract display values (via the `value` property) without breaking existing answer rendering or shuffling logic

### Requirement 3: Distractor Labeling in Static Questions

**User Story:** As a developer, I want the static question bank to include error labels for each distractor, so that diagnostic feedback works for hardcoded questions as well.

#### Acceptance Criteria

1. THE Static_Question_Bank SHALL store each distractor in the `wrong` array as an object with a `value` property (string, the distractor answer text) and a `tag` property (string, the associated Error_Tag identifier)
2. WHEN a static question is loaded, THE Static_Question_Bank SHALL provide an Error_Tag for every distractor in that question, resulting in exactly 3 tagged distractor objects per question
3. THE Static_Question_Bank SHALL use only Error_Tags defined in the Error_Catalog used by the Question_Generator
4. IF a static distractor does not correspond to a specific algebraic error pattern, THEN THE Static_Question_Bank SHALL assign a generic Error_Tag (e.g., `general_miscalculation`) that is also defined in the Error_Catalog

### Requirement 4: Diagnostic Message Display on Wrong Answer

**User Story:** As a student, I want to see a message explaining my specific mistake when I pick a wrong answer, so that I understand what I did wrong and can avoid repeating the error.

#### Acceptance Criteria

1. WHEN a student selects a wrong answer, THE Feedback_Panel SHALL look up the selected distractor's Error_Tag in the Error_Catalog and display the corresponding Diagnostic_Message within the same feedback render cycle (no additional user action required)
2. WHEN a student selects a wrong answer, THE Feedback_Panel SHALL display the Diagnostic_Message above the correct answer and solution steps, separated by visible whitespace or a divider so the two sections are not visually merged
3. THE Feedback_Panel SHALL display the Diagnostic_Message with a distinguishing prefix icon (e.g., a warning or lightbulb icon) and a background or text treatment that differs from the correct-answer section, so that a tester can identify the Diagnostic_Message area without reading its content
4. WHILE the Feedback_Panel is showing a wrong-answer result, THE Feedback_Panel SHALL continue to display the correct answer and solution steps alongside the Diagnostic_Message without truncating or hiding either section
5. IF the selected distractor has no Error_Tag or the Error_Tag is not found in the Error_Catalog, THEN THE Feedback_Panel SHALL omit the Diagnostic_Message section and display only the correct answer and solution steps without error

### Requirement 5: Diagnostic Feedback in All Game Contexts

**User Story:** As a student, I want to receive diagnostic feedback regardless of which game mode I am playing, so that I always learn from my mistakes.

#### Acceptance Criteria

1. WHEN a student selects a wrong answer in the PlayingScreen, THE Feedback_Panel SHALL display the Diagnostic_Message for the selected distractor above the correct answer and solution steps, remaining visible for the full duration of the wrong-answer feedback display
2. WHEN a student selects a wrong answer in the ExamScreen, THE Feedback_Panel SHALL display the Diagnostic_Message for the selected distractor above the correct answer and solution steps, remaining visible for the full duration of the wrong-answer feedback display
3. WHEN a student selects a wrong answer in the ReplayGateScreen, THE Feedback_Panel SHALL display the Diagnostic_Message for the selected distractor above the correct answer and solution steps, remaining visible for the full duration of the wrong-answer feedback display
4. WHEN a student selects a wrong answer in the DailyChallengeScreen, THE Feedback_Panel SHALL display the Diagnostic_Message for the selected distractor above the correct answer and solution steps, remaining visible for the full duration of the wrong-answer feedback display
5. IF the selected distractor does not have an associated Error_Tag, THEN THE Feedback_Panel SHALL display only the correct answer and solution steps without a Diagnostic_Message

### Requirement 6: Backward Compatibility of Question Data Structure

**User Story:** As a developer, I want the new distractor format to be backward-compatible, so that existing game logic continues to work without breaking.

#### Acceptance Criteria

1. WHEN answer-comparison logic evaluates a student's selection, THE system SHALL compare against the distractor's display string regardless of whether the distractor is stored as a plain string or as an object with a `value` property, by treating plain-string distractors as their literal value and object-format distractors as the value of their `value` property
2. WHEN shuffling answer options for display, THE Answer_Shuffler SHALL extract the display string from each distractor in the `wrong` array — returning the string itself for plain-string entries and the `value` property for object-format entries — and SHALL handle arrays containing a mix of both formats within a single question
3. IF a distractor object is missing an Error_Tag property or the Error_Tag is null or undefined, THEN THE Feedback_Panel SHALL fall back to displaying only the correct answer and solution steps without a Diagnostic_Message
4. IF a distractor object's `value` property is null, undefined, or an empty string, THEN THE system SHALL treat that distractor as an empty string for display and comparison purposes without throwing an error

### Requirement 7: Error Tag Coverage for Inequality Sign-Flip Errors

**User Story:** As a student solving inequalities, I want to be told when I forgot to flip the inequality sign, so that I remember this critical rule.

#### Acceptance Criteria

1. WHEN the Question_Generator produces an inequality distractor by omitting the sign flip after dividing by a negative, THE Question_Generator SHALL assign the Error_Tag `sign_flip_forgotten`
2. WHEN a student selects a distractor tagged `sign_flip_forgotten`, THE Feedback_Panel SHALL display a message such as "You forgot to flip the inequality sign when dividing by a negative"

### Requirement 8: Error Tag Coverage for Quadratic Single-Root Errors

**User Story:** As a student solving quadratics, I want to be told when I only found one solution, so that I remember quadratics can have two roots.

#### Acceptance Criteria

1. WHEN the Question_Generator produces a quadratic distractor representing only one of two roots, THE Question_Generator SHALL assign the Error_Tag `single_root_only`
2. WHEN a student selects a distractor tagged `single_root_only`, THE Feedback_Panel SHALL display a message such as "You only found one solution — quadratics can have two roots"

### Requirement 9: Error Tag Coverage for Exponent Operation Errors

**User Story:** As a student simplifying exponential expressions, I want to be told when I used the wrong exponent operation, so that I learn the correct exponent laws.

#### Acceptance Criteria

1. WHEN the Question_Generator produces a power-of-a-power distractor (for expressions of the form `(x^a)^b`), THE Question_Generator SHALL generate at least one distractor with the value `x^(a+b)` (adding instead of multiplying) and assign it the Error_Tag `exponents_added_not_multiplied`
2. WHEN the Question_Generator produces a same-base multiplication distractor (for expressions of the form `x^a × x^b`), THE Question_Generator SHALL generate at least one distractor with the value `x^(a*b)` (multiplying instead of adding) and assign it the Error_Tag `exponents_multiplied_not_added`
3. IF the computed error-pattern distractor value equals the correct answer (e.g., when both exponents are 2, making a+b equal to a×b), THEN THE Question_Generator SHALL not assign the corresponding Error_Tag to that distractor and SHALL generate an alternative distractor instead
4. WHEN a student selects a distractor tagged `exponents_added_not_multiplied`, THE Feedback_Panel SHALL display a diagnostic message indicating the student added the exponents instead of multiplying them and that power-of-a-power requires multiplication
5. WHEN a student selects a distractor tagged `exponents_multiplied_not_added`, THE Feedback_Panel SHALL display a diagnostic message indicating the student multiplied the exponents instead of adding them and that same-base multiplication requires addition
