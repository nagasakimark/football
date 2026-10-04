// ============================================================
//  Trading-card rendering (cached to offscreen canvases)
// ============================================================
'use strict';

const CARD_W = 240, CARD_H = 336, CARD_RES = 2.5;

function makeCanvas(w, h, res = CARD_RES) {
  const c = document.createElement('canvas');
  c.width = Math.round(w * res);
  c.height = Math.round(h * res);
  const g = c.getContext('2d');
  g.scale(res, res);
  return { c, g };
}

function energyOrb(g, x, y, r, type) {
  const gr = g.createRadialGradient(x - r * 0.35, y - r * 0.35, r * 0.1, x, y, r);
  gr.addColorStop(0, shade(type.orb, 0.55));
  gr.addColorStop(1, type.orb);
  g.fillStyle = 'rgba(0,0,0,0.25)';
  g.beginPath(); g.arc(x, y + 1, r + 1.5, 0, TAU); g.fill();
  g.fillStyle = '#fff';
  g.beginPath(); g.arc(x, y, r + 1.2, 0, TAU); g.fill();
  g.fillStyle = gr;
  g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill();
  g.fillStyle = '#fff';
  starPath(g, x, y + 0.5, 5, r * 0.62, r * 0.27);
  g.fill();
}

function arrowShape(g, x, y, dir, size, color) {
  // dir: 0 left, 1 up, 2 right
  const rot = dir === 0 ? Math.PI : dir === 1 ? -Math.PI / 2 : 0;
  g.save();
  g.translate(x, y);
  g.rotate(rot);
  g.beginPath();
  g.moveTo(size * 0.55, 0);
  g.lineTo(-size * 0.05, -size * 0.5);
  g.lineTo(-size * 0.05, -size * 0.2);
  g.lineTo(-size * 0.55, -size * 0.2);
  g.lineTo(-size * 0.55, size * 0.2);
  g.lineTo(-size * 0.05, size * 0.2);
  g.lineTo(-size * 0.05, size * 0.5);
  g.closePath();
  g.lineJoin = 'round';
  g.lineWidth = size * 0.16;
  g.strokeStyle = '#fff';
  g.stroke();
  g.fillStyle = color;
  g.fill();
  g.restore();
}

function dexNo(label) {
  let h = 7;
  for (let i = 0; i < label.length; i++) h = (h * 31 + label.charCodeAt(i)) % 151;
  return String(h + 1).padStart(3, '0');
}

