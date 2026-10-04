// ============================================================
//  Match scene: deal cards → student speaks → kick → celebrate
//  Modes: classic, vote (class vote), teams (red vs blue)
// ============================================================
'use strict';

const CARD_HOME = [0, 1, 2].map(i => ({ x: 640 + (i - 1) * 300, y: 556 + (i === 1 ? 0 : 8), rot: (i - 1) * 0.06 }));
const CARD_SCALE = 0.9;
const HUD_POS = { x: 640, y: 44 };
const TEAM_KICKS = 5;
const TEAM_COLORS = { red: '#ff4d4d', blue: '#3b8cff' };

const MatchScene = {
  enter(data) {
    this.catKey = data.category;
    this.cat = CATEGORIES[this.catKey];
    this.mode = data.mode || 'classic';
    this.spooky = this.catKey === 'halloween';
    this.leaving = false;
    this.t = 0;
    this.round = 0;
    this.roundId = 0;
    this.phase = 'intro';
    this.cards = [];
    this.targets = [];
    this.trail = [];
    this.flyers = [];
    this.tokens = null;
    this.title = null;
    this.subRibbon = null;
    this.phrase = null;
    this.banner = null;
    this.final = null;
    this.flight = null;
    this.phys = null;
    this.speed = { a: 0 };
    this.dim = { a: 0 };
    this.sun = { a: 0, x: 640, y: 300 };
    this.prompt = { a: 0 };
    this.hint = { a: 0 };
    this.stats = { goals: 0, shots: 0, streak: 0, best: 0, history: [], classTotal: 0 };
    this.teams = { red: [], blue: [], turn: 0 };
    this.hud = { shown: 0, bump: new Spring(1, 500, 18), red: 0, blue: 0 };
    this.lastKeeper = null;
    this.keeper = null;
    this.ball = null;
    Stadium.resetCam();
    Stadium.setTheme(this.spooky ? 'halloween' : null);
    Stadium.net.impact = null;

    this.backBtn = new Button({ x: 50, y: 46, w: 64, circle: true, color: '#2a75bb', icon: Icons.back, onClick: () => this.leave() });
    this.nextBtn = new Button({ x: 760, y: 636, w: 320, h: 96, label: 'NEXT  ▶', size: 46, color: '#35c759', textColor: '#fff', visible: false, appear: 0, pulse: true, onClick: () => this.next() });
    this.topicsBtn = new Button({ x: 440, y: 636, w: 230, h: 78, label: 'TOPICS', size: 32, color: '#2a75bb', textColor: '#fff', visible: false, appear: 0, onClick: () => this.leave() });
    this.kickBtn = new Button({ x: 1170, y: 560, w: 160, circle: true, label: 'KICK!', size: 40, color: '#ff4d4d', textColor: '#fff', visible: false, appear: 0, pulse: true, onClick: () => this.startVoteKick() });
    this.resetBtn = new Button({ x: 105, y: 610, w: 150, h: 62, label: 'RESET', size: 26, color: '#7d8fa0', textColor: '#fff', visible: false, appear: 0, onClick: () => this.resetVotes() });
    this.againBtn = new Button({ x: 760, y: 636, w: 340, h: 96, label: 'PLAY AGAIN', size: 42, color: '#35c759', textColor: '#fff', visible: false, appear: 0, pulse: true, onClick: () => this.restartTeams() });
    this.buttons = [this.backBtn, ...cornerButtons(), this.nextBtn, this.topicsBtn, this.kickBtn, this.resetBtn, this.againBtn];

    this.deck = shuffle(this.cat.items);
    this.startRound();
  },

  exit() { this.roundId++; Stadium.setTheme(null); },

  leave() {
    if (this.leaving) return;
    this.leaving = true;
    Engine.go(MenuScene, null, 50, 46);
    Timers.after(1, () => { this.leaving = false; });
  },

  show(btn) {
    btn.visible = true;
    Tween.kill(btn);
    Tween.to(btn, { appear: 1 }, 0.4, { ease: Ease.outBack });
  },
  hide(btn) {
    Tween.kill(btn);
    Tween.to(btn, { appear: 0 }, 0.15, { onDone: () => { btn.visible = false; } });
  },

  currentTeam() { return this.teams.turn % 2 === 0 ? 'red' : 'blue'; },

  // Draw 3 items, cycling through the whole topic before repeating
  drawItems() {
    const out = [];
    while (out.length < 3) {
      if (!this.deck.length) this.deck = shuffle(this.cat.items);
      const it = this.deck.pop();
      if (!out.includes(it)) out.push(it);
      if (this.cat.items.length < 3 && out.length === this.cat.items.length) break;
    }
    return out;
  },

  // ---------------------------------------------------------------- round flow
  startRound() {
    const id = ++this.roundId;
    this.round++;
    this.phase = 'intro';
    this.queuedKick = false;
    this.golden = this.mode === 'classic' && this.round > 1 && Math.random() < 0.14;
    this.title = null;
    this.subRibbon = null;
    this.tokens = null;
    this.phrase = null;
    this.targets = [];
    this.trail = [];
    this.flight = null;
    this.phys = null;
    this.chosen = -1;
    Stadium.net.impact = null;
    Engine.timeScale = 1;
    Tween.to(Stadium.cam, { x: 640, y: 360, zoom: 1 }, 0.6, { ease: Ease.inOutQuad });
    [this.nextBtn, this.topicsBtn, this.kickBtn, this.resetBtn, this.againBtn].forEach(b => { if (b.visible) this.hide(b); });

    // choose items + outcomes
    const items = this.drawItems();
    const outcomes = shuffle(['goal', 'goal', 'save']);
    const loads = Promise.all(items.map(it => Images.load(itemPath(this.cat, it))));

    // keeper drops in
    let file;
    do { file = pick(POKEMON_FILES); } while (file === this.lastKeeper && POKEMON_FILES.length > 1);
    this.lastKeeper = file;
    const entry = Keepers.get(file);
    const ground = GOAL.bottom - 4;
    const oldKeeper = this.keeper;
    if (oldKeeper) {
      Tween.kill(oldKeeper);
      Tween.to(oldKeeper, { alpha: 0, sy: 0.2, sx: 1.4 }, 0.2);
    }
    const keeper = {
      entry, x: 640, y: -260, groundY: ground, rot: 0, sx: 1, sy: 1, t: 0, flash: 0, alpha: 1, dizzy: 0,
      face: 1, idle: false, homeX: 640
    };
    Timers.after(oldKeeper ? 0.2 : 0, () => {
      if (id !== this.roundId) return;
      this.keeper = keeper;
      Tween.to(keeper, { y: ground }, 0.55, {
        ease: Ease.inQuad,
        onDone: () => {
          Sound.thud();
          Engine.addShake(0.25);
          FX.dust(keeper.x, ground, 14);
          keeper.sy = 0.7; keeper.sx = 1.25;
          Tween.to(keeper, { sy: 1, sx: 1 }, 0.5, { ease: Ease.outElastic });
          keeper.idle = true;
        }
      });
    });

    // ball waits off-screen
    this.ball = { x: 640, y: 820, s: 1, rot: 0, alpha: 0, golden: this.golden, squashX: 1, squashY: 1, groundY: 866 };

    // intro banner
    Sound.whistle();
    if (this.spooky) Timers.after(0.45, () => Sound.spooky());
    if (this.mode === 'teams') {
      const team = this.currentTeam();
      const n = this.teams[team].length + 1;
      this.showBanner(`${team.toUpperCase()} TEAM`, n > TEAM_KICKS ? 'Sudden death!' : `Kick ${n} of ${TEAM_KICKS}`, TEAM_COLORS[team]);
    } else if (this.golden) {
      this.showBanner('GOLDEN BALL!', 'Worth 2 goals!', '#ffb700');
      Sound.sparkle();
    } else {
      this.showBanner(`ROUND ${this.round}`, this.mode === 'vote' ? 'Class vote!' : pick(this.spooky ? HALLOWEEN_ROUND_LINES : ['Get ready!', 'Say it loud!', 'You can do it!']), this.spooky ? '#7a3fc4' : '#2a75bb');
    }

    // old cards leave, new cards are dealt once images are ready
    this.cards.forEach(c => Tween.to(c, { y: 900, alpha: 0 }, 0.3, { ease: Ease.inBack }));
    const minWait = new Promise(r => Timers.after(0.95, r));
    Promise.all([loads, minWait]).then(([imgs]) => {
      if (id !== this.roundId || Engine.scene !== this) return;
      this.dealCards(items, imgs, outcomes);
    });
  },

  showBanner(text, sub, color) {
    const b = { text, sub, color, x: -W, a: 1 };
    this.banner = b;
    Tween.to(b, { x: 0 }, 0.35, { ease: Ease.outCubic });
    Tween.to(b, { x: W }, 0.3, { ease: Ease.inCubic, delay: 1.35, onDone: () => { if (this.banner === b) this.banner = null; } });
    Sound.whoosh(0.3);
  },

  dealCards(items, imgs, outcomes) {
    this.cards = items.map((item, i) => {
      const home = CARD_HOME[i];
      const card = {
        i, item, outcome: outcomes[i], img: imgs[i],
        face: renderCardFace({ cat: this.cat, item, img: imgs[i], dir: i }),
        x: 640, y: 900, rot: rand(-0.6, 0.6), scale: 0.7, flip: 0, alpha: 1, glow: 0, seed: Math.random() * 5,
        lift: new Spring(0, 300, 20), pop: new Spring(1, 500, 14), badge: new Spring(1, 500, 12),
        votes: 0, hover: false, bobAmp: 1, drawY: 900
      };
      Tween.to(card, { x: home.x, y: home.y, rot: home.rot, scale: CARD_SCALE }, 0.55, {
        ease: Ease.outBack, delay: i * 0.14, onStart: () => Sound.flip()
      });
      Tween.to(card, { flip: 1 }, 0.32, {
        ease: Ease.inOutQuad, delay: i * 0.14 + 0.38,
        onDone: () => {
          Sound.flip();
          FX.sparkleBurst(home.x, home.y - 60, 8, ['#ffffff', '#ffe680'], 'ui', 0.6);
        }
      });
      return card;
    });
    Timers.after(0.7, () => {
      this.phase = this.mode === 'vote' ? 'vote' : 'choose';
      Tween.to(this.prompt, { a: 1 }, 0.4, { ease: Ease.outBack });
      if (this.mode === 'vote') this.show(this.resetBtn);
    });
  },

  // ---------------------------------------------------------------- classic / teams: choose a card
  chooseCard(i) {
    if (this.phase !== 'choose') return;
    const card = this.cards[i];
    if (!card) return;
    this.phase = 'reveal';
    this.skipRequested = false;
    this.chosen = i;
    card.hover = false;
    Sound.chime();
    Sound.blip(7);
    Engine.hitstop = 0.05;
    Engine.doFlash(0.18);
    FX.sparkleBurst(card.x, card.drawY, 22);
    FX.ring(card.x, card.drawY, '#fff', 40, 220, 0.5);
    Tween.to(this.prompt, { a: 0 }, 0.2);
    Tween.to(this.dim, { a: 0.55 }, 0.3);
    Tween.to(this.sun, { a: 1 }, 0.4);
    Tween.to(card, { x: 640, y: 300, rot: 0, scale: 1.25, glow: 1 }, 0.5, { ease: Ease.outBack });
    this.cards.forEach((c, j) => {
      if (j === i) return;
      Tween.to(c, { y: 920, rot: (j < i ? -0.6 : 0.6), alpha: 0 }, 0.45, { ease: Ease.inBack });
    });

    // "I like apples!" pops in word by word
    const words = itemSentence(this.cat, card.item).split(' ');
    this.phrase = { words: words.map((w, k) => ({ w, t0: 0.3 + k * 0.16 })), t: 0, a: 1 };
    words.forEach((w, k) => Timers.after(0.3 + k * 0.16, () => Sound.blip(3 + k * 2)));

    this.revealTimer = Timers.after(2.0, () => this.cardToTarget());
  },

  // First press shortens the reveal (after a brief minimum), a second press also queues the kick
  skipReveal() {
    if (this.phase !== 'reveal') return;
    if (this.skipRequested) { this.queuedKick = true; return; }
    this.skipRequested = true;
    if (this.revealTimer) this.revealTimer.dead = true;
    const wait = Math.max(0, 0.7 - (this.phrase ? this.phrase.t : 0));
    Timers.after(wait, () => this.cardToTarget());
  },

  cardToTarget() {
    if (this.phase !== 'reveal') return;
    this.phase = 'toTarget';
    const card = this.cards[this.chosen];
    const z = ZONES[this.chosen];
    Tween.to(this.dim, { a: 0 }, 0.4);
    Tween.to(this.sun, { a: 0 }, 0.3);
    Tween.to(this.phrase, { a: 0 }, 0.25);
    Sound.whoosh(0.45);
    Tween.to(card, { x: z.x, y: z.y, scale: 0.16, rot: TAU, glow: 0 }, 0.5, {
      ease: Ease.inCubic,
      onDone: () => {
        card.alpha = 0;
        this.addTarget(this.chosen, card, true);
        this.ballIn();
      }
    });
  },

  addTarget(i, card, main) {
    const z = ZONES[i];
    const tg = { i, x: z.x, y: z.y, img: card.img, votes: card.votes, a: 0, s: 1, hi: 0, main };
    this.targets.push(tg);
    Tween.to(tg, { a: 1 }, 0.35, { ease: Ease.outBack });
    FX.ring(z.x, z.y, '#ffe680', 10, 90, 0.4, 'world');
    Sound.pop();
    return tg;
  },

  ballIn() {
    const b = this.ball;
    b.alpha = 1; b.x = 640; b.y = 800; b.s = 1; b.squashX = 1; b.squashY = 1;
    b.groundY = b.y + BALL_SIZE / 2;
    Tween.to(b, { y: SPOT.y, rot: b.rot + 8 }, 0.55, {
      ease: Ease.outBack,
      onDone: () => {
        if (this.mode !== 'vote') {
          this.phase = 'aim';
          if (this.queuedKick) {
            this.queuedKick = false;
            this.kick(this.chosen, this.cards[this.chosen].outcome);
          } else {
            Tween.to(this.hint, { a: 1 }, 0.3);
          }
        }
      }
    });
  },

  // ---------------------------------------------------------------- vote mode
  totalVotes() { return this.cards.reduce((a, c) => a + c.votes, 0); },

  addVote(i) {
    if (this.phase !== 'vote') return;
    const c = this.cards[i];
    if (!c) return;
    c.votes++;
    c.pop.v = 1.12;
    c.badge.v = 1.8;
    Sound.blip(Math.min(c.votes - 1, 14));
    const b = this.badgePos(c);
    FX.sparkleBurst(b.x, b.y, 8, ['#ffffff', '#ffe680', '#ff9f1c'], 'ui', 0.6);
    FX.floatText('+1', b.x + 30, b.y - 20, '#ffe680', 36);
    if (this.totalVotes() === 1) this.show(this.kickBtn);
  },

  removeVote(i) {
    if (this.phase !== 'vote') return;
    const c = this.cards[i];
    if (!c || c.votes <= 0) return;
    c.votes--;
    c.badge.v = 0.6;
    c.pop.v = 0.95;
    Sound.unblip();
    if (this.totalVotes() === 0) this.hide(this.kickBtn);
  },

  resetVotes() {
    if (this.phase !== 'vote') return;
    this.cards.forEach(c => { if (c.votes) { c.votes = 0; c.badge.v = 0.5; } });
    this.hide(this.kickBtn);
    Sound.unblip();
  },

  badgePos(c) {
    const s = c.scale * c.pop.v;
    const lx = (CARD_W / 2 - 16) * s, ly = (-CARD_H / 2 + 14) * s;
    const cs = Math.cos(c.rot), sn = Math.sin(c.rot);
    return { x: c.x + lx * cs - ly * sn, y: c.drawY + lx * sn + ly * cs };
  },

  startVoteKick() {
    if (this.phase !== 'vote' || this.totalVotes() === 0) return;
    this.phase = 'voteReveal';
    this.hide(this.kickBtn);
    this.hide(this.resetBtn);
    Tween.to(this.prompt, { a: 0 }, 0.2);
    const voted = this.cards.filter(c => c.votes > 0).map(c => c.i);
    this.lucky = pick(voted);
    Sound.whoosh(0.5);
    this.cards.forEach((c, k) => {
      const z = ZONES[c.i];
      Tween.to(c, { x: z.x, y: z.y, scale: 0.16, rot: TAU }, 0.5, {
        ease: Ease.inCubic, delay: k * 0.08,
        onDone: () => { c.alpha = 0; this.addTarget(c.i, c, false); }
      });
    });
    Timers.after(0.8, () => this.ballIn());
    Timers.after(1.5, () => this.roulette(voted));
  },

  roulette(voted) {
    const delays = [];
    let d = 0.07;
    while (d < 0.42) { delays.push(d); d *= 1.13; }
    if (voted.length === 1) delays.length = Math.min(delays.length, 6);
    const n = delays.length;
    const lp = voted.indexOf(this.lucky);
    const start = ((lp - (n - 1)) % voted.length + voted.length) % voted.length;
    let acc = 0;
    Sound.drumroll(delays.reduce((a, b) => a + b, 0) + 0.2);
    delays.forEach((dl, k) => {
      acc += dl;
      Timers.after(acc, () => {
        const zi = voted[(start + k) % voted.length];
        this.targets.forEach(tg => { tg.hi = tg.i === zi ? 1 : 0; });
        const tg = this.targets.find(x => x.i === zi);
        if (tg) tg.s = 1.35;
        if (this.keeper) this.keeper.lookX = ZONES[zi].x;
        Sound.tick(k);
      });
    });
    Timers.after(acc + 0.25, () => {
      const tg = this.targets.find(x => x.i === this.lucky);
      if (tg) { tg.main = true; tg.s = 1.6; FX.sparkleBurst(tg.x, tg.y, 20, undefined, 'world'); }
      Sound.chime();
      this.targets.forEach(x => { if (x !== tg) Tween.to(x, { a: 0.35 }, 0.3); });
    });
    Timers.after(acc + 1.0, () => {
      if (this.keeper) this.keeper.lookX = null;
      this.kick(this.lucky, 'goal');
    });
  },

  // ---------------------------------------------------------------- the kick
  kick(zoneIdx, outcome) {
    if (this.phase === 'windup' || this.phase === 'flight') return;
    this.phase = 'windup';
    Tween.to(this.hint, { a: 0 }, 0.15);
    const b = this.ball;
    Tween.to(b, { squashX: 1.25, squashY: 0.72 }, 0.12, {
      ease: Ease.outQuad,
      onDone: () => this.launch(zoneIdx, outcome)
    });
  },

  launch(zoneIdx, outcome) {
    const b = this.ball;
    this.phase = 'flight';
    b.squashX = 0.8; b.squashY = 1.25;
    Tween.to(b, { squashX: 1, squashY: 1 }, 0.5, { ease: Ease.outElastic });
    Sound.play('kick', { vol: 0.9 });
    Sound.whoosh(0.8);
    Engine.hitstop = 0.07;
    Engine.addShake(0.4);
    Engine.doFlash(0.12);
    FX.dust(SPOT.x, SPOT.y + 40, 16);
    FX.ring(SPOT.x, SPOT.y, '#ffffff', 20, 130, 0.35, 'world', 8);
    Stadium.crowdHype = 0.3;

    const z = ZONES[zoneIdx];
    // keeper: dives the right way for a save, the wrong way for a goal
    let kz = zoneIdx;
    if (outcome === 'goal') kz = pick([0, 1, 2].filter(k => k !== zoneIdx));
    const curve = (zoneIdx === 1 ? pick([-1, 1]) : zoneIdx === 0 ? 1 : -1) * rand(70, 140);
    this.flight = {
      t: 0, dur: 0.8, zone: zoneIdx, kz, outcome, dived: false,
      p0: { x: SPOT.x, y: SPOT.y }, p1: { x: z.x, y: z.y },
      c: { x: (SPOT.x + z.x) / 2 + curve, y: Math.min(SPOT.y, z.y) - 110 },
      spin: pick([-1, 1]) * rand(14, 22)
    };
    this.trail = [];
  },

  keeperDive(kz, save) {
    const k = this.keeper;
    if (!k) return;
    k.idle = false;
    Tween.kill(k);
    const z = ZONES[kz];
    const h = k.drawH || KEEPER_H;
    Sound.whoosh(0.25);
    if (kz === 1) {
      Tween.to(k, { x: z.x, y: z.y + h * 0.55, rot: 0, sx: 0.9, sy: 1.12 }, 0.32, { ease: Ease.outCubic });
    } else {
      const dir = kz === 0 ? -1 : 1;
      Tween.to(k, { x: z.x - dir * (save ? 20 : 0), y: z.y + h * 0.5, rot: dir * 1.2, sx: 1.08, sy: 0.95 }, 0.32, { ease: Ease.outCubic });
    }
  },

  updateFlight(dt) {
    const f = this.flight;
    if (!f) return;
    f.t += dt;
    const p = Math.min(1, f.t / f.dur);
    const e = p * 0.75 + Ease.outQuad(p) * 0.25;
    const u = 1 - e;
    const b = this.ball;
    b.x = u * u * f.p0.x + 2 * u * e * f.c.x + e * e * f.p1.x;
    b.y = u * u * f.p0.y + 2 * u * e * f.c.y + e * e * f.p1.y;
    b.s = lerp(1, 0.4, Ease.outQuad(p));
    b.rot += f.spin * dt;
    b.groundY = lerp(SPOT.y + BALL_SIZE / 2, GOAL.bottom, Ease.outQuad(p));
    this.trail.push({ x: b.x, y: b.y, s: b.s });
    if (this.trail.length > 14) this.trail.shift();

    // slow-motion right before the goal line
    Engine.timeScale = p > 0.55 && p < 0.97 ? 0.33 : 1;
    // camera follows
    const cz = Ease.inOutQuad(Math.min(1, p * 1.2));
    Stadium.cam.zoom = lerp(1, 1.42, cz);
    Stadium.cam.x = lerp(640, 640 + (f.p1.x - 640) * 0.55, cz);
    Stadium.cam.y = lerp(360, f.p1.y + 70, cz);
    this.speed.a = Math.sin(Math.PI * Math.min(1, p * 1.1)) * 0.6;

    if (!f.dived && p >= 0.32) { f.dived = true; this.keeperDive(f.kz, f.outcome === 'save'); }
    if (p >= 1) {
      this.flight = null;
      Engine.timeScale = 1;
      this.speed.a = 0;
      if (f.outcome === 'goal') this.onGoal(f); else this.onSave(f);
    }
  },

  // ---------------------------------------------------------------- outcomes
  onGoal(f) {
    this.phase = 'result';
    const z = ZONES[f.zone];
    const b = this.ball;
    const golden = this.golden;
    Engine.hitstop = 0.16;
    Engine.addShake(golden ? 1 : 0.85);
    Engine.doFlash(0.6, golden ? '#fff3b0' : '#ffffff');
    Stadium.net.impact = { x: z.x, y: z.y, t: 0 };
    Stadium.crowdHype = 1;
    this.targets.forEach(tg => Tween.to(tg, { a: 0 }, 0.2));
    // ball drops inside the net
    this.phys = { vx: rand(-40, 40), vy: 40, g: 1400, floor: GOAL.bottom - 22, rest: 0.4, grow: 0, spin: 3 };
    b.groundY = GOAL.bottom - 4;

    // keeper lands in a heap, dizzy
    const k = this.keeper;
    if (k) {
      Timers.after(0.25, () => {
        Tween.kill(k);
        const side = f.kz === 1 ? 0 : (f.kz === 0 ? -1 : 1);
        const h = k.drawH || KEEPER_H;
        const w = k.drawW || h;
        const rot = side === 0 ? 0 : side * 1.45;
        const yFeet = side === 0 ? GOAL.bottom - 4 : GOAL.bottom - 4 - w * 0.46 + h / 2;
        Tween.to(k, { y: yFeet, rot, sx: 1.1, sy: side === 0 ? 0.8 : 1 }, 0.5, {
          ease: Ease.outBounce,
          onDone: () => {
            Sound.thud();
            FX.dust(k.x, GOAL.bottom, 10);
            k.dizzy = 1;
            k.dizzyX = k.x;
            k.dizzyY = side === 0 ? GOAL.bottom - h * 0.85 : GOAL.bottom - w * 0.95;
          }
        });
      });
    }

    // sounds
    Sound.play('cheer', { vol: 0.9 });
    Sound.pop();
    Sound.fanfare();

    // celebration
    const cols = golden ? ['#fff3b0', '#ffcb05', '#ffb700', '#ffffff', '#ff9f1c']
      : this.spooky ? ['#ff8a1a', '#ffcb05', '#a66bff', '#7CFC00', '#ffffff', '#ff5a1a'] : undefined;
    if (this.spooky) { Timers.after(0.2, () => Sound.cackle()); }
    Timers.after(0.05, () => {
      FX.confettiCannon(-20, 740, 1, golden ? 110 : 80, cols);
      FX.confettiCannon(W + 20, 740, -1, golden ? 110 : 80, cols);
    });
    const fw = golden ? 7 : 4;
    for (let i = 0; i < fw; i++) {
      Timers.after(0.3 + i * 0.32, () => {
        FX.firework(rand(160, W - 160), rand(90, 260), pick(this.spooky ? ['#ff8a1a', '#ffcb05', '#a66bff', '#7CFC00', '#ff5a1a'] : ['#ffcb05', '#ff4d6d', '#4cc9f0', '#7CFC00', '#ff9f1c', '#c77dff']));
        Sound.pop();
      });
    }
    const zs = Stadium.toScreen(z.x, z.y);
    FX.sparkleBurst(zs.x, zs.y, 30);
    FX.ring(zs.x, zs.y, '#fff', 30, 260, 0.5, 'ui', 10);

    // scoring per mode
    let titleText = 'GOAL!';
    let sub = pick(this.spooky ? HALLOWEEN_GOAL_LINES : GOAL_LINES);
    if (this.mode === 'classic') {
      const pts = golden ? 2 : 1;
      this.stats.shots++;
      this.stats.streak++;
      this.stats.best = Math.max(this.stats.best, this.stats.streak);
      this.stats.history.push(golden ? 'golden' : 'goal');
      if (golden) { titleText = 'GOLDEN GOAL!'; sub = 'Double points!'; }
      else if (this.stats.streak >= 3) { titleText = 'ON FIRE!'; sub = `${this.stats.streak} goals in a row!`; }
      else if (this.stats.streak === 2) { sub = 'Two in a row!'; }
      this.stats.goals += pts;
      this.sendStars(zs, golden ? 8 : 5, pts);
    } else if (this.mode === 'teams') {
      const team = this.currentTeam();
      this.teams[team].push(true);
      sub = `${team === 'red' ? 'Red' : 'Blue'} team scores!`;
      this.sendStars(zs, 5, 1, team);
    } else {
      const n = this.cards[f.zone] ? this.cards[f.zone].votes : 0;
      sub = n === 1 ? '1 student scored!' : `${n} students scored!`;
      this.stats.shots++;
      Timers.after(0.9, () => this.popTokens(n));
    }

    this.title = new BigTitle(titleText, {
      size: titleText.length > 6 ? 118 : 160, y: 250,
      colors: golden ? ['#ffffff', '#fff27a', '#ffb700'] : this.spooky ? ['#fff3c0', '#ffa21f', '#e8590c'] : ['#fffbd0', '#ffd21f', '#ff8a00'],
      outline: this.spooky ? '#2a0a4a' : undefined
    });
    Timers.after(0.45, () => { this.subRibbon = { text: sub, a: 0, color: golden ? '#e0a100' : '#e3262f' }; Tween.to(this.subRibbon, { a: 1 }, 0.35, { ease: Ease.outBack }); });

    Tween.to(Stadium.cam, { zoom: 1.12, x: 640 + (z.x - 640) * 0.3, y: 330 }, 1.6, { ease: Ease.inOutQuad, delay: 0.4 });
    Timers.after(this.mode === 'vote' ? 2.2 : 1.5, () => this.showResultButtons());
  },

  onSave(f) {
    this.phase = 'result';
    const z = ZONES[f.zone];
    const b = this.ball;
    Engine.hitstop = 0.13;
    Engine.addShake(0.55);
    Engine.doFlash(0.25, '#cfe8ff');
    Sound.play('bounce', { vol: 1 });
    Sound.boing();
    Sound.play('miss', { vol: 0.8, delay: 0.25 });
    this.targets.forEach(tg => Tween.to(tg, { a: 0 }, 0.2));
    FX.ring(z.x, z.y, '#ffffff', 10, 120, 0.4, 'world', 8);
    FX.sparkleBurst(z.x, z.y, 14, ['#ffffff', '#9fd4ff', '#ffe680'], 'world');

    const dir = z.x < 620 ? -1 : z.x > 660 ? 1 : pick([-1, 1]);
    this.phys = { vx: dir * rand(380, 520), vy: -rand(260, 380), g: 1300, floor: 590, rest: 0.5, grow: 0.55, spin: dir * 10 };
    b.groundY = 590 + BALL_SIZE * b.s * 0.5;

    const k = this.keeper;
    if (k) {
      k.flash = 1;
      Tween.to(k, { flash: 0 }, 0.35);
      Timers.after(0.3, () => {
        Tween.kill(k);
        Tween.to(k, { x: 640, y: GOAL.bottom - 4, rot: 0, sx: 1, sy: 1 }, 0.45, {
          ease: Ease.outBack,
          onDone: () => {
            // happy hops
            for (let i = 0; i < 3; i++) {
              Tween.to(k, { y: GOAL.bottom - 50 }, 0.16, { ease: Ease.outQuad, delay: i * 0.34 });
              Tween.to(k, { y: GOAL.bottom - 4 }, 0.16, { ease: Ease.inQuad, delay: i * 0.34 + 0.16 });
            }
            Timers.after(1.1, () => { if (this.keeper === k) { k.idle = true; } });
          }
        });
      });
    }

    let sub = pick(this.spooky ? HALLOWEEN_SAVE_LINES : SAVE_LINES);
    if (this.spooky) Sound.boo();
    if (this.mode === 'classic') {
      this.stats.shots++;
      this.stats.streak = 0;
      this.stats.history.push('save');
    } else if (this.mode === 'teams') {
      const team = this.currentTeam();
      this.teams[team].push(false);
      sub = 'Great save, keeper!';
    }
    this.title = new BigTitle(this.spooky ? 'BOO!' : 'SAVED!', { size: 150, y: 250, colors: this.spooky ? ['#f3e8ff', '#c9a6ff', '#8a52e0'] : ['#ffffff', '#c4e4ff', '#5aa9ff'], outline: this.spooky ? '#2a0a4a' : '#0b2a6b' });
    Timers.after(0.4, () => { this.subRibbon = { text: sub, a: 0, color: this.spooky ? '#6b3fa0' : '#2a75bb' }; Tween.to(this.subRibbon, { a: 1 }, 0.35, { ease: Ease.outBack }); });
    Tween.to(Stadium.cam, { zoom: 1, x: 640, y: 360 }, 1.2, { ease: Ease.inOutQuad, delay: 0.3 });
    Timers.after(1.4, () => this.showResultButtons());
  },

  showResultButtons() {
    if (this.phase !== 'result') return;
    this.phase = 'done';
    if (this.mode === 'teams') {
      const r = this.teams.red, bl = this.teams.blue;
      this.teams.turn++;
      const sum = a => a.filter(Boolean).length;
      const decided = r.length >= TEAM_KICKS && r.length === bl.length && sum(r) !== sum(bl);
      if (decided) {
        this.nextBtn.label = 'WINNER!  ▶';
        this.nextBtn.onClick = () => this.showFinal();
      } else {
        this.nextBtn.label = 'NEXT  ▶';
        this.nextBtn.onClick = () => this.next();
      }
    }
    this.show(this.nextBtn);
    this.show(this.topicsBtn);
  },

  next() {
    if (this.phase !== 'done') return;
    Sound.blip(5);
    Tween.to(this.title || {}, { alpha: 0 }, 0.2);
    if (this.subRibbon) Tween.to(this.subRibbon, { a: 0 }, 0.2);
    Tween.to(this.ball, { alpha: 0 }, 0.2);
    if (this.keeper) this.keeper.dizzy = 0;
    this.startRound();
  },

  // Stars fly from the goal to the scoreboard; the score ticks up as they land
  sendStars(from, n, points, team) {
    const dest = this.hudTarget(team);
    for (let i = 0; i < n; i++) {
      this.flyers.push({
        x0: from.x + rand(-30, 30), y0: from.y + rand(-30, 30), x1: dest.x, y1: dest.y,
        cx: from.x + rand(-260, 260), cy: from.y - rand(80, 220),
        t: 0, dur: rand(0.6, 0.8), delay: 0.35 + i * 0.07, size: rand(14, 20), rot: rand(0, TAU),
        onArrive: () => {
          Sound.coin(i);
          this.hud.bump.v = 1.25;
          FX.sparkleBurst(dest.x, dest.y, 5, ['#ffe680', '#ffffff'], 'ui', 0.5);
          if (i === n - 1) {
            if (team) this.hud[team] = this.teams[team].filter(Boolean).length;
            else this.hud.shown = this.stats.goals;
            this.hud.bump.v = 1.45;
          }
        }
      });
    }
  },

  hudTarget(team) {
    if (team === 'red') return { x: HUD_POS.x - 120, y: HUD_POS.y };
    if (team === 'blue') return { x: HUD_POS.x + 120, y: HUD_POS.y };
    return { x: HUD_POS.x - 60, y: HUD_POS.y };
  },

  // Vote mode: one ball token per student who scored
  popTokens(n) {
    const shown = Math.min(n, 30);
    const perRow = 15;
    const list = [];
    for (let i = 0; i < shown; i++) {
      const row = Math.floor(i / perRow);
      const inRow = Math.min(perRow, shown - row * perRow);
      const col = i % perRow;
      list.push({ x: 640 + (col - (inRow - 1) / 2) * 52, y: 450 + row * 56, s: 0, flown: false });
    }
    this.tokens = { list, n };
    list.forEach((tk, i) => {
      Timers.after(i * 0.09, () => {
        Tween.to(tk, { s: 1 }, 0.3, { ease: Ease.outBackBig });
        Sound.coin(Math.min(i, 12));
      });
    });
    const dest = this.hudTarget();
    Timers.after(shown * 0.09 + 0.5, () => {
      list.forEach((tk, i) => {
        this.flyers.push({
          x0: tk.x, y0: tk.y, x1: dest.x, y1: dest.y, cx: tk.x, cy: tk.y - 200,
          t: 0, dur: 0.55, delay: i * 0.04, size: 22, ball: true,
          onStart: () => { tk.flown = true; },
          onArrive: () => {
            Sound.tick(i);
            this.hud.bump.v = 1.2;
            if (i === list.length - 1) {
              this.stats.classTotal += n;
              this.hud.shown = this.stats.classTotal;
              this.hud.bump.v = 1.5;
              Sound.chime();
            } else {
              this.hud.shown = Math.min(this.stats.classTotal + n, this.hud.shown + 1);
            }
          }
        });
      });
    });
  },

  // ---------------------------------------------------------------- team battle ending
  showFinal() {
    if (this.phase !== 'done') return;
    this.phase = 'final';
    this.hide(this.nextBtn);
    const r = this.teams.red.filter(Boolean).length, b = this.teams.blue.filter(Boolean).length;
    const win = r > b ? 'red' : 'blue';
    this.final = { win, r, b, a: 0, t: 0, trophyY: -300 };
    Tween.to(this.final, { a: 1 }, 0.4);
    Tween.to(this.final, { trophyY: 0 }, 0.8, { ease: Ease.outBounce, delay: 0.2 });
    this.title = null;
    this.subRibbon = null;
    Sound.fanfare();
    Sound.play('cheer', { vol: 1 });
    Engine.doFlash(0.5);
    const cols = [TEAM_COLORS[win], '#ffffff', '#ffcb05'];
    for (let i = 0; i < 5; i++) {
      Timers.after(i * 0.6, () => {
        FX.confettiCannon(-20, 740, 1, 60, cols);
        FX.confettiCannon(W + 20, 740, -1, 60, cols);
        FX.firework(rand(200, W - 200), rand(100, 250), TEAM_COLORS[win]);
        Sound.pop();
      });
    }
    this.againBtn.visible = false;
    Timers.after(1.2, () => { this.show(this.againBtn); this.show(this.topicsBtn); });
  },

  restartTeams() {
    this.teams = { red: [], blue: [], turn: 0 };
    this.hud.red = this.hud.blue = 0;
    this.final = null;
    this.round = 0;
    this.hide(this.againBtn);
    this.startRound();
  },

  // ---------------------------------------------------------------- input
  cardAt(x, y) {
    for (let i = this.cards.length - 1; i >= 0; i--) {
      const c = this.cards[i];
      if (c.alpha < 0.5) continue;
      const s = c.scale * c.pop.v;
      const dx = x - c.x, dy = y - c.drawY;
      const cs = Math.cos(-c.rot), sn = Math.sin(-c.rot);
      const lx = (dx * cs - dy * sn) / s, ly = (dx * sn + dy * cs) / s;
      if (Math.abs(lx) <= CARD_W / 2 + 16 && Math.abs(ly) <= CARD_H / 2 + 16) return { c, lx, ly };
    }
    return null;
  },

  isHot(x, y) {
    if (this.buttons.some(b => b.hit(x, y))) return true;
    if ((this.phase === 'choose' || this.phase === 'vote') && this.cardAt(x, y)) return true;
    if (this.phase === 'aim') return true;
    return false;
  },

  onDown(x, y, button, e) {
    for (let i = this.buttons.length - 1; i >= 0; i--) {
      const b = this.buttons[i];
      if (b.hit(x, y)) { b.press(); return; }
    }
    if (this.phase === 'choose') {
      const hit = this.cardAt(x, y);
      if (hit) this.chooseCard(hit.c.i);
    } else if (this.phase === 'vote') {
      const hit = this.cardAt(x, y);
      if (!hit) return;
      const onMinus = hit.c.votes > 0 && Math.hypot(hit.lx - (-CARD_W / 2 + 2), hit.ly - (-CARD_H / 2)) < 30;
      if (button === 2 || onMinus || (e && e.shiftKey)) this.removeVote(hit.c.i);
      else this.addVote(hit.c.i);
    } else if (this.phase === 'reveal') {
      this.skipReveal();
    } else if (this.phase === 'toTarget') {
      this.queuedKick = true;
    } else if (this.phase === 'aim') {
      this.kick(this.chosen, this.cards[this.chosen].outcome);
    }
  },

  onKey(e) {
    const k = e.key;
    const idx = { '1': 0, '2': 1, '3': 2, ArrowLeft: 0, ArrowUp: 1, ArrowRight: 2 }[k];
    if (k === 'm' || k === 'M') { toggleMute(); return; }
    if (k === 'f' || k === 'F') { toggleFullscreen(); return; }
    if (k === 'Escape') { this.leave(); return; }
    if (idx !== undefined) {
      e.preventDefault();
      if (this.phase === 'choose') this.chooseCard(idx);
      else if (this.phase === 'vote') { if (e.shiftKey) this.removeVote(idx); else this.addVote(idx); }
      return;
    }
    if (k === ' ' || k === 'Enter') {
      e.preventDefault();
      if (this.phase === 'aim') this.kick(this.chosen, this.cards[this.chosen].outcome);
      else if (this.phase === 'reveal') this.skipReveal();
      else if (this.phase === 'toTarget') this.queuedKick = true;
      else if (this.phase === 'vote') this.startVoteKick();
      else if (this.phase === 'done' && this.nextBtn.visible) this.nextBtn.press();
      else if (this.phase === 'final' && this.againBtn.visible) this.againBtn.press();
    }
    if (k === 'Backspace' || k === 'Delete') {
      if (this.phase === 'vote') this.resetVotes();
    }
  },

  // ---------------------------------------------------------------- update
  update(dt, realDt) {
    this.t += dt;
    const p = Engine.pointer;

    this.buttons.forEach(b => { b.hover = b.hit(p.x, p.y); b.update(realDt, this.t); });

    // cards
    const canHover = this.phase === 'choose' || this.phase === 'vote';
    const hot = canHover ? this.cardAt(p.x, p.y) : null;
    for (const c of this.cards) {
      const h = hot && hot.c === c;
      if (h && !c.hover) Sound.hover();
      c.hover = !!h;
      c.lift.target = c.hover ? -24 : 0;
      c.lift.update(dt);
      c.pop.target = c.hover ? 1.05 : 1;
      c.pop.update(dt);
      c.badge.update(dt);
      const bob = canHover ? Math.sin(this.t * 2.2 + c.i * 1.3) * 5 : 0;
      c.drawY = c.y + c.lift.v + bob;
    }

    // keeper idle sway / look at roulette
    const k = this.keeper;
    if (k) {
      k.t += dt;
      if (k.idle) {
        const goalX = k.lookX != null ? lerp(640, k.lookX, 0.6) : 640 + Math.sin(this.t * 1.7) * 26;
        k.x += (goalX - k.x) * Math.min(1, dt * 6);
        k.rot = Math.sin(this.t * 3.4) * 0.03;
      }
      if (k.dizzy > 0 && this.phase === 'intro') k.dizzy = 0;
    }

    this.updateFlight(dt);

    // loose-ball physics after impact
    const ph = this.phys;
    if (ph) {
      const b = this.ball;
      ph.vy += ph.g * dt;
      b.x += ph.vx * dt;
      b.y += ph.vy * dt;
      b.rot += ph.spin * dt;
      b.s = Math.min(0.85, b.s + ph.grow * dt);
      const floor = ph.floor;
      if (b.y > floor) {
        b.y = floor;
        if (Math.abs(ph.vy) > 120) { Sound.tone(160, 0.08, { vol: 0.12, slide: 90 }); }
        ph.vy = -ph.vy * ph.rest;
        ph.vx *= 0.8;
        ph.spin *= 0.7;
        if (Math.abs(ph.vy) < 40) ph.vy = 0;
      }
      if (ph.grow > 0) b.groundY = floor + BALL_SIZE * b.s * 0.5;
    }

    Stadium.updateNet(dt);

    // targets
    for (const tg of this.targets) tg.s += (1 - tg.s) * Math.min(1, dt * 8);

    // flyers (stars / tokens heading to the scoreboard)
    for (const f of this.flyers) {
      if (f.delay > 0) { f.delay -= realDt; continue; }
      if (f.t === 0 && f.onStart) f.onStart();
      f.t += realDt;
      if (f.t >= f.dur && !f.done) { f.done = true; if (f.onArrive) f.onArrive(); }
    }
    this.flyers = this.flyers.filter(f => !f.done);

    if (this.title) this.title.update(dt);
    if (this.phrase) this.phrase.t += dt;
    if (this.final) this.final.t += dt;
    this.hud.bump.update(realDt);

    // streak fire
    if (this.mode === 'classic' && this.stats.streak >= 2 && Math.random() < 0.5) {
      Particles.spawn({
        x: HUD_POS.x + 205 + rand(-12, 12), y: HUD_POS.y + 10, vx: rand(-20, 20), vy: rand(-110, -60),
        max: rand(0.4, 0.7), size: rand(8, 14), size1: 1, color: pick(['#ffcb05', '#ff8a00', '#ff3b1f']), shape: 'glow', layer: 'ui'
      });
    }
  },

  // ---------------------------------------------------------------- draw
  draw(ctx) {
    const t = this.t;
    // ---- world
    ctx.save();
    Stadium.applyCam(ctx);
    Stadium.drawBackground(ctx);
    Stadium.drawGoal(ctx);
    Stadium.drawThemeProps(ctx);
    for (const tg of this.targets) this.drawTarget(ctx, tg, t);
    Stadium.drawKeeper(ctx, this.keeper);
    this.drawTrail(ctx);
    Stadium.drawBall(ctx, this.ball);
    Particles.draw(ctx, 'world');
    ctx.restore();

    Stadium.drawSpeedLines(ctx, this.speed.a, Engine.realTime * 0.6);

    // ---- stage (cards, reveal)
    const v = Engine.view();
    if (this.dim.a > 0) {
      ctx.fillStyle = `rgba(5,10,35,${this.dim.a})`;
      ctx.fillRect(v.x, v.y, v.w, v.h);
    }
    if (this.chosen >= 0 && this.sun.a > 0) {
      const c = this.cards[this.chosen];
      drawSunburst(ctx, c.x, c.drawY, 520, this.sun.a * 0.6, Engine.realTime);
    }
    for (const c of this.cards) {
      if (c.alpha <= 0.01) continue;
      drawCard(ctx, c, Engine.realTime);
      if (this.mode === 'vote' && c.flip > 0.9 && c.alpha > 0.5) this.drawVoteBadge(ctx, c);
    }
    if (this.phrase && this.phrase.a > 0) this.drawPhrase(ctx);

    // ---- HUD & overlays
    if (this.prompt.a > 0.01) {
      const q = this.cat.question;
      const sub = this.mode === 'vote' ? 'Click a card once for each student!' : null;
      drawBubble(ctx, 640, 136, q, { size: 34, sub, scale: this.prompt.a });
    }
    if (this.hint.a > 0.01) this.drawKickHint(ctx, t);
    if (this.banner) this.drawBanner(ctx, this.banner);
    if (this.tokens) this.drawTokens(ctx);
    if (this.title) this.title.draw(ctx);
    if (this.subRibbon && this.subRibbon.a > 0.01) {
      ctx.save();
      ctx.globalAlpha = clamp(this.subRibbon.a, 0, 1);
      ctx.translate(640, 350);
      ctx.scale(this.subRibbon.a, this.subRibbon.a);
      drawRibbon(ctx, 0, 0, 520, 64, this.subRibbon.color, this.subRibbon.text, { size: 34 });
      ctx.restore();
    }
    if (this.final) this.drawFinal(ctx);
    this.drawFlyers(ctx);
    Stadium.drawThemeOverlay(ctx);
    this.drawHUD(ctx, t);
    this.buttons.forEach(b => b.draw(ctx));
    Particles.draw(ctx, 'ui');
  },

  drawTrail(ctx) {
    if (!this.flight || this.trail.length < 2) return;
    const col = this.golden ? '#ffcc33' : '#bfe3ff';
    this.trail.forEach((p, i) => {
      const a = (i / this.trail.length) * 0.55;
      Glow.draw(ctx, col, p.x, p.y, BALL_SIZE * p.s * 0.55, a);
    });
  },

  drawTarget(ctx, tg, t) {
    if (tg.a <= 0.01) return;
    const s = tg.s * clamp(tg.a, 0, 1.2);
    const pulse = 1 + Math.sin(t * 6) * 0.06;
    ctx.save();
    ctx.globalAlpha = clamp(tg.a, 0, 1);
    ctx.translate(tg.x, tg.y);
    ctx.scale(s * pulse, s * pulse);
    if (tg.main || tg.hi) Glow.draw(ctx, '#ffe066', 0, 0, 90, 0.7);
    // spinning dashed ring
    ctx.save();
    ctx.rotate(t * 1.5);
    ctx.strokeStyle = tg.main || tg.hi ? '#ffcb05' : '#ffffff';
    ctx.lineWidth = 6;
    ctx.setLineDash([16, 10]);
    ctx.beginPath(); ctx.arc(0, 0, 50, 0, TAU); ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
    // chevrons pointing in
    const d = 64 + Math.sin(t * 8) * 6;
    ctx.fillStyle = '#ffcb05';
    ctx.strokeStyle = '#5a3a00';
    ctx.lineWidth = 3;
    for (let i = 0; i < 4; i++) {
      ctx.save();
      ctx.rotate((i * Math.PI) / 2);
      ctx.beginPath();
      ctx.moveTo(d - 12, 0); ctx.lineTo(d + 6, -10); ctx.lineTo(d + 6, 10); ctx.closePath();
      ctx.stroke(); ctx.fill();
      ctx.restore();
    }
    // item picture
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(0, 0, 38, 0, TAU); ctx.fill();
    if (tg.img) {
      ctx.save();
      ctx.beginPath(); ctx.arc(0, 0, 34, 0, TAU); ctx.clip();
      const iw = tg.img.naturalWidth, ih = tg.img.naturalHeight;
      const k = this.cat.photo ? Math.max(68 / iw, 68 / ih) : Math.min(60 / iw, 60 / ih);
      ctx.drawImage(tg.img, -iw * k / 2, -ih * k / 2, iw * k, ih * k);
      ctx.restore();
    }
    if (this.mode === 'vote') {
      ctx.fillStyle = '#e3262f';
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(34, -34, 20, 0, TAU); ctx.fill(); ctx.stroke();
      txt(ctx, String(tg.votes), 34, -32, { size: 24, fill: '#fff', shadow: false });
    }
    ctx.restore();
  },

  drawVoteBadge(ctx, c) {
    const s = c.scale * c.pop.v;
    ctx.save();
    ctx.translate(c.x, c.drawY);
    ctx.rotate(c.rot);
    ctx.scale(s, s);
    // count badge
    ctx.save();
    ctx.translate(CARD_W / 2 - 16, -CARD_H / 2 + 14);
    const bs = c.badge.v;
    ctx.scale(bs, bs);
    const on = c.votes > 0;
    if (on) Glow.draw(ctx, '#ff6b3d', 0, 0, 70, 0.6);
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath(); ctx.arc(2, 5, 38, 0, TAU); ctx.fill();
    const g = ctx.createLinearGradient(0, -36, 0, 36);
    g.addColorStop(0, on ? '#ff8a5c' : '#9aa7b8');
    g.addColorStop(1, on ? '#d61f2c' : '#5c6b80');
    ctx.fillStyle = g;
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 5;
    ctx.beginPath(); ctx.arc(0, 0, 36, 0, TAU); ctx.fill(); ctx.stroke();
    txt(ctx, String(c.votes), 0, 3, { size: c.votes > 9 ? 36 : 46, fill: '#fff', stroke: on ? '#7a0a10' : '#2c3444', lw: 6, shadow: false });
    ctx.restore();
    // minus chip
    if (c.votes > 0) {
      ctx.translate(-CARD_W / 2 + 2, -CARD_H / 2 + 0);
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.beginPath(); ctx.arc(1, 3, 20, 0, TAU); ctx.fill();
      ctx.fillStyle = '#5c6b80';
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(0, 0, 19, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#fff';
      rr(ctx, -9, -3, 18, 6, 3); ctx.fill();
    }
    ctx.restore();
  },

  drawPhrase(ctx) {
    const ph = this.phrase;
    const size = 78;
    setFont(ctx, size, FONT_ROUND, '700');
    const space = size * 0.3;
    const widths = ph.words.map(w => ctx.measureText(w.w).width);
    const total = widths.reduce((a, b) => a + b, 0) + space * (widths.length - 1);
    const scaleAll = Math.min(1, 1100 / total);
    let x = 640 - (total * scaleAll) / 2;
    ctx.save();
    ctx.globalAlpha = clamp(ph.a, 0, 1);
    ph.words.forEach((w, i) => {
      const lt = ph.t - w.t0;
      const wW = widths[i] * scaleAll;
      if (lt > 0) {
        const p = Math.min(1, lt / 0.35);
        const s = Ease.outBackBig(p) * scaleAll;
        const wave = Math.sin(ph.t * 5 + i) * 4;
        ctx.save();
        ctx.translate(x + wW / 2, 596 + wave);
        ctx.scale(s, s);
        ctx.rotate(Math.sin(ph.t * 4 + i * 2) * 0.03);
        txt(ctx, w.w, 0, 0, { size, font: FONT_ROUND, fill: { grad: ['#ffffff', '#fff6b0', '#ffd21f'] }, stroke: '#1d3f96', lw: 14, shadow: 'rgba(0,0,0,0.5)', shadowDist: 7 });
        ctx.restore();
      }
      x += wW + space * scaleAll;
    });
    ctx.restore();
  },

  drawKickHint(ctx, t) {
    const a = clamp(this.hint.a, 0, 1);
    ctx.save();
    ctx.globalAlpha = a;
    const bs = Stadium.toScreen(this.ball.x, this.ball.y);
    const pulse = 1 + Math.sin(t * 7) * 0.08;
    ctx.save();
    ctx.translate(bs.x, bs.y);
    ctx.scale(pulse, pulse);
    ctx.strokeStyle = '#ffcb05';
    ctx.lineWidth = 5;
    ctx.setLineDash([12, 8]);
    ctx.lineDashOffset = -t * 30;
    ctx.beginPath(); ctx.arc(0, 0, 62, 0, TAU); ctx.stroke();
    ctx.restore();
    const tap = (t * 1.6) % 1;
    drawHand(ctx, bs.x + 78, bs.y + 18 - (tap < 0.25 ? tap * 40 : Math.max(0, 10 - (tap - 0.25) * 40)), 1.1);
    txt(ctx, 'TAP TO KICK!', bs.x, bs.y - 92, { size: 44 * pulse, fill: { grad: ['#ffffff', '#ffe680'] }, stroke: '#1d3f96', lw: 9 });
    ctx.restore();
  },

  drawBanner(ctx, b) {
    const v = Engine.view();
    ctx.save();
    ctx.translate(b.x, 0);
    const y = 330, h = 128;
    ctx.fillStyle = 'rgba(5,10,35,0.78)';
    ctx.beginPath();
    ctx.moveTo(v.x - 40, y - h / 2); ctx.lineTo(v.x + v.w + 40, y - h / 2 - 16);
    ctx.lineTo(v.x + v.w + 40, y + h / 2 - 16); ctx.lineTo(v.x - 40, y + h / 2);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = b.color;
    ctx.fillRect(v.x - 40, y - h / 2 - 12, v.w + 80, 8);
    ctx.fillRect(v.x - 40, y + h / 2 - 4, v.w + 80, 8);
    ctx.restore();
    ctx.save();
    ctx.translate(b.x * 1.25, 0);
    txt(ctx, b.text, 640, y - 14, { size: 76, fill: { grad: ['#ffffff', shade(b.color, 0.55), b.color] }, stroke: '#0a1030', lw: 12 });
    txt(ctx, b.sub, 640, y + 40, { size: 28, font: FONT_ROUND, fill: '#fff', shadow: 'rgba(0,0,0,0.5)' });
    ctx.restore();
  },

  drawTokens(ctx) {
    const ball = Images.get(ASSETS.ball);
    for (const tk of this.tokens.list) {
      if (tk.flown || tk.s <= 0.01) continue;
      ctx.save();
      ctx.translate(tk.x, tk.y);
      ctx.scale(tk.s, tk.s);
      Glow.draw(ctx, '#ffe680', 0, 0, 40, 0.6);
      if (ball) ctx.drawImage(ball, -22, -22, 44, 44);
      ctx.restore();
    }
    if (this.tokens.n > this.tokens.list.length) {
      txt(ctx, `+${this.tokens.n - this.tokens.list.length} more!`, 640, 570, { size: 34, fill: '#ffe680', stroke: '#1d3f96' });
    }
  },

  drawFlyers(ctx) {
    const ball = Images.get(ASSETS.ball);
    for (const f of this.flyers) {
      if (f.delay > 0) continue;
      const p = Ease.inOutQuad(Math.min(1, f.t / f.dur));
      const u = 1 - p;
      const x = u * u * f.x0 + 2 * u * p * f.cx + p * p * f.x1;
      const y = u * u * f.y0 + 2 * u * p * f.cy + p * p * f.y1;
      Glow.draw(ctx, '#ffe066', x, y, f.size * 2.2, 0.6);
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(f.rot + f.t * 8);
      if (f.ball && ball) {
        ctx.drawImage(ball, -f.size, -f.size, f.size * 2, f.size * 2);
      } else {
        ctx.fillStyle = '#ffe14d';
        ctx.strokeStyle = '#a86a00';
        ctx.lineWidth = 3;
        starPath(ctx, 0, 0, 5, f.size, f.size * 0.45);
        ctx.fill(); ctx.stroke();
      }
      ctx.restore();
    }
  },

  drawFinal(ctx) {
    const f = this.final;
    const v = Engine.view();
    ctx.save();
    ctx.globalAlpha = clamp(f.a, 0, 1);
    ctx.fillStyle = 'rgba(5,10,35,0.7)';
    ctx.fillRect(v.x, v.y, v.w, v.h);
    const col = TEAM_COLORS[f.win];
    drawSunburst(ctx, 640, 270, 600, 0.55, Engine.realTime, f.win === 'red' ? '255,120,120' : '120,170,255');
    Icons.trophy(ctx, 640, 250 + f.trophyY + Math.sin(f.t * 3) * 6, 1.3 + Math.sin(f.t * 5) * 0.03);
    txt(ctx, `${f.win.toUpperCase()} TEAM WINS!`, 640, 450, { size: 84, fill: { grad: ['#ffffff', shade(col, 0.5), col] }, stroke: '#0a1030', lw: 14 });
    txt(ctx, `${f.r}  –  ${f.b}`, 640, 530, { size: 56, fill: '#fff', stroke: '#0a1030', lw: 10 });
    ctx.restore();
  },

  drawHUD(ctx, t) {
    const bump = this.hud.bump.v;
    ctx.save();
    ctx.translate(HUD_POS.x, HUD_POS.y);
    ctx.scale(bump, bump);
    if (this.mode === 'teams') this.drawTeamBoard(ctx, t);
    else this.drawScoreBoard(ctx, t);
    ctx.restore();

    // topic chip
    ctx.save();
    const chipX = 96;
    ctx.fillStyle = 'rgba(5,10,35,0.7)';
    rr(ctx, chipX, 22, 210, 48, 24); ctx.fill();
    ctx.strokeStyle = this.cat.accent;
    ctx.lineWidth = 3;
    rr(ctx, chipX, 22, 210, 48, 24); ctx.stroke();
    const img = Images.get(itemPath(this.cat, this.cat.items[0]));
    if (img) {
      const k = Math.min(36 / img.naturalWidth, 36 / img.naturalHeight);
      ctx.drawImage(img, chipX + 28 - img.naturalWidth * k / 2, 46 - img.naturalHeight * k / 2, img.naturalWidth * k, img.naturalHeight * k);
    }
    txt(ctx, this.cat.label, chipX + 124, 47, { size: 24, font: FONT_ROUND, fill: '#fff', shadow: false, maxW: 140 });
    ctx.restore();

    // streak flame
    if (this.mode === 'classic' && this.stats.streak >= 2) {
      Icons.flame(ctx, HUD_POS.x + 205, HUD_POS.y - 2, 1.1, t);
      txt(ctx, `×${this.stats.streak}`, HUD_POS.x + 245, HUD_POS.y + 2, { size: 32, fill: '#ffcb05', stroke: '#7a1a00', lw: 6 });
    }
  },

  drawScoreBoard(ctx, t) {
    const w = 330, h = 76;
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    rr(ctx, -w / 2, -h / 2 + 6, w, h, 18); ctx.fill();
    const g = ctx.createLinearGradient(0, -h / 2, 0, h / 2);
    g.addColorStop(0, '#1f3a8a'); g.addColorStop(1, '#0a1640');
    ctx.fillStyle = g;
    rr(ctx, -w / 2, -h / 2, w, h, 18); ctx.fill();
    ctx.strokeStyle = '#ffcb05';
    ctx.lineWidth = 4;
    rr(ctx, -w / 2, -h / 2, w, h, 18); ctx.stroke();
    // LED panels
    ctx.fillStyle = '#050a1f';
    rr(ctx, -w / 2 + 12, -h / 2 + 10, 190, h - 20, 10); ctx.fill();
    rr(ctx, w / 2 - 118, -h / 2 + 10, 106, h - 20, 10); ctx.fill();
    const label = this.mode === 'vote' ? 'CLASS GOALS' : 'GOALS';
    txt(ctx, label, -w / 2 + 70, -10, { size: 17, font: FONT_ROUND, fill: '#ffcb05', shadow: false, maxW: 110 });
    txt(ctx, String(Math.round(this.hud.shown)), -w / 2 + 160, 3, { size: 48, fill: '#fff', shadow: false });
    Glow.draw(ctx, '#ffffff', -w / 2 + 160, 2, 34, 0.12);
    txt(ctx, 'ROUND', w / 2 - 65, -14, { size: 15, font: FONT_ROUND, fill: '#9fc4ff', shadow: false });
    txt(ctx, String(this.round), w / 2 - 65, 12, { size: 30, fill: '#fff', shadow: false });
    // recent results
    if (this.mode === 'classic') {
      const hist = this.stats.history.slice(-8);
      hist.forEach((r, i) => {
        const x = -w / 2 + 24 + i * 11;
        ctx.fillStyle = r === 'save' ? '#ff5a5a' : r === 'golden' ? '#ffcb05' : '#4cd964';
        ctx.beginPath(); ctx.arc(x, 24, 4, 0, TAU); ctx.fill();
      });
    }
  },

  drawTeamBoard(ctx, t) {
    const w = 470, h = 84;
    const turn = this.phase === 'final' ? null : this.currentTeam();
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    rr(ctx, -w / 2, -h / 2 + 10, w, h, 18); ctx.fill();
    ['red', 'blue'].forEach((team, i) => {
      const s = i === 0 ? -1 : 1;
      const col = TEAM_COLORS[team];
      const x0 = s < 0 ? -w / 2 : 38;
      const g = ctx.createLinearGradient(0, -h / 2, 0, h / 2);
      g.addColorStop(0, shade(col, 0.2)); g.addColorStop(1, shade(col, -0.45));
      ctx.fillStyle = g;
      rr(ctx, x0, -h / 2 + 4, w / 2 - 38, h, 18); ctx.fill();
      if (turn === team && this.phase !== 'done') {
        ctx.strokeStyle = `rgba(255,255,255,${0.6 + Math.sin(t * 8) * 0.4})`;
        ctx.lineWidth = 4;
        rr(ctx, x0, -h / 2 + 4, w / 2 - 38, h, 18); ctx.stroke();
      }
      const cx = x0 + (w / 2 - 38) / 2;
      txt(ctx, team.toUpperCase(), cx - 38 * s, -12, { size: 22, fill: '#fff', stroke: shade(col, -0.6), lw: 5, shadow: false });
      txt(ctx, String(this.hud[team]), cx + 50 * s, -4, { size: 46, fill: '#fff', stroke: shade(col, -0.6), lw: 7, shadow: false });
      // penalty dots
      const shots = this.teams[team];
      const n = Math.max(TEAM_KICKS, shots.length);
      const shown = Math.min(n, 8);
      const off = n - shown;
      for (let k = 0; k < shown; k++) {
        const r = shots[k + off];
        const dx = cx - 38 * s + (k - (shown - 1) / 2) * 17 + 14 * s;
        ctx.beginPath(); ctx.arc(dx, 24, 6.5, 0, TAU);
        ctx.fillStyle = r === undefined ? 'rgba(255,255,255,0.25)' : r ? '#4cd964' : '#1a1a2e';
        ctx.fill();
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();
        if (r === false) {
          ctx.strokeStyle = '#ff5a5a'; ctx.lineWidth = 2.5;
          ctx.beginPath(); ctx.moveTo(dx - 3.5, 20.5); ctx.lineTo(dx + 3.5, 27.5); ctx.moveTo(dx + 3.5, 20.5); ctx.lineTo(dx - 3.5, 27.5); ctx.stroke();
        }
      }
    });
    // centre VS disc
    ctx.fillStyle = '#0a1640';
    ctx.strokeStyle = '#ffcb05';
    ctx.lineWidth = 4;
    ctx.beginPath(); ctx.arc(0, 4, 36, 0, TAU); ctx.fill(); ctx.stroke();
    txt(ctx, 'VS', 0, 6, { size: 28, fill: '#ffcb05', shadow: false });
  }
};
