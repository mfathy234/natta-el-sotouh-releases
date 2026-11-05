/* Hadeel هديل: a cooing homing pigeon. Soft dove-grey, a shimmering teal neck, orange eye rings with lashes,
   a tiny crest. The friendly cousin of the grumpy pigeons. Perk: pigeons never dive at her. */

const HADEEL = { fur: '#d3dce6', wing: '#aab8c9', neck: K.teal, beak: K.gold, foot: K.pink };

function hadeelHead(mode) {
  const f = HADEEL.fur, wide = mode === 'wide', smug = mode === 'smug';
  const eye = (cx, px, s) => `<ellipse cx="${cx}" cy="38" rx="10" ry="11" fill="none" stroke="${K.orange}" stroke-width="3"/>` + pieEye(cx, 38, 7.6, 9, px, 2) + (wide ? '' : crewLid(cx, 38, 7.6, 9, f)) +
    `<path d="M${cx + s * 8} 31 L${cx + s * 13} 26 M${cx + s * 10} 35 L${cx + s * 16} 33" stroke="${K.ink}" stroke-width="2.4" stroke-linecap="round"/>`;
  const beak = `<path d="M52 50 Q60 46 68 50 L63 63 Q60 66 57 63Z" fill="${HADEEL.beak}" ${S(3)}/><ellipse cx="60" cy="49" rx="4.2" ry="3" fill="${K.white}" ${S(1.8)}/>` +
    (wide ? `<ellipse cx="60" cy="68" rx="3.4" ry="4" fill="#7a1a1a" ${S(2)}/>` : smug ? `<path d="M52 66 Q58 70 62 67 Q66 66 70 62" fill="none" ${S(2.2)}/>` : '');
  return `<path d="M54 16 Q50 2 60 6 Q58 10 62 14 Q64 4 72 8 Q68 12 68 18Z" fill="${f}" ${S(3)}/>` +
    `<ellipse cx="60" cy="66" rx="17" ry="9" fill="${HADEEL.neck}" ${S(3.5)}/><path d="M48 66 Q60 72 72 66" fill="none" stroke="${K.plum}" stroke-width="3.5" stroke-linecap="round" opacity=".7"/>` +
    crewBlob([[60, 40, 25, 23]]) + `<ellipse cx="60" cy="40" rx="25" ry="23" fill="${f}"/>` +
    `<path d="M46 22 Q60 14 74 22" fill="none" stroke="${K.white}" stroke-width="3.2" stroke-linecap="round" opacity=".8"/>` +
    eye(46, 1.5, -1) + eye(74, -1.5, 1) + beak +
    `<ellipse cx="34" cy="52" rx="5" ry="3.4" fill="${K.pink}" opacity=".7"/><ellipse cx="86" cy="52" rx="5" ry="3.4" fill="${K.pink}" opacity=".7"/>`;
}

const hadeelFoot = (x, y, f) => `<g transform="translate(${x} ${y}) scale(${f} 1)"><path d="M-9 3 Q-6 -5 0 -4 Q6 -5 9 3 Q4 5 0 3 Q-4 5 -9 3Z" fill="${HADEEL.foot}" ${S(3)}/></g>`;
const hadeelWings = pose => {
  if (pose === 'slouch') return '';
  if (pose === 'up' || pose === 'fall') {
    const w = `<path d="M62 84 Q30 76 18 46 Q30 52 36 50 Q28 40 30 28 Q44 40 50 54 Q50 42 56 36 Q62 54 64 70Z" fill="${HADEEL.wing}" ${S(3.5)}/><path d="M26 40 L34 52 M36 36 L44 52" stroke="${K.white}" stroke-width="2.2" stroke-linecap="round" opacity=".8"/>`;
    return w + mirror(60, w);
  }
  const fold = `<path d="M44 78 Q36 96 46 108 Q54 100 54 84Z" fill="${HADEEL.wing}" ${S(3)}/>`;
  return fold + mirror(60, fold);
};
const hadeelBack = pose => hadeelWings(pose) + (pose === 'slouch'
  ? `<path d="M70 108 Q90 114 100 106 L96 98 Q86 104 74 100Z" fill="${HADEEL.wing}" ${S(3)}/>`
  : `<path d="M54 104 L44 122 L60 114 L76 122 L66 104Z" fill="${HADEEL.wing}" ${S(3)}/>`);
const hadeelBelly = () => `<ellipse cx="60" cy="90" rx="11" ry="12" fill="${K.white}" stroke="${K.ink}" stroke-width="2.4"/><path d="M54 84 Q60 90 66 84" fill="none" stroke="${HADEEL.wing}" stroke-width="2.2" stroke-linecap="round"/>`;
const hadeelBread = () => `<ellipse cx="108" cy="108" rx="14" ry="9" fill="${K.sandLight}" ${S(3)}/><path d="M100 104 L104 112 M108 102 L112 112 M116 104 L118 111" stroke="${K.sandDark}" stroke-width="2.4" stroke-linecap="round"/>`;

const HADEEL_BODY = { fur: HADEEL.fur, arm: HADEEL.wing, foot: hadeelFoot, head: hadeelHead, back: hadeelBack, belly: hadeelBelly, prop: hadeelBread };
const hadeelArt = pose => (pose === 'slouch' ? crewSlouch(HADEEL_BODY) : crewStand(pose, HADEEL_BODY));