// Renders a card face. opts: { cat, item, img, dir }
function renderCardFace(opts) {
  const { cat, item, img, dir } = opts;
  const type = CARD_TYPES[cat.type] || CARD_TYPES.colorless;
  const label = itemLabel(cat, item);
  const sentence = itemSentence(cat, item);
  const { c, g } = makeCanvas(CARD_W, CARD_H);
  const no = dexNo(label);

  // Gold outer frame
  const gold = g.createLinearGradient(0, 0, CARD_W, CARD_H);
  gold.addColorStop(0, '#fff4a8');
  gold.addColorStop(0.3, '#f7cf2a');
  gold.addColorStop(0.55, '#ffe680');
  gold.addColorStop(0.8, '#e0a800');
  gold.addColorStop(1, '#ffe46b');
  g.fillStyle = gold;
  rr(g, 0, 0, CARD_W, CARD_H, 14);
  g.fill();
  g.strokeStyle = 'rgba(120,80,0,0.6)';
  g.lineWidth = 1.2;
  rr(g, 0.6, 0.6, CARD_W - 1.2, CARD_H - 1.2, 14);
  g.stroke();

  // Inner type panel
  const inner = g.createLinearGradient(0, 8, 0, CARD_H - 8);
  inner.addColorStop(0, type.top);
  inner.addColorStop(0.55, shade(type.bottom, 0.25));
  inner.addColorStop(1, type.bottom);
  g.fillStyle = inner;
  rr(g, 8, 8, CARD_W - 16, CARD_H - 16, 8);
  g.fill();

  // Subtle foil texture
  g.save();
  rr(g, 8, 8, CARD_W - 16, CARD_H - 16, 8);
  g.clip();
  g.strokeStyle = 'rgba(255,255,255,0.12)';
  g.lineWidth = 2;
  for (let i = -CARD_H; i < CARD_W + CARD_H; i += 9) {
    g.beginPath(); g.moveTo(i, 0); g.lineTo(i - CARD_H, CARD_H); g.stroke();
  }
  const sheen = g.createRadialGradient(CARD_W * 0.3, 40, 10, CARD_W * 0.3, 40, 220);
  sheen.addColorStop(0, 'rgba(255,255,255,0.45)');
  sheen.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = sheen;
  g.fillRect(0, 0, CARD_W, CARD_H);
  g.restore();

  // Header: BASIC tag, name, HP, energy
  g.fillStyle = 'rgba(255,255,255,0.85)';
  rr(g, 14, 13, 38, 11, 5.5); g.fill();
  g.strokeStyle = 'rgba(0,0,0,0.35)'; g.lineWidth = 0.8;
  rr(g, 14, 13, 38, 11, 5.5); g.stroke();
  txt(g, 'BASIC', 33, 18.8, { size: 7.5, font: FONT_ROUND, fill: '#333', shadow: false });

  txt(g, label, 16, 38, {
    size: 27, font: FONT_ROUND, weight: '700', fill: '#161616', align: 'left', maxW: 138, shadow: false
  });
  txt(g, 'HP', 165, 40, { size: 9, font: FONT_ROUND, fill: '#b01818', align: 'left', shadow: false });
  txt(g, String(50 + (parseInt(no, 10) % 5) * 10), 179, 37, { size: 20, font: FONT_ROUND, fill: '#b01818', align: 'left', shadow: false });
  energyOrb(g, 219, 36, 10, type);

  // Art window (silver/gold frame)
  const ax = 18, ay = 52, aw = 204, ah = 146;
  const frame = g.createLinearGradient(ax, ay, ax + aw, ay + ah);
  frame.addColorStop(0, '#fffbe0');
  frame.addColorStop(0.5, '#c9a227');
  frame.addColorStop(1, '#fff1a6');
  g.fillStyle = frame;
  g.fillRect(ax - 3, ay - 3, aw + 6, ah + 6);
  g.fillStyle = 'rgba(0,0,0,0.35)';
  g.fillRect(ax - 0.5, ay - 0.5, aw + 1, ah + 1);
  const bg = g.createRadialGradient(ax + aw / 2, ay + ah * 0.45, 8, ax + aw / 2, ay + ah / 2, aw * 0.75);
  bg.addColorStop(0, shade(type.top, 0.55));
  bg.addColorStop(0.55, shade(type.bottom, 0.38));
  bg.addColorStop(1, shade(type.bottom, 0.0));
  g.fillStyle = bg;
  g.fillRect(ax, ay, aw, ah);
  // sunburst behind the art
  g.save();
  g.beginPath(); g.rect(ax, ay, aw, ah); g.clip();
  g.translate(ax + aw / 2, ay + ah / 2);
  g.fillStyle = 'rgba(255,255,255,0.2)';
  for (let i = 0; i < 16; i++) {
    g.rotate(TAU / 16);
    g.beginPath(); g.moveTo(0, 0); g.lineTo(200, -22); g.lineTo(200, 22); g.closePath(); g.fill();
  }
  g.restore();
  if (img) {
    g.save();
    g.beginPath(); g.rect(ax, ay, aw, ah); g.clip();
    const iw = img.naturalWidth || img.width, ih = img.naturalHeight || img.height;
    let s;
    if (cat.photo) s = Math.max(aw / iw, ah / ih);
    else s = Math.min((aw - 22) / iw, (ah - 16) / ih);
    const dw = iw * s, dh = ih * s;
    if (!cat.photo) {
      g.fillStyle = 'rgba(0,0,0,0.18)';
      g.beginPath(); g.ellipse(ax + aw / 2, ay + ah / 2 + dh / 2 - 2, dw * 0.38, 7, 0, 0, TAU); g.fill();
      g.shadowColor = 'rgba(0,0,0,0.3)';
      g.shadowBlur = 6;
      g.shadowOffsetY = 3;
    }
    g.drawImage(img, ax + (aw - dw) / 2, ay + (ah - dh) / 2, dw, dh);
    g.restore();
  }

  // Info strip
  const strip = g.createLinearGradient(0, 204, 0, 216);
  strip.addColorStop(0, '#fff3b0');
  strip.addColorStop(1, '#d9ae2a');
  g.fillStyle = strip;
  g.beginPath();
  g.moveTo(34, 204); g.lineTo(206, 204); g.lineTo(200, 216); g.lineTo(40, 216); g.closePath();
  g.fill();
  txt(g, `NO. ${no}  ${type.name} Pokémon  HT 2'04"  WT 13.2 lbs.`, 120, 210.5, {
    size: 7, font: FONT_ROUND, weight: '600', fill: '#4a3800', shadow: false, maxW: 158
  });

  // "Attack": the sentence to say — big and readable
  g.fillStyle = 'rgba(255,255,255,0.82)';
  rr(g, 14, 222, 212, 74, 9); g.fill();
  g.strokeStyle = 'rgba(0,0,0,0.12)'; g.lineWidth = 1;
  rr(g, 14, 222, 212, 74, 9); g.stroke();
  energyOrb(g, 31, 246, 10, type);
  txt(g, sentence, 46, 247, {
    size: 23, font: FONT_ROUND, weight: '700', fill: '#161616', align: 'left', maxW: dir === undefined ? 168 : 138, shadow: false
  });
  if (dir !== undefined) arrowShape(g, 206, 247, dir, 26, type.dark);
  g.strokeStyle = 'rgba(0,0,0,0.18)';
  g.beginPath(); g.moveTo(24, 267.5); g.lineTo(216, 267.5); g.stroke();
  txt(g, 'Say it loud, then kick the ball!', 120, 282, {
    size: 11.5, font: FONT_ROUND, weight: '500', fill: '#444', shadow: false, maxW: 196
  });

  // Footer
  txt(g, 'weakness ×2   resistance —   retreat ●', 18, 309, {
    size: 7, font: FONT_ROUND, weight: '600', fill: 'rgba(0,0,0,0.6)', align: 'left', shadow: false
  });
  txt(g, 'Illus. Classroom FC', 18, 320, {
    size: 6.5, font: FONT_ROUND, weight: '500', fill: 'rgba(0,0,0,0.5)', align: 'left', shadow: false
  });
  txt(g, `${no}/151 ★`, 222, 318, {
    size: 8, font: FONT_ROUND, weight: '700', fill: 'rgba(0,0,0,0.65)', align: 'right', shadow: false
  });

  return c;
}

