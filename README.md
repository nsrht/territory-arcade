# Territory Arcade

A browser-based 2D territory control arcade game built with TypeScript, HTML5 Canvas 2D, and Vite.

## Overview

Territory Arcade is a fast, responsive 2D arcade game built from scratch without external game engines. It utilizes native HTML5 Canvas 2D rendering, frame-rate-independent movement, delta-time clamping, and a minimal modern arcade HUD overlay.

## Technology Stack

- **TypeScript** (Strict mode)
- **Vite** (Build tool and local dev server)
- **HTML5 Canvas 2D** (Rendering)
- **CSS** (Overlay styling and full-screen layout)
- **Vitest** (Automated unit tests)

## Getting Started

### Prerequisites

- Node.js (v18+ recommended)
- npm

### Installation

```bash
npm install
```

### Development Server

Start the local development server:

```bash
npm run dev
```

Open the printed URL (typically `http://localhost:5173`) in your browser.

### Production Build

Typecheck and create an optimized production build in `dist/`:

```bash
npm run build
```

Preview the production build locally:

```bash
npm run preview
```

### Running Automated Tests

Run the test suite using Vitest:

```bash
npm test
```

## Architecture

The project maintains a simple, modular architecture separating concerns into clean modules:

- `src/types.ts`: Type definitions (`Vector2D`, `Viewport`, `PlayerState`, `GameConfig`) and default configuration values.
- `src/input.ts`: Input handler managing WASD and arrow key states, key cancellation, window focus/blur recovery, and clean event listener lifecycle.
- `src/movement.ts`: Pure functional math for 2D vector normalization, delta-time displacement, and circular perimeter boundary clamping (including graceful centering on sub-diameter viewports).
- `src/renderer.ts`: Canvas 2D rendering pipeline managing `devicePixelRatio` scaling, sharp grid rendering (`#111827` background, `#1f2937` lines), and circular player rendering (`#10b981`). Uses `setTransform` on every resize to avoid cumulative scaling matrix corruption.
- `src/game.ts`: Game loop coordinator driving `requestAnimationFrame`, delta-time calculation with maximum threshold clamping (0.1s), interval-throttled HUD updates (FPS and coordinates), and window resize handling.
- `src/main.ts`: Application bootstrap and DOM wiring.

## Controls

| Action | Primary Key | Secondary Key |
| --- | --- | --- |
| Move Up | `W` | `Up Arrow` |
| Move Down | `S` | `Down Arrow` |
| Move Left | `A` | `Left Arrow` |
| Move Right | `D` | `Right Arrow` |

Diagonal movement is normalized so velocity is identical across all directions (300 CSS px/s).

## Boundaries & Constraints

- The player circular perimeter (18px radius) is strictly clamped within the visible browser viewport.
- Window resizing preserves the player's position, clamping it immediately if the new viewport shrinks beyond the player's perimeter.
- In extreme viewport sizes (smaller than the player's diameter), the player is safely centered.
