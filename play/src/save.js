/* Save model: pure and immutable. Every function returns a new save; storage adapters are at the bottom.
   Shop (looks, upgrades) rules are in shop.js; the daily challenge and missions are in daily.js. */

if (typeof module !== 'undefined' && module.exports && typeof sanitizeMeta === 'undefined') Object.assign(global, require('./meta.js'));

const SAVE_VERSION = 2;
const FREE_HEROES = ['marei'];
const HOUR_MS = 3600 * 1000;
const DATE_KEY = /^\d{4}-\d{2}-\d{2}$/;

const toInt = (v, min, max) => (Number.isFinite(Number(v)) ? Math.max(min, Math.min(max, Math.floor(Number(v)))) : min);
const heroIds = () => HEROES.map(h => h.id);
const heroById = id => HEROES.find(h => h.id === id) || null;
const asObject = v => (v && typeof v === 'object' && !Array.isArray(v) ? v : {});
const dateKeyOr = v => (typeof v === 'string' && DATE_KEY.test(v) ? v : '');

const WEEK_KEY = /^\d{4}-W\d{2}$/;
const newWeeklySave = () => ({ key: '', best: 0, rewarded: '' });

function newDaily() { return { date: '', best: 0, done: false, streak: 0, lastWin: '', bests: {} }; }
function newMissions() { return { date: '', prog: {}, done: [] }; }

