# Territory Arcade — Agent Guide & Architecture Rules

This file documents the conventions, architectural structure, scope boundaries, and development workflows for agents and developers contributing to `territory-arcade`.

## Project Structure

```
├── index.html              # Entry HTML defining canvas and HUD overlay
├── src/
│   ├── types.ts            # Core data types and default configuration
│   ├── input.ts            # Input handling (WASD & Arrows, blur reset, cleanup)
│   ├── movement.ts         # Pure vector math, delta displacement, perimeter clamping
│   ├── renderer.ts         # Canvas 2D rendering, DPR scaling, grid and player drawing
│   ├── game.ts             # Game loop, requestAnimationFrame, FPS throttling, resize handling
│   ├── main.ts             # Application entry point
│   ├── style.css           # Full-screen styles and non-blocking HUD styles
│   └── __tests__/          # Vitest unit tests
│       ├── input.test.ts   # Input handling and blur reset tests
│       ├── movement.test.ts# Vector normalization and boundary clamping tests
│       └── game.test.ts    # Game loop lifecycle, HUD DOM optimization & resize tests
├── tsconfig.json           # Strict TypeScript configuration
├── vite.config.ts          # Vite & Vitest configuration
└── package.json            # Scripts and dependencies
```

## Architectural Guidelines

1. **Separation of Concerns**:
   - `movement.ts` must remain pure functions without DOM or canvas dependencies. This ensures fast, reliable unit testing.
   - `input.ts` manages keyboard input listening and state; it accepts an optional target to allow headless mock testing.
   - `renderer.ts` is purely concerned with drawing to HTML5 Canvas 2D and handling pixel sharpness and scaling via `setTransform`.
   - `game.ts` coordinates the game loop, updates, and HUD element updates.

2. **Frame-Rate Independence & Stability**:
   - Always multiply directional movement by speed and delta time.
   - Always normalize 2D directional vectors when length > 0 so diagonal movement does not grant higher speed.
   - Always clamp delta time (`maxDeltaTime = 0.1s`) in the game loop to prevent clipping or runaway physics when switching tabs.
   - Throttle HUD text updates (default: every 250ms) to avoid unnecessary DOM reflows every frame.

3. **Responsive Viewport & DPR**:
   - Viewport coordinates are strictly in CSS pixels.
   - Canvas internal buffer dimensions are scaled by `window.devicePixelRatio`, while CSS dimensions match viewport CSS pixels.
   - Always reset transformations on canvas resize using `ctx.setTransform(dpr, 0, 0, dpr, 0, 0)`.

4. **Resource Lifecycle**:
   - Any class adding event listeners (`InputHandler`, `Game`) must implement clean teardown methods (`destroy()`) that remove all listeners.

## Scope Restrictions

When implementing tasks, adhere strictly to the requested scope:
- **No external game engines** (Phaser, PixiJS, ThreeJS, etc.).
- **No React / UI frameworks** — keep HUD minimal HTML/CSS.
- **Do not introduce features out of scope** (enemies, territory capture, multiplayer, audio, etc.) unless explicitly instructed in that task.
- **Minimal dependencies** — only use `typescript`, `vite`, and `vitest`.

## Verification Commands

Run and ensure all checks pass before submitting:

```bash
# Typecheck and production bundle build
npm run build

# Automated test suite
npm test
```
