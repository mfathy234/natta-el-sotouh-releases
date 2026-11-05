/* Natta El Sotouh art primitives (from Tayara El Hara), Rooftop sunset palette.
   Every drawing function returns an SVG fragment string (no <svg> wrapper).
   Style rules live in CLAUDE.md: thick ink outlines, pie-cut eyes, white gloves, flat fills. */

const K = {
  ink: '#2a1f3d', paper: '#fff4ec', white: '#fffaf0', red: '#d63a2f', redDark: '#9e2620', redLight: '#ef6a5f',
  gold: '#ffd23f', goldDark: '#d19a0c', orange: '#f39c34', teal: '#2fbfa6', tealLight: '#6fdcc6', mint: '#9fe3d3', coral: '#e85d75', coralDark: '#b53a58', sky: '#ffb59e', lilac: '#c9a7e8', dusk: '#3d2c6b',
  blue: '#3c6fb5', blueLight: '#7fb2e5', bead: '#2459b8', sand: '#e0b77a', sandDark: '#c4935a', sandLight: '#efd6a8',
  wood: '#b07a45', woodDark: '#7d5230', grey: '#a39a90', greyDark: '#756d64', muzzle: '#e2d2b8', pink: '#f2a0a0',
  green: '#6c8f3a', croc: '#5e8f3e', crocLight: '#7fae55', copper: '#c8743a', tea: '#b4521c', night: '#241a4a', plum: '#3d2c6b'
};

/** Ink stroke attributes. @param {number} w stroke width */
const S = (w = 4) => `stroke="${K.ink}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;

/** Place a fragment at (x, y) with uniform scale. */
const at = (x, y, s, m) => `<g transform="translate(${x} ${y}) scale(${s})">${m}</g>`;

/** Mirror a fragment across a vertical axis at x = cx. */
const mirror = (cx, m) => `<g transform="translate(${cx * 2} 0) scale(-1 1)">${m}</g>`;

/** Deterministic random numbers so generated scenery is identical every run. */
function rng(seed) {
  return function () {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

/** Rubber-hose eye: white oval, black pupil with a pie-cut wedge. */
function pieEye(cx, cy, rx, ry, px = 2, py = 2, white = K.white) {
  const pr = rx * 0.56, pry = ry * 0.62, x = cx + px, y = cy + py;
  return `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${white}" ${S(3)}/>` +
    `<ellipse cx="${x}" cy="${y}" rx="${pr}" ry="${pry}" fill="${K.ink}"/>` +
    `<path d="M${x} ${y - pry} L${x + pr * 0.15} ${y - pry * 0.1} L${x + pr} ${y - pry * 0.35} Z" fill="${white}"/>`;
}

/** Three-line white cartoon glove seen from the back. */
function glove(x, y, r) {
  return `<rect x="${x - r * 0.65}" y="${y + r * 0.55}" width="${r * 1.3}" height="${r * 0.55}" rx="${r * 0.2}" fill="${K.white}" ${S(2.5)}/>` +
    `<circle cx="${x}" cy="${y}" r="${r}" fill="${K.white}" ${S(2.5)}/>` +
    `<path d="M${x - r * 0.32} ${y - r * 0.5} V${y + r * 0.1} M${x} ${y - r * 0.6} V${y + r * 0.1} M${x + r * 0.32} ${y - r * 0.5} V${y + r * 0.1}" stroke="${K.ink}" stroke-width="1.6" stroke-linecap="round"/>`;
}

function sparkle(x, y, s, fill) {
  return `<path d="M${x} ${y - s} Q${x} ${y} ${x + s} ${y} Q${x} ${y} ${x} ${y + s} Q${x} ${y} ${x - s} ${y} Q${x} ${y} ${x} ${y - s}Z" fill="${fill}" ${S(2)}/>`;
}

function puff(x, y, r, fill = K.white) { return `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" ${S(3)}/>`; }

/** Cartoon cloud: outline pass then fill pass, so inner seams disappear. */
function cloud(x, y, s, fill = K.white) {
  const blobs = [[0, 0, 26], [28, -12, 30], [58, 0, 24], [30, 10, 24], [-20, 8, 16], [80, 8, 16]];
  const outline = blobs.map(([bx, by, r]) => `<circle cx="${bx}" cy="${by}" r="${r}" fill="${K.ink}" stroke="${K.ink}" stroke-width="8"/>`).join('');
  const body = blobs.map(([bx, by, r]) => `<circle cx="${bx}" cy="${by}" r="${r}" fill="${fill}"/>`).join('');
  return `<g transform="translate(${x} ${y}) scale(${s})">${outline}${body}<path d="M-6 -4 Q2 -18 16 -16" stroke="${K.ink}" stroke-width="3" fill="none" stroke-linecap="round" opacity=".35"/></g>`;
}

/** Feathered cartoon wing, attached at its right edge (x≈66). Mirror for the other side. */
function featherWing(fill = K.white) {
  return `<path d="M62 80 Q34 66 26 42 Q40 52 50 52 Q36 40 38 26 Q54 40 62 56 Q60 42 66 34 Q72 52 70 70Z" fill="${fill}" ${S(3)}/>`;
}

/** Wrap a fragment in a standalone SVG document. */
function svgDoc(vb, body, attrs = '') {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" ${attrs}>${body}</svg>`;
}
