// ============================================================
//  POKÉMON SOCCER — Game data (topics, keepers, card themes)
// ============================================================
'use strict';

// question: what the teacher asks. proper: nouns keep a capital letter in "I like ..."
const CATEGORIES = {
  halloween: {
    label: 'Halloween', folder: 'halloween', ext: 'png', accent: '#6b3fa0', type: 'darkness',
    question: 'What do you like about Halloween?',
    plural: { bats: 'bats', blackcat: 'black cats', ghost: 'ghosts', mummy: 'mummies', pumpkin: 'pumpkins', skeleton: 'skeletons', witch: 'witches' },
    items: ['pumpkin','ghost','witch','bats','blackcat','mummy','skeleton']
  },
  fruits: {
    label: 'Fruits', folder: 'fruits', ext: 'png', accent: '#ff4d6d', type: 'grass',
    question: 'What fruit do you like?',
    items: ['apples','bananas','cherries','grapefruits','grapes','oranges','peaches','pears','pineapples']
  },
  animals: {
    label: 'Animals', folder: 'animals', ext: 'png', accent: '#f4a261', type: 'colorless',
    question: 'What animals do you like?',
    items: ['cats','chickens','cows','dogs','ducks','hamsters','horses','pigs','rabbits']
  },
  animals2: {
    label: 'Wild Animals', folder: 'animals2', ext: 'png', accent: '#e76f51', type: 'fighting',
    question: 'What animals do you like?',
    plural: { bear: 'bears', elephant: 'elephants', gorilla: 'gorillas', hippo: 'hippos', lion: 'lions', monkey: 'monkeys', panda: 'pandas', spider: 'spiders', tiger: 'tigers', zebra: 'zebras' },
    items: ['bear','elephant','gorilla','hippo','lion','monkey','panda','spider','tiger','zebra']
  },
  colors: {
    label: 'Colors', folder: 'colors', ext: 'png', accent: '#9b5de5', type: 'psychic',
    question: 'What color do you like?',
    items: ['black','blue','brown','gray','green','orange','pink','purple','red','white','yellow']
  },
  days: {
    label: 'Days', folder: 'days', ext: 'png', accent: '#00bbf9', type: 'lightning', proper: true,
    question: 'What day do you like?',
    items: ['monday','tuesday','wednesday','thursday','friday','saturday','sunday']
  },
  months: {
    label: 'Months', folder: 'months', ext: 'png', accent: '#00c9a7', type: 'water', proper: true,
    question: 'What month do you like?',
    items: ['january','february','march','april','may','june','july','august','september','october','november','december']
  },
  'sea-animals': {
    label: 'Sea Animals', folder: 'sea-animals', ext: 'png', accent: '#4cc9f0', type: 'water',
    question: 'What sea animals do you like?',
    plural: { crab: 'crabs', dolphin: 'dolphins', octopus: 'octopuses', penguin: 'penguins', shark: 'sharks', turtle: 'turtles', whale: 'whales' },
    items: ['crab','dolphin','fish','jellyfish','octopus','penguin','shark','squid','turtle','whale']
  },
  seasons: {
    label: 'Seasons', folder: 'seasons', ext: 'png', accent: '#90be6d', type: 'fire',
    question: 'What season do you like?',
    items: ['spring','summer','autumn','winter']
  },
  sports: {
    label: 'Sports', folder: 'sports', ext: 'png', accent: '#f94144', type: 'fighting',
    question: 'What sport do you like?',
    items: ['badminton','baseball','basketball','dodgeball','soccer','tabletennis','tennis','volleyball']
  },
  vegetables: {
    label: 'Vegetables', folder: 'vegetables', ext: 'png', accent: '#43aa8b', type: 'grass',
    question: 'What vegetables do you like?',
    items: ['cabbages','carrots','corn','mushrooms','onions','peas','peppers','potatoes','pumpkins','tomatoes']
  },
  prefectures: {
    label: 'Prefectures', folder: 'prefectures', ext: 'png', accent: '#ef476f', type: 'metal', proper: true,
    question: 'What prefecture do you like?',
    items: ['aichi','chiba','fukuoka','hokkaido','hyogo','kanagawa','osaka','saitama','shizuoka','tokyo']
  },
  feelings: {
    label: 'Feelings', folder: 'feelings', ext: 'png', accent: '#ff9f1c', type: 'fairy',
    question: 'How are you?', sentence: 'I am',
    items: ['happy','sad','angry','hungry','sleepy','tired','hot','cold']
  },
  prizes: {
    disabled: true, // hidden from the menu; set to false to bring it back
    label: 'Prizes', folder: 'prizes', accent: '#ffd166', type: 'lightning', photo: true,
    question: 'Which prize do you like?',
    items: [
      {file:'1-1',ext:'png'},{file:'1-2',ext:'png'},{file:'2-1',ext:'png'},{file:'2-2',ext:'png'},
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

// Card frame colours per TCG energy type
const CARD_TYPES = {
  grass:     { name: 'Grass',     top: '#d8f0b0', bottom: '#6fbf4a', dark: '#2f7a22', orb: '#3d9950' },
  fire:      { name: 'Fire',      top: '#ffd9b0', bottom: '#f07a3a', dark: '#a8321a', orb: '#e0502a' },
  water:     { name: 'Water',     top: '#cdeeff', bottom: '#4aa3e0', dark: '#1a5c96', orb: '#2a86d0' },
  lightning: { name: 'Lightning', top: '#fff6b8', bottom: '#f5cc2a', dark: '#9a7400', orb: '#e8b400' },
  psychic:   { name: 'Psychic',   top: '#f1d6ff', bottom: '#b06ad8', dark: '#6a2a92', orb: '#9a4ccc' },
  fighting:  { name: 'Fighting',  top: '#ffe0c4', bottom: '#d9864a', dark: '#8a4618', orb: '#c46a2a' },
  metal:     { name: 'Metal',     top: '#eef2f6', bottom: '#9fb0c0', dark: '#4c5b6a', orb: '#7d8fa0' },
  colorless: { name: 'Colorless', top: '#fffaf0', bottom: '#d9ccb0', dark: '#7c6a48', orb: '#b7a37a' },
  darkness:  { name: 'Darkness',  top: '#e4d6f5', bottom: '#8a62c4', dark: '#2e1a5c', orb: '#5b3a99' },
  fairy:     { name: 'Fairy',     top: '#ffe2f1', bottom: '#f08cc0', dark: '#a02c6a', orb: '#e0609c' }
};

const MODES = {
  classic: { label: 'Classic', blurb: 'One student says it — you kick it!', color: '#ffcb05' },
  vote:    { label: 'Class Vote', blurb: 'Click a card once per student. One lucky card scores!', color: '#4cd964' },
  teams:   { label: 'Team Battle', blurb: 'Red vs Blue penalty shootout — 5 kicks each!', color: '#ff5a5a' }
};

const SPECIAL_LABELS = { tabletennis: 'Table Tennis', blackcat: 'Black Cat' };

const GOAL_LINES = ['What a strike!', 'Top corner!', 'Unstoppable!', 'The crowd goes wild!', 'Super shot!', 'Amazing!'];
const HALLOWEEN_GOAL_LINES = ['Spooktacular!', 'Boo-tiful shot!', 'Fang-tastic!', 'Ghoulishly good!', 'Hauntingly good!', 'Wicked shot!'];
const HALLOWEEN_SAVE_LINES = ['Boo! Nice try!', 'A spooky save!', 'So close!', 'The keeper got it!', 'Next time!'];
const HALLOWEEN_ROUND_LINES = ['Trick or treat!', 'Spooky time!', 'Say it loud!', 'You can do it!'];
const SAVE_LINES = ['Great save!', 'So close!', 'Nice try!', 'The keeper got it!', 'Next time!'];

function itemPath(cat, item) {
  const base = `assets/categories/${cat.folder}`;
  return typeof item === 'string' ? `${base}/${item}.${cat.ext}` : `${base}/${item.file}.${item.ext}`;
}

function itemLabel(cat, item) {
  if (typeof item !== 'string') return `Prize ${item.file}`;
  if (SPECIAL_LABELS[item]) return SPECIAL_LABELS[item];
  return item.charAt(0).toUpperCase() + item.slice(1);
}

// "I like apples!" / "I am happy!" / "I like Tokyo!" / "I like this one!"
function itemSentence(cat, item) {
  if (typeof item !== 'string') return 'I like this one!';
  const label = (cat.plural && cat.plural[item]) || itemLabel(cat, item);
  const word = cat.proper ? label : label.toLowerCase();
  return `${cat.sentence || 'I like'} ${word}!`;
}

// Categories shown in the menu (Prizes is switched off with `disabled: true`)
const ACTIVE_CATEGORY_KEYS = Object.keys(CATEGORIES).filter(k => !CATEGORIES[k].disabled);
