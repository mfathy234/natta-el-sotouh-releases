/* The Tower, one run: hold to charge, aim, release to leap. Gravity arc, walls bounce, ledges catch you from above.
   Falling only costs height: you land on whatever ledge is below, at worst the last flag-ground. Shares fx helpers (puff, pop, updateFx) with play.js. */

/* opts: { hero, startFloor, weekly: { key } }. A weekly run is a shorter, seeded tower (WEEKLY in data.js) that never touches the saved Tower progress. */
function newTower(opts = {}) {
  const T = TOWER, wk = opts.weekly || null, top = wk ? WEEKLY.top : T.top, shift = wk ? WEEKLY.tierShift : 0;
  const data = wk ? getTower(weeklySeed(wk.key), { top, shift }) : getTower();
  const start = wk ? 0 : Math.floor(clamp(opts.startFloor || 0, 0, top - 1) / T.checkEvery) * T.checkEvery;
  const base = data.plats.find(pl => pl.type === 'ground' && pl.floor === start);
  return {
    tower: true, demo: false, t: 0, over: false, overT: 0, ended: false, won: false, banked: false, top, shift, weekly: wk, winT: 0, banners: [], bawab: null, keys: [],
    plats: data.plats.map(pl => ({ ...pl })), coins: data.coins.map(c => ({ ...c })), pows: [], enemies: [], parts: [], pops: [], warns: [],
    cam: base.y - T.camRest, hero: opts.hero || DEFAULT_HERO,
    p: { x: W / 2, y: base.y, vx: 0, vy: 0, face: 1, landT: 0, hopT: 0, popT: 0, dead: false, inv: 0, shield: false, kite: 0, shoes: 0, on: base },
    aim: 0, aimBase: 0, aimAnchor: 0, charge: 0, charging: false, bumpT: 0,
    floor: start, maxFloor: start, fromFloor: start, startFloor: start, checkpoint: start, meters: start, coinsGot: 0, bonus: 0, jumps: 0, cpHit: false, progress: false
  };
}

function towerAim(s, dt) {
  const T = TOWER, p = s.p, m = Input.effective, k = (Input.right ? 1 : 0) - (Input.left ? 1 : 0);
  if (k) s.aim = clamp(s.aim + k * T.aimRate * dt, -1, 1);
  else if (m === 'tilt') s.aim = Input.tiltAxis(dt);
  else if (m === 'buttons' && Input.touch.size) {
    let side = 0;
    Input.touch.forEach(v => { side += v; });
    s.aim = clamp(s.aim + clamp(side, -1, 1) * T.aimRate * dt, -1, 1);
  } else if (m === 'mouse' && Input.mouseIn) s.aim = clamp((Input.mouseX - p.x) / T.mouseRange, -1, 1);
  else if (Input.drag) s.aim = clamp(s.aimBase + (Input.drag.fingerX - s.aimAnchor) / T.dragPx, -1, 1);
  if (Math.abs(s.aim) > 0.04) p.face = Math.sign(s.aim);
}

function towerRelease(s) {
  const p = s.p, v = towerLaunch(s.charge, s.aim);
  s.fromFloor = p.on.floor;
  p.vx = v.vx; p.vy = v.vy; p.on = null; p.hopT = 0.2; p.landT = 0;
  s.jumps++;
  puff(s, p.x, p.y, 4, 30);
  Sound.play('jump');
  s.charging = false; s.charge = 0;
}

function towerControls(s, dt) {
  const p = s.p, holding = Input.holding;
  if (p.on && holding && !s.charging) {
    s.charging = true; s.charge = 0; s.aimBase = s.aim;
    s.aimAnchor = Input.drag ? Input.drag.fingerX : 0;
    Sound.play('click');
  }
  if (!s.charging) return;
  if (!p.on) { s.charging = false; s.charge = 0; return; }
  if (!holding) { towerRelease(s); return; }
  s.charge = Math.min(1, s.charge + dt / TOWER.chargeTime);
  towerAim(s, dt);
}

