// Nexus Snake - Menu System

import { MODES } from '../game/config.js';
import { storage } from '../game/storage.js';
import { engine } from '../game/engine.js';
import { toast } from './toast.js';

export class Menu {
  constructor() {
    this.menuOverlay = document.getElementById('menuOverlay');
    this.pauseOverlay = document.getElementById('pauseOverlay');
    this.gameOverOverlay = document.getElementById('gameOverOverlay');
    this.settingsOverlay = document.getElementById('settingsOverlay');
    this.modeCards = document.querySelectorAll('.mode-card');
    this.startBtn = document.getElementById('startBtn');
    this.settingsBtn = document.getElementById('settingsBtn');
    this.resumeBtn = document.getElementById('resumeBtn');
    this.restartBtn = document.getElementById('restartBtn');
    this.quitBtn = document.getElementById('quitBtn');
    this.playAgainBtn = document.getElementById('playAgainBtn');
    this.changeModeBtn = document.getElementById('changeModeBtn');
    this.mainMenuBtn = document.getElementById('mainMenuBtn');
    this.closeSettingsBtn = document.getElementById('closeSettingsBtn');

    this.selectedMode = 'classic';
    this.unlockedModes = ['classic'];

    this.bindEvents();
  }

  bindEvents() {
    // Mode selection
    this.modeCards.forEach(card => {
      card.addEventListener('click', () => this.selectMode(card.dataset.mode));
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          this.selectMode(card.dataset.mode);
        }
      });
    });

    // Main menu buttons
    this.startBtn?.addEventListener('click', () => this.startGame());
    this.settingsBtn?.addEventListener('click', () => this.showSettings());

    // Pause menu buttons
    this.resumeBtn?.addEventListener('click', () => engine.resume());
    this.restartBtn?.addEventListener('click', () => engine.restart());
    this.quitBtn?.addEventListener('click', () => engine.quitToMenu());

    // Game over buttons
    this.playAgainBtn?.addEventListener('click', () => engine.restart());
    this.changeModeBtn?.addEventListener('click', () => this.show());
    this.mainMenuBtn?.addEventListener('click', () => engine.quitToMenu());

    // Settings
    this.closeSettingsBtn?.addEventListener('click', () => this.hideSettings());

    // Keyboard navigation
    document.addEventListener('keydown', (e) => this.handleKeydown(e));
  }

  handleKeydown(e) {
    if (this.menuOverlay && !this.menuOverlay.classList.contains('hidden')) {
      if (e.key === 'Enter' && document.activeElement === this.startBtn) {
        this.startGame();
      } else if (e.key === 'Escape') {
        engine.quitToMenu();
      }
    }
    if (this.pauseOverlay && !this.pauseOverlay.classList.contains('hidden')) {
      if (e.key === 'Escape' || e.key === ' ') {
        e.preventDefault();
        engine.resume();
      }
    }
    if (this.settingsOverlay && !this.settingsOverlay.classList.contains('hidden')) {
      if (e.key === 'Escape') {
        this.hideSettings();
      }
    }
  }

  async selectMode(modeId) {
    const mode = MODES[modeId];
    if (!mode) return;

    // Check if unlocked
    const isUnlocked = this.unlockedModes.includes(modeId);
    if (!isUnlocked) {
      toast.show(`${mode.name} modu kilitli! ${mode.unlockScore} puan gerekiyor.`, 'warning');
      return;
    }

    this.selectedMode = modeId;

    // Update UI
    this.modeCards.forEach(card => {
      const selected = card.dataset.mode === modeId;
      card.setAttribute('aria-selected', selected);
      card.classList.toggle('selected', selected);
    });
  }

  async startGame() {
    this.hide();
    await engine.start(this.selectedMode);
  }

  show() {
    this.menuOverlay.classList.remove('hidden');
    this.menuOverlay.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';

    // Focus start button
    setTimeout(() => this.startBtn?.focus(), 100);
  }

  hide() {
    this.menuOverlay.classList.add('hidden');
    this.menuOverlay.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  showPause(stats) {
    const statsContainer = document.getElementById('pauseStats');
    if (statsContainer) {
      statsContainer.innerHTML = `
        <div class="stat"><span>Skor</span><strong>${stats.score}</strong></div>
        <div class="stat"><span>Seviye</span><strong>${stats.level}</strong></div>
        <div class="stat"><span>Yem</span><strong>${stats.foodEaten}</strong></div>
        <div class="stat"><span>Mod</span><strong>${stats.mode}</strong></div>
      `;
    }
    this.pauseOverlay.classList.remove('hidden');
    this.pauseOverlay.setAttribute('aria-hidden', 'false');
    this.resumeBtn?.focus();
  }

  hidePause() {
    this.pauseOverlay.classList.add('hidden');
    this.pauseOverlay.setAttribute('aria-hidden', 'true');
  }

  async showGameOver(stats, isNewRecord) {
    const statsContainer = document.getElementById('finalStats');
    if (statsContainer) {
      statsContainer.innerHTML = `
        <div class="final-score ${isNewRecord ? 'new-record' : ''}">
          <span class="score-label">${isNewRecord ? 'YENİ REKOR!' : 'SON SKOR'}</span>
          <span class="score-value">${stats.score.toLocaleString()}</span>
        </div>
        <div class="stats-grid">
          <div class="stat"><span>En Yüksek</span><strong>${stats.highScore.toLocaleString()}</strong></div>
          <div class="stat"><span>Seviye</span><strong>${stats.level}</strong></div>
          <div class="stat"><span>Yenen Yem</span><strong>${stats.foodEaten}</strong></div>
          <div class="stat"><span>Mod</span><strong>${stats.mode}</strong></div>
        </div>
      `;
    }
    this.gameOverOverlay.classList.remove('hidden');
    this.gameOverOverlay.setAttribute('aria-hidden', 'false');
    this.playAgainBtn?.focus();
  }

  hideGameOver() {
    this.gameOverOverlay.classList.add('hidden');
    this.gameOverOverlay.setAttribute('aria-hidden', 'true');
  }

  showSettings() {
    this.hide();
    this.settingsOverlay.classList.remove('hidden');
    this.settingsOverlay.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    this.closeSettingsBtn?.focus();
  }

  hideSettings() {
    this.settingsOverlay.classList.add('hidden');
    this.settingsOverlay.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    this.show(); // Return to main menu
  }

  async setSelectedMode(modeId) {
    this.selectedMode = modeId;
    this.modeCards.forEach(card => {
      const selected = card.dataset.mode === modeId;
      card.setAttribute('aria-selected', selected);
      card.classList.toggle('selected', selected);
    });
  }

  async loadUnlockedModes() {
    this.unlockedModes = await storage.getUnlockedModes();
    this.updateModeCards();
  }

  updateModeCards() {
    this.modeCards.forEach(card => {
      const modeId = card.dataset.mode;
      const unlocked = this.unlockedModes.includes(modeId);
      const badge = card.querySelector('.mode-badge');

      if (unlocked) {
        card.classList.remove('locked');
        card.removeAttribute('aria-disabled');
        if (badge) {
          badge.textContent = 'HAZIR';
          badge.classList.remove('locked');
        }
      } else {
        card.classList.add('locked');
        card.setAttribute('aria-disabled', 'true');
        if (badge) {
          badge.textContent = 'KİLİTLİ';
          badge.classList.add('locked');
        }
      }
    });
  }
}

export const menu = new Menu();