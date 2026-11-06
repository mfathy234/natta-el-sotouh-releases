/* The settings screen (الإعدادات): opened from the menu or the pause screen. Rules and the save fields are in prefs.js / save.js;
   this file only draws the rows and wires them. Rows rebuild after every change, so they always show the saved value. */

const SETTINGS = { from: 'menu', credits: false, taps: 0, tapAt: 0 };

const buildId = () => (typeof NATTA_BUILD === 'string' ? NATTA_BUILD : 'dev');

function openSettings(from) {
  SETTINGS.from = from || 'menu';
  SETTINGS.credits = false;
  showScreen('settings');
  renderSettings();
  $('settingsBody').scrollTop = 0;
}

function closeSettings() {
  if (SETTINGS.from === 'pause' && UI.state === 'pause') showScreen('pause');
  else goMenu();
}

function applyPrefs() {
  Sound.setPrefs(UI.save.prefs);
  $('game').classList.toggle('calm', Calm.on());
  $('fps').classList.toggle('hidden', !UI.save.prefs.fps);
}

function changePref(key, value) {
  setSave(setPref(UI.save, key, value));
  applyPrefs();
}

function setRow(label, control, sub) {
  const row = el('div', 'set-row');
  const lbl = el('div', 'set-lbl');
  lbl.append(el('b', '', label));
  if (sub) lbl.append(el('small', '', sub));
  row.append(lbl, control);
  return row;
}

const pct = v => nf(v) + (LANG.cur === 'ar' ? '٪' : '%');

function setSlider(key) {
  const wrap = el('div', 'set-slider');
  const input = el('input');
  input.type = 'range';
  input.min = '0'; input.max = '100'; input.step = '5';
  input.value = String(UI.save.prefs[key]);
  input.id = 'pref_' + key;
  input.setAttribute('aria-label', t('set_' + key));
  const out = el('output', '', pct(UI.save.prefs[key]));
  input.oninput = () => {
    changePref(key, Number(input.value));
    out.textContent = pct(UI.save.prefs[key]);
  };
  input.onchange = () => { if (key === 'sfx') Sound.play('coin'); };
  wrap.append(input, out);
  return wrap;
}

function setSwitch(id, on, onToggle, disabled) {
  const b = el('button', 'switch' + (on ? ' on' : ''), t(on ? 'on' : 'off'));
  b.type = 'button'; b.id = id;
  b.setAttribute('aria-pressed', on ? 'true' : 'false');
  b.disabled = Boolean(disabled);
  b.onclick = () => { Sound.play('click'); onToggle(!on); renderSettings(); };
  return b;
}

function setSegments(id, options, current, onPick) {
  const seg = el('div', 'seg');
  seg.id = id;
  options.forEach(o => {
    const b = el('button', current === o.value ? 'on' : '', o.text);
    b.type = 'button'; b.dataset.value = o.value;
    b.onclick = () => { Sound.play('click'); onPick(o.value); };
    seg.append(b);
  });
  return seg;
}

function setControlsMode(mode) {
  const go = async () => {
    if (mode === 'tilt' && !(await enableTilt())) { toast(t('tiltDenied')); return; }
    setSave(setSetting(UI.save, 'controls', mode));
    Input.setMode(mode);
    refreshText();
  };
  go();
}

function setHeading(text) { return el('h3', 'set-h', text); }

function setAction(id, text, cls, onClick) {
  const b = el('button', 'btn ' + cls, text);
  b.type = 'button'; b.id = id;
  b.onclick = onClick;
  return b;
}

function eraseProgress() {
  askConfirm(t('set_resetTitle'), t('set_resetBody'), t('set_resetBtn'), () => {
    try { window.localStorage.removeItem(GHOST.key); } catch (e) { /* storage may be blocked */ }
    setSave(resetProgress(UI.save, Date.now()));
    UI.state = 'menu';
    applyLang();
    applyPrefs();
    Input.setMode(UI.save.controls);
    toast(t('set_resetDone'));
    closeSettings();
  });
}

function tapVersion() {
  const now = Date.now();
  SETTINGS.taps = now - SETTINGS.tapAt < 1500 ? SETTINGS.taps + 1 : 1;
  SETTINGS.tapAt = now;
  if (SETTINGS.taps < 5) return;
  SETTINGS.taps = 0;
  changePref('fps', !UI.save.prefs.fps);
  toast(t(UI.save.prefs.fps ? 'set_fpsOn' : 'set_fpsOff'));
}

function renderSettings() {
  const body = $('settingsBody'), keep = body.scrollTop, p = UI.save.prefs, inRun = SETTINGS.from === 'pause';
  const rows = [];
  rows.push(setHeading(t('set_sound')));
  rows.push(setRow(t('set_music'), setSlider('music')));
  rows.push(setRow(t('set_sfx'), setSlider('sfx')));
  rows.push(setRow(t('set_voices'), setSwitch('pref_voices', p.voices, v => changePref('voices', v))));
  rows.push(setRow(t('set_vibrate'), setSwitch('pref_vibrate', p.vibrate, v => changePref('vibrate', v), !Haptic.can()), Haptic.can() ? '' : t('set_noVibrate')));
  rows.push(setHeading(t('set_play')));
  rows.push(setRow(t('set_controls'), setSegments('pref_controls', availableModes().map(m => ({ value: m, text: t('ctrl_' + m) })), UI.save.controls, setControlsMode)));
  rows.push(setRow(t('set_ghost'), setSwitch('pref_ghost', UI.save.ghost !== false, v => { setSave(setSetting(UI.save, 'ghost', v)); })));
  rows.push(setRow(t('set_calm'), setSwitch('pref_calm', p.calm, v => changePref('calm', v))));
  rows.push(setRow(t('set_lang'), setSegments('pref_lang', [{ value: 'ar', text: 'عربي' }, { value: 'en', text: 'English' }], UI.save.lang, v => { setSave(setSetting(UI.save, 'lang', v)); applyLang(); })));
  rows.push(setHeading(t('set_story')));
  if (!inRun) rows.push(setAction('btnSetComic', t('set_comic'), '', () => { Sound.play('click'); openComic(() => { UI.state = 'menu'; openSettings('menu'); }); }));
  rows.push(setAction('btnSetCredits', t('set_credits'), 'ghost', () => { Sound.play('click'); SETTINGS.credits = !SETTINGS.credits; renderSettings(); }));
  if (SETTINGS.credits) rows.push(el('p', 'set-credits', t('set_creditsText')));
  if (!inRun) rows.push(setAction('btnSetReset', t('set_reset'), 'danger', () => { Sound.play('click'); eraseProgress(); }));
  const ver = el('button', 'set-version', versionLine(buildId()));
  ver.type = 'button'; ver.id = 'setVersion';
  ver.onclick = tapVersion;
  rows.push(ver);
  body.replaceChildren(...rows);
  body.scrollTop = keep;
}

function initSettingsUi() {
  $('btnSettings').onclick = () => { Sound.start(); Sound.play('click'); openSettings('menu'); };
  $('btnPauseSettings').onclick = () => { Sound.play('click'); openSettings('pause'); };
  $('settingsBack').onclick = () => { Sound.play('click'); closeSettings(); };
}
