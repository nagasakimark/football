// ============================================================
//  Mini canvas game engine: loop, scaling, input, tweens,
//  springs, particles, screen shake, drawing helpers.
// ============================================================
'use strict';

const W = 1280, H = 720;
const FONT_DISPLAY = '"Luckiest Guy", "Arial Black", Impact, sans-serif';
const FONT_ROUND = '"Fredoka", "Arial Rounded MT Bold", "Segoe UI", system-ui, sans-serif';
const TAU = Math.PI * 2;

const rand = (a, b) => a + Math.random() * (b - a);
const randInt = (a, b) => Math.floor(rand(a, b + 1));
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ---------------- Easing ----------------
const Ease = {
  linear: t => t,
  inQuad: t => t * t,
  outQuad: t => 1 - (1 - t) * (1 - t),
  inOutQuad: t => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2),
  outCubic: t => 1 - Math.pow(1 - t, 3),
  inCubic: t => t * t * t,
  inOutCubic: t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  outBack: t => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); },
  outBackBig: t => { const c1 = 3, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); },
  inBack: t => { const c1 = 1.70158, c3 = c1 + 1; return c3 * t * t * t - c1 * t * t; },
  outElastic: t => {
    if (t === 0 || t === 1) return t;
    return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * (TAU / 3)) + 1;
  },
  outBounce: t => {
    const n1 = 7.5625, d1 = 2.75;
    if (t < 1 / d1) return n1 * t * t;
    if (t < 2 / d1) return n1 * (t -= 1.5 / d1) * t + 0.75;
    if (t < 2.5 / d1) return n1 * (t -= 2.25 / d1) * t + 0.9375;
    return n1 * (t -= 2.625 / d1) * t + 0.984375;
  }
};

// ---------------- Tweens & timers (world time) ----------------
const Tween = {
  list: [],
  to(obj, props, dur, o = {}) {
    const tw = {
      obj, props, dur: Math.max(dur, 0.0001), ease: o.ease || Ease.outQuad,
      delay: o.delay || 0, t: 0, from: null, onDone: o.onDone, onStart: o.onStart, dead: false
    };
    this.list.push(tw);
    return tw;
  },
  kill(obj) { this.list.forEach(t => { if (t.obj === obj) t.dead = true; }); },
  clear() { this.list.forEach(t => { t.dead = true; }); this.list = []; },
  update(dt) {
    const cur = this.list.slice();
    for (const tw of cur) {
      if (tw.dead) continue;
      if (tw.delay > 0) { tw.delay -= dt; if (tw.delay > 0) continue; }
      if (!tw.from) {
        tw.from = {};
        for (const k in tw.props) tw.from[k] = tw.obj[k];
        if (tw.onStart) tw.onStart();
      }
      tw.t += dt;
      const p = Math.min(1, tw.t / tw.dur);
      const e = tw.ease(p);
      for (const k in tw.props) tw.obj[k] = tw.from[k] + (tw.props[k] - tw.from[k]) * e;
      if (p >= 1) {
        tw.dead = true;
        if (tw.onDone) tw.onDone();
      }
    }
    this.list = this.list.filter(t => !t.dead);
  }
};

const Timers = {
  list: [],
  after(sec, fn) { const t = { t: sec, fn, dead: false }; this.list.push(t); return t; },
  clear() { this.list.forEach(t => { t.dead = true; }); this.list = []; },
  update(dt) {
    const cur = this.list.slice();
    for (const t of cur) {
      if (t.dead) continue;
      t.t -= dt;
      if (t.t <= 0) { t.dead = true; t.fn(); }
    }
    this.list = this.list.filter(t => !t.dead);
  }
};

class Spring {
  constructor(v = 1, k = 300, d = 18) { this.v = v; this.target = v; this.vel = 0; this.k = k; this.d = d; }
  update(dt) {
    const steps = Math.ceil(dt / 0.016);
    const h = dt / steps;
    for (let i = 0; i < steps; i++) {
      const f = (this.target - this.v) * this.k - this.vel * this.d;
      this.vel += f * h;
      this.v += this.vel * h;
    }
  }
  kick(i) { this.vel += i; }
}

// ---------------- Images ----------------
const Images = {
  map: new Map(),
  load(src) {
    let e = this.map.get(src);
    if (!e) {
      const img = new Image();
      e = { img, ok: false };
      e.promise = new Promise(res => {
        img.onload = () => { e.ok = true; res(img); };
        img.onerror = () => res(null);
      });
      img.src = src;
      this.map.set(src, e);
    }
    return e.promise;
  },
  get(src) {
    const e = this.map.get(src);
    if (!e) { this.load(src); return null; }
    return e.ok ? e.img : null;
  }
};

