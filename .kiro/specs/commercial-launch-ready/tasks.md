# Implementation Plan: Commercial Launch Ready

## Overview

This plan implements six feature areas to make Algebra Assault commercially viable: multi-student profile management, procedural question generation, first-launch onboarding, PWA support, email capture with workbook download, and a landing screen. All features are client-side only, using the existing `window.storage` abstraction and React 18 with Vite 5.

## Tasks

- [x] 1. Implement Profile Management core utilities
  - [x] 1.1 Create StorageAdapter module (`src/utils/storageAdapter.js`)
    - Implement `createStorageAdapter(namespacePrefix)` factory function
    - Expose `get(key)`, `set(key, value)`, `delete(key)`, `list(prefix)`, `getFullKey(key)` methods
    - All methods prefix keys with `{namespace}-{key}` pattern
    - Wrap `window.storage` calls in try/catch, return null on failure
    - _Requirements: 1.4_

  - [x] 1.2 Create ProfileManager module (`src/utils/profileManager.js`)
    - Implement `sanitizeName(name)` — reject empty or >30 chars before sanitization
    - Implement `deriveNamespace(name)` — lowercase, replace whitespace with hyphens, remove non-`[a-z0-9-]`, collapse consecutive hyphens, trim leading/trailing hyphens
    - Implement `loadProfiles()`, `createProfile(name, curriculum)`, `deleteProfile(id)`, `switchProfile(id)`, `getActiveProfile()`, `setActiveProfile(id)`
    - Implement `hasNamespaceCollision(namespace, existingProfiles)` and `isProfileLimitReached(profiles)`
    - Export constants: `MAX_PROFILES=10`, `PROFILES_KEY`, `ACTIVE_PROFILE_KEY`
    - Handle storage failures gracefully — display error, preserve existing data
    - _Requirements: 1.2, 1.3, 1.5, 1.6, 1.7, 1.8, 1.9, 1.10_

  - [ ]* 1.3 Write property test: Namespace derivation is deterministic and well-formed
    - **Property 1: Namespace derivation is deterministic and well-formed**
    - Use fast-check to generate random strings (unicode, whitespace, special chars)
    - Assert output is entirely lowercase, matches `[a-z0-9-]`, no leading/trailing/consecutive hyphens, deterministic
    - Assert `hasNamespaceCollision` returns true for inputs producing same namespace
    - **Validates: Requirements 1.2, 1.8**

  - [ ]* 1.4 Write property test: Storage key prefixing
    - **Property 2: Storage key prefixing**
    - Use fast-check to generate random namespace prefixes and key names
    - Assert `getFullKey(key)` equals `{namespace}-{key}`
    - Assert read/write operations use the prefixed key in underlying storage
    - **Validates: Requirements 1.4**

  - [ ]* 1.5 Write property test: Profile deletion removes all namespaced keys
    - **Property 3: Profile deletion removes all namespaced keys**
    - Use fast-check to generate random profiles with random sets of namespaced keys
    - After deletion, assert no keys with that namespace prefix remain in storage
    - Assert profiles list no longer contains the deleted profile id
    - **Validates: Requirements 1.6**

  - [ ]* 1.6 Write property test: Storage failure preserves existing state
    - **Property 4: Storage failure preserves existing state**
    - Use fast-check to generate random initial profile states
    - Simulate storage failures during create/switch/delete operations
    - Assert profiles list and all existing namespaced keys remain unchanged
    - **Validates: Requirements 1.10**

- [x] 2. Checkpoint - Profile management core
  - Ensure all tests pass, ask the user if questions arise.

- [x] 3. Implement Procedural Question Generation
  - [x] 3.1 Create QuestionGenerator module (`src/data/questionGenerator.js`)
    - Implement `generateLinear(difficulty)`, `generateQuadratic(difficulty)`, `generateExpExpr(difficulty)`, `generateExpEqn(difficulty)`, `generateInequality(difficulty)`, `generateSimultaneous(difficulty)`
    - Implement `generateQuestion(topic, difficulty)` main entry point with retry logic (max 10 attempts, fallback to seed question)
    - Implement `generateQuestionPool(topic, difficulty, count)` ensuring ≥70% generated questions
    - Implement `generateDistractors(correctAnswer, topic, difficulty)` producing 3 distinct wrong answers based on common student errors
    - Implement `validateQuestion(question)` for structural validation
    - Export `DIFFICULTY_RANGES` and `MAX_GENERATION_ATTEMPTS` constants
    - Output shape must match seed questions: `{ q, a, wrong, hint, steps }`
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.9, 2.10_

  - [x] 3.2 Integrate QuestionGenerator with game flow
    - Modify topic mission question selection in `src/screens/PlayingScreen.jsx` (or `App.jsx`) to draw from combined pool of seed + generated questions
    - Ensure generated questions comprise at least 70% of the pool when a mission starts
    - _Requirements: 2.7_

  - [ ]* 3.3 Write property test: Question round-trip correctness
    - **Property 5: Question round-trip correctness**
    - Use fast-check to generate questions across all topics and difficulties
    - Independently solve the equation in `q` field and assert result equals `a` field
    - **Validates: Requirements 2.3, 2.8**

  - [ ]* 3.4 Write property test: Generated question structural validity
    - **Property 6: Generated question structural validity**
    - Use fast-check to generate questions with random topic + difficulty
    - Assert: exactly 3 elements in `wrong` array, all distinct from each other and from `a`
    - Assert: `steps` array length between 2 and 6 inclusive
    - Assert: all required properties present with correct types
    - **Validates: Requirements 2.4, 2.5, 2.6**

  - [ ]* 3.5 Write property test: Coefficient range compliance
    - **Property 7: Coefficient range compliance**
    - Use fast-check to generate questions per difficulty tier
    - Assert easy: positive integers 1-9; medium: integers in [-99,-10]∪[10,99]; hard: denominators 2-6
    - **Validates: Requirements 2.2**

  - [ ]* 3.6 Write property test: Question pool composition
    - **Property 8: Question pool composition**
    - Use fast-check to generate random pool sizes (4-50) across topics
    - Assert returned pool contains at least 70% generated (non-seed) questions
    - **Validates: Requirements 2.7**

  - [ ]* 3.7 Write property test: Answer format compliance
    - **Property 9: Answer format compliance**
    - Use fast-check to generate questions per topic type
    - Assert linear/exponential use "x = [value]", quadratic two-solution use "x = [v1] or [v2]", ± use "x = ±[value]", simultaneous use "([x], [y])"
    - **Validates: Requirements 2.10**

