// ============================================================
//  Loading, Title and Menu scenes
// ============================================================
'use strict';

const Settings = {
  load() {
    try {
      const s = JSON.parse(localStorage.getItem('pokesoccer') || '{}');
      if (s.mode && MODES[s.mode]) Game.mode = s.mode;
      if (s.muted) Sound.setMuted(true);
    } catch (e) {}
  },
  save() {
    try { localStorage.setItem('pokesoccer', JSON.stringify({ mode: Game.mode, muted: Sound.muted })); } catch (e) {}
  }
};

const Game = { mode: 'classic' };

function toggleFullscreen() {
  try {
    if (document.fullscreenElement) document.exitFullscreen();
    else document.documentElement.requestFullscreen();
  } catch (e) {}
}

function toggleMute() {
  Sound.setMuted(!Sound.muted);
  Settings.save();
}

// Shared corner buttons (sound + fullscreen)
function cornerButtons() {
  return [
    new Button({ x: 1160, y: 46, w: 58, circle: true, color: '#3a4f8f', icon: Icons.sound, onClick: toggleMute }),
    new Button({ x: 1228, y: 46, w: 58, circle: true, color: '#3a4f8f', icon: Icons.fullscreen, onClick: toggleFullscreen })
  ];
}

function drawSparkleMotes(ctx, list, t) {
  for (const m of list) {
    const y = ((m.y - t * m.v) % 760 + 760) % 760 - 20;
    const a = 0.35 + Math.sin(t * m.f + m.p) * 0.3;
    Glow.draw(ctx, m.c, m.x + Math.sin(t * 0.7 + m.p) * 14, y, m.r, a);
  }
}
function makeMotes(n) {
  return Array.from({ length: n }, () => ({
    x: rand(0, W), y: rand(0, 760), v: rand(10, 35), r: rand(6, 16), f: rand(1, 3), p: rand(0, TAU),
    c: pick(['#ffe680', '#ffffff', '#9fd4ff'])
  }));
}

// ======================= LOADING =======================
const LoadingScene = {
  enter() {
    this.progress = 0;
    this.done = false;
    const list = Object.values(ASSETS);
    let n = 0;
    const loads = list.map(src => Images.load(src).then(() => { n++; this.progress = n / (list.length + 1); }));
    const fonts = Promise.race([
      Promise.all([
        document.fonts ? document.fonts.load(`40px "Luckiest Guy"`) : null,
        document.fonts ? document.fonts.load(`700 40px "Fredoka"`) : null,
        document.fonts ? document.fonts.load(`600 40px "Fredoka"`) : null,
        document.fonts ? document.fonts.load(`500 40px "Fredoka"`) : null
      ]),
      new Promise(r => setTimeout(r, 3000))
    ]).catch(() => {}).then(() => { n++; this.progress = n / (list.length + 1); });
    Promise.all([...loads, fonts]).then(() => {
      this.done = true;
      Engine.go(TitleScene);
    });
    // warm up a couple of keepers for the title
    TitleScene.keeperFiles = shuffle(POKEMON_FILES).slice(0, 3);
    TitleScene.keeperFiles.forEach(f => Keepers.get(f));
  },
  draw(ctx) {
    const v = Engine.view();
    const g = ctx.createLinearGradient(0, v.y, 0, v.y + v.h);
    g.addColorStop(0, '#12235e'); g.addColorStop(1, '#050b1e');
    ctx.fillStyle = g;
    ctx.fillRect(v.x, v.y, v.w, v.h);
    const ball = Images.get(ASSETS.ball);
    const t = Engine.realTime;
    const by = 300 - Math.abs(Math.sin(t * 4)) * 80;
    if (ball) {
      ctx.save();
      ctx.translate(640, by);
      ctx.rotate(t * 5);
      ctx.drawImage(ball, -50, -50, 100, 100);
      ctx.restore();
    }
    txt(ctx, 'LOADING', 640, 430, { size: 48, fill: '#ffcb05', stroke: '#1d3f96' });
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    rr(ctx, 440, 480, 400, 22, 11); ctx.fill();
    ctx.fillStyle = '#ffcb05';
    rr(ctx, 440, 480, Math.max(22, 400 * this.progress), 22, 11); ctx.fill();
  }
};

