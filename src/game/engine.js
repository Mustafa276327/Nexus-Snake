// Nexus Snake - Core Game Engine (Fixed Timestep Loop)

import { GameState as GameStateClass } from './state.js';
import { GameState as GS, Direction, MODES, GRID_DEFAULTS, STORAGE_KEYS, POWERUP_TYPES } from './config.js';
import { renderer } from './renderer.js';
import { inputManager } from './input.js';
import { storage } from './storage.js';
import { PowerupManager } from './powerups.js';
import { ObstacleManager } from './obstacles.js';
import { ClassicMode } from './modes/classic.js';
import { TimedMode } from './modes/timed.js';
import { SurvivalMode } from './modes/survival.js';
import { MazeMode } from './modes/maze.js';
import { ArenaMode } from './arena/arena.js';
import { hud } from '../ui/hud.js';
import { menu } from '../ui/menu.js';
import { toast } from '../ui/toast.js';

export class GameEngine {
  constructor() {
    this.state = new GameStateClass();
    this.currentMode = null;
    this.modeInstance = null;

    // Game data
    this.snake = [];
    this.direction = Direction.RIGHT;
    this.nextDirection = Direction.RIGHT;
    this.food = null;
    this.powerups = [];
    this.obstacles = { static: [], moving: [], portals: [] };

    // Timing
    this.lastTime = 0;
    this.accumulator = 0;
    this.fixedTimeStep = 1000 / 60; // 60 Hz
    this.gameSpeed = 150; // ms per tick (updated by mode)
    this.speedAccumulator = 0;

    // State
    this.score = 0;
    this.highScores = {};
    this.level = 1;
    this.foodEaten = 0;
    this.isGhost = false;
    this.ghostEndTime = 0;
    this.hasShield = false;
    this.shieldCharges = 0;
    this.doublePoints = false;
    this.doublePointsEndTime = 0;
    this.slowDownEndTime = 0;
    this.speedBoostEndTime = 0;

    // Powerup & obstacle managers
    this.powerupManager = new PowerupManager(this);
    this.obstacleManager = new ObstacleManager(this);

    // Callbacks
    this.onGameOver = null;
    this.onScoreChange = null;
    this.onLevelChange = null;
    this.onStateChange = null;

    // Animation frame
    this.animationId = null;
    this.running = false;
  }

  async init() {
    // Initialize subsystems
    await storage.init();
    renderer.init();
    inputManager.init();

    // Load settings
    const settings = await storage.getSettings();
    renderer.setTheme(settings.theme);
    renderer.setShowGrid(settings.showGrid);
    inputManager.setControlScheme(settings.controls);

    // Load high scores
    this.highScores = await storage.getHighScores();

    // Load last mode
    const lastMode = await storage.getLastMode();
    menu.setSelectedMode(lastMode);

    // Mirror the arena skin into localStorage for the synchronous game loop.
    try {
      const savedSkin = await storage.get('arena_skin');
      if (savedSkin) localStorage.setItem('ns_arena_skin', JSON.stringify(savedSkin));
    } catch { /* ignore */ }

    // Set up input callbacks
    inputManager.setDirectionChangeCallback((dir) => {
      this.nextDirection = dir;
    });
    inputManager.setPauseCallback(() => {
      this.togglePause();
    });

    // Subscribe to state changes
    this.state.subscribe((current, previous) => {
      this.onStateChange?.(current, previous);
      this.handleStateChange(current, previous);
    });

    // Initialize mode instances
    this.modes = {
      arena: new ArenaMode(this),
      classic: new ClassicMode(this),
      timed: new TimedMode(this),
      survival: new SurvivalMode(this),
      maze: new MazeMode(this)
    };

    // Show menu
    this.state.set(GS.MENU);
    menu.show();

    console.log('Nexus Snake engine initialized');
  }

  handleStateChange(current, previous) {
    switch (current) {
      case GS.MENU:
        this.modeInstance?.stop?.();
        renderer.setArenaMode(false);
        menu.show();
        break;
      case GS.PLAYING:
        menu.hideGameOver();
        menu.hidePause();
        menu.hide();
        if (previous === GS.PAUSED) {
          this.lastTime = performance.now();
        }
        break;
      case GS.PAUSED:
        menu.showPause(this.getPauseStats());
        break;
      case GS.GAME_OVER:
        this.handleGameOver();
        break;
      case GS.SETTINGS:
        menu.showSettings();
        break;
    }
  }