- [x] 4. Checkpoint - Question generation
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Implement First-Launch Onboarding Flow
  - [x] 5.1 Create OnboardingScreen component (`src/screens/OnboardingScreen.jsx`)
    - Implement name input with validation: trim whitespace, min 1 / max 20 chars, only `[A-Za-z '-]`
    - Implement curriculum selector with CAPS, IEB, Cambridge options (no default)
    - On valid submission: create profile via ProfileManager, set as active, call `onComplete`
    - Display inline validation errors for invalid name or missing curriculum
    - On storage failure: display error message, preserve form data, allow retry
    - Export `validateName(name)` and `validateCurriculum(curriculum)` for testing
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.6, 3.7, 3.8, 3.9_

  - [x] 5.2 Integrate onboarding into App flow
    - In `App.jsx`, detect first launch (no profiles in storage) and show OnboardingScreen
    - After onboarding completes, transition to menu screen
    - Replace hardcoded "MATTEO'S MATH MISSION" subtitle with `{ActiveProfile.name.toUpperCase()}'S MATH MISSION`
    - On subsequent launches with existing active profile, skip onboarding and go to menu
    - _Requirements: 3.1, 3.4, 3.5, 3.6_

  - [ ]* 5.3 Write property test: Name validation correctness
    - **Property 10: Name validation correctness**
    - Use fast-check to generate random strings (valid and invalid)
    - Assert `validateName` returns valid=true iff trimmed string is 1-20 chars and matches `[A-Za-z '-]`
    - **Validates: Requirements 3.2**

  - [ ]* 5.4 Write property test: Subtitle personalization
    - **Property 11: Subtitle personalization**
    - Use fast-check to generate random valid profile names
    - Assert menu subtitle equals `{name.toUpperCase()}'S MATH MISSION`
    - **Validates: Requirements 3.5**

- [x] 6. Checkpoint - Onboarding flow
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Implement PWA Support
  - [x] 7.1 Create PWA manifest and icons (`public/manifest.json`, `public/icons/`)
    - Create `manifest.json` with name, short_name, start_url, display: standalone, theme_color, background_color, icons (192, 384, 512)
    - Add placeholder icon PNG files at required sizes
    - Add `<link rel="manifest" href="/manifest.json">` to `index.html`
    - _Requirements: 4.1, 4.7_

  - [x] 7.2 Create Service Worker (`public/sw.js`)
    - Implement install event: precache app shell (HTML, CSS, JS bundles, icons) with cache-first strategy
    - Implement activate event: clean old caches
    - Implement fetch event: cache-first for precached assets, network fallback
    - Handle cache quota exceeded gracefully — continue with existing cached assets
    - Post message to client when new SW version is available
    - _Requirements: 4.2, 4.3, 4.4, 4.9, 4.10_

  - [x] 7.3 Register Service Worker and implement update notification
    - In `index.html` or `main.jsx`, register SW with feature detection (skip silently if unsupported)
    - Listen for SW update messages, display non-blocking toast/banner prompting refresh
    - Implement install button on menu screen using `beforeinstallprompt` event
    - _Requirements: 4.5, 4.6, 4.8_

  - [ ]* 7.4 Write unit tests for PWA manifest validation
    - Verify manifest contains all required fields (name, short_name, start_url, display, theme_color, background_color, icons)
    - Verify at least 3 icon sizes present (192, 384, 512)
    - _Requirements: 4.1_

