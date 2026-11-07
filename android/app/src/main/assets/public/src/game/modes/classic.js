// Nexus Snake - Classic Mode

import { MODES } from '../config.js';
import { renderer } from '../renderer.js';

export class ClassicMode {
  constructor(engine) {
    this.engine = engine;
    this.config = MODES.classic;
  }

  init() {
    this.engine.gridWidth = 20;
    this.engine.gridHeight = 20;
    renderer.setGridSize(20, 20);

    this.engine.obstacleManager.generate('classic');
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

  update(dt) {
    // Classic mode has no special update logic
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
    // Fallback
    return { x: 5, y: 5 };
  }

  onFoodEaten(food) {
    // Standard food eaten, nothing special
  }
}