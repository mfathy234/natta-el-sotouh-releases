/* Shop rules, pure and immutable: looks (cosmetics), permanent upgrades, the one-run boost, and what a run starts with.
   Prices and levels are in data.js (LOOKS, UPGRADES). Every function returns a new save; refused purchases return the save unchanged. */

const shopLook = id => LOOKS.find(l => l.id === id) || null;
const ownsLook = (save, id) => save.looks.includes(id);
const wornOf = (save, heroId) => save.worn[heroId] || {};

const canBuyLook = (save, id) => {
  const l = shopLook(id);
  return Boolean(l && !ownsLook(save, id) && save.coins >= l.price);
};

function buyLook(save, id, now = 0) {
  if (!canBuyLook(save, id)) return { ok: false, save };
  return { ok: true, save: { ...save, coins: save.coins - shopLook(id).price, looks: [...save.looks, id], updatedAt: now } };
}

/** Wear an owned look on a hero. It replaces whatever that hero wears in the same slot. */
function wearLook(save, heroId, id) {
  const l = shopLook(id);
  if (!l || !ownsLook(save, id) || !save.owned.includes(heroId)) return save;
  return { ...save, worn: { ...save.worn, [heroId]: { ...wornOf(save, heroId), [l.slot]: id } } };
}

function takeOffLook(save, heroId, slot) {
  const row = { ...wornOf(save, heroId) };
  delete row[slot];
  return { ...save, worn: { ...save.worn, [heroId]: row } };
}

const upgradeLevel = (save, key) => (key === 'double' ? (save.boost.double ? 1 : 0) : save.ups[key] || 0);

/** The next level to buy: { level, price, value }, or null when maxed (or, for the one-run boost, already armed). */
function nextUpgrade(save, key) {
  const u = UPGRADES[key];
  if (!u) return null;
  const lvl = upgradeLevel(save, key), row = u.levels[lvl];
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
    shield: save.ups.shield > 0,
    kiteBonus: val('kite', save.ups.kite),
    magnet: val('magnet', save.ups.magnet),
    coinMult: save.boost.double ? UPGRADES.double.levels[0].value : 1
  };
}

/** The one-run boost is used up when a run starts. */
const consumeBoost = save => (save.boost.double ? { ...save, boost: { ...save.boost, double: false } } : save);

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { canBuyLook, buyLook, wearLook, takeOffLook, wornOf, upgradeLevel, nextUpgrade, canBuyUpgrade, buyUpgrade, runLoadout, consumeBoost };
}
