/* Backgrounds: low-contrast parallax pieces. Ink is a light warm grey-brown and thin, colours are
   lifted towards the haze, so platforms, enemies and coins are always the loudest things on screen. */

const BG_INK = '#c3b49a';
const BG_STROKE = `stroke="${BG_INK}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"`;
const HAZE = { wall: '#f1dfb8', wall2: '#ead3a2', win: '#d8c39c', shut: '#cfdcc8', dome: '#e4d6b4', tank: '#cdd6d8', brick: '#e6cfa4', cloud: '#fffaf0', minaret: '#e6d9b8' };

/* The apartment block seen from outside: only the edges carry detail, the middle stays clear. */
function facadeArt() {
  const win = (x, y) => `<rect x="${x}" y="${y}" width="46" height="70" rx="4" fill="${HAZE.win}" ${BG_STROKE}/>` +
    `<rect x="${x - 6}" y="${y - 6}" width="58" height="8" rx="3" fill="${HAZE.wall2}" ${BG_STROKE}/>` +
    `<rect x="${x - 14}" y="${y}" width="18" height="70" rx="3" fill="${HAZE.shut}" ${BG_STROKE}/><rect x="${x + 42}" y="${y}" width="18" height="70" rx="3" fill="${HAZE.shut}" ${BG_STROKE}/>`;
  return `<rect width="360" height="320" fill="${HAZE.wall}"/>` +
    `<path d="M0 0 H360 M0 160 H360" stroke="${HAZE.wall2}" stroke-width="10"/>` +
    win(26, 40) + win(292, 200) +
    `<rect x="318" y="30" width="10" height="130" fill="${HAZE.wall2}" ${BG_STROKE}/>` +
    `<rect x="28" y="214" width="40" height="22" rx="4" fill="${HAZE.cloud}" ${BG_STROKE}/>` +
    `<path d="M0 0 V320 M360 0 V320" stroke="${HAZE.wall2}" stroke-width="14"/>`;
}

/* Distant Cairo: blocks with water tanks, a dome and a minaret, in one flat haze colour. */
function skylineArt() {
  const block = (x, y, w, c = HAZE.wall2) => `<rect x="${x}" y="${y}" width="${w}" height="${220 - y}" fill="${c}" ${BG_STROKE}/>`;
  const tank = (x, y) => `<rect x="${x}" y="${y - 12}" width="16" height="12" rx="3" fill="${HAZE.tank}" ${BG_STROKE}/><path d="M${x + 3} ${y} v4 M${x + 13} ${y} v4" ${BG_STROKE}/>`;
  return block(0, 120, 70) + tank(10, 120) + block(60, 84, 54, HAZE.brick) + tank(78, 84) +
    `<path d="M120 220 V110 Q150 60 180 110 V220Z" fill="${HAZE.dome}" ${BG_STROKE}/><path d="M150 62 v-14 M144 52 h12" ${BG_STROKE}/>` +
    block(184, 132, 50) + tank(196, 132) +
    `<path d="M240 220 V70 H252 V220Z M236 72 H256 L246 40Z" fill="${HAZE.minaret}" ${BG_STROKE}/>` +
    block(262, 100, 60, HAZE.brick) + tank(272, 100) + tank(296, 100) + block(318, 140, 50);
}

/* Rooftops: pigeon towers, water tanks, laundry, antennas. */
function rooftopsArt() {
  const tank = x => `<rect x="${x}" y="92" width="34" height="26" rx="8" fill="${HAZE.tank}" ${BG_STROKE}/><path d="M${x + 6} 118 l-4 24 M${x + 28} 118 l4 24" ${BG_STROKE}/>`;
  const tower = x => `<path d="M${x} 150 L${x + 8} 70 H${x + 40} L${x + 48} 150Z" fill="${HAZE.brick}" ${BG_STROKE}/><path d="M${x + 6} 70 L${x + 24} 44 L${x + 42} 70Z" fill="${HAZE.dome}" ${BG_STROKE}/>` +
    [0, 1, 2].map(i => `<circle cx="${x + 14 + i * 10}" cy="${92 + i % 2 * 12}" r="3" fill="${HAZE.win}"/>`).join('');
  return `<rect y="140" width="360" height="60" fill="${HAZE.wall2}" ${BG_STROKE}/>` +
    tank(20) + tower(90) + tank(190) + tower(262) +
    `<path d="M10 120 H80 M300 100 V150" ${BG_STROKE}/><path d="M24 120 l4 14 h10 l4 -14" fill="${HAZE.cloud}" ${BG_STROKE}/>` +
    `<path d="M170 140 V90 M158 100 H182 M162 110 H178" ${BG_STROKE}/>`;
}

