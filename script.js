// ============================================================
//  POKÉMON SOCCER — Game Engine
// ============================================================

// ===================== CONFIGURATION ========================

const CATEGORIES = {
  fruits: {
    label: 'Fruits', folder: 'fruits', ext: 'png', emoji: '🍎', accent: '#ff4d6d',
    items: ['apples','bananas','cherries','grapefruits','grapes','oranges','peaches','pears','pineapples']
  },
  animals: {
    label: 'Animals', folder: 'animals', ext: 'png', emoji: '🐶', accent: '#f4a261',
    items: ['cats','chickens','cows','dogs','ducks','hamsters','horses','pigs','rabbits']
  },
  animals2: {
    label: 'Wild Animals', folder: 'animals2', ext: 'png', emoji: '🦁', accent: '#e76f51',
    items: ['bear','elephant','gorilla','hippo','lion','monkey','panda','spider','tiger','zebra']
  },
  colors: {
    label: 'Colors', folder: 'colors', ext: 'png', emoji: '🎨', accent: '#9b5de5',
    items: ['black','blue','brown','gray','green','orange','pink','purple','red','white','yellow']
  },
  days: {
    label: 'Days', folder: 'days', ext: 'png', emoji: '📅', accent: '#00bbf9',
    items: ['friday','monday','saturday','sunday','thursday','tuesday','wednesday']
  },
  months: {
    label: 'Months', folder: 'months', ext: 'png', emoji: '🗓️', accent: '#00c9a7',
    items: ['april','august','december','february','january','july','june','march','may','november','october','september']
  },
  'sea-animals': {
    label: 'Sea Animals', folder: 'sea-animals', ext: 'png', emoji: '🐙', accent: '#4cc9f0',
    items: ['crab','dolphin','fish','jellyfish','octopus','penguin','shark','squid','turtle','whale']
  },
  seasons: {
    label: 'Seasons', folder: 'seasons', ext: 'png', emoji: '🍂', accent: '#90be6d',
    items: ['autumn','spring','summer','winter']
  },
  sports: {
    label: 'Sports', folder: 'sports', ext: 'png', emoji: '⚽', accent: '#f94144',
    items: ['badminton','baseball','basketball','dodgeball','soccer','tabletennis','tennis','volleyball']
  },
  vegetables: {
    label: 'Vegetables', folder: 'vegetables', ext: 'png', emoji: '🥕', accent: '#43aa8b',
    items: ['cabbages','carrots','corn','mushrooms','onions','peas','peppers','potatoes','pumpkins','tomatoes']
  },
  prefectures: {
    label: 'Prefectures', folder: 'prefectures', ext: 'png', emoji: '🗾', accent: '#ef476f',
    items: ['aichi','chiba','fukuoka','hokkaido','hyogo','kanagawa','osaka','saitama','shizuoka','tokyo']
  },
  feelings: {
    label: 'Feelings', folder: 'feelings', ext: 'png', emoji: '😊', accent: '#ff9f1c',
    question: 'How are you?',
    items: ['angry','cold','happy','hot','hungry','sad','sleepy','tired']
  },
  prizes: {
    label: 'Prizes', folder: 'prizes', emoji: '🏆', accent: '#ffd166',
    items: [
      { file:'1-1',ext:'png'},{file:'1-2',ext:'png'},{file:'2-1',ext:'png'},{file:'2-2',ext:'png'},
      {file:'3-1',ext:'png'},{file:'3-2',ext:'png'},{file:'4-1',ext:'png'},{file:'4-2',ext:'png'},
      {file:'5-1',ext:'png'},{file:'5-2',ext:'png'},{file:'6-1',ext:'png'},{file:'6-2',ext:'png'},
      {file:'7-1',ext:'png'},{file:'7-2',ext:'png'},{file:'8-1',ext:'png'},{file:'8-2',ext:'png'},
      {file:'9-1',ext:'png'},{file:'9-2',ext:'png'},{file:'10-1',ext:'png'},{file:'10-2',ext:'jpg'},
      {file:'11-1',ext:'png'},{file:'11-2',ext:'png'},{file:'12-1',ext:'png'},{file:'12-2',ext:'png'},
      {file:'13-1',ext:'png'},{file:'13-2',ext:'png'},{file:'14-1',ext:'png'},{file:'14-2',ext:'png'},
      {file:'15-1',ext:'png'},{file:'15-2',ext:'webp'},{file:'16-1',ext:'avif'},{file:'16-2',ext:'png'},
      {file:'17-1',ext:'webp'},{file:'17-2',ext:'webp'},{file:'18-1',ext:'png'},{file:'18-2',ext:'webp'},
      {file:'19-1',ext:'png'},{file:'19-2',ext:'png'},{file:'20-1',ext:'png'},{file:'20-2',ext:'png'},
      {file:'21-1',ext:'webp'},{file:'21-2',ext:'png'},{file:'22-1',ext:'png'},{file:'22-2',ext:'webp'}
    ]
  }
};

