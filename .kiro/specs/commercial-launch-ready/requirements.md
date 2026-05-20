# Requirements Document

## Introduction

This specification covers the critical "must-have for launch" features required to make Algebra Assault commercially viable. The current prototype is hardcoded to a single student ("Matteo"), has a limited 108-question bank that causes repeat fatigue, lacks installability (no PWA support), has no onboarding flow, no email capture mechanism, and no marketing presence. These six feature areas must be addressed before the product can be sold or distributed as a paid offering.

## Glossary

- **Profile_Manager**: The module responsible for creating, switching, listing, and deleting student profiles, including isolated storage namespaces per profile
- **Question_Generator**: The module that procedurally generates algebra questions with randomized coefficients, auto-computed correct answers, plausible distractors, and step-by-step solutions
- **Onboarding_Flow**: The first-launch experience that collects student name, curriculum preference, and creates the initial profile
- **Service_Worker**: The background script that caches the app shell and question data for offline use
- **PWA_Manifest**: The web app manifest file that enables installation on mobile and desktop devices
- **Email_Capture_Modal**: The overlay UI that collects a parent/student email address in exchange for a free workbook download
- **Landing_Screen**: The pre-game marketing screen that communicates product value and directs users to start playing
- **Storage_API**: The window.storage abstraction (localStorage polyfill) used for all client-side persistence
- **Seed_Questions**: The existing 108 curated static questions (18 per topic × 6 topics) that serve as the baseline question bank
- **Active_Profile**: The currently selected student profile whose storage namespace is used for all read/write operations

## Requirements

### Requirement 1: Multi-Student Profile Management

**User Story:** As a parent with multiple children, I want each child to have their own profile with separate progress, so that one child's data does not interfere with another's.

#### Acceptance Criteria

1. WHEN the application launches for the first time (no profiles exist), THE Profile_Manager SHALL redirect the user to the Onboarding_Flow before any gameplay is accessible
2. WHEN a new profile is created, THE Profile_Manager SHALL generate a unique storage namespace prefix derived from the profile name (lowercased, whitespace replaced with hyphens, non-alphanumeric characters removed), rejecting names that are empty after sanitization or exceed 30 characters before sanitization
3. THE Profile_Manager SHALL store all profile metadata (name, curriculum, creation date) in a shared storage key "algebra-assault-profiles" as a JSON array
4. WHILE a profile is active, THE Storage_API SHALL prefix all per-student storage keys with the Active_Profile's namespace prefix instead of the hardcoded "matteo-" prefix
5. WHEN a user switches profiles, THE Profile_Manager SHALL update the Active_Profile reference and reload all state (progress, XP, mistakes, adaptive difficulty, daily challenge, high scores) from the new profile's namespace
6. WHEN a user deletes a profile, THE Profile_Manager SHALL remove all storage keys associated with that profile's namespace and remove the profile entry from the profiles list; IF the deleted profile is the currently Active_Profile, THEN THE Profile_Manager SHALL redirect the user to the profile selection screen with no Active_Profile set
7. THE Profile_Manager SHALL support a minimum of 5 and a maximum of 10 simultaneous profiles; IF the maximum is reached, THEN THE Profile_Manager SHALL disable the create-profile option and display a message indicating the profile limit has been reached
8. WHEN a profile name is entered that would produce a namespace collision with an existing profile, THE Profile_Manager SHALL display an inline validation error message adjacent to the name input field and prevent creation
9. WHEN the application launches with one or more profiles already existing, THE Profile_Manager SHALL read the last Active_Profile identifier from the Storage_API (stored under a dedicated key "algebra-assault-active-profile") and automatically resume that profile's session without requiring manual selection
10. IF the Storage_API read or write operation fails during any profile operation (creation, switching, deletion, or loading), THEN THE Profile_Manager SHALL display a user-facing error message indicating the operation could not be completed and SHALL not corrupt existing profile data

### Requirement 2: Procedural Question Generation

**User Story:** As a student, I want a large variety of questions so that I encounter fresh problems each session and do not memorize answers from repetition.

#### Acceptance Criteria

