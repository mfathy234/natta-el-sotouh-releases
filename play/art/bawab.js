/* El Bawab البواب, the doorman boss of the Tower: a grumpy old rooster in a striped galabeya and a white skullcap, with a cane and a ring of keys.
   160 x 160 grid, drawn at 92 px. Poses: 0 and 1 (climbing, legs alternate), 'throw' (arm up with a key), 'beat' (dizzy and slumped). Plus the thrown key. */

const BAWAB_VB = '0 0 160 160';

function bawabHead(mode) {
  const eyes = mode === 'dizzy'
    ? `<path d="M62 42 l12 12 m0 -12 l-12 12 M86 42 l12 12 m0 -12 l-12 12" stroke="${K.ink}" stroke-width="4" stroke-linecap="round"/>`
    : pieEye(68, 49, 7.5, 9.5, 2, 2) + pieEye(92, 49, 7.5, 9.5, -2, 2) +
      `<path d="M56 38 L74 47" stroke="${K.ink}" stroke-width="5.5" stroke-linecap="round"/><path d="M104 38 L86 47" stroke="${K.ink}" stroke-width="5.5" stroke-linecap="round"/>`;
  return `<circle cx="80" cy="52" r="27" fill="${K.orange}" ${S(4.5)}/>` +
    `<ellipse cx="80" cy="64" rx="17" ry="12" fill="${K.sandLight}" opacity=".85"/>` +
    eyes +
    `<path d="M68 60 L80 80 L92 60Z" fill="${K.gold}" ${S(3.5)}/><path d="M73 66 H87" stroke="${K.goldDark}" stroke-width="2.5" stroke-linecap="round"/>` +
    `<path d="M77 80 Q80 98 83 80Z" fill="${K.redLight}" ${S(3)}/>` +
    `<path d="M54 32 Q80 4 106 32 Q80 24 54 32Z" fill="${K.white}" ${S(4)}/><path d="M64 26 Q80 16 96 26" fill="none" stroke="${K.paper}" stroke-width="3" stroke-linecap="round"/>` +
    `<circle cx="72" cy="12" r="8.5" fill="${K.red}" ${S(3.5)}/><circle cx="84" cy="8" r="9.5" fill="${K.red}" ${S(3.5)}/><circle cx="96" cy="13" r="8" fill="${K.red}" ${S(3.5)}/>`;
}

function bawabRobe() {
  const stripes = [60, 72, 84, 96, 108].map((x, i) => `<path d="M${x} 80 L${x + (i - 2) * 3.6} 143" stroke="${K.white}" stroke-width="3" stroke-linecap="round" opacity=".8"/>`).join('');
  return `<path d="M54 80 Q80 70 106 80 L124 146 Q80 156 36 146Z" fill="${K.blueLight}" ${S(4.5)}/>` + stripes +
    `<path d="M66 78 L80 98 L94 78" fill="${K.white}" ${S(3.5)}/><circle cx="80" cy="112" r="3.5" fill="${K.ink}"/><circle cx="80" cy="126" r="3.5" fill="${K.ink}"/>`;
}

const bawabLeg = (x0, x1, y1) => `<path d="M${x0} 146 L${x1} ${y1}" stroke="${K.ink}" stroke-width="11" stroke-linecap="round"/><path d="M${x0} 146 L${x1} ${y1}" stroke="${K.gold}" stroke-width="5.5" stroke-linecap="round"/>` +
  `<path d="M${x1 - 9} ${y1 + 2} h18" stroke="${K.ink}" stroke-width="9" stroke-linecap="round"/><path d="M${x1 - 9} ${y1 + 2} h18" stroke="${K.gold}" stroke-width="4" stroke-linecap="round"/>`;

const bawabCane = (x, y0) => `<path d="M${x} 156 V${y0 + 12} Q${x} ${y0} ${x + 12} ${y0}" fill="none" stroke="${K.ink}" stroke-width="9" stroke-linecap="round"/>` +
  `<path d="M${x} 156 V${y0 + 12} Q${x} ${y0} ${x + 12} ${y0}" fill="none" stroke="${K.wood}" stroke-width="4.5" stroke-linecap="round"/>`;

function bawabKeyRing(x, y) {
  return `<circle cx="${x}" cy="${y}" r="10" fill="none" stroke="${K.ink}" stroke-width="6"/><circle cx="${x}" cy="${y}" r="10" fill="none" stroke="${K.gold}" stroke-width="3"/>` +
    `<path d="M${x - 3} ${y + 10} l-4 12 h8 l-1 -12Z M${x + 5} ${y + 9} l5 11 h-8Z" fill="${K.gold}" ${S(2.5)}/>`;
}

const bawabArm = (d, fill = K.blueLight) => `<path d="${d}" fill="none" stroke="${K.ink}" stroke-width="12" stroke-linecap="round"/><path d="${d}" fill="none" stroke="${fill}" stroke-width="7" stroke-linecap="round"/>`;

/* pose: 0, 1, 'throw' or 'beat' */
function bawabArt(pose = 0) {
  if (pose === 'beat') {
    return `<g transform="rotate(14 80 150)">` +
      bawabLeg(66, 52, 152) + bawabLeg(96, 112, 152) + bawabRobe() + bawabHead('dizzy') +
      bawabArm('M58 88 Q44 104 54 122') + glove(54, 126, 8) + bawabArm('M102 88 Q118 104 108 124') + glove(108, 128, 8) +
      `</g>` + sparkle(36, 40, 11, K.gold) + sparkle(128, 28, 9, K.gold) + sparkle(112, 70, 7, K.white) + bawabKeyRing(30, 142);
  }
  const f = pose === 1 ? 1 : 0, throwing = pose === 'throw';
  const lx = f ? 70 : 62, rx = f ? 98 : 104;
  const armR = throwing
    ? bawabArm('M104 88 Q130 78 128 46') + glove(128, 38, 8) +
      `<circle cx="140" cy="22" r="8" fill="none" stroke="${K.ink}" stroke-width="6"/><circle cx="140" cy="22" r="8" fill="none" stroke="${K.gold}" stroke-width="3"/><path d="M146 28 L156 40 M152 34 l6 -2" stroke="${K.gold}" stroke-width="4" stroke-linecap="round"/>`
    : bawabArm('M104 88 Q122 98 122 118') + glove(122, 122, 8) + bawabKeyRing(126, 142);
  return bawabCane(36, 82) + bawabLeg(lx, lx - (f ? 4 : 2), 152 - f * 4) + bawabLeg(rx, rx + (f ? 2 : 4), 148 + f * 4) + bawabRobe() +
    bawabArm('M56 88 Q40 104 40 124') + glove(40, 128, 8) + bawabHead('angry') + armR;
}

/* The thrown key: a big brass key, ring head on the left. 128 grid. */
function keyArt() {
  return `<circle cx="36" cy="64" r="26" fill="${K.gold}" ${S(5)}/><circle cx="36" cy="64" r="11" fill="${K.night}" ${S(3.5)}/>` +
    `<path d="M60 64 H112" stroke="${K.ink}" stroke-width="16" stroke-linecap="round"/><path d="M60 64 H112" stroke="${K.gold}" stroke-width="9" stroke-linecap="round"/>` +
    `<path d="M92 66 V86 M106 66 V80" stroke="${K.ink}" stroke-width="12" stroke-linecap="butt"/><path d="M92 66 V86 M106 66 V80" stroke="${K.gold}" stroke-width="6" stroke-linecap="butt"/>` +
    `<path d="M22 50 Q30 42 40 42" stroke="${K.white}" stroke-width="5" fill="none" stroke-linecap="round" opacity=".8"/>`;
}