const POKEMON_FILES = [
  'image12.gif','image18.gif','image20.gif','image22.gif','image24.gif','image26.gif','image28.gif',
  'image30.gif','image32.gif','image34.gif','image36.gif','image37.gif','image38.gif','image39.gif',
  'image40.gif','image41.gif','image42.gif','image43.gif','image44.gif','image45.gif','image46.gif',
  'image47.gif','image48.gif','image49.gif','image50.gif','image51.gif','image52.gif','image53.gif',
  'image54.gif','image55.gif','image56.gif','image57.gif','image58.gif','image60.gif','image61.gif',
  'image62.gif','image63.gif','image64.gif','image65.gif','image66.gif','image67.gif','image68.gif',
  'image69.gif','image70.gif','image71.gif','image72.gif','image73.gif','image74.gif','image75.gif',
  'image76.gif','image79.gif','image80.gif'
];

const POSITIONS = [
  { pct: 42 },
  { pct: 50 },
  { pct: 58 }
];

// ===================== STATE ================================

const state = {
  screen: 'title',
  category: null,
  choices: [],
  pokemon: '',
  ballTarget: null,
  score: { goals: 0, total: 0 },
  locked: false,
  round: 0,
  streak: 0,
  best: 0,
  golden: false
};

// TCG energy-type theming per classroom category (authentic card colors)
const TYPE_META = {
  fruits:      { type: 'Grass',     icon: '🌿', color: '#3d9950', light: '#b7e4a8', energy: '🌿' },
  vegetables:  { type: 'Grass',     icon: '🌿', color: '#2e7d32', light: '#a5d6a7', energy: '🌿' },
  animals:     { type: 'Colorless', icon: '⭐', color: '#8d7b5e', light: '#e8dcc0', energy: '⭐' },
  animals2:    { type: 'Fighting',  icon: '🪨', color: '#b5672a', light: '#f0c896', energy: '👊' },
  colors:      { type: 'Psychic',   icon: '👁', color: '#8e44ad', light: '#d7b5f0', energy: '🔮' },
  days:        { type: 'Lightning', icon: '⚡', color: '#c9960a', light: '#ffe89a', energy: '⚡' },
  months:      { type: 'Water',     icon: '💧', color: '#1f7ab5', light: '#a8dcf5', energy: '💧' },
  'sea-animals': { type: 'Water',   icon: '🌊', color: '#14708f', light: '#9adcF0', energy: '💧' },
  seasons:     { type: 'Fire',      icon: '🔥', color: '#c33d1f', light: '#f5b795', energy: '🔥' },
  sports:      { type: 'Fighting',  icon: '⚽', color: '#b03030', light: '#f2aaaa', energy: '⚽' },
  prefectures: { type: 'Metal',     icon: '⚙', color: '#5f6f7f', light: '#c3cfdb', energy: '🔩' },
  feelings:    { type: 'Psychic',   icon: '💖', color: '#c2438b', light: '#f3b4d4', energy: '💖' },
  prizes:      { type: 'Colorless', icon: '🏆', color: '#a8860a', light: '#ffe89a', energy: '⭐' }
};

const GOAL_SUBS = ['What a strike!', 'Top bins!', 'Unstoppable!', 'The crowd goes wild!', 'Absolute rocket!'];
const SAVE_SUBS = ['Great save!', 'Denied!', 'What a block!', 'The keeper reads it!', 'So close!'];
const KICK_NAMES = ['Quick Kick', 'Super Kick', 'Dashing Tackle'];

function typeMeta() {
  return TYPE_META[state.category] || TYPE_META.sports;
}

function dexNumber(label) {
  let h = 0;
  for (let i = 0; i < label.length; i++) h = (h * 31 + label.charCodeAt(i)) % 151;
  return String(h + 1).padStart(3, '0');
}

function hpFor(index) {
  const pool = [60, 70, 70, 80, 90];
  return pool[(state.round * 2 + index * 3) % pool.length];
}

// ===================== DOM REFS =============================

const $ = id => document.getElementById(id);
const dom = {};

