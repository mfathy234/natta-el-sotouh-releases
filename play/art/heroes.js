/* Heroes: one registry entry per animal. Each draws 5 poses (idle, up, fall, land, slouch) on one grid, facing us.
   Add a hero: write xxxArt(pose), add it to HERO_ART, then add an entry to HEROES in src/data.js.
   Mar3y is in this file; the other heroes have their own files (shams.js). */

const HERO_VB = '-10 -2 146 130';
const HERO_POSES = ['idle', 'up', 'fall', 'land', 'slouch'];

/** Rubber-hose limb: ink stroke under a fur-coloured stroke, so it reads as one tube. */
function hose(d, fur, w = 7) {
  return `<path d="${d}" fill="none" stroke="${K.ink}" stroke-width="${w + 4.5}" stroke-linecap="round"/><path d="${d}" fill="none" stroke="${fur}" stroke-width="${w}" stroke-linecap="round"/>`;
}
function shoe(x, y, color, flip = 1) {
  return `<g transform="translate(${x} ${y}) scale(${flip} 1)"><ellipse cx="0" cy="0" rx="10" ry="6.5" fill="${color}" ${S(3)}/><path d="M-6 -3 Q0 -6 6 -3" stroke="${K.white}" stroke-width="2" fill="none" stroke-linecap="round" opacity=".7"/></g>`;
}
const f1 = n => Math.round(n * 10) / 10;

/** Tufted ellipse: a ring of fur lobes (n lobes bulging `amp` past the ellipse). */
function tuft(cx, cy, rx, ry, n, amp, fill, sw = 4, rot = 0) {
  const pts = [], ctl = [];
  for (let i = 0; i < n; i++) {
    const a0 = rot + (i / n) * Math.PI * 2, a1 = rot + ((i + 0.5) / n) * Math.PI * 2;
    pts.push([cx + Math.cos(a0) * rx, cy + Math.sin(a0) * ry]);
    ctl.push([cx + Math.cos(a1) * (rx + amp), cy + Math.sin(a1) * (ry + amp)]);
  }
  let d = `M${f1(pts[0][0])} ${f1(pts[0][1])}`;
  for (let i = 0; i < n; i++) { const p = pts[(i + 1) % n], c = ctl[i]; d += ` Q${f1(c[0])} ${f1(c[1])} ${f1(p[0])} ${f1(p[1])}`; }
  return `<path d="${d}Z" fill="${fill}" ${S(sw)}/>`;
}

/** Bushy tail along a cubic curve, wider in the middle, with a spiky fur edge. */
function bushyTail(p, fill, wMax = 13, sw = 4) {
  const [x0, y0, x1, y1, x2, y2, x3, y3] = p, N = 16, L = [], R = [];
  for (let i = 0; i <= N; i++) {
    const t = i / N, u = 1 - t;
    const x = u * u * u * x0 + 3 * u * u * t * x1 + 3 * u * t * t * x2 + t * t * t * x3;
    const y = u * u * u * y0 + 3 * u * u * t * y1 + 3 * u * t * t * y2 + t * t * t * y3;
    const dx = 3 * u * u * (x1 - x0) + 6 * u * t * (x2 - x1) + 3 * t * t * (x3 - x2);
    const dy = 3 * u * u * (y1 - y0) + 6 * u * t * (y2 - y1) + 3 * t * t * (y3 - y2);
    const len = Math.hypot(dx, dy) || 1, nx = -dy / len, ny = dx / len;
    const w = (5 + (wMax - 5) * Math.sin(Math.min(1, t * 1.15 + 0.12) * Math.PI * 0.82)) * (t > 0.93 ? 0.55 : 1) + (i % 2 ? 3.2 : 0);
    L.push([x + nx * w, y + ny * w]); R.push([x - nx * w, y - ny * w]);
  }
  const pts = [...L, ...R.reverse()];
  return `<path d="M${pts.map(([a, b]) => `${f1(a)} ${f1(b)}`).join(' L')}Z" fill="${fill}" ${S(sw)}/>`;
}

