// ============================================================
//  Shared UI widgets: HUD icons, banners, big titles, ribbons
// ============================================================
'use strict';

const Icons = {
  back(ctx) {
    ctx.fillStyle = '#fff';
    ctx.strokeStyle = 'rgba(0,0,0,0.35)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-14, 0); ctx.lineTo(4, -16); ctx.lineTo(4, -7); ctx.lineTo(15, -7);
    ctx.lineTo(15, 7); ctx.lineTo(4, 7); ctx.lineTo(4, 16); ctx.closePath();
    ctx.stroke(); ctx.fill();
  },
  sound(ctx) {
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.moveTo(-15, -6); ctx.lineTo(-7, -6); ctx.lineTo(3, -14); ctx.lineTo(3, 14); ctx.lineTo(-7, 6); ctx.lineTo(-15, 6);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 3.5;
    ctx.lineCap = 'round';
    if (Sound.muted) {
      ctx.beginPath(); ctx.moveTo(8, -7); ctx.lineTo(18, 7); ctx.moveTo(18, -7); ctx.lineTo(8, 7); ctx.stroke();
    } else {
      ctx.beginPath(); ctx.arc(4, 0, 9, -0.9, 0.9); ctx.stroke();
      ctx.beginPath(); ctx.arc(4, 0, 16, -0.9, 0.9); ctx.stroke();
    }
  },
  fullscreen(ctx) {
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    const a = 13, b = 6;
    [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(([sx, sy]) => {
      ctx.beginPath();
      ctx.moveTo(sx * a, sy * (a - b));
      ctx.lineTo(sx * a, sy * a);
      ctx.lineTo(sx * (a - b), sy * a);
      ctx.stroke();
    });
  },
  flame(ctx, x, y, s, t) {
    const wob = Math.sin(t * 14) * 0.08;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s * (1 + wob), s * (1 - wob));
    const g = ctx.createLinearGradient(0, -30, 0, 16);
    g.addColorStop(0, '#fff27a'); g.addColorStop(0.5, '#ff9d00'); g.addColorStop(1, '#ff3b1f');
    ctx.fillStyle = g;
    ctx.strokeStyle = '#7a1a00';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, 16);
    ctx.bezierCurveTo(-18, 14, -20, -6, -8, -16);
    ctx.bezierCurveTo(-6, -8, -2, -6, 0, -30);
    ctx.bezierCurveTo(8, -18, 20, -8, 16, 4);
    ctx.bezierCurveTo(14, 14, 8, 16, 0, 16);
    ctx.closePath();
    ctx.stroke(); ctx.fill();
    ctx.fillStyle = '#fff6b0';
    ctx.beginPath(); ctx.ellipse(0, 6, 6, 9, 0, 0, TAU); ctx.fill();
    ctx.restore();
  },
  trophy(ctx, x, y, s) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    const g = ctx.createLinearGradient(-60, 0, 60, 0);
    g.addColorStop(0, '#b8860b'); g.addColorStop(0.35, '#ffe680'); g.addColorStop(0.6, '#ffcb05'); g.addColorStop(1, '#a87400');
    ctx.fillStyle = g;
    ctx.strokeStyle = '#5c3d00';
    ctx.lineWidth = 5;
    ctx.lineJoin = 'round';
    // handles
    ctx.beginPath(); ctx.arc(-62, -40, 26, Math.PI * 0.5, Math.PI * 1.5); ctx.lineWidth = 12; ctx.strokeStyle = '#5c3d00'; ctx.stroke();
    ctx.lineWidth = 7; ctx.strokeStyle = '#ffd84a'; ctx.stroke();
    ctx.beginPath(); ctx.arc(62, -40, 26, -Math.PI * 0.5, Math.PI * 0.5); ctx.lineWidth = 12; ctx.strokeStyle = '#5c3d00'; ctx.stroke();
    ctx.lineWidth = 7; ctx.strokeStyle = '#ffd84a'; ctx.stroke();
    ctx.strokeStyle = '#5c3d00'; ctx.lineWidth = 5;
    // cup
    ctx.beginPath();
    ctx.moveTo(-66, -78); ctx.lineTo(66, -78);
    ctx.bezierCurveTo(66, -10, 30, 20, 12, 26);
    ctx.lineTo(12, 50); ctx.lineTo(-12, 50); ctx.lineTo(-12, 26);
    ctx.bezierCurveTo(-30, 20, -66, -10, -66, -78);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    // base
    rr(ctx, -44, 50, 88, 20, 5); ctx.fill(); ctx.stroke();
    rr(ctx, -56, 70, 112, 22, 6); ctx.fillStyle = '#6b3f1d'; ctx.fill(); ctx.stroke();
    // star + shine
    ctx.fillStyle = '#fff6c0';
    starPath(ctx, 0, -34, 5, 22, 10); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.beginPath(); ctx.ellipse(-36, -50, 8, 22, 0.3, 0, TAU); ctx.fill();
    ctx.restore();
  }
};