function cacheDom() {
  dom.title = $('screenTitle');
  dom.categories = $('screenCategories');
  dom.game = $('screenGame');
  dom.categoryGrid = $('categoryGrid');
  dom.backBtn = $('btnBack');
  dom.startBtn = $('btnStart');
  dom.scoreDisplay = $('scoreDisplay');
  dom.zoomTarget = $('zoomTarget');
  dom.ball = $('ball');
  dom.motionlines = $('motionlines');
  dom.pokemon = $('pokemon');
  dom.choices = $('choices');
  dom.choicesArea = $('choicesArea');
  dom.resultOverlay = $('resultOverlay');
  dom.resultText = $('resultText');
  dom.resultActions = $('resultActions');
  dom.nextBtn = $('btnNext');
  dom.categoriesBtn = $('btnCategories');
  dom.kickPrompt = $('kickPrompt');
  dom.speakPrompt = $('speakPrompt');
  dom.hudCategory = $('hudCategory');
  dom.hudRound = $('hudRound');
  dom.fxLayer = $('fxLayer');
  dom.screenFlash = $('screenFlash');
  dom.resultSub = $('resultSub');
  dom.gameWrapper = $('gameWrapper');
  dom.peekLeft = $('peekLeft');
  dom.peekRight = $('peekRight');
  dom.roundBanner = $('roundBanner');
  dom.roundBannerKicker = $('roundBannerKicker');
  dom.roundBannerText = $('roundBannerText');
  dom.floatLayer = $('floatLayer');
  dom.goalNet = document.querySelector('.goal-net');
}

// ===================== HELPERS ==============================

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function imgPath(catDef, item) {
  const base = `assets/categories/${catDef.folder}`;
  if (typeof item === 'string') {
    return `${base}/${item}.${catDef.ext}`;
  }
  return `${base}/${item.file}.${item.ext}`;
}

function labelFromFile(fileName) {
  const name = fileName.replace(/\.\w+$/, '');
  if (/^\d/.test(name)) return name;
  return name.charAt(0).toUpperCase() + name.slice(1);
}

// ===================== SCREENS ==============================

function showScreen(name) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active', 'screen-enter'));
  const map = { title: dom.title, categories: dom.categories, game: dom.game };
  if (map[name]) {
    map[name].classList.add('active', 'screen-enter');
    map[name].addEventListener('animationend', () => {
      map[name].classList.remove('screen-enter');
    }, { once: true });
  }
  state.screen = name;
}

// ===================== CATEGORY SCREEN ======================

function buildCategoryGrid() {
  dom.categoryGrid.innerHTML = '';
  const entries = Object.entries(CATEGORIES);
  entries.forEach(([key, cat], i) => {
    const firstItem = cat.items[0];
    const preview = imgPath(cat, firstItem);

    const card = document.createElement('div');
    card.className = 'category-card';
    card.dataset.category = key;
    card.style.setProperty('--accent', cat.accent || '#ffcb05');
    card.style.animationDelay = `${i * 45}ms`;

    const emoji = document.createElement('div');
    emoji.className = 'category-emoji';
    emoji.textContent = cat.emoji || '⭐';

    const img = document.createElement('img');
    img.src = preview;
    img.alt = cat.label;
    img.loading = 'lazy';
    img.onerror = () => { img.src = 'assets/game/ball.png'; };

    const label = document.createElement('span');
    label.className = 'label';
    label.textContent = cat.label;

    card.appendChild(emoji);
    card.appendChild(img);
    card.appendChild(label);
    card.addEventListener('click', () => startGame(key));
    dom.categoryGrid.appendChild(card);
  });
}

// ===================== GAME INIT ============================

function startGame(categoryKey) {
  const catDef = CATEGORIES[categoryKey];
  if (!catDef) return;

  state.category = categoryKey;
  state.score.goals = 0;
  state.score.total = 0;
  state.round = 0;
  state.streak = 0;
  state.best = 0;
  state.golden = false;

  if (dom.hudCategory) {
    const cat = CATEGORIES[categoryKey];
    dom.hudCategory.textContent = `${cat.emoji || ''} ${cat.label}`.trim();
    dom.hudCategory.style.setProperty('--accent', cat.accent || '#ffcb05');
  }

  if (dom.speakPrompt) {
    dom.speakPrompt.textContent = categoryKey === 'feelings' ? 'How are you?' : "What's your favorite?";
  }

  showScreen('game');
  resetRound();
}

function resetRound() {
  const catDef = CATEGORIES[state.category];
  const shuffled = shuffle(catDef.items);
  const selected = shuffled.slice(0, 3);
  const outcomes = shuffle(['goal', 'goal', 'save']);

  state.choices = selected.map((item, i) => ({
    item,
    outcome: outcomes[i],
    imgSrc: imgPath(catDef, item)
  }));
  state.pokemon = pick(POKEMON_FILES);
  state.locked = false;
  state.round++;
  // ~1 in 8 rounds is a GOLDEN BALL round (bonus flair)
  state.golden = Math.random() < 0.12;

  if (dom.hudRound) dom.hudRound.textContent = `Round ${state.round}`;

  resetField();
  renderChoices();
  updateScore();
  playWhistle();
  showRoundBanner(
    `Round ${state.round}`,
    state.golden ? '✨ GOLDEN BALL — extra glory! ✨' : pick(['Choose your kick!', 'Say it loud!', 'Pick a card!'])
  );
}

