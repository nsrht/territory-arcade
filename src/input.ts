import { Vector2D } from './types';

/**
 * Handles keyboard input for player movement and manages window focus/blur.
 */
export interface TargetEventSource {
  addEventListener(type: string, listener: (event: any) => void): void;
  removeEventListener(type: string, listener: (event: any) => void): void;
}

export class InputHandler {
  private activeKeys: Set<string> = new Set();
  private target: TargetEventSource | null = null;
  private onKeyDownBound: (e: KeyboardEvent) => void;
  private onKeyUpBound: (e: KeyboardEvent) => void;
  private onBlurBound: () => void;

  constructor(target?: TargetEventSource) {
    this.onKeyDownBound = this.handleKeyDown.bind(this);
    this.onKeyUpBound = this.handleKeyUp.bind(this);
    this.onBlurBound = this.handleBlur.bind(this);

    const eventTarget = target ?? (typeof window !== 'undefined' ? window : null);
    this.target = eventTarget;

    if (this.target) {
      this.target.addEventListener('keydown', this.onKeyDownBound);
      this.target.addEventListener('keyup', this.onKeyUpBound);
      this.target.addEventListener('blur', this.onBlurBound);
    }
  }

  private handleKeyDown(e: KeyboardEvent): void {
    // Prevent default scrolling for arrow keys
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
      e.preventDefault();
    }
    this.activeKeys.add(e.key.toLowerCase());
  }

  private handleKeyUp(e: KeyboardEvent): void {
    this.activeKeys.delete(e.key.toLowerCase());
  }

  /**
   * Clears all held keys when window loses focus to avoid stuck input.
   */
  private handleBlur(): void {
    this.activeKeys.clear();
  }

  /**
   * Returns the raw 2D direction intent based on currently pressed keys.
   */
  public getDirection(): Vector2D {
    let dx = 0;
    let dy = 0;

    const isLeft = this.activeKeys.has('a') || this.activeKeys.has('arrowleft');
    const isRight = this.activeKeys.has('d') || this.activeKeys.has('arrowright');
    const isUp = this.activeKeys.has('w') || this.activeKeys.has('arrowup');
    const isDown = this.activeKeys.has('s') || this.activeKeys.has('arrowdown');

    if (isLeft && !isRight) {
      dx -= 1;
    } else if (isRight && !isLeft) {
      dx += 1;
    }

    if (isUp && !isDown) {
      dy -= 1;
    } else if (isDown && !isUp) {
      dy += 1;
    }

    return { x: dx, y: dy };
  }

  /**
   * Removes all event listeners.
   */
  public destroy(): void {
    if (this.target) {
      this.target.removeEventListener('keydown', this.onKeyDownBound);
      this.target.removeEventListener('keyup', this.onKeyUpBound);
      this.target.removeEventListener('blur', this.onBlurBound);
      this.target = null;
    }
    this.activeKeys.clear();
  }
}
