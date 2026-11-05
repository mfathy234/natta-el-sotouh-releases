/* UI: screens, language, game flow, confirm dialog, mute, controls. Everything is plain DOM over the canvas.
   The shop (heroes, looks, upgrades) and the daily challenge screens are in shopui.js. */

const $ = id => document.getElementById(id);
const UI = { save: null, state: 'splash', run: null, demo: null, confirmYes: null, debugMeters: 0 };

function setSave(next) { UI.save = next; persistSave(window.localStorage, next); }

const SCREENS = ['menu', 'hangar', 'daily', 'pause', 'over', 'confirm', 'splash'];
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

function showPop(text) {
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
  $('controlsState').textContent = t('ctrl_' + UI.save.controls);
  $('menuHint').textContent = t(hintKey());
  $('dailyCoins').textContent = nf(UI.save.coins);
  $('dailyDot').classList.toggle('hidden', dailyView(UI.save, dateKey()).done);
  $('muteImg').src = spriteSrc(UI.save.muted ? 'item:soundOff:0' : 'item:soundOn:0');
  $('muteBtn').setAttribute('aria-label', t('mute'));
  $('pauseBtn').setAttribute('aria-label', t('pause'));
  $('uHeight').textContent = t('m');
  if ($('hangar').classList.contains('show')) renderShop();
  if ($('daily').classList.contains('show')) renderDaily();
}

const coarsePointer = () => Boolean(window.matchMedia && matchMedia('(pointer: coarse)').matches);
const availableModes = () => CONTROL_MODES.filter(m => m !== 'mouse' || !coarsePointer());
function hintKey() {
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

function applyMute() { Sound.setMuted(UI.save.muted); }

/* ---------- flow ---------- */
function goMenu() {
  UI.state = 'menu';
  UI.run = null;
  UI.demo = newRun({ demo: true, hero: UI.save.hero });
  showScreen('menu');
  refreshText();
}

function startGame(daily = false) {
  Sound.start();
  Sound.play('click');
  const key = dateKey(), loadout = runLoadout(UI.save), hero = UI.save.hero;
  UI.mode = daily === true ? 'daily' : 'normal';
  setSave(consumeBoost(UI.save));
  UI.run = newRun({ hero, startMeters: UI.debugMeters, daily: UI.mode === 'daily' ? { key } : null, loadout, worn: wornOf(UI.save, hero) });
  UI.demo = null;
  UI.state = 'play';
  Input.reset();
  Input.calibrate();
  if (UI.save.controls === 'tilt' && !Input.tiltOn) enableTilt().then(ok => { if (!ok) toast(t('tiltDenied')); });
  UI.moved = 0;
  showRunHint(!UI.save.hintSeen);
  showScreen(null);
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
    el.classList.toggle('keys', hintKey() !== 'hint_drag');
  }
  el.classList.toggle('hidden', !on);
}

/** Hide the first-run hint once the hero has really moved sideways. */
function trackHint(s, dt) {
  if (UI.save.hintSeen || $('runHint').classList.contains('hidden')) return;
  UI.moved += Math.abs(s.p.vx) * dt;
  if (UI.moved > CONTROLS.hintMoves) { showRunHint(false); setSave(setSetting(UI.save, 'hintSeen', true)); }
}

function finishRun() {
  const s = UI.run, meters = s.meters, total = score(s), prevBest = UI.save.best;
  const before = UI.save.owned;
  const res = settleRun(UI.save, s, Date.now());
  setSave(res.save);
  UI.state = 'over';
  const line = FALL_LINES[Math.floor(Math.random() * FALL_LINES.length)];
  $('overTitle').textContent = pick(line);
  $('overHeight').textContent = nf(meters) + ' ' + t('m');
  $('overCoins').textContent = nf(s.coinsGot);
  $('overBest').classList.toggle('hidden', !(meters > prevBest && meters > 0));
  $('overBestLine').textContent = t('bestIs', nf(UI.save.best) + ' ' + t('m'));
  $('overHeroBox').replaceChildren(heroView(UI.save.hero, 'slouch', wornOf(UI.save, UI.save.hero), 'over-hero'));
  showRunExtras(res);
  showScreen('over');
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

async function cycleControls() {
  const modes = availableModes();
  const next = modes[(modes.indexOf(UI.save.controls) + 1) % modes.length];
  if (next === 'tilt' && !(await enableTilt())) { toast(t('tiltDenied')); return; }
  setSave(setSetting(UI.save, 'controls', next));
  Input.setMode(next);
  refreshText();
}

function initUi() {
  $('btnPlay').onclick = () => startGame(false);
  $('btnDaily').onclick = () => { Sound.start(); Sound.play('click'); openDaily(); };
  $('dailyBack').onclick = () => { Sound.play('click'); goMenu(); };
  $('dailyStart').onclick = () => startGame(true);
  $('btnHeroes').onclick = () => { Sound.start(); Sound.play('click'); openHangar('menu'); };
  $('btnControls').onclick = () => { Sound.start(); Sound.play('click'); cycleControls(); };
  $('shopTabs').onclick = e => { const b = e.target.closest('button[data-tab]'); if (b) { Sound.play('click'); SHOP.tab = b.dataset.tab; ['heroList', 'lookPane', 'upList'].forEach(id => { $(id).scrollTop = 0; }); renderShop(); } };
  $('btnLang').onclick = () => { Sound.start(); Sound.play('click'); setSave(setSetting(UI.save, 'lang', UI.save.lang === 'ar' ? 'en' : 'ar')); applyLang(); };
  $('muteBtn').onclick = () => { Sound.start(); toggleMute(); };
  $('pauseBtn').onclick = pauseGame;
  $('btnResume').onclick = resumeGame;
  $('btnQuit').onclick = goMenu;
  $('btnRetry').onclick = () => startGame(UI.mode === 'daily');
  $('btnOverHeroes').onclick = () => openHangar('over');
  $('btnOverMenu').onclick = goMenu;
  $('hangarBack').onclick = () => { Sound.play('click'); if (UI.hangarFrom === 'over') { UI.state = 'over'; showScreen('over'); } else goMenu(); };
  $('confirmYes').onclick = () => { if (UI.confirmYes) UI.confirmYes(); };
  $('confirmNo').onclick = closeConfirm;
  addEventListener('keydown', e => {
    if (e.repeat) return;
    if (e.code === 'KeyM') { toggleMute(); return; }
    if (e.code === 'Escape' || e.code === 'KeyP') { if (UI.state === 'play') pauseGame(); else if (UI.state === 'pause') resumeGame(); }
    if ((e.code === 'Enter' || e.code === 'Space') && UI.state === 'over' && $('over').classList.contains('show')) startGame(UI.mode === 'daily');
  });
  document.addEventListener('visibilitychange', () => { if (document.hidden) pauseGame(); });
}