// Big "GOAL!" style title made of individually animated letters
class BigTitle {
  constructor(text, o = {}) {
    this.text = text;
    this.size = o.size || 150;
    this.colors = o.colors || ['#fffbd0', '#ffd21f', '#ff8a00'];
    this.outline = o.outline || '#4a1400';
    this.x = o.x ?? W / 2;
    this.y = o.y ?? 300;
    this.t = 0;
    this.alpha = 1;
    this.letters = [];
    const ctx = Engine.ctx;
    setFont(ctx, this.size, FONT_DISPLAY);
    const widths = [...text].map(ch => ctx.measureText(ch).width * 0.96);
    const total = widths.reduce((a, b) => a + b, 0);
    let cx = -total / 2;
    [...text].forEach((ch, i) => {
      this.letters.push({ ch, x: cx + widths[i] / 2, delay: i * 0.055, rot0: rand(-0.5, 0.5) });
      cx += widths[i];
    });
  }
  update(dt) { this.t += dt; }
  draw(ctx) {
    if (this.alpha <= 0) return;
    ctx.save();
    ctx.globalAlpha *= this.alpha;
    ctx.translate(this.x, this.y);
    const size = this.size;
    for (const [i, L] of this.letters.entries()) {
      const lt = this.t - L.delay;
      if (lt <= 0) continue;
      const p = Math.min(1, lt / 0.45);
      const s = lerp(3.2, 1, Ease.outBack(p));
      const a = Math.min(1, lt / 0.12);
      const wave = Math.sin(this.t * 5 - i * 0.6) * 7 * Math.min(1, this.t);
      ctx.save();
      ctx.globalAlpha *= a;
      ctx.translate(L.x, wave);
      ctx.rotate(L.rot0 * (1 - Ease.outCubic(p)) + Math.sin(this.t * 3 + i) * 0.04);
      ctx.scale(s, s);
      setFont(ctx, size, FONT_DISPLAY);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.lineJoin = 'round';
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.strokeStyle = 'rgba(0,0,0,0.35)';
      ctx.lineWidth = size * 0.22;
      ctx.strokeText(L.ch, 0, size * 0.08);
      ctx.strokeStyle = this.outline;
      ctx.strokeText(L.ch, 0, 0);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = size * 0.09;
      ctx.strokeText(L.ch, 0, 0);
      const g = ctx.createLinearGradient(0, -size * 0.45, 0, size * 0.4);
      this.colors.forEach((c, j) => g.addColorStop(j / (this.colors.length - 1), c));
      ctx.fillStyle = g;
      ctx.fillText(L.ch, 0, 0);
      ctx.restore();
    }
    ctx.restore();
  }
}

