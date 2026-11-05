/* All tuning for Natta El Sotouh lives here. Logic files only read these tables. */

const W = 360, H = 640;
const METER = 20;
const COIN_SCORE = 5;

const PHYS = {
  gravity: 1500, bounce: 760, spring: 1180, shoes: 1020, shoesBounces: 4,
  stomp: 640, kiteSpeed: 660, kiteTime: 2.4, maxVx: 250, accel: 2400, drag: 1800,
  halfH: 26, radius: 19, feetSlack: 6, camLine: 250, hurtHop: 420, invuln: 1.1
};

const PLATFORMS = {
  balcony: { w: 66, kind: 'normal' },
  ac: { w: 62, kind: 'normal' },
  dish: { w: 56, kind: 'spring' },
  laundry: { w: 68, kind: 'breakable' },
  plank: { w: 66, kind: 'moving', speed: [55, 110] },
  shutter: { w: 62, kind: 'vanishing' },
  tank: { w: 76, kind: 'normal' },
  tower: { w: 58, kind: 'normal' },
  minaret: { w: 46, kind: 'normal' },
  cloud: { w: 64, kind: 'normal' }
};

/* Weights by height in metres; between two stops the weights are blended. */
const WEIGHT_STOPS = [
  { m: 0, w: { balcony: 10, ac: 4, dish: 1, laundry: 0, plank: 0, shutter: 0 } },
  { m: 30, w: { balcony: 8, ac: 5, dish: 1.5, laundry: 3, plank: 1.5, shutter: 2 } },
  { m: 70, w: { balcony: 3, ac: 2, dish: 1.5, laundry: 3, plank: 3, shutter: 2, tank: 6, tower: 2 } },
  { m: 130, w: { ac: 1, dish: 1.5, laundry: 3, plank: 3, shutter: 2, tank: 5, tower: 5, minaret: 2 } },
  { m: 190, w: { dish: 1, laundry: 2, plank: 3, shutter: 2, tower: 2, minaret: 7, cloud: 4 } },
  { m: 300, w: { laundry: 2, plank: 3, shutter: 2, minaret: 3, cloud: 9 } }
];

/* Vertical gap between platforms (px). The jump reaches about 190 px, so gaps stay under that. */
const GAP = { min: [58, 96], max: [100, 158], fullAt: 500 };
const MAX_UNSAFE_RUN = 2;

const COIN = { chance: 0.3, lineChance: 0.07 };

const POWERUPS = {
  kite: { from: 25, weight: 2, size: 36 },
  ful: { from: 12, weight: 3, size: 34 },
  bead: { from: 18, weight: 3, size: 30 },
  chance: 0.05, minSpacingPx: 1500
};

const ENEMIES = {
  pigeon: { from: 30, chance: 0.1, aim: 0.95, lock: 0.25, dive: 470, diveTime: 1.15, r: 17, range: 430 },
  bag: { from: 45, chance: 0.08, speed: [40, 75], r: 18 },
  crow: { from: 70, every: [10, 15], warn: 0.95, speed: 330, r: 17 },
  slipper: { from: 40, every: [7, 11], warn: 1.05, fall: 640, r: 15 },
  minSpacingPx: 380
};

const HEROES = [
  { id: 'marei', ar: 'مرعي', en: 'Mar3y', price: 0, unlockScore: 0, size: 56 },
  { id: 'shams', ar: 'شمس', en: 'Shams', price: 150, unlockScore: 250, size: 56 }
];
const DEFAULT_HERO = 'marei';

const MILESTONES = [
  { m: 30, ar: 'وصلت الدور العاشر!', en: 'Floor ten already!' },
  { m: 60, ar: 'يا عم الحاج بالراحة!', en: 'Easy there, Haj!' },
  { m: 100, ar: 'السطوح يا باشا، الهوا حلو!', en: 'The rooftop! Nice breeze!' },
  { m: 150, ar: 'سلّم على الحمام!', en: 'Say hi to the pigeons!' },
  { m: 220, ar: 'المنارة بتسلّم عليك', en: 'The minaret says salam' },
  { m: 300, ar: 'جنب السحاب، قشطة!', en: 'Next to the clouds. Nice!' },
  { m: 400, ar: 'كفاية كده، الشاي برد!', en: 'Enough, your tea is cold!' },
  { m: 550, ar: 'ده انت طيارة من غير موتور!', en: 'A plane with no engine!' },
  { m: 750, ar: 'عاش يا بطل، عنب!', en: 'Bravo champ!' },
  { m: 1000, ar: 'ألف متر! الأسطورة!', en: 'One thousand! Legend!' }
];

const FALL_LINES = [
  { ar: 'يا نهار أبيض!', en: 'Oh no!' },
  { ar: 'الأرض بتنادي عليك', en: 'The ground calls you' },
  { ar: 'وقعت من الدور الكام؟', en: 'Which floor was that?' },
  { ar: 'معلش، ألف سلامة', en: 'Never mind, be well' }
];

/* Sky colours by height (metres): top and bottom of the gradient. */
const SKY = [
  { m: 0, top: '#f7dfb2', bot: '#f4e8cc' },
  { m: 70, top: '#f1d3a0', bot: '#f6e4c0' },
  { m: 130, top: '#cfe0d0', bot: '#f4e6c4' },
  { m: 200, top: '#8fcde0', bot: '#d8ecdc' },
  { m: 400, top: '#5aa6d0', bot: '#b8dde8' },
  { m: 700, top: '#3a5aa0', bot: '#8fb4d8' },
  { m: 1000, top: '#232b63', bot: '#4a5a98' }
];

const FACADE = { fadeFrom: 55, fadeTo: 110, factor: 0.55, tile: 320 };

const SAVE_KEY = 'natta.save.v1';

const NATTA_DATA = {
  W, H, METER, COIN_SCORE, PHYS, PLATFORMS, WEIGHT_STOPS, GAP, MAX_UNSAFE_RUN, COIN, POWERUPS, ENEMIES,
  HEROES, DEFAULT_HERO, MILESTONES, FALL_LINES, SKY, FACADE, SAVE_KEY
};
if (typeof module !== 'undefined' && module.exports) module.exports = NATTA_DATA;
