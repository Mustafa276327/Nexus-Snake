// Nexus Snake - Storage Adapter (Web localStorage + Android Capacitor Preferences)

import { STORAGE_KEYS, DEFAULT_SETTINGS } from './config.js';

const NAMESPACE = 'ns_';

class WebStorage {
  constructor() {
    this.available = this.checkAvailability();
  }

  checkAvailability() {
    try {
      const test = '__storage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }

  get(key) {
    if (!this.available) return null;
    try {
      const item = localStorage.getItem(NAMESPACE + key);
      return item ? JSON.parse(item) : null;
    } catch {
      return null;
    }
  }

  set(key, value) {
    if (!this.available) return false;
    try {
      localStorage.setItem(NAMESPACE + key, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  }

  remove(key) {
    if (!this.available) return false;
    try {
      localStorage.removeItem(NAMESPACE + key);
      return true;
    } catch {
      return false;
    }
  }

  getAll() {
    if (!this.available) return {};
    const result = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(NAMESPACE)) {
        const cleanKey = key.slice(NAMESPACE.length);
        result[cleanKey] = this.get(cleanKey);
      }
    }
    return result;
  }

  clear() {
    if (!this.available) return false;
    try {
      const keys = Object.keys(this.getAll());
      keys.forEach(k => this.remove(k));
      return true;
    } catch {
      return false;
    }
  }
}

class CapacitorStorage {
  constructor() {
    this.available = false;
    this.preferences = null;
    this.init();
  }

  async init() {
    try {
      if (window.Capacitor?.isNativePlatform) {
        const { Preferences } = await import('@capacitor/preferences');
        this.preferences = Preferences;
        this.available = true;
      }
    } catch (e) {
      console.warn('Capacitor Preferences not available:', e);
    }
  }

  async get(key) {
    if (!this.available || !this.preferences) return null;
    try {
      const { value } = await this.preferences.get({ key: NAMESPACE + key });
      return value ? JSON.parse(value) : null;
    } catch {
      return null;
    }
  }

  async set(key, value) {
    if (!this.available || !this.preferences) return false;
    try {
      await this.preferences.set({ key: NAMESPACE + key, value: JSON.stringify(value) });
      return true;
    } catch {
      return false;
    }
  }

  async remove(key) {
    if (!this.available || !this.preferences) return false;
    try {
      await this.preferences.remove({ key: NAMESPACE + key });
      return true;
    } catch {
      return false;
    }
  }

  async getAll() {
    if (!this.available || !this.preferences) return {};
    try {
      const { keys } = await this.preferences.keys();
      const result = {};
      for (const key of keys) {
        if (key.startsWith(NAMESPACE)) {
          const cleanKey = key.slice(NAMESPACE.length);
          result[cleanKey] = await this.get(cleanKey);
        }
      }
      return result;
    } catch {
      return {};
    }
  }

  async clear() {
    if (!this.available || !this.preferences) return false;
    try {
      const { keys } = await this.preferences.keys();
      for (const key of keys) {
        if (key.startsWith(NAMESPACE)) {
          await this.preferences.remove({ key });
        }
      }
      return true;
    } catch {
      return false;
    }
  }
}

export class StorageAdapter {
  constructor() {
    this.web = new WebStorage();
    this.capacitor = new CapacitorStorage();
    this.initialized = false;
    this.cache = new Map();
  }

  async init() {
    if (this.initialized) return;
    await this.capacitor.init();
    this.initialized = true;
    // Warm cache
    await this.warmCache();
  }

  async warmCache() {
    const keys = Object.values(STORAGE_KEYS);
    for (const key of keys) {
      const value = await this.get(key);
      if (value !== null) this.cache.set(key, value);
    }
    // Ensure settings exist
    if (!this.cache.has(STORAGE_KEYS.SETTINGS)) {
      this.cache.set(STORAGE_KEYS.SETTINGS, { ...DEFAULT_SETTINGS });
    }
  }

  isNative() {
    return window.Capacitor?.isNativePlatform === true;
  }

  getBackend() {
    return this.isNative() ? this.capacitor : this.web;
  }

  async get(key) {
    if (this.cache.has(key)) return this.cache.get(key);
    const backend = this.getBackend();
    const value = await backend.get(key);
    if (value !== null) this.cache.set(key, value);
    return value;
  }

  async set(key, value) {
    const backend = this.getBackend();
    const success = await backend.set(key, value);
    if (success) this.cache.set(key, value);
    return success;
  }

  async remove(key) {
    const backend = this.getBackend();
    const success = await backend.remove(key);
    if (success) this.cache.delete(key);
    return success;
  }

  async getAll() {
    const backend = this.getBackend();
    return await backend.getAll();
  }

  async clear() {
    const backend = this.getBackend();
    const success = await backend.clear();
    if (success) this.cache.clear();
    return success;
  }

  // Convenience methods for common data
  async getHighScores() {
    return (await this.get(STORAGE_KEYS.HIGH_SCORES)) || {};
  }

  async setHighScores(scores) {
    return this.set(STORAGE_KEYS.HIGH_SCORES, scores);
  }

  async updateHighScore(mode, score) {
    const scores = await this.getHighScores();
    if (!scores[mode] || score > scores[mode]) {
      scores[mode] = score;
      await this.setHighScores(scores);
      return true;
    }
    return false;
  }

  async getSettings() {
    return (await this.get(STORAGE_KEYS.SETTINGS)) || { ...DEFAULT_SETTINGS };
  }

  async setSettings(settings) {
    return this.set(STORAGE_KEYS.SETTINGS, settings);
  }

  async getStats() {
    return (await this.get(STORAGE_KEYS.STATS)) || {
      gamesPlayed: 0,
      totalScore: 0,
      bestScore: 0,
      totalPlayTime: 0,
      foodsEaten: 0,
      powerupsCollected: 0,
      deaths: 0
    };
  }

  async updateStats(stats) {
    const current = await this.getStats();
    const updated = { ...current, ...stats };
    return this.set(STORAGE_KEYS.STATS, updated);
  }

  async getUnlockedModes() {
    return (await this.get(STORAGE_KEYS.UNLOCKED_MODES)) || ['classic'];
  }

  async unlockMode(modeId) {
    const modes = await this.getUnlockedModes();
    if (!modes.includes(modeId)) {
      modes.push(modeId);
      await this.set(STORAGE_KEYS.UNLOCKED_MODES, modes);
      return true;
    }
    return false;
  }

  async getLastMode() {
    return (await this.get(STORAGE_KEYS.LAST_MODE)) || 'classic';
  }

  async setLastMode(mode) {
    return this.set(STORAGE_KEYS.LAST_MODE, mode);
  }
}

export const storage = new StorageAdapter();