function resetField() {
  dom.ball.style.transition = 'none';
  dom.zoomTarget.style.transition = 'none';
  dom.pokemon.style.transition = 'none';
  void dom.ball.offsetWidth;

  dom.ball.classList.remove('saved', 'ready');
  dom.zoomTarget.classList.remove('zooming');
  dom.motionlines.classList.remove('active');
  dom.choicesArea.classList.remove('hidden');
  dom.resultOverlay.classList.remove('show', 'goal', 'save');
  dom.resultOverlay.classList.add('hidden');
  dom.nextBtn.classList.add('hidden');
  dom.categoriesBtn.classList.add('hidden');
  if (dom.kickPrompt) dom.kickPrompt.classList.add('hidden');
  if (dom.fxLayer) dom.fxLayer.innerHTML = '';
  if (dom.screenFlash) dom.screenFlash.className = 'screen-flash';
  if (dom.resultSub) dom.resultSub.textContent = '';
  dom.pokemon.className = 'pokemon';
  dom.pokemon.src = `assets/pokemon/${state.pokemon}`;

  dom.ball.classList.toggle('golden', !!state.golden);
  dom.ball.style.opacity = '0';
  dom.ball.style.transform = 'translateX(-50%) translateY(100px)';
  dom.ball.style.transition = '';
  dom.ball.style.pointerEvents = 'none';
  dom.zoomTarget.style.transform = '';
  dom.pokemon.style.left = '';
  dom.zoomTarget.style.transition = '';
  dom.pokemon.style.transition = '';
  if (shootHandler) dom.ball.removeEventListener('click', shootHandler);
  shootHandler = null;
  state.pendingShoot = null;
}

const DIR_LABELS = ['← Left', '↑ Center', 'Right →'];

function choiceLabel(item) {
  return typeof item === 'string' ? labelFromFile(item) : item.file;
}

function renderChoices() {
  dom.choices.innerHTML = '';
  const meta = typeMeta();
  const isFeelings = state.category === 'feelings';
  state.choices.forEach((choice, i) => {
    const label = choiceLabel(choice.item);
    const direction = DIR_LABELS[i];
    const hp = hpFor(i);
    const dex = dexNumber(label);
    const dmg1 = 10 + ((state.round + i * 2) % 3) * 10;
    const dmg2 = 30 + ((state.round + i) % 3) * 10;

    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'choice-card deal-in';
    card.dataset.index = i;
    card.style.setProperty('--deal', `${i * 90}ms`);
    // Standard Pokemon-card blue for every card (classic look)
    card.style.setProperty('--t1', '#2a75bb');
    card.style.setProperty('--t2', '#9ac8f0');
    card.setAttribute('aria-label', `${label}, ${direction}`);

    card.innerHTML = `
      <div class="ptcg-frame">
        <div class="ptcg-card">
          <header class="ptcg-top">
            <span class="ptcg-basic">BASIC</span>
            <span class="ptcg-name"></span>
            <span class="ptcg-hp"><small>HP</small><b></b><i class="ptcg-e"></i></span>
          </header>
          <div class="ptcg-art-frame">
            <div class="ptcg-art">
              <img alt="">
              <span class="ptcg-holo"></span>
              <span class="ptcg-glare"></span>
            </div>
          </div>
          <div class="ptcg-dexbar"><span></span><span class="ptcg-set">◈</span></div>
          <div class="ptcg-attacks">
            <div class="ptcg-attack">
              <span class="ptcg-cost"><i class="ptcg-e"></i></span>
              <span class="ptcg-move-name"></span>
              <span class="ptcg-dmg"></span>
            </div>
            <div class="ptcg-attack">
              <span class="ptcg-cost"><i class="ptcg-e"></i><i class="ptcg-e"></i></span>
              <span class="ptcg-move-name2"></span>
              <span class="ptcg-dmg2"></span>
            </div>
            <p class="ptcg-flavor"></p>
          </div>
          <footer class="ptcg-meta">
            <span class="ptcg-wrr"></span>
            <span class="ptcg-num"></span>
          </footer>
        </div>
      </div>
    `;

    card.querySelector('.ptcg-name').textContent = label;
    card.querySelector('.ptcg-hp b').textContent = hp;
    card.querySelector('.ptcg-hp .ptcg-e').textContent = meta.energy;
    card.querySelector('.ptcg-dexbar span').textContent =
      `${meta.type} Pokémon · HT 2'04" · NO. ${dex}`;
    card.querySelector('.ptcg-move-name').textContent = KICK_NAMES[i % KICK_NAMES.length];
    card.querySelector('.ptcg-dmg').textContent = dmg1;
    card.querySelector('.ptcg-move-name2').textContent = direction;
    card.querySelector('.ptcg-dmg2').textContent = dmg2;
    card.querySelectorAll('.ptcg-cost .ptcg-e').forEach(el => { el.textContent = meta.energy; });
    card.querySelector('.ptcg-flavor').textContent =
      isFeelings ? `I am ${label}! ${direction}` : `I like ${label}! ${direction}`;
    card.querySelector('.ptcg-wrr').textContent =
      `weakness ${meta.icon} ×2 · retreat ⭐`;
    card.querySelector('.ptcg-num').textContent = `${dex}/151 ★`;

    const img = card.querySelector('.ptcg-art img');
    img.src = choice.imgSrc;
    img.alt = label;
    img.loading = 'eager';
    img.onerror = () => { img.src = 'assets/game/ball.png'; };

    // 3D tilt + glare follow (authentic holo feel)
    card.addEventListener('pointermove', (ev) => {
      const r = card.getBoundingClientRect();
      const px = (ev.clientX - r.left) / r.width - 0.5;
      const py = (ev.clientY - r.top) / r.height - 0.5;
      card.style.setProperty('--ry', `${px * 14}deg`);
      card.style.setProperty('--rx', `${-py * 12}deg`);
      card.style.setProperty('--mx', `${(px + 0.5) * 100}%`);
      card.style.setProperty('--my', `${(py + 0.5) * 100}%`);
    });
    card.addEventListener('pointerleave', () => {
      card.style.setProperty('--ry', '0deg');
      card.style.setProperty('--rx', '0deg');
    });

    card.addEventListener('click', () => selectChoice(i));
    dom.choices.appendChild(card);
  });
}

