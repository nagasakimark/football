// ============================================================
//  Sound: sampled effects + synthesized game "juice" (WebAudio)
// ============================================================
'use strict';

const Sound = {
  ctx: null,
  master: null,
  noiseBuf: null,
  buffers: {},
  muted: false,
  files: {
    kick: 'assets/sounds/ballkick.wav',
    bounce: 'assets/sounds/goalbounce.wav',
    cheer: 'assets/sounds/goalscore.mp3',
    miss: 'assets/sounds/goalmiss.mp3'
  },

  unlock() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume();
      return;
    }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    try {
      this.ctx = new AC();
    } catch (e) { return; }
    const comp = this.ctx.createDynamicsCompressor();
    comp.threshold.value = -10;
    comp.ratio.value = 6;
    comp.connect(this.ctx.destination);
    this.master = this.ctx.createGain();
    this.master.gain.value = this.muted ? 0 : 0.9;
    this.master.connect(comp);

    const len = this.ctx.sampleRate;
    this.noiseBuf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = this.noiseBuf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;

    for (const [name, url] of Object.entries(this.files)) {
      (location.protocol === 'file:' ? Promise.reject(new Error('file')) : fetch(url))
        .then(r => { if (!r.ok) throw new Error(r.status); return r.arrayBuffer(); })
        .then(b => new Promise((res, rej) => this.ctx.decodeAudioData(b, res, rej)))
        .then(buf => { this.buffers[name] = buf; })
        .catch(() => { this.buffers[name] = null; }); // falls back to <audio>
    }
  },

  setMuted(m) {
    this.muted = m;
    if (this.master) this.master.gain.setTargetAtTime(m ? 0 : 0.9, this.ctx.currentTime, 0.02);
  },

  play(name, opts = {}) {
    if (this.muted) return;
    const vol = opts.vol ?? 1;
    const delay = opts.delay || 0;
    const buf = this.buffers[name];
    if (this.ctx && buf) {
      const src = this.ctx.createBufferSource();
      src.buffer = buf;
      src.playbackRate.value = opts.rate || 1;
      const g = this.ctx.createGain();
      g.gain.value = vol;
      src.connect(g).connect(this.master);
      src.start(this.ctx.currentTime + delay);
      return;
    }
    const run = () => {
      const a = new Audio(this.files[name]);
      a.volume = Math.min(1, vol);
      const p = a.play();
      if (p && p.catch) p.catch(() => {});
    };
    if (delay) setTimeout(run, delay * 1000); else run();
  },

  tone(freq, dur, o = {}) {
    if (!this.ctx || this.muted) return;
    const t = this.ctx.currentTime + (o.delay || 0);
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = o.type || 'sine';
    osc.frequency.setValueAtTime(freq, t);
    if (o.slide) osc.frequency.exponentialRampToValueAtTime(o.slide, t + dur);
    const vol = o.vol ?? 0.12;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + (o.attack || 0.006));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g).connect(this.master);
    osc.start(t);
    osc.stop(t + dur + 0.05);
  },

  noise(dur, o = {}) {
    if (!this.ctx || this.muted) return;
    const t = this.ctx.currentTime + (o.delay || 0);
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    src.loop = true;
    const f = this.ctx.createBiquadFilter();
    f.type = o.filter || 'bandpass';
    f.frequency.setValueAtTime(o.freq || 1000, t);
    if (o.slide) f.frequency.exponentialRampToValueAtTime(o.slide, t + dur);
    f.Q.value = o.q ?? 1;
    const g = this.ctx.createGain();
    const vol = o.vol ?? 0.2;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + (o.attack || 0.01));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f).connect(g).connect(this.master);
    src.start(t, Math.random() * 0.5);
    src.stop(t + dur + 0.05);
  },

  // ---------- recipes ----------
  // Friendly "ooOOoo" ghost wobble
  spooky() {
    [0, 0.18].forEach((d, i) => {
      this.tone(i ? 330 : 392, 0.4, { type: 'sine', vol: 0.07, slide: i ? 262 : 311, delay: d, attack: 0.08 });
      this.tone((i ? 330 : 392) * 1.5, 0.35, { type: 'triangle', vol: 0.03, slide: (i ? 262 : 311) * 1.5, delay: d + 0.03, attack: 0.08 });
    });
  },
  boo() { this.tone(240, 0.45, { type: 'sawtooth', vol: 0.04, slide: 130 }); this.tone(250, 0.45, { type: 'sine', vol: 0.08, slide: 120, delay: 0.02 }); },
  cackle() { for (let i = 0; i < 5; i++) this.tone(520 + (i % 2) * 90, 0.07, { type: 'square', vol: 0.03, delay: i * 0.08 }); },
  click() { this.tone(900, 0.05, { type: 'triangle', vol: 0.1 }); },
  hover() { this.tone(1400, 0.03, { type: 'sine', vol: 0.035 }); },
  blip(step = 0) {
    const f = 440 * Math.pow(2, Math.min(step, 24) / 12);
    this.tone(f, 0.12, { type: 'triangle', vol: 0.14, slide: f * 1.5 });
    this.tone(f * 2, 0.08, { type: 'sine', vol: 0.05, delay: 0.02 });
  },
  unblip() { this.tone(500, 0.12, { type: 'triangle', vol: 0.12, slide: 250 }); },
  flip() { this.noise(0.07, { freq: 3200, q: 0.8, vol: 0.18 }); },
  whoosh(d = 0.5) { this.noise(d, { freq: 300, slide: 2600, q: 1.2, vol: 0.28, attack: d * 0.5 }); },
  whistle() {
    [0, 0.2].forEach((d, i) => {
      this.tone(2350, i ? 0.35 : 0.14, { type: 'square', vol: 0.035, delay: d });
      this.tone(2480, i ? 0.35 : 0.14, { type: 'square', vol: 0.03, delay: d });
    });
  },
  chime() {
    [523, 659, 784, 1047].forEach((f, i) => this.tone(f, 0.35, { type: 'triangle', vol: 0.12, delay: i * 0.06 }));
  },
  fanfare() {
    const n = [392, 523, 659, 784, 659, 784, 1047];
    const d = [0, 0.1, 0.2, 0.3, 0.45, 0.55, 0.7];
    n.forEach((f, i) => {
      this.tone(f, i === n.length - 1 ? 0.7 : 0.16, { type: 'square', vol: 0.05, delay: d[i] });
      this.tone(f / 2, i === n.length - 1 ? 0.7 : 0.16, { type: 'triangle', vol: 0.08, delay: d[i] });
    });
  },
  coin(step = 0) {
    const f = 988 * Math.pow(2, Math.min(step, 12) / 12);
    this.tone(f, 0.06, { type: 'square', vol: 0.05 });
    this.tone(f * 1.335, 0.22, { type: 'square', vol: 0.05, delay: 0.06 });
  },
  tick(step = 0) { this.tone(1000 + step * 40, 0.035, { type: 'square', vol: 0.05 }); },
  boing() { this.tone(320, 0.35, { type: 'sine', vol: 0.18, slide: 140 }); },
  thud() { this.tone(120, 0.18, { type: 'sine', vol: 0.3, slide: 50 }); this.noise(0.08, { freq: 400, vol: 0.15 }); },
  pop() { this.noise(0.25, { filter: 'lowpass', freq: 1800, slide: 200, vol: 0.3, q: 0.5 }); this.tone(180, 0.2, { vol: 0.15, slide: 60 }); },
  sparkle() {
    for (let i = 0; i < 5; i++) this.tone(1800 + Math.random() * 1600, 0.12, { type: 'sine', vol: 0.04, delay: i * 0.04 });
  },
  drumroll(dur) {
    for (let t = 0; t < dur; t += 0.045) {
      this.noise(0.05, { filter: 'bandpass', freq: 250, q: 0.7, vol: 0.08 + 0.1 * (t / dur), delay: t });
    }
  }
};
