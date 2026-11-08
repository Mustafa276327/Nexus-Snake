// Nexus Arena - continuous, Worms-Zone-inspired snake arena.
// Fully original implementation and artwork, no third-party assets.

import { renderer } from '../renderer.js';
import { storage } from '../storage.js';
import { getSkin, SKINS, drawSnake as drawSnakeBody } from './skins.js';
import { arenaAudio } from './audio.js';
import { toast } from '../../ui/toast.js';

const CFG = {
  RADIUS: 1800,
  FOOD_TARGET: 760,
  BOT_TARGET: 12,
  BASE_SPEED: 172,
  BOOST_MULT: 1.9,
  MIN_BOOST_MASS: 16,
  BOOST_DRAIN: 10,
  BASE_RADIUS: 15,
  START_MASS: 12,
  LEN_PER_MASS: 0.95,
  MIN_LEN: 105,
  STEP: 9,
  TURN_RATE: 4.4,
  PLAYER_TURN: 3.4
};

const BOT_NAMES = [
  'Kobra', 'Zeytin', 'Fırtına', 'Gölge', 'Pamuk', 'Viper', 'Mocha', 'Karam',
  'Bora', 'Neşe', 'Duman', 'Kılçık', 'Şimşek', 'Tarçın', 'Zümrüt', 'Poyraz'
];

const ORB_COLORS = ['#ffd166', '#4cc9f0', '#ff70c8', '#8ac926', '#b892ff', '#ff8a5c'];

function rand(a, b) { return a + Math.random() * (b - a); }
function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
function lerp(a, b, t) { return a + (b - a) * t; }
function dist2(ax, ay, bx, by) { const dx = ax - bx, dy = ay - by; return dx * dx + dy * dy; }

function angleLerp(a, b, t) {
  let d = ((b - a + Math.PI) % (Math.PI * 2)) - Math.PI;
  if (d < -Math.PI) d += Math.PI * 2;
  return a + d * t;
}

