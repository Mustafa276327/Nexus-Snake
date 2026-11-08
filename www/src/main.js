// Nexus Snake - Main Entry Point

import { engine } from './game/engine.js';
import { storage } from './game/storage.js';
import { renderer } from './game/renderer.js';
import { inputManager } from './game/input.js';
import { menu } from './ui/menu.js';
import { settingsUI } from './ui/settings.js';
import { hud } from './ui/hud.js';
import { toast } from './ui/toast.js';
import { arenaAudio } from './game/arena/audio.js';

// Global error handler
window.addEventListener('error', (e) => {
  console.error('Global error:', e.error);
  toast.show('Bir hata oluştu. Konsolu kontrol edin.', 'error');
});

window.addEventListener('unhandledrejection', (e) => {
  console.error('Unhandled rejection:', e.reason);
  toast.show('Beklenmeyen hata oluştu.', 'error');
});

// Initialize everything
async function init() {
  try {
    // Initialize engine (which initializes storage, renderer, input)
    await engine.init();

    // Initialize UI components
    await menu.loadUnlockedModes();
    await settingsUI.init();

    // Original runtime-generated music & SFX
    window.__nexusAudio = arenaAudio;
    try {
      const settings = await storage.getSettings();
      arenaAudio.enabled = settings.sound !== false;
    } catch { /* ignore */ }
    const unlockAudio = () => {
      if (arenaAudio.enabled) arenaAudio.init();
    };
    window.addEventListener('pointerdown', unlockAudio, { once: true });
    window.addEventListener('keydown', unlockAudio, { once: true });

    // Set up global callbacks
    engine.onScoreChange = (score) => hud.updateScore(score);
    engine.onLevelChange = (level) => hud.updateLevel(level);
    engine.onStateChange = (current, previous) => {
      if (current === 'playing' && previous === 'menu') {
        hud.clearPowerups();
      }
    };

    // Handle Capacitor ready
    if (window.Capacitor) {
      try {
        await window.Capacitor.Plugins.SplashScreen.hide();
      } catch {}
    }

    console.log('Nexus Snake ready!');
    toast.show('Nexus Snake yüklendi! 🎮', 'success', 2000);

  } catch (error) {
    console.error('Initialization failed:', error);
    toast.show('Oyun başlatılamadı: ' + error.message, 'error');
  }
}

// Start when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

// Expose for debugging
window.NexusSnake = {
  engine,
  storage,
  renderer,
  inputManager,
  menu,
  settingsUI,
  hud,
  toast
};

// Service Worker registration for offline support
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // SW optional, ignore failure
    });
  });
}