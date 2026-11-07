/* Neighbours (الجيران): the window with open shutters, the hand in a white sleeve and glove (the sleeve itself is stretched on the canvas), the water bucket
   and the splash. Drawn on their own grids; sizes are in sprites.js. */

const NBR_WINDOW_VB = '0 0 116 128';
const NBR_HAND_VB = '0 0 96 64';
const NBR_BUCKET_VB = '0 0 120 100';
const NBR_SPLASH_VB = '0 0 148 100';

/* A plaster wall slab with a window, open teal shutters, a sill with a flowerpot, and a dark room behind a coral curtain. */
function nbrWindowArt() {
  const shutter = x => `<rect x="${x}" y="22" width="20" height="76" rx="4" fill="${K.teal}" ${S(3.5)}/>` +
    [32, 44, 56, 68, 80].map(y => `<path d="M${x + 4} ${y} H${x + 16}" stroke="${K.ink}" stroke-width="2.5" stroke-linecap="round" opacity=".55"/>`).join('');
  return `<rect x="4" y="6" width="108" height="118" rx="14" fill="${K.sandLight}" ${S(4)}/>` +
    `<path d="M14 16 H60" stroke="${K.white}" stroke-width="4" stroke-linecap="round" opacity=".8"/>` +
    `<rect x="30" y="20" width="56" height="78" rx="8" fill="${K.night}" ${S(4)}/>` +
    `<path d="M34 24 H52 Q48 50 56 92 H34Z" fill="${K.coral}" opacity=".9"/><path d="M34 24 H52 Q48 50 56 92" fill="none" ${S(2.5)}/>` +
    `<circle cx="72" cy="60" r="5" fill="${K.gold}" opacity=".7"/>` +
    shutter(6) + shutter(90) +
    `<rect x="22" y="98" width="72" height="10" rx="4" fill="${K.sand}" ${S(3.5)}/>` +
    `<path d="M70 98 L73 86 H88 L91 98Z" fill="${K.copper}" ${S(3)}/>` +
    `<circle cx="76" cy="82" r="5.5" fill="${K.red}" ${S(2.5)}/><circle cx="85" cy="80" r="4.5" fill="${K.redLight}" ${S(2.5)}/><path d="M80 86 q-1 -5 -5 -6" stroke="${K.green}" stroke-width="2.5" fill="none" stroke-linecap="round"/>`;
}

/* The hand at the end of the arm, pointing right: a striped white sleeve cuff and a four-finger glove. frame 0 = open hand, 1 = fist. */
function nbrHandArt(frame = 0) {
  return `<g transform="translate(3 2) scale(.92)">${nbrHandShape(frame)}</g>`;
}

function nbrHandShape(frame) {
  const cuff = `<rect x="0" y="14" width="26" height="36" rx="8" fill="${K.white}" ${S(4)}/>` +
    `<path d="M9 17 V47 M17 17 V47" stroke="${K.blue}" stroke-width="2.5" stroke-linecap="round" opacity=".75"/>` +
    `<rect x="24" y="16" width="9" height="32" rx="4" fill="${K.teal}" ${S(3)}/>`;
  if (frame) {
    return cuff + `<circle cx="56" cy="32" r="22" fill="${K.white}" ${S(4)}/>` +
      `<path d="M62 14 Q78 20 76 32 M64 26 Q80 32 76 44 M60 38 Q74 46 68 52" fill="none" ${S(3)}/>` +
      `<ellipse cx="48" cy="12" rx="11" ry="7" fill="${K.white}" ${S(3.5)}/>`;
  }
  return cuff + `<circle cx="52" cy="32" r="19" fill="${K.white}" ${S(4)}/>` +
    [[78, 14], [86, 28], [86, 42], [78, 54]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="12" ry="7" fill="${K.white}" ${S(3.5)}/>`).join('') +
    `<circle cx="52" cy="32" r="19" fill="${K.white}"/><path d="M44 22 V40 M52 20 V42 M60 22 V40" stroke="${K.ink}" stroke-width="2.2" stroke-linecap="round"/>` +
    `<ellipse cx="46" cy="10" rx="11" ry="6.5" fill="${K.white}" ${S(3.5)}/>`;
}

/* A tin bucket held by the handle in a gloved hand. frame 0 = level, full of water; 1 = tipped, pouring. */
function nbrBucketArt(frame = 0) {
  const sleeve = `<rect x="52" y="0" width="30" height="24" rx="8" fill="${K.white}" ${S(4)}/><path d="M60 3 V21 M68 3 V21 M76 3 V21" stroke="${K.blue}" stroke-width="2.5" opacity=".7" stroke-linecap="round"/>`;
  const pail = `<path d="M30 40 H90 L82 90 Q60 98 38 90Z" fill="${K.grey}" ${S(4.5)}/>` +
    `<path d="M36 52 H84" stroke="${K.greyDark}" stroke-width="3.5" stroke-linecap="round"/><path d="M40 72 H80" stroke="${K.greyDark}" stroke-width="3.5" stroke-linecap="round"/>` +
    `<path d="M36 46 L40 80" stroke="${K.white}" stroke-width="4" stroke-linecap="round" opacity=".7"/>` +
    `<ellipse cx="60" cy="40" rx="30" ry="7" fill="${K.blueLight}" ${S(4)}/><path d="M42 40 q6 -4 12 0 t12 0" fill="none" stroke="${K.white}" stroke-width="2.5" stroke-linecap="round"/>`;
  const glove8 = `<circle cx="64" cy="24" r="12" fill="${K.white}" ${S(3.5)}/><path d="M58 20 V28 M64 18 V28 M70 20 V28" stroke="${K.ink}" stroke-width="2" stroke-linecap="round"/>`;
  if (!frame) return `<path d="M32 40 Q60 -2 88 40" fill="none" ${S(4)}/>` + pail + sleeve + glove8;
  return sleeve + `<g transform="rotate(62 60 40) translate(8 -2)"><path d="M32 40 Q60 -2 88 40" fill="none" ${S(4)}/>${pail}</g>` +
    `<path d="M92 66 q8 14 4 30" fill="none" stroke="${K.blueLight}" stroke-width="8" stroke-linecap="round"/>` + glove8;
}

/* The splash where the water lands: a crown of drops. 2 frames. */
function nbrSplashArt(frame = 0) {
  const j = frame ? 6 : 0;
  const drop = (x, y, r) => `<path d="M${x} ${y - r * 1.5} Q${x + r} ${y - r * 0.2} ${x} ${y + r * 0.6} Q${x - r} ${y - r * 0.2} ${x} ${y - r * 1.5}Z" fill="${K.blueLight}" ${S(3)}/>`;
  return `<ellipse cx="74" cy="84" rx="58" ry="12" fill="${K.blueLight}" ${S(4)}/>` +
    `<path d="M28 84 Q34 ${50 - j} 48 ${40 + j} Q52 62 60 84Z M60 84 Q70 ${24 + j} 74 ${18 - j} Q84 ${36 + j} 90 84Z M88 84 Q98 ${46 - j} 108 ${44 + j} Q114 68 120 84Z" fill="${K.blueLight}" ${S(3.5)}/>` +
    drop(30, 40 - j, 7) + drop(120, 38 + j, 7) + drop(74, 8 + j, 8) + drop(50, 18 + j, 5) + drop(100, 20 - j, 5) +
    `<path d="M40 84 Q60 78 80 84" stroke="${K.white}" stroke-width="3.5" fill="none" stroke-linecap="round" opacity=".85"/>`;
}
