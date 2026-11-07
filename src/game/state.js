// Nexus Snake - Game State Machine

import { GameState as GS } from './config.js';

export class GameState {
  constructor() {
    this.current = GS.MENU;
    this.previous = null;
    this.listeners = new Set();
  }

  get() {
    return this.current;
  }

  set(state) {
    if (!Object.values(GS).includes(state)) {
      console.warn(`Invalid state: ${state}`);
      return false;
    }
    if (this.current === state) return false;

    this.previous = this.current;
    this.current = state;
    this.notify();
    return true;
  }

  canTransition(to) {
    const validTransitions = {
      [GS.MENU]: [GS.PLAYING, GS.SETTINGS],
      [GS.PLAYING]: [GS.PAUSED, GS.GAME_OVER],
      [GS.PAUSED]: [GS.PLAYING, GS.MENU, GS.GAME_OVER],
      [GS.GAME_OVER]: [GS.MENU, GS.PLAYING],
      [GS.SETTINGS]: [GS.MENU]
    };
    return validTransitions[this.current]?.includes(to) ?? false;
  }

  transition(to) {
    if (!this.canTransition(to)) {
      console.warn(`Invalid transition: ${this.current} -> ${to}`);
      return false;
    }
    return this.set(to);
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify() {
    this.listeners.forEach(l => l(this.current, this.previous));
  }

  isPlaying() {
    return this.current === GS.PLAYING;
  }

  isPaused() {
    return this.current === GS.PAUSED;
  }

  isMenu() {
    return this.current === GS.MENU;
  }

  isGameOver() {
    return this.current === GS.GAME_OVER;
  }
}

export const gameState = new GameState();