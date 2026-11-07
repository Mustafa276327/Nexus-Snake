// Nexus Snake - Input Manager (Keyboard + Touch + Virtual D-Pad)

import { Direction } from './config.js';

export class InputManager {
  constructor() {
    this.directionChangeCallback = null;
    this.pauseCallback = null;
    this.currentDirection = Direction.RIGHT;
    this.pendingDirection = null;
    this.lastDirectionChangeTime = 0;
    this.directionChangeCooldown = 50; // ms
    this.touchStart = null;
    this.swipeThreshold = 30; // pixels
    this.controlScheme = 'swipe'; // 'swipe' | 'dpad' | 'keys'
    this.dpadActive = false;
    this.keysPressed = new Set();

    this.keyMap = {
      'ArrowUp': Direction.UP,
      'ArrowDown': Direction.DOWN,
      'ArrowLeft': Direction.LEFT,
      'ArrowRight': Direction.RIGHT,
      'KeyW': Direction.UP,
      'KeyS': Direction.DOWN,
      'KeyA': Direction.LEFT,
      'KeyD': Direction.RIGHT,
      'Space': 'pause',
      'Escape': 'pause',
      'KeyP': 'pause'
    };
  }

  init() {
    this.bindKeyboard();
    this.bindTouch();
    this.bindDPad();
    this.bindVisibility();
  }

  bindKeyboard() {
    document.addEventListener('keydown', (e) => this.handleKeyDown(e), { passive: false });
    document.addEventListener('keyup', (e) => this.handleKeyUp(e));
  }

  handleKeyDown(e) {
    const action = this.keyMap[e.code];
    if (!action) return;

    if (action === 'pause') {
      e.preventDefault();
      if (this.pauseCallback) this.pauseCallback();
      return;
    }

    if (this.controlScheme !== 'keys') return;
    if (this.keysPressed.has(e.code)) return;
    this.keysPressed.add(e.code);

    this.queueDirectionChange(action);
  }

  handleKeyUp(e) {
    this.keysPressed.delete(e.code);
  }

  bindTouch() {
    const canvas = document.getElementById('game');
    if (!canvas) return;

    canvas.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: true });
    canvas.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: false });
    canvas.addEventListener('touchend', (e) => this.handleTouchEnd(e), { passive: true });

    // Prevent context menu on long press
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  handleTouchStart(e) {
    if (this.controlScheme !== 'swipe') return;
    const touch = e.touches[0];
    this.touchStart = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now()
    };
  }

  handleTouchMove(e) {
    if (!this.touchStart || this.controlScheme !== 'swipe') return;
    // Prevent scrolling while swiping
    e.preventDefault();
  }

  handleTouchEnd(e) {
    if (!this.touchStart || this.controlScheme !== 'swipe') return;

    const touch = e.changedTouches[0];
    const dx = touch.clientX - this.touchStart.x;
    const dy = touch.clientY - this.touchStart.y;
    const dt = Date.now() - this.touchStart.time;

    this.touchStart = null;

    // Ignore taps (too short distance or too long time)
    if (Math.abs(dx) < this.swipeThreshold && Math.abs(dy) < this.swipeThreshold) return;
    if (dt > 500) return; // Too slow

    // Determine swipe direction
    let direction;
    if (Math.abs(dx) > Math.abs(dy)) {
      direction = dx > 0 ? Direction.RIGHT : Direction.LEFT;
    } else {
      direction = dy > 0 ? Direction.DOWN : Direction.UP;
    }

    this.queueDirectionChange(direction);
  }

  bindDPad() {
    const dpadOverlay = document.getElementById('dpadOverlay');
    if (!dpadOverlay) return;

    dpadOverlay.addEventListener('touchstart', (e) => {
      const btn = e.target.closest('.dpad-btn');
      if (!btn) return;
      e.preventDefault();
      this.handleDPadPress(btn.dataset.dir);
    }, { passive: false });

    dpadOverlay.addEventListener('click', (e) => {
      const btn = e.target.closest('.dpad-btn');
      if (!btn) return;
      this.handleDPadPress(btn.dataset.dir);
    });
  }

  handleDPadPress(dir) {
    if (this.controlScheme !== 'dpad') return;
    const directionMap = {
      'up': Direction.UP,
      'down': Direction.DOWN,
      'left': Direction.LEFT,
      'right': Direction.RIGHT
    };
    const direction = directionMap[dir];
    if (direction) this.queueDirectionChange(direction);
  }

  bindVisibility() {
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && this.pauseCallback) {
        this.pauseCallback();
      }
    });
  }

  setControlScheme(scheme) {
    this.controlScheme = scheme;
    this.updateDPadVisibility();
  }

  updateDPadVisibility() {
    const dpadOverlay = document.getElementById('dpadOverlay');
    if (dpadOverlay) {
      dpadOverlay.classList.toggle('hidden', this.controlScheme !== 'dpad');
    }
  }

  setDirectionChangeCallback(callback) {
    this.directionChangeCallback = callback;
  }

  setPauseCallback(callback) {
    this.pauseCallback = callback;
  }

  queueDirectionChange(newDirection) {
    const now = Date.now();
    if (now - this.lastDirectionChangeTime < this.directionChangeCooldown) return;

    // Prevent 180-degree reversal
    if (newDirection.opposite === this.getDirectionName(this.currentDirection)) return;

    this.pendingDirection = newDirection;
  }

  getDirectionName(dir) {
    for (const [name, value] of Object.entries(Direction)) {
      if (value === dir) return name;
    }
    return null;
  }

  // Called by game engine each frame
  poll() {
    if (this.pendingDirection) {
      this.currentDirection = this.pendingDirection;
      this.pendingDirection = null;
      this.lastDirectionChangeTime = Date.now();
      if (this.directionChangeCallback) {
        this.directionChangeCallback(this.currentDirection);
      }
    }
  }

  getCurrentDirection() {
    return this.currentDirection;
  }

  setDirection(dir) {
    this.currentDirection = dir;
  }

  destroy() {
    // Clean up event listeners if needed
    this.directionChangeCallback = null;
    this.pauseCallback = null;
  }
}

export const inputManager = new InputManager();