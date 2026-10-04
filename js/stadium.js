// ============================================================
//  Stadium world: background, lights, goal with net bulge,
//  goalkeeper and ball — shared by the title and match scenes.
// ============================================================
'use strict';

const GOAL = { cx: 640, bottom: 470, w: 600 };
GOAL.h = GOAL.w * 1167 / 1920;
GOAL.top = GOAL.bottom - GOAL.h;
GOAL.left = GOAL.cx - GOAL.w / 2;

// Three shot zones inside the goal mouth (left / centre / right)
const ZONES = [
  { u: 0.2, v: 0.52 },
  { u: 0.5, v: 0.3 },
  { u: 0.8, v: 0.52 }
].map(z => ({ x: GOAL.left + z.u * GOAL.w, y: GOAL.top + z.v * GOAL.h }));

const SPOT = { x: 640, y: 628 };
const HORIZON_Y = 392;
const BALL_SIZE = 92;
const KEEPER_H = 205;

const Stadium = {
  cam: { x: W / 2, y: H / 2, zoom: 1 },
  net: { impact: null },
  flashes: [],
  whiteLines: null,

  theme: null,
  resetCam() { Object.assign(this.cam, { x: W / 2, y: H / 2, zoom: 1 }); this.theme = null; },
  setTheme(name) {
    this.theme = name;
    if (name === 'halloween') Images.load('assets/categories/halloween/ghost.png');
  },

  applyCam(ctx) {
    const c = this.cam;
    ctx.translate(W / 2 + Engine.shakeX, H / 2 + Engine.shakeY);
    ctx.scale(c.zoom, c.zoom);
    ctx.translate(-c.x, -c.y);
  },

  // Converts a world point to screen (UI) space
  toScreen(x, y) {
    const c = this.cam;
    return { x: (x - c.x) * c.zoom + W / 2, y: (y - c.y) * c.zoom + H / 2 };
  },

  drawBackground(ctx, dim = 0) {
    const bg = Images.get(ASSETS.bg);
    const v = Engine.view();
    // cover the whole visible area (world coords are 1280x720 but the camera may zoom out a bit)
    const ratio = 1652 / 2940;
    const bw = Math.max(W * 1.28, v.w * 1.05, (v.h * 1.05) / ratio), bh = bw * ratio;
    const bx = W / 2 - bw / 2;
    // place the far edge of the pitch (64% down the image) well above the goal line,
    // so the goal stands on the grass instead of against the advertising boards
    const by = clamp(HORIZON_Y - bh * 0.64, v.y + v.h - bh, v.y);
    if (bg) ctx.drawImage(bg, bx, by, bw, bh);
    else { ctx.fillStyle = '#1b5e20'; ctx.fillRect(bx, by, bw, bh); }

    // sweeping spotlights
    const t = Engine.realTime;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    [[80, -40, 0.7], [W - 80, -40, -0.7]].forEach(([lx, ly, base], i) => {
      const a = Math.PI / 2 + base * 0.6 + Math.sin(t * 0.5 + i * 2) * 0.35;
      const len = 900;
      const g = ctx.createLinearGradient(lx, ly, lx + Math.cos(a) * len, ly + Math.sin(a) * len);
      g.addColorStop(0, 'rgba(255,250,220,0.22)');
      g.addColorStop(1, 'rgba(255,250,220,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(lx, ly);
      ctx.lineTo(lx + Math.cos(a - 0.13) * len, ly + Math.sin(a - 0.13) * len);
      ctx.lineTo(lx + Math.cos(a + 0.13) * len, ly + Math.sin(a + 0.13) * len);
      ctx.closePath();
      ctx.fill();
    });
    ctx.restore();

    // crowd camera flashes in the stands
    if (Math.random() < 0.12 + (this.crowdHype || 0) * 0.8) {
      this.flashes.push({ x: rand(20, W - 20), y: rand(120, 330), life: 0, max: rand(0.08, 0.2), r: rand(10, 22) });
    }
    this.flashes = this.flashes.filter(f => (f.life += 1 / 60) < f.max);
    for (const f of this.flashes) Glow.draw(ctx, '#ffffff', f.x, f.y, f.r, 1 - f.life / f.max);
    this.crowdHype = Math.max(0, (this.crowdHype || 0) - 0.004);

    if (dim > 0) {
      ctx.fillStyle = `rgba(5,10,35,${dim})`;
      ctx.fillRect(bx, by, bw, bh);
    }
    if (this.theme === 'halloween') this.drawHalloweenSky(ctx, bx, by, bw, bh);
  },

  // ---------------- Halloween theme (gentle, for little kids) ----------------
  drawBat(ctx, x, y, s, flap, t) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    ctx.fillStyle = '#150a26';
    const w = Math.sin(flap) * 0.55;
    [-1, 1].forEach(side => {
      ctx.save();
      ctx.scale(side, 1);
      ctx.rotate(-w * 0.4);
      ctx.beginPath();
      ctx.moveTo(4, -2);
      ctx.quadraticCurveTo(18, -22 - w * 14, 44, -10 - w * 18);
      ctx.quadraticCurveTo(36, -2, 32, 6 + w * 6);
      ctx.quadraticCurveTo(24, 0, 18, 8 + w * 4);
      ctx.quadraticCurveTo(10, 2, 4, 10);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    });
    ctx.beginPath(); ctx.ellipse(0, 4, 8, 11, 0, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-7, -4); ctx.lineTo(-5, -15); ctx.lineTo(-1, -6); ctx.lineTo(1, -6); ctx.lineTo(5, -15); ctx.lineTo(7, -4); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#ffb02e';
    ctx.beginPath(); ctx.arc(-3, 0, 1.8, 0, TAU); ctx.arc(3, 0, 1.8, 0, TAU); ctx.fill();
    ctx.restore();
  },

  drawHalloweenSky(ctx, bx, by, bw, bh) {
    const t = Engine.realTime;
    // moonlit night: tint the whole stadium purple-blue
    ctx.save();
    ctx.globalCompositeOperation = 'multiply';
    const g = ctx.createLinearGradient(0, by, 0, by + bh);
    g.addColorStop(0, '#5a3d9a');
    g.addColorStop(0.55, '#7b5cb8');
    g.addColorStop(1, '#6a58a8');
    ctx.fillStyle = g;
    ctx.fillRect(bx, by, bw, bh);
    ctx.restore();
    ctx.fillStyle = 'rgba(25,8,55,0.28)';
    ctx.fillRect(bx, by, bw, bh);

    // big friendly moon
    const mx = 1010, my = 150;
    Glow.draw(ctx, '#d9c8ff', mx, my, 190, 0.55);
    ctx.save();
    ctx.fillStyle = '#fff6d8';
    ctx.beginPath(); ctx.arc(mx, my, 58, 0, TAU); ctx.fill();
    ctx.fillStyle = 'rgba(230,205,150,0.55)';
    [[-18, -10, 11], [14, 12, 15], [10, -24, 7], [-22, 20, 8]].forEach(([dx, dy, r]) => { ctx.beginPath(); ctx.arc(mx + dx, my + dy, r, 0, TAU); ctx.fill(); });
    ctx.restore();

    // twinkling stars
    for (let i = 0; i < 22; i++) {
      const sx = (i * 211.7) % W, sy = 14 + ((i * 83.3) % 150);
      const a = 0.4 + 0.6 * Math.abs(Math.sin(t * 1.8 + i * 2.1));
      Glow.draw(ctx, '#fff8c8', sx, sy, 5 + a * 5, a * 0.8);
    }

    // floating friendly ghosts in the stands
    const gh = Images.get('assets/categories/halloween/ghost.png');
    if (gh) {
      [[160, 250, 120, 0], [1130, 300, 100, 2.2], [520, 175, 80, 4.1]].forEach(([gx, gy, size, ph]) => {
        const x = gx + Math.sin(t * 0.5 + ph) * 40, y = gy + Math.sin(t * 1.1 + ph) * 14;
        const k = size / gh.naturalHeight;
        ctx.save();
        ctx.globalAlpha = 0.5 + Math.sin(t * 1.3 + ph) * 0.12;
        ctx.translate(x, y);
        ctx.rotate(Math.sin(t * 0.9 + ph) * 0.08);
        Glow.draw(ctx, '#c9b8ff', 0, 0, size * 0.8, 0.4);
        ctx.drawImage(gh, -gh.naturalWidth * k / 2, -size / 2, gh.naturalWidth * k, size);
        ctx.restore();
      });
    }

    // bats flapping across the night sky
    for (let i = 0; i < 6; i++) {
      const speed = 55 + i * 14;
      const x = (((t * speed + i * 330) % (W + 300)) + (W + 300)) % (W + 300) - 150;
      const y = 70 + (i * 47) % 150 + Math.sin(t * 1.4 + i) * 26;
      this.drawBat(ctx, i % 2 ? W - x : x, y, 0.75 + (i % 3) * 0.25, t * 13 + i, t);
    }
  },

  // Props around the goal: jack-o'-lanterns, drifting fog
  drawThemeProps(ctx) {
    if (this.theme !== 'halloween') return;
    const t = Engine.realTime;
    const pump = Images.get('assets/categories/halloween/pumpkin.png');
    [[GOAL.left - 64, GOAL.bottom + 22, 1], [GOAL.left + GOAL.w + 64, GOAL.bottom + 22, -1]].forEach(([x, y, side], i) => {
      const flick = 0.75 + Math.sin(t * 9 + i * 2) * 0.15 + Math.sin(t * 23 + i) * 0.08;
      Glow.draw(ctx, '#ff8a1a', x, y - 44, 130, 0.55 * flick);
      if (!pump) return;
      const h = 104, w = pump.naturalWidth * h / pump.naturalHeight;
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.beginPath(); ctx.ellipse(x, y - 2, w * 0.5, 11, 0, 0, TAU); ctx.fill();
      ctx.drawImage(pump, x - w / 2, y - h, w, h);
      // glowing jack-o'-lantern face
      ctx.save();
      ctx.translate(x, y - h * 0.46);
      ctx.fillStyle = '#4a1a00';
      ctx.shadowColor = '#ffd23a';
      ctx.shadowBlur = 12 * flick;
      ctx.fillStyle = `rgba(255,${200 + 40 * flick | 0},60,0.96)`;
      [-1, 1].forEach(sd => { ctx.beginPath(); ctx.moveTo(sd * 17, -14); ctx.lineTo(sd * 8, 2); ctx.lineTo(sd * 26, 2); ctx.closePath(); ctx.fill(); });
      ctx.beginPath(); ctx.moveTo(-24, 10);
      ctx.quadraticCurveTo(0, 36, 24, 10); ctx.quadraticCurveTo(0, 22, -24, 10);
      ctx.closePath(); ctx.fill();
      ctx.restore();
    });
    // low, drifting fog
    for (let i = 0; i < 5; i++) {
      const x = ((t * (14 + i * 4) + i * 300) % (W + 600)) - 300;
      Glow.draw(ctx, '#cdbfff', x, GOAL.bottom + 10 + (i % 2) * 40, 260, 0.14);
    }
    // glowing wisps floating up
    for (let i = 0; i < 12; i++) {
      const y = ((GOAL.bottom + 160 - t * (18 + i * 3) + i * 90) % 520 + 520) % 520 + 190;
      const x = 80 + (i * 107) % (W - 160) + Math.sin(t * 0.8 + i) * 24;
      Glow.draw(ctx, i % 3 ? '#ffae42' : '#9dff8a', x, y, 9 + (i % 3) * 3, 0.55);
    }
  },

  // Screen-space decoration: cobwebs in the corners and a dangling spider
  drawThemeOverlay(ctx) {
    if (this.theme !== 'halloween') return;
    const t = Engine.realTime;
    const v = Engine.view();
    const web = (x0, y0, dx, dy) => {
      ctx.save();
      ctx.translate(x0, y0);
      ctx.scale(dx, dy);
      ctx.strokeStyle = 'rgba(255,255,255,0.42)';
      ctx.lineWidth = 1.6;
      for (let i = 0; i <= 5; i++) {
        const a = (i / 5) * Math.PI / 2;
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(a) * 190, Math.sin(a) * 190); ctx.stroke();
      }
      for (let r = 40; r <= 190; r += 38) {
        ctx.beginPath();
        for (let i = 0; i <= 5; i++) {
          const a = (i / 5) * Math.PI / 2;
          const rr2 = r * (i % 1 === 0 ? 1 : 1) * (1 - 0.1 * Math.sin(i * 1.7 + r));
          const px = Math.cos(a) * rr2, py = Math.sin(a) * rr2;
          if (i) ctx.quadraticCurveTo(Math.cos(a - 0.15) * rr2 * 0.88, Math.sin(a - 0.15) * rr2 * 0.88, px, py); else ctx.moveTo(px, py);
        }
        ctx.stroke();
      }
      ctx.restore();
    };
    web(v.x, v.y, 1, 1);
    web(v.x + v.w, v.y, -1, 1);
    // spider on a thread
    const sx = 985, len = 70 + (Math.sin(t * 1.6) * 0.5 + 0.5) * 34;
    ctx.strokeStyle = 'rgba(255,255,255,0.6)';
    ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.moveTo(sx, v.y); ctx.lineTo(sx, len); ctx.stroke();
    ctx.save();
    ctx.translate(sx, len + 14);
    ctx.rotate(Math.sin(t * 1.6) * 0.1);
    ctx.strokeStyle = '#1a0b2e';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    for (let i = 0; i < 4; i++) {
      const dy = -4 + i * 5, wig = Math.sin(t * 8 + i) * 2;
      [-1, 1].forEach(sd => { ctx.beginPath(); ctx.moveTo(sd * 8, dy); ctx.quadraticCurveTo(sd * 20, dy - 10 + wig, sd * 26, dy + 8); ctx.stroke(); });
    }
    ctx.fillStyle = '#1a0b2e';
    ctx.beginPath(); ctx.ellipse(0, 4, 11, 13, 0, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.arc(0, -10, 8, 0, TAU); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(-3, -11, 3, 0, TAU); ctx.arc(3, -11, 3, 0, TAU); ctx.fill();
    ctx.fillStyle = '#111';
    ctx.beginPath(); ctx.arc(-3, -10.5, 1.5, 0, TAU); ctx.arc(3, -10.5, 1.5, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.arc(0, -8, 4, 0.2, Math.PI - 0.2); ctx.stroke();
    ctx.restore();
  },

  // Goal pre-rendered once with its soft glow (shadowBlur every frame is slow on school PCs)
  goalSprite() {
    if (this._goal) return this._goal;
    const img = Images.get(ASSETS.goal);
    if (!img) return null;
    const pad = 20, k = 2;
    const c = document.createElement('canvas');
    c.width = Math.round((GOAL.w + pad * 2) * k);
    c.height = Math.round((GOAL.h + pad * 2) * k);
    const g = c.getContext('2d');
    g.shadowColor = 'rgba(255,255,255,0.35)';
    g.shadowBlur = 10 * k;
    g.drawImage(img, pad * k, pad * k, GOAL.w * k, GOAL.h * k);
    this._goal = { c, pad, k };
    return this._goal;
  },

  // Grass under the goal: box lines, goal line and the net's contact shadow
  drawGoalGround(ctx) {
    const b = GOAL.bottom, l = GOAL.left, r = GOAL.left + GOAL.w;
    ctx.save();
    // painted goal area (six-yard box) in perspective
    ctx.strokeStyle = 'rgba(255,255,255,0.75)';
    ctx.lineWidth = 5;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(l - 150, b + 3);
    ctx.lineTo(l - 205, b + 72);
    ctx.lineTo(r + 205, b + 72);
    ctx.lineTo(r + 150, b + 3);
    ctx.stroke();
    // goal line across the pitch
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(-400, b + 3);
    ctx.lineTo(W + 400, b + 3);
    ctx.stroke();
    // soft shadow of the goal frame and net on the grass
    const g = ctx.createRadialGradient(GOAL.cx, b - 4, 20, GOAL.cx, b - 4, GOAL.w * 0.62);
    g.addColorStop(0, 'rgba(0,30,0,0.45)');
    g.addColorStop(1, 'rgba(0,30,0,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(GOAL.cx, b - 6, GOAL.w * 0.62, 34, 0, 0, TAU);
    ctx.fill();
    // darker contact shadows at the foot of each post
    [l + 10, r - 10].forEach(x => {
      const pg = ctx.createRadialGradient(x, b, 2, x, b, 26);
      pg.addColorStop(0, 'rgba(0,0,0,0.55)');
      pg.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = pg;
      ctx.beginPath();
      ctx.ellipse(x, b, 26, 9, 0, 0, TAU);
      ctx.fill();
    });
    ctx.restore();
  },

  // Goal, warped around an impact point for a net "bulge"
  drawGoal(ctx) {
    const sp = this.goalSprite();
    if (!sp) return;
    const imp = this.net.impact;
    const gx = GOAL.left, gy = GOAL.top, gw = GOAL.w, gh = GOAL.h;
    const { c, pad, k } = sp;
    this.drawGoalGround(ctx);
    if (!imp) {
      ctx.drawImage(c, gx - pad, gy - pad, gw + pad * 2, gh + pad * 2);
      return;
    }
    const age = imp.t;
    const amp = Math.exp(-age * 3.2) * (0.6 + 0.4 * Math.cos(age * 18));
    const cols = 18, rows = 11;
    const tw = gw / cols, th = gh / rows;
    for (let j = 0; j < rows; j++) {
      for (let i = 0; i < cols; i++) {
        const cx = gx + (i + 0.5) * tw, cy = gy + (j + 0.5) * th;
        const u = (i + 0.5) / cols, v = (j + 0.5) / rows;
        const edge = clamp(Math.min(u - 0.05, 0.95 - u, v - 0.06) / 0.1, 0, 1);
        const d = Math.hypot(cx - imp.x, cy - imp.y);
        const f = Math.exp(-(d * d) / (2 * 95 * 95)) * amp * edge;
        const pull = 0.3 * f;
        const nx = cx + (imp.x - cx) * pull;
        const ny = cy + (imp.y - cy) * pull - f * 4;
        const s = 1 - 0.32 * f;
        const dw = (tw + 1) * s, dh = (th + 1) * s;
        ctx.drawImage(c, (pad + i * tw) * k, (pad + j * th) * k, tw * k, th * k, nx - dw / 2, ny - dh / 2, dw, dh);
      }
    }
  },

  updateNet(dt) {
    if (this.net.impact) {
      this.net.impact.t += dt;
      if (this.net.impact.t > 1.6) this.net.impact = null;
    }
  },

  // keeper: { entry, x, y (feet), rot, sx, sy, flash, alpha, t }
  drawKeeper(ctx, k) {
    if (!k || !k.entry || k.alpha <= 0) return;
    const fr = Keepers.frame(k.entry, k.t);
    if (!fr) return;
    const fw = fr.naturalWidth || fr.width, fh = fr.naturalHeight || fr.height;
    let h = KEEPER_H * (k.size || 1);
    let w = fw * (h / fh);
    const maxW = 250 * (k.size || 1);
    if (w > maxW) { h *= maxW / w; w = maxW; }
    k.drawW = w; k.drawH = h;

    // ground shadow
    const lift = Math.max(0, (k.groundY ?? k.y) - k.y);
    ctx.save();
    ctx.globalAlpha = k.alpha * clamp(1 - lift / 300, 0.2, 1) * 0.45;
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.ellipse(k.x, (k.groundY ?? k.y) - 2, w * 0.38 * clamp(1 - lift / 600, 0.2, 1), 12, 0, 0, TAU);
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.globalAlpha = k.alpha;
    // pivot at body centre
    ctx.translate(k.x, k.y - h / 2);
    ctx.rotate(k.rot || 0);
    ctx.scale((k.sx || 1) * (k.face || 1), k.sy || 1);
    if (k.flash > 0) {
      const tmp = Stadium._tmp || (Stadium._tmp = document.createElement('canvas'));
      tmp.width = Math.ceil(w); tmp.height = Math.ceil(h);
      const tg = tmp.getContext('2d');
      tg.clearRect(0, 0, tmp.width, tmp.height);
      tg.drawImage(fr, 0, 0, w, h);
      tg.globalCompositeOperation = 'source-atop';
      tg.fillStyle = `rgba(255,255,255,${clamp(k.flash, 0, 1)})`;
      tg.fillRect(0, 0, w, h);
      ctx.drawImage(tmp, -w / 2, -h / 2, w, h);
    } else {
      ctx.drawImage(fr, -w / 2, -h / 2, w, h);
    }
    ctx.restore();

    // dizzy stars
    if (k.dizzy > 0) {
      for (let i = 0; i < 3; i++) {
        const a = Engine.time * 5 + (i * TAU) / 3;
        const sx = k.dizzyX + Math.cos(a) * 42, sy = k.dizzyY + Math.sin(a) * 12;
        ctx.save();
        ctx.globalAlpha = k.dizzy;
        ctx.fillStyle = '#ffe14d';
        ctx.strokeStyle = '#8a5a00';
        ctx.lineWidth = 2;
        starPath(ctx, sx, sy, 5, 11, 5, a);
        ctx.fill(); ctx.stroke();
        ctx.restore();
      }
    }
  },

  // ball: { x, y, s (scale), rot, groundY, alpha, golden, squashX, squashY }
  drawBall(ctx, b) {
    if (!b || b.alpha <= 0) return;
    const img = Images.get(ASSETS.ball);
    const size = BALL_SIZE * b.s;
    ctx.save();
    ctx.globalAlpha = b.alpha;
    // shadow
    if (b.groundY !== undefined) {
      const lift = Math.max(0, b.groundY - b.y);
      ctx.save();
      ctx.globalAlpha *= clamp(0.5 - lift / 600, 0.1, 0.5);
      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.ellipse(b.x, b.groundY, size * 0.42 * clamp(1 - lift / 500, 0.4, 1), size * 0.12, 0, 0, TAU);
      ctx.fill();
      ctx.restore();
    }
    if (b.golden) Glow.draw(ctx, '#ffcc33', b.x, b.y, size * 1.1, 0.7 + Math.sin(Engine.realTime * 8) * 0.2);
    ctx.translate(b.x, b.y);
    ctx.scale(b.squashX || 1, b.squashY || 1);
    ctx.rotate(b.rot || 0);
    if (img) ctx.drawImage(img, -size / 2, -size / 2, size, size);
    if (b.golden) {
      ctx.globalCompositeOperation = 'source-atop';
      ctx.fillStyle = 'rgba(255,190,0,0.45)';
      ctx.beginPath(); ctx.arc(0, 0, size / 2, 0, TAU); ctx.fill();
    }
    ctx.restore();
  },

  // Speed lines (white version of motionlines.png), drawn in screen space
  drawSpeedLines(ctx, alpha, rot) {
    if (alpha <= 0) return;
    if (this.whiteLines === false) return;
    if (!this.whiteLines) {
      const src = Images.get(ASSETS.lines);
      if (!src) return;
      const c = document.createElement('canvas');
      c.width = 1024; c.height = 1024;
      const g = c.getContext('2d');
      g.drawImage(src, 0, 0, 1024, 1024);
      // keep only the white streaks (the image is white lines on black)
      try {
        const id = g.getImageData(0, 0, 1024, 1024);
        const d = id.data;
        for (let i = 0; i < d.length; i += 4) {
          d[i + 3] = (d[i + 3] * d[i]) / 255;
          d[i] = d[i + 1] = d[i + 2] = 255;
        }
        g.putImageData(id, 0, 0);
        this.whiteLines = c;
      } catch (e) {
        this.whiteLines = false; // file:// pages can't read pixels; skip the effect
        return;
      }
    }
    const v = Engine.view();
    const size = Math.max(v.w, v.h) * 1.5;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(W / 2, H / 2);
    ctx.rotate(rot);
    ctx.drawImage(this.whiteLines, -size / 2, -size / 2, size, size);
    ctx.restore();
  }
};
