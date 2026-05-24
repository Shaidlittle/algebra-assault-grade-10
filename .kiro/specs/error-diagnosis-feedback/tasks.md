# Implementation Plan: Error Diagnosis Feedback

## Overview

Add targeted diagnostic feedback to Algebra Assault so that when a student picks a wrong answer, they see a short plain-language message explaining the specific algebraic mistake they made. The implementation touches the data layer (error catalog, tagged distractors), utility layer (backward-compatible display helper), and UI layer (shared DiagnosticMessage component integrated into all four game screens).

## Tasks

- [x] 1. Create the Error Catalog module
  - [x] 1.1 Create `src/data/errorCatalog.js` with the ERROR_CATALOG map and `getDiagnosticMessage` function
    - Define all Error_Tags for the six algebra topics (3–10 per topic) as specified in the design
    - Each message must be 8–30 words, second-person, Grade 10 vocabulary
    - Export `getDiagnosticMessage(tag)` that returns the message string or null for missing/unknown tags
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 2. Add the display-value helper and update shuffleAnswers
  - [x] 2.1 Add `getDisplayValue` helper to `src/utils/shuffleAnswers.js`
    - Supports plain-string distractors (legacy) and `{ value, tag }` object format
    - Returns empty string for null/undefined values without throwing
    - Export the function for use by screen components
    - _Requirements: 6.1, 6.2, 6.4_

  - [x] 2.2 Update `shuffleAnswers` to use `getDisplayValue` internally
    - When computing the seed hash, extract display string via `getDisplayValue` instead of assuming string type
    - Ensure mixed arrays (strings and objects) shuffle correctly
    - _Requirements: 6.2_

- [x] 3. Update `generateDistractors` to return tagged objects
  - [x] 3.1 Refactor `generateDistractors` in `src/data/questionGenerator.js` to return `{ value, tag }` objects
    - Update `generateSingleDistractor` to assign appropriate Error_Tags based on the error pattern used
    - Assign `sign_error`, `off_by_one`, `arithmetic_error`, `exponent_add`, `exponent_multiply`, `forgot_flip`, `swapped_variables`, `single_root_only`, `exponents_added_not_multiplied`, `exponents_multiplied_not_added` where applicable
    - Assign `general_miscalculation` as fallback for distractors without a known pattern
    - Ensure every returned distractor has a non-null `tag` property
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

  - [x] 3.2 Add specific error-pattern distractors for exponential expressions
    - For power-of-a-power `(x^a)^b`, generate a distractor with value `x^(a+b)` tagged `exponents_added_not_multiplied`
    - For same-base multiplication `x^a × x^b`, generate a distractor with value `x^(a*b)` tagged `exponents_multiplied_not_added`
    - Skip the error-pattern distractor if its value equals the correct answer
    - _Requirements: 9.1, 9.2, 9.3_

  - [x] 3.3 Add specific error-pattern distractors for inequalities and quadratics
    - For inequalities with negative division, generate a distractor omitting the sign flip tagged `sign_flip_forgotten`
    - For quadratics with two roots, generate a single-root distractor tagged `single_root_only`
    - _Requirements: 7.1, 8.1_

- [x] 4. Checkpoint
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Tag distractors in the static question bank
  - [x] 5.1 Convert `wrong` arrays in `src/data/questions.js` to tagged distractor objects
    - Replace each plain-string distractor with `{ value: "...", tag: "..." }` format
    - Assign appropriate Error_Tags based on the algebraic mistake each distractor represents
    - Use `general_miscalculation` for distractors without a clear error pattern
    - Ensure exactly 3 tagged distractor objects per question
    - Only use Error_Tags defined in the Error_Catalog
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [x] 6. Create the DiagnosticMessage UI component
  - [x] 6.1 Create `src/components/DiagnosticMessage.jsx`
    - Render a styled container with a lightbulb icon prefix and amber background treatment
    - Accept a `message` prop; return null if message is falsy
    - Use Tailwind classes matching the design: `bg-amber-500/20 border border-amber-400/40 rounded-xl`
    - _Requirements: 4.2, 4.3_

- [x] 7. Integrate diagnostic feedback into PlayingScreen
  - [x] 7.1 Update `PlayingScreen.jsx` to display `DiagnosticMessage` in the FeedbackPanel
    - Import `getDiagnosticMessage` from errorCatalog and `getDisplayValue` from shuffleAnswers
    - When a wrong answer is selected, find the matching distractor object in `q.wrong` and look up its tag
    - Pass `diagnosticMessage` to FeedbackPanel; render `DiagnosticMessage` above the correct answer and steps
    - Omit the diagnostic section gracefully if tag is missing or not found in catalog
    - Update answer buttons to use `getDisplayValue` for rendering distractor text
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 5.1_

- [x] 8. Integrate diagnostic feedback into ExamScreen
  - [x] 8.1 Update `ExamScreen.jsx` to display `DiagnosticMessage` in ExamFeedbackPanel
    - Same pattern as PlayingScreen: find distractor, look up tag, render DiagnosticMessage above correct answer
    - Update answer rendering to use `getDisplayValue`
    - Graceful fallback when tag is missing
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 5.2_

- [x] 9. Integrate diagnostic feedback into ReplayGateScreen
  - [x] 9.1 Update `ReplayGateScreen.jsx` to display `DiagnosticMessage` in FeedbackPanel
    - Same pattern: find distractor, look up tag, render DiagnosticMessage above correct answer
    - Update answer rendering to use `getDisplayValue`
    - Graceful fallback when tag is missing
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 5.3_

- [x] 10. Integrate diagnostic feedback into DailyChallengeScreen
  - [x] 10.1 Update `DailyChallengeScreen.jsx` to display `DiagnosticMessage` in feedback section
    - Same pattern: find distractor, look up tag, render DiagnosticMessage above correct answer
    - Update answer rendering to use `getDisplayValue`
    - Graceful fallback when tag is missing
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 5.4_

- [x] 11. Checkpoint
  - Ensure all tests pass, ask the user if questions arise.

- [x] 12. Wire everything together and verify backward compatibility
  - [x] 12.1 Verify backward compatibility across all screens
    - Confirm that screens handle mixed `wrong` arrays (plain strings and objects) without errors
    - Confirm `shuffleAnswers` works with both formats
    - Confirm answer comparison logic works with both formats
    - Confirm that missing or unknown tags result in graceful omission of diagnostic message (no crash)
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 4.5, 5.5_

- [x] 13. Final checkpoint
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- No property-based tests are included because the design does not define a Correctness Properties section
- The project has no test framework currently configured; unit tests can be added if a framework is set up
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- The `wrong` array supports both legacy string format and new object format for backward compatibility during migration

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "2.1"] },
    { "id": 1, "tasks": ["2.2", "3.1", "6.1"] },
    { "id": 2, "tasks": ["3.2", "3.3", "5.1"] },
    { "id": 3, "tasks": ["7.1", "8.1", "9.1", "10.1"] },
    { "id": 4, "tasks": ["12.1"] }
  ]
}
```
