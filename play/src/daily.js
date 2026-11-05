/* Daily challenge and daily missions, pure and immutable. A day is a YYYY-MM-DD key (the player's local date).
   The key seeds everything (twist, target height, level layout, missions), so everyone gets the same day.
   Tuning is in data.js (DAILY, MISSIONS). */

function dateKey(d = new Date()) {
  const p = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/** The previous calendar day's key (noon avoids daylight-saving edges). */
function prevDateKey(key) {
  const [y, m, d] = key.split('-').map(Number), dt = new Date(y, m - 1, d, 12);
  dt.setDate(dt.getDate() - 1);
  return dateKey(dt);
}

/** FNV-1a hash of the key, a stable 32-bit seed. */
function seedFromKey(key) {
  let h = 2166136261;
  for (let i = 0; i < key.length; i++) { h ^= key.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

/** mulberry32: a small seeded random generator returning [0, 1). */
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const dailyTwist = key => DAILY.twists[seedFromKey(key + ':twist') % DAILY.twists.length];
const dailyTarget = key => dailyTwist(key).target + (seedFromKey(key + ':target') % DAILY.targetSteps) * DAILY.targetStep;
const dailyReward = streak => DAILY.reward.base + DAILY.reward.perStreak * Math.min(Math.max(streak, 1), DAILY.reward.maxStreak) - DAILY.reward.perStreak;

/** Today as the UI needs it. The streak shown only counts if it is still alive (won today or yesterday). */
function dailyView(save, key) {
  const d = save.daily, today = d.date === key;
  const alive = d.lastWin === key || d.lastWin === prevDateKey(key);
  const streak = alive ? d.streak : 0;
  return {
    key, twist: dailyTwist(key), target: dailyTarget(key), best: today ? d.best : 0, done: today && d.done, streak,
    reward: dailyReward(d.lastWin === key ? streak : streak + 1)
  };
}

/** Record a finished daily run: best for the day, and on reaching the target (once a day) the coin reward and the streak.
    Returns { save, won, reward }. */
function applyDaily(save, key, meters, now = 0) {
  const prev = save.daily, today = prev.date === key;
  const base = today ? prev : { ...prev, date: key, best: 0, done: false };
  const best = Math.max(base.best, meters);
  const bests = { ...prev.bests, [key]: best };
  const kept = {};
  Object.keys(bests).sort().slice(-DAILY.keepBests).forEach(k => { kept[k] = bests[k]; });
  let next = { ...base, best, bests: kept };
  let reward = 0, won = false;
  if (!base.done && best >= dailyTarget(key)) {
    const streak = prev.lastWin === prevDateKey(key) ? prev.streak + 1 : 1;
    reward = dailyReward(streak);
    won = true;
    next = { ...next, done: true, streak, lastWin: key };
  }
  return { save: { ...save, daily: next, coins: save.coins + reward, updatedAt: now }, won, reward };
}

/** Three distinct missions for the day. */
function missionsFor(key) {
  const rnd = mulberry32(seedFromKey(key + ':missions')), pool = [...MISSIONS], out = [];
  while (out.length < 3 && pool.length) out.push(pool.splice(Math.floor(rnd() * pool.length), 1)[0]);
  return out;
}

/** Missions with progress: [{ ...mission, progress, done }]. A save from another day shows zero progress. */
function missionState(save, key) {
  const m = save.missions, today = m.date === key;
  return missionsFor(key).map(x => ({ ...x, progress: today ? Math.min(x.n, m.prog[x.id] || 0) : 0, done: today && m.done.includes(x.id) }));
}

/** Add a run's stats ({ coins, pigeons, ful, kites, meters, runs }) to today's missions and pay each one that completes.
    Returns { save, completed: [{ id, reward }], bonus }. */
function applyMissions(save, key, stats, now = 0) {
  const prev = save.missions, today = prev.date === key;
  const prog = { ...(today ? prev.prog : {}) }, done = [...(today ? prev.done : [])], completed = [];
  missionsFor(key).forEach(x => {
    if (done.includes(x.id)) return;
    const add = Number(stats[x.stat]) || 0;
    prog[x.id] = Math.min(x.n, x.mode === 'max' ? Math.max(prog[x.id] || 0, add) : (prog[x.id] || 0) + add);
    if (prog[x.id] >= x.n) { done.push(x.id); completed.push({ id: x.id, reward: x.reward }); }
  });
  const all = missionsFor(key).every(x => done.includes(x.id));
  const bonus = all && completed.length ? DAILY.missionBonus : 0;
  const coins = completed.reduce((s, c) => s + c.reward, 0) + bonus;
  return { save: { ...save, missions: { date: key, prog, done }, coins: save.coins + coins, updatedAt: now }, completed, bonus };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { dateKey, prevDateKey, seedFromKey, mulberry32, dailyTwist, dailyTarget, dailyReward, dailyView, applyDaily, missionsFor, missionState, applyMissions };
}