/** Eye with a coloured iris (for the odd-eyed cat). */
function irisEye(cx, cy, rx, ry, iris, px = 1.5, py = 1.5) {
  const x = cx + px, y = cy + py, ir = rx * 0.78, iry = ry * 0.82;
  return `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${K.white}" ${S(3)}/>` +
    `<ellipse cx="${x}" cy="${y}" rx="${ir}" ry="${iry}" fill="${iris}" stroke="${K.ink}" stroke-width="1.6"/>` +
    `<ellipse cx="${x}" cy="${y}" rx="${ir * 0.5}" ry="${iry * 0.72}" fill="${K.ink}"/>` +
    `<path d="M${x} ${y - iry * 0.7} L${x + ir * 0.12} ${y - iry * 0.1} L${x + ir * 0.78} ${y - iry * 0.3} Z" fill="${K.white}"/>`;
}

/* ---------- Mar3y مرعي: drawn from his real photo (docs/reference/marey-real.jpg) ----------
   Pure white and fluffy (tufted outlines, cheek and chest ruff, bushy tail), pink nose, ears and toe beans,
   amber eye on our left and blue on our right, slim and long-legged. Calm half-lidded idle, wide-eyed surprise
   when jumping, smug on landing, and the couch slouch for menu, hangar and game over. */
const MAREI = { fur: K.white, amber: '#c8872e', blue: '#4aa3e8' };

function mareiPaw(x, y, beans, rot = 0, k = 1) {
  const pads = beans
    ? `<ellipse cx="0" cy="2" rx="3.4" ry="2.8" fill="${K.pink}" stroke="${K.ink}" stroke-width="1"/>` +
      [[-4.2, -2.6], [-1.4, -4.2], [1.6, -4.2], [4.4, -2.6]].map(([a, b]) => `<circle cx="${a}" cy="${b}" r="1.5" fill="${K.pink}" stroke="${K.ink}" stroke-width=".9"/>`).join('')
    : `<path d="M-2 0 V4 M2 0 V4" stroke="${K.ink}" stroke-width="1.6" stroke-linecap="round"/>`;
  return `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${k})"><ellipse cx="0" cy="0" rx="7.2" ry="6.2" fill="${MAREI.fur}" ${S(3)}/>${pads}</g>`;
}

function mareiEye(cx, cy, iris, wide) {
  const rx = wide ? 10.5 : 9.5, ry = wide ? 13 : 11.5, px = cx < 60 ? 2 : -2;
  const base = irisEye(cx, cy, rx, ry, iris, px, wide ? 0 : 3);
  if (wide) return base;
  return base + `<path d="M${cx - rx - 1.5} ${cy + 1} A${rx + 1.5} ${ry + 1.5} 0 0 1 ${cx + rx + 1.5} ${cy + 1} Z" fill="${MAREI.fur}" stroke="${K.ink}" stroke-width="3" stroke-linejoin="round"/>`;
}

/* Eye shapes for the mood faces: closed (blink, yawn, sleep) and happy-closed (proud). */
const mareiClosed = (cx, cy) => `<path d="M${cx - 10} ${cy} Q${cx} ${cy + 9} ${cx + 10} ${cy}" fill="none" ${S(3.2)}/>`;
const mareiHappy = (cx, cy) => `<path d="M${cx - 10} ${cy + 4} Q${cx} ${cy - 8} ${cx + 10} ${cy + 4}" fill="none" ${S(3.2)}/>`;
const MAREI_MOODS = {
  blink: { eye: mareiClosed, mouth: `<path d="M55 57 H65" fill="none" ${S(2.8)}/>` },
  sleepy: { eye: mareiClosed, mouth: `<path d="M57 57 Q60 59 63 57" fill="none" ${S(2.6)}/>` },
  yawn: { eye: mareiClosed, mouth: `<ellipse cx="60" cy="60" rx="6.5" ry="8.5" fill="#7a1a1a" ${S(2.6)}/><ellipse cx="60" cy="65" rx="4" ry="2.8" fill="${K.pink}"/>` },
  proud: { eye: mareiHappy, mouth: `<path d="M50 55 Q58 64 62 58 Q66 56 71 50" fill="none" ${S(2.8)}/>` }
};

