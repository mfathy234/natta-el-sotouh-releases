/* Pickups and small props, 128 x 128 grid. */

const ITEM_VB = '0 0 128 128';

function coinArt(frame = 0) {
  const rx = frame ? 34 : 46;
  return `<ellipse cx="64" cy="64" rx="${rx}" ry="46" fill="${K.gold}" ${S(5)}/>` +
    `<ellipse cx="64" cy="64" rx="${rx * 0.66}" ry="31" fill="none" stroke="${K.goldDark}" stroke-width="4"/>` +
    `<path d="M64 42 L70 58 L86 58 L73 68 L78 84 L64 74 L50 84 L55 68 L42 58 L58 58Z" fill="${K.goldDark}" opacity="${frame ? 0 : 1}"/>` +
    `<path d="M${64 - rx * 0.6} 38 Q${64 - rx * 0.3} 28 ${64 + rx * 0.1} 28" stroke="${K.white}" stroke-width="5" fill="none" stroke-linecap="round" opacity=".8"/>`;
}

/* Kite طيارة ورق: diamond with a bow tail */
function kiteArt() {
  return `<path d="M64 10 L100 56 L64 100 L28 56Z" fill="${K.red}" ${S(5)}/>` +
    `<path d="M64 10 L100 56 L64 56Z" fill="${K.gold}"/><path d="M28 56 L64 100 L64 56Z" fill="${K.gold}"/>` +
    `<path d="M64 10 L100 56 L64 100 L28 56Z" fill="none" ${S(5)}/><path d="M64 10 V100 M28 56 H100" stroke="${K.ink}" stroke-width="3"/>` +
    `<path d="M64 100 Q50 110 64 118 Q78 124 64 128" fill="none" ${S(3.5)}/>` +
    `<path d="M56 110 l-6 -5 l0 10Z M72 120 l6 -5 l0 10Z" fill="${K.teal}" ${S(2.5)}/>`;
}

/* Bowl of ful طبق فول: copper bowl, brown beans, steam */
function fulArt() {
  return `<path d="M44 20 Q36 34 46 46 M64 12 Q54 28 64 42 M84 20 Q76 34 86 46" fill="none" stroke="${K.white}" stroke-width="6" stroke-linecap="round" opacity=".85"/>` +
    `<path d="M16 66 Q64 54 112 66 Q108 112 64 114 Q20 112 16 66Z" fill="${K.copper}" ${S(5)}/>` +
    `<ellipse cx="64" cy="66" rx="48" ry="12" fill="${K.tea}" ${S(5)}/>` +
    [[38, 64], [54, 68], [72, 63], [88, 67], [62, 61], [48, 60], [80, 69]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="7" ry="4.5" fill="${K.woodDark}" ${S(2)}/>`).join('') +
    `<path d="M30 80 Q36 100 56 106" stroke="${K.orange}" stroke-width="5" fill="none" stroke-linecap="round" opacity=".8"/>` +
    `<circle cx="66" cy="60" r="5" fill="${K.gold}" ${S(2)}/>`;
}

/* Blue bead خرزة زرقا: round blue charm with a white eye */
function beadArt() {
  return `<circle cx="64" cy="70" r="40" fill="${K.bead}" ${S(5)}/>` +
    `<circle cx="64" cy="70" r="27" fill="${K.white}" ${S(3.5)}/><circle cx="64" cy="70" r="16" fill="${K.blue}" ${S(3.5)}/><circle cx="64" cy="70" r="7" fill="${K.ink}"/>` +
    `<path d="M40 44 Q48 34 62 32" stroke="${K.white}" stroke-width="5" fill="none" stroke-linecap="round" opacity=".7"/>` +
    `<circle cx="64" cy="24" r="8" fill="none" ${S(5)}/><circle cx="64" cy="24" r="8" fill="none" stroke="${K.gold}" stroke-width="2.5"/>`;
}

/* Ice-cream cone كورنيت آيس كريم: waffle cone, a pink and a cream scoop, a cherry. The event bonus pickup. */
function coneArt() {
  const hatch = [[50, 74, 68, 96], [64, 70, 76, 92], [78, 68, 84, 82], [52, 92, 76, 74], [60, 104, 80, 80]];
  return `<path d="M38 62 L90 62 L64 122Z" fill="${K.sand}" ${S(5)}/>` +
    hatch.map(([a, b, c, d]) => `<path d="M${a} ${b} L${c} ${d}" stroke="${K.sandDark}" stroke-width="3" stroke-linecap="round"/>`).join('') +
    `<path d="M38 62 L90 62 L64 122Z" fill="none" ${S(5)}/>` +
    `<circle cx="64" cy="30" r="20" fill="${K.white}" ${S(5)}/>` +
    `<path d="M32 64 Q30 46 46 44 Q64 40 82 44 Q98 46 96 64 Q90 74 82 66 Q74 76 64 66 Q54 76 46 66 Q38 74 32 64Z" fill="${K.pink}" ${S(5)}/>` +
    `<path d="M44 52 Q50 46 60 46" stroke="${K.white}" stroke-width="5" fill="none" stroke-linecap="round" opacity=".75"/>` +
    `<path d="M64 12 Q66 4 74 2" fill="none" ${S(3.5)}/><circle cx="64" cy="14" r="7" fill="${K.red}" ${S(3.5)}/>`;
}

function starArt(fill = K.gold) {
  return `<path d="M64 12 L78 46 L116 48 L86 72 L96 110 L64 88 L32 110 L42 72 L12 48 L50 46Z" fill="${fill}" ${S(5)}/>`;
}

/* Heart-less UI icons */
function soundOnArt() {
  return `<path d="M20 50 H42 L72 24 V104 L42 78 H20Z" fill="${K.white}" ${S(6)}/>` +
    `<path d="M88 44 Q104 64 88 84 M100 30 Q128 64 100 98" fill="none" ${S(6)}/>`;
}
function soundOffArt() {
  return `<path d="M20 50 H42 L72 24 V104 L42 78 H20Z" fill="${K.white}" ${S(6)}/>` + `<path d="M92 46 L122 82 M122 46 L92 82" ${S(7)} fill="none"/>`;
}
function pauseArt() {
  return `<rect x="30" y="24" width="24" height="80" rx="8" fill="${K.white}" ${S(6)}/><rect x="74" y="24" width="24" height="80" rx="8" fill="${K.white}" ${S(6)}/>`;
}

const ITEM_ART = {
  coin: [() => coinArt(0), () => coinArt(1)], kite: [kiteArt], ful: [fulArt], bead: [beadArt],
  star: [() => starArt()], cone: [coneArt], soundOn: [soundOnArt], soundOff: [soundOffArt], pause: [pauseArt]
};
const ITEM_SIZE = { coin: 22, kite: 38, ful: 36, bead: 32, star: 24, cone: 34, soundOn: 24, soundOff: 24, pause: 24 };
