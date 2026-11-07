// Nexus Snake - Settings UI

import { storage } from '../game/storage.js';
import { THEMES, DEFAULT_SETTINGS } from '../game/config.js';
import { renderer } from '../game/renderer.js';
import { inputManager } from '../game/input.js';
import { engine } from '../game/engine.js';
import { toast } from './toast.js';

export class SettingsUI {
  constructor() {
    this.themeOptions = document.querySelectorAll('.theme-option');
    this.soundToggle = document.getElementById('soundToggle');
    this.hapticsToggle = document.getElementById('hapticsToggle');
    this.controlRadios = document.querySelectorAll('input[name="control"]');
    this.clearDataBtn = document.getElementById('clearDataBtn');

    this.currentSettings = { ...DEFAULT_SETTINGS };
    this.bindEvents();
  }

  async init() {
    this.currentSettings = await storage.getSettings();
    this.applySettings();
    this.updateUI();
  }

  bindEvents() {
    // Theme selection
    this.themeOptions.forEach(option => {
      option.addEventListener('click', () => this.setTheme(option.dataset.theme));
      option.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          this.setTheme(option.dataset.theme);
        }
      });
    });

    // Toggles
    this.soundToggle?.addEventListener('change', () => this.setSetting('sound', this.soundToggle.checked));
    this.hapticsToggle?.addEventListener('change', () => this.setSetting('haptics', this.hapticsToggle.checked));

    // Control scheme
    this.controlRadios.forEach(radio => {
      radio.addEventListener('change', () => this.setControlScheme(radio.value));
    });

    // Clear data
    this.clearDataBtn?.addEventListener('click', () => this.confirmClearData());
  }

  applySettings() {
    // Theme
    renderer.setTheme(this.currentSettings.theme);

    // Sound - handled by audio system (not implemented yet)
    // Haptics - handled by engine

    // Controls
    inputManager.setControlScheme(this.currentSettings.controls);

    // Grid
    renderer.setShowGrid(this.currentSettings.showGrid);
  }

  updateUI() {
    // Theme
    this.themeOptions.forEach(option => {
      const input = option.querySelector('input');
      input.checked = option.dataset.theme === this.currentSettings.theme;
      option.classList.toggle('selected', input.checked);
    });

    // Toggles
    if (this.soundToggle) this.soundToggle.checked = this.currentSettings.sound;
    if (this.hapticsToggle) this.hapticsToggle.checked = this.currentSettings.haptics;

    // Controls
    this.controlRadios.forEach(radio => {
      radio.checked = radio.value === this.currentSettings.controls;
    });
  }

  async setTheme(themeName) {
    if (!THEMES[themeName]) return;

    this.currentSettings.theme = themeName;
    await storage.setSettings(this.currentSettings);
    renderer.setTheme(themeName);
    this.updateUI();
    toast.show(`Tema değiştirildi: ${THEMES[themeName].name}`, 'info');
  }

  async setSetting(key, value) {
    this.currentSettings[key] = value;
    await storage.setSettings(this.currentSettings);
    this.applySettings();
  }

  async setControlScheme(scheme) {
    this.currentSettings.controls = scheme;
    await storage.setSettings(this.currentSettings);
    inputManager.setControlScheme(scheme);
    toast.show(`Kontrol şeması: ${scheme}`, 'info');
  }

  async confirmClearData() {
    if (!confirm('Tüm oyun verileri (skorlar, ayarlar, istatistikler) silinecek. Emin misiniz?')) return;
    if (!confirm('Bu işlem geri alınamaz. Devam etmek istiyor musunuz?')) return;

    await storage.clear();
    this.currentSettings = { ...DEFAULT_SETTINGS };
    await storage.setSettings(this.currentSettings);
    this.applySettings();
    this.updateUI();
    toast.show('Tüm veriler silindi', 'success');

    // Reload menu unlocks
    import('./menu.js').then(({ menu }) => menu.loadUnlockedModes());
  }
}

export const settingsUI = new SettingsUI();