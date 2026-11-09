import { Vector2D, Viewport, PlayerState } from './types';

/**
 * Normalizes a 2D vector so diagonal movement maintains unit length (1.0).
 * Returns { x: 0, y: 0 } if input vector length is zero.
 */
export function normalizeVector(vec: Vector2D): Vector2D {
  const lengthSquared = vec.x * vec.x + vec.y * vec.y;
  if (lengthSquared === 0) {
    return { x: 0, y: 0 };
  }
  const length = Math.sqrt(lengthSquared);
  return {
    x: vec.x / length,
    y: vec.y / length,
  };
}

/**
 * Computes displacement based on directional input, speed, and delta time.
 */
export function calculateDisplacement(
  rawDirection: Vector2D,
  speed: number,
  deltaTime: number
): Vector2D {
  const normalized = normalizeVector(rawDirection);
  return {
    x: normalized.x * speed * deltaTime,
    y: normalized.y * speed * deltaTime,
  };
}

/**
 * Clamps player coordinates within viewport boundaries, ensuring the entire
 * circular perimeter stays inside.
 *
 * For extremely small viewports where dimension < 2 * radius, player is centered safely.
 */
export function clampPlayerToBounds(
  position: Vector2D,
  radius: number,
  viewportWidth: number,
  viewportHeight: number
): Vector2D {
  const minX = radius;
  const maxX = viewportWidth - radius;
  const minY = radius;
  const maxY = viewportHeight - radius;

  let x: number;
  if (minX > maxX) {
    x = Math.max(0, viewportWidth / 2);
  } else {
    x = Math.min(Math.max(position.x, minX), maxX);
  }

  let y: number;
  if (minY > maxY) {
    y = Math.max(0, viewportHeight / 2);
  } else {
    y = Math.min(Math.max(position.y, minY), maxY);
  }

  return { x, y };
}

/**
 * Updates player position given directional input, speed, delta time, and viewport bounds.
 */
export function updatePlayerPosition(
  player: PlayerState,
  rawDirection: Vector2D,
  deltaTime: number,
  viewport: Viewport
): PlayerState {
  const displacement = calculateDisplacement(rawDirection, player.speed, deltaTime);
  const targetX = player.x + displacement.x;
  const targetY = player.y + displacement.y;

  const clamped = clampPlayerToBounds(
    { x: targetX, y: targetY },
    player.radius,
    viewport.width,
    viewport.height
  );

  return {
    ...player,
    x: clamped.x,
    y: clamped.y,
  };
}