- [x] 8. Implement Email Capture and Workbook Download
  - [x] 8.1 Create EmailCaptureModal component (`src/components/EmailCaptureModal.jsx`)
    - Implement modal overlay with: description text, email input with placeholder, "Send My Workbook" button, privacy note, close/dismiss button
    - Implement email validation using pattern `^[^\s@]+@[^\s@]+\.[^\s@]+$`
    - On valid submit: POST to configurable webhook URL (fire-and-forget, 10s timeout), immediately show download link to `/workbook.pdf`
    - On close/dismiss: close modal, return focus to menu, no storage writes or requests
    - On download link click: store `workbook-downloaded` flag in active profile namespace
    - Export `validateEmail(email)` and constants (`WEBHOOK_URL`, `WEBHOOK_TIMEOUT_MS`, `WORKBOOK_PATH`)
    - _Requirements: 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.9_

  - [x] 8.2 Integrate email capture button into MenuScreen
    - Add "📘 Free Workbook" button in the action buttons row (same flex-wrap container as Review Mistakes and Daily Challenge)
    - When `workbook-downloaded` flag is set, display as "📘 Get Workbook" with same base styling as sibling buttons
    - On button tap, open EmailCaptureModal
    - _Requirements: 5.1, 5.8_

  - [ ]* 8.3 Write property test: Email validation correctness
    - **Property 12: Email validation correctness**
    - Use fast-check to generate random strings and structured email-like strings
    - Assert `validateEmail` returns true iff string matches `^[^\s@]+@[^\s@]+\.[^\s@]+$`
    - **Validates: Requirements 5.3**

  - [ ]* 8.4 Write unit tests for EmailCaptureModal
    - Test modal open/close behavior
    - Test validation error display for invalid emails
    - Test download link appears after valid submission
    - Test webhook is called with correct payload
    - Test dismiss does not trigger any storage writes
    - _Requirements: 5.2, 5.3, 5.5, 5.9_

- [x] 9. Implement Landing Screen
  - [x] 9.1 Create LandingScreen component (`src/screens/LandingScreen.jsx`)
    - Display value proposition, target audience (Grade 10), supported curricula (CAPS, IEB, Cambridge), key features (6 topics, boss fights, progress tracking, exam simulator)
    - Single CTA button "Start Playing" — full width, min 44×44px touch target
    - All content in single scrollable column fitting 320px viewport without horizontal overflow
    - On "Start Playing" tap: call `onContinue` to advance to Disclaimer screen
    - _Requirements: 6.2, 6.3, 6.6_

  - [x] 9.2 Integrate LandingScreen into app onboarding flow
    - Show LandingScreen before Disclaimer when `disclaimer-dismissed` flag is not set
    - Do NOT persist any dismissal state for LandingScreen — it reappears every session until disclaimer is dismissed
    - If disclaimer already dismissed, skip LandingScreen entirely and go to menu
    - _Requirements: 6.1, 6.4, 6.5_

  - [ ]* 9.3 Write unit tests for LandingScreen
    - Test all required content is rendered (value prop, audience, curricula, features)
    - Test CTA button is present and calls onContinue
    - Test content fits within 320px viewport constraint
    - _Requirements: 6.2, 6.3, 6.6_

- [x] 10. Integration and wiring
  - [x] 10.1 Wire profile namespace into all existing storage-dependent modules
    - Update `progressTracker.js`, `mistakeJournal.js`, `xpSystem.js`, `adaptiveDifficulty.js`, `dailyChallenge.js`, `highScores.js` to accept and use StorageAdapter with active profile namespace instead of hardcoded prefix
    - Ensure profile switch reloads all state from new namespace
    - _Requirements: 1.4, 1.5_

  - [x] 10.2 Wire profile selection screen for multi-profile management
    - Create profile selection UI (accessible from menu or on launch when no active profile)
    - Support create, switch, and delete operations with appropriate error handling
    - Disable create when profile limit (10) reached
    - Show inline validation for namespace collisions
    - _Requirements: 1.6, 1.7, 1.8, 1.9_

  - [ ]* 10.3 Write integration tests for profile switch state reload
    - Mock storage with two profiles, switch between them
    - Verify all modules (progress, XP, mistakes, adaptive, daily, high scores) read from new namespace
    - _Requirements: 1.5_

  - [ ]* 10.4 Write integration tests for onboarding → profile → menu flow
    - Render App with no profiles, complete onboarding, verify menu shows personalized subtitle
    - _Requirements: 3.4, 3.5_

- [x] 11. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document (Properties 1-12)
- Unit tests validate specific examples and edge cases
- The project uses Vitest with fast-check for property-based testing (both already installed)
- All code is plain JavaScript (no TypeScript) with React 18 and Tailwind CSS 3
- PWA testing (offline, install) requires manual verification — automated tests cover manifest structure only

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "7.1"] },
    { "id": 1, "tasks": ["1.2", "7.2", "9.1"] },
    { "id": 2, "tasks": ["1.3", "1.4", "1.5", "1.6", "3.1", "5.1", "7.3", "7.4", "8.1", "9.2"] },
    { "id": 3, "tasks": ["3.2", "3.3", "3.4", "3.5", "3.6", "3.7", "5.2", "5.3", "5.4", "8.2", "8.3", "8.4", "9.3"] },
    { "id": 4, "tasks": ["10.1"] },
    { "id": 5, "tasks": ["10.2", "10.3", "10.4"] }
  ]
}
```