function mareiFace(mode, turn) {
  const wide = mode === 'wide', mood = MAREI_MOODS[mode];
  const mouthD = mood ? mood.mouth : wide ? `<ellipse cx="60" cy="59" rx="3.6" ry="4.6" fill="#7a1a1a" ${S(2.5)}/>`
    : mode === 'smug' ? `<path d="M52 56 Q58 61 62 57 Q66 56 70 52" fill="none" ${S(2.8)}/>`
    : mode === 'meh' ? `<path d="M54 60 Q60 55 66 60" fill="none" ${S(2.8)}/>`
    : `<path d="M55 57 H65" fill="none" ${S(2.8)}/>`;
  const eyes = mood ? mood.eye(45, 40) + mood.eye(75, 40) : mareiEye(45, 40, MAREI.amber, wide) + mareiEye(75, 40, MAREI.blue, wide);
  return `<g transform="translate(${turn} 0)">` + eyes +
    `<path d="M55 49 L65 49 L60 56Z" fill="${K.pink}" ${S(2.5)}/>` + mouthD +
    `<path d="M32 50 L10 45 M32 55 L10 58 M88 50 L110 45 M88 55 L110 58" stroke="${K.ink}" stroke-width="2" stroke-linecap="round"/></g>`;
}

function mareiHead(mode, tilt = 0, turn = 0) {
  const f = MAREI.fur, ruff = (s) => `<path d="M${s * 30 + 60 - 0} 40 L${60 + s * 44} 44 L${60 + s * 33} 48 L${60 + s * 46} 55 L${60 + s * 33} 57 L${60 + s * 42} 65 L${60 + s * 26} 62Z" fill="${f}" ${S(3)}/>`;
  return `<g transform="rotate(${tilt} 60 52)">` +
    `<path d="M32 36 L26 4 L54 22Z" fill="${f}" ${S(4)}/><path d="M35 29 L31 13 L46 23Z" fill="${K.pink}"/><path d="M30 12 L34 20 M32 6 L36 14" stroke="${K.ink}" stroke-width="0"/>` +
    `<path d="M88 36 L94 4 L66 22Z" fill="${f}" ${S(4)}/><path d="M85 29 L89 13 L74 23Z" fill="${K.pink}"/>` +
    ruff(-1) + ruff(1) + tuft(60, 42, 32, 26, 20, 4.5, f, 4) +
    `<ellipse cx="32" cy="54" rx="5.5" ry="3.5" fill="${K.pink}" opacity=".45"/><ellipse cx="88" cy="54" rx="5.5" ry="3.5" fill="${K.pink}" opacity=".45"/>` +
    mareiFace(mode, turn) + '</g>';
}

const mareiLimb = (d, w = 5.5) => hose(d, MAREI.fur, w);
const mareiTail = p => bushyTail(p, MAREI.fur, 11.5);
const mareiChest = () => `<path d="M46 64 L50 76 L54 66 L57 82 L61 68 L64 84 L67 67 L71 78 L74 65 Q60 58 46 64Z" fill="${MAREI.fur}" ${S(2.8)}/>`;
const mareiBody = () => tuft(60, 84, 13.5, 21, 12, 4, MAREI.fur, 4);