1. THE Question_Generator SHALL produce questions for all 6 existing topics: linear equations, quadratic equations, exponential expressions, exponential equations, inequalities, and simultaneous equations
2. WHEN generating a question, THE Question_Generator SHALL randomize numerical coefficients within difficulty-appropriate ranges: easy uses positive integers from 1 to 9; medium uses integers from -99 to -10 and 10 to 99 (including negatives); hard uses fractions with denominators from 2 to 6 and expressions requiring 3 or more algebraic operations to solve
3. THE Question_Generator SHALL compute the correct answer algebraically from the generated coefficients rather than selecting from a predefined list
4. THE Question_Generator SHALL produce exactly 3 wrong answers derived from common student errors (sign errors, arithmetic mistakes, incomplete simplification), where each distractor is distinct from the correct answer and distinct from every other distractor
5. THE Question_Generator SHALL produce a step-by-step solution array containing between 2 and 6 steps (inclusive) showing the algebraic working
6. THE Question_Generator SHALL produce questions in the same shape as Seed_Questions: an object with properties q (question string), a (correct answer string), wrong (array of 3 distractor strings), hint (string), and steps (array of strings)
7. WHEN a topic mission is started, THE application SHALL draw questions from a combined pool of Seed_Questions and generated questions, with generated questions comprising at least 70% of the pool
8. THE Question_Generator SHALL ensure that parsing the question string and solving it yields the stated correct answer (round-trip correctness property)
9. IF the Question_Generator cannot produce a valid question (due to coefficient combinations yielding non-integer or undefined answers for easy/medium difficulty), THEN THE Question_Generator SHALL discard the attempt and regenerate with new coefficients, up to a maximum of 10 attempts, after which it SHALL fall back to a randomly selected Seed_Question for that topic and difficulty
10. THE Question_Generator SHALL format answer strings using the same conventions as Seed_Questions: "x = [value]" for single-variable solutions, "x = ±[value]" for plus-minus solutions, "x = [value1] or [value2]" for two-solution quadratics, and "([x], [y])" for simultaneous equation solutions

### Requirement 3: First-Launch Onboarding Flow

**User Story:** As a new user, I want a welcoming first-launch experience that personalizes the app to me, so that I feel ownership and the app addresses me by name.

#### Acceptance Criteria

1. WHEN the application detects no existing profiles in storage, THE Onboarding_Flow SHALL display automatically before any other screen
2. THE Onboarding_Flow SHALL collect the student's first name via a text input with a minimum length of 1 character and a maximum length of 20 characters, accepting only letters (A–Z, a–z), hyphens, apostrophes, and spaces, and trimming leading and trailing whitespace before validation
3. THE Onboarding_Flow SHALL present a curriculum selector with options: CAPS, IEB, and Cambridge, with no option pre-selected by default
4. WHEN the student submits the onboarding form with valid inputs (name passes character and length validation after trimming, and a curriculum option is selected), THE Onboarding_Flow SHALL create a new profile via the Profile_Manager and set it as the Active_Profile
5. WHEN onboarding is complete, THE application SHALL replace the subtitle "MATTEO'S MATH MISSION" on the menu screen with the Active_Profile's name in uppercase followed by "'S MATH MISSION"
6. THE Onboarding_Flow SHALL display only once per profile — subsequent launches with an existing Active_Profile SHALL skip directly to the menu screen
7. WHEN the onboarding form is submitted with a name field that is empty or contains only whitespace after trimming, THE Onboarding_Flow SHALL display a validation message indicating a name is required and prevent submission
8. IF the onboarding form is submitted without a curriculum option selected, THEN THE Onboarding_Flow SHALL display a validation message indicating a curriculum selection is required and prevent submission
9. IF the profile creation fails due to a Storage_API write error, THEN THE Onboarding_Flow SHALL display an error message indicating the profile could not be saved and allow the student to retry submission without losing entered data

### Requirement 4: Progressive Web App (Installable and Offline)

**User Story:** As a student, I want to install the app on my phone's home screen and use it offline, so that I can practice algebra without needing an internet connection after the first load.

#### Acceptance Criteria