// ======================= TITLE =======================
const TitleScene = {
  keeperFiles: [],
  enter() {
    Stadium.resetCam();
    this.t = 0;
    this.logo = { s: 0, y: -200 };
    Tween.to(this.logo, { y: 0 }, 0.9, { ease: Ease.outBounce, delay: 0.15 });
    Tween.to(this.logo, { s: 1 }, 0.6, { ease: Ease.outBack, delay: 0.15 });
    this.soccer = new BigTitle('SOCCER', { size: 150, y: 318, colors: ['#ffffff', '#d6ecff', '#6fb6ff'], outline: '#0b2a6b' });
    this.soccer.t = -0.6;
    const files = this.keeperFiles.length ? this.keeperFiles : shuffle(POKEMON_FILES).slice(0, 3);
    this.peeks = [
      { entry: Keepers.get(files[0]), x: 150, y: 900, t: 0, alpha: 1, size: 1.25, groundY: 760 },
      { entry: Keepers.get(files[1]), x: 1130, y: 900, t: 0.5, alpha: 1, size: 1.25, groundY: 760 }
    ];
    this.goalie = { entry: Keepers.get(files[2] || files[0]), x: 640, y: GOAL.bottom - 4, groundY: GOAL.bottom - 4, t: 0, alpha: 1, size: 0.9 };
    this.peeks.forEach((p, i) => Tween.to(p, { y: 735 }, 0.7, { ease: Ease.outBack, delay: 0.6 + i * 0.15 }));
    this.play = new Button({
      x: 640, y: 540, w: 330, h: 104, label: 'PLAY!', size: 58, color: '#ffcb05', textColor: '#fff',
      appear: 0, pulse: true, onClick: () => this.start()
    });
    Tween.to(this.play, { appear: 1 }, 0.5, { ease: Ease.outBack, delay: 1.1 });
    this.buttons = [this.play, ...cornerButtons()];
    this.motes = makeMotes(26);
  },
  start() {
    if (this.leaving) return;
    this.leaving = true;
    Sound.unlock();
    Sound.whistle();
    FX.sparkleBurst(640, 540, 22);
    Engine.go(MenuScene, null, 640, 540);
  },
  exit() { this.leaving = false; },
  isHot(x, y) { return this.buttons.some(b => b.hit(x, y)); },
  onDown(x, y) {
    for (const b of this.buttons) if (b.hit(x, y)) { b.press(); return; }
    this.start();
  },
  onKey(e) {
    if (e.key === 'Enter' || e.key === ' ') this.start();
    if (e.key === 'f' || e.key === 'F') toggleFullscreen();
    if (e.key === 'm' || e.key === 'M') toggleMute();
  },
  update(dt) {
    this.t += dt;
    this.soccer.update(dt);
    this.buttons.forEach(b => { b.hover = b.hit(Engine.pointer.x, Engine.pointer.y); b.update(dt, this.t); });
    this.peeks.forEach(p => { p.t += dt; });
    this.goalie.t += dt;
    this.goalie.x = 640 + Math.sin(this.t * 1.3) * 60;
    Stadium.cam.zoom = 1.06 + Math.sin(this.t * 0.25) * 0.03;
    Stadium.cam.x = 640 + Math.sin(this.t * 0.18) * 20;
  },
  draw(ctx) {
    const t = this.t;
    ctx.save();
    Stadium.applyCam(ctx);
    Stadium.drawBackground(ctx);
    Stadium.drawGoal(ctx);
    Stadium.drawKeeper(ctx, this.goalie);
    ctx.restore();

    const v = Engine.view();
    const vg = ctx.createRadialGradient(640, 330, 150, 640, 360, 820);
    vg.addColorStop(0, 'rgba(5,10,40,0.25)');
    vg.addColorStop(1, 'rgba(5,10,40,0.8)');
    ctx.fillStyle = vg;
    ctx.fillRect(v.x, v.y, v.w, v.h);
    drawSparkleMotes(ctx, this.motes, t);

    // Logo
    const L = this.logo;
    ctx.save();
    ctx.translate(640, 210 + L.y);
    ctx.scale(L.s, L.s);
    drawSunburst(ctx, 0, 20, 420, 0.35, t);
    const ball = Images.get(ASSETS.ball);
    if (ball) {
      const bob = Math.sin(t * 2.4) * 8;
      Glow.draw(ctx, '#ffe680', 0, -30 + bob, 150, 0.5);
      ctx.save();
      ctx.translate(0, -30 + bob);
      ctx.rotate(t * 0.8);
      ctx.drawImage(ball, -95, -95, 190, 190);
      ctx.restore();
    }
    ctx.rotate(-0.04);
    txt(ctx, 'POKÉMON', 0, -10, { size: 118, fill: { grad: ['#fff27a', '#ffcb05', '#f0a400'] }, stroke: '#2a5db0', lw: 22, shadow: 'rgba(10,20,60,0.7)', shadowDist: 10 });
    txt(ctx, 'POKÉMON', 0, -10, { size: 118, fill: { grad: ['#fff27a', '#ffcb05', '#f0a400'] }, stroke: '#1d3f96', lw: 10, shadow: false });
    ctx.restore();
    this.soccer.draw(ctx);

    if (this.soccer.t > 0.6) {
      const a = clamp((this.soccer.t - 0.6) / 0.4, 0, 1);
      ctx.save();
      ctx.globalAlpha = a;
      drawRibbon(ctx, 640, 425, 470, 54, '#e3262f', 'Say it!  Kick it!  Score it!', { size: 30 });
      ctx.restore();
    }

    this.peeks.forEach((p, i) => {
      p.rot = Math.sin(p.t * 2 + i) * 0.06;
      Stadium.drawKeeper(ctx, p);
    });
    this.buttons.forEach(b => b.draw(ctx));
    Particles.draw(ctx, 'ui');
    txt(ctx, 'Press SPACE or tap to start', 640, 622, { size: 20, font: FONT_ROUND, fill: 'rgba(255,255,255,0.75)', shadow: 'rgba(0,0,0,0.5)' });
  }
};

