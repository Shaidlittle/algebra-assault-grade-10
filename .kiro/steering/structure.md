# Project Structure

```
algebra-assault-grade-10/
├── index.html              # Entry HTML (Vite entry point)
├── package.json            # Dependencies and scripts
├── vite.config.js          # Vite config (React plugin)
├── tailwind.config.js      # Tailwind content paths
├── postcss.config.js       # PostCSS plugins (Tailwind + Autoprefixer)
├── .gitignore
├── .kiro/
│   └── steering/           # AI steering documents
└── src/
    ├── main.jsx            # React root mount + storage polyfill
    ├── App.jsx             # Entire application (single-file architecture)
    └── index.css           # Tailwind directives + global styles
```

## Architecture Notes

- **Single-component architecture**: The entire game lives in `src/App.jsx` (~2300 lines). All game logic, rendering, state, question data, and UI screens are in one file.
- **No component decomposition**: There are no separate component files. Helper components (e.g., `MathText`) are defined within App.jsx.
- **Game state**: Managed via a `useRef` (`gameRef`) for mutable game-loop state (positions, velocities, timers) and `useState` for React-rendered UI state (screens, scores, HP).
- **Rendering**: The space-shooter gameplay uses a `<canvas>` element rendered via `requestAnimationFrame`. UI overlays (menus, questions, results) are React components rendered on top.
- **Question bank**: Hardcoded in `QUESTIONS` object within App.jsx, organized by topic and difficulty tier (easy/medium/hard).

## If Refactoring

When adding features or splitting the codebase, logical separation points would be:
- Question data → `src/data/questions.js`
- Game constants → `src/constants.js`
- Canvas game loop → `src/game/engine.js`
- Sound system → `src/audio.js`
- Individual screen components → `src/screens/`
- Shared UI components → `src/components/`
