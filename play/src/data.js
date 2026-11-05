/* All tuning for Natta El Sotouh lives here. Logic files only read these tables. */

const W = 360, H = 640;
const METER = 20;
const COIN_SCORE = 5;

const PHYS = {
  gravity: 1500, bounce: 760, spring: 1180, shoes: 1020, shoesBounces: 4,
  stomp: 640, kiteSpeed: 660, kiteTime: 2.4, maxVx: 250, accel: 4400, drag: 4200, turnBoost: 2.2,
  halfH: 26, radius: 19, feetSlack: 12, camLine: 250, hurtHop: 420, invuln: 1.1
};

/* Controls. Modes: drag (relative finger drag, default), tilt, buttons (left/right halves), mouse (desktop follow). Keys always work.
   drag: the hero sits exactly where it was when the finger landed and then follows the finger 1:1 (gain = world px per finger px, 1 = it stays under the finger),
   follow = 1/s pull toward the target (high = almost no lag), maxSpeed = px/s cap, release = px/s^2 braking after the finger lifts. (leash is only used by the old axis path.)
   tilt: range = degrees from neutral for full speed, dead = degrees ignored, curve > 1 softens small tilts, smooth = 1/s low-pass. */
const CONTROL_MODES = ['drag', 'tilt', 'buttons', 'mouse'];
const DEFAULT_CONTROLS = 'drag';
const CONTROLS = {
  drag: { gain: 1, follow: 26, leash: 90, still: 2, maxSpeed: 1500, release: 6000 },
  tilt: { range: 16, dead: 2.5, curve: 1.25, smooth: 14, calibrateAfter: 0.25 },
  mouse: { follow: 22, dead: 6, maxSpeed: 1500 },
  face: 0.12,
  hintMoves: 70
};

/* Game feel for the free jump. edge = extra px of forgiveness on each side of a ledge (the hero is eased onto it at 'pull' 1/s),
   slow = brief slow-motion on spring launches, pop = stretch pop, land = squash on landing (x widens, y shrinks). */