function newSave(now = 0) {
  return {
    v: SAVE_VERSION, createdAt: now, updatedAt: now, hero: DEFAULT_HERO, owned: [...FREE_HEROES], best: 0, coins: 0, runs: 0, lang: 'ar', muted: false, controls: DEFAULT_CONTROLS, hintSeen: false,
    looks: [], worn: {}, ups: { shield: 0, kite: 0, magnet: 0 }, boost: { double: false }, daily: newDaily(), missions: newMissions(), mode: 'free', tower: newTowerSave(), passUntil: 0, meta: newMeta(), ghost: true, weekly: newWeeklySave()
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

/** Weekly Tower record: this week's key, best time in ms (0 = none) and the week that paid its reward. */
function sanitizeWeeklySave(raw) {
  const r = asObject(raw), n = Number(r.best);
  const key = typeof r.key === 'string' && WEEK_KEY.test(r.key) ? r.key : '';
  return { key, best: key && Number.isFinite(n) ? Math.max(0, Math.min(1e8, Math.floor(n))) : 0, rewarded: typeof r.rewarded === 'string' && WEEK_KEY.test(r.rewarded) ? r.rewarded : '' };
}

function sanitizeMissions(raw) {
  const m = asObject(raw), ids = MISSIONS.map(x => x.id), prog = {};
  ids.forEach(id => { if (asObject(m.prog)[id] != null) prog[id] = toInt(m.prog[id], 0, 1e6); });
  return { date: dateKeyOr(m.date), prog, done: [...new Set(Array.isArray(m.done) ? m.done : [])].filter(id => ids.includes(id)) };
}

/** Validate anything read from storage. Returns a clean save, or null when it is not a save. Older saves load unchanged (new fields default). */
function sanitizeSave(raw, now = Date.now()) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  if (!('best' in raw) && !('coins' in raw) && !('owned' in raw) && !('hero' in raw)) return null;
  const known = heroIds();
  const passUntil = Number(raw.passUntil) > now ? Math.min(Math.floor(Number(raw.passUntil)), now + PASS.hours * HOUR_MS) : 0;
  const owned = [...new Set([...FREE_HEROES, ...(Array.isArray(raw.owned) ? raw.owned : [])])].filter(id => known.includes(id));
  const controls = CONTROL_MODES.includes(raw.controls) ? raw.controls : raw.tilt === true ? 'tilt' : DEFAULT_CONTROLS;
  const looks = [...new Set(Array.isArray(raw.looks) ? raw.looks : [])].filter(id => LOOKS.some(l => l.id === id));
  const ups = asObject(raw.ups);
  return {
    v: SAVE_VERSION,
    createdAt: toInt(raw.createdAt, 0, 9e15),
    updatedAt: toInt(raw.updatedAt, 0, 9e15),
    hero: owned.includes(raw.hero) || (passUntil > 0 && known.includes(raw.hero)) ? raw.hero : DEFAULT_HERO,
    owned,
    best: toInt(raw.best, 0, 1e7),
    coins: toInt(raw.coins, 0, 1e9),
    runs: toInt(raw.runs, 0, 1e9),
    lang: raw.lang === 'en' ? 'en' : 'ar',
    muted: raw.muted === true,
    controls,
    hintSeen: raw.hintSeen === true,
    looks,
    worn: sanitizeWorn(raw.worn, passUntil > 0 ? LOOKS.map(l => l.id) : looks),
    ups: { shield: toInt(ups.shield, 0, UPGRADES.shield.levels.length), kite: toInt(ups.kite, 0, UPGRADES.kite.levels.length), magnet: toInt(ups.magnet, 0, UPGRADES.magnet.levels.length) },
    boost: { double: asObject(raw.boost).double === true },
    daily: sanitizeDaily(raw.daily),
    missions: sanitizeMissions(raw.missions),
    mode: raw.mode === 'tower' ? 'tower' : 'free',
    tower: sanitizeTower(raw.tower),
    passUntil,
    meta: sanitizeMeta(raw.meta),
    ghost: raw.ghost !== false,
    weekly: sanitizeWeeklySave(raw.weekly)
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

/* ---------- The quick pass: free access while save.passUntil is in the future; nothing is granted for good ---------- */
const passClock = { now: () => Date.now() };
const passActive = (save, now = passClock.now()) => Boolean(save) && save.passUntil > now;
const passRemaining = (save, now = passClock.now()) => (passActive(save, now) ? save.passUntil - now : 0);

/** Whole days and leftover hours of a time left, rounded up to the hour so it never shows zero while it still runs. */
function passSplit(ms) {
  const total = ms <= 0 ? 0 : Math.ceil(ms / HOUR_MS);
  return { days: Math.floor(total / 24), hours: total % 24 };
}

/** Starts a pass now. One that is already running is left alone; an ended one can be started again. */
const startPass = (save, now = passClock.now()) => (passActive(save, now) ? save : { ...save, passUntil: now + PASS.hours * HOUR_MS, updatedAt: now });

/** True when this hero can be played now: owned for good, or any hero while the pass runs. */
const heroFlies = (save, id, now = passClock.now()) => Boolean(heroById(id)) && (save.owned.includes(id) || passActive(save, now));

/** After the pass ends: the chosen hero and worn looks fall back to what is owned for good. Returns the same save when nothing changes. */
function settlePass(save, now = passClock.now()) {
  if (passActive(save, now)) return save;
  const hero = save.owned.includes(save.hero) ? save.hero : DEFAULT_HERO;
  const worn = sanitizeWorn(save.worn, save.looks);
  const same = hero === save.hero && JSON.stringify(worn) === JSON.stringify(save.worn) && !save.passUntil;
  return same ? save : { ...save, hero, worn, passUntil: 0 };
}

const selectHero = (save, id) => (heroFlies(save, id) ? { ...save, hero: id } : save);
const setSetting = (save, key, value) => sanitizeSave({ ...save, [key]: value }) || save;

/* ---------- The Tower: best floor, last checkpoint (a multiple of TOWER.checkEvery), runs and rooftop wins ---------- */
const newTowerSave = () => ({ best: 0, checkpoint: 0, runs: 0, wins: 0, hintSeen: false });

function sanitizeTower(raw) {
  const r = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
  const every = TOWER.checkEvery, snapCp = n => Math.floor(toInt(n, 0, TOWER.top) / every) * every;
  const checkpoint = snapCp(r.checkpoint);
  return { best: Math.max(toInt(r.best, 0, TOWER.top), checkpoint), checkpoint, runs: toInt(r.runs, 0, 1e9), wins: toInt(r.wins, 0, 1e9), hintSeen: r.hintSeen === true };
}

/** Note progress mid-run: the best floor and the highest checkpoint only ever go up. */
function towerProgress(save, floor, now = 0) {
  const every = TOWER.checkEvery, f = toInt(floor, 0, TOWER.top), tw = save.tower;
  const checkpoint = Math.max(tw.checkpoint, Math.floor(f / every) * every);
  return { ...save, tower: { ...tw, best: Math.max(tw.best, f), checkpoint }, updatedAt: now };
}

/** Bank a finished Tower run: progress, coins, run count, and a win when the rooftop was reached. */
function recordTower(save, result, now = 0) {
  const next = towerProgress(save, result.floor, now);
  return { ...next, coins: save.coins + toInt(result.coins, 0, 1e6), runs: save.runs + 1, tower: { ...next.tower, runs: next.tower.runs + 1, wins: next.tower.wins + (result.won ? 1 : 0) } };
}

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
  module.exports = { newSave, sanitizeSave, recordRun, canBuyHero, buyHero, selectHero, setSetting, loadSave, persistSave, earnedHeroes, passActive, passRemaining, passSplit, startPass, heroFlies, settlePass, passClock, sanitizeTower, towerProgress, recordTower, sanitizeWeeklySave, newWeeklySave };
}
