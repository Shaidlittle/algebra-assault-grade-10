# Tech Stack

## Core

- **Runtime**: Browser (client-side only, no backend)
- **Language**: JavaScript (ES modules)
- **UI Framework**: React 18 with JSX
- **Styling**: Tailwind CSS 3 (utility-first)
- **Build Tool**: Vite 5
- **Package Manager**: npm

## Dependencies

| Package | Purpose |
|---------|---------|
| react / react-dom | UI framework |
| lucide-react | Icon components |
| tailwindcss | Utility CSS framework |
| autoprefixer | PostCSS vendor prefixing |
| @vitejs/plugin-react | Vite React support (Babel) |

## Commands

```bash
npm run dev      # Start dev server (Vite HMR)
npm run build    # Production build to dist/
npm run preview  # Preview production build locally
```

## Conventions

- No TypeScript — plain JSX files
- No test framework currently configured
- No router — single-page app with state-driven screens
- No state management library — React useState/useRef only
- Audio via Web Audio API (no audio files)
- Canvas rendering via HTML5 Canvas 2D API with requestAnimationFrame
- Storage abstraction via `window.storage` (localStorage polyfill in main.jsx, compatible with external storage APIs)

## Browser Targets

- Modern browsers with ES module support
- Mobile-first design (touch events, viewport meta with no user scaling)
- Requires Web Audio API support for sound effects
