/* Crew builder: the shared body plan for Shams and the newer heroes (Hanafy, Batta, Hadeel, Shawish).
   Each hero file supplies a palette and small fragment functions; this file lays out the 5 poses on the 120 grid.
   It also holds the shared couch (كنبة) and the slouch rig that every hero sits on, Mar3y included.
   Needs heroes.js (hose, tuft) and shams.js (SHAMS_LIMBS) loaded first. */

const CREW_MODE = { idle: 'calm', land: 'smug', up: 'wide', fall: 'wide' };

/* c: { fur, body?, arm?, foot(x, y, flip), sole?(x, y, rot), head(mode), back?(pose), belly?(pose), neck?(pose), prop?(), propRot? } */
function crewStand(pose, c) {
  const L = SHAMS_LIMBS[pose] || SHAMS_LIMBS.idle, mode = CREW_MODE[pose] || 'calm', dy = pose === 'fall' ? 2 : 0;
  const arm = c.arm || c.fur;
  return (c.back ? c.back(pose) : '') +
    hose(L.legL, c.fur) + hose(L.legR, c.fur) + c.foot(L.fL[0], L.fL[1], 1) + c.foot(L.fR[0], L.fR[1], -1) +
    tuft(60, 88, 20, 19, 12, 3, c.body || c.fur, 4) + (c.belly ? c.belly(pose) : '') +
    `<g transform="translate(0 ${dy})">${c.head(mode)}</g>` + (c.neck ? c.neck(pose) : '') +
    hose(L.armL, arm, 6) + hose(L.armR, arm, 6) + glove(L.gL[0], L.gL[1], 7) + glove(L.gR[0], L.gR[1], 7);
}

/* ---------- The couch slouch ----------
   A transform is a list of steps applied to a point in order: ['r', deg, cx, cy], ['s', k] (about the origin) or ['t', dx, dy].
   The same list draws the art (slouchAttr) and moves a look's anchor (slouchPoint in looks.js), so a hat always follows the head. */
const SLOUCH_BASE = [['s', 0.9], ['t', 5, 6]];
const SLOUCH_COUCH = 'translate(65 122) scale(0.88) translate(-65 -122)';
const SLOUCH_CREW = {
  body: [['r', 18, 60, 100]],
  head: [['r', -10, 60, 62], ['r', 18, 60, 100], ['t', 0, -2]]
};
function slouchAttr(ops) {
  return ops.slice().reverse().map(o => (o[0] === 'r' ? `rotate(${o[1]} ${o[2]} ${o[3]})` : o[0] === 's' ? `scale(${o[1]})` : `translate(${o[1]} ${o[2]})`)).join(' ');
}
function slouchPoint(ops, x, y) {
  let rot = 0, k = 1;
  ops.forEach(o => {
    if (o[0] === 'r') {
      const a = (o[1] * Math.PI) / 180, dx = x - o[2], dy = y - o[3];
      x = o[2] + dx * Math.cos(a) - dy * Math.sin(a); y = o[3] + dx * Math.sin(a) + dy * Math.cos(a); rot += o[1];
    } else if (o[0] === 's') { x *= o[1]; y *= o[1]; k *= o[1]; } else { x += o[1]; y += o[2]; }
  });
  return { x, y, rot, k };
}

/* The shared Egyptian living-room couch: carved wooden frame, striped cover in the sunset palette (coral, lemon, mint),
   rolled arms, bun feet. Softer ink and paler stripes than the heroes so the hero reads first.
   Drawn in its own box x -4..134, y 6..122 and placed by SLOUCH_COUCH. */
