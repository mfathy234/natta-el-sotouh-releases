/* Looks: cosmetic overlays, one sprite per item (64 x 64 box, centred on 32, 32), worn over any hero.
   LOOK_ANCHORS say where each slot sits on each hero in hero-sprite units (HERO_VB): centre x, y, scale s (1 = 64 units), tilt.
   Standing poses share one anchor; the couch slouch moves the head, so lookPlace() carries the anchor through that transform. */

const LOOK_VB = '0 0 64 64';

function tarbooshArt() {
  return `<path d="M14 44 L19 24 Q32 19 45 24 L50 44 Q32 50 14 44Z" fill="${K.red}" ${S(3.5)}/>` +
    `<ellipse cx="32" cy="23" rx="13" ry="4" fill="${K.redDark}" ${S(3)}/>` +
    `<path d="M16 38 Q32 44 48 38" fill="none" stroke="${K.redDark}" stroke-width="3"/>` +
    `<path d="M24 28 Q22 36 24 40" fill="none" stroke="${K.white}" stroke-width="3" stroke-linecap="round" opacity=".6"/>` +
    `<path d="M33 22 Q50 18 52 38" fill="none" ${S(4)}/><path d="M52 38 L49 50 M52 38 L52 51 M52 38 L55 50" stroke="${K.ink}" stroke-width="3.2" stroke-linecap="round"/>` +
    `<circle cx="33" cy="22" r="3" fill="${K.gold}" ${S(2)}/>`;
}

function jasmineFlower(x, y, r) {
  const petals = [0, 1, 2, 3, 4].map(i => { const a = (i / 5) * Math.PI * 2 - Math.PI / 2; return `<ellipse cx="${(x + Math.cos(a) * r * 0.62).toFixed(1)}" cy="${(y + Math.sin(a) * r * 0.62).toFixed(1)}" rx="${r * 0.5}" ry="${r * 0.4}" transform="rotate(${(a * 180 / Math.PI).toFixed(0)} ${(x + Math.cos(a) * r * 0.62).toFixed(1)} ${(y + Math.sin(a) * r * 0.62).toFixed(1)})" fill="${K.white}" ${S(1.8)}/>`; }).join('');
  return petals + `<circle cx="${x}" cy="${y}" r="${r * 0.28}" fill="${K.gold}" stroke="${K.ink}" stroke-width="1.4"/>`;
}
function jasmineArt() {
  const pts = [[7, 41], [14, 32], [23, 27], [32, 25], [41, 27], [50, 32], [57, 41]];
  const leaves = pts.slice(0, -1).map(([x, y], i) => { const [x2, y2] = pts[i + 1]; return `<ellipse cx="${(x + x2) / 2}" cy="${(y + y2) / 2 - 1}" rx="5.5" ry="2.8" transform="rotate(${Math.atan2(y2 - y, x2 - x) * 180 / Math.PI - 40} ${(x + x2) / 2} ${(y + y2) / 2})" fill="${K.green}" ${S(2)}/>`; }).join('');
  return `<path d="M7 41 Q14 27 32 25 Q50 27 57 41" fill="none" stroke="${K.ink}" stroke-width="4.5" stroke-linecap="round"/><path d="M7 41 Q14 27 32 25 Q50 27 57 41" fill="none" stroke="${K.green}" stroke-width="2.4" stroke-linecap="round"/>` +
    leaves + pts.map(([x, y], i) => jasmineFlower(x, y, i % 2 ? 7 : 8.5)).join('');
}

function shadesArt() {
  const lens = x => `<rect x="${x}" y="22" width="23" height="18" rx="8" fill="${K.ink}" stroke="${K.gold}" stroke-width="2.4"/><path d="M${x + 4} 27 L${x + 11} 27" stroke="${K.white}" stroke-width="2.4" stroke-linecap="round" opacity=".7"/>`;
  return `<path d="M27 29 Q32 25 37 29" fill="none" ${S(3.6)}/><path d="M27 29 Q32 25 37 29" fill="none" stroke="${K.gold}" stroke-width="1.6"/>` +
    `<path d="M4 27 L1 25 M60 27 L63 25" stroke="${K.ink}" stroke-width="3.2" stroke-linecap="round"/>` + lens(4) + lens(37);
}

