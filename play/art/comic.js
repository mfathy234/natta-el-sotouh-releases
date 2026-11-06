/* The intro comic: why Mar3y climbs. Three panels on a 360 x 300 grid, drawn from the game's own art (Mar3y, Hanafy, the facade).
   Panel art has no text: the bubbles and captions are HTML on top (src/comicui.js), so Arabic shapes properly. COMIC holds the script. */

const COMIC_VB = '0 0 360 300';

const COMIC = [
  { cap: { ar: 'عصر يوم هادي في الحارة... ومرعي مرتاح على السلّمة.', en: 'A quiet afternoon in the alley, and Mar3y is resting on the steps.' },
    bubbles: [{ x: 6, y: 8, w: 40, tail: 'bl', style: 'think', ar: 'يا دنيا يا هادية...', en: 'What a peaceful life...' }] },
  { cap: { ar: 'وفجأة... مناخيره اتحركت.', en: 'Then suddenly... his nose twitched.' },
    bubbles: [{ x: 52, y: 6, w: 44, tail: 'bl', style: 'shout', ar: 'ريحة سمك مشوي؟!', en: 'Grilled fish?!' }] },
  { cap: { ar: 'الجار اللي في الدور الأخير شوّى سمك على السطوح! يلا نطّة!', en: 'The neighbour on the top floor is grilling fish on the roof! Time to bounce!' },
    bubbles: [{ x: 2, y: 4, w: 38, tail: 'br', style: 'say', ar: 'أحلى سمك في الحارة، وبالراحة!', en: 'Best fish in the alley, nice and slow!' }, { x: 50, y: 79, w: 48, tail: 'tl', style: 'shout', ar: 'استنّى عليا يا سمك!', en: 'Wait for me, fish!' }] }
];

/** A grilled fish: tail, striped body, one pie-cut eye. Centred on (x, y), width about 56 * s. */
function fishArt(x, y, s = 1, rot = 0) {
  return `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${s})">` +
    `<path d="M-26 0 L-40 -13 L-38 0 L-40 13Z" fill="${K.copper}" ${S(3)}/>` +
    `<ellipse cx="0" cy="0" rx="28" ry="14" fill="${K.sandLight}" ${S(3.4)}/>` +
    `<path d="M-12 -8 L-8 8 M-2 -10 L2 10 M8 -8 L12 8" stroke="${K.tea}" stroke-width="3" stroke-linecap="round"/>` +
    `<circle cx="17" cy="-3" r="4" fill="${K.white}" ${S(2)}/><circle cx="18" cy="-3" r="2" fill="${K.ink}"/>` +
    `<path d="M26 4 Q22 7 19 5" fill="none" stroke="${K.ink}" stroke-width="2.2" stroke-linecap="round"/></g>`;
}

/** Three rising wisps of smoke / scent from (x, y) going up by h (negative goes up). */
function scentArt(x, y, dx, dy, col = K.white, w = 4) {
  return [0, 1, 2].map(i => `<path d="M${x + i * 12} ${y} q${dx} ${dy * 0.25} 0 ${dy * 0.5} t0 ${dy * 0.5}" fill="none" stroke="${col}" stroke-width="${w}" stroke-linecap="round" opacity="${0.9 - i * 0.2}"/>`).join('');
}

const comicPlace = (art, x, y, s) => `<g transform="translate(${x} ${y}) scale(${s})">${art}</g>`;
const comicLedge = (x, y, w = 64) => `<rect x="${x}" y="${y}" width="${w}" height="12" rx="4" fill="#d98a6a" ${S(3.5)}/><path d="M${x + 4} ${y + 3} H${x + w - 4}" stroke="#f3c9a4" stroke-width="3" stroke-linecap="round"/>`;
const comicGrill = (x, y) => `<path d="M${x + 4} ${y + 22} L${x - 2} ${y + 44} M${x + 38} ${y + 22} L${x + 44} ${y + 44}" stroke="${K.ink}" stroke-width="4" stroke-linecap="round"/>` +
  `<path d="M${x - 2} ${y + 6} H${x + 46} L${x + 40} ${y + 24} H${x + 4}Z" fill="${K.greyDark}" ${S(3.5)}/>` +
  `<path d="M${x + 6} ${y + 10} H${x + 40}" stroke="${K.red}" stroke-width="3" opacity=".8"/>`;

function comicPanelArt(i) {
  if (i === 0) {
    return `<rect width="360" height="300" fill="${K.sky}"/>` +
      `<g opacity=".95">${facadeArt()}</g>` +
      `<rect y="236" width="360" height="64" fill="#c9a07a" stroke="${K.ink}" stroke-width="4"/><path d="M0 262 H360" stroke="#b58a64" stroke-width="3" stroke-dasharray="14 10"/>` +
      `<rect x="232" y="0" width="128" height="26" fill="#d98a6a" stroke="${K.ink}" stroke-width="4"/><path d="M244 26 V44 M268 26 V44 M292 26 V44 M316 26 V44 M340 26 V44" stroke="${K.ink}" stroke-width="4"/><path d="M232 44 H360" stroke="${K.ink}" stroke-width="4"/>` +
      scentArt(276, 56, 8, 60, K.white, 5) + scentArt(262, 128, -8, 48, '#ffe9b0', 3.5) +
      fishArt(300, 12, 0.5, 8) +
      comicPlace(mareiArt('slouch'), 26, 62, 1.4);
  }
  if (i === 1) {
    return `<defs><radialGradient id="cmx"><stop offset="0" stop-color="#fff0c4"/><stop offset="1" stop-color="#f5b86b"/></radialGradient></defs>` +
      `<rect width="360" height="300" fill="url(#cmx)"/>` +
      `<g opacity=".5">${[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(k => `<path d="M180 150 L${180 + 240 * Math.cos(k * 0.5236)} ${150 + 240 * Math.sin(k * 0.5236)}" stroke="#fffaf0" stroke-width="14" stroke-linecap="round"/>`).join('')}</g>` +
      scentArt(296, 20, -14, 150, K.white, 6) + scentArt(310, 30, -10, 110, '#e8c27a', 4) +
      comicPlace(mareiHead('wide'), 62, 52, 2.2) +
      `<path d="M168 168 l-14 8 M156 188 l-16 2 M170 150 l-12 -8" stroke="${K.ink}" stroke-width="3.5" stroke-linecap="round"/>`;
  }
  return `<rect width="360" height="300" fill="#ffc9a8"/><circle cx="62" cy="44" r="26" fill="${K.gold}" opacity=".85"/>` +
    `<g transform="translate(0 104)" opacity=".95">${facadeArt()}</g>` +
    `<rect x="96" y="96" width="264" height="14" rx="3" fill="#f3c9a4" ${S(4)}/>` +
    scentArt(246, 40, 6, -36, K.white, 5) +
    comicGrill(236, 50) + fishArt(259, 60, 0.4, 0) +
    comicPlace(hanafyArt('idle'), 128, 12, 0.72) +
    comicLedge(176, 214, 70) + comicLedge(250, 164, 70) + comicLedge(150, 128, 56) + comicLedge(40, 262, 70) +
    `<path d="M92 252 Q112 210 178 206 M214 206 Q236 184 262 158 M262 158 Q226 140 206 124" fill="none" stroke="${K.red}" stroke-width="4" stroke-dasharray="3 9" stroke-linecap="round"/>` +
    comicPlace(mareiArt('up'), 24, 168, 0.8);
}

/** The standalone SVG document for panel i (used in the game and by the exporter). */
const comicPanelSvg = i => svgDoc(COMIC_VB, comicPanelArt(i), 'width="360" height="300"');
