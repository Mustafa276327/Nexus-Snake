// Nexus Snake - HUD (Heads-Up Display)

import { MODES } from '../game/config.js';

export class HUD {
  constructor() {
    this.scoreEl = document.getElementById('score');
    this.highScoreEl = document.getElementById('highScore');
    this.levelEl = document.getElementById('level');
    this.modeNameEl = document.getElementById('modeName');
    this.modeDescEl = document.getElementById('modeDesc');
    this.timerEl = document.getElementById('timer');
    this.powerupContainer = document.getElementById('powerupIndicators');
    this.activePowerups = new Map();
  }

  updateScore(score) {
    if (this.scoreEl) {
      this.scoreEl.textContent = score.toLocaleString();
      this.animateValue(this.scoreEl);
    }
  }

  updateHighScore(score) {
    if (this.highScoreEl) {
      this.highScoreEl.textContent = score.toLocaleString();
    }
  }

  updateLevel(level) {
    if (this.levelEl) {
      this.levelEl.textContent = level;
      this.animateValue(this.levelEl);
    }
  }

  updateMode(modeId) {
    const mode = MODES[modeId];
    if (mode && this.modeNameEl && this.modeDescEl) {
      this.modeNameEl.textContent = mode.name.toUpperCase();
      this.modeDescEl.textContent = mode.description;
    }
  }

  updateTimer(seconds) {
    if (this.timerEl) {
      this.timerEl.textContent = seconds;
    }
  }

  addPowerupIndicator(powerup) {
    if (!this.powerupContainer) return;

    const existing = this.activePowerups.get(powerup.id);
    if (existing) {
      existing.remove();
    }

    const el = document.createElement('div');
    el.className = 'powerup-indicator';
    el.dataset.powerup = powerup.id;
    el.innerHTML = `
      <span class="powerup-icon">${powerup.icon}</span>
      <span class="powerup-name">${powerup.name}</span>
      <div class="powerup-bar"><div class="powerup-fill"></div></div>
    `;
    el.style.borderColor = powerup.color;

    this.powerupContainer.appendChild(el);
    this.activePowerups.set(powerup.id, el);

    // Animate bar
    if (powerup.duration > 0) {
      const fill = el.querySelector('.powerup-fill');
      fill.style.backgroundColor = powerup.color;
      fill.style.transition = `width ${powerup.duration}ms linear`;
      requestAnimationFrame(() => {
        fill.style.width = '0%';
      });
    }
  }

  removePowerupIndicator(powerupId) {
    const el = this.activePowerups.get(powerupId);
    if (el) {
      el.style.opacity = '0';
      el.style.transform = 'translateX(20px)';
      setTimeout(() => el.remove(), 300);
      this.activePowerups.delete(powerupId);
    }
  }

  clearPowerups() {
    this.activePowerups.forEach(el => el.remove());
    this.activePowerups.clear();
  }

  animateValue(el) {
    el.style.transform = 'scale(1.2)';
    setTimeout(() => el.style.transform = 'scale(1)', 100);
  }
}

export const hud = new HUD();