// ---------------- Animated keeper GIFs ----------------
const Keepers = {
  cache: new Map(),
  order: [],
  get(file) {
    let e = this.cache.get(file);
    if (e) {
      this.order = this.order.filter(f => f !== file);
      this.order.push(file);
      return e;
    }
    const src = `assets/pokemon/${file}`;
    e = { file, src, anim: null, total: 0 };
    Images.load(src);
    // (file:// pages can't fetch; the static first frame is used instead)
    e.ready = (location.protocol === 'file:' ? Promise.reject(new Error('file')) : fetch(src))
      .then(r => { if (!r.ok) throw new Error(r.status); return r.arrayBuffer(); })
      .then(buf => GifDecoder.decode(buf, 380))
      .then(anim => {
        if (!anim.frames.length) return;
        e.anim = anim;
        e.total = anim.delays.reduce((a, b) => a + b, 0);
        e.starts = [];
        let acc = 0;
        for (const d of anim.delays) { e.starts.push(acc); acc += d; }
      })
      .catch(() => {}); // file:// or decode failure: static first frame is used
    this.cache.set(file, e);
    this.order.push(file);
    while (this.order.length > 6) {
      const old = this.order.shift();
      this.cache.delete(old);
    }
    return e;
  },
  // Current frame (canvas or image) for time t (seconds)
  frame(e, t) {
    if (e && e.anim) {
      const ms = (t * 1000) % e.total;
      const s = e.starts;
      let lo = 0, hi = s.length - 1;
      while (lo < hi) {
        const mid = (lo + hi + 1) >> 1;
        if (s[mid] <= ms) lo = mid; else hi = mid - 1;
      }
      return e.anim.frames[lo];
    }
    return e ? Images.get(e.src) : null;
  }
};