/* A faraway minaret in the haze, tall and thin. */
function minaretFarArt() {
  return `<path d="M30 360 V120 H50 V360Z" fill="${HAZE.minaret}" ${BG_STROKE}/>` +
    `<rect x="22" y="206" width="36" height="9" rx="3" fill="${HAZE.dome}" ${BG_STROKE}/><rect x="24" y="130" width="32" height="8" rx="3" fill="${HAZE.dome}" ${BG_STROKE}/>` +
    `<path d="M26 120 Q40 70 54 120Z" fill="${HAZE.dome}" ${BG_STROKE}/><path d="M40 72 V40" ${BG_STROKE}/><path d="M46 52 a7 7 0 1 1 -3 -12 a5 5 0 0 0 3 12Z" fill="${K.goldDark}" opacity=".55"/>`;
}

function softCloudArt() {
  const b = [[28, 36, 20], [56, 24, 26], [88, 34, 20], [60, 42, 20]];
  return b.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${HAZE.cloud}" ${BG_STROKE}/>`).join('') +
    b.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r - 1.5}" fill="${HAZE.cloud}"/>`).join('');
}

function sunArt() {
  const rays = Array.from({ length: 12 }, (_, i) => `<path d="M64 6 L70 22 L58 22Z" fill="${K.gold}" opacity=".5" transform="rotate(${i * 30} 64 64)"/>`).join('');
  return rays + `<circle cx="64" cy="64" r="36" fill="${K.gold}" stroke="${K.goldDark}" stroke-width="3" opacity=".9"/>` +
    pieEye(52, 58, 6.5, 8, 1, 1.5) + pieEye(76, 58, 6.5, 8, -1, 1.5) + `<path d="M52 76 Q64 86 76 76" fill="none" stroke="${K.goldDark}" stroke-width="3.5" stroke-linecap="round"/>` +
    `<ellipse cx="44" cy="70" rx="5" ry="3" fill="${K.orange}" opacity=".7"/><ellipse cx="84" cy="70" rx="5" ry="3" fill="${K.orange}" opacity=".7"/>`;
}

function moonArt() {
  return `<circle cx="64" cy="64" r="34" fill="${K.sandLight}" stroke="${BG_INK}" stroke-width="2.5"/><circle cx="76" cy="54" r="29" fill="#2e386f"/>`;
}

function farKiteArt() {
  return `<path d="M30 6 L48 30 L30 52 L12 30Z" fill="${K.tealLight}" ${BG_STROKE}/><path d="M30 6 V52 M12 30 H48" ${BG_STROKE}/><path d="M30 52 Q22 62 30 70 Q38 78 30 90" fill="none" ${BG_STROKE}/>`;
}

function starDotArt() {
  return `<path d="M32 4 Q32 32 60 32 Q32 32 32 60 Q32 32 4 32 Q32 32 32 4Z" fill="${K.white}"/>`;
}

/* Sprite catalogue shared by the game and the exporter lives in art/sprites.js; scenery placement is data here. */
function buildDecor() {
  const r = rng(7), out = [];
  out.push({ spr: 'bg:skyline', atM: 66, f: 0.3, x: 0, ax: 0 });
  out.push({ spr: 'bg:rooftops', atM: 108, f: 0.34, x: 0, ax: 0 });
  for (let i = 0; i < 26; i++) out.push({ spr: 'bg:cloud', atM: 120 + i * 24 + r() * 14, f: 0.4 + r() * 0.25, x: r() * 300 - 20, y: 0, s: 0.7 + r() * 0.8, alpha: 0.55 + r() * 0.3, bob: r() * 6 });
  [[150, 250], [230, 20], [320, 300], [460, 40]].forEach(([m, x]) => out.push({ spr: 'bg:minaret', atM: m, f: 0.22, x }));
  [[180, 40], [260, 280], [340, 90], [430, 250], [520, 120]].forEach(([m, x]) => out.push({ spr: 'bg:kite', atM: m, f: 0.5, x, y: 0, sway: true }));
  out.push({ spr: 'bg:sun', atM: 0, f: 0.02, x: 250, y: 90, alpha: 0.8, fixed: true });
  for (let i = 0; i < 24; i++) out.push({ spr: 'bg:star', atM: 700 + i * 22, f: 0.15, x: r() * 340, y: 0, s: 0.2 + r() * 0.25, alpha: 0.7, twinkle: r() * 6 });
  out.push({ spr: 'bg:moon', atM: 760, f: 0.05, x: 40, y: 100, alpha: 0.9, fixed: true });
  return out;
}
