/* Rooftop event props. The wedding firework: a rocket on a bottle stand, 68 x 108 grid, base at the bottom. frame 0 = waiting, 1 = lit and flaring. */

const ROCKET_VB = '0 0 68 108';

function rocketArt(frame = 0) {
  const flame = frame
    ? `<path d="M22 70 Q34 112 46 70 Q34 84 22 70Z" fill="${K.orange}" ${S(3.5)}/><path d="M27 70 Q34 98 41 70 Q34 78 27 70Z" fill="${K.gold}"/>` +
      `<path d="M12 80 l-6 8 M56 80 l6 8 M34 100 v8" stroke="${K.gold}" stroke-width="3.5" stroke-linecap="round"/>`
    : '';
  const stand = frame ? '' :
    `<path d="M26 108 V84 Q26 78 30 76 H38 Q42 78 42 84 V108Z" fill="${K.tealLight}" ${S(3.5)}/><path d="M30 84 V102" stroke="${K.white}" stroke-width="3" stroke-linecap="round" opacity=".7"/>`;
  const lift = frame ? -8 : 0;
  return stand + flame +
    `<g transform="translate(0 ${lift})">` +
    `<path d="M22 66 L14 84 L26 78Z M46 66 L54 84 L42 78Z" fill="${K.coral}" ${S(3.5)}/>` +
    `<path d="M22 70 V34 Q34 24 46 34 V70 Q34 78 22 70Z" fill="${K.red}" ${S(4.5)}/>` +
    `<path d="M22 46 Q34 52 46 46 M22 58 Q34 64 46 58" fill="none" stroke="${K.white}" stroke-width="5" stroke-linecap="round"/>` +
    `<path d="M22 36 Q34 -6 46 36 Q34 28 22 36Z" fill="${K.gold}" ${S(4.5)}/>` +
    `<path d="M27 66 V40" stroke="${K.white}" stroke-width="3" stroke-linecap="round" opacity=".6"/>` +
    `<circle cx="34" cy="52" r="4.5" fill="${K.white}" ${S(2.5)}/></g>`;
}

/* The ice-cream cart عربية الآيس كريم: striped umbrella, a teal box with a cone painted on it, two wheels and a brass bell on a bracket.
   76 x 66 grid, wheels at the bottom. frame 0 / 1 = the bell swings left / right. */
const CART_VB = '0 0 76 66';

function iceCreamCartArt(frame = 0) {
  const swing = frame ? 22 : -22;
  const wheel = x => `<circle cx="${x}" cy="55" r="8.5" fill="${K.white}" ${S(3)}/><circle cx="${x}" cy="55" r="2.6" fill="${K.ink}"/>` +
    `<path d="M${x - 6} 55 H${x + 6} M${x} 49 V61" stroke="${K.ink}" stroke-width="1.6" stroke-linecap="round"/>`;
  return `<ellipse cx="36" cy="63" rx="30" ry="3" fill="${K.ink}" opacity=".25"/>` +
    `<path d="M36 12 V32" stroke="${K.woodDark}" stroke-width="4" stroke-linecap="round"/>` +
    `<path d="M5 20 Q8 4 36 3 Q64 4 67 20Z" fill="${K.red}" ${S(3.2)}/>` +
    `<path d="M20 19 Q22 6 36 3 Q34 12 33 19Z M50 19 Q50 6 36 3 Q38 12 39 19Z" fill="${K.white}"/>` +
    `<path d="M5 20 Q8 4 36 3 Q64 4 67 20Z M5 20 Q13 25 20 20 Q28 25 36 20 Q44 25 52 20 Q60 25 67 20" fill="none" ${S(3.2)}/>` +
    `<rect x="9" y="29" width="50" height="24" rx="6" fill="${K.tealLight}" ${S(3.2)}/>` +
    `<path d="M9 36 H59" stroke="${K.ink}" stroke-width="2.4" stroke-linecap="round"/>` +
    `<path d="M29 41 H39 L34 52Z" fill="${K.sand}" ${S(2.2)}/><circle cx="34" cy="39" r="5.5" fill="${K.pink}" ${S(2.2)}/>` +
    `<path d="M59 40 H64 Q68 40 68 44 V50" fill="none" ${S(3)}/>` +
    `<g transform="translate(66 52) rotate(${swing})"><path d="M-6 0 Q-6 -10 0 -10 Q6 -10 6 0Z" fill="${K.gold}" ${S(2.6)}/><circle cx="0" cy="2" r="2.4" fill="${K.goldDark}" ${S(1.8)}/></g>` +
    wheel(22) + wheel(48);
}
