/* Platforms. Every sprite is 128 x 48 and the surface you land on is the horizontal line y = 24,
   so a platform is drawn centred on its collision y. Drawn at 64 x 24 in game. */

const PLAT_VB = '0 0 128 48';

function balconyArt() {
  const bars = [30, 44, 58, 72, 86, 100].map(x => `<path d="M${x} 24 V10" stroke="${K.greyDark}" stroke-width="2.5" stroke-linecap="round"/>`).join('');
  return `<path d="M26 10 H110" stroke="${K.greyDark}" stroke-width="3" stroke-linecap="round"/>` + bars +
    `<rect x="8" y="24" width="112" height="12" rx="4" fill="${K.sandLight}" ${S(4)}/>` +
    `<rect x="12" y="27" width="60" height="3" rx="1.5" fill="${K.white}" opacity=".8"/>` +
    `<path d="M24 36 L24 44 L34 36 M104 36 L104 44 L94 36" fill="${K.sandDark}" ${S(3)}/>` +
    `<path d="M92 24 L95 12 L109 12 L112 24Z" fill="${K.copper}" ${S(3)}/>` +
    `<circle cx="99" cy="9" r="5" fill="${K.red}" ${S(2.5)}/><circle cx="106" cy="8" r="4.5" fill="${K.redLight}" ${S(2.5)}/><path d="M102 12 q-1 -6 -5 -7" stroke="${K.green}" stroke-width="2.5" fill="none" stroke-linecap="round"/>`;
}

function acArt(frame = 0) {
  const drop = frame ? 38 : 33;
  return `<rect x="12" y="24" width="104" height="20" rx="6" fill="${K.white}" ${S(4)}/>` +
    `<rect x="18" y="28" width="46" height="3" rx="1.5" fill="${K.paper}"/>` +
    `<path d="M70 30 H106 M70 35 H106 M70 40 H106" stroke="${K.grey}" stroke-width="2.5" stroke-linecap="round"/>` +
    `<circle cx="36" cy="35" r="5.5" fill="${K.blueLight}" ${S(2.5)}/><circle cx="36" cy="35" r="1.6" fill="${K.ink}"/>` +
    `<path d="M22 44 V47 M106 44 V47" stroke="${K.ink}" stroke-width="3.5" stroke-linecap="round"/>` +
    `<path d="M96 ${drop} q-4 6 0 8 q4 -2 0 -8Z" fill="${K.teal}" ${S(1.8)} transform="translate(0 ${frame ? 3 : 0})"/>`;
}

function dishArt(squash = 0) {
  const top = 24 + squash * 5;
  const coil = [0, 1, 2, 3].map(i => `L${i % 2 ? 54 : 74} ${top + 3 + i * (20 - squash * 5) / 4}`).join(' ');
  return `<path d="M64 ${top + 3} ${coil} L64 44" fill="none" stroke="${K.ink}" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>` +
    `<path d="M64 ${top + 3} ${coil} L64 44" fill="none" stroke="${K.greyDark}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>` +
    `<rect x="46" y="43" width="36" height="5" rx="2.5" fill="${K.woodDark}" ${S(3)}/>` +
    `<path d="M14 ${top - 14} Q64 ${top + 12} 114 ${top - 14} Q64 ${top - 2} 14 ${top - 14}Z" fill="${K.white}" ${S(4)}/>` +
    `<path d="M18 ${top - 12} Q64 ${top + 6} 110 ${top - 12}" fill="none" stroke="${K.red}" stroke-width="3.5" stroke-linecap="round"/>` +
    `<path d="M64 ${top - 4} L84 ${top - 24}" stroke="${K.ink}" stroke-width="3.5" stroke-linecap="round"/><circle cx="84" cy="${top - 25}" r="4.5" fill="${K.gold}" ${S(2.5)}/>`;
}

function laundryArt(snapped = false) {
  if (snapped) {
    return `<path d="M6 22 Q40 36 62 40" fill="none" ${S(4)}/><path d="M122 22 Q90 36 68 40" fill="none" ${S(4)}/>`;
  }
  return `<path d="M4 24 H124" stroke="${K.ink}" stroke-width="5" stroke-linecap="round"/><path d="M4 24 H124" stroke="${K.sandLight}" stroke-width="2" stroke-linecap="round"/>` +
    `<path d="M22 24 L18 40 H40 L36 24Z" fill="${K.teal}" ${S(3)}/>` +
    `<path d="M50 24 L48 32 Q56 40 64 32 L62 24Z" fill="${K.red}" ${S(3)}/>` +
    `<path d="M76 24 L72 44 H100 L96 24Z" fill="${K.white}" ${S(3)}/><path d="M78 32 H94 M77 38 H97" stroke="${K.blue}" stroke-width="3"/>` +
    [22, 36, 50, 62, 76, 96].map(x => `<rect x="${x - 2}" y="20" width="4.5" height="8" rx="1.5" fill="${K.gold}" ${S(1.8)}/>`).join('') +
    `<path d="M108 24 L110 36 L118 36 L120 24Z" fill="${K.gold}" ${S(3)}/>`;
}