function scarfArt() {
  const band = `<path d="M5 22 Q32 40 59 22 L57 35 Q32 52 7 35Z" fill="${K.red}" ${S(3.5)}/>`;
  const white = [12, 26, 38, 50].map(x => `<path d="M${x} ${24 + (x < 32 ? (32 - x) * 0.18 : (x - 32) * 0.18) + 6} l5 -1.5 l0 11 l-5 1.5Z" fill="${K.white}"/>`).join('');
  const tail = `<path d="M40 40 L50 60 L38 63 L31 45Z" fill="${K.red}" ${S(3.5)}/><path d="M43 47 L49 46 L50 52 L44 53Z M38 58 L44 57" fill="${K.white}" stroke="${K.ink}" stroke-width="0"/>` +
    `<path d="M39 63 L38 56 M43 62 L42 55 M47 61 L47 54" stroke="${K.ink}" stroke-width="2.6" stroke-linecap="round"/>`;
  return tail + band + white + `<path d="M5 22 Q32 40 59 22 L57 35 Q32 52 7 35Z" fill="none" ${S(3.5)}/>`;
}

const LOOK_ART = { tarboosh: tarbooshArt, jasmine: jasmineArt, shades: shadesArt, scarf: scarfArt };

/* Anchors for standing poses (idle, up, land, fall; fall adds LOOK_FALL_DY for the crew). */
const LOOK_ANCHORS = {
  marei: { hat: { x: 60, y: 14, s: 0.66 }, jasmine: { x: 60, y: 20, s: 0.89 }, eyes: { x: 60, y: 40, s: 0.98 }, neck: { x: 60, y: 70, s: 0.78 } },
  shams: { hat: { x: 60, y: 12, s: 0.62 }, jasmine: { x: 60, y: 18, s: 0.85 }, eyes: { x: 60, y: 38, s: 0.92 }, neck: { x: 60, y: 82, s: 0.78 } },
  hanafy: { hat: { x: 60, y: 14, s: 0.6 }, jasmine: { x: 60, y: 20, s: 0.89 }, eyes: { x: 60, y: 37, s: 0.96 }, neck: { x: 60, y: 80, s: 0.78 } },
  batta: { hat: { x: 60, y: 11, s: 0.62 }, jasmine: { x: 60, y: 18, s: 0.85 }, eyes: { x: 60, y: 33, s: 0.9 }, neck: { x: 60, y: 76, s: 0.76 } },
  hadeel: { hat: { x: 60, y: 14, s: 0.6 }, jasmine: { x: 60, y: 20, s: 0.83 }, eyes: { x: 60, y: 38, s: 0.9 }, neck: { x: 60, y: 78, s: 0.74 } },
  shawish: { hat: { x: 60, y: 13, s: 0.62 }, jasmine: { x: 60, y: 19, s: 0.89 }, eyes: { x: 60, y: 36, s: 0.96 }, neck: { x: 60, y: 82, s: 0.72 } }
};
const LOOK_FALL_DY = { marei: 0 };
/* Head transform in the slouch pose (translate after rotate about cx, cy), and the body tilt for the neck. */
const LOOK_SLOUCH = {
  marei: { head: { tx: 22, ty: 0, rot: 8, cx: 60, cy: 52 }, neck: { tx: 18, ty: 6, rot: -24, cx: 68, cy: 92 } },
  crew: { head: { tx: 0, ty: 8, rot: -6, cx: 60, cy: 60 }, neck: { tx: 0, ty: 0, rot: -10, cx: 60, cy: 90 } }
};

/** Rotate (x, y) by `rot` degrees about (cx, cy), then translate. */
function lookXform(x, y, t) {
  const a = (t.rot * Math.PI) / 180, dx = x - t.cx, dy = y - t.cy;
  return [t.cx + dx * Math.cos(a) - dy * Math.sin(a) + t.tx, t.cy + dx * Math.sin(a) + dy * Math.cos(a) + t.ty];
}

/** Where a look sits on a hero in a pose: { x, y, s, rot } in hero-sprite units, or null when the hero has no anchor. */
function lookPlace(heroId, look, pose) {
  const A = LOOK_ANCHORS[heroId];
  if (!A) return null;
  const a = A[look.id] || A[look.slot];
  if (!a) return null;
  if (pose === 'slouch') {
    const T = (LOOK_SLOUCH[heroId] || LOOK_SLOUCH.crew)[look.slot === 'neck' ? 'neck' : 'head'];
    const [x, y] = lookXform(a.x, a.y, T);
    return { x, y, s: a.s, rot: T.rot };
  }
  return { x: a.x, y: a.y + (pose === 'fall' ? (LOOK_FALL_DY[heroId] == null ? 2 : LOOK_FALL_DY[heroId]) : 0), s: a.s, rot: 0 };
}

if (typeof module !== 'undefined' && module.exports) module.exports = { lookPlace, LOOK_ANCHORS };
