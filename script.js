// ============================================================
//  POKÉMON SOCCER — Game Engine
// ============================================================

// ===================== CONFIGURATION ========================

const CATEGORIES = {
  fruits: {
    label: 'Fruits', folder: 'fruits', ext: 'png',
    items: ['apples','bananas','cherries','grapefruits','grapes','oranges','peaches','pears','pineapples']
  },
  animals: {
    label: 'Animals', folder: 'animals', ext: 'png',
    items: ['cats','chickens','cows','dogs','ducks','hamsters','horses','pigs','rabbits']
  },
  animals2: {
    label: 'Wild Animals', folder: 'animals2', ext: 'png',
    items: ['bear','elephant','gorilla','hippo','lion','monkey','panda','spider','tiger','zebra']
  },
  colors: {
    label: 'Colors', folder: 'colors', ext: 'png',
    items: ['black','blue','brown','gray','green','orange','pink','purple','red','white','yellow']
  },
  days: {
    label: 'Days', folder: 'days', ext: 'png',
    items: ['friday','monday','saturday','sunday','thursday','tuesday','wednesday']
  },
  months: {
    label: 'Months', folder: 'months', ext: 'png',
    items: ['april','august','december','february','january','july','june','march','may','november','october','september']
  },
  'sea-animals': {
    label: 'Sea Animals', folder: 'sea-animals', ext: 'png',
    items: ['crab','dolphin','fish','jellyfish','octopus','penguin','shark','squid','turtle','whale']
  },
  seasons: {
    label: 'Seasons', folder: 'seasons', ext: 'png',
    items: ['autumn','spring','summer','winter']
  },
  sports: {
    label: 'Sports', folder: 'sports', ext: 'png',
    items: ['badminton','baseball','basketball','dodgeball','soccer','tabletennis','tennis','volleyball']
  },
  vegetables: {
    label: 'Vegetables', folder: 'vegetables', ext: 'png',
    items: ['cabbages','carrots','corn','mushrooms','onions','peas','peppers','potatoes','pumpkins','tomatoes']
  },
  prefectures: {
    label: 'Prefectures', folder: 'prefectures', ext: 'png',
    items: ['aichi','chiba','fukuoka','hokkaido','hyogo','kanagawa','osaka','saitama','shizuoka','tokyo']
  },
  prizes: {
    label: 'Prizes', folder: 'prizes',
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
  round: 0
};

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
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const map = { title: dom.title, categories: dom.categories, game: dom.game };
  if (map[name]) map[name].classList.add('active');
  state.screen = name;
}

// ===================== CATEGORY SCREEN ======================

function buildCategoryGrid() {
  dom.categoryGrid.innerHTML = '';
  const entries = Object.entries(CATEGORIES);
  for (const [key, cat] of entries) {
    const firstItem = cat.items[0];
    const preview = imgPath(cat, firstItem);

    const card = document.createElement('div');
    card.className = 'category-card';
    card.dataset.category = key;

    const img = document.createElement('img');
    img.src = preview;
    img.alt = cat.label;
    img.loading = 'lazy';
    img.onerror = () => { img.src = 'assets/game/ball.png'; };

    const label = document.createElement('span');
    label.textContent = cat.label;

    card.appendChild(img);
    card.appendChild(label);
    card.addEventListener('click', () => startGame(key));
    dom.categoryGrid.appendChild(card);
  }
}

// ===================== GAME INIT ============================

function startGame(categoryKey) {
  const catDef = CATEGORIES[categoryKey];
  if (!catDef) return;

  state.category = categoryKey;
  state.score.goals = 0;
  state.score.total = 0;
  state.round = 0;

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

  resetField();
  renderChoices();
  updateScore();
}