function plankArt() {
  return `<rect x="8" y="24" width="112" height="13" rx="4" fill="${K.wood}" ${S(4)}/>` +
    `<path d="M14 29 H60 M72 32 H112" stroke="${K.woodDark}" stroke-width="2" stroke-linecap="round" opacity=".7"/>` +
    `<circle cx="18" cy="30" r="2" fill="${K.woodDark}"/><circle cx="110" cy="30" r="2" fill="${K.woodDark}"/>` +
    `<path d="M10 37 V44 M118 37 V44" stroke="${K.ink}" stroke-width="3.5" stroke-linecap="round"/>` +
    `<ellipse cx="94" cy="17" rx="10" ry="8" fill="${K.grey}" ${S(3)}/><circle cx="102" cy="11" r="5.5" fill="${K.grey}" ${S(3)}/><path d="M107 11 l5 1.5 l-5 1.5Z" fill="${K.orange}" ${S(1.8)}/><circle cx="103" cy="10" r="1.3" fill="${K.ink}"/><path d="M85 19 Q80 16 78 20" fill="none" ${S(2.5)}/>` +
    `<path d="M92 24 V27 M98 24 V27" stroke="${K.orange}" stroke-width="2.5" stroke-linecap="round"/>`;
}

function shutterArt(flip = 0) {
  const h = Math.max(2, 14 * (1 - flip));
  const slats = [0, 1, 2].map(i => `<path d="M16 ${24 + (i + 1) * h / 4} H112" stroke="${K.ink}" stroke-width="2" opacity=".6"/>`).join('');
  return `<rect x="8" y="24" width="112" height="${h}" rx="3" fill="${K.teal}" ${S(4)}/>` + slats +
    `<circle cx="16" cy="${24 + h / 2}" r="3.2" fill="${K.gold}" ${S(2)}/><circle cx="112" cy="${24 + h / 2}" r="3.2" fill="${K.gold}" ${S(2)}/>` +
    `<rect x="10" y="${26 + h * 0.15}" width="108" height="3" rx="1.5" fill="${K.tealLight}"/>`;
}

function tankArt() {
  return `<path d="M30 36 L22 47 M98 36 L106 47 M64 38 V47" stroke="${K.ink}" stroke-width="5" stroke-linecap="round"/>` +
    `<path d="M30 36 L22 47 M98 36 L106 47 M64 38 V47" stroke="${K.greyDark}" stroke-width="2" stroke-linecap="round"/>` +
    `<path d="M14 28 Q14 36 24 37 H104 Q114 36 114 28 V26 H14Z" fill="${K.blue}" ${S(4)}/>` +
    `<path d="M22 31 V35 M64 31 V36" stroke="${K.blueLight}" stroke-width="3" stroke-linecap="round" opacity=".7"/>` +
    `<ellipse cx="64" cy="26" rx="50" ry="4.5" fill="${K.blueLight}" ${S(4)}/>` +
    `<rect x="54" y="14" width="20" height="10" rx="4" fill="${K.greyDark}" ${S(3)}/>`;
}

