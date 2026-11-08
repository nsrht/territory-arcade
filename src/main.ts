import { Game } from './game';

function initialize(): void {
  const canvas = document.getElementById('game-canvas') as HTMLCanvasElement | null;
  const fpsDisplay = document.getElementById('hud-fps');
  const coordsDisplay = document.getElementById('hud-coords');

  if (!canvas || !fpsDisplay || !coordsDisplay) {
    throw new Error('Required DOM elements not found for Territory Arcade');
  }

  const game = new Game({
    canvas,
    fpsDisplay,
    coordsDisplay,
  });

  game.start();

  // Handle window unload cleanup
  window.addEventListener('beforeunload', () => {
    game.destroy();
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  initialize();
}
