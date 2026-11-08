// Nexus Arena - Original procedural snake skins
// 100% original artwork generated in code (no third-party assets).

export const SKINS = [
  { id: 'alev',      name: 'Alev',        emoji: '🔥', colors: ['#ffe066', '#ff7b00', '#8c1d00'], pattern: 'gradient', glow: '#ff5a1f' },
  { id: 'buz',       name: 'Buz',         emoji: '❄️', colors: ['#eafcff', '#4cc9f0', '#1b4965'], pattern: 'scales',   glow: '#5ee7ff' },
  { id: 'neon',      name: 'Neon',        emoji: '💜', colors: ['#ff2ec4', '#7b2cff', '#001233'], pattern: 'stripes',  glow: '#ff2ec4' },
  { id: 'orman',     name: 'Orman',       emoji: '🌿', colors: ['#d8f3dc', '#2d6a4f', '#081c15'], pattern: 'scales',   glow: '#52b788' },
  { id: 'altin',     name: 'Altın',       emoji: '🏆', colors: ['#fff3b0', '#ffc300', '#7a4b00'], pattern: 'gradient', glow: '#ffd60a' },
  { id: 'gece',      name: 'Gece',        emoji: '🌌', colors: ['#cbb8ff', '#3a0ca3', '#03001c'], pattern: 'stars',    glow: '#7b2cff' },
  { id: 'zebra',     name: 'Zebra',       emoji: '🦓', colors: ['#ffffff', '#222222', '#000000'], pattern: 'stripes',  glow: '#bbbbbb' },
  { id: 'lav',       name: 'Lav',         emoji: '🌋', colors: ['#ffb703', '#e63946', '#1a0000'], pattern: 'cracks',   glow: '#ff5400' },
  { id: 'gokkusagi', name: 'Gökkuşağı',   emoji: '🌈', colors: ['#ff595e', '#ffca3a', '#1982c4'], pattern: 'rainbow',  glow: '#8ac926' },
  { id: 'seker',     name: 'Şeker',       emoji: '🍬', colors: ['#ffd6f5', '#ff70c8', '#8e1b6b'], pattern: 'spots',    glow: '#ff8fd6' },
  { id: 'zumrut',    name: 'Zümrüt',      emoji: '💚', colors: ['#d8fff0', '#00b894', '#003d2b'], pattern: 'scales',   glow: '#00e0a4' },
  { id: 'kozmik',    name: 'Kozmik',      emoji: '✨', colors: ['#a0c4ff', '#0b3d91', '#01021a'], pattern: 'stars',    glow: '#6ea8ff' },
  { id: 'ejder',     name: 'Ateş Ejderi', emoji: '🐉', colors: ['#ffd60a', '#d00000', '#370617'], pattern: 'cracks',   glow: '#ff3c00' },
  { id: 'sudragon',  name: 'Su Ejderi',   emoji: '🐲', colors: ['#caf0f8', '#0096c7', '#03045e'], pattern: 'scales',   glow: '#48cae4' },
  { id: 'panda',     name: 'Panda',       emoji: '🐼', colors: ['#ffffff', '#333333', '#000000'], pattern: 'spots',    glow: '#dddddd' },
  { id: 'robot',     name: 'Robot',       emoji: '🤖', colors: ['#cfd8e3', '#5c7a99', '#0b1f33'], pattern: 'circuit',  glow: '#4dd0ff' },
  { id: 'sakura',    name: 'Sakura',      emoji: '🌸', colors: ['#ffe5f0', '#ff8fab', '#7a2b46'], pattern: 'spots',    glow: '#ffb3c9' },
  { id: 'toksin',    name: 'Toksin',      emoji: '☢️', colors: ['#eaff7b', '#8ac926', '#1b3a00'], pattern: 'cracks',   glow: '#b6ff3c' }
];

export function getSkin(id) {
  return SKINS.find((s) => s.id === id) || SKINS[0];
}

