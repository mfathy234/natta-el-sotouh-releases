/* Save model: pure and immutable. Every function returns a new save; storage adapters are at the bottom. */

const SAVE_VERSION = 1;
const FREE_HEROES = ['marei'];

const toInt = (v, min, max) => (Number.isFinite(Number(v)) ? Math.max(min, Math.min(max, Math.floor(Number(v)))) : min);
const heroIds = () => HEROES.map(h => h.id);
const heroById = id => HEROES.find(h => h.id === id) || null;

function newSave(now = 0) {
  return { v: SAVE_VERSION, createdAt: now, updatedAt: now, hero: DEFAULT_HERO, owned: [...FREE_HEROES], best: 0, coins: 0, runs: 0, lang: 'ar', muted: false, controls: DEFAULT_CONTROLS, hintSeen: false };
}

/** Validate anything read from storage. Returns a clean save, or null when it is not a save. */
function sanitizeSave(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  if (!('best' in raw) && !('coins' in raw) && !('owned' in raw) && !('hero' in raw)) return null;
  const known = heroIds();
  const owned = [...new Set([...FREE_HEROES, ...(Array.isArray(raw.owned) ? raw.owned : [])])].filter(id => known.includes(id));
  const controls = CONTROL_MODES.includes(raw.controls) ? raw.controls : raw.tilt === true ? 'tilt' : DEFAULT_CONTROLS;
  return {
    v: SAVE_VERSION,
    createdAt: toInt(raw.createdAt, 0, 9e15),
    updatedAt: toInt(raw.updatedAt, 0, 9e15),
    hero: owned.includes(raw.hero) ? raw.hero : DEFAULT_HERO,
    owned,
    best: toInt(raw.best, 0, 1e7),
    coins: toInt(raw.coins, 0, 1e9),
    runs: toInt(raw.runs, 0, 1e9),
    lang: raw.lang === 'en' ? 'en' : 'ar',
    muted: raw.muted === true,
    controls,
    hintSeen: raw.hintSeen === true
  };
}

/** Heroes whose score target is met by `best` and that are not yet owned. */
const earnedHeroes = (owned, best) => HEROES.filter(h => h.unlockScore > 0 && best >= h.unlockScore && !owned.includes(h.id)).map(h => h.id);

/** Apply the result of one run: best never drops, coins are added, score-unlocked heroes are granted. */
function recordRun(save, result, now = 0) {
  const best = Math.max(save.best, toInt(result.meters, 0, 1e7));
  const earned = earnedHeroes(save.owned, best);
  return { ...save, best, coins: save.coins + toInt(result.coins, 0, 1e6), runs: save.runs + 1, owned: [...save.owned, ...earned], updatedAt: now };
}

const canBuyHero = (save, id) => {
  const h = heroById(id);
  return Boolean(h && h.price > 0 && !save.owned.includes(id) && save.coins >= h.price);
};

/** Buy a hero with coins. Returns { ok, save }; the save is unchanged when the purchase is refused. */
function buyHero(save, id, now = 0) {
  if (!canBuyHero(save, id)) return { ok: false, save };
  const h = heroById(id);
  return { ok: true, save: { ...save, coins: save.coins - h.price, owned: [...save.owned, id], updatedAt: now } };
}

const selectHero = (save, id) => (save.owned.includes(id) ? { ...save, hero: id } : save);
const setSetting = (save, key, value) => sanitizeSave({ ...save, [key]: value }) || save;

function loadSave(storage) {
  try {
    const raw = storage && storage.getItem(SAVE_KEY);
    return (raw && sanitizeSave(JSON.parse(raw))) || newSave(Date.now());
  } catch (e) { return newSave(Date.now()); }
}
function persistSave(storage, save) {
  try { storage.setItem(SAVE_KEY, JSON.stringify(save)); return true; } catch (e) { return false; }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { newSave, sanitizeSave, recordRun, canBuyHero, buyHero, selectHero, setSetting, loadSave, persistSave, earnedHeroes };
}
