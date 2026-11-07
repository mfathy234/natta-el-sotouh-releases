/* Shams شمس: the rooftop goat. Narrow long muzzle, chin beard, horns swept back, floppy ears,
   horizontal goat pupils (with the pie-cut glint), a striped red scarf. Needs heroes.js helpers (hose, shoe, tuft). */

const SHAMS = { fur: K.sandLight, horn: K.sandDark, hoof: K.woodDark };

const SHAMS_LIMBS = {
  idle: { armL: 'M44 80 Q30 84 24 96', armR: 'M76 80 Q90 84 96 96', gL: [24, 98], gR: [96, 98], legL: 'M52 98 Q50 108 48 112', legR: 'M68 98 Q70 108 72 112', fL: [47, 113], fR: [73, 113] },
  land: { armL: 'M44 80 Q28 80 30 94', armR: 'M76 80 Q92 80 90 94', gL: [30, 96], gR: [90, 96], legL: 'M52 98 Q46 108 44 114', legR: 'M68 98 Q74 108 76 114', fL: [43, 115], fR: [77, 115] },
  up: { armL: 'M44 78 Q26 72 20 54', armR: 'M76 78 Q94 72 100 54', gL: [20, 50], gR: [100, 50], legL: 'M52 98 Q38 104 38 114', legR: 'M68 98 Q82 104 82 114', fL: [38, 115], fR: [82, 115] },
  fall: { armL: 'M44 76 Q20 66 14 40', armR: 'M76 76 Q100 66 106 40', gL: [14, 35], gR: [106, 35], legL: 'M52 98 Q44 108 50 116', legR: 'M68 98 Q76 108 70 116', fL: [50, 117], fR: [70, 117] }
};

function goatEye(cx, cy, px = 0) {
  return `<ellipse cx="${cx}" cy="${cy}" rx="9.5" ry="8" fill="${K.white}" ${S(3)}/>` +
    `<ellipse cx="${cx + px}" cy="${cy}" rx="6.8" ry="6" fill="${K.gold}" stroke="${K.ink}" stroke-width="1.4"/>` +
    `<rect x="${cx + px - 6}" y="${cy - 2.4}" width="12" height="4.8" rx="2.4" fill="${K.ink}"/>` +
    `<path d="M${cx + px - 3} ${cy - 5.2} L${cx + px} ${cy - 1} L${cx + px + 5} ${cy - 3.5} Z" fill="${K.white}"/>`;
}

function shamsHead(mode) {
  const f = SHAMS.fur, wide = mode === 'wide', smug = mode === 'smug';
  const lid = cx => `<path d="M${cx - 11} ${40} A11 10 0 0 1 ${cx + 11} 40 Z" fill="${f}" stroke="${K.ink}" stroke-width="3" stroke-linejoin="round"/>`;
  const earA = wide ? 70 : 52;
  const ear = s => `<g transform="translate(${60 + s * 31} 38) rotate(${s * earA})"><ellipse cx="${s * 12}" cy="0" rx="17" ry="7.5" fill="${f}" ${S(4)}/><ellipse cx="${s * 12}" cy="0" rx="10" ry="3.5" fill="${K.pink}"/></g>`;
  const horn = s => `<path d="M${60 + s * 14} 22 Q${60 + s * 22} -4 ${60 + s * 44} 0 Q${60 + s * 28} 4 ${60 + s * 22} 28Z" fill="${SHAMS.horn}" ${S(4)}/><path d="M${60 + s * 19} 14 L${60 + s * 25} 14 M${60 + s * 22} 8 L${60 + s * 29} 7" stroke="${K.ink}" stroke-width="2" stroke-linecap="round"/>`;
  const mouthD = wide ? `<ellipse cx="60" cy="74" rx="4.5" ry="5" fill="#7a1a1a" ${S(2.5)}/>`
    : smug ? `<path d="M52 72 Q58 77 62 73 Q66 72 70 68" fill="none" ${S(2.8)}/>`
    : `<path d="M53 72 Q60 77 67 72" fill="none" ${S(2.8)}/>`;
  const head = `<ellipse cx="60" cy="40" rx="27" ry="24" fill="${K.ink}" stroke="${K.ink}" stroke-width="8"/><ellipse cx="60" cy="64" rx="14.5" ry="17" fill="${K.ink}" stroke="${K.ink}" stroke-width="8"/>` +
    `<ellipse cx="60" cy="40" rx="27" ry="24" fill="${f}"/><ellipse cx="60" cy="64" rx="14.5" ry="17" fill="${K.muzzle}"/>` +
    `<path d="M48 22 Q60 14 72 22 Q60 30 48 22Z" fill="${SHAMS.horn}" opacity=".45"/>`;
  return horn(-1) + horn(1) + ear(-1) + ear(1) + head +
    goatEye(44, 38, 1.5) + goatEye(76, 38, -1.5) + (wide ? '' : lid(44) + lid(76)) +
    `<ellipse cx="60" cy="78" rx="8.5" ry="5" fill="${K.plum}" ${S(2.5)}/><ellipse cx="56.5" cy="77" rx="1.8" ry="1.4" fill="${K.ink}"/><ellipse cx="63.5" cy="77" rx="1.8" ry="1.4" fill="${K.ink}"/>` +
    mouthD +
    `<ellipse cx="34" cy="52" rx="6" ry="4" fill="${K.pink}" opacity=".6"/><ellipse cx="86" cy="52" rx="6" ry="4" fill="${K.pink}" opacity=".6"/>` +
    `<path d="M55 82 Q60 104 65 82Z" fill="${f}" ${S(3)}/><path d="M60 86 V96" stroke="${K.ink}" stroke-width="1.6" stroke-linecap="round"/>`;
}

