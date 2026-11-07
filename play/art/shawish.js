/* Shawish شاويش: the neighbourhood baladi dog. Sandy coat, dark patch round one eye, one floppy and one
   cocked ear, pink tongue, a brass whistle on a cord. Perk: a nose for coins (wide coin pull). */

const SHAWISH = { fur: K.sand, patch: K.woodDark, ear: K.wood, muzzle: K.sandLight, foot: K.woodDark };

function shawishHead(mode) {
  const f = SHAWISH.fur, wide = mode === 'wide', smug = mode === 'smug';
  const eye = (cx, px) => pieEye(cx, 36, 7.8, 9, px, 2) + (wide ? '' : crewLid(cx, 36, 7.8, 9, f));
  const tongue = wide ? `<path d="M52 66 Q60 70 68 66 Q68 82 60 82 Q52 82 52 66Z" fill="#7a1a1a" ${S(2.5)}/><path d="M56 72 Q60 80 64 72Z" fill="${K.pink}"/>`
    : `<path d="${smug ? 'M51 66 Q58 72 62 68 Q66 67 69 63' : 'M52 66 Q60 71 68 66'}" fill="none" ${S(2.6)}/>` + `<path d="M58 69 Q60 79 64 69Z" fill="${K.pink}" ${S(2.2)}/>`;
  return `<path d="M36 28 Q16 34 22 62 Q36 60 41 44Z" fill="${SHAWISH.ear}" ${S(4)}/>` +
    `<path d="M80 22 L92 2 Q96 20 98 32 Q88 34 84 30Z" fill="${SHAWISH.ear}" ${S(4)}/>` +
    crewBlob([[60, 40, 27, 24], [60, 61, 17, 13]]) +
    `<ellipse cx="60" cy="40" rx="27" ry="24" fill="${f}"/><ellipse cx="60" cy="61" rx="17" ry="13" fill="${SHAWISH.muzzle}"/>` +
    `<ellipse cx="45" cy="37" rx="12.5" ry="13" fill="${SHAWISH.patch}" opacity=".85"/>` +
    `<circle cx="73" cy="24" r="2.3" fill="${K.sandDark}"/><circle cx="47" cy="22" r="2.3" fill="${K.sandDark}"/>` +
    eye(45, 1.5) + eye(75, -1.5) +
    `<ellipse cx="60" cy="54" rx="7" ry="5" fill="${K.ink}"/><ellipse cx="57.5" cy="52.5" rx="2" ry="1.2" fill="${K.white}" opacity=".7"/>` + tongue +
    `<ellipse cx="33" cy="52" rx="5" ry="3.4" fill="${K.pink}" opacity=".55"/><ellipse cx="87" cy="52" rx="5" ry="3.4" fill="${K.pink}" opacity=".55"/>`;
}

const shawishFoot = (x, y, f) => shoe(x, y, SHAWISH.foot, f);
const shawishBack = pose => (pose === 'slouch'
  ? hose('M72 106 Q94 110 100 94 Q102 86 94 86', SHAWISH.fur, 6)
  : hose('M76 98 Q100 98 98 80 Q96 70 106 70', SHAWISH.fur, 6));
const shawishBelly = () => `<ellipse cx="60" cy="92" rx="11" ry="12" fill="${SHAWISH.muzzle}" stroke="${K.ink}" stroke-width="2.4"/><ellipse cx="50" cy="80" rx="5" ry="4" fill="${SHAWISH.patch}" opacity=".8"/>`;
const shawishNeck = () => `<path d="M46 74 Q60 88 74 74" fill="none" stroke="${K.ink}" stroke-width="2.4"/><path d="M60 82 L60 90" stroke="${K.ink}" stroke-width="2.2"/>` +
  `<rect x="55" y="89" width="10" height="7" rx="3.2" fill="${K.gold}" ${S(2.4)}/><circle cx="57.5" cy="92.5" r="1.6" fill="${K.ink}"/>`;
const shawishBone = () => `<path d="M-14 -2 H14" ${S(7.5)} fill="none"/><path d="M-14 -2 H14" stroke="${K.white}" stroke-width="3.8" stroke-linecap="round"/>` +
  [[-16, -6], [-16, 2], [16, -6], [16, 2]].map(([a, b]) => `<circle cx="${a}" cy="${b}" r="4" fill="${K.white}" ${S(2.4)}/>`).join('');

const SHAWISH_BODY = { fur: SHAWISH.fur, foot: shawishFoot, head: shawishHead, back: shawishBack, belly: shawishBelly, neck: shawishNeck, prop: shawishBone, propRot: -28, sole: (x, y, r) => crewPaw(x, y, r, SHAWISH.fur, SHAWISH.patch, 1.15) };
const shawishArt = pose => (pose === 'slouch' ? crewSlouch(SHAWISH_BODY) : crewStand(pose, SHAWISH_BODY));