  start(modeId) {
    const modeConfig = MODES[modeId];
    if (!modeConfig) {
      console.error(`Unknown mode: ${modeId}`);
      return;
    }

    // Check unlock
    this.checkModeUnlock(modeId).then(unlocked => {
      if (!unlocked) {
        toast.show(`Bu mod kilitli! ${MODES[modeId].unlockScore} puan gerekiyor.`, 'warning');
        return;
      }
      this.doStart(modeId);
    });
  }

  async checkModeUnlock(modeId) {
    const mode = MODES[modeId];
    if (mode.unlockScore === 0) return true;
    const scores = await storage.getHighScores();
    const bestOverall = Math.max(...Object.values(scores), 0);
    return bestOverall >= mode.unlockScore;
  }

  doStart(modeId) {
    this.currentMode = modeId;
    this.modeInstance = this.modes[modeId];
    storage.setLastMode(modeId);

    // Arena is a continuous, self-contained mode (no grid).
    if (MODES[modeId]?.isArena) {
      renderer.setArenaMode(true);
      this.score = 0;
      this.modeInstance.init();
      this.state.set(GS.PLAYING);
      this.lastTime = performance.now();
      this.accumulator = 0;
      this.run();
      return;
    }

    renderer.setArenaMode(false);

    // Reset game state
    this.resetGame();

    // Initialize mode
    this.modeInstance.init();

    // Set game speed from mode
    this.gameSpeed = this.modeInstance.baseSpeed;

    // Start loop
    this.state.set(GS.PLAYING);
    this.lastTime = performance.now();
    this.run();
  }

  resetGame() {
    this.snake = [];
    this.direction = Direction.RIGHT;
    this.nextDirection = Direction.RIGHT;
    this.food = null;
    this.powerups = [];
    this.obstacles = { static: [], moving: [], portals: [] };
    this.score = 0;
    this.level = 1;
    this.foodEaten = 0;
    this.isGhost = false;
    this.ghostEndTime = 0;
    this.hasShield = false;
    this.shieldCharges = 0;
    this.doublePoints = false;
    this.doublePointsEndTime = 0;
    this.slowDownEndTime = 0;
    this.speedBoostEndTime = 0;
    this.speedAccumulator = 0;
    this.growing = false;

    // Reset managers
    this.powerupManager.reset();
    this.obstacleManager.reset();

    // Spawn initial snake
    const startX = Math.floor(this.gridWidth / 2);
    const startY = Math.floor(this.gridHeight / 2);
    for (let i = 3; i >= 0; i--) {
      this.snake.push({ x: startX - i, y: startY });
    }

    // Spawn first food
    this.modeInstance.spawnFood();

    // Update HUD
    hud.updateScore(0);
    hud.updateLevel(1);
    hud.updateMode(this.currentMode);
  }

  run() {
    if (!this.running) {
      this.running = true;
      this.loop();
    }
  }

  loop() {
    if (!this.running) return;

    const now = performance.now();
    const delta = Math.min(now - this.lastTime, 100);
    this.lastTime = now;

    this.accumulator += delta;

    // Fixed timestep updates
    while (this.accumulator >= this.fixedTimeStep) {
      this.fixedUpdate(this.fixedTimeStep);
      this.accumulator -= this.fixedTimeStep;
    }

    // Variable timestep render
    this.render();

    this.animationId = requestAnimationFrame(() => this.loop());
  }

  fixedUpdate(dt) {
    if (!this.state.isPlaying()) return;

    // Arena runs its own continuous update
    if (MODES[this.currentMode]?.isArena) {
      this.modeInstance.update(dt);
      return;
    }

    // Flush queued direction input (grid modes)
    inputManager.poll();

    // Update powerup timers
    this.updatePowerupTimers();

    // Update mode-specific logic
    this.modeInstance.update(dt);

    // Handle direction change
    this.direction = this.nextDirection;

    // Move snake
    this.moveSnake();

    // Check collisions
    const collision = this.checkCollisions();
    if (collision) {
      this.handleCollision(collision);
      return;
    }

    // Check food
    this.checkFood();

    // Update powerups
    this.powerupManager.update(dt);

    // Update obstacles
    this.obstacleManager.update(dt);

    // Update speed accumulator for level progression
    this.speedAccumulator += dt;
  }

  updatePowerupTimers() {
    const now = Date.now();

    if (this.isGhost && now > this.ghostEndTime) {
      this.isGhost = false;
      hud.removePowerupIndicator('ghost');
    }

    if (this.doublePoints && now > this.doublePointsEndTime) {
      this.doublePoints = false;
      hud.removePowerupIndicator('double_points');
    }

    if (this.slowDownEndTime && now > this.slowDownEndTime) {
      this.slowDownEndTime = 0;
      hud.removePowerupIndicator('slow_down');
    }

    if (this.speedBoostEndTime && now > this.speedBoostEndTime) {
      this.speedBoostEndTime = 0;
      hud.removePowerupIndicator('speed_boost');
    }
  }

