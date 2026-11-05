/* Shop rules, pure and immutable: looks (cosmetics), permanent upgrades, the one-run boost, and what a run starts with.
   Prices and levels are in data.js (LOOKS, UPGRADES). Every function returns a new save; refused purchases return the save unchanged. */

const shopLook = id => LOOKS.find(l => l.id === id) || null;
const heldLook = (save, id) => save.looks.includes(id);
const ownsLook = (save, id) => heldLook(save, id) || passActive(save);
/** What a hero wears right now: worn looks that are owned for good or free with the pass. */
const wornOf = (save, heroId) => {
  const row = {};
  Object.entries(save.worn[heroId] || {}).forEach(([slot, id]) => { if (ownsLook(save, id)) row[slot] = id; });
  return row;
};

const canBuyLook = (save, id) => {
  const l = shopLook(id);
  return Boolean(l && !heldLook(save, id) && save.coins >= l.price);
};

function buyLook(save, id, now = 0) {
  if (!canBuyLook(save, id)) return { ok: false, save };
  return { ok: true, save: { ...save, coins: save.coins - shopLook(id).price, looks: [...save.looks, id], updatedAt: now } };
}

/** Wear an owned look on a hero. It replaces whatever that hero wears in the same slot. */
function wearLook(save, heroId, id) {
  const l = shopLook(id);
  if (!l || !ownsLook(save, id) || !heroFlies(save, heroId)) return save;
  return { ...save, worn: { ...save.worn, [heroId]: { ...wornOf(save, heroId), [l.slot]: id } } };
}

function takeOffLook(save, heroId, slot) {
  const row = { ...wornOf(save, heroId) };
  delete row[slot];
  return { ...save, worn: { ...save.worn, [heroId]: row } };
}

const heldUpgradeLevel = (save, key) => (key === 'double' ? (save.boost.double ? 1 : 0) : save.ups[key] || 0);
/** The level in force: the pass lifts every permanent upgrade to its maximum (the one-run boost is not part of it). */
const upgradeLevel = (save, key) => (passActive(save) && !UPGRADES[key].boost ? UPGRADES[key].levels.length : heldUpgradeLevel(save, key));

/** The next level to buy: { level, price, value }, or null when maxed (or, for the one-run boost, already armed). */
function nextUpgrade(save, key) {
  const u = UPGRADES[key];
  if (!u) return null;
  const lvl = heldUpgradeLevel(save, key), row = u.levels[lvl];
  return row ? { level: lvl + 1, price: row.price, value: row.value } : null;
}

const canBuyUpgrade = (save, key) => {
  const n = nextUpgrade(save, key);
  return Boolean(n && save.coins >= n.price);
};

function buyUpgrade(save, key, now = 0) {
  if (!canBuyUpgrade(save, key)) return { ok: false, save };
  const n = nextUpgrade(save, key);
  const next = UPGRADES[key].boost ? { ...save, boost: { ...save.boost, [key]: true } } : { ...save, ups: { ...save.ups, [key]: n.level } };
  return { ok: true, save: { ...next, coins: save.coins - n.price, updatedAt: now } };
}

/** What the upgrades give a run: { shield, kiteBonus (s), magnet (px), coinMult }. */
function runLoadout(save) {
  const val = (key, lvl) => (lvl > 0 ? UPGRADES[key].levels[lvl - 1].value : 0);
  return {
    shield: upgradeLevel(save, 'shield') > 0,
    kiteBonus: val('kite', upgradeLevel(save, 'kite')),
    magnet: val('magnet', upgradeLevel(save, 'magnet')),
    coinMult: save.boost.double ? UPGRADES.double.levels[0].value : 1
  };
}

/** The one-run boost is used up when a run starts. */
const consumeBoost = save => (save.boost.double ? { ...save, boost: { ...save.boost, double: false } } : save);

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { heldLook, ownsLook, heldUpgradeLevel, canBuyLook, buyLook, wearLook, takeOffLook, wornOf, upgradeLevel, nextUpgrade, canBuyUpgrade, buyUpgrade, runLoadout, consumeBoost };
}