1. THE PWA_Manifest SHALL include: app name ("Algebra Assault"), short name ("AlgebraAssault"), start URL, display mode "standalone", theme color, background color, and at least 3 icon sizes (192×192, 384×384, 512×512)
2. THE Service_Worker SHALL cache the app shell (HTML, CSS, JS bundles, icons) during the Service Worker install event using a cache-first strategy, so that all cached assets are available before the Service Worker activates
3. THE Service_Worker SHALL cache question data (the Seed_Questions from the Question_Data_Module bundled in the JS output) for offline access
4. WHEN the device is offline after the initial load, THE application SHALL function with full gameplay capability (all topic missions, exam simulator, daily challenge, progress tracking, and review mode) using cached resources and locally persisted Storage_API data
5. WHEN a new version of the application is deployed and the Service_Worker detects an updated Service Worker file, THE Service_Worker SHALL notify the application, and THE application SHALL display a non-blocking banner or toast message prompting the user to refresh, which remains visible until the user dismisses it or refreshes the page
6. IF the browser does not support Service Workers, THEN THE index.html SHALL skip Service Worker registration without displaying an error, and the application SHALL function normally as a standard web application without offline capability
7. THE index.html SHALL include a link to the PWA_Manifest in the document head
8. WHEN the browser supports the "beforeinstallprompt" event, THE application SHALL display an install button on the menu screen that triggers the browser's native install flow when tapped
9. THE Service_Worker file SHALL be located at the root of the build output (e.g., `/sw.js` or equivalent path served from the application root) to ensure its scope covers all application routes
10. IF the Service Worker cache storage write fails (e.g., quota exceeded), THEN THE Service_Worker SHALL continue operating with whatever assets are already cached and SHALL not prevent the application from loading via network fallback

### Requirement 5: Email Capture and Workbook Download

**User Story:** As a parent, I want to download a free algebra workbook for my child, so that they have additional offline practice material.

#### Acceptance Criteria

1. THE MenuScreen SHALL display a "📘 Free Workbook" button within the action buttons row (the same flex-wrap container that holds "📝 Review Mistakes" and "⚡ Daily Challenge")
2. WHEN the "📘 Free Workbook" button is tapped, THE Email_Capture_Modal SHALL appear as a centered overlay with: a text description of the workbook (maximum 2 sentences), an email input field with placeholder text, a "Send My Workbook" submit button, a privacy note stating the email will not be shared, and a close/dismiss button that returns the user to the menu without submitting
3. WHEN the email input is empty or contains a value that does not match the pattern `^[^\s@]+@[^\s@]+\.[^\s@]+$`, THE Email_Capture_Modal SHALL display a validation error message below the input field and prevent submission
4. WHEN a valid email is submitted, THE Email_Capture_Modal SHALL POST the email address to a configurable webhook URL (stored as a named constant in the source code) with a request timeout of 10 seconds
5. WHEN a valid email is submitted, THE Email_Capture_Modal SHALL immediately display a download link pointing to "/workbook.pdf" without waiting for the webhook response to complete
6. IF the webhook POST fails or times out, THEN THE application SHALL still provide the workbook download link (fire-and-forget pattern) without displaying any error to the user
7. WHEN the user taps the download link for the workbook PDF, THE application SHALL store a "workbook-downloaded" flag with a truthy value in the Active_Profile's storage namespace
8. WHILE the "workbook-downloaded" flag is set to true, THE "📘 Free Workbook" button SHALL remain accessible but display as "📘 Get Workbook" using the same base button styling as other action buttons (no additional border glow, gradient, or animation that distinguishes it from sibling buttons)
9. IF the user taps the close/dismiss control on the Email_Capture_Modal without submitting, THEN THE Email_Capture_Modal SHALL close and return focus to the MenuScreen without storing any flag or sending any request

### Requirement 6: Landing Screen

**User Story:** As a first-time visitor, I want to understand what Algebra Assault offers before I start playing, so that I can decide if it is right for my child.

#### Acceptance Criteria

1. WHEN the application loads and the parent disclaimer has not been dismissed, THE Landing_Screen SHALL display as the first step in the onboarding flow, appearing before the Disclaimer_Screen, within the same full-screen overlay pattern (absolute inset-0, z-50, centered content panel) used by the disclaimer modal
2. THE Landing_Screen SHALL display the following information as visible text content: the product value proposition (algebra practice through gaming), target audience (Grade 10 students), supported curricula (CAPS, IEB, Cambridge), and key features (6 topics, boss fights, progress tracking, exam simulator)
3. THE Landing_Screen SHALL include a single primary call-to-action button labeled "Start Playing" that occupies the full width of the content panel and advances the user to the Disclaimer_Screen (the next step in the onboarding flow)
4. WHEN the user taps the "Start Playing" button, THE Landing_Screen SHALL transition to the Disclaimer_Screen without persisting any dismissal state, so that the Landing_Screen reappears on every new session until the disclaimer itself is dismissed
5. IF the parent disclaimer has already been dismissed (Storage_API contains a truthy value for "disclaimer-dismissed"), THEN THE Landing_Screen SHALL not be displayed and the application SHALL proceed directly to the menu screen
6. THE Landing_Screen SHALL render all content within a single scrollable column that fits within a 320px-wide viewport without horizontal overflow, and all interactive elements SHALL have a minimum touch target size of 44×44 CSS pixels
