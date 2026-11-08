import { GameConfig, DEFAULT_CONFIG, PlayerState, Viewport } from './types';
import { InputHandler } from './input';
import { CanvasRenderer } from './renderer';
import { updatePlayerPosition, clampPlayerToBounds } from './movement';

export interface GameElements {
  canvas: HTMLCanvasElement;
  fpsDisplay: HTMLElement;
  coordsDisplay: HTMLElement;
}

export class Game {
  private config: GameConfig;
  private canvas: HTMLCanvasElement;
  private fpsDisplay: HTMLElement;
  private coordsDisplay: HTMLElement;

  private renderer: CanvasRenderer;
  private input: InputHandler;

  private viewport: Viewport;
  private player: PlayerState;

  private animationFrameId: number | null = null;
  private lastTimestamp: number = 0;
  private isRunning: boolean = false;

  // FPS tracking
  private frameCount: number = 0;
  private lastFpsUpdateTime: number = 0;
  private currentFps: number = 0;

  private onResizeBound: () => void;

  constructor(elements: GameElements, config: Partial<GameConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.canvas = elements.canvas;
    this.fpsDisplay = elements.fpsDisplay;
    this.coordsDisplay = elements.coordsDisplay;

    this.viewport = this.getViewportSize();

    // Spawn player in the center of the viewport
    const initialCenter = clampPlayerToBounds(
      { x: this.viewport.width / 2, y: this.viewport.height / 2 },
      this.config.playerRadius,
      this.viewport.width,
      this.viewport.height
    );

    this.player = {
      x: initialCenter.x,
      y: initialCenter.y,
      radius: this.config.playerRadius,
      speed: this.config.playerSpeed,
    };

    this.renderer = new CanvasRenderer(this.canvas, this.config);
    this.input = new InputHandler();

    this.onResizeBound = this.handleResize.bind(this);
    window.addEventListener('resize', this.onResizeBound);

    this.handleResize();
  }

  private getViewportSize(): Viewport {
    return {
      width: window.innerWidth,
      height: window.innerHeight,
      devicePixelRatio: window.devicePixelRatio || 1,
    };
  }

  private handleResize(): void {
    this.viewport = this.getViewportSize();

    // Preserve player position and clamp to new boundaries
    const clamped = clampPlayerToBounds(
      { x: this.player.x, y: this.player.y },
      this.player.radius,
      this.viewport.width,
      this.viewport.height
    );
    this.player.x = clamped.x;
    this.player.y = clamped.y;

    this.renderer.resize(this.viewport);
    this.updateCoordsDisplay();
  }

  public start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastTimestamp = performance.now();
    this.lastFpsUpdateTime = this.lastTimestamp;
    this.frameCount = 0;

    this.loop(this.lastTimestamp);
  }

  public stop(): void {
    this.isRunning = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  public destroy(): void {
    this.stop();
    window.removeEventListener('resize', this.onResizeBound);
    this.input.destroy();
  }

  private loop(timestamp: number): void {
    if (!this.isRunning) return;

    // Delta time calculation in seconds
    const rawDelta = (timestamp - this.lastTimestamp) / 1000;
    this.lastTimestamp = timestamp;

    // Clamp delta time to avoid large jumps (e.g. after tab blur/focus)
    const dt = Math.min(rawDelta, this.config.maxDeltaTime);

    // Update FPS calculation
    this.updateFps(timestamp);

    // Update player movement
    const dir = this.input.getDirection();
    this.player = updatePlayerPosition(this.player, dir, dt, this.viewport);

    // Render frame
    this.renderer.render(this.player, this.viewport);

    // Update player coordinates display
    this.updateCoordsDisplay();

    this.animationFrameId = requestAnimationFrame(this.loop.bind(this));
  }

  private updateFps(timestamp: number): void {
    this.frameCount++;
    const elapsed = timestamp - this.lastFpsUpdateTime;

    if (elapsed >= this.config.fpsUpdateIntervalMs) {
      this.currentFps = Math.round((this.frameCount * 1000) / elapsed);
      this.fpsDisplay.textContent = `FPS: ${this.currentFps}`;
      this.frameCount = 0;
      this.lastFpsUpdateTime = timestamp;
    }
  }

  private updateCoordsDisplay(): void {
    this.coordsDisplay.textContent = `X: ${Math.round(this.player.x)} | Y: ${Math.round(this.player.y)}`;
  }

  // Getters for testing/inspection if needed
  public getPlayer(): Readonly<PlayerState> {
    return this.player;
  }

  public getViewport(): Readonly<Viewport> {
    return this.viewport;
  }
}