function towerArt() {
  const holes = [[50, 36], [64, 40], [78, 36]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="3.2" ry="4" fill="${K.ink}"/>`).join('');
  return `<path d="M44 30 L38 47 H90 L84 30Z" fill="${K.sand}" ${S(4)}/>` + holes +
    `<rect x="26" y="24" width="76" height="9" rx="4" fill="${K.sandDark}" ${S(4)}/>` +
    `<rect x="30" y="26" width="40" height="2.5" rx="1.2" fill="${K.sandLight}"/>` +
    `<path d="M34 24 L34 14 M46 24 V16 M58 24 V14 M70 24 V16 M82 24 V14 M94 24 V16" stroke="${K.woodDark}" stroke-width="3" stroke-linecap="round"/>` +
    `<ellipse cx="52" cy="17" rx="7" ry="5.5" fill="${K.white}" ${S(2.5)}/><circle cx="58" cy="12" r="3.8" fill="${K.white}" ${S(2.5)}/><path d="M62 12 l3 1 l-3 1Z" fill="${K.orange}" ${S(1.5)}/>`;
}

/* Minaret tip: a stone balcony ring with arched railing, a hanging lamp, and a spire with a gold crescent. */
function minaretArt() {
  const arches = [34, 48, 62, 76, 90].map(x => `<path d="M${x} 24 V16 Q${x + 6} 10 ${x + 12} 16 V24" fill="none" stroke="${K.sandDark}" stroke-width="2.5" stroke-linecap="round"/>`).join('');
  return `<path d="M58 14 Q60 0 64 -2 Q68 0 70 14Z" fill="${K.teal}" ${S(3.5)} transform="translate(0 10)"/>` +
    `<path d="M64 6 V-4" stroke="${K.ink}" stroke-width="3" stroke-linecap="round"/>` +
    `<path d="M70 -4 a8 8 0 1 1 -3 -11 a6 6 0 0 0 3 11Z" fill="${K.gold}" ${S(2.5)} transform="translate(0 12)"/>` +
    `<rect x="30" y="8" width="68" height="6" rx="3" fill="${K.sandLight}" ${S(3)}/>` + arches +
    `<path d="M52 33 L56 47 H72 L76 33Z" fill="${K.sandLight}" ${S(4)}/><path d="M62 36 V46" stroke="${K.sandDark}" stroke-width="2.5" stroke-linecap="round"/>` +
    `<rect x="24" y="24" width="80" height="10" rx="5" fill="${K.sandLight}" ${S(4)}/><rect x="30" y="26.5" width="34" height="2.5" rx="1.2" fill="${K.white}"/>` +
    `<path d="M98 34 V40" stroke="${K.ink}" stroke-width="2.5" stroke-linecap="round"/><path d="M93 41 H103 L101 49 H95Z" fill="${K.gold}" ${S(2.5)}/><circle cx="98" cy="45" r="2.3" fill="${K.white}"/>`;
}

/** A puffy sleepy cloud. frame 1 is the sag when you stand on it: squashed, mouth in a yawn. */
function cloudPlatArt(frame = 0) {
  const blobs = [[26, 30, 14], [46, 22, 18], [74, 22, 17], [98, 30, 13]];
  const o = blobs.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${K.ink}" stroke="${K.ink}" stroke-width="8"/>`).join('') +
    `<rect x="14" y="26" width="96" height="18" rx="9" fill="${K.ink}" stroke="${K.ink}" stroke-width="8"/>`;
  const f = blobs.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${K.white}"/>`).join('') +
    `<rect x="14" y="26" width="96" height="18" rx="9" fill="${K.white}"/>`;
  const sag = frame ? 'translate(0 24) scale(1.06 .8) translate(0 -24)' : '';
  const eyeY = frame ? 33 : 31;
  const face = `<path d="M44 ${eyeY} q5 4 10 0 M70 ${eyeY} q5 4 10 0" fill="none" ${S(2.8)}/>` +
    (frame ? `<ellipse cx="62" cy="${eyeY + 7}" rx="4" ry="3.2" fill="#7a1a1a" ${S(2)}/>` : `<path d="M57 ${eyeY + 6} q5 4 10 0" fill="none" ${S(2.5)}/>`) +
    `<ellipse cx="38" cy="${eyeY + 5}" rx="5" ry="3" fill="${K.pink}" opacity=".7"/><ellipse cx="86" cy="${eyeY + 5}" rx="5" ry="3" fill="${K.pink}" opacity=".7"/>` +
    (frame ? '' : `<path d="M96 12 h6 l-6 6 h6 M104 4 h5 l-5 5 h5" fill="none" stroke="${K.blueLight}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>`);
  return `<g transform="${sag}">${o}${f}<path d="M30 20 Q38 10 50 10" stroke="${K.blueLight}" stroke-width="3" fill="none" stroke-linecap="round" opacity=".5"/>${face}</g>`;
}

/* Registry: type -> frames. frames[0] is the resting look. */
const PLATFORM_ART = {
  balcony: [balconyArt], ac: [() => acArt(0), () => acArt(1)], dish: [() => dishArt(0), () => dishArt(1)],
  laundry: [() => laundryArt(false), () => laundryArt(true)], plank: [plankArt],
  shutter: [() => shutterArt(0), () => shutterArt(0.55)], tank: [tankArt], tower: [towerArt], minaret: [minaretArt], cloud: [() => cloudPlatArt(0), () => cloudPlatArt(1)]
};
