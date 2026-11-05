/* Crew builder: the shared body plan for Shams and the newer heroes (Hanafy, Batta, Hadeel, Shawish).
   Each hero file supplies a palette and small fragment functions; this file lays out the 5 poses on the 120 grid.
   Needs heroes.js (hose, tuft) and shams.js (SHAMS_LIMBS) loaded first. */

const CREW_MODE = { idle: 'calm', land: 'smug', up: 'wide', fall: 'wide' };

/* c: { fur, body?, arm?, foot(x, y, flip), head(mode), back?(pose), belly?(pose), neck?(pose), prop?() } */
function crewStand(pose, c) {
  const L = SHAMS_LIMBS[pose] || SHAMS_LIMBS.idle, mode = CREW_MODE[pose] || 'calm', dy = pose === 'fall' ? 2 : 0;
  const arm = c.arm || c.fur;
  return (c.back ? c.back(pose) : '') +
    hose(L.legL, c.fur) + hose(L.legR, c.fur) + c.foot(L.fL[0], L.fL[1], 1) + c.foot(L.fR[0], L.fR[1], -1) +
    tuft(60, 88, 20, 19, 12, 3, c.body || c.fur, 4) + (c.belly ? c.belly(pose) : '') +
    `<g transform="translate(0 ${dy})">${c.head(mode)}</g>` + (c.neck ? c.neck(pose) : '') +
    hose(L.armL, arm, 6) + hose(L.armR, arm, 6) + glove(L.gL[0], L.gL[1], 7) + glove(L.gR[0], L.gR[1], 7);
}

/* Couch slouch: sitting back, legs stretched out and crossed, one glove on the knee, one on the prop. */
function crewSlouch(c) {
  const arm = c.arm || c.fur;
  return (c.back ? c.back('slouch') : '') +
    hose('M54 100 Q36 108 14 112', c.fur) + c.foot(12, 113, 1) +
    hose('M64 104 Q42 114 16 106', c.fur) + c.foot(14, 106, 1) +
    `<g transform="rotate(-10 60 90)">${tuft(60, 88, 20, 19, 12, 3, c.body || c.fur, 4)}${c.belly ? c.belly('slouch') : ''}</g>` +
    `<g transform="translate(0 8) rotate(-6 60 60)">${c.head('calm')}</g>` + (c.neck ? c.neck('slouch') : '') +
    hose('M42 84 Q36 98 50 100', arm, 6) + glove(52, 100, 7) +
    hose('M80 84 Q94 92 90 106', arm, 6) + glove(90, 108, 7) + (c.prop ? c.prop() : '');
}

/* Half-closed lid across the upper half of an eye (fur coloured), as on Mar3y and Shams. */
const crewLid = (cx, cy, rx, ry, fur) => `<path d="M${cx - rx - 1.5} ${cy + 1} A${rx + 1.5} ${ry + 1.5} 0 0 1 ${cx + rx + 1.5} ${cy + 1}Z" fill="${fur}" stroke="${K.ink}" stroke-width="3" stroke-linejoin="round"/>`;
/* Head silhouette with a shared outline, so overlapping ellipses read as one shape. */
const crewBlob = (parts, sw = 8) => parts.map(([x, y, rx, ry]) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${K.ink}" stroke="${K.ink}" stroke-width="${sw}"/>`).join('');