let _cardBack = null;
function renderCardBack() {
  if (_cardBack) return _cardBack;
  const { c, g } = makeCanvas(CARD_W, CARD_H);
  const gold = g.createLinearGradient(0, 0, CARD_W, CARD_H);
  gold.addColorStop(0, '#fff4a8'); gold.addColorStop(0.5, '#e0a800'); gold.addColorStop(1, '#ffe46b');
  g.fillStyle = gold;
  rr(g, 0, 0, CARD_W, CARD_H, 14); g.fill();
  const bg = g.createRadialGradient(CARD_W / 2, CARD_H / 2, 10, CARD_W / 2, CARD_H / 2, 220);
  bg.addColorStop(0, '#3f8cff');
  bg.addColorStop(0.6, '#1848a8');
  bg.addColorStop(1, '#0a1f5c');
  g.fillStyle = bg;
  rr(g, 9, 9, CARD_W - 18, CARD_H - 18, 9); g.fill();
  g.save();
  rr(g, 9, 9, CARD_W - 18, CARD_H - 18, 9); g.clip();
  g.translate(CARD_W / 2, CARD_H / 2);
  for (let i = 0; i < 24; i++) {
    g.rotate(TAU / 24);
    g.fillStyle = i % 2 ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,40,0.12)';
    g.beginPath(); g.moveTo(0, 0); g.lineTo(260, -34); g.lineTo(260, 34); g.closePath(); g.fill();
  }
  g.restore();
  const ball = Images.get(ASSETS.ball);
  const glow = g.createRadialGradient(CARD_W / 2, CARD_H / 2, 10, CARD_W / 2, CARD_H / 2, 90);
  glow.addColorStop(0, 'rgba(255,230,120,0.9)');
  glow.addColorStop(1, 'rgba(255,230,120,0)');
  g.fillStyle = glow;
  g.fillRect(0, 0, CARD_W, CARD_H);
  if (ball) g.drawImage(ball, CARD_W / 2 - 55, CARD_H / 2 - 55, 110, 110);
  txt(g, 'POKÉMON', CARD_W / 2, 48, { size: 30, fill: '#ffcb05', stroke: '#1d3f96', lw: 6, shadow: 'rgba(0,0,0,0.4)' });
  txt(g, 'SOCCER', CARD_W / 2, CARD_H - 48, { size: 30, fill: '#ffffff', stroke: '#1d3f96', lw: 6, shadow: 'rgba(0,0,0,0.4)' });
  if (ball) _cardBack = c;
  return c;
}