const MAREI_STAND = {
  idle: { tail: [72, 100, 112, 112, 114, 70, 112, 48], mode: 'calm', beans: false, armL: 'M47 70 Q38 86 36 100', armR: 'M73 70 Q82 86 84 100', pL: [36, 103], pR: [84, 103], legL: 'M54 94 Q52 108 50 116', legR: 'M66 94 Q68 108 70 116', fL: [50, 116], fR: [70, 116] },
  land: { tail: [72, 100, 112, 112, 114, 70, 112, 48], mode: 'smug', beans: false, armL: 'M47 70 Q36 80 40 94', armR: 'M73 70 Q84 80 80 94', pL: [40, 97], pR: [80, 97], legL: 'M54 94 Q48 108 46 116', legR: 'M66 94 Q72 108 74 116', fL: [46, 116], fR: [74, 116] },
  up: { tail: [72, 100, 106, 118, 120, 86, 118, 62], mode: 'wide', beans: true, armL: 'M47 68 Q30 66 22 48', armR: 'M73 68 Q90 66 98 48', pL: [21, 44], pR: [99, 44], legL: 'M54 94 Q40 100 34 112', legR: 'M66 94 Q80 100 86 112', fL: [33, 115], fR: [87, 115] },
  fall: { tail: [72, 100, 112, 96, 118, 62, 114, 40], mode: 'wide', beans: true, armL: 'M47 68 Q22 62 12 38', armR: 'M73 68 Q98 62 108 38', pL: [11, 33], pR: [109, 33], legL: 'M54 94 Q48 106 52 118', legR: 'M66 94 Q72 106 68 118', fL: [52, 118], fR: [68, 118] }
};

/* Fluffy tail along a cubic curve: smooth width, rounded lobes along the edge (no sawtooth), rounded tip. */
function fluffyTail(p, fill, wMax = 10, sw = 4, bump = 2.4) {
  const [x0, y0, x1, y1, x2, y2, x3, y3] = p, N = 10, L = [], R = [];
  let tx = 0, ty = 0;
  for (let i = 0; i <= N; i++) {
    const t = i / N, u = 1 - t;
    const x = u * u * u * x0 + 3 * u * u * t * x1 + 3 * u * t * t * x2 + t * t * t * x3;
    const y = u * u * u * y0 + 3 * u * u * t * y1 + 3 * u * t * t * y2 + t * t * t * y3;
    const dx = 3 * u * u * (x1 - x0) + 6 * u * t * (x2 - x1) + 3 * t * t * (x3 - x2);
    const dy = 3 * u * u * (y1 - y0) + 6 * u * t * (y2 - y1) + 3 * t * t * (y3 - y2);
    const len = Math.hypot(dx, dy) || 1, nx = -dy / len, ny = dx / len, w = (4.5 + (wMax - 4.5) * Math.sin(Math.min(1, t * 1.1 + 0.1) * Math.PI * 0.8)) * (t > 0.92 ? 0.8 : 1);
    L.push([x + nx * w, y + ny * w, nx, ny]); R.push([x - nx * w, y - ny * w, -nx, -ny]);
    tx = dx / len; ty = dy / len;
  }
  const seg = (A, B) => `Q${f1((A[0] + B[0]) / 2 + (A[2] + B[2]) * bump / 2)} ${f1((A[1] + B[1]) / 2 + (A[3] + B[3]) * bump / 2)} ${f1(B[0])} ${f1(B[1])}`;
  let d = `M${f1(L[0][0])} ${f1(L[0][1])}`;
  for (let i = 0; i < N; i++) d += ' ' + seg(L[i], L[i + 1]);
  d += ` Q${f1(x3 + tx * wMax * 1.2)} ${f1(y3 + ty * wMax * 1.2)} ${f1(R[N][0])} ${f1(R[N][1])}`;
  for (let i = N; i > 0; i--) d += ' ' + seg(R[i], R[i - 1]);
  return `<path d="${d}Z" fill="${fill}" ${S(sw)}/>`;
}

/* Couch slouch (from the photo): sitting deep in the couch, torso leaning back to the right, slim legs stretched toward us and crossed
   at the paws (beans showing), one front paw on the belly, the other lying along his side, head turned with the half-lidded look,
   fluffy tail curling along the seat. Transforms are step lists (see crew.js) shared with the look anchors in looks.js. */