function resetField() {
  dom.ball.style.transition = 'none';
  dom.zoomTarget.style.transition = 'none';
  dom.pokemon.style.transition = 'none';
  void dom.ball.offsetWidth;

  dom.ball.classList.remove('saved');
  dom.zoomTarget.classList.remove('zooming');
  dom.motionlines.classList.remove('active');
  dom.choicesArea.classList.remove('hidden');
  dom.resultOverlay.classList.remove('show');
  dom.resultOverlay.classList.add('hidden');
  dom.nextBtn.classList.add('hidden');
  dom.categoriesBtn.classList.add('hidden');
  dom.pokemon.className = 'pokemon';
  dom.pokemon.src = `assets/pokemon/${state.pokemon}`;

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

const ARROWS = ['←', '↑', '→'];

function renderChoices() {
  dom.choices.innerHTML = '';
  state.choices.forEach((choice, i) => {
    const card = document.createElement('div');
    card.className = 'choice-card';
    card.dataset.index = i;

    const img = document.createElement('img');
    img.src = choice.imgSrc;
    img.alt = '';
    img.loading = 'eager';
    img.onerror = () => { img.src = 'assets/game/ball.png'; };

    const label = document.createElement('div');
    label.className = 'choice-label';
    const item = choice.item;
    label.textContent = typeof item === 'string' ? labelFromFile(item) : item.file;

    const arrow = document.createElement('div');
    arrow.className = 'choice-arrow';
    arrow.textContent = ARROWS[i];

    card.appendChild(img);
    card.appendChild(label);
    card.appendChild(arrow);
    card.addEventListener('click', () => selectChoice(i));
    dom.choices.appendChild(card);
  });
}

function updateScore() {
  dom.scoreDisplay.textContent = `${state.score.goals}/${state.score.total}`;
}

// ===================== CHOICE HANDLING ======================

let shootHandler = null;

function selectChoice(index) {
  if (state.locked) return;
  state.locked = true;

  const choice = state.choices[index];

  const cards = dom.choices.querySelectorAll('.choice-card');
  cards.forEach((c, i) => {
    c.classList.add('disabled');
    if (i === index) {
      c.classList.add('chosen');
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
  }, 350);
}

function doShoot(outcome, direction) {
  dom.ball.style.pointerEvents = '';
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

      setTimeout(() => showResult(outcome), 450);
    } else {
      const dropY = yMove + 100;

      dom.ball.style.transition = 'none';
      void dom.ball.offsetWidth;
      dom.ball.style.transition = 'transform 0.25s ease-in';
      dom.ball.style.transform = `translateX(calc(-50% + ${ballX}px)) translateY(${dropY}px) scale(0.35)`;

      dom.pokemon.style.transition = 'transform 0.2s';
      dom.pokemon.classList.add('missed');

      setTimeout(() => showResult(outcome), 250);
    }
  }, 950);
}

function showResult(outcome) {
  dom.resultOverlay.classList.remove('hidden');

  requestAnimationFrame(() => {
    dom.resultOverlay.classList.add('show');
  });

  if (outcome === 'goal') {
    playSound('goalscore', 0, 0.4);
  } else {
    playSound('goalmiss', 0, 0.4);
  }

  dom.resultText.textContent = outcome === 'goal' ? 'GOAL!' : 'SAVED!';
  dom.resultText.className = 'result-text ' + outcome;

  state.score.total++;
  if (outcome === 'goal') state.score.goals++;
  updateScore();

  setTimeout(() => {
    dom.nextBtn.classList.remove('hidden');
    dom.nextBtn.textContent = 'Next Round  →';
    dom.categoriesBtn.classList.remove('hidden');
    dom.categoriesBtn.textContent = 'More Categories';
  }, 800);
}

function nextRound() {
  resetRound();
}

function backToCategories() {
  showScreen('categories');
}

// ===================== SOUND (Web Audio API) ================

let audioCtx = null;
const audioDecoded = {};
const audioDefs = {
  kick: 'assets/sounds/ballkick.wav',
  goalbounce: 'assets/sounds/goalbounce.wav',
  goalscore: 'assets/sounds/goalscore.mp3',
  goalmiss: 'assets/sounds/goalmiss.mp3'
};

function playSound(name, delay = 0, volume) {
  if (window.location.protocol === 'file:') return;
  if (!audioCtx) return;

  const playAt = audioCtx.currentTime + delay;

  const schedule = buf => {
    try {
      const source = audioCtx.createBufferSource();
      source.buffer = buf;
      const gain = audioCtx.createGain();
      gain.gain.value = volume ?? (name === 'kick' ? 0.7 : 1.0);
      source.connect(gain);
      gain.connect(audioCtx.destination);
      source.start(Math.max(playAt, audioCtx.currentTime));
    } catch (e) {
      console.warn('Audio schedule error:', e);
    }
  };

  if (audioDecoded[name]) {
    schedule(audioDecoded[name]);
    return;
  }

  fetch(audioDefs[name])
    .then(r => { if (!r.ok) throw Error('fetch failed'); return r.arrayBuffer(); })
    .then(buf => audioCtx.decodeAudioData(buf))
    .then(decoded => {
      audioDecoded[name] = decoded;
      schedule(decoded);
    })
    .catch(e => console.warn('Audio load error:', name, e));
}

function initAudio() {
  if (audioCtx) return;
  try {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    audioCtx.resume();
    // Pre-decode in background so it's ready when user reaches game
    for (const [key, url] of Object.entries(audioDefs)) {
      fetch(url)
        .then(r => { if (!r.ok) throw Error('fetch failed'); return r.arrayBuffer(); })
        .then(buf => audioCtx.decodeAudioData(buf))
        .then(decoded => { audioDecoded[key] = decoded; })
        .catch(e => console.warn('Audio preload error:', key, e));
    }
  } catch (e) {
    console.warn('Audio init error:', e);
  }
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
