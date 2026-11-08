import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { InputHandler, TargetEventSource } from '../input';

class MockEventTarget implements TargetEventSource {
  private listeners: Map<string, Set<(e: any) => void>> = new Map();

  addEventListener(type: string, listener: (e: any) => void): void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    this.listeners.get(type)!.add(listener);
  }

  removeEventListener(type: string, listener: (e: any) => void): void {
    this.listeners.get(type)?.delete(listener);
  }

  emit(type: string, event: any): void {
    const handlers = this.listeners.get(type);
    if (handlers) {
      for (const handler of handlers) {
        handler(event);
      }
    }
  }

  listenerCount(type: string): number {
    return this.listeners.get(type)?.size ?? 0;
  }
}

describe('InputHandler', () => {
  let target: MockEventTarget;
  let input: InputHandler;

  beforeEach(() => {
    target = new MockEventTarget();
    input = new InputHandler(target);
  });

  afterEach(() => {
    input.destroy();
  });

  it('starts with neutral direction (0, 0)', () => {
    expect(input.getDirection()).toEqual({ x: 0, y: 0 });
  });

  it('registers WASD key presses and releases', () => {
    target.emit('keydown', { key: 'w', preventDefault: () => {} });
    expect(input.getDirection()).toEqual({ x: 0, y: -1 });

    target.emit('keydown', { key: 'd', preventDefault: () => {} });
    expect(input.getDirection()).toEqual({ x: 1, y: -1 });

    target.emit('keyup', { key: 'w' });
    expect(input.getDirection()).toEqual({ x: 1, y: 0 });

    target.emit('keyup', { key: 'd' });
    expect(input.getDirection()).toEqual({ x: 0, y: 0 });
  });

  it('registers Arrow key presses and releases', () => {
    target.emit('keydown', { key: 'ArrowLeft', preventDefault: () => {} });
    expect(input.getDirection()).toEqual({ x: -1, y: 0 });

    target.emit('keydown', { key: 'ArrowDown', preventDefault: () => {} });
    expect(input.getDirection()).toEqual({ x: -1, y: 1 });

    target.emit('keyup', { key: 'ArrowLeft' });
    expect(input.getDirection()).toEqual({ x: 0, y: 1 });

    target.emit('keyup', { key: 'ArrowDown' });
    expect(input.getDirection()).toEqual({ x: 0, y: 0 });
  });

  it('cancels out opposing directions', () => {
    target.emit('keydown', { key: 'a', preventDefault: () => {} });
    target.emit('keydown', { key: 'd', preventDefault: () => {} });
    expect(input.getDirection().x).toBe(0);

    target.emit('keydown', { key: 'ArrowUp', preventDefault: () => {} });
    target.emit('keydown', { key: 'ArrowDown', preventDefault: () => {} });
    expect(input.getDirection().y).toBe(0);
  });

  it('clears active keys on window blur to avoid stuck movement', () => {
    target.emit('keydown', { key: 'w', preventDefault: () => {} });
    target.emit('keydown', { key: 'd', preventDefault: () => {} });
    expect(input.getDirection()).toEqual({ x: 1, y: -1 });

    target.emit('blur', {});
    expect(input.getDirection()).toEqual({ x: 0, y: 0 });
  });

  it('cleans up event listeners on destroy', () => {
    expect(target.listenerCount('keydown')).toBe(1);
    expect(target.listenerCount('keyup')).toBe(1);
    expect(target.listenerCount('blur')).toBe(1);

    input.destroy();

    expect(target.listenerCount('keydown')).toBe(0);
    expect(target.listenerCount('keyup')).toBe(0);
    expect(target.listenerCount('blur')).toBe(0);
  });
});
