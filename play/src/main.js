/* Boot and main loop. Debug: add ?h=120 to the URL to start a run at 120 m (to look at the rooftops and the sky). */

function hudUpdate(s) {
  const h = nf(s.meters), c = nf(s.coinsGot);
  if ($('vHeight').textContent !== h) $('vHeight').textContent = h;
  if ($('vCoins').textContent !== c) $('vCoins').textContent = c;
  dailyChipUpdate(s);
}

let lastTime = performance.now();
const fpsCount = { frames: 0, secs: 0 };
function fpsTick(raw) {
  fpsCount.frames += 1;
  fpsCount.secs += raw;
  if (fpsCount.secs < 0.5) return;
  $('fps').textContent = Math.round(fpsCount.frames / fpsCount.secs) + ' fps';
  fpsCount.frames = 0;
  fpsCount.secs = 0;
}

function frame(now) {
  const dt = Math.min(0.033, (now - lastTime) / 1000);
  if (UI.save.prefs.fps) fpsTick((now - lastTime) / 1000);
  lastTime = now;
  Eng.clock += dt;
  Sound.sync(UI);
  beginFrame();
  if (UI.state === 'play' && UI.run) {
    updateRun(UI.run, dt);
    trackHint(UI.run, dt);
    metaTick(UI.run);
    if (UI.run.tower) syncTower(UI.run);
    renderRun(UI.run);
    hudUpdate(UI.run);
    if (UI.run.ended) finishRun();
  } else if ((UI.state === 'pause' || UI.state === 'over') && UI.run) {
    renderRun(UI.run);
  } else if (UI.demo) {
    updateRun(UI.demo, dt);
    renderRun(UI.demo);
  }
  requestAnimationFrame(frame);
}

async function boot() {
  const started = performance.now();
  UI.save = loadSave(window.localStorage);
  UI.debugMeters = Math.max(0, Math.min(5000, Number(new URLSearchParams(location.search).get('h')) || 0));
  initEngine();
  initInput(() => UI.state === 'play');
  await loadSprites();
  document.querySelectorAll('[data-sprite]').forEach(img => { img.src = spriteSrc(img.dataset.sprite); });
  $('menuHero').src = spriteSrc('mood:calm:0');
  initUi();
  applyMute();
  applyPrefs();
  Input.setMode(UI.save.controls);
  if (UI.save.controls === 'tilt' && !(window.DeviceOrientationEvent && typeof DeviceOrientationEvent.requestPermission === 'function')) Input.tiltOn = true;
  applyLang();
  try { await Promise.race([Promise.all([document.fonts.load('40px Lalezar', 'نطة'), document.fonts.load('700 16px Cairo', 'Aa ي')]), new Promise(r => setTimeout(r, 1500))]); } catch (e) { /* fonts are optional */ }
  const wait = Math.max(0, 900 - (performance.now() - started));
  setTimeout(() => { goMenu(); }, wait);
  requestAnimationFrame(frame);
  if ('serviceWorker' in navigator && location.protocol !== 'file:') NattaUpdate.init();
}

boot();
