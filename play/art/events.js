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
