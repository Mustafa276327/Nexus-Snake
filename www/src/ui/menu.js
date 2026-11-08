// Nexus Snake - Menu System

import { MODES } from '../game/config.js';
import { storage } from '../game/storage.js';
import { engine } from '../game/engine.js';
import { toast } from './toast.js';
import { SKINS, getSkin } from '../game/arena/skins.js';

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
    this.unlockedModes = ['arena', 'classic'];

    this.bindEvents();
    this.initSkinPicker();
  }

  initSkinPicker() {
    const picker = document.getElementById('skinPicker');
    if (!picker) return;
    let selected = SKINS[0].id;
    try { selected = JSON.parse(localStorage.getItem('ns_arena_skin')) || selected; } catch { /* ignore */ }

    picker.innerHTML = SKINS.map((s) => `
      <button class="skin-chip ${s.id === selected ? 'selected' : ''}" data-skin="${s.id}" type="button" style="--skin-glow:${s.glow};--skin-a:${s.colors[0]};--skin-b:${s.colors[1]}">
        <span class="skin-emoji">${s.emoji}</span>
        <span class="skin-name">${s.name}</span>
      </button>
    `).join('');

    picker.addEventListener('click', async (e) => {
      const chip = e.target.closest('.skin-chip');
      if (!chip) return;
      const id = chip.dataset.skin;
      picker.querySelectorAll('.skin-chip').forEach((c) => c.classList.toggle('selected', c === chip));
      await storage.set('arena_skin', id);
      try { localStorage.setItem('ns_arena_skin', JSON.stringify(id)); } catch { /* ignore */ }
      const skin = getSkin(id);
      toast.show(`${skin.emoji} ${skin.name} seçildi`, 'success', 1200);
      if (window.__nexusAudio) window.__nexusAudio.sfx?.('click');
    });
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
    const isUnlocked = this.unlockedModes.includes(modeId) || mode.unlockScore === 0;
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
    this.hidePause();
    this.hideGameOver();
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
      statsContainer.innerHTML = stats.isArena
        ? `
        <div class="stat"><span>Kütle</span><strong>${stats.score}</strong></div>
        <div class="stat"><span>Devirdiğin</span><strong>${stats.foodEaten}</strong></div>
        <div class="stat"><span>Mod</span><strong>${stats.mode}</strong></div>
      `
        : `
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
      const gridRows = stats.isArena
        ? `
          <div class="stat"><span>En Yüksek</span><strong>${stats.highScore.toLocaleString('tr-TR')}</strong></div>
          <div class="stat"><span>Devirdiğin</span><strong>${stats.kills} rakip</strong></div>
          <div class="stat"><span>Mod</span><strong>${stats.mode}</strong></div>
          <div class="stat"><span>Tür</span><strong>Arena</strong></div>`
        : `
          <div class="stat"><span>En Yüksek</span><strong>${stats.highScore.toLocaleString('tr-TR')}</strong></div>
          <div class="stat"><span>Seviye</span><strong>${stats.level}</strong></div>
          <div class="stat"><span>Yenen Yem</span><strong>${stats.foodEaten}</strong></div>
          <div class="stat"><span>Mod</span><strong>${stats.mode}</strong></div>`;

      statsContainer.innerHTML = `
        <div class="final-score ${isNewRecord ? 'new-record' : ''}">
          <span class="score-label">${isNewRecord ? 'YENİ REKOR!' : (stats.isArena ? 'KÜTLE' : 'SON SKOR')}</span>
          <span class="score-value">${stats.score.toLocaleString('tr-TR')}</span>
        </div>
        <div class="stats-grid">${gridRows}</div>
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
      const unlocked = this.unlockedModes.includes(modeId) || (MODES[modeId]?.unlockScore === 0);
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