// ---------------- Drawing helpers ----------------
function rr(ctx, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function starPath(ctx, x, y, spikes, outer, inner, rot = -Math.PI / 2) {
  ctx.beginPath();
  for (let i = 0; i < spikes * 2; i++) {
    const r = i % 2 ? inner : outer;
    const a = rot + (i * Math.PI) / spikes;
    ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
  }
  ctx.closePath();
}

function setFont(ctx, size, family, weight) {
  ctx.font = `${weight || ''} ${Math.round(size * 10) / 10}px ${family}`.trim();
}

// Chunky game text with outline + drop shadow.
function txt(ctx, s, x, y, o = {}) {
  let size = o.size || 32;
  const family = o.font || FONT_DISPLAY;
  const weight = o.weight || (family === FONT_ROUND ? '700' : '');
  setFont(ctx, size, family, weight);
  if (o.maxW) {
    const w = ctx.measureText(s).width;
    if (w > o.maxW) { size *= o.maxW / w; setFont(ctx, size, family, weight); }
  }
  ctx.textAlign = o.align || 'center';
  ctx.textBaseline = o.baseline || 'middle';
  ctx.lineJoin = 'round';
  const lw = o.lw ?? size * 0.16;
  if (o.shadow !== false && (o.shadow || o.stroke)) {
    const sd = o.shadowDist ?? Math.max(2, size * 0.08);
    ctx.fillStyle = o.shadow || 'rgba(0,0,0,0.45)';
    if (o.stroke) { ctx.strokeStyle = ctx.fillStyle; ctx.lineWidth = lw; ctx.strokeText(s, x, y + sd); }
    ctx.fillText(s, x, y + sd);
  }
  if (o.stroke) {
    ctx.strokeStyle = o.stroke;
    ctx.lineWidth = lw;
    ctx.strokeText(s, x, y);
  }
  if (o.fill && typeof o.fill === 'object' && o.fill.grad) {
    const m = size * 0.55;
    const g = ctx.createLinearGradient(0, y - m, 0, y + m);
    o.fill.grad.forEach((c, i) => g.addColorStop(i / (o.fill.grad.length - 1), c));
    ctx.fillStyle = g;
  } else {
    ctx.fillStyle = o.fill || '#fff';
  }
  ctx.fillText(s, x, y);
  return size;
}

// Soft radial glow sprites, cached per colour
const Glow = {
  cache: new Map(),
  get(color) {
    let c = this.cache.get(color);
    if (!c) {
      c = document.createElement('canvas');
      c.width = c.height = 128;
      const g = c.getContext('2d');
      const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
      gr.addColorStop(0, color);
      gr.addColorStop(0.35, color);
      gr.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = gr;
      g.globalAlpha = 1;
      g.fillRect(0, 0, 128, 128);
      this.cache.set(color, c);
    }
    return c;
  },
  draw(ctx, color, x, y, r, alpha = 1) {
    ctx.save();
    ctx.globalAlpha *= alpha;
    ctx.globalCompositeOperation = 'lighter';
    ctx.drawImage(this.get(color), x - r, y - r, r * 2, r * 2);
    ctx.restore();
  }
};

// ---------------- Particles ----------------
const Particles = {
  list: [],
  spawn(p) {
    const d = {
      x: 0, y: 0, vx: 0, vy: 0, g: 0, drag: 0, life: 0, max: 1, size: 8, size1: null,
      rot: 0, vr: 0, color: '#fff', shape: 'circle', layer: 'fx', alpha: 1, fadeIn: 0,
      flip: 0, flipSpeed: 0, delay: 0
    };
    Object.assign(d, p);
    if (d.size1 === null) d.size1 = d.size;
    this.list.push(d);
    return d;
  },
  clear(layer) { this.list = layer ? this.list.filter(p => p.layer !== layer) : []; },
  update(dt) {
    for (const p of this.list) {
      if (p.delay > 0) { p.delay -= dt; continue; }
      p.life += dt;
      p.vy += p.g * dt;
      if (p.drag) { const k = Math.max(0, 1 - p.drag * dt); p.vx *= k; p.vy *= k; }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.rot += p.vr * dt;
      p.flip += p.flipSpeed * dt;
      if (p.update) p.update(p, dt);
    }
    this.list = this.list.filter(p => p.life < p.max);
  },
  draw(ctx, layer) {
    for (const p of this.list) {
      if (p.layer !== layer || p.delay > 0) continue;
      const t = p.life / p.max;
      let a = p.alpha * (t > 0.7 ? 1 - (t - 0.7) / 0.3 : 1);
      if (p.fadeIn) a *= Math.min(1, p.life / p.fadeIn);
      if (a <= 0) continue;
      const size = lerp(p.size, p.size1, t);
      ctx.save();
      ctx.globalAlpha = a;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      switch (p.shape) {
        case 'rect': {
          const sx = Math.cos(p.flip);
          ctx.scale(sx, 1);
          ctx.fillStyle = p.color;
          ctx.fillRect(-size / 2, -size * 0.3, size, size * 0.6);
          break;
        }
        case 'star':
          ctx.fillStyle = p.color;
          starPath(ctx, 0, 0, 5, size, size * 0.45);
          ctx.fill();
          break;
        case 'spark': {
          ctx.globalCompositeOperation = 'lighter';
          const sp = Math.hypot(p.vx, p.vy);
          ctx.rotate(Math.atan2(p.vy, p.vx) - p.rot);
          ctx.strokeStyle = p.color;
          ctx.lineCap = 'round';
          ctx.lineWidth = size;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(-Math.min(60, sp * 0.06), 0);
          ctx.stroke();
          break;
        }
        case 'glow':
          ctx.globalCompositeOperation = 'lighter';
          ctx.drawImage(Glow.get(p.color), -size, -size, size * 2, size * 2);
          break;
        case 'ring':
          ctx.strokeStyle = p.color;
          ctx.lineWidth = p.lw || 6 * (1 - t) + 1;
          ctx.beginPath();
          ctx.arc(0, 0, size, 0, TAU);
          ctx.stroke();
          break;
        case 'dust':
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(0, 0, size, 0, TAU);
          ctx.fill();
          break;
        case 'text':
          txt(ctx, p.text, 0, 0, { size, fill: p.color, stroke: p.stroke || '#1a1a2e', font: p.font || FONT_DISPLAY });
          break;
        case 'img':
          if (p.img) ctx.drawImage(p.img, -size / 2, -size / 2, size, size);
          break;
        default:
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(0, 0, size, 0, TAU);
          ctx.fill();
      }
      ctx.restore();
    }
  }
};

const FX = {
  confettiColors: ['#ffcb05', '#ff3b5c', '#ffffff', '#3b8cff', '#4cd964', '#ff8a00', '#b86bff'],
  confettiCannon(x, y, dir, n = 70, colors) {
    const cols = colors || this.confettiColors;
    for (let i = 0; i < n; i++) {
      const a = -Math.PI / 2 + dir * rand(0.15, 0.75);
      const sp = rand(500, 1150);
      Particles.spawn({
        x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, g: 900, drag: 2.2,
        max: rand(2.2, 3.4), size: rand(10, 18), rot: rand(0, TAU), vr: rand(-8, 8),
        flipSpeed: rand(6, 14), color: pick(cols), shape: Math.random() < 0.8 ? 'rect' : 'star', layer: 'ui',
        update: (p, dt) => { p.vx += Math.sin(p.life * 5 + p.size) * 60 * dt; }
      });
    }
  },
  firework(x, y, color) {
    const n = 46;
    Particles.spawn({ x, y, shape: 'glow', size: 40, size1: 160, max: 0.45, color, layer: 'ui', alpha: 0.9 });
    for (let i = 0; i < n; i++) {
      const a = (i / n) * TAU + rand(-0.05, 0.05);
      const sp = rand(260, 420);
      Particles.spawn({
        x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, g: 260, drag: 1.6,
        max: rand(0.9, 1.4), size: rand(3, 5), color: i % 3 ? color : '#ffffff', shape: 'spark', layer: 'ui'
      });
    }
  },
  sparkleBurst(x, y, n = 16, colors = ['#fff6b0', '#ffffff', '#ffcb05'], layer = 'ui', speed = 1) {
    for (let i = 0; i < n; i++) {
      const a = (i / n) * TAU + rand(-0.2, 0.2);
      const sp = rand(180, 420) * speed;
      Particles.spawn({
        x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, drag: 3.5, g: 120,
        max: rand(0.5, 0.9), size: rand(6, 12), size1: 1, rot: rand(0, TAU), vr: rand(-6, 6),
        color: pick(colors), shape: 'star', layer
      });
    }
  },
  ring(x, y, color = '#ffffff', r0 = 20, r1 = 140, dur = 0.45, layer = 'ui', lw) {
    Particles.spawn({ x, y, shape: 'ring', size: r0, size1: r1, max: dur, color, layer, lw });
  },
  dust(x, y, n = 10, layer = 'world') {
    for (let i = 0; i < n; i++) {
      Particles.spawn({
        x: x + rand(-30, 30), y: y + rand(-6, 6), vx: rand(-160, 160), vy: rand(-90, -20), drag: 3,
        max: rand(0.45, 0.8), size: rand(8, 14), size1: rand(22, 34), color: 'rgba(235,245,220,0.55)',
        shape: 'dust', layer
      });
    }
  },
  floatText(text, x, y, color = '#ffcb05', size = 44) {
    Particles.spawn({
      x, y, vy: -120, drag: 1.5, max: 1.2, size, size1: size * 1.1, shape: 'text', text, color, layer: 'ui'
    });
  }
};

// ---------------- Buttons ----------------
class Button {
  constructor(o) {
    Object.assign(this, {
      x: 0, y: 0, w: 200, h: 70, label: '', color: '#ffcb05', color2: null, textColor: '#3a2200',
      size: 34, visible: true, enabled: true, circle: false, icon: null, font: FONT_DISPLAY,
      onClick: null, hover: false, appear: 1, pulse: false
    }, o);
    this.spring = new Spring(1, 420, 20);
  }
  hit(px, py) {
    if (!this.visible || !this.enabled || this.appear < 0.5) return false;
    if (this.circle) return Math.hypot(px - this.x, py - this.y) <= this.w / 2;
    return Math.abs(px - this.x) <= this.w / 2 && Math.abs(py - this.y) <= this.h / 2;
  }
  update(dt, t) {
    this.spring.target = this.hover ? 1.08 : 1;
    this.spring.update(dt);
    this.t = t;
  }
  press() {
    this.spring.v = 0.86;
    this.spring.vel = 0;
    Sound.click();
    if (this.onClick) this.onClick(this);
  }
  draw(ctx) {
    if (!this.visible || this.appear <= 0.01) return;
    const pulse = this.pulse ? 1 + Math.sin((this.t || 0) * 6) * 0.04 : 1;
    const s = this.spring.v * this.appear * pulse;
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.scale(s, s);
    ctx.globalAlpha *= clamp(this.appear, 0, 1);
    const w = this.w, h = this.h;
    const c1 = this.color, c2 = this.color2 || shade(this.color, -0.25);
    const dark = shade(this.color, -0.55);
    if (this.circle) {
      const r = w / 2;
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.beginPath(); ctx.arc(0, 6, r, 0, TAU); ctx.fill();
      ctx.fillStyle = dark;
      ctx.beginPath(); ctx.arc(0, 3, r, 0, TAU); ctx.fill();
      const g = ctx.createLinearGradient(0, -r, 0, r);
      g.addColorStop(0, shade(c1, 0.25)); g.addColorStop(0.5, c1); g.addColorStop(1, c2);
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(0, 0, r - 4, 0, TAU); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.beginPath(); ctx.ellipse(0, -r * 0.45, r * 0.6, r * 0.28, 0, 0, TAU); ctx.fill();
    } else {
      const r = Math.min(h / 2, 22);
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      rr(ctx, -w / 2, -h / 2 + 8, w, h, r); ctx.fill();
      ctx.fillStyle = dark;
      rr(ctx, -w / 2, -h / 2 + 4, w, h, r); ctx.fill();
      const g = ctx.createLinearGradient(0, -h / 2, 0, h / 2);
      g.addColorStop(0, shade(c1, 0.3)); g.addColorStop(0.45, c1); g.addColorStop(1, c2);
      ctx.fillStyle = g;
      rr(ctx, -w / 2 + 3, -h / 2 + 3, w - 6, h - 6, r - 2); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      rr(ctx, -w / 2 + 10, -h / 2 + 7, w - 20, h * 0.34, r * 0.6); ctx.fill();
    }
    if (this.icon) this.icon(ctx, this);
    if (this.label) {
      txt(ctx, this.label, 0, this.circle ? 0 : 2, {
        size: this.size, fill: this.textColor === '#fff' ? '#fff' : this.textColor, font: this.font,
        stroke: this.textColor === '#fff' ? dark : null, shadow: this.textColor === '#fff' ? 'rgba(0,0,0,0.35)' : false,
        maxW: w - 30
      });
    }
    ctx.restore();
  }
}

function shade(hex, amt) {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map(c => c + c).join('') : h, 16);
  let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  if (amt >= 0) { r += (255 - r) * amt; g += (255 - g) * amt; b += (255 - b) * amt; }
  else { r *= 1 + amt; g *= 1 + amt; b *= 1 + amt; }
  return `rgb(${Math.round(r)},${Math.round(g)},${Math.round(b)})`;
}

