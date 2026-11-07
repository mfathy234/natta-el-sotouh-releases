/* UI: screens, language, game flow, confirm dialog, mute, controls. Everything is plain DOM over the canvas.
   The shop (heroes, looks, upgrades) and the daily challenge screens are in shopui.js. */

const $ = id => document.getElementById(id);
const UI = { save: null, state: 'splash', run: null, demo: null, confirmYes: null, debugMeters: 0 };

function setSave(next) { UI.save = next; persistSave(window.localStorage, next); metaAfterSave(); }

const SCREENS = ['menu', 'hangar', 'daily', 'album', 'comic', 'pause', 'settings', 'over', 'confirm', 'splash'];
function showScreen(name) {
  SCREENS.forEach(id => $(id).classList.toggle('show', id === name));
  $('hud').classList.toggle('hidden', UI.state !== 'play' && UI.state !== 'pause');
  Eng.stage.classList.toggle('playing', UI.state === 'play' || UI.state === 'pause');
  $('dailyChip').classList.toggle('hidden', !(UI.run && UI.run.daily && (UI.state === 'play' || UI.state === 'pause')));
}

let toastTimer = 0;
function toast(msg) {
  const el = $('toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2200);
}

/** A line at the top (milestone, fall line, target). Calm mode keeps them apart, waits while a strip or a telegraph is up, and drops stale ones. force skips the wait. */
function showPop(text, force) {
  const run = UI.run, nowS = performance.now() / 1000, blocked = Boolean(run && UI.state === 'play' && (noteStrips(run).length || telegraphActive(run)));
  if (lineDecide(nowS, NoteLine.last, blocked, force) === 'wait') {
    if (!NoteLine.pending) NoteLine.pending = { text, at: nowS };
    else NoteLine.pending.text = text;
    clearTimeout(NoteLine.timer);
    NoteLine.timer = setTimeout(() => {
      const q = NoteLine.pending;
      NoteLine.pending = null;
      if (q && performance.now() / 1000 - q.at < BANNER.stale && UI.state === 'play') showPop(q.text);
    }, 500);
    return;
  }
  NoteLine.pending = null;
  NoteLine.last = nowS;
  const el = $('pop');
  el.textContent = text;
  el.classList.remove('go');
  void el.offsetWidth;
  el.classList.add('go');
}

function refreshText() {
  document.querySelectorAll('[data-t]').forEach(el => { el.textContent = t(el.dataset.t); });
  $('menuBest').textContent = nf(UI.save.best);
  $('menuCoins').textContent = nf(UI.save.coins);
  $('hangarCoins').textContent = nf(UI.save.coins);
  $('menuHint').textContent = t(hintKey());
  refreshPass();
  $('dailyCoins').textContent = nf(UI.save.coins);
  $('dailyDot').classList.toggle('hidden', dailyView(UI.save, dateKey()).done);
  $('muteImg').src = spriteSrc(UI.save.muted ? 'item:soundOff:0' : 'item:soundOn:0');
  $('muteBtn').setAttribute('aria-label', t('mute'));
  $('pauseBtn').setAttribute('aria-label', t('pause'));
  $('btnAlbum').setAttribute('aria-label', t('album'));
  $('btnSettings').setAttribute('aria-label', t('settings'));
  $('uHeight').textContent = t(UI.run && UI.run.tower ? 'floorU' : 'm');
  refreshModeUi();
  refreshGameplayUi();
  if ($('hangar').classList.contains('show')) renderShop();
  if ($('daily').classList.contains('show')) renderDaily();
  if ($('album').classList.contains('show')) renderAlbum();
  if ($('comic').classList.contains('show')) renderComic();
  if ($('settings').classList.contains('show')) renderSettings();
  refreshAlbumCount();
}

const coarsePointer = () => Boolean(window.matchMedia && matchMedia('(pointer: coarse)').matches);
const availableModes = () => CONTROL_MODES.filter(m => m !== 'mouse' || !coarsePointer());
function refreshModeUi() {
  const tower = UI.save.mode === 'tower';
  $('btnModeFree').classList.toggle('on', !tower);
  $('btnModeTower').classList.toggle('on', tower);
  $('menuTowerLine').classList.toggle('hidden', !tower);
  $('menuFreeLine').classList.toggle('hidden', tower);
  $('menuTowerLine').textContent = t('towerLine', nf(UI.save.tower.best), nf(towerStartFloor()));
}
const towerStartFloor = () => (UI.save.tower.checkpoint >= TOWER.top ? 0 : UI.save.tower.checkpoint);

function hintKey() {
  if (UI.save.mode === 'tower') return 'hint_tower_' + (!coarsePointer() && UI.save.controls === 'drag' ? 'keys' : UI.save.controls);
  if (!coarsePointer() && UI.save.controls === 'drag') return 'hint_keys';
  return 'hint_' + UI.save.controls;
}

function applyLang() {
  LANG.cur = UI.save.lang;
  const dir = LANG.cur === 'ar' ? 'rtl' : 'ltr';
  document.documentElement.lang = LANG.cur;
  document.documentElement.dir = dir;
  Eng.stage.dir = dir;
  document.title = LANG.cur === 'ar' ? 'نطّة السطوح · Natta El Sotouh' : 'Natta El Sotouh · نطّة السطوح';
  refreshText();
}

/* ---------- quick pass ---------- */
function refreshPass() {
  const on = passActive(UI.save), text = on ? passLeftText(passRemaining(UI.save)) : '';
  ['passChipMenu', 'passChipShop'].forEach(id => { $(id).classList.toggle('hidden', !on); $(id).textContent = text; });
  $('btnPass').classList.toggle('hidden', on);
}

/** Once the pass has ended, the equipped hero and looks fall back to what is owned for good. */
function settleNow() {
  const next = settlePass(UI.save);
  if (next === UI.save) return false;
  setSave(next);
  if (UI.demo) UI.demo = newRun({ demo: true, hero: UI.save.hero });
  toast(t('passEnded'));
  refreshText();
  return true;
}

function startPassNow() {
  Sound.start();
  Sound.play('power');
  setSave(startPass(UI.save, Date.now()));
  toast(t('passOn'));
  refreshText();
}

function applyMute() { Sound.setMuted(UI.save.muted); Sound.setPrefs(UI.save.prefs); }

/* ---------- flow ---------- */
function goMenu() {
  const settled = settlePass(UI.save);
  if (settled !== UI.save) setSave(settled);
  UI.state = 'menu';
  UI.run = null;
  UI.demo = newRun({ demo: true, hero: UI.save.hero });
  if (needComic()) { openComic(); return; }
  showScreen('menu');
  refreshText();
  moodEnter();
  NattaUpdate.onMenu();
}

function startGame(daily = false) {
  Sound.start();
  Sound.play('click');
  const key = dateKey(), loadout = runLoadout(UI.save), hero = UI.save.hero;
  UI.mode = daily === true ? 'daily' : daily === 'weekly' ? 'weekly' : 'normal';
  UI.hazards = new Set();
  UI.towerBestAtStart = UI.save.tower.best;
  if (UI.mode === 'weekly') UI.run = newWeekly({ hero });
  else if (UI.mode === 'normal' && UI.save.mode === 'tower') UI.run = newTower({ hero, startFloor: towerStartFloor() });
  else {
    setSave(consumeBoost(UI.save));
    UI.run = newRun({ hero, startMeters: UI.debugMeters, daily: UI.mode === 'daily' ? { key } : null, loadout, worn: wornOf(UI.save, hero) });
  }
  UI.demo = null;
  UI.state = 'play';
  Sound.voice('jump');
  Input.reset();
  Input.calibrate();
  if (UI.save.controls === 'tilt' && !Input.tiltOn) enableTilt().then(ok => { if (!ok) toast(t('tiltDenied')); });
  UI.moved = 0;
  showRunHint(UI.run.tower ? !UI.save.tower.hintSeen : !UI.save.hintSeen);
  showScreen(null);
  $('uHeight').textContent = t(UI.run.tower ? 'floorU' : 'm');
  $('vHeight').textContent = nf(UI.run.meters);
  $('vCoins').textContent = nf(0);
  dailyChipUpdate(UI.run);
}

function pauseGame() {
  if (UI.state !== 'play') return;
  UI.state = 'pause';
  Input.reset();
  showScreen('pause');
}
function resumeGame() { if (UI.state === 'pause') { UI.state = 'play'; Input.calibrate(); showScreen(null); } }

function showRunHint(on) {
  const el = $('runHint');
  if (on) {
    $('runHintText').textContent = t(hintKey());
    el.classList.toggle('keys', !hintKey().endsWith('_drag'));
  }
  el.classList.toggle('tower', Boolean(UI.run && UI.run.tower));
  el.classList.toggle('hidden', !on);
}

/** Hide the first-run hint once the hero has really moved sideways. */
function trackHint(s, dt) {
  if (s.tower) {
    if (!UI.save.tower.hintSeen && s.jumps >= 1) { showRunHint(false); setSave(setSetting(UI.save, 'tower', { ...UI.save.tower, hintSeen: true })); }
    return;
  }
  if (UI.save.hintSeen || $('runHint').classList.contains('hidden')) return;
  UI.moved += Math.abs(s.p.vx) * dt;
  if (UI.moved > CONTROLS.hintMoves) { showRunHint(false); setSave(setSetting(UI.save, 'hintSeen', true)); }
}

/** Keep the saved best floor and checkpoint in step with the run, so quitting never loses them. */
function syncTower(s) {
  if (s.weekly || (!s.progress && !s.cpHit)) return;
  s.progress = s.cpHit = false;
  setSave(towerProgress(UI.save, s.maxFloor, Date.now()));
}
function bankTower(s) {
  if (s.weekly) { weeklyBank(s); return; }
  if (s.banked) return;
  s.banked = true;
  const next = recordTower(UI.save, { floor: s.maxFloor, coins: s.coinsGot, won: s.won }, Date.now()), newBest = s.maxFloor > UI.towerBestAtStart;
  setSave(foldRunMeta(next, runMetaInfo(s, 'tower', newBest), Date.now()));
  UI.last = { hero: UI.save.hero, worn: wornOf(UI.save, UI.save.hero), kind: 'tower', value: s.maxFloor, newBest, line: shareLine('tower', s.maxFloor, newBest) };
}
function finishTower() {
  const s = UI.run;
  bankTower(s);
  UI.state = 'over';
  $('overTitle').textContent = s.won ? pick(TOWER_LINES.win) : pick(FALL_LINES[0]);
  $('overHeight').textContent = nf(s.maxFloor) + ' ' + t('floorU');
  $('overCoins').textContent = nf(s.coinsGot);
  $('overBest').classList.add('hidden');
  $('overBestLine').textContent = t('towerLine', nf(UI.save.tower.best), nf(towerStartFloor()));
  $('overHeroBox').replaceChildren(heroView(UI.save.hero, 'slouch', wornOf(UI.save, UI.save.hero), 'over-hero'));
  Sound.voice(s.won ? 'roof' : 'ground');
  if (s.weekly) weeklyOverText(s);
  showScreen('over');
}

function finishRun() {
  if (UI.run.tower) return finishTower();
  const s = UI.run, meters = s.meters, total = score(s), prevBest = UI.save.best;
  const before = UI.save.owned;
  const res = settleRun(UI.save, s, Date.now()), kind = s.daily ? 'daily' : 'free', newBest = !s.daily && meters > prevBest && meters > 0;
  setSave(foldRunMeta(res.save, runMetaInfo(s, kind, newBest), Date.now()));
  UI.last = { hero: UI.save.hero, worn: wornOf(UI.save, UI.save.hero), kind, value: meters, newBest, line: shareLine(kind, meters, newBest) };
  UI.state = 'over';
  const line = FALL_LINES[Math.floor(Math.random() * FALL_LINES.length)];
  $('overTitle').textContent = pick(line);
  $('overHeight').textContent = nf(meters) + ' ' + t('m');
  $('overCoins').textContent = nf(s.coinsGot);
  $('overBest').classList.toggle('hidden', !newBest);
  $('overBestLine').textContent = t('bestIs', nf(UI.save.best) + ' ' + t('m'));
  $('overHeroBox').replaceChildren(heroView(UI.save.hero, 'slouch', wornOf(UI.save, UI.save.hero), 'over-hero'));
  showRunExtras(res);
  showScreen('over');
  if (meters > prevBest && meters > 0) { Sound.play('best'); Sound.voice('ash'); }
  refreshText();
  $('overBestLine').textContent = t('bestIs', nf(UI.save.best) + ' ' + t('m'));
  const fresh = UI.save.owned.filter(id => !before.includes(id));
  if (fresh.length) toast(t('unlockedNow') + ' ' + pick(HEROES.find(h => h.id === fresh[0])));
  return total;
}

/* ---------- wiring ---------- */
function toggleMute() {
  setSave(setSetting(UI.save, 'muted', !UI.save.muted));
  applyMute();
  refreshText();
}

function initUi() {
  $('btnPlay').onclick = () => startGame(false);
  $('btnDaily').onclick = () => { Sound.start(); Sound.play('click'); openDaily(); };
  $('dailyBack').onclick = () => { Sound.play('click'); goMenu(); };
  $('dailyStart').onclick = () => startGame(true);
  $('btnPass').onclick = startPassNow;
  setInterval(() => { if (UI.state !== 'play' && UI.state !== 'pause' && UI.state !== 'splash') { if (!settleNow()) refreshPass(); } }, 15000);
  $('btnHeroes').onclick = () => { Sound.start(); Sound.play('click'); openHangar('menu'); };
  $('shopTabs').onclick = e => { const b = e.target.closest('button[data-tab]'); if (b) { Sound.play('click'); SHOP.tab = b.dataset.tab; SHOP.tryLook = null; SHOP.prev = UI.save.hero; ['heroList', 'lookPane', 'upList'].forEach(id => { $(id).scrollTop = 0; }); renderShop(); } };
  $('muteBtn').onclick = () => { Sound.start(); toggleMute(); };
  $('pauseBtn').onclick = pauseGame;
  $('btnResume').onclick = resumeGame;
  $('btnQuit').onclick = () => { if (UI.run && UI.run.tower) bankTower(UI.run); goMenu(); };
  $('btnModeFree').onclick = () => { Sound.start(); Sound.play('click'); setSave(setSetting(UI.save, 'mode', 'free')); refreshText(); };
  $('btnModeTower').onclick = () => { Sound.start(); Sound.play('click'); setSave(setSetting(UI.save, 'mode', 'tower')); refreshText(); };
  $('btnRetry').onclick = () => startGame(UI.mode === 'weekly' ? 'weekly' : UI.mode === 'daily');
  $('btnOverHeroes').onclick = () => openHangar('over');
  $('btnOverMenu').onclick = goMenu;
  $('btnShare').onclick = () => { Sound.play('click'); shareLastRun(); };
  initComicUi();
  initSettingsUi();
  initAlbumUi();
  initMoods();
  $('hangarBack').onclick = () => { Sound.play('click'); if (UI.hangarFrom === 'over') { UI.state = 'over'; showScreen('over'); } else goMenu(); };
  $('confirmYes').onclick = () => { if (UI.confirmYes) UI.confirmYes(); };
  $('confirmNo').onclick = closeConfirm;
  addEventListener('keydown', e => {
    if (e.repeat) return;
    if (e.code === 'KeyM') { toggleMute(); return; }
    if (e.code === 'Escape' || e.code === 'KeyP') { if (UI.state === 'play') pauseGame(); else if (UI.state === 'pause') resumeGame(); }
    if ((e.code === 'Enter' || e.code === 'Space') && UI.state === 'over' && $('over').classList.contains('show')) startGame(UI.mode === 'weekly' ? 'weekly' : UI.mode === 'daily');
  });
  document.addEventListener('visibilitychange', () => { if (document.hidden) pauseGame(); });
  initGameplayUi();
}
