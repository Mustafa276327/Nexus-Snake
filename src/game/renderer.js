// Nexus Snake - Renderer (Canvas 2D Drawing)

import { THEMES, GRID_DEFAULTS } from './config.js';

export class Renderer {
  constructor() {
    this.canvas = null;
    this.ctx = null;
    this.width = 0;
    this.height = 0;
    this.gridWidth = GRID_DEFAULTS.width;
    this.gridHeight = GRID_DEFAULTS.height;
    this.cellSize = GRID_DEFAULTS.cellSize;
    this.dpr = window.devicePixelRatio || 1;
    this.currentTheme = 'dark';
    this.showGrid = true;
    this.animationFrame = null;
    this.lastRenderTime = 0;
    this.fps = 60;
  }

  init(canvasId = 'game') {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) {
      throw new Error(`Canvas #${canvasId} not found`);
    }
    this.ctx = this.canvas.getContext('2d', { alpha: false, desynchronized: true });
    this.resize();
    window.addEventListener('resize', () => this.resize());
    window.addEventListener('orientationchange', () => setTimeout(() => this.resize(), 100));
    return this;
  }

  resize() {
    const rect = this.canvas.getBoundingClientRect();
    const maxWidth = Math.min(rect.width, window.innerWidth);
    const maxHeight = Math.min(rect.height, window.innerHeight - 80); // Leave room for HUD

    // Calculate cell size to fit grid
    this.cellSize = Math.floor(Math.min(maxWidth / this.gridWidth, maxHeight / this.gridHeight));
    this.cellSize = Math.max(12, Math.min(this.cellSize, 40)); // Clamp

    this.width = this.gridWidth * this.cellSize;
    this.height = this.gridHeight * this.cellSize;

    // Set canvas resolution (backing store)
    this.canvas.width = this.width * this.dpr;
    this.canvas.height = this.height * this.dpr;

    // Set canvas display size (CSS)
    this.canvas.style.width = `${this.width}px`;
    this.canvas.style.height = `${this.height}px`;

    // Scale context for HiDPI
    this.ctx.scale(this.dpr, this.dpr);

    // Center canvas
    this.canvas.style.margin = 'auto';
    this.canvas.style.display = 'block';
  }

  setGridSize(width, height) {
    this.gridWidth = width;
    this.gridHeight = height;
    this.resize();
  }

  setTheme(themeName) {
    this.currentTheme = themeName;
    const theme = THEMES[themeName] || THEMES.dark;
    const root = document.documentElement;
    for (const [key, value] of Object.entries(theme.cssVars)) {
      root.style.setProperty(key, value);
    }
  }

  setShowGrid(show) {
    this.showGrid = show;
  }

  clear() {
    this.ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--bg-primary').trim();
    this.ctx.fillRect(0, 0, this.width, this.height);
  }

  drawGrid() {
    if (!this.showGrid) return;
    const gridColor = getComputedStyle(document.documentElement).getPropertyValue('--grid-color').trim();
    this.ctx.strokeStyle = gridColor;
    this.ctx.lineWidth = 0.5;

    this.ctx.beginPath();
    // Vertical lines
    for (let x = 0; x <= this.gridWidth; x++) {
      const px = x * this.cellSize;
      this.ctx.moveTo(px, 0);
      this.ctx.lineTo(px, this.height);
    }
    // Horizontal lines
    for (let y = 0; y <= this.gridHeight; y++) {
      const py = y * this.cellSize;
      this.ctx.moveTo(0, py);
      this.ctx.lineTo(this.width, py);
    }
    this.ctx.stroke();
  }

  // Draw rounded rectangle helper
  roundRect(x, y, w, h, r) {
    const ctx = this.ctx;
    const radius = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + w - radius, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
    ctx.lineTo(x + w, y + h - radius);
    ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
    ctx.lineTo(x + radius, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }

  drawSnake(snake, isGhost = false, isShielded = false) {
    if (!snake || snake.length === 0) return;

    const headColor = getComputedStyle(document.documentElement).getPropertyValue('--snake-head').trim();
    const bodyColor = getComputedStyle(document.documentElement).getPropertyValue('--snake-body').trim();
    const tailColor = getComputedStyle(document.documentElement).getPropertyValue('--snake-tail').trim();

    const padding = Math.max(1, this.cellSize * 0.08);
    const segmentSize = this.cellSize - padding * 2;
    const radius = Math.max(2, this.cellSize * 0.25);

    snake.forEach((segment, index) => {
      const px = segment.x * this.cellSize + padding;
      const py = segment.y * this.cellSize + padding;

      let color;
      let alpha = 1;

      if (isGhost) {
        alpha = 0.5;
        color = headColor;
      } else if (index === 0) {
        color = headColor;
      } else if (index === snake.length - 1) {
        color = tailColor;
      } else {
        // Gradient from head to tail
        const ratio = index / (snake.length - 1);
        color = this.lerpColor(bodyColor, tailColor, ratio);
      }

      this.ctx.globalAlpha = alpha;
      this.ctx.fillStyle = color;

      // Segment shape
      if (index === 0) {
        // Head - slightly larger, with eyes
        this.roundRect(px - 1, py - 1, segmentSize + 2, segmentSize + 2, radius + 1);
        this.ctx.fill();

        // Eyes
        this.drawEyes(segment, snake[1] || segment);
      } else {
        this.roundRect(px, py, segmentSize, segmentSize, radius);
        this.ctx.fill();
      }

      // Shield effect
      if (isShielded && index === 0) {
        this.ctx.globalAlpha = 0.3;
        this.ctx.strokeStyle = '#74b9ff';
        this.ctx.lineWidth = 3;
        this.roundRect(px - 3, py - 3, segmentSize + 6, segmentSize + 6, radius + 3);
        this.ctx.stroke();
      }
    });

    this.ctx.globalAlpha = 1;
  }

  drawEyes(head, neck) {
    const eyeSize = Math.max(2, this.cellSize * 0.12);
    const eyeOffset = this.cellSize * 0.22;
    const centerX = head.x * this.cellSize + this.cellSize / 2;
    const centerY = head.y * this.cellSize + this.cellSize / 2;

    // Determine eye positions based on direction
    let dx = 0, dy = 0;
    if (neck.x < head.x) dx = 1; // Moving right
    else if (neck.x > head.x) dx = -1; // Moving left
    else if (neck.y < head.y) dy = 1; // Moving down
    else if (neck.y > head.y) dy = -1; // Moving up

    const leftEyeX = centerX - dx * eyeOffset - dy * eyeOffset;
    const leftEyeY = centerY - dy * eyeOffset + dx * eyeOffset;
    const rightEyeX = centerX - dx * eyeOffset + dy * eyeOffset;
    const rightEyeY = centerY - dy * eyeOffset - dx * eyeOffset;

    this.ctx.fillStyle = '#0d1117';
    this.ctx.beginPath();
    this.ctx.arc(leftEyeX, leftEyeY, eyeSize, 0, Math.PI * 2);
    this.ctx.arc(rightEyeX, rightEyeY, eyeSize, 0, Math.PI * 2);
    this.ctx.fill();
  }

  drawFood(food, pulsePhase = 0) {
    if (!food) return;

    const foodColor = getComputedStyle(document.documentElement).getPropertyValue('--food-color').trim();
    const padding = Math.max(1, this.cellSize * 0.15);
    const baseSize = this.cellSize - padding * 2;
    const pulse = Math.sin(pulsePhase) * 0.15 + 1;
    const size = baseSize * pulse;

    const px = food.x * this.cellSize + this.cellSize / 2;
    const py = food.y * this.cellSize + this.cellSize / 2;

    // Glow effect
    this.ctx.shadowColor = foodColor;
    this.ctx.shadowBlur = this.cellSize * 0.5;

    // Main food circle
    this.ctx.fillStyle = foodColor;
    this.ctx.beginPath();
    this.ctx.arc(px, py, size / 2, 0, Math.PI * 2);
    this.ctx.fill();

    // Inner highlight
    this.ctx.fillStyle = this.lightenColor(foodColor, 0.3);
    this.ctx.beginPath();
    this.ctx.arc(px - size * 0.15, py - size * 0.15, size * 0.25, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.shadowBlur = 0;
  }

  drawPowerups(powerups) {
    if (!powerups || powerups.length === 0) return;

    const padding = Math.max(1, this.cellSize * 0.12);
    const size = this.cellSize - padding * 2;

    powerups.forEach(p => {
      const px = p.x * this.cellSize + padding;
      const py = p.y * this.cellSize + padding;

      // Background
      this.ctx.fillStyle = p.color + '33'; // 20% alpha
      this.roundRect(px, py, size, size, size * 0.3);
      this.ctx.fill();

      // Border
      this.ctx.strokeStyle = p.color;
      this.ctx.lineWidth = 2;
      this.roundRect(px, py, size, size, size * 0.3);
      this.ctx.stroke();

      // Icon
      this.ctx.font = `${size * 0.7}px Arial`;
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillStyle = p.color;
      this.ctx.fillText(p.icon, px + size / 2, py + size / 2 + size * 0.1);
    });
  }

  drawObstacles(obstacles, obstacleType = 'static') {
    if (!obstacles || obstacles.length === 0) return;

    const wallColor = getComputedStyle(document.documentElement).getPropertyValue('--accent-danger').trim();
    const padding = Math.max(1, this.cellSize * 0.05);
    const size = this.cellSize - padding * 2;

    obstacles.forEach(obs => {
      const px = obs.x * this.cellSize + padding;
      const py = obs.y * this.cellSize + padding;

      this.ctx.fillStyle = wallColor;

      if (obstacleType === 'moving') {
        // Moving blocks - rounded square with animation
        this.roundRect(px, py, size, size, size * 0.2);
        this.ctx.fill();

        // Direction indicator
        this.ctx.fillStyle = this.lightenColor(wallColor, 0.4);
        const cx = px + size / 2;
        const cy = py + size / 2;
        const arrowSize = size * 0.25;
        if (obs.dir === 'right') {
          this.ctx.beginPath();
          this.ctx.moveTo(cx - arrowSize, cy - arrowSize);
          this.ctx.lineTo(cx + arrowSize, cy);
          this.ctx.lineTo(cx - arrowSize, cy + arrowSize);
          this.ctx.fill();
        } else if (obs.dir === 'left') {
          this.ctx.beginPath();
          this.ctx.moveTo(cx + arrowSize, cy - arrowSize);
          this.ctx.lineTo(cx - arrowSize, cy);
          this.ctx.lineTo(cx + arrowSize, cy + arrowSize);
          this.ctx.fill();
        } else if (obs.dir === 'down') {
          this.ctx.beginPath();
          this.ctx.moveTo(cx - arrowSize, cy - arrowSize);
          this.ctx.lineTo(cx, cy + arrowSize);
          this.ctx.lineTo(cx + arrowSize, cy - arrowSize);
          this.ctx.fill();
        } else if (obs.dir === 'up') {
          this.ctx.beginPath();
          this.ctx.moveTo(cx - arrowSize, cy + arrowSize);
          this.ctx.lineTo(cx, cy - arrowSize);
          this.ctx.lineTo(cx + arrowSize, cy + arrowSize);
          this.ctx.fill();
        }
      } else if (obstacleType === 'portal') {
        // Portal - swirling effect
        const time = Date.now() * 0.005;
        const cx = obs.x * this.cellSize + this.cellSize / 2;
        const cy = obs.y * this.cellSize + this.cellSize / 2;
        const radius = size / 2;

        this.ctx.save();
        this.ctx.translate(cx, cy);
        this.ctx.rotate(time);

        const gradient = this.ctx.createRadialGradient(0, 0, 0, 0, 0, radius);
        gradient.addColorStop(0, obs.linkedColor || '#74b9ff');
        gradient.addColorStop(1, 'transparent');

        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          const angle = (i / 6) * Math.PI * 2 + time;
          const r = radius * (0.5 + 0.5 * Math.sin(time * 2 + i));
          this.ctx.lineTo(Math.cos(angle) * r, Math.sin(angle) * r);
        }
        this.ctx.closePath();
        this.ctx.fill();

        this.ctx.restore();
      } else {
        // Static wall - solid block
        this.roundRect(px, py, size, size, size * 0.15);
        this.ctx.fill();

        // Subtle pattern
        this.ctx.fillStyle = this.lightenColor(wallColor, 0.15);
        this.ctx.fillRect(px + 2, py + 2, size - 4, 1);
        this.ctx.fillRect(px + 2, py + size - 3, size - 4, 1);
      }
    });
  }

  lerpColor(c1, c2, t) {
    const rgb1 = this.hexToRgb(c1);
    const rgb2 = this.hexToRgb(c2);
    if (!rgb1 || !rgb2) return c1;
    const r = Math.round(rgb1.r + (rgb2.r - rgb1.r) * t);
    const g = Math.round(rgb1.g + (rgb2.g - rgb1.g) * t);
    const b = Math.round(rgb1.b + (rgb2.b - rgb1.b) * t);
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }

  lightenColor(hex, amount) {
    const rgb = this.hexToRgb(hex);
    if (!rgb) return hex;
    const r = Math.min(255, Math.round(rgb.r + (255 - rgb.r) * amount));
    const g = Math.min(255, Math.round(rgb.g + (255 - rgb.g) * amount));
    const b = Math.min(255, Math.round(rgb.b + (255 - rgb.b) * amount));
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }

  hexToRgb(hex) {
    const match = hex.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
    return match ? {
      r: parseInt(match[1], 16),
      g: parseInt(match[2], 16),
      b: parseInt(match[3], 16)
    } : null;
  }

  // Render game state
  render(gameState) {
    const now = performance.now();
    this.fps = 1000 / (now - this.lastRenderTime) || 60;
    this.lastRenderTime = now;

    this.clear();
    this.drawGrid();

    // Draw in order: obstacles, food, powerups, snake
    if (gameState.obstacles) {
      this.drawObstacles(gameState.obstacles.static, 'static');
      this.drawObstacles(gameState.obstacles.moving, 'moving');
      this.drawObstacles(gameState.obstacles.portals, 'portal');
    }

    if (gameState.food) {
      this.drawFood(gameState.food, now * 0.008);
    }

    if (gameState.powerups) {
      this.drawPowerups(gameState.powerups);
    }

    if (gameState.snake) {
      this.drawSnake(gameState.snake, gameState.isGhost, gameState.hasShield);
    }

    // Debug FPS
    if (this.showFPS) {
      this.ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--fg-muted').trim();
      this.ctx.font = '10px monospace';
      this.ctx.textAlign = 'right';
      this.ctx.fillText(`${Math.round(this.fps)} FPS`, this.width - 5, 15);
    }
  }
}

export const renderer = new Renderer();