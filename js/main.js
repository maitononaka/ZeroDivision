import { bindUI, state } from '../ui.js';

// IMPORTANT: Keep the title/deploy UI independent from Three.js.
// Three.js and the game module are loaded only after the user presses Deploy.
// This prevents a WebGL/CDN/module error from making the menu buttons unusable.
let game = null;
let gameModulePromise = null;

async function ensureGame() {
  if (game) return game;
  if (!gameModulePromise) {
    gameModulePromise = import('./game.js');
  }
  const mod = await gameModulePromise;
  if (!game) {
    game = new mod.ZeroDivisionGame();
  }
  return game;
}

bindUI(async () => {
  try {
    const instance = await ensureGame();
    await instance.start(state.map, state.bots);
  } catch (error) {
    console.error('Zero Division: deployment failed:', error);
    document.querySelectorAll('.screen').forEach(screen => screen.classList.remove('active'));
    document.getElementById('staging-screen')?.classList.add('active');
    document.getElementById('loading-screen')?.classList.remove('active');
    document.getElementById('game-ui')?.classList.add('hidden');
    if (game?.renderer?.domElement) game.renderer.domElement.style.display = 'none';

    // Do not block the UI with a native alert. Keep the app usable.
    const message = document.getElementById('deploy-error') || document.createElement('div');
    message.id = 'deploy-error';
    message.textContent = '出撃に失敗しました。F12 → Console の赤いエラーを確認してください。';
    message.style.cssText = 'position:fixed;left:50%;bottom:28px;transform:translateX(-50%);padding:12px 18px;background:#11181b;border:1px solid #aaff24;color:#fff;z-index:99999;font:13px system-ui,sans-serif;';
    if (!message.parentElement) document.body.appendChild(message);
  }
});
