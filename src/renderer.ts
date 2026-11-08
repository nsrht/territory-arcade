import { Viewport, PlayerState, GameConfig } from './types';

/**
 * Handles Canvas 2D rendering with devicePixelRatio scaling, sharp grid lines,
 * and player rendering.
 */
export class CanvasRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private config: GameConfig;

  constructor(canvas: HTMLCanvasElement, config: GameConfig) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to obtain 2D rendering context from canvas');
    }
    this.ctx = ctx;
    this.config = config;
  }

  /**
   * Resizes the canvas backing buffer based on devicePixelRatio and CSS display size.
   * Resets transformations using setTransform to avoid accumulating scale factors.
   */
  public resize(viewport: Viewport): void {
    const { width, height, devicePixelRatio } = viewport;

    // Buffer pixel dimensions
    this.canvas.width = Math.round(width * devicePixelRatio);
    this.canvas.height = Math.round(height * devicePixelRatio);

    // CSS display dimensions
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;

    // Reset and apply transformation cleanly
    this.ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
  }

  /**
   * Renders the entire game frame: background, grid, and player.
   */
  public render(player: PlayerState, viewport: Viewport): void {
    const { width, height } = viewport;

    // 1. Clear & Dark Background
    this.ctx.fillStyle = this.config.backgroundColor;
    this.ctx.fillRect(0, 0, width, height);

    // 2. Visible Grid Lines
    this.renderGrid(width, height);

    // 3. Player Circle
    this.renderPlayer(player);
  }

  /**
   * Draws a regular grid across the viewport.
   * Offset lines by 0.5px for crisp 1px strokes on canvas.
   */
  private renderGrid(width: number, height: number): void {
    const spacing = this.config.gridSpacing;
    if (spacing <= 0) return;

    this.ctx.save();
    this.ctx.strokeStyle = this.config.gridColor;
    this.ctx.lineWidth = 1;
    this.ctx.beginPath();

    // Vertical lines
    for (let x = 0; x <= width; x += spacing) {
      const lineX = Math.floor(x) + 0.5;
      this.ctx.moveTo(lineX, 0);
      this.ctx.lineTo(lineX, height);
    }

    // Horizontal lines
    for (let y = 0; y <= height; y += spacing) {
      const lineY = Math.floor(y) + 0.5;
      this.ctx.moveTo(0, lineY);
      this.ctx.lineTo(width, lineY);
    }

    this.ctx.stroke();
    this.ctx.restore();
  }

  /**
   * Draws the circular player.
   */
  private renderPlayer(player: PlayerState): void {
    if (player.radius <= 0) return;

    this.ctx.save();
    this.ctx.fillStyle = this.config.playerColor;
    this.ctx.beginPath();
    this.ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.restore();
  }
}
