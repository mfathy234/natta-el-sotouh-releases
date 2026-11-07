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
   snapPower = the most charge a jump FROM a laundry line may need (it snaps snap.warn seconds after you land). Ledge widths, sideways reach and platform mix by floor are in TOWER_TIERS below. Floors that are a multiple of checkEvery are solid ground with a flag. */
const TOWER = {
  seed: 20260, top: 100, floorH: 92, checkEvery: 10, wall: 14, radius: 14,
  gravity: 1500, vmin: 430, vmax: 930, maxAngle: 0.96, chargeTime: 0.95, wallBounce: 0.7, edge: 8,
  dragPx: 90, aimRate: 1.7, mouseRange: 110, maxDx: 165, camRest: 470,
  coinChance: 0.35, catchCoin: 0.45, secondCatch: 0.35, previewTime: 1.7,
  snap: { warn: 1.2, fall: 0.6, back: 3.5 }, snapPower: 0.7, slick: { friction: 150, keep: 0.4 }, fallLine: 3
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

/* ---------- Difficulty tiers ----------
   Free mode: tier = floor(metres / TIER_STEP), the last row repeats. Every tier adds one thing and the first two are gentle.
   widthK = ledge width multiplier, gapK = 0..1 position on the GAP range, gapMul = scale on the gaps, w = platform weights,
   pigeon / bag = chance per ledge (0 = none), crow / slipper = interval multiplier (0 = none), spacing = min px between ground enemies,
   coin = coin chance per ledge, nbr = [bucket, pull] neighbour hazards on, ar / en = banner text after "الدور <ordinal>:". */
const TIER_STEP = 50;
const ORDINALS = { ar: ['الأول', 'التاني', 'التالت', 'الرابع', 'الخامس', 'السادس', 'السابع', 'التامن', 'التاسع', 'العاشر'] };
const TIERS = [
  { widthK: 1.4, gapK: 0, gapMul: 0.88, coin: 0.4, spacing: 600, pigeon: 0, bag: 0, crow: 0, slipper: 0, nbr: [0, 0], w: { balcony: 10, ac: 4, dish: 1.2 },
    ar: 'نط براحة، الأدوار واسعة', en: 'Easy does it, wide ledges' },
  { widthK: 1.35, gapK: 0.1, gapMul: 0.92, coin: 0.36, spacing: 600, pigeon: 0, bag: 0, crow: 0, slipper: 0, nbr: [0, 0], w: { balcony: 9, ac: 4, dish: 1.5, laundry: 2.5 },
    ar: 'حبال الغسيل بتقطع!', en: 'Laundry lines snap!' },
  { widthK: 1.3, gapK: 0.2, gapMul: 0.96, coin: 0.34, spacing: 600, pigeon: 0, bag: 0, crow: 0, slipper: 0, nbr: [0, 0], w: { balcony: 7, ac: 4, dish: 1.5, laundry: 2.5, plank: 2, shutter: 1.5 },
    ar: 'الألواح بتتحرك والشيش بيتقلب!', en: 'Moving planks and flipping shutters!' },
  { widthK: 1.25, gapK: 0.3, gapMul: 1, coin: 0.32, spacing: 560, pigeon: 0.05, bag: 0, crow: 0, slipper: 0, nbr: [0, 0], w: { balcony: 5, ac: 3, dish: 1.5, laundry: 3, plank: 2.5, shutter: 2, tank: 3 },
    ar: 'الحمام وصل!', en: 'The pigeons have arrived!' },
  { widthK: 1.2, gapK: 0.4, gapMul: 1, coin: 0.3, spacing: 500, pigeon: 0.06, bag: 0, crow: 0, slipper: 1.7, nbr: [0, 0], w: { balcony: 4, ac: 3, dish: 1.5, laundry: 3, plank: 2.5, shutter: 2, tank: 4, tower: 1 },
    ar: 'الشباشب بتنزل من فوق!', en: 'Slippers rain down!' },
  { widthK: 1.15, gapK: 0.5, gapMul: 1, coin: 0.3, spacing: 460, pigeon: 0.07, bag: 0, crow: 1.6, slipper: 1.5, nbr: [1, 0], w: { balcony: 3, ac: 2, dish: 1.5, laundry: 3, plank: 3, shutter: 2, tank: 6, tower: 2 },
    ar: 'الغربان والجيران صحيوا!', en: 'Crows, and the neighbours woke up!' },
  { widthK: 1.1, gapK: 0.6, gapMul: 1, coin: 0.3, spacing: 420, pigeon: 0.08, bag: 0.06, crow: 1.4, slipper: 1.4, nbr: [1, 1], w: { ac: 1, dish: 1.5, laundry: 3, plank: 3, shutter: 2, tank: 5, tower: 5, minaret: 1 },
    ar: 'أكياس بلاستيك والجارة بتسحب الغسيل!', en: 'Plastic bags, and a neighbour pulls the laundry!' },
  { widthK: 1.05, gapK: 0.8, gapMul: 1, coin: 0.3, spacing: 400, pigeon: 0.09, bag: 0.07, crow: 1.2, slipper: 1.2, nbr: [1, 1], w: { dish: 1.5, laundry: 2.5, plank: 3, shutter: 2, tank: 3, tower: 4, minaret: 3, cloud: 1 },
    ar: 'المسافات بقت أطول!', en: 'The gaps get longer!' },
  { widthK: 1, gapK: 0.9, gapMul: 1, coin: 0.3, spacing: 380, pigeon: 0.1, bag: 0.08, crow: 1.1, slipper: 1.1, nbr: [1, 1], w: { dish: 1, laundry: 2, plank: 3, shutter: 2, tower: 2, minaret: 6, cloud: 4 },
    ar: 'المنارات والسحاب، ركّز!', en: 'Minarets and clouds, focus!' },
  { widthK: 1, gapK: 1, gapMul: 1, coin: 0.3, spacing: 380, pigeon: 0.1, bag: 0.08, crow: 1, slipper: 1, nbr: [1, 1], w: { laundry: 2, plank: 3, shutter: 2, minaret: 3, cloud: 9 },
    ar: 'ده الدور اللي بجد!', en: 'Now it is for real!' }
];

/* The Tower: tier = floor((floor + shift) / checkEvery). scale = ledge width multiplier, reach = share of TOWER.maxDx a ledge may sit sideways from the one below,
   need = how many (charge, aim) pairs must land on a ledge from its middle (more = more forgiving), mix = platform weights. */
const TOWER_TIERS = [
  { scale: 1.75, reach: 0.3, need: 30, mix: { balcony: 10 }, ar: 'أدوار واسعة وصديقة', en: 'Wide, friendly ledges' },
  { scale: 1.65, reach: 0.4, need: 22, mix: { balcony: 8, ac: 2 }, ar: 'مكيفات بتزحلق', en: 'Slippery air-conditioners' },
  { scale: 1.55, reach: 0.5, need: 16, mix: { balcony: 6, ac: 3, tank: 2 }, ar: 'خزانات المية', en: 'Water tanks' },
  { scale: 1.45, reach: 0.6, need: 12, mix: { balcony: 5, ac: 4, laundry: 1.5, tank: 3 }, ar: 'حبال الغسيل بتقطع', en: 'Laundry lines snap' },
  { scale: 1.4, reach: 0.7, need: 9, mix: { balcony: 4, ac: 4, laundry: 3, tank: 3, tower: 1 }, ar: 'أبراج الحمام', en: 'Pigeon towers' },
  { scale: 1.35, reach: 0.8, need: 7, mix: { ac: 3, laundry: 3, tank: 4, tower: 3 }, ar: 'الدنيا بتصعب', en: 'It gets harder' },
  { scale: 1.3, reach: 0.9, need: 6, mix: { ac: 3, laundry: 3, tank: 4, tower: 5, minaret: 2 }, ar: 'المنارات', en: 'Minarets' },
  { scale: 1.25, reach: 1, need: 5, mix: { laundry: 3, tower: 4, minaret: 5, cloud: 2 }, ar: 'قرّبنا من السحاب', en: 'Nearing the clouds' },
  { scale: 1.25, reach: 1, need: 5, mix: { laundry: 3, tower: 3, minaret: 5, cloud: 4 }, ar: 'فوق السحاب', en: 'Above the clouds' },
  { scale: 1.25, reach: 1, need: 5, mix: { laundry: 3, tower: 3, minaret: 5, cloud: 4 }, ar: 'البواب مستنيك!', en: 'The doorman is waiting!' }
];

/* Neighbours (الجيران), free mode. bucket: a window opens on one side, a hand with a bucket takes aim (red column, shadow on your row, "!"),
   then water pours down: it knocks you down a little and washes coins away. pull: a hand reaches out of a window, the laundry line shakes with "!",
   then the line is pulled in. every = seconds between hazards, warn = telegraph time. */
const NEIGHBOURS = {
  bucket: { every: [16, 24], warn: 1.25, lock: 0.3, pour: 0.55, speed: 1100, width: 44, knock: 520, inv: 0.7, washR: 30 },
  pull: { every: [20, 30], warn: 1.1, pull: 0.45, minY: 110, maxY: 430 },
  window: { w: 58, h: 64, y: 78 }
};

/* Rooftop events, free mode: one about every `every` metres from `first`, picked from `pool` (never twice in a row), announced with a banner.
   flock: a band at your height lights up, then birds sweep across. icecream: a cart bell rings from the street, then cones drift up for `time` s (each worth `coins` coins). powercut: dark, platforms glow.
   wedding: firework rockets on ledges launch you. gust: arrows on one side, then a sideways push. */
const EVENTS = {
  every: 100, first: 100, jitter: 20, gap: 40,
  pool: ['flock', 'icecream', 'powercut', 'wedding', 'gust'],
  flock: { ar: 'سرب حمام عدّي!', en: 'A pigeon flock!', warn: 1.4, birds: 8, speed: 560, band: 76, r: 13 },
  icecream: { ar: 'عربية الآيس كريم! الحق الكورنيتات', en: 'The ice-cream cart! Catch the cones', warn: 1, time: 4, cones: 7, coins: 2, drift: 26, spread: 120, r: 24 },
  powercut: { ar: 'الكهربا قطعت!', en: 'Power cut!', time: 5, fade: 0.7, dark: 0.82 },
  wedding: { ar: 'فرح في الشارع! اركب الصاروخ', en: 'A wedding! Ride the firework', time: 9, power: 1300, rockets: 3, r: 26 },
  gust: { ar: 'هبّة هوا من الجنب!', en: 'Wind gust!', warn: 1.2, time: 3.2, push: 150 }
};

/* Tower boss El Bawab (البواب): appears when you reach the flag-ground `floors` below the roof, rises from `start` floors under it at `rise` px/s
   (faster when you are far above, slower when close), throws slippers and keys with a red arc and "!" first. A hit knocks you off the ledge.
   Catching up with your feet sends you back to the flag-ground. Reaching the roof beats him. */
const BAWAB = {
  floors: 10, start: 2.6, rise: 15, closeFloors: 0.9, farFloors: 2.2, minK: 0.5, maxK: 1.6, size: 92,
  throw: { every: [5.5, 7.5], warn: 1, speed: 480, r: 12, hop: 330, push: 190, inv: 0.9 },
  lines: {
    start: { ar: 'البواب: واقف عندك يا قطة!', en: 'El Bawab: stop right there, cat!' },
    caught: { ar: 'البواب مسكك! من الأول', en: 'El Bawab caught you! Again' },
    beat: { ar: 'البواب: خلاص خلاص، السطوح بتاعتك يا مرعي!', en: 'El Bawab: fine, fine, the roof is yours, Mar3y!' }
  }
};

/* Combos: stomps, spring launches and coins within `window` s of each other build a chain. Each step names the chain length, the multiplier on the bonus points
   and the shout shown big in the middle. points = base bonus per kind (multiplied by mult - 1 on top of what the action already gives). */
const COMBO = {
  window: 2.2, points: { stomp: 10, spring: 6, coin: 2 },
  steps: [
    { n: 3, mult: 1.5, ar: 'عاش!', en: 'Nice!', quiet: true },
    { n: 6, mult: 2, ar: 'قشطة!', en: 'Smooth!' },
    { n: 10, mult: 3, ar: 'يا جامد!', en: 'Awesome!' },
    { n: 16, mult: 4, ar: 'عنب!', en: 'Grape-tastic!' }
  ]
};

/* On-screen notices (src/notify.js). One big strip at a time; the rest wait in a queue (best priority first, `gap` s apart) and low-priority ones that waited
   longer than `stale` s are dropped. Minor notices (ghost, rocket) are small and fade; combo shouts are small, `shoutGap` s apart and skipped while a strip or a
   telegraph is up. `loud` holds the old busy numbers, used when the "fewer pop-ups" setting is off. */
const BANNER = { time: 2.4, shoutTime: 0.9, minorTime: 1.6, y: 142, gap: 0.35, stale: 3.2, shoutGap: 3.5, shoutY: 96 };
const NOTIFY = {
  prio: { boss: 3, event: 2, tier: 1, minor: 0 },
  pops: { life: 0.9, max: 3, mergeT: 0.6, rise: 30, size: 17 },
  line: { gap: 2.2 },
  toast: { poll: 600, show: 2400 },
  bark: 3,
  loud: { gap: 0.1, stale: 99, shoutGap: 0, bark: 1.2, popLife: 1.3, popMax: 99, popRise: 40, popSize: 20, strips: 2 }
};

/* Ghost race: the best free run is sampled every `dt` s and drawn translucent in later runs. key is its own localStorage entry. */
const GHOST = { key: 'natta.ghost.v1', dt: 0.2, max: 3000, alpha: 0.4, line: { ar: 'عدّيت شبحك!', en: 'You passed your ghost!' } };

/* Weekly Tower: `top` floors, seeded by the ISO week, starts `tierShift` tiers up. reward = coins for the first clear of a week. */
const WEEKLY = { top: 30, seedBase: 770000, tierShift: 3, reward: 150 };


const NATTA_DATA = {
  W, H, METER, COIN_SCORE, PHYS, FEEL, TOWER, TOWER_LINES, PLATFORMS, WEIGHT_STOPS, GAP, MAX_UNSAFE_RUN, REACH, COIN, POWERUPS, ENEMIES,
  HEROES, DEFAULT_HERO, CONTROL_MODES, DEFAULT_CONTROLS, CONTROLS, LOOK_SLOTS, SLOT_NAMES, LOOKS, UPGRADES, DAILY, MISSIONS, MILESTONES, FALL_LINES, SKY, PASS, FACADE, SAVE_KEY,
  TIER_STEP, ORDINALS, TIERS, TOWER_TIERS, NEIGHBOURS, EVENTS, BAWAB, COMBO, BANNER, NOTIFY, GHOST, WEEKLY
};
if (typeof module !== 'undefined' && module.exports) module.exports = NATTA_DATA;