  moveSnake() {
    const head = this.snake[0];
    const newHead = {
      x: head.x + this.direction.x,
      y: head.y + this.direction.y
    };

    // Handle wrapping if enabled
    if (this.modeInstance.wrapAround) {
      newHead.x = (newHead.x + this.gridWidth) % this.gridWidth;
      newHead.y = (newHead.y + this.gridHeight) % this.gridHeight;
    }

    this.snake.unshift(newHead);

    // Remove tail unless growing
    if (!this.growing) {
      this.snake.pop();
    } else {
      this.growing = false;
    }
  }

  checkCollisions() {
    const head = this.snake[0];

    // Wall collision
    if (head.x < 0 || head.x >= this.gridWidth ||
        head.y < 0 || head.y >= this.gridHeight) {
      if (this.modeInstance.wrapAround) return null; // Handled in moveSnake
      if (this.isGhost) return null; // Ghost mode passes through
      if (this.hasShield) {
        this.useShield();
        return null;
      }
      return { type: 'wall' };
    }

    // Self collision (skip head)
    for (let i = 1; i < this.snake.length; i++) {
      if (head.x === this.snake[i].x && head.y === this.snake[i].y) {
        if (this.hasShield) {
          this.useShield();
          return null;
        }
        return { type: 'self' };
      }
    }

    // Obstacle collisions
    for (const obs of this.obstacles.static) {
      if (head.x === obs.x && head.y === obs.y) {
        if (this.isGhost) return null;
        if (this.hasShield) {
          this.useShield();
          return null;
        }
        return { type: 'obstacle', obstacle: obs };
      }
    }

    for (const obs of this.obstacles.moving) {
      if (head.x === obs.x && head.y === obs.y) {
        if (this.isGhost) return null;
        if (this.hasShield) {
          this.useShield();
          return null;
        }
        return { type: 'obstacle', obstacle: obs };
      }
    }

    return null;
  }

  useShield() {
    this.shieldCharges--;
    if (this.shieldCharges <= 0) {
      this.hasShield = false;
      hud.removePowerupIndicator('shield');
    }
    toast.show('Kalkan korudu!', 'info');
    // Brief invulnerability flash
    this.isGhost = true;
    this.ghostEndTime = Date.now() + 500;
  }

  checkFood() {
    const head = this.snake[0];
    if (this.food && head.x === this.food.x && head.y === this.food.y) {
      this.eatFood();
    }
  }

  eatFood() {
    this.growing = true;
    this.foodEaten++;

    // Calculate score
    let points = 10 * this.level;
    if (this.doublePoints) points *= 2;
    points = Math.floor(points * this.modeInstance.scoreMultiplier);
    this.score += points;

    // Update stats
    storage.updateStats({ foodsEaten: 1, totalScore: points });

    // Check powerup spawn
    this.powerupManager.trySpawn();

    // Mode-specific food handling
    this.modeInstance.onFoodEaten(this.food);

    // Spawn new food
    this.modeInstance.spawnFood();

    // Update HUD
    hud.updateScore(this.score);
    this.onScoreChange?.(this.score);

    // Check level up
    this.checkLevelUp();

    toast.show(`+${points}`, 'success', 800);
  }

  checkLevelUp() {
    const newLevel = Math.floor(this.foodEaten / this.modeInstance.speedInterval) + 1;
    if (newLevel > this.level) {
      this.level = newLevel;
      this.gameSpeed = Math.max(
        this.modeInstance.maxSpeed,
        this.modeInstance.baseSpeed - (this.level - 1) * this.modeInstance.speedIncrease
      );
      hud.updateLevel(this.level);
      this.onLevelChange?.(this.level);
      toast.show(`SEVİYE ${this.level}! Hız: ${this.gameSpeed}ms`, 'info');
    }
  }

  handleCollision(collision) {
    // Play death sound/haptic
    if (window.Capacitor?.isNativePlatform) {
      import('@capacitor/haptics').then(({ Haptics, ImpactStyle }) => {
        Haptics.impact({ style: ImpactStyle.Heavy });
      }).catch(() => {});
    }

    this.state.set(GS.GAME_OVER);
  }

