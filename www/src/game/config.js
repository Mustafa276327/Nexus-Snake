// Nexus Snake - Configuration, Themes & Game Modes Registry

export const GameState = {
  MENU: 'menu',
  PLAYING: 'playing',
  PAUSED: 'paused',
  GAME_OVER: 'game_over',
  SETTINGS: 'settings'
};

export const Direction = {
  UP: { x: 0, y: -1, key: 'ArrowUp', opposite: 'DOWN' },
  DOWN: { x: 0, y: 1, key: 'ArrowDown', opposite: 'UP' },
  LEFT: { x: -1, y: 0, key: 'ArrowLeft', opposite: 'RIGHT' },
  RIGHT: { x: 1, y: 0, key: 'ArrowRight', opposite: 'LEFT' }
};

export const POWERUP_TYPES = {
  SPEED_BOOST: { id: 'speed_boost', name: 'Hızlanma', icon: '⚡', color: '#ff6b35', duration: 5000, description: 'Hız %50 artar' },
  SLOW_DOWN: { id: 'slow_down', name: 'Yavaşlama', icon: '🐌', color: '#4ecdc4', duration: 5000, description: 'Hız %50 azalır' },
  SHRINK: { id: 'shrink', name: 'Küçülme', icon: '📏', color: '#a8e6cf', duration: 8000, description: 'Yılan 3 segment kısalır' },
  DOUBLE_POINTS: { id: 'double_points', name: '2x Puan', icon: '💎', color: '#ffd93d', duration: 10000, description: 'Puan 2 katına çıkar' },
  GHOST: { id: 'ghost', name: 'Hayalet', icon: '👻', color: '#d4a5ff', duration: 8000, description: 'Duvarlardan geçersin' },
  SHIELD: { id: 'shield', name: 'Kalkan', icon: '🛡️', color: '#74b9ff', duration: 0, description: 'Bir çarpma korur', charges: 1 }
};

export const OBSTACLE_TYPES = {
  STATIC_WALL: 'static_wall',
  MOVING_BLOCK: 'moving_block',
  PORTAL_PAIR: 'portal_pair'
};

export const THEMES = {
  dark: {
    name: 'Koyu',
    cssVars: {
      '--bg-primary': '#0d1117',
      '--bg-secondary': '#161b22',
      '--bg-tertiary': '#21262d',
      '--fg-primary': '#e6edf3',
      '--fg-secondary': '#8b949e',
      '--fg-muted': '#6e7681',
      '--accent-primary': '#58a6ff',
      '--accent-secondary': '#f78166',
      '--accent-success': '#3fb950',
      '--accent-warning': '#d29922',
      '--accent-danger': '#f85149',
      '--border-color': '#30363d',
      '--card-bg': 'rgba(22, 27, 34, 0.9)',
      '--overlay-bg': 'rgba(13, 17, 23, 0.95)',
      '--grid-color': 'rgba(48, 54, 61, 0.5)',
      '--snake-head': '#58a6ff',
      '--snake-body': '#3fb950',
      '--snake-tail': '#2ea043',
      '--food-color': '#f78166',
      '--powerup-glow': 'rgba(247, 129, 102, 0.6)',
      '--shadow-color': 'rgba(0, 0, 0, 0.5)'
    }
  },
  light: {
    name: 'Açık',
    cssVars: {
      '--bg-primary': '#ffffff',
      '--bg-secondary': '#f6f8fa',
      '--bg-tertiary': '#eaeef2',
      '--fg-primary': '#1f2328',
      '--fg-secondary': '#656d76',
      '--fg-muted': '#8b949e',
      '--accent-primary': '#0969da',
      '--accent-secondary': '#bc4c00',
      '--accent-success': '#1a7f37',
      '--accent-warning': '#9a6700',
      '--accent-danger': '#cf222e',
      '--border-color': '#d0d7de',
      '--card-bg': 'rgba(246, 248, 250, 0.95)',
      '--overlay-bg': 'rgba(255, 255, 255, 0.98)',
      '--grid-color': 'rgba(208, 215, 222, 0.8)',
      '--snake-head': '#0969da',
      '--snake-body': '#1a7f37',
      '--snake-tail': '#2da44e',
      '--food-color': '#bc4c00',
      '--powerup-glow': 'rgba(188, 76, 0, 0.4)',
      '--shadow-color': 'rgba(0, 0, 0, 0.15)'
    }
  },
  neon: {
    name: 'Neon',
    cssVars: {
      '--bg-primary': '#0a0a0f',
      '--bg-secondary': '#12121a',
      '--bg-tertiary': '#1a1a2e',
      '--fg-primary': '#f0f0f0',
      '--fg-secondary': '#a0a0b0',
      '--fg-muted': '#707080',
      '--accent-primary': '#00ffff',
      '--accent-secondary': '#ff00ff',
      '--accent-success': '#39ff14',
      '--accent-warning': '#ffff00',
      '--accent-danger': '#ff206e',
      '--border-color': '#00ffff',
      '--card-bg': 'rgba(18, 18, 26, 0.9)',
      '--overlay-bg': 'rgba(10, 10, 15, 0.95)',
      '--grid-color': 'rgba(0, 255, 255, 0.15)',
      '--snake-head': '#00ffff',
      '--snake-body': '#39ff14',
      '--snake-tail': '#00cccc',
      '--food-color': '#ff00ff',
      '--powerup-glow': 'rgba(255, 0, 255, 0.7)',
      '--shadow-color': 'rgba(0, 255, 255, 0.3)'
    }
  },
  retro: {
    name: 'Retro',
    cssVars: {
      '--bg-primary': '#1a1a2e',
      '--bg-secondary': '#16213e',
      '--bg-tertiary': '#0f3460',
      '--fg-primary': '#eaeaea',
      '--fg-secondary': '#a0a0a0',
      '--fg-muted': '#707070',
      '--accent-primary': '#e94560',
      '--accent-secondary': '#f5a623',
      '--accent-success': '#4ade80',
      '--accent-warning': '#fbbf24',
      '--accent-danger': '#ef4444',
      '--border-color': '#e94560',
      '--card-bg': 'rgba(22, 33, 62, 0.9)',
      '--overlay-bg': 'rgba(26, 26, 46, 0.95)',
      '--grid-color': 'rgba(233, 69, 96, 0.2)',
      '--snake-head': '#e94560',
      '--snake-body': '#4ade80',
      '--snake-tail': '#22c55e',
      '--food-color': '#f5a623',
      '--powerup-glow': 'rgba(245, 166, 35, 0.6)',
      '--shadow-color': 'rgba(233, 69, 96, 0.4)'
    }
  }
};