// ---------------- Core ----------------
const Engine = {
  canvas: null, ctx: null, dpr: 1, scale: 1, offX: 0, offY: 0, cssW: W, cssH: H,
  time: 0, realTime: 0, timeScale: 1, hitstop: 0,
  shake: 0, shakeX: 0, shakeY: 0, flash: 0, flashColor: '#fff',
  scene: null, pointer: { x: -9999, y: -9999 },
  trans: null,

  init(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.resize();
    window.addEventListener('resize', () => this.resize());
    document.addEventListener('fullscreenchange', () => setTimeout(() => this.resize(), 50));

    canvas.addEventListener('pointerdown', e => {
      e.preventDefault();
      Sound.unlock();
      const p = this.toVirtual(e.clientX, e.clientY);
      this.pointer = p;
      if (this.trans) return;
      if (this.scene && this.scene.onDown) this.scene.onDown(p.x, p.y, e.button, e);
    });
    canvas.addEventListener('pointermove', e => {
      this.pointer = this.toVirtual(e.clientX, e.clientY);
    });
    canvas.addEventListener('pointerleave', () => { this.pointer = { x: -9999, y: -9999 }; });
    canvas.addEventListener('contextmenu', e => e.preventDefault());
    window.addEventListener('keydown', e => {
      Sound.unlock();
      if (e.repeat) return;
      if (this.trans) return;
      if (this.scene && this.scene.onKey) this.scene.onKey(e);
    });

    this.last = performance.now();
    requestAnimationFrame(t => this.loop(t));
  },

  resize() {
    const cw = window.innerWidth, ch = window.innerHeight;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.cssW = cw; this.cssH = ch;
    this.canvas.width = Math.round(cw * this.dpr);
    this.canvas.height = Math.round(ch * this.dpr);
    this.canvas.style.width = cw + 'px';
    this.canvas.style.height = ch + 'px';
    this.scale = Math.min(cw / W, ch / H);
    this.offX = (cw - W * this.scale) / 2;
    this.offY = (ch - H * this.scale) / 2;
  },

  // Visible area in virtual coordinates (wider/taller than 1280x720 on odd screens)
  view() {
    return { x: -this.offX / this.scale, y: -this.offY / this.scale, w: this.cssW / this.scale, h: this.cssH / this.scale };
  },

  toVirtual(cx, cy) {
    const r = this.canvas.getBoundingClientRect();
    return { x: (cx - r.left - this.offX) / this.scale, y: (cy - r.top - this.offY) / this.scale };
  },

  setScene(scene, data) {
    if (this.scene && this.scene.exit) this.scene.exit();
    Tween.clear();
    Timers.clear();
    Particles.clear();
    this.timeScale = 1;
    this.hitstop = 0;
    this.shake = 0;
    this.scene = scene;
    if (scene.enter) scene.enter(data);
  },

  // Iris-wipe transition centred on (x, y)
  go(scene, data, x = W / 2, y = H / 2) {
    if (this.trans) return;
    this.trans = { t: 0, x, y, scene, data, switched: false };
  },

  addShake(v) { this.shake = Math.min(1, this.shake + v); },
  doFlash(v, color = '#fff') { this.flash = Math.max(this.flash, v); this.flashColor = color; },

  loop(now) {
    requestAnimationFrame(t => this.loop(t));
    try {
      this.frame(now);
    } catch (err) {
      console.error(err);
    }
  },

  frame(now) {
    const realDt = Math.min(0.05, (now - this.last) / 1000);
    this.last = now;
    this.realTime += realDt;

    let dt = realDt * this.timeScale;
    if (this.hitstop > 0) { this.hitstop -= realDt; dt = 0; }
    this.time += dt;

    this.shake = Math.max(0, this.shake - realDt * 1.6);
    const s = this.shake * this.shake * 22;
    this.shakeX = rand(-s, s);
    this.shakeY = rand(-s, s);
    this.flash = Math.max(0, this.flash - realDt * 2.2);

    if (this.trans) {
      const tr = this.trans;
      tr.t += realDt;
      if (!tr.switched && tr.t >= 0.38) {
        tr.switched = true;
        this.setScene(tr.scene, tr.data);
        tr.x = W / 2; tr.y = H / 2;
      }
      if (tr.t >= 0.8) this.trans = null;
    }

    Tween.update(dt);
    Timers.update(dt);
    Particles.update(dt);
    if (this.scene && this.scene.update) this.scene.update(dt, realDt);

    // Hover cursor
    if (this.scene && this.scene.isHot) {
      const hot = this.scene.isHot(this.pointer.x, this.pointer.y);
      this.canvas.style.cursor = hot ? 'pointer' : 'default';
    }

    const ctx = this.ctx;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#050b1e';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    const k = this.dpr * this.scale;
    ctx.setTransform(k, 0, 0, k, this.dpr * this.offX, this.dpr * this.offY);
    ctx.imageSmoothingQuality = 'high';
    if (this.scene && this.scene.draw) this.scene.draw(ctx);

    const v = this.view();
    if (this.flash > 0) {
      ctx.save();
      ctx.globalAlpha = Math.min(1, this.flash);
      ctx.fillStyle = this.flashColor;
      ctx.fillRect(v.x, v.y, v.w, v.h);
      ctx.restore();
    }
    if (this.trans) this.drawTransition(ctx, v);
  },

  drawTransition(ctx, v) {
    const tr = this.trans;
    const maxR = Math.hypot(v.w, v.h);
    let r;
    if (tr.t < 0.38) r = maxR * (1 - Ease.inCubic(tr.t / 0.38));
    else r = maxR * Ease.inCubic(Math.min(1, (tr.t - 0.42) / 0.38));
    if (tr.t >= 0.38 && tr.t < 0.42) r = 0;
    ctx.save();
    ctx.beginPath();
    ctx.rect(v.x, v.y, v.w, v.h);
    ctx.arc(tr.x, tr.y, Math.max(0, r), 0, TAU, true);
    ctx.fillStyle = '#0a1230';
    ctx.fill('evenodd');
    if (r < 140) {
      const ball = Images.get(ASSETS.ball);
      const bs = 110 * (1 - r / 140) + 30;
      if (ball) {
        ctx.translate(tr.x, tr.y);
        ctx.rotate(tr.t * 12);
        ctx.drawImage(ball, -bs / 2, -bs / 2, bs, bs);
      }
    }
    ctx.restore();
  }
};

const ASSETS = {
  bg: 'assets/game/goalbackground.png',
  goal: 'assets/game/goal.png',
  ball: 'assets/game/ball.png',
  lines: 'assets/game/motionlines.png'
};