function roundRect(ctx, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export class ArenaMode {
  constructor(engine) {
    this.engine = engine;
    this.running = false;
    this.inputBound = false;
    this.player = null;
    this.bots = [];
    this.food = [];
    this.particles = [];
    this.respawnQueue = [];
    this.camera = { x: 0, y: 0, zoom: 1 };
    this.pointer = { active: false, id: null, ox: 0, oy: 0, angle: null, boost: false, touch: false };
    this.mouse = { x: 0, y: 0, active: false };
    this.key = { left: false, right: false, boost: false };
    this.time = 0;
    this.score = 0;
    this.kills = 0;
    this.eatSoundAt = 0;
    this.shake = 0;
    this.playerDead = false;
    this.deathHandled = false;
  }

  get config() { return CFG; }

  // ---------------- lifecycle ----------------
  init() {
    let savedSkin = null;
    try { savedSkin = JSON.parse(localStorage.getItem('ns_arena_skin')); } catch { savedSkin = null; }
    this.playerSkinId = savedSkin || SKINS[0].id;

    this.player = this.makeSnake({
      name: 'SEN', isPlayer: true, skin: getSkin(this.playerSkinId),
      mass: CFG.START_MASS, x: 0, y: 0, angle: -Math.PI / 2
    });

    this.bots = [];
    for (let i = 0; i < CFG.BOT_TARGET; i++) this.spawnBot(true);

    this.food = [];
    this.particles = [];
    this.respawnQueue = [];
    this.time = 0;
    this.score = 0;
    this.kills = 0;
    this.shake = 0;
    this.playerDead = false;
    this.deathHandled = false;
    this.camera.x = this.player.x;
    this.camera.y = this.player.y;
    this.camera.zoom = 1;

    this.seedFood();
    this.bindInput();
    this.running = true;

    this.engine.score = 0;
    arenaAudio.init();
    arenaAudio.sfx('start');
  }

  stop() {
    this.running = false;
  }

  makeSnake({ name, isPlayer = false, skin, mass, x, y, angle }) {
    const s = {
      name, isPlayer, skin, mass, x, y, angle,
      targetAngle: angle, speed: CFG.BASE_SPEED,
      radius: CFG.BASE_RADIUS + Math.sqrt(mass) * 0.95,
      history: [], body: [{ x, y }], bodyLength: CFG.MIN_LEN + mass * CFG.LEN_PER_MASS,
      alive: true, boost: false, boosting: false, aiTimer: 0, wanderAngle: angle,
      eatFlash: 0, boostFx: 0, deathCause: null
    };
    return s;
  }

  spawnBot(initial = false) {
    const a = rand(0, Math.PI * 2);
    const r = initial ? rand(350, CFG.RADIUS - 350) : rand(500, CFG.RADIUS - 300);
    const x = Math.cos(a) * r;
    const y = Math.sin(a) * r;
    const mass = rand(10, initial ? 70 : 40);
    const skin = SKINS[Math.floor(Math.random() * SKINS.length)];
    const name = BOT_NAMES[Math.floor(Math.random() * BOT_NAMES.length)];
    const bot = this.makeSnake({ name, skin, mass, x, y, angle: rand(0, Math.PI * 2) });
    this.bots.push(bot);
    return bot;
  }

  seedFood() {
    while (this.food.length < CFG.FOOD_TARGET) this.spawnFood();
  }

  spawnFood(x, y, value, radius) {
    if (x == null) {
      const a = rand(0, Math.PI * 2);
      const r = Math.sqrt(Math.random()) * (CFG.RADIUS - 40);
      x = Math.cos(a) * r;
      y = Math.sin(a) * r;
    }
    const big = Math.random() < 0.08;
    const v = value != null ? value : (big ? Math.round(rand(8, 16)) : Math.round(rand(1, 3)));
    const rad = radius != null ? radius : (big ? rand(9, 14) : rand(5, 8));
    const color = ORB_COLORS[Math.floor(Math.random() * ORB_COLORS.length)];
    this.food.push({ x, y, value: v, r: rad, color, big, phase: rand(0, Math.PI * 2) });
  }

  // ---------------- input ----------------
  bindInput() {
    if (this.inputBound) return;
    this.inputBound = true;
    const canvas = renderer.canvas;
    if (!canvas) return;

    const isArena = () => this.engine.currentMode === 'arena' && this.engine.state.isPlaying();

    this.onPointerDown = (e) => {
      if (!isArena()) return;
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      this.pointer.active = true;
      this.pointer.id = e.pointerId;
      this.pointer.ox = e.clientX;
      this.pointer.oy = e.clientY;
      this.pointer.touch = e.pointerType !== 'mouse';
      this.pointer.angle = null;
      if (e.pointerType === 'mouse') this.pointer.boost = true;
      try { canvas.setPointerCapture?.(e.pointerId); } catch { /* ignore */ }
      e.preventDefault();
    };

    this.onPointerMove = (e) => {
      if (!isArena()) return;
      if (e.pointerType === 'mouse') {
        this.mouse.x = e.clientX;
        this.mouse.y = e.clientY;
        this.mouse.active = true;
        if (this.pointer.active) this.pointer.boost = e.buttons > 0;
        return;
      }
      if (!this.pointer.active || e.pointerId !== this.pointer.id) return;
      const dx = e.clientX - this.pointer.ox;
      const dy = e.clientY - this.pointer.oy;
      if (Math.hypot(dx, dy) > 14) {
        this.pointer.angle = Math.atan2(dy, dx);
      }
      e.preventDefault();
    };

    this.onPointerUp = (e) => {
      if (!this.pointer.active || e.pointerId !== this.pointer.id) return;
      this.pointer.active = false;
      this.pointer.boost = false;
      this.pointer.id = null;
    };

    this.onKeyDown = (e) => {
      if (this.engine.currentMode !== 'arena') return;
      this.mouse.active = false;
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') { this.key.left = true; e.preventDefault(); }
      else if (e.code === 'ArrowRight' || e.code === 'KeyD') { this.key.right = true; e.preventDefault(); }
      else if (e.code === 'ArrowUp' || e.code === 'KeyW') { this.key.boost = true; e.preventDefault(); }
      else if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') { this.key.boost = true; e.preventDefault(); }
    };
    this.onKeyUp = (e) => {
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') this.key.left = false;
      else if (e.code === 'ArrowRight' || e.code === 'KeyD') this.key.right = false;
      else if (['ArrowUp', 'KeyW', 'ShiftLeft', 'ShiftRight'].includes(e.code)) this.key.boost = false;
    };

    canvas.addEventListener('pointerdown', this.onPointerDown, { passive: false });
    canvas.addEventListener('pointermove', this.onPointerMove, { passive: false });
    canvas.addEventListener('pointerup', this.onPointerUp);
    canvas.addEventListener('pointercancel', this.onPointerUp);
    window.addEventListener('keydown', this.onKeyDown, { passive: false });
    window.addEventListener('keyup', this.onKeyUp);

    const boostBtn = document.getElementById('arenaBoost');
    if (boostBtn) {
      this.onBoostDown = (e) => { if (isArena()) { this.pointer.boost = true; e.preventDefault(); } };
      this.onBoostUp = () => { this.pointer.boost = false; };
      boostBtn.addEventListener('pointerdown', this.onBoostDown, { passive: false });
      boostBtn.addEventListener('pointerup', this.onBoostUp);
      boostBtn.addEventListener('pointercancel', this.onBoostUp);
      boostBtn.addEventListener('pointerleave', this.onBoostUp);
    }
  }

  // ---------------- update ----------------
  update(dtMs) {
    if (!this.running) return;
    const dt = Math.min(dtMs / 1000, 0.05);
    this.time += dt;

    this.updatePlayer(dt);

    for (const bot of this.bots) {
      if (!bot.alive) continue;
      this.updateBotAI(bot, dt);
      this.updateSnake(bot, dt);
    }

    // Remove dead bots (respawns are scheduled by killSnake)
    this.bots = this.bots.filter(b => b.alive);
    for (let i = this.respawnQueue.length - 1; i >= 0; i--) {
      this.respawnQueue[i] -= dt;
      if (this.respawnQueue[i] <= 0) {
        this.respawnQueue.splice(i, 1);
        if (this.running && this.bots.length < CFG.BOT_TARGET) this.spawnBot();
      }
    }

    this.eatFood();
    this.checkDeaths();
    this.updateParticles(dt);
    this.updateCamera(dt);

    this.score = Math.floor(this.player.mass);
    this.engine.score = this.score;
    this.shake = Math.max(0, this.shake - dt * 18);

    if (this.playerDead && !this.deathHandled) {
      this.deathHandled = true;
      const score = this.score;
      this.running = false;
      setTimeout(() => {
        if (this.engine.currentMode === 'arena') {
          this.engine.onArenaGameOver(score, this.kills);
        }
      }, 650);
    }
  }

  updatePlayer(dt) {
    if (!this.player.alive) return;
    // Steering from keyboard
    if (this.key.left || this.key.right) {
      const dir = (this.key.right ? 1 : 0) - (this.key.left ? 1 : 0);
      this.player.targetAngle = this.player.angle + dir * 1.2;
    }

    // Steering from pointer joystick (touch) or mouse
    if (this.pointer.active && this.pointer.angle != null) {
      this.player.targetAngle = this.pointer.angle;
    } else if (this.mouse.active) {
      const hw = renderer.width / 2, hh = renderer.height / 2;
      const dx = this.mouse.x - hw, dy = this.mouse.y - hh;
      if (Math.hypot(dx, dy) > 24) this.player.targetAngle = Math.atan2(dy, dx);
    }

    this.player.boost = this.key.boost || this.pointer.boost;
    this.updateSnake(this.player, dt, true);
  }

  updateSnake(s, dt, isPlayer = false) {
    const massPenalty = 1 - Math.min(s.mass / 5200, 0.38);
    let speed = CFG.BASE_SPEED * massPenalty;

    s.boosting = !!s.boost && s.mass > CFG.MIN_BOOST_MASS;
    if (s.boosting) {
      speed *= CFG.BOOST_MULT;
      s.mass = Math.max(CFG.MIN_BOOST_MASS * 0.5, s.mass - CFG.BOOST_DRAIN * dt);
      s.boostFx += dt;
      if (s.boostFx > 0.03) {
        s.boostFx = 0;
        this.emitParticle(s.x, s.y, s.skin.glow, rand(1.5, 3.5), 0.5);
      }
    }
    s.speed = speed;

    // Smooth turn toward target
    const turn = (isPlayer ? CFG.PLAYER_TURN : CFG.TURN_RATE) * (s.boosting ? 0.9 : 1);
    s.angle = angleLerp(s.angle, s.targetAngle, Math.min(1, turn * dt));

    s.x += Math.cos(s.angle) * speed * dt;
    s.y += Math.sin(s.angle) * speed * dt;

    // Sample the trail
    const last = s.history[0];
    if (!last || dist2(s.x, s.y, last.x, last.y) >= CFG.STEP * CFG.STEP) {
      s.history.unshift({ x: s.x, y: s.y });
    }

    // Rebuild body
    s.radius = CFG.BASE_RADIUS + Math.sqrt(Math.max(0, s.mass)) * 0.95;
    s.bodyLength = CFG.MIN_LEN + s.mass * CFG.LEN_PER_MASS;
    const body = [{ x: s.x, y: s.y }];
    let total = 0, prev = { x: s.x, y: s.y };
    for (const p of s.history) {
      const d = Math.hypot(p.x - prev.x, p.y - prev.y);
      if (d < 0.001) continue;
      if (total + d >= s.bodyLength) {
        const t = (s.bodyLength - total) / d;
        body.push({ x: prev.x + (p.x - prev.x) * t, y: prev.y + (p.y - prev.y) * t });
        break;
      }
      total += d;
      body.push(p);
      prev = p;
    }
    s.body = body;
    const maxPts = Math.ceil(s.bodyLength / CFG.STEP) + 8;
    if (s.history.length > maxPts) s.history.length = maxPts;
  }

  updateBotAI(bot, dt) {
    bot.aiTimer -= dt;
    if (bot.aiTimer > 0) return;
    bot.aiTimer = 0.08 + Math.random() * 0.07;

    // Nearest food
    let best = null, bestD = 1100 * 1100;
    for (const f of this.food) {
      const d = dist2(bot.x, bot.y, f.x, f.y);
      if (d < bestD) { bestD = d; best = f; }
    }

    let desired;
    if (best) {
      desired = Math.atan2(best.y - bot.y, best.x - bot.x);
    } else {
      bot.wanderAngle += rand(-0.5, 0.5);
      desired = bot.wanderAngle;
    }

    // Avoid other bodies
    const avoid = this.findAvoidance(bot);
    if (avoid != null) desired = angleLerp(desired, avoid, 0.75);

    // Avoid arena edge
    const dc = Math.hypot(bot.x, bot.y);
    if (dc > CFG.RADIUS - 260) {
      desired = Math.atan2(-bot.y, -bot.x);
    }

    bot.targetAngle = desired;
    bot.boost = Math.random() < 0.16 && bot.mass > 40 && dc < CFG.RADIUS - 400;
  }

  findAvoidance(bot) {
    const look = 130;
    const lx = bot.x + Math.cos(bot.angle) * look;
    const ly = bot.y + Math.sin(bot.angle) * look;
    let ax = 0, ay = 0, hit = false;
    for (const other of [...this.bots, this.player]) {
      if (other === bot || !other.alive) continue;
      if (dist2(bot.x, bot.y, other.x, other.y) > (other.bodyLength + 260) ** 2) continue;
      for (let i = 0; i < other.body.length; i += 2) {
        const p = other.body[i];
        if (dist2(lx, ly, p.x, p.y) < 100 * 100) {
          ax += lx - p.x;
          ay += ly - p.y;
          hit = true;
        }
      }
    }
    if (!hit) return null;
    return Math.atan2(ay, ax);
  }

  eatFood() {
    const snakes = [this.player, ...this.bots];
    for (let i = this.food.length - 1; i >= 0; i--) {
      const f = this.food[i];
      let taken = false;
      for (const s of snakes) {
        if (!s.alive) continue;
        const reach = s.radius + f.r + 4;
        if (dist2(s.x, s.y, f.x, f.y) <= reach * reach) {
          s.mass += f.value;
          if (s.isPlayer) {
            s.eatFlash = 1;
            if (this.time - this.eatSoundAt > 0.05) {
              this.eatSoundAt = this.time;
              arenaAudio.sfx('eat');
            }
            this.emitBurst(f.x, f.y, f.color, 4);
          }
          this.food.splice(i, 1);
          this.spawnFood();
          taken = true;
          break;
        }
      }
      if (taken) continue;
    }

    // Particles for player eat flash
    this.player.eatFlash = Math.max(0, this.player.eatFlash - 0.08);
  }

  checkDeaths() {
    const snakes = [this.player, ...this.bots];
    const dead = new Set();
    for (const a of snakes) {
      if (!a.alive) continue;
      // Arena wall
      if (Math.hypot(a.x, a.y) > CFG.RADIUS - a.radius * 0.4) {
        dead.add(a);
        a.deathCause = 'wall';
        continue;
      }
      // Head vs other bodies
      for (const b of snakes) {
        if (b === a || !b.alive) continue;
        const reach = a.radius * 0.68 + b.radius * 0.7;
        const maxD = b.bodyLength + reach + 80;
        if (dist2(a.x, a.y, b.x, b.y) > maxD * maxD) continue;
        for (let i = 0; i < b.body.length; i++) {
          const p = b.body[i];
          if (dist2(a.x, a.y, p.x, p.y) < reach * reach) {
            dead.add(a);
            a.deathCause = 'body';
            break;
          }
        }
        if (dead.has(a)) break;
      }
    }
    for (const s of dead) this.killSnake(s);
  }

  killSnake(s) {
    if (!s.alive) return;
    s.alive = false;

    // Drop food along the body
    const drops = clamp(Math.floor(s.mass / 6), 8, 70);
    for (let i = 0; i < drops; i++) {
      if (this.food.length >= 1050) break;
      const p = s.body[Math.floor((i / drops) * s.body.length)] || { x: s.x, y: s.y };
      const value = Math.max(1, Math.round(s.mass / drops));
      this.spawnFood(p.x + rand(-10, 10), p.y + rand(-10, 10), value, rand(5, 9));
    }

    this.emitBurst(s.x, s.y, s.skin.glow, s.isPlayer ? 40 : 22);

    if (s.isPlayer) {
      arenaAudio.sfx('death');
      this.playerDead = true;
      this.shake = 14;
    } else {
      arenaAudio.sfx('collision');
      this.kills++;
      this.respawnQueue.push(rand(1.2, 2.2));
    }
  }

  onArenaGameOver(score, kills) {
    this.engine.onArenaGameOver(score, kills);
  }

  // ---------------- particles ----------------
  emitParticle(x, y, color, size, life) {
    if (this.particles.length > 380) return;
    const a = rand(0, Math.PI * 2);
    const sp = rand(20, 120);
    this.particles.push({
      x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
      life: life != null ? life : rand(0.4, 0.9), maxLife: life != null ? life : 0.9,
      size: size || rand(1, 3), color
    });
  }

  emitBurst(x, y, color, count) {
    for (let i = 0; i < count; i++) this.emitParticle(x, y, color, rand(1.5, 4), rand(0.4, 0.9));
  }

  updateParticles(dt) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      if (p.life <= 0) { this.particles.splice(i, 1); continue; }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.94;
      p.vy *= 0.94;
    }
  }

  updateCamera(dt) {
    this.camera.x = lerp(this.camera.x, this.player.x, Math.min(1, 8 * dt));
    this.camera.y = lerp(this.camera.y, this.player.y, Math.min(1, 8 * dt));
    const targetZoom = clamp(1.34 - Math.log10(this.player.mass + 12) * 0.22, 0.62, 1.22);
    this.camera.zoom = lerp(this.camera.zoom, targetZoom, Math.min(1, 3 * dt));
  }

  // ---------------- render ----------------
  render() {
    const ctx = renderer.ctx;
    if (!ctx) return;
    const W = renderer.width, H = renderer.height;

    // Background
    ctx.fillStyle = '#05060a';
    ctx.fillRect(0, 0, W, H);

    const shakeX = this.shake ? rand(-this.shake, this.shake) : 0;
    const shakeY = this.shake ? rand(-this.shake, this.shake) : 0;

    ctx.save();
    ctx.translate(W / 2 + shakeX, H / 2 + shakeY);
    ctx.scale(this.camera.zoom, this.camera.zoom);
    ctx.translate(-this.camera.x, -this.camera.y);

    this.drawArena(ctx);
    this.drawFood(ctx);
    this.drawSnakes(ctx);
    this.drawParticles(ctx);

    ctx.restore();

    if (this.pointer.active) this.drawJoystick(ctx);
    this.drawHud(ctx, W, H);
  }

  drawArena(ctx) {
    // Outer void glow
    const g = ctx.createRadialGradient(0, 0, CFG.RADIUS * 0.55, 0, 0, CFG.RADIUS * 1.02);
    g.addColorStop(0, '#0b1020');
    g.addColorStop(0.72, '#0a0e1c');
    g.addColorStop(1, '#1a2a4a');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, CFG.RADIUS, 0, Math.PI * 2);
    ctx.fill();

    // Concentric rings
    ctx.strokeStyle = 'rgba(90, 140, 220, 0.10)';
    ctx.lineWidth = 2;
    for (let r = 300; r < CFG.RADIUS; r += 300) {
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Spokes
    ctx.strokeStyle = 'rgba(90, 140, 220, 0.06)';
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * 120, Math.sin(a) * 120);
      ctx.lineTo(Math.cos(a) * CFG.RADIUS, Math.sin(a) * CFG.RADIUS);
      ctx.stroke();
    }

    // Border
    ctx.save();
    ctx.strokeStyle = 'rgba(90, 180, 255, 0.55)';
    ctx.lineWidth = 10;
    ctx.shadowColor = 'rgba(70, 160, 255, 0.8)';
    ctx.shadowBlur = 40;
    ctx.beginPath();
    ctx.arc(0, 0, CFG.RADIUS, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // Center marker
    ctx.strokeStyle = 'rgba(120, 200, 255, 0.18)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, 60, 0, Math.PI * 2);
    ctx.stroke();
  }

  drawFood(ctx) {
    const z = this.camera.zoom;
    const viewW = renderer.width / z, viewH = renderer.height / z;
    const cx = this.camera.x, cy = this.camera.y;
    const minX = cx - viewW / 2 - 40, maxX = cx + viewW / 2 + 40;
    const minY = cy - viewH / 2 - 40, maxY = cy + viewH / 2 + 40;

    ctx.save();
    for (const f of this.food) {
      if (f.x < minX || f.x > maxX || f.y < minY || f.y > maxY) continue;
      const pulse = 1 + Math.sin(this.time * 3 + f.phase) * 0.12;
      const r = f.r * pulse;

      if (f.big) {
        ctx.shadowColor = f.color;
        ctx.shadowBlur = 18;
      }
      ctx.fillStyle = f.color;
      ctx.beginPath();
      ctx.arc(f.x, f.y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Highlight
      ctx.fillStyle = 'rgba(255,255,255,0.75)';
      ctx.beginPath();
      ctx.arc(f.x - r * 0.3, f.y - r * 0.3, Math.max(1, r * 0.28), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  drawSnakes(ctx) {
    for (const bot of this.bots) {
      if (!bot.alive) continue;
      this.drawSnake(ctx, bot);
    }
    if (this.player.alive) this.drawSnake(ctx, this.player);
  }

  drawSnake(ctx, s) {
    const nameColor = s.isPlayer ? '#7ef0ff' : 'rgba(220,230,255,0.75)';
    drawSnakeBody(ctx, s.body, s.radius, s.skin, this.time * 1.2, {
      name: s.name,
      nameColor
    });

    // Boost aura
    if (s.boosting) {
      ctx.save();
      ctx.globalAlpha = 0.4;
      ctx.strokeStyle = s.skin.glow;
      ctx.lineWidth = s.radius * 0.6;
      ctx.shadowColor = s.skin.glow;
      ctx.shadowBlur = 20;
      ctx.beginPath();
      ctx.moveTo(s.body[0].x, s.body[0].y);
      for (let i = 1; i < Math.min(s.body.length, 14); i++) {
        ctx.lineTo(s.body[i].x, s.body[i].y);
      }
      ctx.stroke();
      ctx.restore();
    }
  }

  drawParticles(ctx) {
    ctx.save();
    for (const p of this.particles) {
      const a = clamp(p.life / p.maxLife, 0, 1);
      ctx.globalAlpha = a;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * a, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  drawJoystick(ctx) {
    const ox = this.pointer.ox;
    const oy = this.pointer.oy;
    ctx.save();
    ctx.globalAlpha = 0.5;
    ctx.strokeStyle = '#7ef0ff';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(ox, oy, 50, 0, Math.PI * 2);
    ctx.stroke();
    if (this.pointer.angle != null) {
      ctx.beginPath();
      ctx.moveTo(ox, oy);
      ctx.lineTo(ox + Math.cos(this.pointer.angle) * 46, oy + Math.sin(this.pointer.angle) * 46);
      ctx.stroke();
    }
    ctx.restore();
  }

  // ---------------- HUD (screen space) ----------------
  drawHud(ctx, W, H) {
    const p = this.player;
    ctx.save();
    ctx.textBaseline = 'top';

    // Score panel
    this.panel(ctx, 14, 14, 190, 76);
    ctx.fillStyle = 'rgba(180,220,255,0.7)';
    ctx.font = "700 11px 'JetBrains Mono', monospace";
    ctx.fillText('KÜTLE', 28, 26);
    ctx.fillStyle = '#eafcff';
    ctx.font = "800 32px 'Space Grotesk', sans-serif";
    ctx.fillText(this.score.toLocaleString('tr-TR'), 28, 40);
    ctx.fillStyle = p.skin.glow;
    ctx.font = "700 11px 'JetBrains Mono', monospace";
    ctx.fillText(`${p.skin.emoji} ${p.skin.name}  ·  ${this.kills} AV`, 28, 76);

    // Leaderboard
    const lb = [p, ...this.bots].filter(s => s.alive).sort((a, b) => b.mass - a.mass);
    const top = lb.slice(0, 5);
    const lbW = 210, lbH = 24 + top.length * 22;
    this.panel(ctx, W - lbW - 14, 14, lbW, lbH);
    ctx.fillStyle = 'rgba(180,220,255,0.7)';
    ctx.font = "700 11px 'JetBrains Mono', monospace";
    ctx.fillText('LİDERLER', W - lbW, 24);
    top.forEach((s, i) => {
      const y = 42 + i * 22;
      ctx.fillStyle = s.isPlayer ? '#7ef0ff' : 'rgba(220,230,255,0.8)';
      ctx.font = "600 13px 'Space Grotesk', sans-serif";
      const label = `${i + 1}. ${s.name}`;
      ctx.fillText(label.length > 14 ? label.slice(0, 14) + '…' : label, W - lbW, y);
      ctx.textAlign = 'right';
      ctx.fillStyle = s.isPlayer ? '#7ef0ff' : 'rgba(160,190,230,0.9)';
      ctx.font = "700 13px 'JetBrains Mono', monospace";
      ctx.fillText(Math.floor(s.mass).toLocaleString('tr-TR'), W - 26, y);
      ctx.textAlign = 'left';
    });

    // Mini-map
    const mapR = 54;
    const mapX = 24 + mapR, mapY = H - 24 - mapR;
    ctx.save();
    ctx.globalAlpha = 0.85;
    ctx.fillStyle = 'rgba(8,14,28,0.72)';
    ctx.beginPath();
    ctx.arc(mapX, mapY, mapR, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(90,180,255,0.45)';
    ctx.lineWidth = 2;
    ctx.stroke();
    const scale = mapR / CFG.RADIUS;
    for (const s of [p, ...this.bots]) {
      if (!s.alive) continue;
      ctx.fillStyle = s.isPlayer ? '#7ef0ff' : 'rgba(200,210,255,0.55)';
      ctx.beginPath();
      ctx.arc(mapX + s.x * scale, mapY + s.y * scale, s.isPlayer ? 3.5 : 2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // Boost hint / meter
    const boostReady = p.mass > CFG.MIN_BOOST_MASS;
    const bx = W / 2 - 70, by = H - 40;
    ctx.textAlign = 'center';
    ctx.font = "700 12px 'JetBrains Mono', monospace";
    ctx.fillStyle = boostReady ? 'rgba(126,240,255,0.85)' : 'rgba(160,160,180,0.5)';
    ctx.fillText(boostReady ? 'HIZLAN ▶▶' : 'HIZLAN (kütle gerek)', W / 2, by + 6);
    ctx.textAlign = 'left';

    ctx.restore();
  }

  panel(ctx, x, y, w, h) {
    roundRect(ctx, x, y, w, h, 14);
    ctx.fillStyle = 'rgba(8,14,28,0.62)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(90,180,255,0.22)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
}