// Live card draw with flip, holo sheen and glare.
// card: { x, y, rot, scale, flip (0 back → 1 front), face, alpha, t, glow }
function drawCard(ctx, card, time) {
  const flipAngle = (1 - card.flip) * Math.PI;
  const sx = Math.cos(flipAngle);
  const showFront = sx >= 0;
  const s = card.scale;
  ctx.save();
  ctx.globalAlpha *= card.alpha ?? 1;
  ctx.translate(card.x, card.y);
  ctx.rotate(card.rot || 0);
  ctx.scale(s * Math.max(0.02, Math.abs(sx)), s);
  // slight 3D-style tilt toward the pointer while hovered
  const tilt = card.tilt || 0;
  if (tilt > 0.001) ctx.transform(1, (card.shx || 0) * tilt * 0.035, (card.shy || 0) * tilt * 0.03, 1, 0, 0);

  if (card.glow > 0) {
    ctx.save();
    ctx.globalAlpha *= card.glow;
    Glow.draw(ctx, card.glowColor || '#ffe066', 0, 0, 260, 0.9);
    ctx.restore();
  }

  // drop shadow
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  rr(ctx, -CARD_W / 2 + 6, -CARD_H / 2 + 12, CARD_W, CARD_H, 16);
  ctx.fill();

  const img = showFront ? card.face : renderCardBack();
  if (img) ctx.drawImage(img, -CARD_W / 2, -CARD_H / 2, CARD_W, CARD_H);

  if (showFront) drawHolo(ctx, card, time);

  if (card.hover && showFront) {
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 4;
    ctx.globalAlpha *= 0.55 + Math.sin(time * 6) * 0.15;
    rr(ctx, -CARD_W / 2 - 3, -CARD_H / 2 - 3, CARD_W + 6, CARD_H + 6, 17);
    ctx.stroke();
  }
  ctx.restore();
}

// ============================================================
//  Holographic foil (inspired by real "holo rare" Pokémon cards)
//  - rainbow foil gradient that slides with the light position
//  - glitter that only sparkles near the light
//  - soft glare following the pointer
//  Everything is masked to the art window + gold frame, so the name,
//  the sentence and the footer text are never washed out.
// ============================================================
const HOLO_RES = 1.5;
const Holo = {
  layer: null, glit: null, tex: null, mask: null,
  init() {
    if (this.layer) return;
    const mk = () => {
      const c = document.createElement('canvas');
      c.width = Math.round(CARD_W * HOLO_RES); c.height = Math.round(CARD_H * HOLO_RES);
      return c;
    };
    this.layer = mk(); this.glit = mk();
    this.lg = this.layer.getContext('2d');
    this.gg = this.glit.getContext('2d');
    // glitter texture: lots of tiny specks plus a few 4-point flares (slightly larger than the card for parallax)
    const pad = 24;
    const tw = CARD_W + pad * 2, th = CARD_H + pad * 2;
    const t = document.createElement('canvas');
    t.width = Math.round(tw * HOLO_RES); t.height = Math.round(th * HOLO_RES);
    const g = t.getContext('2d');
    g.scale(HOLO_RES, HOLO_RES);
    let seed = 7;
    const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    for (let i = 0; i < 1100; i++) {
      const x = rnd() * tw, y = rnd() * th, r = 0.35 + rnd() * 0.75;
      g.fillStyle = `hsla(${Math.floor(rnd() * 360)},90%,${78 + rnd() * 18}%,${0.5 + rnd() * 0.5})`;
      g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill();
    }
    for (let i = 0; i < 40; i++) {
      const x = rnd() * tw, y = rnd() * th, r = 2.2 + rnd() * 2.6;
      g.fillStyle = `hsla(${Math.floor(rnd() * 360)},100%,92%,0.95)`;
      g.beginPath();
      g.moveTo(x - r, y); g.quadraticCurveTo(x, y, x, y - r);
      g.quadraticCurveTo(x, y, x + r, y); g.quadraticCurveTo(x, y, x, y + r);
      g.quadraticCurveTo(x, y, x - r, y);
      g.fill();
    }
    this.tex = t; this.pad = pad;
  },
  addRR(g, x, y, w, h, r) {
    g.moveTo(x + r, y);
    g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r);
    g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
  },
  clipMask(g) {
    g.beginPath();
    g.rect(18, 52, 204, 146);                    // art window
    this.addRR(g, 0, 0, CARD_W, CARD_H, 14);     // outer card edge
    this.addRR(g, 8, 8, CARD_W - 16, CARD_H - 16, 8); // minus inner panel = gold frame ring
    g.clip('evenodd');
  }
};

// foil palette from pokemon-cards-css (violet, blue, green, yellow, red), repeated
const RAINBOW = ['#c929f1', '#0dbde9', '#21e985', '#eedf10', '#f80e7b'];