function towerLand(s, pl) {
  const p = s.p, T = TOWER, before = s.fromFloor;
  p.on = pl; p.y = pl.y; p.vy = 0; p.landT = 0.34; p.popT = 0;
  p.vx = pl.slick ? p.vx * T.slick.keep : 0;
  s.floor = pl.floor; s.meters = pl.floor;
  puff(s, p.x, pl.y - 2, 4, pl.w);
  Sound.play('jump');
  if (pl.kind === 'breakable') { pl.state = 'wobble'; pl.t = 0; Sound.play('warn'); }
  if (pl.floor > s.maxFloor) s.maxFloor = pl.floor, s.progress = true;
  const cp = Math.floor(s.maxFloor / T.checkEvery) * T.checkEvery;
  if (cp > s.checkpoint) {
    s.checkpoint = cp; s.cpHit = true;
    pop(s, t('flagSaved'), p.x, p.y - 80, K.gold);
    bannerPush(s, towerTierBanner(cp, s.shift), 'tier');
    Sound.play('mile');
  }
  const lost = before - pl.floor;
  if (lost >= T.fallLine && typeof showPop === 'function') {
    const line = pl.floor === 0 && s.maxFloor >= 5 ? TOWER_LINES.ground : pick2(lost >= 6 ? TOWER_LINES.big : TOWER_LINES.small);
    showPop(pick(line).replace('{0}', nf(lost)));
  }
  s.fromFloor = pl.floor;
  if (pl.type === 'ground' && pl.floor === s.top) {
    s.won = true; s.over = true; s.overT = 0; s.winT = s.t; Sound.play('mile');
    bannerPush(s, BAWAB.lines.beat, 'boss');
    if (typeof showPop === 'function') showPop(pick(TOWER_LINES.win));
  }
}
const pick2 = arr => arr[Math.floor(Math.random() * arr.length)];

function towerPhysics(s, dt) {
  const p = s.p, T = TOWER, [lo, hi] = towerBounds();
  s.bumpT = Math.max(0, s.bumpT - dt);
  if (p.on) {
    if (p.on.slick && Math.abs(p.vx) > 2) {
      p.x = clamp(p.x + p.vx * dt, lo, hi);
      p.vx -= clamp(p.vx, -T.slick.friction * dt, T.slick.friction * dt);
      if (Math.abs(p.x - p.on.x) > p.on.w / 2 + T.edge) { p.on = null; p.vy = 0; }
    }
    return;
  }
  const n = Math.max(1, Math.ceil(dt / (1 / 90))), h = dt / n;
  for (let i = 0; i < n; i++) {
    const hit = towerStep(p, h, s.plats);
    if (p.hitWall && s.bumpT <= 0) { s.bumpT = 0.12; puff(s, p.x, p.y - 20, 2, 6, 'spark'); }
    if (hit) { towerLand(s, hit); break; }
  }
  if (!p.on && p.y > 80) { p.y = 0; p.vy = 0; p.on = s.plats.find(pl => pl.floor === 0 && pl.type === 'ground'); }
}

function towerPlatforms(s, dt) {
  const T = TOWER, p = s.p;
  s.plats.forEach(pl => {
    pl.t += dt; pl.press = Math.max(0, pl.press - dt);
    if (pl.kind === 'breakable') {
      if (pl.state === 'wobble' && pl.t >= T.snap.warn) { pl.state = 'snap'; pl.t = 0; Sound.play('snap'); if (p.on === pl) { p.on = null; p.vy = 0; } }
      else if (pl.state === 'snap' && pl.t >= T.snap.fall) { pl.state = 'gone'; pl.t = 0; }
      else if (pl.state === 'gone' && pl.t >= T.snap.back) { pl.state = 'ok'; pl.t = 0; }
    }
    const sy = pl.y - s.cam;
    if (pl.slick && sy > -20 && sy < H && Math.random() < dt * 1.1) s.parts.push({ kind: 'drop', x: pl.x + 14, y: pl.y + 14, vx: 0, vy: 40, r: 2.4, t: 0, life: 0.9 });
  });
}

function towerCamera(s, dt) {
  const p = s.p, T = TOWER;
  let target = s.cam, k = 5;
  if (p.on) target = p.on.y - T.camRest;
  else {
    const top = p.y - 120, bot = p.y - (H - 100);
    if (s.cam > top) target = top; else if (s.cam < bot) target = bot;
    k = 12;
  }
  s.cam += (target - s.cam) * (1 - Math.exp(-k * dt));
}

function towerPickups(s) {
  const p = s.p;
  s.coins.forEach(c => {
    if (!c.got && Math.hypot(c.x - p.x, c.y - (p.y - 26)) < 28) { c.got = true; s.coinsGot++; Sound.play('coin'); puff(s, c.x, c.y, 4, 14, 'spark'); }
  });
  s.coins = s.coins.filter(c => !c.got);
}

function updateTower(s, dt) {
  const p = s.p;
  s.t += dt;
  if (!s.over) {
    towerControls(s, dt);
    towerPhysics(s, dt);
    towerPlatforms(s, dt);
    towerPickups(s);
    p.landT = Math.max(0, p.landT - dt);
    p.hopT = Math.max(0, p.hopT - dt);
    updateBawab(s, dt);
  } else {
    updateBawab(s, dt);
    s.overT += dt;
    if (s.overT > 1.3) s.ended = true;
  }
  towerCamera(s, dt);
  updateFx(s, dt);
  updateBanners(s, dt);
}

