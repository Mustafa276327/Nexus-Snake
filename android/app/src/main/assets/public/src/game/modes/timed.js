// Nexus Snake - Timed Mode

import { MODES } from '../config.js';
import { renderer } from '../renderer.js';
import { toast } from '../../ui/toast.js';

export class TimedMode {
  constructor(engine) {
    this.engine = engine;
    this.config = MODES.timed;
    this.timeRemaining = 0;
    this.timerInterval = null;
  }

  init() {
    this.engine.gridWidth = 20;
    this.engine.gridHeight = 20;
    renderer.setGridSize(20, 20);

    this.timeRemaining = this.config.timeLimit;
    this.engine.obstacleManager.generate('timed');

    // Show timer in HUD
    const timerContainer = document.getElementById('timerContainer');
    if (timerContainer) timerContainer.style.display = 'block';

    this.startTimer();
  }

  get baseSpeed() { return this.config.baseSpeed; }
  get speedIncrease() { return this.config.speedIncrease; }
  get speedInterval() { return this.config.speedInterval; }
  get maxSpeed() { return this.config.maxSpeed; }
  get wallsKill() { return this.config.wallsKill; }
  get wrapAround() { return this.config.wrapAround; }
  get autoGrow() { return this.config.autoGrow; }
  get shrinkWalls() { return this.config.shrinkWalls; }
  get scoreMultiplier() { return this.config.scoreMultiplier; }

  startTimer() {
    this.timerInterval = setInterval(() => {
      if (!this.engine.state.isPlaying()) return;

      this.timeRemaining -= 1000;
      this.updateTimerDisplay();

      if (this.timeRemaining <= 0) {
        this.timeUp();
      }
    }, 1000);
  }

  updateTimerDisplay() {
    const timerEl = document.getElementById('timer');
    if (timerEl) {
      const seconds = Math.ceil(this.timeRemaining / 1000);
      timerEl.textContent = seconds;
      timerEl.style.color = this.timeRemaining < 10000 ? 'var(--accent-danger)' : 'var(--fg-primary)';
    }
  }

  timeUp() {
    clearInterval(this.timerInterval);
    this.engine.handleCollision({ type: 'timeout' });
  }

  update(dt) {
    // Timer handled by interval
  }

  spawnFood() {
    this.engine.food = this.findEmptyPosition();
  }

  findEmptyPosition() {
    const maxAttempts = 100;
    for (let i = 0; i < maxAttempts; i++) {
      const x = Math.floor(Math.random() * this.engine.gridWidth);
      const y = Math.floor(Math.random() * this.engine.gridHeight);

      let occupied = false;
      if (this.engine.snake.some(s => s.x === x && s.y === y)) occupied = true;
      if (this.engine.obstacles.static.some(o => o.x === x && o.y === y)) occupied = true;
      if (this.engine.obstacles.moving.some(o => o.x === x && o.y === y)) occupied = true;
      if (this.engine.powerups.some(p => p.x === x && p.y === y)) occupied = true;

      if (!occupied) return { x, y };
    }
    return { x: 5, y: 5 };
  }

  onFoodEaten(food) {
    // Add time
    this.timeRemaining += this.config.timePerFood;
    if (this.timeRemaining > this.config.timeLimit) {
      this.timeRemaining = this.config.timeLimit;
    }
    this.updateTimerDisplay();
    toast.show(`+${this.config.timePerFood / 1000}s`, 'success', 800);
  }

  cleanup() {
    clearInterval(this.timerInterval);
    const timerContainer = document.getElementById('timerContainer');
    if (timerContainer) timerContainer.style.display = 'none';
  }
}