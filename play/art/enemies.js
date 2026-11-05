/* Hazards. All on a 128 x 128 grid, facing the player, 2 frames where wings flap. */

const ENEMY_VB = '0 0 128 128';

function angryBrows(y, spread = 20, w = 5) {
  return `<path d="M${64 - spread - 10} ${y - 4} L${64 - 4} ${y + 5}" stroke="${K.ink}" stroke-width="${w}" stroke-linecap="round"/>` +
    `<path d="M${64 + spread + 10} ${y - 4} L${64 + 4} ${y + 5}" stroke="${K.ink}" stroke-width="${w}" stroke-linecap="round"/>`;
}

/* Grumpy pigeon حمامة: grey, shiny green-purple neck, scowl */
function pigeonArt(frame = 0) {
  const wy = frame ? 20 : 54, wy2 = frame ? 4 : 70;
  const wing = `<path d="M44 70 Q14 ${wy} 8 ${wy2} Q30 ${wy + 6} 44 ${wy + 24}Z" fill="${K.grey}" ${S(4)}/><path d="M18 ${wy + 6} Q28 ${wy + 12} 36 ${wy + 20}" stroke="${K.greyDark}" stroke-width="3" fill="none" stroke-linecap="round"/>`;
  return `<ellipse cx="64" cy="118" rx="22" ry="5" fill="${K.ink}" opacity=".0"/>` +
    wing + mirror(64, wing) +
    `<path d="M50 96 L44 114 L64 106 L84 114 L78 96Z" fill="${K.greyDark}" ${S(4)}/>` +
    `<ellipse cx="64" cy="80" rx="30" ry="29" fill="${K.grey}" ${S(4)}/>` +
    `<path d="M42 64 Q64 52 86 64 Q80 78 64 78 Q48 78 42 64Z" fill="${K.teal}" ${S(3)}/><path d="M48 66 Q64 58 80 66" stroke="${K.plum}" stroke-width="4" fill="none" stroke-linecap="round" opacity=".7"/>` +
    `<circle cx="64" cy="46" r="24" fill="${K.grey}" ${S(4)}/>` +
    pieEye(53, 44, 7.5, 9.5, 1.5, 2) + pieEye(75, 44, 7.5, 9.5, -1.5, 2) + angryBrows(36, 11) +
    `<path d="M56 56 L64 70 L72 56Z" fill="${K.orange}" ${S(3.5)}/>` +
    `<path d="M50 28 Q64 20 78 28" stroke="${K.white}" stroke-width="3" fill="none" stroke-linecap="round" opacity=".6"/>`;
}

/* Crow غراب: ink-black plum feathers, yellow beak, side-on flier */
function crowArt(frame = 0) {
  const wing = frame
    ? `<path d="M52 66 Q36 22 10 20 Q22 42 18 52 Q34 50 40 72Z" fill="${K.plum}" ${S(4)}/>`
    : `<path d="M52 70 Q30 76 8 100 Q30 100 40 90 Q36 108 56 92Z" fill="${K.plum}" ${S(4)}/>`;
  return mirror(64, wing) + wing +
    `<path d="M50 98 L40 118 L58 108 L64 120 L70 108 L88 118 L78 98Z" fill="${K.night}" ${S(4)}/>` +
    `<ellipse cx="64" cy="76" rx="28" ry="30" fill="${K.night}" ${S(4)}/>` +
    `<circle cx="64" cy="46" r="23" fill="${K.night}" ${S(4)}/>` +
    `<ellipse cx="64" cy="40" rx="10" ry="4" fill="${K.plum}" opacity=".8"/>` +
    pieEye(54, 46, 7, 8.5, 1.5, 2) + pieEye(74, 46, 7, 8.5, -1.5, 2) + angryBrows(38, 10, 5.5) +
    `<path d="M54 54 L64 74 L74 54Z" fill="${K.gold}" ${S(3.5)}/><path d="M58 60 H70" stroke="${K.goldDark}" stroke-width="2.5" stroke-linecap="round"/>`;
}

/* Plastic bag كيس: see-through white bag with handles and a grumpy face */
function bagArt(frame = 0) {
  const sway = frame ? 4 : -4;
  return `<path d="M44 34 Q${44 + sway} 8 56 10 M84 34 Q${84 + sway} 8 72 10" fill="none" stroke="${K.ink}" stroke-width="10" stroke-linecap="round"/>` +
    `<path d="M44 34 Q${44 + sway} 8 56 10 M84 34 Q${84 + sway} 8 72 10" fill="none" stroke="${K.white}" stroke-width="5" stroke-linecap="round"/>` +
    `<path d="M34 34 Q20 70 28 98 Q36 120 64 118 Q92 120 100 98 Q108 70 94 34 Q64 24 34 34Z" fill="${K.white}" opacity=".92" ${S(4)}/>` +
    `<path d="M40 44 Q32 70 38 92" stroke="${K.blueLight}" stroke-width="5" fill="none" stroke-linecap="round" opacity=".6"/>` +
    `<path d="M50 112 Q${56 + sway} 124 64 116" fill="none" ${S(3)} opacity=".0"/>` +
    pieEye(51, 66, 8, 10, 1.5, 2) + pieEye(77, 66, 8, 10, -1.5, 2) + angryBrows(58, 12, 5) +
    `<path d="M52 92 Q64 84 76 92" fill="none" ${S(3.5)}/>`;
}

/* Thrown slipper شبشب: brown flip-flop with a blue strap */
function slipperArt() {
  return `<g transform="rotate(-20 64 64)"><path d="M40 12 Q64 4 88 12 Q98 36 92 70 Q90 112 64 120 Q38 112 36 70 Q30 36 40 12Z" fill="${K.tea}" ${S(5)}/>` +
    `<path d="M46 20 Q64 14 82 20 Q88 40 84 66" fill="none" stroke="${K.orange}" stroke-width="5" stroke-linecap="round" opacity=".7"/>` +
    `<path d="M44 62 Q64 30 84 62 Q64 50 44 62Z" fill="${K.blue}" ${S(4)}/>` +
    `<path d="M48 64 Q64 44 80 64" fill="none" stroke="${K.blueLight}" stroke-width="3" stroke-linecap="round"/>` +
    `<path d="M50 96 Q64 104 78 96" fill="none" stroke="${K.woodDark}" stroke-width="4" stroke-linecap="round"/></g>`;
}

const ENEMY_ART = { pigeon: pigeonArt, crow: crowArt, bag: bagArt, slipper: slipperArt };
const ENEMY_SIZE = { pigeon: 46, crow: 46, bag: 46, slipper: 32 };