/* Mar3y uses the same rig as the crew: the same couch, lean and crossed legs, with his slim body, bare paws (beans toward us) and a fluffy tail. */
const SLOUCH_MAREI = {
  body: [['r', 20, 60, 100]],
  head: [['r', -4, 60, 42], ['t', -60, -42], ['s', 0.78], ['t', 60, 42], ['r', 20, 60, 100], ['t', 1, 1]]
};
const SLOUCH_MAREI_HEAD_TURN = -8;
/* Slouch torso: a smooth tufted body with a couple of soft fur ticks on the chest (no jagged ruff), the part that leans on the couch. */
const mareiSlouchBody = () => tuft(60, 86, 16.5, 22, 14, 3.4, MAREI.fur, 4) +
  `<path d="M52 70 Q56 77 60 71 Q64 77 68 70" fill="none" ${S(2.4)}/>`;

/* o.mode: face; o.arms: 'rest' (default), 'lick' (paw to the mouth, o.lick 0 or 1), 'stretch' (both paws up), 'knock' (side paw out to the right, o.reach 0 or 1). */
function mareiArms(o, { P, H, hand }) {
  const arms = o.arms || 'rest', sF = P(46, 72), sS = P(74, 72), belly = P(57, 92), side = P(82, 100);
  const limb = (a, c, b, w = 5.5) => mareiLimb(`M${f1(a.x)} ${f1(a.y)} Q${f1(c[0])} ${f1(c[1])} ${f1(b[0])} ${f1(b[1])}`, w);
  const paw = (x, y, beans, rot) => mareiPaw(x, y, beans, rot, 1.1);
  let behind = '', front;
  if (arms === 'knock') { const e = o.reach ? [161, 67] : [152, 53]; behind = limb(sS, [128, o.reach ? 62 : 50], e) + paw(e[0] + 3, e[1] + 1, true, 90); }
  else if (arms === 'stretch') behind = limb(sS, [118, 34], [96, 6]) + paw(96, 3, true, 200);
  else behind = limb(sS, [sS.x + 10, sS.y + 14], [side.x, side.y]) + paw(side.x, side.y + 3, false, 0);
  if (arms === 'lick') { const m = H(52, 60), q = [m.x + (o.lick ? 0 : 3), m.y + (o.lick ? -1 : 1)]; front = limb(sF, [sF.x - 2, (sF.y + q[1]) / 2 + 6], q, 5) + paw(q[0], q[1], false, -20); }
  else if (arms === 'stretch') front = limb(sF, [56, 38], [48, 14]) + paw(47, 11, true, 200);
  else front = limb(sF, [sF.x - 6, sF.y + 14], [belly.x, belly.y]) + paw(belly.x, belly.y, false, -25);
  return { behind, front };
}
const MAREI_BODY = {
  fur: MAREI.fur, ops: SLOUCH_MAREI, legW: 6, feet: [[65, 117, 14], [52, 119, -14]], bodyShape: mareiSlouchBody,
  head: mode => mareiHead(mode, 0, SLOUCH_MAREI_HEAD_TURN), sole: (x, y, r) => mareiPaw(x, y, true, r, 1.3),
  back: () => fluffyTail([54, 104, 30, 110, 8, 98, 8, 68], MAREI.fur, 7.5)
};
function mareiSlouch(o = {}) {
  const mode = o.mode || 'calm';
  return crewSlouch(Object.assign({}, MAREI_BODY, { head: () => mareiHead(mode, 0, SLOUCH_MAREI_HEAD_TURN), arms: ctx => mareiArms(o, ctx) }));
}

function mareiArt(pose = 'idle') {
  if (pose === 'slouch') return mareiSlouch();
  const P = MAREI_STAND[pose] || MAREI_STAND.idle, rot = pose === 'idle' || pose === 'land' ? 0 : 180;
  return mareiTail(P.tail) +
    mareiLimb(P.legL) + mareiLimb(P.legR) + mareiPaw(P.fL[0], P.fL[1], P.beans, rot) + mareiPaw(P.fR[0], P.fR[1], P.beans, rot) +
    mareiBody() + mareiChest() +
    mareiLimb(P.armL) + mareiLimb(P.armR) + mareiPaw(P.pL[0], P.pL[1], P.beans, 180) + mareiPaw(P.pR[0], P.pR[1], P.beans, 180) +
    mareiHead(P.mode);
}
