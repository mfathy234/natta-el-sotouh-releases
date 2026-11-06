/* Difficulty tiers (pure): which TIERS row a height uses, and the banner text when a new one starts. Numbers are in data.js. */

const tierIndex = m => Math.min(TIERS.length - 1, Math.floor(Math.max(0, m) / TIER_STEP));
const tierAt = m => TIERS[tierIndex(m)];

/** Arabic ordinal for tier i (0 = الأول); falls back to digits past the list. */
const tierOrdinal = i => ORDINALS.ar[i] || nf(i + 1);

/** { ar, en } banner text for tier i: "الدور الخامس: الحمام وصل!". */
const tierBanner = i => {
  const row = TIERS[Math.min(i, TIERS.length - 1)];
  return { ar: 'الدور ' + tierOrdinal(i) + ': ' + row.ar, en: 'Floor ' + (i + 1) + ': ' + row.en };
};

/** Tower tier of floor n (every checkEvery floors), pushed up by `shift` tiers (the weekly tower starts harder). */
const towerTierIndex = (n, shift = 0) => Math.min(TOWER_TIERS.length - 1, Math.floor((Math.max(0, n) + shift * TOWER.checkEvery) / TOWER.checkEvery));
const towerTierAt = (n, shift = 0) => TOWER_TIERS[towerTierIndex(n, shift)];
const towerTierBanner = (n, shift = 0) => {
  const i = towerTierIndex(n, shift), row = TOWER_TIERS[i];
  return { ar: 'الدور ' + tierOrdinal(i) + ': ' + row.ar, en: 'Floor ' + (i + 1) + ': ' + row.en };
};

/** Free run: push a banner when the height enters a new tier. */
function updateTier(s) {
  const i = tierIndex(s.meters);
  if (i > s.tierIdx) {
    s.tierIdx = i;
    bannerPush(s, tierBanner(i), 'tier');
    Sound.play('mile');
  }
}

if (typeof module !== 'undefined' && module.exports) module.exports = { tierIndex, tierAt, tierBanner, towerTierIndex, towerTierAt, towerTierBanner };