function updateScore() {
  dom.scoreDisplay.textContent = `${state.score.goals}/${state.score.total}`;
  const board = dom.scoreDisplay.closest('.scoreboard');
  if (board) board.classList.toggle('on-fire', state.streak >= 2);
  if (dom.hudRound) {
    dom.hudRound.textContent = state.streak >= 2
      ? `Round ${state.round} · 🔥×${state.streak}`
      : `Round ${state.round}`;
  }
}

// ===================== CHOICE HANDLING ======================

let shootHandler = null;

function selectChoice(index) {
  if (state.locked) return;
  state.locked = true;

  const choice = state.choices[index];

  playBlip();
  const cards = dom.choices.querySelectorAll('.choice-card');
  cards.forEach((c, i) => {
    c.classList.add('disabled');
    c.classList.remove('deal-in');
    if (i === index) {
      c.classList.add('chosen');
      burstSparklesAt(c, 14);
    } else {
      c.classList.add('fade');
    }
  });

  state.pendingShoot = { outcome: choice.outcome, direction: index };

  dom.choicesArea.classList.add('hidden');

  setTimeout(() => {
    dom.ball.style.transition = 'none';
    dom.ball.style.transform = 'translateX(-50%) translateY(100px)';
    dom.ball.style.opacity = '1';
    dom.ball.style.pointerEvents = 'auto';
    void dom.ball.offsetWidth;
    dom.ball.style.transition = 'transform 0.4s ease-out, opacity 0.4s ease-out';
    dom.ball.style.transform = 'translateX(-50%)';

    if (shootHandler) dom.ball.removeEventListener('click', shootHandler);
    shootHandler = () => doShoot(choice.outcome, index);
    dom.ball.addEventListener('click', shootHandler, { once: true });

    setTimeout(() => {
      if (state.pendingShoot) {
        dom.ball.classList.add('ready');
        if (dom.kickPrompt) dom.kickPrompt.classList.remove('hidden');
      }
    }, 420);
  }, 350);
}

function doShoot(outcome, direction) {
  dom.ball.style.pointerEvents = '';
  dom.ball.classList.remove('ready');
  if (dom.kickPrompt) dom.kickPrompt.classList.add('hidden');
  animateKick(outcome, direction);
}

// ===================== ANIMATION ============================

function getCSSHeight(el) {
  return parseFloat(getComputedStyle(el).height) || 0;
}

function calcBallY() {
  const H = document.getElementById('gameWrapper').offsetHeight;
  const ballH = getCSSHeight(dom.ball);
  const pokeH = getCSSHeight(dom.pokemon);
  if (!ballH || !pokeH) return -160;
  return Math.round(H * -0.16 - pokeH * 0.9 + ballH / 2);
}