function shamsScarf(fly) {
  const tail = `M76 80 Q96 ${84 + fly} 100 ${98 + fly * 1.5}`;
  return `<path d="${tail}" fill="none" stroke="${K.ink}" stroke-width="14" stroke-linecap="round"/><path d="${tail}" fill="none" stroke="${K.red}" stroke-width="9.5" stroke-linecap="round"/>` +
    `<path d="M88 ${84 + fly * 0.4} L90 ${92 + fly * 0.5} M95 ${89 + fly} L98 ${97 + fly}" stroke="${K.gold}" stroke-width="3" stroke-linecap="round"/>` +
    `<path d="M40 80 Q60 94 80 80 L78 70 Q60 82 42 70Z" fill="${K.red}" ${S(4)}/><path d="M48 80 L47 72 M57 84 L56 75 M66 84 L66 75 M74 80 L74 72" stroke="${K.gold}" stroke-width="3" stroke-linecap="round"/>`;
}

/* Sitting, chewing a straw, legs stretched out and crossed, one hoof-glove on her knee. */
function shamsSlouch() {
  return `<path d="M70 108 Q92 112 98 100" fill="none" stroke="${K.ink}" stroke-width="6" stroke-linecap="round"/>` +
    hose('M54 100 Q36 108 14 112', SHAMS.fur) + shoe(12, 113, SHAMS.hoof) +
    hose('M64 104 Q42 114 16 106', SHAMS.fur) + shoe(14, 106, SHAMS.hoof) +
    `<g transform="rotate(-10 60 90)">${tuft(60, 88, 20, 19, 12, 3, SHAMS.fur, 4)}</g>` +
    `<g transform="translate(0 8) rotate(-6 60 60)">${shamsHead('calm')}</g>` +
    `<path d="M62 83 L80 74" stroke="${K.ink}" stroke-width="5.5" stroke-linecap="round"/><path d="M62 83 L80 74" stroke="${K.green}" stroke-width="2.6" stroke-linecap="round"/>` +
    shamsScarf(0) +
    hose('M42 84 Q36 98 50 100', SHAMS.fur, 6) + glove(52, 100, 7) +
    hose('M80 84 Q94 92 90 106', SHAMS.fur, 6) + glove(90, 108, 7);
}

function shamsArt(pose = 'idle') {
  if (pose === 'slouch') return shamsSlouch();
  const L = SHAMS_LIMBS[pose] || SHAMS_LIMBS.idle, fly = pose === 'fall' ? -12 : pose === 'up' ? 8 : 0;
  const mode = pose === 'up' || pose === 'fall' ? 'wide' : pose === 'land' ? 'smug' : 'calm';
  return hose(L.legL, SHAMS.fur) + hose(L.legR, SHAMS.fur) + shoe(L.fL[0], L.fL[1], SHAMS.hoof) + shoe(L.fR[0], L.fR[1], SHAMS.hoof, -1) +
    `<path d="M76 100 Q88 98 86 108" fill="none" stroke="${K.ink}" stroke-width="5" stroke-linecap="round"/>` +
    tuft(60, 88, 20, 19, 12, 3, SHAMS.fur, 4) +
    `<g transform="translate(0 ${pose === 'fall' ? 2 : 0})">${shamsHead(mode)}</g>` + shamsScarf(fly) +
    hose(L.armL, SHAMS.fur, 6) + hose(L.armR, SHAMS.fur, 6) + glove(L.gL[0], L.gL[1], 7) + glove(L.gR[0], L.gR[1], 7);
}