function widthAt(t) {
  // Rounded head, gently tapering body, rounded tail.
  if (t < 0.1) return 1.0 - 0.14 * (t / 0.1);
  if (t > 0.82) return 0.86 - 0.32 * ((t - 0.82) / 0.18);
  return 0.86;
}

function shade(hex, amt) {
  const m = hex.replace('#', '');
  const n = parseInt(m.length === 3 ? m.split('').map(c => c + c).join('') : m, 16);
  let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  if (amt >= 0) { r += (255 - r) * amt; g += (255 - g) * amt; b += (255 - b) * amt; }
  else { r *= (1 + amt); g *= (1 + amt); b *= (1 + amt); }
  const to = (v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0');
  return `#${to(r)}${to(g)}${to(b)}`;
}

function outlinePath(ctx, left, right) {
  const n = left.length;
  ctx.beginPath();
  ctx.moveTo(left[0].x, left[0].y);
  for (let i = 1; i < n; i++) ctx.lineTo(left[i].x, left[i].y);
  for (let i = n - 1; i >= 0; i--) ctx.lineTo(right[i].x, right[i].y);
  ctx.closePath();
}

export function drawSnake(ctx, body, radius, skin, time, opts = {}) {
  if (!body || body.length < 2) return;
  const n = body.length;

  const left = new Array(n);
  const right = new Array(n);
  for (let i = 0; i < n; i++) {
    const p = body[i];
    const a = body[i - 1] || p;
    const b = body[i + 1] || p;
    let tx = b.x - a.x, ty = b.y - a.y;
    const tl = Math.hypot(tx, ty) || 1;
    tx /= tl; ty /= tl;
    const nx = -ty, ny = tx;
    const w = radius * widthAt(i / (n - 1));
    left[i] = { x: p.x + nx * w, y: p.y + ny * w };
    right[i] = { x: p.x - nx * w, y: p.y - ny * w };
  }

  ctx.save();

  // Glow / body fill
  outlinePath(ctx, left, right);
  const headP = body[0], tailP = body[n - 1];
  const grad = ctx.createLinearGradient(headP.x, headP.y, tailP.x, tailP.y);
  const cols = skin.colors;
  const stops = Math.max(1, cols.length - 1);
  for (let i = 0; i < cols.length; i++) grad.addColorStop(i / stops, cols[i]);
  ctx.fillStyle = grad;
  ctx.shadowColor = skin.glow || cols[0];
  ctx.shadowBlur = radius * 1.15;
  ctx.fill();
  ctx.shadowBlur = 0;

  // Patterns clipped to body
  ctx.save();
  outlinePath(ctx, left, right);
  ctx.clip();
  drawPattern(ctx, body, radius, skin, time);
  ctx.restore();

  // Specular highlight along one side
  ctx.globalAlpha = 0.16;
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = Math.max(2, radius * 0.45);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  for (let i = 0; i < n; i += 2) {
    const p = body[i];
    const a = body[i - 1] || p;
    const b = body[i + 1] || p;
    let tx = b.x - a.x, ty = b.y - a.y;
    const tl = Math.hypot(tx, ty) || 1;
    const nx = -ty / tl, ny = tx / tl;
    const w = radius * widthAt(i / (n - 1)) * 0.4;
    const x = p.x + nx * w, y = p.y + ny * w;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.stroke();
  ctx.globalAlpha = 1;

  // Outline
  outlinePath(ctx, left, right);
  ctx.strokeStyle = shade(cols[cols.length - 1], -0.4);
  ctx.lineWidth = Math.max(1.5, radius * 0.2);
  ctx.lineJoin = 'round';
  ctx.stroke();

  ctx.restore();

  drawHead(ctx, body, radius, skin, time, opts);
}

function drawPattern(ctx, body, radius, skin, time) {
  const n = body.length;
  const accent = skin.colors[2] || skin.colors[1];
  const light = skin.colors[0];
  switch (skin.pattern) {
    case 'stripes': {
      ctx.globalAlpha = 0.55;
      ctx.strokeStyle = accent;
      ctx.lineCap = 'butt';
      for (let i = 3; i < n; i += 6) {
        const p = body[i];
        const a = body[i - 1] || p;
        const b = body[i + 1] || p;
        let tx = b.x - a.x, ty = b.y - a.y;
        const tl = Math.hypot(tx, ty) || 1;
        const nx = -ty / tl, ny = tx / tl;
        const w = radius * widthAt(i / (n - 1)) * 1.3;
        ctx.lineWidth = Math.max(2, radius * 0.42);
        ctx.beginPath();
        ctx.moveTo(p.x + nx * w, p.y + ny * w);
        ctx.lineTo(p.x - nx * w, p.y - ny * w);
        ctx.stroke();
      }
      break;
    }
    case 'spots': {
      ctx.globalAlpha = 0.7;
      ctx.fillStyle = accent;
      for (let i = 2; i < n; i += 4) {
        const p = body[i];
        const a = body[i - 1] || p;
        const b = body[i + 1] || p;
        let tx = b.x - a.x, ty = b.y - a.y;
        const tl = Math.hypot(tx, ty) || 1;
        const nx = -ty / tl, ny = tx / tl;
        const off = ((i / 4) % 2 === 0 ? 1 : -1) * radius * 0.34;
        ctx.beginPath();
        ctx.arc(p.x + nx * off, p.y + ny * off, Math.max(2, radius * 0.26), 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }
    case 'scales': {
      ctx.globalAlpha = 0.45;
      ctx.strokeStyle = accent;
      ctx.lineWidth = Math.max(1, radius * 0.13);
      for (let i = 2; i < n; i += 3) {
        const p = body[i];
        const r = radius * widthAt(i / (n - 1));
        ctx.beginPath();
        ctx.arc(p.x, p.y, r * 0.72, Math.PI * 0.15, Math.PI * 0.85);
        ctx.stroke();
      }
      break;
    }
    case 'rainbow': {
      const headP = body[0], tailP = body[n - 1];
      const g = ctx.createLinearGradient(headP.x, headP.y, tailP.x, tailP.y);
      const hues = ['#ff0054', '#ff8c00', '#ffe600', '#5cff00', '#00ffd0', '#005cff', '#a000ff'];
      hues.forEach((c, i) => g.addColorStop(i / (hues.length - 1), c));
      ctx.globalAlpha = 0.78;
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 1e6, 1e6);
      break;
    }
    case 'stars': {
      ctx.globalAlpha = 0.9;
      ctx.fillStyle = light;
      for (let i = 0; i < n; i += 5) {
        const p = body[i];
        const a = body[i - 1] || p;
        const b = body[i + 1] || p;
        let tx = b.x - a.x, ty = b.y - a.y;
        const tl = Math.hypot(tx, ty) || 1;
        const nx = -ty / tl, ny = tx / tl;
        const phase = Math.sin(time * 0.003 + i) * 0.5 + 0.5;
        const off = (Math.sin(i * 12.9898) * 43758.5453 % 1) * radius * 0.9;
        const r = Math.max(0.8, radius * 0.12 * (0.6 + phase));
        ctx.beginPath();
        ctx.arc(p.x + nx * off, p.y + ny * off, r, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }
    case 'cracks': {
      ctx.globalAlpha = 0.65;
      ctx.strokeStyle = light;
      ctx.lineWidth = Math.max(1, radius * 0.12);
      ctx.lineCap = 'round';
      for (let i = 2; i < n; i += 4) {
        const p = body[i];
        const a = body[i - 1] || p;
        const b = body[i + 1] || p;
        let tx = b.x - a.x, ty = b.y - a.y;
        const tl = Math.hypot(tx, ty) || 1;
        const nx = -ty / tl, ny = tx / tl;
        const r = radius * widthAt(i / (n - 1));
        ctx.beginPath();
        ctx.moveTo(p.x - nx * r, p.y - ny * r);
        ctx.lineTo(p.x + nx * r * 0.2 + tx * r * 0.3, p.y + ny * r * 0.2 + ty * r * 0.3);
        ctx.lineTo(p.x + nx * r, p.y + ny * r);
        ctx.stroke();
      }
      break;
    }
    case 'circuit': {
      ctx.globalAlpha = 0.7;
      ctx.strokeStyle = skin.glow || light;
      ctx.lineWidth = Math.max(1, radius * 0.1);
      for (let i = 3; i < n; i += 6) {
        const p = body[i];
        const a = body[i - 1] || p;
        const b = body[i + 1] || p;
        let tx = b.x - a.x, ty = b.y - a.y;
        const tl = Math.hypot(tx, ty) || 1;
        const nx = -ty / tl, ny = tx / tl;
        const r = radius * widthAt(i / (n - 1));
        ctx.beginPath();
        ctx.moveTo(p.x - nx * r, p.y - ny * r);
        ctx.lineTo(p.x + nx * r, p.y + ny * r);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(1, radius * 0.1), 0, Math.PI * 2);
        ctx.fillStyle = skin.glow || light;
        ctx.fill();
      }
      break;
    }
    default: {
      // gradient: subtle darker band toward the tail
      ctx.globalAlpha = 0.18;
      ctx.fillStyle = accent;
      ctx.fillRect(0, 0, 1e6, 1e6);
    }
  }
  ctx.globalAlpha = 1;
}

function drawHead(ctx, body, radius, skin, time, opts) {
  const head = body[0];
  const neck = body[Math.min(2, body.length - 1)] || head;
  let dx = head.x - neck.x, dy = head.y - neck.y;
  const dl = Math.hypot(dx, dy) || 1;
  dx /= dl; dy /= dl;
  const nx = -dy, ny = dx;
  const ang = Math.atan2(dy, dx);

  const r = radius * 1.28;
  ctx.save();
  ctx.translate(head.x, head.y);
  ctx.rotate(ang);

  // Glow
  ctx.shadowColor = skin.glow || skin.colors[0];
  ctx.shadowBlur = radius * 1.6;

  // Head shape
  const g = ctx.createLinearGradient(-r, 0, r, 0);
  g.addColorStop(0, skin.colors[1]);
  g.addColorStop(1, skin.colors[0]);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(0, 0, r * 1.08, r * 0.94, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  // Outline
  ctx.strokeStyle = shade(skin.colors[skin.colors.length - 1], -0.4);
  ctx.lineWidth = Math.max(1.5, radius * 0.18);
  ctx.stroke();

  // Eyes (forward, two of them)
  const eyeX = r * 0.42, eyeY = r * 0.42, eyeR = r * 0.3;
  for (const s of [-1, 1]) {
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(eyeX, s * eyeY, eyeR, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = skin.eye || '#111318';
    ctx.beginPath();
    ctx.arc(eyeX + eyeR * 0.35, s * eyeY, eyeR * 0.52, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.beginPath();
    ctx.arc(eyeX + eyeR * 0.15, s * eyeY - eyeR * 0.2, eyeR * 0.18, 0, Math.PI * 2);
    ctx.fill();
  }

  // Tongue flick
  const flick = Math.sin(time * 0.008) > 0.55;
  if (flick) {
    ctx.strokeStyle = '#ff4d6d';
    ctx.lineWidth = Math.max(1.2, radius * 0.12);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(r * 1.02, 0);
    ctx.lineTo(r * 1.45, 0);
    ctx.moveTo(r * 1.3, 0);
    ctx.lineTo(r * 1.52, -r * 0.16);
    ctx.moveTo(r * 1.3, 0);
    ctx.lineTo(r * 1.52, r * 0.16);
    ctx.stroke();
  }

  ctx.restore();

  // Name tag (world space)
  if (opts.name) {
    ctx.save();
    ctx.font = `700 ${Math.max(11, radius * 1.05)}px 'Space Grotesk', sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.lineWidth = Math.max(3, radius * 0.28);
    ctx.strokeStyle = 'rgba(0,0,0,0.55)';
    ctx.strokeText(opts.name, head.x, head.y - radius * 1.9);
    ctx.fillStyle = opts.nameColor || '#ffffff';
    ctx.fillText(opts.name, head.x, head.y - radius * 1.9);
    ctx.restore();
  }
}