export const MODES = {
  classic: {
    id: 'classic',
    name: 'Klasik',
    icon: '🐍',
    description: 'Yem ye, büyü, duvarlardan ve kendinden kaçın',
    unlockScore: 0,
    baseSpeed: 150,
    speedIncrease: 5,
    speedInterval: 5,
    maxSpeed: 60,
    wallsKill: true,
    wrapAround: false,
    autoGrow: false,
    foodSpawnInterval: 0,
    shrinkWalls: false,
    mazeLayout: null,
    scoreMultiplier: 1
  },
  timed: {
    id: 'timed',
    name: 'Zamanlı',
    icon: '⏱️',
    description: '60 saniyen var, her yem +5 saniye, en yüksek skora ulaş',
    unlockScore: 100,
    baseSpeed: 130,
    speedIncrease: 3,
    speedInterval: 8,
    maxSpeed: 70,
    wallsKill: true,
    wrapAround: false,
    autoGrow: false,
    foodSpawnInterval: 0,
    shrinkWalls: false,
    mazeLayout: null,
    scoreMultiplier: 1.5,
    timeLimit: 60000,
    timePerFood: 5000
  },
  survival: {
    id: 'survival',
    name: 'Hayatta Kalma',
    icon: '🛡️',
    description: 'Yem yok, yılan otomatik büyür, oyun alanı kapanır, ne kadar dayanırsın?',
    unlockScore: 500,
    baseSpeed: 160,
    speedIncrease: 2,
    speedInterval: 10,
    maxSpeed: 80,
    wallsKill: true,
    wrapAround: false,
    autoGrow: true,
    growInterval: 3000,
    foodSpawnInterval: 0,
    shrinkWalls: true,
    shrinkInterval: 15000,
    shrinkAmount: 2,
    minGridSize: 8,
    mazeLayout: null,
    scoreMultiplier: 2
  },
  maze: {
    id: 'maze',
    name: 'Labirent',
    icon: '🧩',
    description: 'Sabit duvar labirenti, tek yem, mükemmel yol bul',
    unlockScore: 1000,
    baseSpeed: 140,
    speedIncrease: 4,
    speedInterval: 6,
    maxSpeed: 65,
    wallsKill: true,
    wrapAround: false,
    autoGrow: false,
    foodSpawnInterval: 0,
    shrinkWalls: false,
    mazeLayout: 'default',
    scoreMultiplier: 2.5
  }
};

export const GRID_DEFAULTS = {
  width: 20,
  height: 20,
  cellSize: 20
};

export const STORAGE_KEYS = {
  HIGH_SCORES: 'ns_high_scores',
  SETTINGS: 'ns_settings',
  STATS: 'ns_stats',
  LAST_MODE: 'ns_last_mode',
  UNLOCKED_MODES: 'ns_unlocked_modes'
};

export const DEFAULT_SETTINGS = {
  theme: 'dark',
  sound: true,
  haptics: true,
  controls: 'swipe',
  showGrid: true,
  showFPS: false
};

export const MAZE_LAYOUTS = {
  default: [
    // Top border
    ...Array.from({ length: 20 }, (_, i) => ({ x: i, y: 0 })),
    // Bottom border
    ...Array.from({ length: 20 }, (_, i) => ({ x: i, y: 19 })),
    // Left border
    ...Array.from({ length: 18 }, (_, i) => ({ x: 0, y: i + 1 })),
    // Right border
    ...Array.from({ length: 18 }, (_, i) => ({ x: 19, y: i + 1 })),
    // Internal walls - vertical corridors
    { x: 5, y: 3 }, { x: 5, y: 4 }, { x: 5, y: 5 }, { x: 5, y: 6 },
    { x: 10, y: 7 }, { x: 10, y: 8 }, { x: 10, y: 9 }, { x: 10, y: 10 },
    { x: 15, y: 11 }, { x: 15, y: 12 }, { x: 15, y: 13 }, { x: 15, y: 14 },
    // Internal walls - horizontal barriers
    { x: 3, y: 8 }, { x: 4, y: 8 }, { x: 5, y: 8 }, { x: 6, y: 8 }, { x: 7, y: 8 },
    { x: 12, y: 4 }, { x: 13, y: 4 }, { x: 14, y: 4 }, { x: 15, y: 4 }, { x: 16, y: 4 },
    { x: 8, y: 15 }, { x: 9, y: 15 }, { x: 10, y: 15 }, { x: 11, y: 15 }, { x: 12, y: 15 },
    // Center cross
    { x: 9, y: 9 }, { x: 10, y: 9 }, { x: 11, y: 9 },
    { x: 10, y: 8 }, { x: 10, y: 10 }
  ]
};