function drawHolo(ctx, card, time) {
  Holo.init();
  const px = clamp(card.shx || 0, -1, 1), py = clamp(card.shy || 0, -1, 1);
  const lx = CARD_W / 2 + px * CARD_W * 0.42, ly = CARD_H * 0.38 + py * CARD_H * 0.3; // light position on the card
  const amt = 0.45 + (card.tilt || 0) * 0.55;    // a little stronger while hovered
  const lg = Holo.lg, gg = Holo.gg;

  // ---- rainbow foil layer
  lg.setTransform(HOLO_RES, 0, 0, HOLO_RES, 0, 0);
  lg.globalCompositeOperation = 'source-over';
  lg.globalAlpha = 1;
  lg.clearRect(0, 0, CARD_W, CARD_H);
  lg.save();
  Holo.clipMask(lg);
  const dx = 0.94, dy = 0.34;                    // CSS 110deg gradient direction, like the real foil
  const shift = (px * 0.5 + py * 0.2) * 360 + time * 5;
  const L = 420;
  const grad = lg.createLinearGradient(CARD_W / 2 - dx * L + dx * shift, CARD_H / 2 - dy * L + dy * shift,
    CARD_W / 2 + dx * L + dx * shift, CARD_H / 2 + dy * L + dy * shift);
  const reps = 2;
  for (let r = 0; r < reps; r++) {
    RAINBOW.forEach((c, i) => grad.addColorStop((r * RAINBOW.length + i) / (reps * RAINBOW.length), c));
  }
  grad.addColorStop(1, RAINBOW[0]);
  lg.fillStyle = grad;
  lg.fillRect(0, 0, CARD_W, CARD_H);
  // fine diagonal "foil lines" that catch the light
  lg.globalCompositeOperation = 'overlay';
  lg.globalAlpha = 0.45;
  lg.strokeStyle = '#fff';
  lg.lineWidth = 1;
  for (let i = -CARD_H; i < CARD_W + CARD_H; i += 5) {
    lg.beginPath(); lg.moveTo(i, 0); lg.lineTo(i - CARD_H * 0.55, CARD_H); lg.stroke();
  }
  // soft glare at the light position (inside the mask only)
  lg.globalCompositeOperation = 'source-over';
  lg.globalAlpha = 1;
  const gl = lg.createRadialGradient(lx, ly, 0, lx, ly, 150);
  gl.addColorStop(0, 'rgba(255,255,255,0.55)');
  gl.addColorStop(1, 'rgba(255,255,255,0)');
  lg.fillStyle = gl;
  lg.fillRect(0, 0, CARD_W, CARD_H);
  lg.restore();

  // ---- glitter: bright specks that only show near the light
  gg.setTransform(HOLO_RES, 0, 0, HOLO_RES, 0, 0);
  gg.globalCompositeOperation = 'source-over';
  gg.globalAlpha = 1;
  gg.clearRect(0, 0, CARD_W, CARD_H);
  gg.save();
  Holo.clipMask(gg);
  gg.drawImage(Holo.tex, -Holo.pad + px * 9, -Holo.pad + py * 9, CARD_W + Holo.pad * 2, CARD_H + Holo.pad * 2);
  gg.globalCompositeOperation = 'destination-in';
  const gm = gg.createRadialGradient(lx, ly, 0, lx, ly, 170);
  gm.addColorStop(0, 'rgba(0,0,0,1)');
  gm.addColorStop(1, 'rgba(0,0,0,0.12)');
  gg.fillStyle = gm;
  gg.fillRect(0, 0, CARD_W, CARD_H);
  gg.restore();

  // ---- composite onto the card with blend modes (no additive white = no flash)
  ctx.save();
  const x = -CARD_W / 2, y = -CARD_H / 2;
  ctx.globalCompositeOperation = 'soft-light';
  ctx.globalAlpha = 0.72 * amt;
  ctx.drawImage(Holo.layer, x, y, CARD_W, CARD_H);
  ctx.globalCompositeOperation = 'overlay';
  ctx.globalAlpha = 0.3 * amt;
  ctx.drawImage(Holo.layer, x, y, CARD_W, CARD_H);
  ctx.globalCompositeOperation = 'color-dodge';
  ctx.globalAlpha = 0.05 * amt;
  ctx.drawImage(Holo.layer, x, y, CARD_W, CARD_H);
  ctx.globalCompositeOperation = 'screen';
  ctx.globalAlpha = 0.5;
  ctx.drawImage(Holo.glit, x, y, CARD_W, CARD_H);
  ctx.restore();
}
