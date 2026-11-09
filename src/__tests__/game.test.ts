import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Game, GameElements } from '../game';

describe('Game class regression and optimization tests', () => {
  let canvas: HTMLCanvasElement;
  let fpsDisplay: HTMLElement;
  let coordsDisplay: HTMLElement;
  let elements: GameElements;

  // Mock requestAnimationFrame / cancelAnimationFrame
  let rafCallbacks: Map<number, FrameRequestCallback>;
  let rafIdCounter: number;

  // Window event listeners store
  let windowListeners: Map<string, Set<(e: any) => void>>;

  beforeEach(() => {
    rafCallbacks = new Map();
    rafIdCounter = 0;
    windowListeners = new Map();

    const mockAddEventListener = (type: string, listener: (e: any) => void) => {
      if (!windowListeners.has(type)) {
        windowListeners.set(type, new Set());
      }
      windowListeners.get(type)!.add(listener);
    };

    const mockRemoveEventListener = (type: string, listener: (e: any) => void) => {
      windowListeners.get(type)?.delete(listener);
    };

    const mockDispatchEvent = (event: any) => {
      const type = event.type;
      const listeners = windowListeners.get(type);
      if (listeners) {
        for (const fn of listeners) {
          fn(event);
        }
      }
      return true;
    };

    const mockWindow = {
      innerWidth: 800,
      innerHeight: 600,
      devicePixelRatio: 1,
      addEventListener: vi.fn(mockAddEventListener),
      removeEventListener: vi.fn(mockRemoveEventListener),
      dispatchEvent: vi.fn(mockDispatchEvent),
      requestAnimationFrame: vi.fn((cb: FrameRequestCallback) => {
        const id = ++rafIdCounter;
        rafCallbacks.set(id, cb);
        return id;
      }),
      cancelAnimationFrame: vi.fn((id: number) => {
        rafCallbacks.delete(id);
      }),
    };

    vi.stubGlobal('window', mockWindow);
    vi.stubGlobal('requestAnimationFrame', mockWindow.requestAnimationFrame);
    vi.stubGlobal('cancelAnimationFrame', mockWindow.cancelAnimationFrame);

    class MockKeyboardEvent {
      type: string;
      key: string;
      constructor(type: string, init: { key: string }) {
        this.type = type;
        this.key = init.key;
      }
      preventDefault() {}
    }
    vi.stubGlobal('KeyboardEvent', MockKeyboardEvent);

    class MockEvent {
      type: string;
      constructor(type: string) {
        this.type = type;
      }
    }
    vi.stubGlobal('Event', MockEvent);

    // Mock HTMLCanvasElement and 2D context
    const mockContext = {
      fillRect: vi.fn(),
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      stroke: vi.fn(),
      arc: vi.fn(),
      fill: vi.fn(),
      save: vi.fn(),
      restore: vi.fn(),
      setTransform: vi.fn(),
      fillStyle: '',
      strokeStyle: '',
      lineWidth: 1,
    } as unknown as CanvasRenderingContext2D;

    canvas = {
      getContext: vi.fn().mockReturnValue(mockContext),
      style: {},
      width: 0,
      height: 0,
    } as unknown as HTMLCanvasElement;

    // Track textContent property assignments
    let fpsText = '';
    fpsDisplay = {
      set textContent(val: string) {
        fpsText = val;
      },
      get textContent() {
        return fpsText;
      },
    } as unknown as HTMLElement;

    let coordsText = '';
    const coordsSetSpy = vi.fn((val: string) => {
      coordsText = val;
    });
    coordsDisplay = {
      set textContent(val: string) {
        coordsSetSpy(val);
      },
      get textContent() {
        return coordsText;
      },
    } as unknown as HTMLElement;
    (coordsDisplay as any)._setSpy = coordsSetSpy;

    elements = { canvas, fpsDisplay, coordsDisplay };
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  function stepFrame(time: number) {
    const callbacks = Array.from(rafCallbacks.entries());
    rafCallbacks.clear();
    for (const [, cb] of callbacks) {
      cb(time);
    }
  }

  it('calling start() twice does not create duplicate animation loops', () => {
    const game = new Game(elements);

    game.start();
    expect(window.requestAnimationFrame).toHaveBeenCalledTimes(1);

    // Call start again while already running
    game.start();
    expect(window.requestAnimationFrame).toHaveBeenCalledTimes(1);

    game.destroy();
  });

  it('calling stop() cancels the pending animation frame and halts execution', () => {
    const game = new Game(elements);
    game.start();

    expect(rafCallbacks.size).toBe(1);

    game.stop();
    expect(window.cancelAnimationFrame).toHaveBeenCalledTimes(1);
    expect(rafCallbacks.size).toBe(0);

    // Stepping a frame after stop should not trigger more RAF calls
    stepFrame(100);
    expect(rafCallbacks.size).toBe(0);

    game.destroy();
  });

  it('restarting the game resets delta-time tracking without delta spikes', () => {
    const game = new Game(elements, { playerSpeed: 100 });
    const initialPos = { ...game.getPlayer() };

    game.start();
    // First frame at t = 1000: delta should be 0 because lastTimestamp was 0
    stepFrame(1000);
    const posAfterFirstFrame = game.getPlayer();
    expect(posAfterFirstFrame.x).toBe(initialPos.x);

    // Simulate movement
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'd' }));

    // Frame at t = 1100 (dt = 0.1s -> 100 px/s * 0.1s = 10px)
    stepFrame(1100);
    expect(game.getPlayer().x).toBeCloseTo(initialPos.x + 10, 1);

    // Stop the game
    game.stop();

    // Long pause (e.g. 5 seconds later)
    game.start();

    // Restart frame at t = 6100 (after 5s pause)
    // If not reset, dt would be clamped to 0.1s or jump 5s. With reset, first frame dt is 0.
    const posBeforeRestartFrame = game.getPlayer().x;
    stepFrame(6100);
    expect(game.getPlayer().x).toBe(posBeforeRestartFrame);

    // Next frame at t = 6116 (dt = 0.016s)
    stepFrame(6116);
    expect(game.getPlayer().x).toBeCloseTo(posBeforeRestartFrame + 100 * 0.016, 1);

    window.dispatchEvent(new KeyboardEvent('keyup', { key: 'd' }));
    game.destroy();
  });

  it('calling destroy() cleans up resize listeners and input listeners', () => {
    const game = new Game(elements);

    expect(windowListeners.get('resize')?.size).toBe(1);
    expect(windowListeners.get('keydown')?.size).toBe(1);
    expect(windowListeners.get('keyup')?.size).toBe(1);
    expect(windowListeners.get('blur')?.size).toBe(1);

    game.destroy();

    expect(windowListeners.get('resize')?.size).toBe(0);
    expect(windowListeners.get('keydown')?.size).toBe(0);
    expect(windowListeners.get('keyup')?.size).toBe(0);
    expect(windowListeners.get('blur')?.size).toBe(0);
  });

  it('coordinate HUD text is not rewritten when displayed coordinates are unchanged', () => {
    const game = new Game(elements);
    const coordsSpy = (coordsDisplay as any)._setSpy;

    // Initially called during handleResize in constructor
    expect(coordsSpy).toHaveBeenCalledTimes(1);
    expect(coordsDisplay.textContent).toBe('X: 400 | Y: 300');

    game.start();

    // Step frames without player movement
    stepFrame(100);
    stepFrame(200);
    stepFrame(300);

    // Since player hasn't moved, coordsDisplay.textContent should NOT have been set again
    expect(coordsSpy).toHaveBeenCalledTimes(1);

    game.destroy();
  });

  it('coordinate HUD updates when rounded player coordinates change', () => {
    const game = new Game(elements, { playerSpeed: 300 });
    const coordsSpy = (coordsDisplay as any)._setSpy;

    expect(coordsSpy).toHaveBeenCalledTimes(1);

    game.start();
    // First frame initializes lastTimestamp = 1000, dt = 0
    stepFrame(1000);

    // Press right ('d')
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'd' }));

    // Move for 0.05 seconds (50ms): displacement = 300 * 0.05 = 15px -> X moves from 400 to 415
    stepFrame(1050);

    expect(coordsSpy).toHaveBeenCalledTimes(2);
    expect(coordsDisplay.textContent).toBe('X: 415 | Y: 300');

    window.dispatchEvent(new KeyboardEvent('keyup', { key: 'd' }));
    game.destroy();
  });

  it('preserves and immediately clamps player position on viewport resize', () => {
    const game = new Game(elements);

    expect(game.getPlayer().x).toBe(400);
    expect(game.getPlayer().y).toBe(300);

    // Shrink window width to 200, height to 200
    (window as any).innerWidth = 200;
    (window as any).innerHeight = 200;
    window.dispatchEvent(new Event('resize'));

    // Radius is 18, so player at (400, 300) must be clamped to (182, 182)
    expect(game.getPlayer().x).toBe(182);
    expect(game.getPlayer().y).toBe(182);

    // Resize should force immediate HUD update
    expect(coordsDisplay.textContent).toBe('X: 182 | Y: 182');

    game.destroy();
  });
});
