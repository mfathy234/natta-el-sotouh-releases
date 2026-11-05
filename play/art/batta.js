/* Batta بطّة: the Delta mallard. Green head, white neck ring, wide orange bill, chestnut chest, webbed feet.
   Perk: spreads her wings and glides when she falls. */

const BATTA = { head: '#2f8f6a', chest: K.wood, belly: K.sandLight, bill: K.orange, foot: K.orange };

function battaHead(mode) {
  const h = BATTA.head, wide = mode === 'wide', smug = mode === 'smug';
  const eye = (cx, px) => pieEye(cx, 33, 7.6, 9, px, 1.5) + (wide ? '' : crewLid(cx, 33, 7.6, 9, h));
  const bill = wide
    ? `<path d="M38 50 Q60 40 82 50 Q88 62 60 64 Q32 62 38 50Z" fill="${BATTA.bill}" ${S(3.5)}/><path d="M42 56 Q60 66 78 56 Q60 60 42 56Z" fill="#7a1a1a"/>`
    : `<path d="M38 50 Q60 40 82 50 Q88 61 60 62 Q32 61 38 50Z" fill="${BATTA.bill}" ${S(3.5)}/><path d="${smug ? 'M44 56 Q56 61 64 57 Q72 56 78 52' : 'M44 56 Q60 60 76 56'}" fill="none" ${S(2.4)}/>`;
  return `<ellipse cx="60" cy="64" rx="19" ry="6" fill="${K.white}" ${S(3.5)}/>` +
    crewBlob([[60, 38, 25, 24]]) + `<ellipse cx="60" cy="38" rx="25" ry="24" fill="${h}"/>` +
    `<path d="M50 20 Q60 12 70 20" fill="none" stroke="${K.mint}" stroke-width="3.2" stroke-linecap="round" opacity=".8"/>` +
    `<path d="M58 14 Q56 2 68 4 Q62 8 64 14Z" fill="${h}" ${S(3)}/>` +
    eye(46, 1.5) + eye(74, -1.5) + bill +
    `<circle cx="52" cy="50" r="1.5" fill="${K.ink}"/><circle cx="68" cy="50" r="1.5" fill="${K.ink}"/>` +
    `<ellipse cx="35" cy="48" rx="5" ry="3.4" fill="${K.pink}" opacity=".6"/><ellipse cx="85" cy="48" rx="5" ry="3.4" fill="${K.pink}" opacity=".6"/>`;
}

const battaFoot = (x, y, f) => `<g transform="translate(${x} ${y}) scale(${f} 1)"><path d="M-12 3 Q-8 -6 0 -5 Q8 -6 12 3 Q6 6 0 4 Q-6 6 -12 3Z" fill="${BATTA.foot}" ${S(3)}/><path d="M-4 -4 V3 M4 -4 V3" stroke="${K.ink}" stroke-width="1.8" stroke-linecap="round"/></g>`;
const battaWings = pose => {
  if (pose !== 'up' && pose !== 'fall') return '';
  const k = pose === 'fall' ? 1.1 : 0.95, w = `<g transform="translate(-18 -2)">${featherWing(K.sandDark)}</g>`;
  const spread = inner => `<g transform="translate(60 80) scale(${k}) translate(-60 -80)">${inner}</g>`;
  return spread(w) + spread(mirror(60, w));
};
const battaBack = pose => (pose === 'slouch'
  ? `<path d="M72 106 Q94 108 98 92 Q88 96 82 94Z" fill="${K.woodDark}" ${S(3)}/>`
  : battaWings(pose) + `<path d="M74 98 Q94 98 96 82 Q86 88 78 86Z" fill="${K.woodDark}" ${S(3)}/>`);
const battaBelly = () => `<ellipse cx="60" cy="92" rx="11" ry="12" fill="${BATTA.belly}" stroke="${K.ink}" stroke-width="2.4"/><path d="M52 90 Q60 96 68 90 M54 98 Q60 102 66 98" fill="none" stroke="${K.sandDark}" stroke-width="2" stroke-linecap="round"/>`;
const battaGlass = () => `<path d="M86 112 H106 L103 130 H89Z" fill="${K.tea}" ${S(2.8)}/><path d="M92 104 Q90 98 94 94 M99 104 Q97 98 101 94" fill="none" stroke="${K.white}" stroke-width="3" stroke-linecap="round" opacity=".85"/>`;

const BATTA_BODY = { fur: BATTA.chest, body: BATTA.chest, foot: battaFoot, head: battaHead, back: battaBack, belly: battaBelly, prop: battaGlass };
const battaArt = pose => (pose === 'slouch' ? crewSlouch(BATTA_BODY) : crewStand(pose, BATTA_BODY));