// Ribbon banner with folded ends
function drawRibbon(ctx, x, y, w, h, color, text, o = {}) {
  const dark = shade(color, -0.45);
  ctx.save();
  ctx.translate(x, y);
  const tail = h * 0.55;
  // tails
  ctx.fillStyle = dark;
  [[-1], [1]].forEach(([s]) => {
    ctx.beginPath();
    ctx.moveTo(s * (w / 2 - 10), -h / 2 + 12);
    ctx.lineTo(s * (w / 2 + tail), -h / 2 + 12);
    ctx.lineTo(s * (w / 2 + tail * 0.55), 12);
    ctx.lineTo(s * (w / 2 + tail), h / 2 + 12);
    ctx.lineTo(s * (w / 2 - 10), h / 2 + 12);
    ctx.closePath();
    ctx.fill();
  });
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  rr(ctx, -w / 2, -h / 2 + 6, w, h, 8); ctx.fill();
  const g = ctx.createLinearGradient(0, -h / 2, 0, h / 2);
  g.addColorStop(0, shade(color, 0.25));
  g.addColorStop(1, color);
  ctx.fillStyle = g;
  rr(ctx, -w / 2, -h / 2, w, h, 8); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.5)';
  ctx.lineWidth = 2;
  ctx.setLineDash([8, 6]);
  rr(ctx, -w / 2 + 6, -h / 2 + 6, w - 12, h - 12, 5); ctx.stroke();
  ctx.setLineDash([]);
  if (text) {
    txt(ctx, text, 0, 2, {
      size: o.size || h * 0.52, fill: o.textColor || '#fff', stroke: dark, font: o.font || FONT_DISPLAY,
      maxW: w - 40, lw: (o.size || h * 0.52) * 0.18
    });
  }
  ctx.restore();
}

// Rotating light rays
function drawSunburst(ctx, x, y, r, alpha, t, color = '255,220,90') {
  if (alpha <= 0) return;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(x, y);
  ctx.rotate(t * 0.4);
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
  g.addColorStop(0, `rgba(${color},0.75)`);
  g.addColorStop(1, `rgba(${color},0)`);
  ctx.fillStyle = g;
  const n = 14;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, r, a, a + (TAU / n) * 0.5);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

// Speech bubble with centred text
function drawBubble(ctx, x, y, lines, o = {}) {
  const size = o.size || 34;
  const sub = o.sub;
  setFont(ctx, size, FONT_ROUND, '700');
  let w = ctx.measureText(lines).width;
  if (sub) { setFont(ctx, size * 0.55, FONT_ROUND, '600'); w = Math.max(w, ctx.measureText(sub).width); }
  w = Math.min(w + 60, o.maxW || 900);
  const h = sub ? size * 2.1 : size * 1.55;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(o.scale ?? 1, o.scale ?? 1);
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  rr(ctx, -w / 2, -h / 2 + 6, w, h, h / 2); ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.strokeStyle = o.border || '#1d3f96';
  ctx.lineWidth = 5;
  rr(ctx, -w / 2, -h / 2, w, h, h / 2); ctx.fill(); ctx.stroke();
  // tail
  ctx.beginPath();
  ctx.moveTo(-14, h / 2 - 2); ctx.lineTo(0, h / 2 + 18); ctx.lineTo(14, h / 2 - 2);
  ctx.fillStyle = '#fff'; ctx.fill();
  ctx.beginPath();
  ctx.moveTo(-14, h / 2 + 1); ctx.lineTo(0, h / 2 + 18); ctx.lineTo(14, h / 2 + 1);
  ctx.stroke();
  txt(ctx, lines, 0, sub ? -size * 0.36 : 1, { size, font: FONT_ROUND, fill: '#1d2b5a', shadow: false, maxW: w - 40 });
  if (sub) txt(ctx, sub, 0, size * 0.55, { size: size * 0.55, font: FONT_ROUND, weight: '600', fill: '#5a6a90', shadow: false, maxW: w - 40 });
  ctx.restore();
}

// Hand pointer icon
function drawHand(ctx, x, y, s) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.rotate(-0.35);
  ctx.fillStyle = '#fff';
  ctx.strokeStyle = '#1d2b5a';
  ctx.lineWidth = 4;
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(-6, -34);
  ctx.quadraticCurveTo(0, -42, 6, -34);
  ctx.lineTo(6, -6);
  ctx.quadraticCurveTo(12, -12, 18, -6);
  ctx.quadraticCurveTo(24, -10, 28, -3);
  ctx.quadraticCurveTo(34, -6, 36, 2);
  ctx.lineTo(36, 18);
  ctx.quadraticCurveTo(34, 34, 18, 36);
  ctx.lineTo(0, 36);
  ctx.quadraticCurveTo(-14, 34, -20, 18);
  ctx.lineTo(-26, 4);
  ctx.quadraticCurveTo(-24, -4, -14, 0);
  ctx.lineTo(-6, 8);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}
