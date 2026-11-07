/* Hanafy حنفي: the Imbaba baladi donkey. Tall ears, shaggy mane tuft, big pale muzzle with a buck tooth,
   a red striped saddle blanket with gold tassels. Perk: a kick-start first bounce. */

const HANAFY = { fur: '#a89a8c', mane: K.greyDark, muzzle: '#eadfc9', hoof: K.woodDark };

function hanafyHead(mode) {
  const f = HANAFY.fur, wide = mode === 'wide', smug = mode === 'smug', earA = wide ? 42 : 13;
  const ear = s => `<g transform="translate(${60 + s * 18} 27) rotate(${s * earA})"><ellipse cx="0" cy="-12" rx="8.5" ry="16" fill="${f}" ${S(4)}/><ellipse cx="0" cy="-11" rx="4" ry="10.5" fill="${K.pink}"/></g>`;
  const eye = (cx, px) => pieEye(cx, 37, 8.2, 9.2, px, 2) + (wide ? '' : crewLid(cx, 37, 8.2, 9.2, f));
  const tooth = y => `<rect x="${y[0]}" y="${y[1]}" width="7" height="5.5" rx="1.5" fill="${K.white}" stroke="${K.ink}" stroke-width="1.6"/>`;
  const mouth = wide ? `<ellipse cx="60" cy="74" rx="6.5" ry="6" fill="#7a1a1a" ${S(2.5)}/>` + tooth([56.5, 68.5])
    : smug ? `<path d="M50 73 Q58 79 64 75 Q68 74 72 70" fill="none" ${S(2.8)}/>` + tooth([58, 75])
    : `<path d="M50 74 Q60 78 70 74" fill="none" ${S(2.8)}/>` + tooth([56.5, 75]);
  return ear(-1) + ear(1) +
    crewBlob([[60, 40, 27, 24], [60, 64, 18, 15]]) +
    `<ellipse cx="60" cy="40" rx="27" ry="24" fill="${f}"/><ellipse cx="60" cy="64" rx="18" ry="15" fill="${HANAFY.muzzle}"/>` +
    `<path d="M47 20 Q50 6 58 14 Q60 4 66 14 Q74 8 73 21 Q60 14 47 20Z" fill="${HANAFY.mane}" ${S(3)}/>` +
    eye(45, 1.5) + eye(75, -1.5) +
    `<ellipse cx="52.5" cy="63" rx="2.4" ry="3.2" fill="${K.ink}"/><ellipse cx="67.5" cy="63" rx="2.4" ry="3.2" fill="${K.ink}"/>` + mouth +
    `<ellipse cx="33" cy="52" rx="5.5" ry="3.6" fill="${K.pink}" opacity=".6"/><ellipse cx="87" cy="52" rx="5.5" ry="3.6" fill="${K.pink}" opacity=".6"/>`;
}

const hanafyBlanket = () => `<path d="M41 82 Q60 93 79 82 L80 97 Q60 108 40 97Z" fill="${K.red}" ${S(3.5)}/><path d="M40.5 89.5 Q60 100 79.5 89.5" fill="none" stroke="${K.gold}" stroke-width="3.2"/>` +
  `<path d="M44 99 L43 106 M50 102 L49 109 M70 102 L71 109 M76 99 L77 106" stroke="${K.gold}" stroke-width="3" stroke-linecap="round"/>`;
const hanafyTail = pose => (pose === 'slouch'
  ? hose('M70 108 Q92 112 98 100', HANAFY.fur, 5) + `<ellipse cx="99" cy="97" rx="5" ry="6" fill="${HANAFY.mane}" ${S(2.5)}/>`
  : hose('M76 100 Q94 104 92 116', HANAFY.fur, 5) + `<ellipse cx="92" cy="118" rx="5" ry="6.5" fill="${HANAFY.mane}" ${S(2.5)}/>`);
const hanafyCarrot = () => `<path d="M-3 12 L-9 24 M0 12 L0 26 M3 12 L9 24" stroke="${K.green}" stroke-width="4" stroke-linecap="round"/>` +
  `<path d="M-6 -14 Q0 -19 6 -14 L3 11 Q0 13 -3 11Z" fill="${K.orange}" ${S(3)}/><path d="M-3 -6 L1 -4 M0 2 L3.5 4" stroke="${K.copper}" stroke-width="2" stroke-linecap="round"/>`;

const HANAFY_BODY = { fur: HANAFY.fur, foot: (x, y, f) => shoe(x, y, HANAFY.hoof, f), head: hanafyHead, back: hanafyTail, belly: hanafyBlanket, prop: hanafyCarrot, propRot: 14, sole: (x, y, r) => crewHoof(x, y, r, HANAFY.hoof, HANAFY.muzzle) };
const hanafyArt = pose => (pose === 'slouch' ? crewSlouch(HANAFY_BODY) : crewStand(pose, HANAFY_BODY));
