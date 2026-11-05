/* Save model: pure and immutable. Every function returns a new save; storage adapters are at the bottom.
   Shop (looks, upgrades) rules are in shop.js; the daily challenge and missions are in daily.js. */

const SAVE_VERSION = 2;
const FREE_HEROES = ['marei'];
const DATE_KEY = /^\d{4}-\d{2}-\d{2}$/;

const toInt = (v, min, max) => (Number.isFinite(Number(v)) ? Math.max(min, Math.min(max, Math.floor(Number(v)))) : min);
const heroIds = () => HEROES.map(h => h.id);
const heroById = id => HEROES.find(h => h.id === id) || null;
const asObject = v => (v && typeof v === 'object' && !Array.isArray(v) ? v : {});
const dateKeyOr = v => (typeof v === 'string' && DATE_KEY.test(v) ? v : '');

function newDaily() { return { date: '', best: 0, done: false, streak: 0, lastWin: '', bests: {} }; }
function newMissions() { return { date: '', prog: {}, done: [] }; }

function newSave(now = 0) {
  return {
    v: SAVE_VERSION, createdAt: now, updatedAt: now, hero: DEFAULT_HERO, owned: [...FREE_HEROES], best: 0, coins: 0, runs: 0, lang: 'ar', muted: false, controls: DEFAULT_CONTROLS, hintSeen: false,
    looks: [], worn: {}, ups: { shield: 0, kite: 0, magnet: 0 }, boost: { double: false }, daily: newDaily(), missions: newMissions()
  };
}

function sanitizeWorn(raw, looks) {
  const out = {};
  const known = heroIds();
  Object.keys(asObject(raw)).filter(id => known.includes(id)).forEach(id => {
    const row = {};
    LOOK_SLOTS.forEach(slot => {
      const look = LOOKS.find(l => l.id === asObject(raw[id])[slot]);
      if (look && look.slot === slot && looks.includes(look.id)) row[slot] = look.id;
    });
    if (Object.keys(row).length) out[id] = row;
  });
  return out;
}

function sanitizeDaily(raw) {
  const d = asObject(raw), keep = DAILY.keepBests;
  const bests = {};
  Object.keys(asObject(d.bests)).filter(k => DATE_KEY.test(k)).sort().slice(-keep).forEach(k => { bests[k] = toInt(d.bests[k], 0, 1e7); });
  return { date: dateKeyOr(d.date), best: toInt(d.best, 0, 1e7), done: d.done === true, streak: toInt(d.streak, 0, 1e5), lastWin: dateKeyOr(d.lastWin), bests };
}

function sanitizeMissions(raw) {
  const m = asObject(raw), ids = MISSIONS.map(x => x.id), prog = {};
  ids.forEach(id => { if (asObject(m.prog)[id] != null) prog[id] = toInt(m.prog[id], 0, 1e6); });
  return { date: dateKeyOr(m.date), prog, done: [...new Set(Array.isArray(m.done) ? m.done : [])].filter(id => ids.includes(id)) };
}

/** Validate anything read from storage. Returns a clean save, or null when it is not a save. Older saves load unchanged (new fields default). */
function sanitizeSave(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  if (!('best' in raw) && !('coins' in raw) && !('owned' in raw) && !('hero' in raw)) return null;
  const known = heroIds();
  const owned = [...new Set([...FREE_HEROES, ...(Array.isArray(raw.owned) ? raw.owned : [])])].filter(id => known.includes(id));
  const controls = CONTROL_MODES.includes(raw.controls) ? raw.controls : raw.tilt === true ? 'tilt' : DEFAULT_CONTROLS;
  const looks = [...new Set(Array.isArray(raw.looks) ? raw.looks : [])].filter(id => LOOKS.some(l => l.id === id));
  const ups = asObject(raw.ups);
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
    hintSeen: raw.hintSeen === true,
    looks,
    worn: sanitizeWorn(raw.worn, looks),
    ups: { shield: toInt(ups.shield, 0, UPGRADES.shield.levels.length), kite: toInt(ups.kite, 0, UPGRADES.kite.levels.length), magnet: toInt(ups.magnet, 0, UPGRADES.magnet.levels.length) },
    boost: { double: asObject(raw.boost).double === true },
    daily: sanitizeDaily(raw.daily),
    missions: sanitizeMissions(raw.missions)
  };
}

/** Heroes whose score target is met by `best` and that are not yet owned. */
const earnedHeroes = (owned, best) => HEROES.filter(h => h.unlockScore > 0 && best >= h.unlockScore && !owned.includes(h.id)).map(h => h.id);

/** Apply the result of one run: coins are added and score-unlocked heroes are granted. A daily run (result.daily) leaves the
    all-time best alone, because the day's twist changes the climb. */
function recordRun(save, result, now = 0) {
  const meters = toInt(result.meters, 0, 1e7);
  const best = result.daily ? save.best : Math.max(save.best, meters);
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
