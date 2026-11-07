// Nexus Snake - Survival Mode

import { MODES } from '../config.js';
import { renderer } from '../renderer.js';

export class SurvivalMode {
  constructor(engine) {
    this.engine = engine;
    this.config = MODES.survival;
    this.growTimer = 0;
    this.growInterval = 3000;
  }

  init() {
    this.engine.gridWidth = 20;
    this.engine.gridHeight = 20;
    renderer.setGridSize(20, 20);

    this.growInterval = this.config.growInterval || 3000;
    this.growTimer = 0;

    this.engine.obstacleManager.generate('survival');

    // Hide timer
    const timerContainer = document.getElementById('timerContainer');
    if (timerContainer) timerContainer.style.display = 'none';

    // No food in survival mode
    this.engine.food = null;
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
    this.growTimer += dt;
    if (this.growTimer >= this.growInterval) {
      this.growTimer = 0;
      this.engine.autoGrow();
    }
  }

  spawnFood() {
    // No food in survival mode
    this.engine.food = null;
  }

  findEmptyPosition() {
    return null;
  }

  onFoodEaten(food) {
    // Not used
  }
}