function animateKick(outcome, directionIdx) {
  playSound('kick');
  spawnKickDust();
  startBallTrail();

  const screenW = document.getElementById('gameWrapper').offsetWidth;
  const ballPct = POSITIONS[directionIdx].pct;

  let pokeIdx;
  if (outcome === 'save') {
    pokeIdx = directionIdx;
  } else {
    pokeIdx = [0, 1, 2].filter(i => i !== directionIdx)[Math.floor(Math.random() * 2)];
  }
  const pokePct = POSITIONS[pokeIdx].pct;

  const ballX = Math.round((ballPct - 50) * 0.01 * screenW);
  const yMove = calcBallY();
  const ballKickPos = `translateX(calc(-50% + ${ballX}px)) translateY(${yMove}px) scale(0.35)`;

  // Phase 1: Ball flies toward goal, goal zooms, motion lines, pokemon dives
  dom.ball.style.transition = 'transform 0.9s cubic-bezier(0.22, 1, 0.36, 1)';
  dom.ball.style.transform = ballKickPos;

  dom.zoomTarget.style.transition = '';
  dom.zoomTarget.classList.add('zooming');

  dom.motionlines.classList.add('active');
  dom.choicesArea.classList.add('hidden');

  dom.pokemon.style.left = `${pokePct}%`;
  dom.pokemon.classList.add('diving');
  if (outcome === 'save') {
    dom.pokemon.classList.add('spin');
  }

  if (outcome === 'save') {
    playSound('goalbounce', 0.95);
  }

  // Phase 2: After ball reaches goal area
  setTimeout(() => {
    stopBallTrail();
    dom.motionlines.classList.remove('active');
    dom.pokemon.classList.remove('diving', 'spin');

    if (outcome === 'save') {
      const deflectX = ballX + (Math.random() > 0.5 ? 140 : -140);
      const deflectY = yMove + 150;
      const deflectPos = `translateX(calc(-50% + ${deflectX}px)) translateY(${deflectY}px) scale(0.35)`;

      dom.ball.style.transition = 'none';
      void dom.ball.offsetWidth;
      dom.ball.style.transition = 'transform 0.45s cubic-bezier(0.36, 0, 0.66, 1)';
      dom.ball.style.transform = deflectPos;

      dom.zoomTarget.style.transition = 'transform 0.45s cubic-bezier(0.36, 0, 0.66, 1)';
      dom.zoomTarget.classList.remove('zooming');

      dom.pokemon.style.transition = 'transform 0.2s';
      dom.pokemon.classList.add('saved');

      setTimeout(() => {
        shakeScreen('');
        showResult(outcome);
      }, 450);
    } else {
      const dropY = yMove + 100;

      dom.ball.style.transition = 'none';
      void dom.ball.offsetWidth;
      dom.ball.style.transition = 'transform 0.25s ease-in';
      dom.ball.style.transform = `translateX(calc(-50% + ${ballX}px)) translateY(${dropY}px) scale(0.35)`;

      dom.pokemon.style.transition = 'transform 0.2s';
      dom.pokemon.classList.add('missed');
      rippleNet();

      setTimeout(() => {
        shakeScreen(state.golden ? 'big' : '');
        showResult(outcome);
      }, 250);
    }
  }, 950);
}

function showResult(outcome) {
  dom.choicesArea.classList.add('hidden');
  if (dom.kickPrompt) dom.kickPrompt.classList.add('hidden');
  dom.resultOverlay.classList.remove('hidden', 'goal', 'save');
  dom.resultOverlay.classList.add(outcome === 'goal' ? 'goal' : 'save');

  requestAnimationFrame(() => {
    dom.resultOverlay.classList.add('show');
  });

  if (outcome === 'goal') {
    playSound('goalscore', 0, 0.4);
  } else {
    playSound('goalmiss', 0, 0.4);
  }

  flashScreen(outcome);

  state.score.total++;
  if (outcome === 'goal') {
    state.score.goals++;
    state.streak++;
    state.best = Math.max(state.best, state.streak);
  } else {
    state.streak = 0;
  }
  updateScore();

  // Scaled celebration: hotter streak / golden = bigger burst
  const intensity = outcome === 'goal' ? Math.min(1 + state.streak * 0.35 + (state.golden ? 0.8 : 0), 3) : 1;
  burstFX(outcome, intensity);

  const isGoldenGoal = outcome === 'goal' && state.golden;
  dom.resultText.textContent =
    outcome === 'goal'
      ? isGoldenGoal ? 'GOLDEN GOAL!' : state.streak >= 3 ? 'ON FIRE!' : state.streak === 2 ? 'GOAL x2!' : 'GOAL!'
      : 'SAVED!';
  dom.resultText.className = 'result-text ' + outcome + (isGoldenGoal ? ' golden-text' : '');
  if (dom.resultSub) {
    dom.resultSub.textContent =
      outcome === 'goal'
        ? isGoldenGoal ? '✨ Shiny and spectacular! ✨' : state.streak >= 2 ? `🔥 ${state.streak} in a row — ${pick(GOAL_SUBS)}` : pick(GOAL_SUBS)
        : pick(SAVE_SUBS);
  }
  floatUp(outcome === 'goal' ? (isGoldenGoal ? '+1 ✨' : state.streak >= 2 ? `+1 🔥×${state.streak}` : '+1') : 'BLOCKED',
    outcome === 'goal' ? 'float-good' : 'float-bad');
  if (navigator.vibrate) {
    try { navigator.vibrate(outcome === 'goal' ? (isGoldenGoal ? [40, 40, 80] : 60) : 25); } catch (e) {}
  }

  setTimeout(() => {
    dom.nextBtn.classList.remove('hidden');
    dom.nextBtn.textContent = 'Next Round  →';
    dom.categoriesBtn.classList.remove('hidden');
    dom.categoriesBtn.textContent = 'More Categories';
  }, 800);
}