const COUCH = { ink: '#9886ad', coral: '#f9c6cb', lemon: '#fff2c4', mint: '#d0f0e6', wood: '#d9ae80', woodLight: '#ebcba3' };
function couchArt() {
  return `<g transform="${SLOUCH_COUCH}">${couchShapes()}</g>`;
}
function couchShapes() {
  const c = COUCH, st = (w = 3) => `stroke="${c.ink}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;
  const cols = [c.coral, c.lemon, c.mint];
  const stripes = (x0, x1, y0, y1, sw, clip) => `<g clip-path="url(#${clip})">` +
    Array.from({ length: Math.ceil((x1 - x0) / sw) }, (_, i) => `<rect x="${x0 + i * sw}" y="${y0}" width="${sw}" height="${y1 - y0}" fill="${cols[i % 3]}"/>`).join('') + '</g>';
  const backShape = 'M14 40 Q14 20 34 20 H96 Q116 20 116 40 V94 H14Z', seatShape = 'M12 90 Q12 84 20 84 H110 Q118 84 118 90 V106 H12Z';
  const arm = x => `<path d="M${x} 108 V66 Q${x} 54 ${x + 10} 54 Q${x + 20} 54 ${x + 20} 66 V108Z" fill="${c.coral}" ${st()}/>` +
    `<path d="M${x + 3} 70 H${x + 17}" stroke="${c.lemon}" stroke-width="4" stroke-linecap="round"/><path d="M${x} 98 H${x + 20}" ${st(2.4)}/>`;
  return `<defs><clipPath id="couchBack"><path d="${backShape}"/></clipPath><clipPath id="couchSeat"><path d="${seatShape}"/></clipPath></defs>` +
    `<path d="M7 40 Q7 12 33 12 H97 Q123 12 123 40 V98 H7Z" fill="${c.wood}" ${st()}/>` +
    `<path d="M11 12 Q8 6 14 6 Q20 6 18 12 M112 12 Q110 6 116 6 Q122 6 119 12" fill="${c.wood}" ${st(2.6)}/>` +
    `<path d="${backShape}" fill="${c.mint}"/>` + stripes(14, 116, 14, 96, 10, 'couchBack') + `<path d="${backShape}" fill="none" ${st(2.6)}/>` +
    `<path d="${seatShape}" fill="${c.lemon}"/>` + stripes(12, 118, 82, 108, 10, 'couchSeat') + `<path d="${seatShape}" fill="none" ${st()}/>` +
    `<path d="M16 92 H108" ${st(2.2)} opacity=".6"/>` +
    arm(-4) + arm(114) +
    `<rect x="2" y="106" width="126" height="9" rx="4" fill="${c.wood}" ${st()}/><path d="M10 110 H120" stroke="${c.woodLight}" stroke-width="2.4" stroke-linecap="round"/>` +
    `<ellipse cx="14" cy="118" rx="6.5" ry="4.5" fill="${c.wood}" ${st(2.6)}/><ellipse cx="116" cy="118" rx="6.5" ry="4.5" fill="${c.wood}" ${st(2.6)}/>`;
}

/* A foot seen sole-on, toes toward the bottom: hoof, webbed foot, bird foot or paw pads (also used for Shawish). */
function crewPaw(x, y, rot, fur, pad, k = 1) {
  const toes = [[-5.6, -4.4], [-2, -6.6], [2, -6.6], [5.6, -4.4]].map(([a, b]) => `<circle cx="${a}" cy="${b}" r="2" fill="${pad}" stroke="${K.ink}" stroke-width="1"/>`).join('');
  return `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${k})"><ellipse cx="0" cy="0" rx="9" ry="8" fill="${fur}" ${S(3)}/>` +
    `<ellipse cx="0" cy="2.4" rx="4.4" ry="3.6" fill="${pad}" stroke="${K.ink}" stroke-width="1.2"/>${toes}</g>`;
}
function crewHoof(x, y, rot, hoof, sole) {
  return `<g transform="translate(${x} ${y}) rotate(${rot})"><ellipse cx="0" cy="0" rx="9.5" ry="10.5" fill="${hoof}" ${S(3)}/>` +
    `<ellipse cx="-3.1" cy="1" rx="3.1" ry="7" fill="${sole}"/><ellipse cx="3.1" cy="1" rx="3.1" ry="7" fill="${sole}"/></g>`;
}

/* c adds: sole(x, y, rot) for the foot, prop() drawn with its grip at (0, 0), propRot, back/belly/neck fragments as for crewStand.
   Mar3y also sets ops (his own head and body steps), bodyShape(), hand(x, y, rot), legW and arms(ctx), which returns { behind, front } arm art. */
function crewSlouch(c) {
  const arm = c.arm || c.fur, ops = c.ops || SLOUCH_CREW, B = ops.body, P = (x, y) => slouchPoint(B, x, y), H = (x, y) => slouchPoint(ops.head, x, y);
  const hand = c.hand || ((x, y) => glove(x, y, 7)), lw = c.legW || 8;
  const sL = P(44, 82), sR = P(76, 82), hL = P(61, 99), hR = P(94, 97), cL = P(38, 96), cR = P(96, 84);
  const footA = c.feet ? c.feet[0] : [65, 117, 8], footB = c.feet ? c.feet[1] : [54, 118, -8];
  const legs = hose('M68 97 Q70 111 54 115', c.fur, lw) + hose('M52 97 Q50 112 65 115', c.fur, lw);
  const line = (p, q, r) => `M${f1(p.x)} ${f1(p.y)} Q${f1(q.x)} ${f1(q.y)} ${f1(r.x)} ${f1(r.y)}`;
  const grip = `<g transform="translate(${f1(hR.x)} ${f1(hR.y)}) rotate(${c.propRot || 0})">${c.prop ? c.prop() : ''}${hand(0, 0, 0)}</g>`;
  const arms = c.arms ? c.arms({ P, H, B, ops, hand })
    : { behind: '', front: hose(line(sL, cL, hL), arm, 6) + hose(line(sR, cR, hR), arm, 6) + hand(hL.x, hL.y, 0) + grip };
  return couchArt() + `<g transform="${slouchAttr(SLOUCH_BASE)}">` + (c.back ? c.back('slouch') : '') +
    `<g transform="${slouchAttr(B)}">${c.bodyShape ? c.bodyShape() : tuft(60, 88, 20.5, 19, 12, 3, c.body || c.fur, 4)}<g transform="translate(60 94) scale(1.12 1.06) translate(-60 -94)">${c.belly ? c.belly('slouch') : ''}</g></g>` + legs +
    c.sole(footB[0], footB[1], footB[2]) + c.sole(footA[0], footA[1], footA[2]) + arms.behind +
    `<g transform="${slouchAttr(ops.head)}">${c.head('calm')}</g>` +
    (c.neck ? `<g transform="${slouchAttr(B)}">${c.neck('slouch')}</g>` : '') + arms.front + '</g>';
}

/* Half-closed lid across the upper half of an eye (fur coloured), as on Mar3y and Shams. */
const crewLid = (cx, cy, rx, ry, fur) => `<path d="M${cx - rx - 1.5} ${cy + 1} A${rx + 1.5} ${ry + 1.5} 0 0 1 ${cx + rx + 1.5} ${cy + 1}Z" fill="${fur}" stroke="${K.ink}" stroke-width="3" stroke-linejoin="round"/>`;
/* Head silhouette with a shared outline, so overlapping ellipses read as one shape. */
const crewBlob = (parts, sw = 8) => parts.map(([x, y, rx, ry]) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${K.ink}" stroke="${K.ink}" stroke-width="${sw}"/>`).join('');