const FEEL = {
  edge: 16, pull: 22, slowTime: 0.13, slowScale: 0.4, popTime: 0.3, popX: 0.2, popY: 0.26, landX: 0.24, landY: 0.3
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
/* Reachability guarantee: every ledge must be within `margin` of what a normal bounce can reach (gap and sideways distance), see jumpReach in gen.js. */
const REACH = { margin: 0.8, maxGapShare: 0.9 };

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

/* The Tower (charge-jump mode). Hold to charge, aim left or right, release to leap. Walls bounce, no wrap.
   power 0..1 maps to launch speed vmin..vmax; aim -1..1 maps to +-maxAngle from straight up. The tower is seeded: the same every time.
   snapPower = the most charge a jump FROM a laundry line may need (it snaps snap.warn seconds after you land). mix: platform weights from a floor on (the last stop at or below the floor is used). Floors that are a multiple of checkEvery are solid ground with a flag. */
const TOWER = {
  seed: 20260, top: 100, floorH: 92, checkEvery: 10, wall: 14, radius: 14,
  gravity: 1500, vmin: 430, vmax: 930, maxAngle: 0.96, chargeTime: 0.95, wallBounce: 0.7, edge: 8,
  dragPx: 90, aimRate: 1.7, mouseRange: 110, widthScale: 1.25, maxDx: 165, camRest: 470,
  coinChance: 0.35, catchCoin: 0.45, secondCatch: 0.35, previewTime: 1.7,
  snap: { warn: 1.2, fall: 0.6, back: 3.5 }, snapPower: 0.7, slick: { friction: 150, keep: 0.4 }, fallLine: 3,
  mix: [
    { f: 1, w: { balcony: 10 } },
    { f: 5, w: { balcony: 8, ac: 4 } },
    { f: 14, w: { balcony: 5, ac: 4, laundry: 3, tank: 3 } },
    { f: 40, w: { ac: 3, laundry: 3, tank: 4, tower: 5, minaret: 2 } },
    { f: 70, w: { laundry: 3, tower: 3, minaret: 5, cloud: 4 } }
  ]
};

const TOWER_LINES = {
  ground: { ar: 'رجعت للدور الأرضي يا مرعي!', en: 'Back on the ground floor, Mar3y!' },
  big: [
    { ar: 'نزلت {0} أدوار في ثانية!', en: 'Down {0} floors in a blink!' },
    { ar: 'ده انت أسانسير مش قطة!', en: 'You are an elevator, not a cat!' },
    { ar: 'الجارة بتسأل: مين اللي وقع؟', en: 'The neighbour asks: who fell?' }
  ],
  small: [
    { ar: 'وقعت {0} أدوار، معلش', en: '{0} floors down, never mind' },
    { ar: 'يلا من الأول بالراحة', en: 'Again, nice and easy' }
  ],
  win: { ar: 'وصلت السطوح يا مرعي!', en: 'The rooftop, Mar3y!' }
};

/* perk: passive effect of the hero (read by src/perks.js). bio and perk text are shown on the hero card. */
const HEROES = [
  { id: 'marei', ar: 'مرعي', en: 'Mar3y', price: 0, unlockScore: 0, size: 56,
    bio: { ar: 'قط السطوح الأبيض الرايق. شايف الدنيا من فوق وماشي على مهله.', en: 'The calm white rooftop cat. Sees the world from above and is in no hurry.' },
    perk: { id: 'none', ar: 'من غير مميزات، بس أحلى شخصية', en: 'No perk, just the best personality' } },
  { id: 'shams', ar: 'شمس', en: 'Shams', price: 150, unlockScore: 250, size: 56,
    bio: { ar: 'عنزة السطوح بالإيشارب الأحمر. بتمضغ القش وبتنط من غير خوف.', en: 'The rooftop goat in a red scarf. Chews straw and jumps without fear.' },
    perk: { id: 'none', ar: 'من غير مميزات، بس ذوق عالي', en: 'No perk, just good taste' } },
  { id: 'hanafy', ar: 'عم حنفي', en: 'Hanafy', price: 250, unlockScore: 350, size: 56,
    bio: { ar: 'حمار إمبابة الشغّيل. شايل الدنيا على ضهره وبيرفس الأرض رفسة تطلّعك.', en: 'The hard-working donkey of Imbaba. Carries the world and kicks the ground to launch you.' },
    perk: { id: 'kick', firstBounce: 1.5, ar: 'رفسة البداية: أول نطّة أعلى مرة ونص', en: 'Kick-start: the first bounce is one and a half times higher' } },
  { id: 'batta', ar: 'بطّة', en: 'Batta', price: 400, unlockScore: 500, size: 56,
    bio: { ar: 'بطة الدلتا الشيك. بتشرب الشاي على مهلها وبتفرد جناحاتها لما الدنيا تقع.', en: 'The stylish duck of the Delta. Sips her tea slowly and spreads her wings when things fall apart.' },
    perk: { id: 'glide', fallCap: 330, ar: 'تعويم: بتفرد جناحاتها وبتنزل براحة', en: 'Glide: spreads her wings and falls slowly' } },
  { id: 'hadeel', ar: 'هديل', en: 'Hadeel', price: 550, unlockScore: 650, size: 56,
    bio: { ar: 'حمامة زاجل رقيقة. كل الحمام صحابها وبيسلّموا عليها.', en: 'A gentle homing pigeon. Every pigeon is her friend and says hello.' },
    perk: { id: 'pigeons', ar: 'صحبة الحمام: الحمام ما بيهاجمهاش', en: 'Pigeon pals: pigeons never attack her' } },
  { id: 'shawish', ar: 'شاويش', en: 'Shawish', price: 700, unlockScore: 800, size: 56,
    bio: { ar: 'كلب الحارة الكبير. صفّارته على رقبته وبيشم العملة من بعيد.', en: 'The big dog of the alley. Whistle round his neck and he sniffs out coins from afar.' },
    perk: { id: 'nose', magnet: 95, ar: 'مناخير العملة: بيجذب العملات من بعيد', en: 'Coin nose: pulls coins in from far away' } }
];

/* Looks (cosmetics): worn per hero, one per slot. Art is in art/looks.js. */
const LOOK_SLOTS = ['hat', 'eyes', 'neck'];
const SLOT_NAMES = { hat: { ar: 'على الراس', en: 'Hat' }, eyes: { ar: 'على العين', en: 'Eyes' }, neck: { ar: 'على الرقبة', en: 'Neck' } };
const LOOKS = [
  { id: 'tarboosh', slot: 'hat', ar: 'طربوش', en: 'Tarboosh', price: 80 },
  { id: 'jasmine', slot: 'hat', ar: 'تاج الفل', en: 'Jasmine crown', price: 120 },
  { id: 'shades', slot: 'eyes', ar: 'نضارة شمس', en: 'Sunglasses', price: 90 },
  { id: 'scarf', slot: 'neck', ar: 'إيشارب الماتش', en: 'Football scarf', price: 100 }
];

/* Permanent upgrades: levels[i] is what level i + 1 costs and gives. "double" is a one-run boost, bought again each time. */
const UPGRADES = {
  shield: { icon: 'bead', ar: 'خرزة البداية', en: 'Starting bead', descAr: 'كل جولة تبدأها وفي إيدك خرزة زرقا بتحميك', descEn: 'Every run starts with a blue bead shield', levels: [{ price: 200, value: 1 }] },
  kite: { icon: 'kite', ar: 'خيط أطول', en: 'Longer kite', descAr: 'طيارة الورق بتطير وقت أطول', descEn: 'The kite glides for longer', levels: [{ price: 150, value: 0.6 }, { price: 300, value: 1.2 }, { price: 500, value: 1.8 }] },
  magnet: { icon: 'coin', ar: 'مغناطيس العملة', en: 'Coin magnet', descAr: 'العملات القريبة بتجري عليك', descEn: 'Nearby coins fly to you', levels: [{ price: 120, value: 60 }, { price: 250, value: 95 }, { price: 420, value: 130 }] },
  double: { icon: 'coin', ar: 'عملات بالضعف', en: 'Double coins', descAr: 'الجولة الجاية كل عملة بعملتين', descEn: 'Next run, every coin counts twice', boost: true, levels: [{ price: 90, value: 2 }] }
};

/* Daily challenge: one twist a day, picked from the date, the same for everyone. */
const DAILY = {
  twists: [
    { id: 'wind', ar: 'سطوح الهوا', en: 'Windy rooftops', descAr: 'الهوا بيزقّك يمين وشمال، اتحكّم', descEn: 'The wind shoves you left and right', target: 130, wind: 70 },
    { id: 'laundry', ar: 'يوم الغسيل', en: 'Laundry day', descAr: 'حبال الغسيل في كل حتة وبتتقطع', descEn: 'Laundry lines everywhere, and they snap', target: 120, weightAdd: { laundry: 5 } },
    { id: 'pigeons', ar: 'مهرجان الحمام', en: 'Pigeon festival', descAr: 'حمام كتير بس العملات أكتر', descEn: 'Many more pigeons, but more coins too', target: 130, pigeonChance: 0.24, pigeonFrom: 10, coinChance: 0.5, stompCoins: 2, spacing: 280 },
    { id: 'night', ar: 'جولة بالليل', en: 'Night run', descAr: 'ضلمة والنور من الدبابير المنورة', descEn: 'Dark skies, lit by fireflies', target: 150, night: true },
    { id: 'spring', ar: 'يوم الدِش', en: 'Dish day', descAr: 'أطباق الدش النطّاطة في كل مكان', descEn: 'Bouncy satellite dishes all around', target: 190, weightAdd: { dish: 5 } }
  ],
  targetStep: 10, targetSteps: 5,
  reward: { base: 80, perStreak: 20, maxStreak: 7 },
  missionBonus: 60, keepBests: 30
};

const MISSIONS = [
  { id: 'coins', stat: 'coins', mode: 'sum', n: 50, reward: 40, ar: 'اجمع {0} عملة', en: 'Collect {0} coins' },
  { id: 'stomp', stat: 'pigeons', mode: 'sum', n: 3, reward: 50, ar: 'اضرب {0} حمامات من فوق', en: 'Stomp {0} pigeons' },
  { id: 'reach', stat: 'meters', mode: 'max', n: 150, reward: 60, ar: 'اوصل {0} متر في جولة', en: 'Reach {0} m in one run' },
  { id: 'ful', stat: 'ful', mode: 'sum', n: 3, reward: 40, ar: 'خُد {0} أطباق فول', en: 'Grab {0} bowls of ful' },
  { id: 'kite', stat: 'kites', mode: 'sum', n: 2, reward: 45, ar: 'خُد {0} طيارات ورق', en: 'Catch {0} kites' },
  { id: 'runs', stat: 'runs', mode: 'sum', n: 3, reward: 30, ar: 'العب {0} جولات', en: 'Play {0} runs' }
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
  { m: 0, top: '#c9a7e8', bot: '#ffb59e' },
  { m: 70, top: '#c1a0e6', bot: '#ffb0a0' },
  { m: 130, top: '#a98fdc', bot: '#f9a9a8' },
  { m: 200, top: '#8d78d0', bot: '#eda2b4' },
  { m: 400, top: '#6a56b4', bot: '#cf98c0' },
  { m: 700, top: '#3d2c6b', bot: '#8466b8' },
  { m: 1000, top: '#241a4a', bot: '#4a3a86' }
];

/* The quick pass (تجربة كل حاجة): every hero, look and upgrade (at max) is free to use for this many hours. Nothing is kept afterwards. */
const PASS = { hours: 48 };

const FACADE = { fadeFrom: 55, fadeTo: 110, factor: 0.55, tile: 320 };

const SAVE_KEY = 'natta.save.v1';

const NATTA_DATA = {
  W, H, METER, COIN_SCORE, PHYS, FEEL, TOWER, TOWER_LINES, PLATFORMS, WEIGHT_STOPS, GAP, MAX_UNSAFE_RUN, REACH, COIN, POWERUPS, ENEMIES,
  HEROES, DEFAULT_HERO, CONTROL_MODES, DEFAULT_CONTROLS, CONTROLS, LOOK_SLOTS, SLOT_NAMES, LOOKS, UPGRADES, DAILY, MISSIONS, MILESTONES, FALL_LINES, SKY, PASS, FACADE, SAVE_KEY
};
if (typeof module !== 'undefined' && module.exports) module.exports = NATTA_DATA;