function shakeScreen(power) {
  if (!dom.gameWrapper) return;
  dom.gameWrapper.classList.remove('shake', 'shake-big');
  void dom.gameWrapper.offsetWidth;
  dom.gameWrapper.classList.add(power === 'big' ? 'shake-big' : 'shake');
  setTimeout(() => dom.gameWrapper.classList.remove('shake', 'shake-big'), 550);
}

function showRoundBanner(kicker, text) {
  if (!dom.roundBanner) return;
  dom.roundBannerKicker.textContent = kicker;
  dom.roundBannerText.textContent = text;
  dom.roundBanner.classList.toggle('golden', !!state.golden);
  dom.roundBanner.classList.remove('hidden', 'play');
  void dom.roundBanner.offsetWidth;
  dom.roundBanner.classList.add('play');
  clearTimeout(showRoundBanner._t);
  showRoundBanner._t = setTimeout(() => dom.roundBanner.classList.add('hidden'), 1600);
}

function floatUp(text, cls) {
  if (!dom.floatLayer) return;
  const el = document.createElement('div');
  el.className = `float-up ${cls || ''}`;
  el.textContent = text;
  dom.floatLayer.appendChild(el);
  setTimeout(() => el.remove(), 1400);
}

function rippleNet() {
  const net = dom.goalNet;
  if (!net) return;
  net.classList.remove('ripple');
  void net.offsetWidth;
  net.classList.add('ripple');
  setTimeout(() => net.classList.remove('ripple'), 700);
}

function fieldPoint(clientX, clientY) {
  const wrap = dom.gameWrapper.getBoundingClientRect();
  return { x: clientX - wrap.left, y: clientY - wrap.top };
}

function burstSparklesAt(el, count) {
  if (!dom.fxLayer || !el) return;
  const r = el.getBoundingClientRect();
  const colors = ['#ffcb05', '#ffffff', '#7ec8ff', '#ff9f1c'];
  for (let i = 0; i < (count || 12); i++) {
    const p = document.createElement('span');
    const angle = (Math.PI * 2 * i) / (count || 12) + Math.random() * 0.5;
    const dist = 40 + Math.random() * 90;
    const pt = fieldPoint(r.left + r.width / 2, r.top + r.height / 2);
    p.className = 'sparkle-pop';
    p.style.left = `${pt.x}px`;
    p.style.top = `${pt.y}px`;
    p.style.setProperty('--c', colors[i % colors.length]);
    p.style.setProperty('--dx', `${Math.cos(angle) * dist}px`);
    p.style.setProperty('--dy', `${Math.sin(angle) * dist - 30}px`);
    dom.fxLayer.appendChild(p);
    setTimeout(() => p.remove(), 750);
  }
}

function spawnKickDust() {
  if (!dom.fxLayer || !dom.ball) return;
  const r = dom.ball.getBoundingClientRect();
  const pt = fieldPoint(r.left + r.width / 2, r.top + r.height);
  for (let i = 0; i < 8; i++) {
    const p = document.createElement('span');
    p.className = 'dust-puff';
    p.style.left = `${pt.x + (Math.random() - 0.5) * 50}px`;
    p.style.top = `${pt.y - Math.random() * 10}px`;
    p.style.setProperty('--dx', `${(Math.random() - 0.5) * 120}px`);
    p.style.animationDelay = `${Math.random() * 0.08}s`;
    dom.fxLayer.appendChild(p);
    setTimeout(() => p.remove(), 700);
  }
}

let trailTimer = null;
function startBallTrail() {
  stopBallTrail();
  trailTimer = setInterval(() => {
    if (!dom.ball || !dom.fxLayer) return;
    const r = dom.ball.getBoundingClientRect();
    if (!r.width) return;
    const pt = fieldPoint(r.left + r.width / 2, r.top + r.height / 2);
    const p = document.createElement('span');
    p.className = 'trail-puff' + (state.golden ? ' golden' : '');
    p.style.left = `${pt.x}px`;
    p.style.top = `${pt.y}px`;
    dom.fxLayer.appendChild(p);
    setTimeout(() => p.remove(), 550);
  }, 40);
}
function stopBallTrail() {
  if (trailTimer) clearInterval(trailTimer);
  trailTimer = null;
}

// Tiny UI sounds via WebAudio (no assets needed)
let actx = null;
function tone(freq, dur, type, vol, slideTo) {
  try {
    actx = actx || new (window.AudioContext || window.webkitAudioContext)();
    const o = actx.createOscillator();
    const g = actx.createGain();
    o.type = type || 'sine';
    o.frequency.setValueAtTime(freq, actx.currentTime);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, actx.currentTime + dur);
    g.gain.setValueAtTime(vol || 0.12, actx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, actx.currentTime + dur);
    o.connect(g).connect(actx.destination);
    o.start();
    o.stop(actx.currentTime + dur);
  } catch (e) {}
}
function playBlip() { tone(520, 0.12, 'triangle', 0.1, 880); }
function playWhistle() { tone(2200, 0.16, 'square', 0.05, 2600); setTimeout(() => tone(2200, 0.22, 'square', 0.05, 2600), 180); }

