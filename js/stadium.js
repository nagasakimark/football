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
const BALL_SIZE = 92;
const KEEPER_H = 205;

const Stadium = {
  cam: { x: W / 2, y: H / 2, zoom: 1 },
  net: { impact: null },
  flashes: [],
  whiteLines: null,

  resetCam() { Object.assign(this.cam, { x: W / 2, y: H / 2, zoom: 1 }); },

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
    const bw = Math.max(W * 1.1, v.w * 1.05, (v.h * 1.05) / ratio), bh = bw * ratio;
    const bx = W / 2 - bw / 2;
    const by = clamp(H - bh + (bh - H) * 0.35, v.y + v.h - bh, v.y);
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

  // Goal, warped around an impact point for a net "bulge"
  drawGoal(ctx) {
    const sp = this.goalSprite();
    if (!sp) return;
    const imp = this.net.impact;
    const gx = GOAL.left, gy = GOAL.top, gw = GOAL.w, gh = GOAL.h;
    const { c, pad, k } = sp;
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
