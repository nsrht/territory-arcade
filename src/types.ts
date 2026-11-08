export interface Vector2D {
  x: number;
  y: number;
}

export interface Viewport {
  width: number;
  height: number;
  devicePixelRatio: number;
}

export interface PlayerState {
  x: number;
  y: number;
  radius: number;
  speed: number;
}

export interface GameConfig {
  playerRadius: number;
  playerSpeed: number;
  playerColor: string;
  backgroundColor: string;
  gridColor: string;
  gridSpacing: number;
  maxDeltaTime: number;
  fpsUpdateIntervalMs: number;
}

export const DEFAULT_CONFIG: GameConfig = {
  playerRadius: 18,
  playerSpeed: 300,
  playerColor: '#10b981',
  backgroundColor: '#111827',
  gridColor: '#1f2937',
  gridSpacing: 40,
  maxDeltaTime: 0.1, // 100ms max delta time to prevent physics tunneling or large leaps on tab refocus
  fpsUpdateIntervalMs: 250, // update HUD FPS 4 times a second to reduce unnecessary DOM operations
};
