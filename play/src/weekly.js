/* Weekly Tower (برج الأسبوع): a seeded WEEKLY.top-floor tower per ISO week, reached from the Tower mode. Same hold-to-charge climb, a harder mix
   (WEEKLY.tierShift tiers up) and El Bawab on the last floors. The save keeps this week's best time and which week paid its reward:
   save.weekly = { key: '2026-W45', best: ms (0 = none), rewarded: key }. Pure rules first, then the run and screen hooks. */

/** ISO 8601 week key of a local date: "2026-W45". */
function isoWeekKey(d = new Date()) {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  t.setUTCDate(t.getUTCDate() + 4 - (t.getUTCDay() || 7));
  const y = t.getUTCFullYear(), w = Math.ceil(((t - Date.UTC(y, 0, 1)) / 86400000 + 1) / 7);
  return y + '-W' + String(w).padStart(2, '0');
}

/** Seed for a week key: the same for everyone, different every week. */
function weeklySeed(key) {
  const [y, w] = key.split('-W').map(Number);
  return WEEKLY.seedBase + y * 60 + w;
}

/** This week's view of a save: best time (0 = none yet) and whether the reward was taken. */
function weeklyView(save, key) {
  const w = sanitizeWeeklySave(save.weekly);
  return { key, best: w.key === key ? w.best : 0, paid: w.rewarded === key };
}

/** Bank a finished weekly run. Only a win counts: it may set a new best time and pays the reward once per week. Returns { save, reward, newBest }. */
function recordWeekly(save, result, now = 0) {
  const view = weeklyView(save, result.key);
  if (!result.won) return { save, reward: 0, newBest: false };
  const ms = Math.max(1, Math.min(1e8, Math.floor(Number(result.ms) || 1)));
  const newBest = view.best === 0 || ms < view.best, reward = view.paid ? 0 : WEEKLY.reward;
  const weekly = { key: result.key, best: newBest ? ms : view.best, rewarded: result.key };
  return { save: { ...save, coins: save.coins + reward, weekly, updatedAt: now }, reward, newBest };
}

/** A time for text: "1 د 05 ث" / "1m 05s" (words, so Arabic right-to-left layout cannot reorder digits). */
function timeText(ms) {
  const s = Math.floor(ms / 1000), m = Math.floor(s / 60), ss = s % 60;
  if (LANG.cur !== 'ar') return m ? m + 'm ' + String(ss).padStart(2, '0') + 's' : ss + 's';
  return m ? nf(m) + ' د ' + nf(ss) + ' ث' : nf(ss) + ' ث';
}

/** The running clock "01:05", drawn left to right on the canvas. */
function drawClock(ms) {
  const s = Math.floor(ms / 1000), ctx = Eng.ctx, text = nf(String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0'));
  ctx.save();
  ctx.direction = 'ltr'; ctx.font = '22px Lalezar, Cairo, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
  ctx.lineWidth = 6; ctx.strokeStyle = K.ink; ctx.strokeText(text, W / 2, 70); ctx.fillStyle = K.white; ctx.fillText(text, W / 2, 70);
  ctx.restore();
}

/* ---------- run and screen hooks ---------- */
function newWeekly(opts = {}) {
  return newTower({ hero: opts.hero, weekly: { key: opts.key || isoWeekKey() } });
}

/** Bank the finished run into the save (called from bankTower in ui.js). */
function weeklyBank(s) {
  if (s.banked) return;
  s.banked = true;
  if (!s.won) return;
  const res = recordWeekly(UI.save, { key: s.weekly.key, ms: s.winT * 1000, won: true }, Date.now());
  s.weeklyResult = res;
  setSave(res.save);
}

/** Game over texts for a weekly run (called from finishTower in ui.js after the shared ones). */
function weeklyOverText(s) {
  const res = s.weeklyResult, view = weeklyView(UI.save, s.weekly.key);
  $('overTitle').textContent = s.won ? pick(TOWER_LINES.win) : pick(FALL_LINES[0]);
  $('overHeight').textContent = nf(s.maxFloor) + ' ' + t('floorU');
  $('overBestLine').textContent = s.won
    ? t('weeklyWon', timeText(s.winT * 1000), view.best ? timeText(view.best) : '-') + (res && res.reward ? ' · ' + t('weeklyReward', nf(res.reward)) : '')
    : t('weeklyLost', view.best ? timeText(view.best) : '-');
  $('overBest').classList.toggle('hidden', !(res && res.newBest));
}

function refreshGameplayUi() {
  const tower = UI.save.mode === 'tower', btn = $('btnWeekly');
  if (!btn) return;
  btn.classList.toggle('hidden', !tower);
  const v = weeklyView(UI.save, isoWeekKey());
  btn.textContent = t('weeklyBtn') + (v.best ? ' · ' + timeText(v.best) : '');
  const g = $('btnGhost');
  if (g) g.textContent = t('ghostBtn') + ': ' + t(UI.save.ghost === false ? 'off' : 'on');
}

function initGameplayUi() {
  const w = $('btnWeekly'), g = $('btnGhost');
  if (w) w.onclick = () => { Sound.start(); Sound.play('click'); startGame('weekly'); };
  if (g) g.onclick = () => { Sound.play('click'); setSave(setSetting(UI.save, 'ghost', UI.save.ghost === false)); refreshGameplayUi(); };
}

if (typeof module !== 'undefined' && module.exports) module.exports = { isoWeekKey, weeklySeed, weeklyView, recordWeekly };
