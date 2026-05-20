# Algebra Assault

**An educational math game by MathCoach** — Grade 10 algebra practice through arcade-style gameplay.

## What it does

Students control a spaceship, fight aliens, and solve algebra questions to defeat bosses. The game adapts to each student's ability level and generates fresh questions procedurally so they never memorize answers.

**6 algebra topics:** Linear Equations, Quadratic Equations, Exponential Expressions, Exponential Equations, Inequalities, Simultaneous Equations

**Curriculum-aligned:** CAPS, IEB, Cambridge (South Africa + international)

## Key Features

- **Adaptive difficulty** — automatically adjusts question difficulty based on student performance
- **Procedural question generation** — infinite variety, 70%+ generated questions per session
- **Multi-student profiles** — isolated progress per child (up to 10 profiles)
- **Boss fights** — math questions as the weapon against bosses
- **Progress tracking** — per-topic accuracy, streaks, mastery levels, XP system
- **Daily challenges** — 3 questions per day with streak tracking
- **Exam simulator** — timed quiz mode (25s per question, 3 lives)
- **Mistake journal** — review and retry previously wrong answers
- **PWA** — installable on mobile/desktop, works offline after first load
- **Mobile-first** — touch controls, responsive design

## Tech Stack

| Layer | Technology |
|-------|-----------|
| UI Framework | React 18 (JSX) |
| Styling | Tailwind CSS 3 |
| Build | Vite 5 |
| Game Rendering | HTML5 Canvas 2D + requestAnimationFrame |
| Audio | Web Audio API (no audio files) |
| Storage | localStorage (via abstraction layer) |
| Testing | Vitest + fast-check (property-based) + Testing Library |
| Deployment | Static site (Vercel/Netlify/Cloudflare Pages) |

**No backend required.** Entirely client-side.

## Architecture

```
src/
├── App.jsx              # Main orchestrator (screen routing, game state)
├── game/                # Canvas game engine (update/draw loop, physics)
│   ├── engine.js        # Core game loop
│   ├── eventDispatcher.js # Event-driven state bridge
│   ├── canvasSetup.js   # DPI-aware canvas initialization
│   └── waveDifficulty.js # Progressive wave scaling
├── screens/             # React screen components
│   ├── MenuScreen.jsx
│   ├── PlayingScreen.jsx
│   ├── OnboardingScreen.jsx
│   ├── ProfileScreen.jsx
│   └── ... (12 screens total)
├── utils/               # Business logic modules
│   ├── profileManager.js    # Multi-user profile CRUD
│   ├── storageAdapter.js    # Namespaced storage abstraction
│   ├── adaptiveDifficulty.js
│   ├── progressTracker.js
│   ├── mistakeJournal.js
│   ├── xpSystem.js
│   └── ... (12 modules total)
├── data/                # Question bank + procedural generator
│   ├── questions.js     # 108 curated seed questions
│   └── questionGenerator.js # Procedural generation (6 topics × 3 difficulties)
└── components/          # Shared UI components
```

## Test Coverage

- **260 tests** across 32 test files
- **Property-based tests** (fast-check) for mathematical correctness, storage invariants, and input validation
- **Component tests** (@testing-library/react) for UI behavior
- **Unit tests** for all utility modules

```bash
npm test        # Run full suite
npm run build   # Production build
npm run dev     # Development server
```

## Running Locally

```bash
npm install
npm run dev     # → http://localhost:5173
```

## Production Build

```bash
npm run build   # Outputs to dist/
npm run preview # Preview production build
```

## Design Decisions

1. **No backend** — All data persists in localStorage. Reduces infrastructure cost to zero and enables offline play.
2. **Procedural generation** — Prevents answer memorization. Each session is 70%+ fresh questions.
3. **Adaptive difficulty** — Streak-based promotion/demotion keeps students in their zone of proximal development.
4. **Event-driven game loop** — Canvas rendering decoupled from React state via an event dispatcher pattern.
5. **PWA-first** — Installable, offline-capable. Students can practice without internet after first load.
6. **Profile isolation** — Each student's data is namespaced in storage. No cross-contamination.

## Roadmap

- [ ] Analytics integration (usage tracking, learning outcomes)
- [ ] Parent dashboard with progress reports
- [ ] Additional grade levels (Grade 8, 9, 11, 12)
- [ ] Multiplayer challenges
- [ ] Backend sync for cross-device progress

---

Built by **MathCoach** · hello@mathcoach.co.za