function flashScreen(outcome) {
  if (!dom.screenFlash) return;
  dom.screenFlash.className = 'screen-flash ' + (outcome === 'goal' ? 'goal' : 'save');
  setTimeout(() => { dom.screenFlash.className = 'screen-flash'; }, 560);
}

function burstFX(outcome, intensity) {
  if (!dom.fxLayer) return;
  const k = intensity || 1;
  const colors = outcome === 'goal'
    ? (state.golden
      ? ['#ffe56a', '#ffcb05', '#ffffff', '#ffb703', '#ff9f1c', '#fff3b0']
      : ['#ffcb05', '#ee1515', '#ffffff', '#2a75bb', '#43aa8b', '#ff7b00'])
    : ['#7ec8ff', '#2a75bb', '#ffffff', '#94a3b8'];
  const count = Math.round((outcome === 'goal' ? 42 : 20) * k);
  for (let i = 0; i < count; i++) {
    const p = document.createElement('span');
    const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.4;
    const dist = (90 + Math.random() * 220) * Math.min(k, 1.6);
    const isStar = i % 5 === 0 && outcome === 'goal';
    p.className = 'confetti' + (i % 3 === 0 ? ' circle' : '') + (isStar ? ' star' : '');
    p.textContent = isStar ? '★' : '';
    p.style.setProperty('--c', colors[i % colors.length]);
    p.style.setProperty('--dx', `${Math.cos(angle) * dist}px`);
    p.style.setProperty('--dy', `${Math.sin(angle) * dist - 40}px`);
    p.style.setProperty('--rot', `${180 + Math.random() * 420}deg`);
    p.style.animationDelay = `${Math.random() * 0.08}s`;
    dom.fxLayer.appendChild(p);
    setTimeout(() => p.remove(), 1600);
  }
}

function setTitlePeeks() {
  if (!dom.peekLeft || !dom.peekRight || !POKEMON_FILES.length) return;
  const picks = shuffle(POKEMON_FILES);
  dom.peekLeft.src = `assets/pokemon/${picks[0]}`;
  dom.peekRight.src = `assets/pokemon/${picks[1] || picks[0]}`;
}

function nextRound() {
  resetRound();
}

function backToCategories() {
  showScreen('categories');
}

// ===================== SOUND =================================

const audioDefs = {
  kick: 'assets/sounds/ballkick.wav',
  goalbounce: 'assets/sounds/goalbounce.wav',
  goalscore: 'assets/sounds/goalscore.mp3',
  goalmiss: 'assets/sounds/goalmiss.mp3'
};

const audioEls = {};
let audioReady = false;

function initAudio() {
  if (audioReady) return;
  audioReady = true;

  for (const [name, url] of Object.entries(audioDefs)) {
    const el = new Audio(url);
    el.preload = 'auto';
    el.playsInline = true;
    audioEls[name] = el;
    el.load();
  }

  const unlock = audioEls.kick;
  if (!unlock) return;
  const prev = unlock.volume;
  unlock.volume = 0.001;
  const p = unlock.play();
  if (p && p.then) {
    p.then(() => {
      unlock.pause();
      unlock.currentTime = 0;
      unlock.volume = prev || 0.7;
    }).catch(() => {
      unlock.volume = prev || 0.7;
    });
  }
}

function playSound(name, delay = 0, volume) {
  const run = () => {
    const src = audioDefs[name];
    if (!src) return;
    const a = new Audio(src);
    a.playsInline = true;
    a.volume = volume ?? (name === 'kick' ? 0.7 : 1.0);
    const p = a.play();
    if (p && p.catch) p.catch(err => console.warn('Audio play error:', name, err));
  };

  if (delay) setTimeout(run, delay * 1000);
  else run();
}

// ===================== IMAGE PRELOAD ========================

function preloadImages() {
  ['ball.png','goalbackground.png','goal.png','motionlines.png']
    .forEach(f => { const i = new Image(); i.src = `assets/game/${f}`; });
}

// ===================== INIT =================================

document.addEventListener('DOMContentLoaded', () => {
  cacheDom();
  preloadImages();
  setTitlePeeks();

  dom.startBtn.addEventListener('click', () => {
    initAudio();
    showScreen('categories');
  });

  dom.backBtn.addEventListener('click', backToCategories);
  dom.nextBtn.addEventListener('click', nextRound);
  dom.categoriesBtn.addEventListener('click', () => {
    showScreen('categories');
  });

  buildCategoryGrid();
});
