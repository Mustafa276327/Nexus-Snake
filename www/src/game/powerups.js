// Nexus Snake - Powerup Manager

import { POWERUP_TYPES } from './config.js';

export class PowerupManager {
  constructor(engine) {
    this.engine = engine;
    this.activePowerups = [];
    this.spawnTimer = 0;
    this.spawnChance = 0.15; // 15% per food
    this.maxActive = 2;
    this.despawnTime = 10000; // 10 seconds
  }

  reset() {
    this.activePowerups = [];
    this.spawnTimer = 0;
  }

  trySpawn() {
    if (this.activePowerups.length >= this.maxActive) return;
    if (Math.random() > this.spawnChance) return;

    const types = Object.keys(POWERUP_TYPES);
    const type = types[Math.floor(Math.random() * types.length)];

    // Don't spawn same type if already active
    if (this.activePowerups.some(p => p.type === type)) return;

    const position = this.findEmptyPosition();
    if (!position) return;

    const def = POWERUP_TYPES[type.toUpperCase()];
    const powerup = {
      ...position,
      type,
      ...def,
      spawnedAt: Date.now()
    };

    this.activePowerups.push(powerup);
    this.engine.powerups = this.activePowerups;
  }

  findEmptyPosition() {
    const maxAttempts = 50;
    const { snake, food, obstacles, powerups } = this.engine;

    for (let i = 0; i < maxAttempts; i++) {
      const x = Math.floor(Math.random() * this.engine.gridWidth);
      const y = Math.floor(Math.random() * this.engine.gridHeight);

      // Check collisions
      let occupied = false;

      if (food && x === food.x && y === food.y) occupied = true;
      if (snake.some(s => s.x === x && s.y === y)) occupied = true;
      if (obstacles.static.some(o => o.x === x && o.y === y)) occupied = true;
      if (obstacles.moving.some(o => o.x === x && o.y === y)) occupied = true;
      if (powerups.some(p => p.x === x && p.y === y)) occupied = true;

      if (!occupied) return { x, y };
    }
    return null;
  }

  update(dt) {
    const now = Date.now();

    // Despawn old powerups
    this.activePowerups = this.activePowerups.filter(p => {
      if (now - p.spawnedAt > this.despawnTime) {
        this.engine.powerups = this.activePowerups;
        return false;
      }
      return true;
    });

    this.engine.powerups = this.activePowerups;
  }

  collect(powerup) {
    const index = this.activePowerups.findIndex(p => p === powerup);
    if (index !== -1) {
      this.activePowerups.splice(index, 1);
      this.engine.powerups = this.activePowerups;
      this.engine.applyPowerup(powerup.type);
      this.engine.storage?.updateStats?.({ powerupsCollected: 1 });
    }
  }
}