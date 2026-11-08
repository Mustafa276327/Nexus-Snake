// Nexus Snake - Maze Mode

import { MODES } from '../config.js';
import { renderer } from '../renderer.js';
import { GameState as GS } from '../state.js';
import { toast } from '../../ui/toast.js';

export class MazeMode {
  constructor(engine) {
    this.engine = engine;
    this.config = MODES.maze;
  }

  init() {
    renderer.setGridSize(20, 20);

    this.engine.obstacleManager.generate('maze');

    // Hide timer
    const timerContainer = document.getElementById('timerContainer');
    if (timerContainer) timerContainer.style.display = 'none';

    this.spawnFood();
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
    // Check if snake is stuck (no valid moves)
    // This could be a win condition or just let player figure it out
  }

  spawnFood() {
    this.engine.food = this.findEmptyPosition();
  }

  findEmptyPosition() {
    const maxAttempts = 200;
    for (let i = 0; i < maxAttempts; i++) {
      const x = Math.floor(Math.random() * this.engine.gridWidth);
      const y = Math.floor(Math.random() * this.engine.gridHeight);

      let occupied = false;
      if (this.engine.snake.some(s => s.x === x && s.y === y)) occupied = true;
      if (this.engine.obstacles.static.some(o => o.x === x && o.y === y)) occupied = true;
      if (this.engine.obstacles.moving.some(o => o.x === x && o.y === y)) occupied = true;

      if (!occupied) return { x, y };
    }

    // Fallback: find any empty cell
    for (let y = 1; y < this.engine.gridHeight - 1; y++) {
      for (let x = 1; x < this.engine.gridWidth - 1; x++) {
        let occupied = false;
        if (this.engine.snake.some(s => s.x === x && s.y === y)) occupied = true;
        if (this.engine.obstacles.static.some(o => o.x === x && o.y === y)) occupied = true;
        if (!occupied) return { x, y };
      }
    }

    return { x: 10, y: 10 };
  }

  onFoodEaten(food) {
    // In maze mode, eating the single food = win!
    this.engine.state.set(GS.GAME_OVER);
    toast.show('🏆 LABİRENT TAMAMLANDI!', 'success', 5000);
  }
}