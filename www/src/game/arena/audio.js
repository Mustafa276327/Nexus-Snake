// Nexus Arena - Original WebAudio music & SFX (no external audio files)
// A small synthwave loop plus juicy game sounds, all generated at runtime.

const midi = (m) => 440 * Math.pow(2, (m - 69) / 12);

const CHORDS = [
  { root: 45, notes: [57, 60, 64], pad: [57, 60, 64, 69] }, // Am
  { root: 41, notes: [53, 57, 60], pad: [53, 57, 60, 65] }, // F
  { root: 48, notes: [48, 52, 55], pad: [48, 52, 55, 60] }, // C
  { root: 43, notes: [55, 59, 62], pad: [55, 59, 62, 67] }  // G
];

export class ArenaAudio {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.musicGain = null;
    this.sfxGain = null;
    this.enabled = true;
    this.ready = false;
    this.musicPlaying = false;
    this.step = 0;
    this.nextNoteTime = 0;
    this.timer = null;
    this.noiseBuffer = null;
    this.bpm = 112;
  }

  init() {
    if (this.ready) {
      this.ctx?.resume?.();
      return;
    }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    try {
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.enabled ? 0.7 : 0;
      this.master.connect(this.ctx.destination);

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = 0.16;
      this.musicGain.connect(this.master);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = 0.55;
      this.sfxGain.connect(this.master);

      this.noiseBuffer = this.makeNoise(1.0);
      this.ready = true;
      this.ctx.resume?.();
      if (this.enabled) this.startMusic();
    } catch (e) {
      console.warn('Audio init failed', e);
    }
  }

  makeNoise(seconds) {
    const len = Math.floor(this.ctx.sampleRate * seconds);
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    return buf;
  }

  setEnabled(on) {
    this.enabled = on;
    if (this.master) {
      this.master.gain.setTargetAtTime(on ? 0.7 : 0, this.ctx.currentTime, 0.02);
    }
    if (on) {
      this.init();
      this.startMusic();
    } else {
      this.stopMusic();
    }
  }

  startMusic() {
    if (!this.ready || this.musicPlaying) return;
    this.musicPlaying = true;
    this.step = 0;
    this.nextNoteTime = this.ctx.currentTime + 0.08;
    this.timer = setInterval(() => this.scheduler(), 25);
  }

  stopMusic() {
    this.musicPlaying = false;
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  scheduler() {
    if (!this.musicPlaying || !this.ready) return;
    const stepDur = 60 / this.bpm / 4; // 16th note
    while (this.nextNoteTime < this.ctx.currentTime + 0.12) {
      this.scheduleStep(this.step, this.nextNoteTime);
      this.nextNoteTime += stepDur;
      this.step = (this.step + 1) % 64; // 4 bars of 16 steps
    }
  }

  scheduleStep(step, t) {
    const bar = Math.floor(step / 16) % 4;
    const s = step % 16;
    const chord = CHORDS[bar];

    // Kick on beats 0 & 2 (steps 0, 8)
    if (s === 0 || s === 8) this.kick(t);
    // Snare on beats 1 & 3 (steps 4, 12)
    if (s === 4 || s === 12) this.snare(t);
    // Hats on 8ths
    if (s % 2 === 0) this.hat(t, s % 4 === 0 ? 0.16 : 0.08);

    // Bass on beats
    if (s % 4 === 0) {
      const oct = (s === 8) ? 12 : 0;
      this.tone(midi(chord.root + oct), 60 / this.bpm * 0.9, 'triangle', 0.5, t, true);
    }

    // Arpeggio on 8ths
    if (s % 2 === 0) {
      const idx = (step / 2) % chord.notes.length;
      const n = chord.notes[idx] + 12;
      this.tone(midi(n), 0.16, 'square', 0.12, t, false, 1800);
    }

    // Pad at bar start
    if (s === 0) {
      for (const n of chord.pad) {
        this.pad(midi(n), 60 / this.bpm * 4, 0.05, t);
      }
    }
  }

  tone(freq, dur, type, gain, t, glide = false, lowpass = 0) {
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (glide) o.frequency.exponentialRampToValueAtTime(freq * 0.98, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    let node = o;
    if (lowpass) {
      const f = this.ctx.createBiquadFilter();
      f.type = 'lowpass';
      f.frequency.value = lowpass;
      o.connect(f);
      node = f;
    }
    node.connect(g);
    g.connect(this.musicGain);
    o.start(t);
    o.stop(t + dur + 0.02);
  }

  pad(freq, dur, gain, t) {
    for (const det of [-6, 6]) {
      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      const f = this.ctx.createBiquadFilter();
      o.type = 'sawtooth';
      o.frequency.value = freq;
      o.detune.value = det;
      f.type = 'lowpass';
      f.frequency.value = 900;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(gain, t + dur * 0.35);
      g.gain.linearRampToValueAtTime(0.0001, t + dur);
      o.connect(f); f.connect(g); g.connect(this.musicGain);
      o.start(t); o.stop(t + dur + 0.05);
    }
  }

  kick(t) {
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(150, t);
    o.frequency.exponentialRampToValueAtTime(42, t + 0.13);
    g.gain.setValueAtTime(0.9, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
    o.connect(g); g.connect(this.musicGain);
    o.start(t); o.stop(t + 0.18);
  }

  snare(t) {
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    const f = this.ctx.createBiquadFilter();
    f.type = 'highpass';
    f.frequency.value = 1400;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.35, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
    src.connect(f); f.connect(g); g.connect(this.musicGain);
    src.start(t); src.stop(t + 0.14);
    this.tone(midi(45), 0.08, 'triangle', 0.18, t);
  }

  hat(t, gain) {
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    const f = this.ctx.createBiquadFilter();
    f.type = 'highpass';
    f.frequency.value = 7000;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.035);
    src.connect(f); f.connect(g); g.connect(this.musicGain);
    src.start(t); src.stop(t + 0.045);
  }

  // ---- SFX ----
  sfx(name) {
    if (!this.enabled || !this.ready) return;
    const t = this.ctx.currentTime + 0.001;
    switch (name) {
      case 'eat': this.blip(620 + Math.random() * 240, 0.09, 'sine', 0.32, t, 1.35); break;
      case 'boost': this.sweep(t); break;
      case 'death':
        this.toneSfx(300, 60, 0.55, 'sawtooth', 0.5, t);
        this.noiseSfx(0.5, 800, 0.3, t);
        break;
      case 'click': this.toneSfx(520, 520, 0.05, 'square', 0.18, t); break;
      case 'level':
        [523, 659, 784, 1046].forEach((f, i) => this.toneSfx(f, f, 0.12, 'triangle', 0.22, t + i * 0.08));
        break;
      case 'collision': this.noiseSfx(0.14, 1200, 0.3, t); this.toneSfx(180, 90, 0.16, 'square', 0.22, t); break;
      case 'powerup':
        [660, 880, 1100].forEach((f, i) => this.toneSfx(f, f * 1.2, 0.14, 'sine', 0.26, t + i * 0.07));
        break;
      case 'start':
        [392, 523, 659].forEach((f, i) => this.toneSfx(f, f, 0.16, 'triangle', 0.24, t + i * 0.1));
        break;
    }
  }

  blip(freq, dur, type, gain, t, mult = 1.2) {
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    o.frequency.exponentialRampToValueAtTime(freq * mult, t + dur);
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g); g.connect(this.sfxGain);
    o.start(t); o.stop(t + dur + 0.02);
  }

  toneSfx(f1, f2, dur, type, gain, t) {
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f1, t);
    if (f2 !== f1) o.frequency.exponentialRampToValueAtTime(Math.max(20, f2), t + dur);
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g); g.connect(this.sfxGain);
    o.start(t); o.stop(t + dur + 0.02);
  }

  noiseSfx(dur, freq, gain, t) {
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    const f = this.ctx.createBiquadFilter();
    f.type = 'bandpass';
    f.frequency.value = freq;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    src.connect(f); f.connect(g); g.connect(this.sfxGain);
    src.start(t); src.stop(t + dur + 0.02);
  }

  sweep(t) {
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    const f = this.ctx.createBiquadFilter();
    f.type = 'bandpass';
    f.frequency.setValueAtTime(400, t);
    f.frequency.exponentialRampToValueAtTime(3000, t + 0.25);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.25, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
    src.connect(f); f.connect(g); g.connect(this.sfxGain);
    src.start(t); src.stop(t + 0.32);
  }
}

export const arenaAudio = new ArenaAudio();
