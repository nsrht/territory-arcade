import { describe, it, expect } from 'vitest';
import {
  normalizeVector,
  calculateDisplacement,
  clampPlayerToBounds,
  updatePlayerPosition,
} from '../movement';
import { PlayerState, Viewport } from '../types';

describe('Movement & Vector Normalization', () => {
  it('returns zero vector when input is (0, 0)', () => {
    const result = normalizeVector({ x: 0, y: 0 });
    expect(result).toEqual({ x: 0, y: 0 });
  });

  it('keeps unit cardinal vectors unchanged', () => {
    expect(normalizeVector({ x: 1, y: 0 })).toEqual({ x: 1, y: 0 });
    expect(normalizeVector({ x: -1, y: 0 })).toEqual({ x: -1, y: 0 });
    expect(normalizeVector({ x: 0, y: 1 })).toEqual({ x: 0, y: 1 });
    expect(normalizeVector({ x: 0, y: -1 })).toEqual({ x: 0, y: -1 });
  });

  it('normalizes diagonal vectors to unit length (~0.7071) preventing increased speed', () => {
    const diagonalNE = normalizeVector({ x: 1, y: -1 });
    const diagonalNW = normalizeVector({ x: -1, y: -1 });
    const diagonalSE = normalizeVector({ x: 1, y: 1 });
    const diagonalSW = normalizeVector({ x: -1, y: 1 });

    const expectedComponent = 1 / Math.SQRT2; // ~0.70710678

    expect(diagonalNE.x).toBeCloseTo(expectedComponent, 5);
    expect(diagonalNE.y).toBeCloseTo(-expectedComponent, 5);

    expect(diagonalNW.x).toBeCloseTo(-expectedComponent, 5);
    expect(diagonalNW.y).toBeCloseTo(-expectedComponent, 5);

    expect(diagonalSE.x).toBeCloseTo(expectedComponent, 5);
    expect(diagonalSE.y).toBeCloseTo(expectedComponent, 5);

    expect(diagonalSW.x).toBeCloseTo(-expectedComponent, 5);
    expect(diagonalSW.y).toBeCloseTo(expectedComponent, 5);

    // Diagonal length must equal 1.0 exactly
    const length = Math.sqrt(diagonalNE.x ** 2 + diagonalNE.y ** 2);
    expect(length).toBeCloseTo(1.0, 5);
  });

  it('calculates frame-rate-independent displacement using delta time and speed', () => {
    const speed = 300;
    const dt = 0.016; // ~60fps
    const displacementX = calculateDisplacement({ x: 1, y: 0 }, speed, dt);
    expect(displacementX.x).toBeCloseTo(4.8, 5);
    expect(displacementX.y).toBe(0);

    const displacementDiag = calculateDisplacement({ x: 1, y: 1 }, speed, dt);
    const expectedDiagDist = speed * dt;
    const actualDiagDist = Math.sqrt(displacementDiag.x ** 2 + displacementDiag.y ** 2);
    expect(actualDiagDist).toBeCloseTo(expectedDiagDist, 5);
  });
});

describe('Boundary Constraints & Clamping', () => {
  const viewport: Viewport = { width: 800, height: 600, devicePixelRatio: 1 };
  const radius = 18;

  it('allows movement when fully inside viewport boundaries', () => {
    const pos = { x: 400, y: 300 };
    const clamped = clampPlayerToBounds(pos, radius, viewport.width, viewport.height);
    expect(clamped).toEqual({ x: 400, y: 300 });
  });

  it('clamps left boundary to radius', () => {
    const pos = { x: 5, y: 300 };
    const clamped = clampPlayerToBounds(pos, radius, viewport.width, viewport.height);
    expect(clamped.x).toBe(radius);
    expect(clamped.y).toBe(300);
  });

  it('clamps top boundary to radius', () => {
    const pos = { x: 400, y: 10 };
    const clamped = clampPlayerToBounds(pos, radius, viewport.width, viewport.height);
    expect(clamped.x).toBe(400);
    expect(clamped.y).toBe(radius);
  });

  it('clamps right boundary to width - radius', () => {
    const pos = { x: 795, y: 300 };
    const clamped = clampPlayerToBounds(pos, radius, viewport.width, viewport.height);
    expect(clamped.x).toBe(viewport.width - radius);
    expect(clamped.y).toBe(300);
  });

  it('clamps bottom boundary to height - radius', () => {
    const pos = { x: 400, y: 595 };
    const clamped = clampPlayerToBounds(pos, radius, viewport.width, viewport.height);
    expect(clamped.x).toBe(400);
    expect(clamped.y).toBe(viewport.height - radius);
  });

  it('clamps corner positions beyond borders in both axes simultaneously', () => {
    const pos = { x: -100, y: 1000 };
    const clamped = clampPlayerToBounds(pos, radius, viewport.width, viewport.height);
    expect(clamped.x).toBe(radius);
    expect(clamped.y).toBe(viewport.height - radius);
  });

  it('handles extremely small viewports smaller than player diameter safely without crashing', () => {
    // Player diameter is 36px, viewport is only 20px x 30px
    const smallViewportWidth = 20;
    const smallViewportHeight = 30;
    const pos = { x: 100, y: 100 };

    const clamped = clampPlayerToBounds(pos, radius, smallViewportWidth, smallViewportHeight);
    expect(clamped.x).toBe(smallViewportWidth / 2);
    expect(clamped.y).toBe(smallViewportHeight / 2);
  });

  it('updates player position respecting boundaries and delta time', () => {
    const player: PlayerState = {
      x: 790,
      y: 300,
      radius: 18,
      speed: 300,
    };

    // Moving right when close to the right wall (width is 800, right border is 782)
    const updated = updatePlayerPosition(player, { x: 1, y: 0 }, 0.1, viewport);
    expect(updated.x).toBe(782); // Clamped to width - radius (800 - 18)
    expect(updated.y).toBe(300);
  });
});