// ======================= MENU =======================
const MenuScene = {
  enter() {
    Stadium.resetCam();
    this.t = 0;
    this.header = { a: 0 };
    Tween.to(this.header, { a: 1 }, 0.5, { ease: Ease.outBack });
    this.motes = makeMotes(18);

    const keys = Object.keys(CATEGORIES);
    this.tiles = keys.map((key, i) => {
      const cat = CATEGORIES[key];
      const row = Math.floor(i / 5), col = i % 5;
      const inRow = row < 2 ? 5 : keys.length - 10;
      const x = 640 + (col - (inRow - 1) / 2) * 232;
      const y = 300 + row * 150;
      const preview = itemPath(cat, cat.items[0]);
      Images.load(preview);
      const tile = { key, cat, x, y, w: 212, h: 132, preview, appear: 0, spring: new Spring(1, 380, 16), hover: false, wob: rand(0, TAU) };
      Tween.to(tile, { appear: 1 }, 0.45, { ease: Ease.outBack, delay: 0.1 + i * 0.035 });
      return tile;
    });

    this.modeKeys = Object.keys(MODES);
    this.modeBtns = this.modeKeys.map((m, i) => {
      const b = { key: m, x: 640 + (i - 1) * 330, y: 140, w: 300, h: 76, spring: new Spring(1, 400, 18), hover: false, sel: 0 };
      b.sel = Game.mode === m ? 1 : 0;
      return b;
    });

    this.back = new Button({ x: 50, y: 46, w: 64, circle: true, color: '#2a75bb', icon: Icons.back, onClick: () => Engine.go(TitleScene, null, 50, 46) });
    this.buttons = [this.back, ...cornerButtons()];
  },

  tileAt(x, y) {
    return this.tiles.find(t => t.appear > 0.5 && Math.abs(x - t.x) < t.w / 2 && Math.abs(y - t.y) < t.h / 2);
  },
  modeAt(x, y) {
    return this.modeBtns.find(b => Math.abs(x - b.x) < b.w / 2 && Math.abs(y - b.y) < b.h / 2);
  },
  isHot(x, y) { return !!(this.tileAt(x, y) || this.modeAt(x, y) || this.buttons.some(b => b.hit(x, y))); },

  setMode(key) {
    if (Game.mode === key) return;
    Game.mode = key;
    Settings.save();
    Sound.blip(5);
    const b = this.modeBtns.find(m => m.key === key);
    b.spring.v = 1.2;
    FX.sparkleBurst(b.x, b.y, 12, [MODES[key].color, '#ffffff']);
  },

  pickTile(tile) {
    if (this.leaving) return;
    this.leaving = true;
    tile.spring.v = 0.8;
    Sound.blip(7);
    Sound.whoosh(0.35);
    FX.sparkleBurst(tile.x, tile.y, 18);
    Engine.go(MatchScene, { category: tile.key, mode: Game.mode }, tile.x, tile.y);
  },
  exit() { this.leaving = false; },

  onDown(x, y) {
    for (const b of this.buttons) if (b.hit(x, y)) { b.press(); return; }
    const m = this.modeAt(x, y);
    if (m) { this.setMode(m.key); return; }
    const tile = this.tileAt(x, y);
    if (tile) this.pickTile(tile);
  },
  onKey(e) {
    if (e.key === 'Escape') Engine.go(TitleScene);
    if (e.key === 'f' || e.key === 'F') toggleFullscreen();
    if (e.key === 'm' || e.key === 'M') toggleMute();
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      const i = this.modeKeys.indexOf(Game.mode);
      const n = (i + (e.key === 'ArrowLeft' ? -1 : 1) + this.modeKeys.length) % this.modeKeys.length;
      this.setMode(this.modeKeys[n]);
    }
  },

  update(dt) {
    this.t += dt;
    const p = Engine.pointer;
    const hot = this.tileAt(p.x, p.y);
    for (const tile of this.tiles) {
      if (tile === hot && !tile.hover) Sound.hover();
      tile.hover = tile === hot;
      tile.spring.target = tile.hover ? 1.08 : 1;
      tile.spring.update(dt);
    }
    const hm = this.modeAt(p.x, p.y);
    for (const b of this.modeBtns) {
      b.hover = b === hm;
      b.spring.target = b.hover ? 1.05 : 1;
      b.spring.update(dt);
      b.sel += ((Game.mode === b.key ? 1 : 0) - b.sel) * Math.min(1, dt * 12);
    }
    this.buttons.forEach(b => { b.hover = b.hit(p.x, p.y); b.update(dt, this.t); });
    Stadium.cam.zoom = 1.08;
    Stadium.cam.x = 640 + Math.sin(this.t * 0.15) * 30;
  },

  draw(ctx) {
    const t = this.t;
    ctx.save();
    Stadium.applyCam(ctx);
    Stadium.drawBackground(ctx, 0.55);
    ctx.restore();
    drawSparkleMotes(ctx, this.motes, t);

    // Mode selector
    const hs = this.header.a;
    ctx.save();
    ctx.globalAlpha = clamp(hs, 0, 1);
    txt(ctx, 'GAME MODE', 640, 82, { size: 24, fill: '#9fc4ff', stroke: '#0a1a4a', lw: 5 });
    for (const b of this.modeBtns) {
      const mode = MODES[b.key];
      const sel = b.sel;
      ctx.save();
      ctx.translate(b.x, b.y - sel * 4);
      ctx.scale(b.spring.v, b.spring.v);
      if (sel > 0.05) Glow.draw(ctx, mode.color, 0, 0, 190, sel * 0.45);
      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      rr(ctx, -b.w / 2, -b.h / 2 + 6, b.w, b.h, 20); ctx.fill();
      const g = ctx.createLinearGradient(0, -b.h / 2, 0, b.h / 2);
      g.addColorStop(0, sel > 0.5 ? shade(mode.color, 0.35) : '#3a4f8f');
      g.addColorStop(1, sel > 0.5 ? mode.color : '#1e2d63');
      ctx.fillStyle = g;
      rr(ctx, -b.w / 2, -b.h / 2, b.w, b.h, 20); ctx.fill();
      ctx.lineWidth = 4;
      ctx.strokeStyle = sel > 0.5 ? '#fff' : 'rgba(255,255,255,0.25)';
      rr(ctx, -b.w / 2, -b.h / 2, b.w, b.h, 20); ctx.stroke();
      this.drawModeIcon(ctx, b.key, -b.w / 2 + 44, 0, sel > 0.5);
      txt(ctx, mode.label.toUpperCase(), 22, 2, {
        size: 32, fill: '#fff', stroke: sel > 0.5 ? shade(mode.color, -0.55) : '#0a1a4a', maxW: 200, lw: 6
      });
      ctx.restore();
    }
    txt(ctx, MODES[Game.mode].blurb, 640, 206, { size: 23, font: FONT_ROUND, fill: '#fff', shadow: 'rgba(0,0,0,0.6)' });
    ctx.restore();

    // Topic tiles
    for (const tile of this.tiles) this.drawTile(ctx, tile, t);

    this.buttons.forEach(b => b.draw(ctx));
    Particles.draw(ctx, 'ui');
    txt(ctx, 'Keys:  1 2 3 pick  ·  SPACE kick / next  ·  ESC back  ·  M mute  ·  F fullscreen', 640, 706, {
      size: 15, font: FONT_ROUND, weight: '600', fill: 'rgba(255,255,255,0.55)', shadow: false
    });
  },

  drawModeIcon(ctx, key, x, y, on) {
    const ball = Images.get(ASSETS.ball);
    ctx.save();
    ctx.translate(x, y);
    if (key === 'classic') {
      if (ball) ctx.drawImage(ball, -24, -24, 48, 48);
    } else if (key === 'vote') {
      [-14, 0, 14].forEach((dx, i) => {
        ctx.fillStyle = ['#ffcb05', '#ff6b6b', '#6bc5ff'][i];
        ctx.strokeStyle = '#0a1a4a';
        ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(dx, -8 + (i === 1 ? -6 : 0), 9, 0, TAU); ctx.fill(); ctx.stroke();
        rr(ctx, dx - 9, 4 + (i === 1 ? -6 : 0), 18, 16, 6); ctx.fill(); ctx.stroke();
      });
    } else {
      ctx.fillStyle = '#ff4d4d'; ctx.strokeStyle = '#fff'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(-9, 0, 15, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#3b8cff';
      ctx.beginPath(); ctx.arc(11, 0, 15, 0, TAU); ctx.fill(); ctx.stroke();
    }
    ctx.restore();
  },

  drawTile(ctx, tile, t) {
    if (tile.appear <= 0.01) return;
    const img = Images.get(tile.preview);
    const s = tile.spring.v * tile.appear;
    const accent = tile.cat.accent;
    ctx.save();
    ctx.translate(tile.x, tile.y);
    ctx.rotate(tile.hover ? Math.sin(t * 10) * 0.025 : 0);
    ctx.scale(s, s);
    const w = tile.w, h = tile.h;
    if (tile.hover) Glow.draw(ctx, accent, 0, 0, 170, 0.5);
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    rr(ctx, -w / 2, -h / 2 + 8, w, h, 22); ctx.fill();
    ctx.fillStyle = shade(accent, -0.5);
    rr(ctx, -w / 2, -h / 2 + 4, w, h, 22); ctx.fill();
    const g = ctx.createLinearGradient(0, -h / 2, 0, h / 2);
    g.addColorStop(0, shade(accent, 0.45));
    g.addColorStop(0.5, accent);
    g.addColorStop(1, shade(accent, -0.25));
    ctx.fillStyle = g;
    rr(ctx, -w / 2, -h / 2, w, h, 22); ctx.fill();
    // rays
    ctx.save();
    rr(ctx, -w / 2, -h / 2, w, h, 22); ctx.clip();
    ctx.globalAlpha = 0.18;
    ctx.fillStyle = '#fff';
    ctx.rotate(t * 0.3 + tile.wob);
    for (let i = 0; i < 10; i++) {
      ctx.rotate(TAU / 10);
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(200, -20); ctx.lineTo(200, 20); ctx.closePath(); ctx.fill();
    }
    ctx.restore();
    ctx.lineWidth = 4;
    ctx.strokeStyle = 'rgba(255,255,255,0.9)';
    rr(ctx, -w / 2 + 2, -h / 2 + 2, w - 4, h - 4, 20); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.28)';
    rr(ctx, -w / 2 + 10, -h / 2 + 8, w - 20, h * 0.28, 14); ctx.fill();
    if (img) {
      const iw = img.naturalWidth, ih = img.naturalHeight;
      const k = Math.min(120 / iw, 78 / ih);
      const bob = tile.hover ? Math.sin(t * 8) * 4 : 0;
      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,0.35)';
      ctx.shadowBlur = 8;
      ctx.shadowOffsetY = 4;
      if (tile.cat.photo) {
        ctx.beginPath(); rr(ctx, -52, -54 + bob, 104, 74, 10); ctx.clip();
        const kk = Math.max(104 / iw, 74 / ih);
        ctx.drawImage(img, -iw * kk / 2, -17 + bob - ih * kk / 2, iw * kk, ih * kk);
      } else {
        ctx.drawImage(img, -iw * k / 2, -18 + bob - ih * k / 2, iw * k, ih * k);
      }
      ctx.restore();
    }
    txt(ctx, tile.cat.label, 0, h / 2 - 24, {
      size: 27, font: FONT_ROUND, fill: '#fff', stroke: shade(accent, -0.6), lw: 6, maxW: w - 24
    });
    ctx.restore();
  }
};
