// Nexus Snake - Obstacle Manager

import { OBSTACLE_TYPES, MAZE_LAYOUTS } from './config.js';
import { renderer } from './renderer.js';

export class ObstacleManager {
  constructor(engine) {
    this.engine = engine;
    this.staticObstacles = [];
    this.movingObstacles = [];
    this.portals = [];
    this.shrinkTimer = 0;
    this.shrinkInterval = 15000;
    this.shrinkAmount = 2;
    this.minGridSize = 8;
    this.currentGridWidth = 0;
    this.currentGridHeight = 0;
  }

  reset() {
    this.staticObstacles = [];
    this.movingObstacles = [];
    this.portals = [];
    this.shrinkTimer = 0;
    this.currentGridWidth = this.engine.gridWidth;
    this.currentGridHeight = this.engine.gridHeight;
  }

  generate(modeId) {
    const mode = this.engine.modeInstance;
    this.staticObstacles = [];
    this.movingObstacles = [];
    this.portals = [];

    if (mode.mazeLayout) {
      this.generateMaze(mode.mazeLayout);
    }

    if (modeId === 'timed') {
      this.generateRandomWalls(3);
    } else if (modeId === 'survival') {
      // Walls will shrink over time
      this.currentGridWidth = this.engine.gridWidth;
      this.currentGridHeight = this.engine.gridHeight;
      this.shrinkInterval = mode.shrinkInterval || 15000;
      this.shrinkAmount = mode.shrinkAmount || 2;
      this.minGridSize = mode.minGridSize || 8;
    }

    this.updateEngineObstacles();
  }

  generateMaze(layoutName) {
    const layout = MAZE_LAYOUTS[layoutName];
    if (!layout) return;

    this.staticObstacles = layout.map(pos => ({ x: pos.x, y: pos.y, type: OBSTACLE_TYPES.STATIC_WALL }));
  }

  generateRandomWalls(count) {
    const attempts = count * 10;
    for (let i = 0; i < attempts && this.staticObstacles.length < count; i++) {
      const x = Math.floor(Math.random() * this.engine.gridWidth);
      const y = Math.floor(Math.random() * this.engine.gridHeight);

      // Avoid snake start area and food
      const centerX = Math.floor(this.engine.gridWidth / 2);
      const centerY = Math.floor(this.engine.gridHeight / 2);
      if (Math.abs(x - centerX) < 4 && Math.abs(y - centerY) < 4) continue;

      // Check not overlapping
      let occupied = false;
      if (this.engine.food && x === this.engine.food.x && y === this.engine.food.y) occupied = true;
      if (this.engine.snake.some(s => s.x === x && s.y === y)) occupied = true;
      if (this.staticObstacles.some(o => o.x === x && o.y === y)) occupied = true;

      if (!occupied) {
        this.staticObstacles.push({ x, y, type: OBSTACLE_TYPES.STATIC_WALL });
      }
    }
  }

  generateMovingObstacles(count) {
    const directions = ['up', 'down', 'left', 'right'];
    for (let i = 0; i < count; i++) {
      let x, y, dir;
      let attempts = 20;
      do {
        x = Math.floor(Math.random() * this.engine.gridWidth);
        y = Math.floor(Math.random() * this.engine.gridHeight);
        dir = directions[Math.floor(Math.random() * directions.length)];
        attempts--;
      } while (attempts > 0 && this.isPositionOccupied(x, y));

      if (attempts > 0) {
        this.movingObstacles.push({ x, y, dir, type: OBSTACLE_TYPES.MOVING_BLOCK, speed: 1000 });
      }
    }
  }

  generatePortals(pairs) {
    for (let i = 0; i < pairs; i++) {
      let pos1, pos2;
      let attempts = 20;
      do {
        pos1 = this.findEmptyPosition();
        pos2 = this.findEmptyPosition();
        attempts--;
      } while (attempts > 0 && (pos1.x === pos2.x && pos1.y === pos2.y));

      if (attempts > 0) {
        const colors = ['#74b9ff', '#a29bfe', '#fd79a8', '#ffeaa7', '#81ecec'];
        const color = colors[i % colors.length];
        this.portals.push(
          { ...pos1, linked: pos2, linkedColor: color, type: OBSTACLE_TYPES.PORTAL_PAIR },
          { ...pos2, linked: pos1, linkedColor: color, type: OBSTACLE_TYPES.PORTAL_PAIR }
        );
      }
    }
  }