  async handleGameOver() {
    // Update high score
    const isNewRecord = await storage.updateHighScore(this.currentMode, this.score);
    if (isNewRecord) {
      this.highScores[this.currentMode] = this.score;
      toast.show('🏆 YENİ REKOR!', 'success', 3000);
    }

    // Update stats
    await storage.updateStats({
      gamesPlayed: 1,
      totalScore: this.score,
      bestScore: Math.max(this.highScores[this.currentMode] || 0, this.score),
      deaths: 1
    });

    // Check mode unlocks
    for (const [modeId, mode] of Object.entries(MODES)) {
      if (mode.unlockScore > 0) {
        const unlocked = await this.checkModeUnlock(modeId);
        if (unlocked) {
          await storage.unlockMode(modeId);
        }
      }
    }

    // Show game over screen
    menu.showGameOver(this.getFinalStats(), isNewRecord);
  }

  getPauseStats() {
    const isArena = !!MODES[this.currentMode]?.isArena;
    return {
      score: this.score,
      level: isArena ? 1 : this.level,
      foodEaten: isArena ? (this.modeInstance?.kills || 0) : this.foodEaten,
      mode: MODES[this.currentMode]?.name || this.currentMode,
      isArena
    };
  }

  getFinalStats() {
    const isArena = !!MODES[this.currentMode]?.isArena;
    return {
      score: this.score,
      highScore: this.highScores[this.currentMode] || 0,
      level: isArena ? 1 : this.level,
      foodEaten: isArena ? (this.arenaKills || 0) : this.foodEaten,
      mode: MODES[this.currentMode]?.name || this.currentMode,
      isArena,
      kills: isArena ? (this.arenaKills || 0) : 0,
      isNewRecord: this.score === (this.highScores[this.currentMode] || 0)
    };
  }

  render() {
    // Arena renders its own world and HUD
    if (MODES[this.currentMode]?.isArena) {
      if (this.state.isPlaying() || this.state.isPaused() || this.state.isGameOver()) {
        this.modeInstance.render();
      }
      return;
    }

    const gameState = {
      snake: this.snake,
      food: this.food,
      powerups: this.powerups,
      obstacles: this.obstacles,
      isGhost: this.isGhost,
      hasShield: this.hasShield
    };
    renderer.render(gameState);
  }

  pause() {
    if (this.state.isPlaying()) {
      this.state.set(GS.PAUSED);
    }
  }

  resume() {
    if (this.state.isPaused()) {
      this.state.set(GS.PLAYING);
      this.lastTime = performance.now();
    }
  }

  togglePause() {
    if (this.state.isPlaying()) this.pause();
    else if (this.state.isPaused()) this.resume();
  }

  quitToMenu() {
    this.running = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    this.modeInstance?.stop?.();
    renderer.setArenaMode(false);
    this.state.set(GS.MENU);
  }

  // Called by the arena when the player snake dies.
  onArenaGameOver(score, kills) {
    this.score = Math.floor(score) || 0;
    this.arenaKills = kills || 0;
    this.state.set(GS.GAME_OVER);
  }

  restart() {
    this.doStart(this.currentMode);
  }

  // Getters for current grid size
  get gridWidth() {
    return renderer.gridWidth;
  }

  get gridHeight() {
    return renderer.gridHeight;
  }

  // Powerup application
  applyPowerup(type) {
    const now = Date.now();
    const def = Object.values(POWERUP_TYPES).find(p => p.id === type);
    if (!def) return;

    switch (type) {
      case 'speed_boost':
        this.speedBoostEndTime = now + def.duration;
        this.gameSpeed = Math.max(this.modeInstance.maxSpeed, this.gameSpeed * 0.66);
        hud.addPowerupIndicator(def);
        break;
      case 'slow_down':
        this.slowDownEndTime = now + def.duration;
        this.gameSpeed = this.gameSpeed * 1.5;
        hud.addPowerupIndicator(def);
        break;
      case 'shrink':
        if (this.snake.length > 4) {
          this.snake = this.snake.slice(0, -3);
        }
        hud.addPowerupIndicator(def);
        setTimeout(() => hud.removePowerupIndicator('shrink'), 1500);
        break;
      case 'double_points':
        this.doublePoints = true;
        this.doublePointsEndTime = now + def.duration;
        hud.addPowerupIndicator(def);
        break;
      case 'ghost':
        this.isGhost = true;
        this.ghostEndTime = now + def.duration;
        hud.addPowerupIndicator(def);
        break;
      case 'shield':
        this.hasShield = true;
        this.shieldCharges = def.charges;
        hud.addPowerupIndicator(def);
        break;
    }

    toast.show(`${def.icon} ${def.name} aktif!`, 'info');
  }

  // Called by mode for auto-grow (survival)
  autoGrow() {
    this.growing = true;
    this.foodEaten++;
    this.checkLevelUp();
  }
}

export const engine = new GameEngine();