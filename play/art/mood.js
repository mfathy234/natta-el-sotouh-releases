/* Mar3y's menu moods: the couch slouch with a different face or paw, drawn in the same wide box as a little rooftop ledge with a tea glass.
   Frames are named mood:<frame>:0 in the sprite catalogue; src/moods.js plays them on the menu.
   MOOD_VB is wider than HERO_VB (200 instead of 146 units) so the ledge sits to the right of the couch. */

const MOOD_VB = '-10 -2 200 130';
const MOOD_SIZE = { w: 129, h: 84 };
const GLASS_VB = '0 0 24 28';

/** A tea glass (istikana) with a saucer, standing on y = 28 of its own box. */
function teaGlassArt(saucer = true) {
  return (saucer ? `<ellipse cx="12" cy="26" rx="10" ry="2.6" fill="${K.white}" ${S(2.2)}/>` : "") +
    `<path d="M5 6 L7 24 Q12 26 17 24 L19 6Z" fill="#fff4d8" ${S(2.6)}/><path d="M5.8 11 L7.6 23.4 Q12 25 16.4 23.4 L18.2 11Z" fill="#b5541f"/>` +
    `<path d="M5 6 H19" stroke="${K.gold}" stroke-width="2.4" stroke-linecap="round"/><path d="M9 13 L10 20" stroke="${K.white}" stroke-width="2" stroke-linecap="round" opacity=".7"/>`;
}

/** The rooftop ledge to the right of the couch. tilt: degrees the glass leans (knock); glass false leaves the ledge empty. */
function moodLedge(glass, tilt = 0) {
  const slab = `<path d="M140 80 H196 V92 H140Z" fill="#d98a6a" ${S(3.5)}/><path d="M140 80 H196" stroke="#f3c9a4" stroke-width="3"/><path d="M148 92 V108 M188 92 V108" stroke="${K.ink}" stroke-width="3.5" stroke-linecap="round"/>`;
  const g = glass ? `<g transform="translate(${tilt ? 156 : 152} 52) rotate(${tilt} ${tilt ? 17 : 12} 28) scale(1)">${teaGlassArt()}</g>` : '';
  return slab + g;
}

const MOOD_FRAMES = {
  calm: () => mareiSlouch({ mode: 'calm' }) + moodLedge(true),
  blink: () => mareiSlouch({ mode: 'blink' }) + moodLedge(true),
  yawn: () => mareiSlouch({ mode: 'yawn' }) + moodLedge(true),
  lick0: () => mareiSlouch({ mode: 'blink', arms: 'lick', lick: 0 }) + moodLedge(true),
  lick1: () => mareiSlouch({ mode: 'blink', arms: 'lick', lick: 1 }) + moodLedge(true),
  stretch: () => mareiSlouch({ mode: 'yawn', arms: 'stretch' }) + moodLedge(true),
  knock0: () => mareiSlouch({ mode: 'smug', arms: 'knock', reach: 0 }) + moodLedge(true),
  knock1: () => mareiSlouch({ mode: 'smug', arms: 'knock', reach: 1 }) + moodLedge(true, 24),
  knock2: () => mareiSlouch({ mode: 'smug' }) + moodLedge(false),
  proud: () => mareiSlouch({ mode: 'proud' }) + moodLedge(true) + moodSparks(),
  meh: () => mareiSlouch({ mode: 'meh' }) + moodLedge(true),
  sleep0: () => mareiSlouch({ mode: 'sleepy' }) + moodLedge(true) + moodZ(140, 36, 5),
  sleep1: () => mareiSlouch({ mode: 'sleepy' }) + moodLedge(true) + moodZ(140, 36, 5) + moodZ(156, 16, 8)
};

const MOOD_NAMES = Object.keys(MOOD_FRAMES);

function moodZ(x, y, s) {
  return `<path d="M${x} ${y} H${x + s * 1.6} L${x} ${y + s * 1.8} H${x + s * 1.6}" fill="none" ${S(2.6)}/>`;
}

function moodSparks() {
  return sparkle(60, 6, 6, K.gold) + sparkle(116, 14, 5, K.gold) + sparkle(30, 30, 4, K.gold);
}