  findEmptyPosition() {
    const maxAttempts = 50;
    for (let i = 0; i < maxAttempts; i++) {
      const x = Math.floor(Math.random() * this.engine.gridWidth);
      const y = Math.floor(Math.random() * this.engine.gridHeight);
      if (!this.isPositionOccupied(x, y)) return { x, y };
    }
    return { x: 0, y: 0 };
  }

  isPositionOccupied(x, y) {
    if (this.engine.food && x === this.engine.food.x && y === this.engine.food.y) return true;
    if (this.engine.snake.some(s => s.x === x && s.y === y)) return true;
    if (this.staticObstacles.some(o => o.x === x && o.y === y)) return true;
    if (this.movingObstacles.some(o => o.x === x && o.y === y)) return true;
    if (this.portals.some(p => p.x === x && p.y === y)) return true;
    return false;
  }

  update(dt) {
    this.shrinkTimer += dt;

    // Handle wall shrinking (survival mode)
    if (this.engine.modeInstance.shrinkWalls && this.shrinkTimer >= this.shrinkInterval) {
      this.shrinkTimer = 0;
      this.shrinkWalls();
    }

    // Update moving obstacles
    this.updateMovingObstacles(dt);
  }

  shrinkWalls() {
    if (this.currentGridWidth <= this.minGridSize || this.currentGridHeight <= this.minGridSize) return;

    // Remove outer walls
    const newStatic = this.staticObstacles.filter(obs => {
      return obs.x > 0 && obs.x < this.currentGridWidth - 1 &&
             obs.y > 0 && obs.y < this.currentGridHeight - 1;
    });

    this.staticObstacles = newStatic;
    this.currentGridWidth -= 2;
    this.currentGridHeight -= 2;

    // Adjust renderer grid size
    renderer.setGridSize(this.currentGridWidth, this.currentGridHeight);

    // Move snake if it's outside new bounds
    this.engine.snake = this.engine.snake.map(seg => ({
      x: Math.max(1, Math.min(seg.x, this.currentGridWidth - 2)),
      y: Math.max(1, Math.min(seg.y, this.currentGridHeight - 2))
    }));

    // Move food if outside
    if (this.engine.food) {
      this.engine.food.x = Math.max(1, Math.min(this.engine.food.x, this.currentGridWidth - 2));
      this.engine.food.y = Math.max(1, Math.min(this.engine.food.y, this.currentGridHeight - 2));
    }

    this.updateEngineObstacles();
  }

  updateMovingObstacles(dt) {
    this.movingObstacles.forEach(obs => {
      obs.moveTimer = (obs.moveTimer || 0) + dt;
      if (obs.moveTimer >= obs.speed) {
        obs.moveTimer = 0;
        this.moveObstacle(obs);
      }
    });
  }

  moveObstacle(obs) {
    let newX = obs.x;
    let newY = obs.y;

    switch (obs.dir) {
      case 'up': newY--; break;
      case 'down': newY++; break;
      case 'left': newX--; break;
      case 'right': newX++; break;
    }

    // Bounce off walls and static obstacles
    const hitWall = newX < 0 || newX >= this.engine.gridWidth || newY < 0 || newY >= this.engine.gridHeight;
    const hitStatic = this.staticObstacles.some(o => o.x === newX && o.y === newY);
    const hitMoving = this.movingObstacles.some(o => o !== obs && o.x === newX && o.y === newY);

    if (hitWall || hitStatic || hitMoving) {
      // Reverse direction
      switch (obs.dir) {
        case 'up': obs.dir = 'down'; break;
        case 'down': obs.dir = 'up'; break;
        case 'left': obs.dir = 'right'; break;
        case 'right': obs.dir = 'left'; break;
      }
    } else {
      obs.x = newX;
      obs.y = newY;
    }
  }

  handlePortalTeleport(head) {
    for (const portal of this.portals) {
      if (head.x === portal.x && head.y === portal.y) {
        // Teleport to linked portal, preserving direction
        return { x: portal.linked.x, y: portal.linked.y };
      }
    }
    return null;
  }

  updateEngineObstacles() {
    this.engine.obstacles = {
      static: this.staticObstacles,
      moving: this.movingObstacles,
      portals: this.portals
    };
  }

  checkCollision(pos) {
    for (const obs of this.staticObstacles) {
      if (obs.x === pos.x && obs.y === pos.y) return true;
    }
    for (const obs of this.movingObstacles) {
      if (obs.x === pos.x && obs.y === pos.y) return true;
    }
    return false;
  }
}