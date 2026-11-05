/* One run: player physics, platforms, enemies with telegraphs, pickups, score. Pure state + update; drawing is in render.js. */

/* opts: { demo, hero, startMeters, daily: { key }, loadout (from runLoadout), worn (looks the hero wears) }. */
function newRun(opts = {}) {
  const startM = opts.startMeters || 0, py = -startM * METER;
  const daily = opts.daily || null, load = opts.loadout || { shield: false, kiteBonus: 0, magnet: 0, coinMult: 1 };
  const s = {
    rnd: daily ? mulberry32(seedFromKey(daily.key)) : Math.random, daily, worn: opts.worn || {}, twist: daily ? dailyTwist(daily.key) : null, target: daily ? dailyTarget(daily.key) : 0, targetHit: false,
    stats: { coins: 0, pigeons: 0, ful: 0, kites: 0, beads: 0 }, coinMult: load.coinMult, kiteTime: PHYS.kiteTime + load.kiteBonus, firstBounceDone: false,
    t: 0, demo: Boolean(opts.demo), over: false, overT: 0, ended: false,
    cam: py - (H - 120), plats: [], coins: [], pows: [], enemies: [], parts: [], pops: [], warns: [],
    genTop: py, lastX: W / 2, unsafeRun: 0, lastPowY: py + 1e4, lastEnemyY: py + 1e4,
    p: { x: W / 2, y: py - PHYS.halfH, vx: 0, vy: 0, face: 1, landT: 0, dead: false, inv: 0, shield: load.shield, kite: 0, shoes: 0, hopT: 0 },
    maxUp: startM * METER, meters: startM, coinsGot: 0, bonus: 0, milestone: 0,
    crowT: rand(...ENEMIES.crow.every), slipT: rand(...ENEMIES.slipper.every), hero: opts.hero || DEFAULT_HERO
  };
  s.cam0 = s.cam;
  s.magR = perkMagnet(s, load);
  s.plats.push(makePlatform('balcony', W / 2, py, s.rnd));
  genUntil(s, s.cam - 700);
  return s;
}

const score = s => s.meters + s.coinsGot * COIN_SCORE + s.bonus;
const dxWrap = (a, b) => { let d = a - b; if (d > W / 2) d -= W; if (d < -W / 2) d += W; return d; };

function puff(s, x, y, n = 5, spread = 40, kind = 'puff') {
  for (let i = 0; i < n; i++) s.parts.push({ kind, x: x + rand(-spread / 2, spread / 2), y, vx: rand(-40, 40), vy: rand(-50, -10), r: rand(4, 8), t: 0, life: rand(0.45, 0.75) });
}
const pop = (s, text, x, y, color) => s.pops.push({ text, x, y, t: 0, color });

function launch(s, power, sound) {
  const p = s.p;
  p.vy = -power;
  p.landT = 0.34;
  p.hopT = 0.2;
  Sound.play(sound);
}

function landOn(s, pl) {
  const p = s.p;
  const spring = pl.kind === 'spring';
  let power = PHYS.bounce, sound = 'jump';
  if (spring) { power = PHYS.spring; sound = 'spring'; pl.press = 0.25; }
  else if (p.shoes > 0) { power = PHYS.shoes; p.shoes -= 1; sound = 'spring'; }
  launch(s, perkBounce(s, power), sound);
  puff(s, p.x, pl.y - 2, spring ? 7 : 4, pl.w);
  if (pl.type === 'cloud') pl.press = 0.4;
  if (pl.kind === 'breakable') { pl.state = 'snap'; pl.t = 0; Sound.play('snap'); }
  else if (pl.kind === 'vanishing') { pl.state = 'flip'; pl.t = 0; }
}

function killEnemy(s, e, stomp) {
  e.dead = true;
  puff(s, e.x, e.y, 7, 30, 'puff');
  if (stomp) {
    s.bonus += 10; pop(s, '+' + nf(10), e.x, e.y - 20, K.gold); Sound.play('stomp');
    if (e.type === 'pigeon') {
      s.stats.pigeons += 1;
      const extra = s.twist && s.twist.stompCoins;
      if (extra) { s.coinsGot += extra * s.coinMult; s.stats.coins += extra; pop(s, '+' + nf(extra * s.coinMult), e.x, e.y - 44, K.gold); }
    }
  }
}

function playerHit(s, e) {
  const p = s.p;
  if (p.inv > 0) return;
  if (p.kite > 0) { killEnemy(s, e, false); return; }
  if (p.shield) {
    p.shield = false; p.inv = PHYS.invuln; killEnemy(s, e, false);
    Sound.play('hit'); pop(s, t('shieldBroke'), p.x, p.y - 40, K.blueLight);
    return;
  }
  p.dead = true; p.vy = -PHYS.hurtHop; p.vx = 0;
  Sound.play('hit');
}

function updatePlayer(s, dt) {
  const p = s.p, ax = s.demo ? 0 : Input.axis(p, dt);
  if (!p.dead) {
    const target = ax * PHYS.maxVx, turning = ax !== 0 && Math.sign(ax) !== Math.sign(p.vx) && p.vx !== 0;
    if (ax !== 0) { const a = PHYS.accel * (turning ? PHYS.turnBoost : 1) * dt; p.vx += clamp(target - p.vx, -a, a); }
    else p.vx -= clamp(p.vx, -PHYS.drag * dt, PHYS.drag * dt);
    if (Math.abs(ax) > CONTROLS.face) p.face = Math.sign(ax);
  }
  if (p.kite > 0 && !p.dead) { p.kite -= dt; p.vy = -PHYS.kiteSpeed; if (p.kite <= 0) { p.vy = -PHYS.bounce * 0.6; p.inv = 0.6; } }
  else p.vy += PHYS.gravity * dt;
  const prevFeet = p.y + PHYS.halfH;
  p.y += p.vy * dt;
  p.x = wrapX(p.x + p.vx * dt);
  p.landT = Math.max(0, p.landT - dt);
  p.hopT = Math.max(0, p.hopT - dt);
  p.inv = Math.max(0, p.inv - dt);
  if (p.vy > 0 && !p.dead && p.kite <= 0) {
    const feet = p.y + PHYS.halfH;
    for (const pl of s.plats) {
      if (pl.state === 'snap' || pl.state === 'flip') continue;
      if (prevFeet <= pl.y + PHYS.feetSlack && feet >= pl.y && Math.abs(dxWrap(p.x, pl.x)) <= pl.w / 2 + 10) { p.y = pl.y - PHYS.halfH; landOn(s, pl); break; }
    }
  }
}

function updatePlatforms(s, dt) {
  s.plats.forEach(pl => {
    pl.t += dt;
    pl.press = Math.max(0, pl.press - dt);
    if (pl.kind === 'moving' && pl.state === 'ok') {
      pl.x += pl.vx * dt;
      if (pl.x < pl.w / 2 || pl.x > W - pl.w / 2) { pl.vx = -pl.vx; pl.x = clamp(pl.x, pl.w / 2, W - pl.w / 2); }
    }
    if (pl.type === 'ac' && Math.random() < dt * 0.9) s.parts.push({ kind: 'drop', x: pl.x + 14, y: pl.y + 14, vx: 0, vy: 40, r: 2.4, t: 0, life: 0.9 });
  });
  s.plats = s.plats.filter(pl => !((pl.state === 'snap' && pl.t > 0.7) || (pl.state === 'flip' && pl.t > 0.35)) && pl.y < s.cam + H + 120);
}

function updateEnemies(s, dt) {
  const p = s.p, E = ENEMIES, m = s.meters;
  if (!s.demo && !p.dead) {
    s.crowT -= dt; s.slipT -= dt;
    if (m >= E.crow.from && s.crowT <= 0) {
      s.crowT = rand(...E.crow.every) * clamp(1.4 - m / 1500, 0.6, 1.4);
      const dir = Math.random() < 0.5 ? 1 : -1;
      s.enemies.push({ type: 'crow', st: 'warn', t: 0, dir, x: dir > 0 ? -30 : W + 30, sy: clamp(p.y - s.cam - 120, 90, 320), y: 0, r: E.crow.r, ph: 0 });
      Sound.play('warn');
    }
    if (m >= E.slipper.from && s.slipT <= 0) {
      s.slipT = rand(...E.slipper.every) * clamp(1.4 - m / 1500, 0.6, 1.4);
      s.enemies.push({ type: 'slipper', st: 'warn', t: 0, x: p.x, y: s.cam - 40, r: E.slipper.r, rot: 0 });
      Sound.play('warn');
    }
  }
  s.enemies.forEach(e => {
    e.t += dt;
    if (e.type === 'pigeon') updatePigeon(s, e, dt);
    else if (e.type === 'bag') { e.x += e.vx * dt; if (e.x > W + 30) e.x = -30; if (e.x < -30) e.x = W + 30; e.y = e.y0 + Math.sin(s.t * 1.6 + e.ph) * 16; }
    else if (e.type === 'crow') {
      if (e.st === 'warn') { e.y = s.cam + e.sy; if (e.t >= E.crow.warn) { e.st = 'fly'; e.t = 0; } }
      else { e.x += e.dir * E.crow.speed * dt; e.y += Math.sin(e.t * 9) * 40 * dt; if (e.x < -60 || e.x > W + 60) e.dead = true; }
    } else if (e.type === 'slipper') {
      if (e.st === 'warn') { e.y = s.cam - 40; if (e.t < E.slipper.warn - 0.35) e.x = lerp(e.x, p.x, 0.12); if (e.t >= E.slipper.warn) { e.st = 'fall'; e.t = 0; } }
      else { e.y += E.slipper.fall * dt; e.rot += dt * 9; if (e.y > s.cam + H + 50) e.dead = true; }
    }
    collideEnemy(s, e);
  });
  s.enemies = s.enemies.filter(e => !e.dead && e.y < s.cam + H + 150 && e.y > s.cam - 900);
}

function updatePigeon(s, e, dt) {
  const p = s.p, cfg = ENEMIES.pigeon;
  if (e.st === 'idle') {
    e.y = e.y0 + Math.sin(s.t * 3 + e.ph) * 6;
    const sy = e.y - s.cam;
    if (!p.dead && !perkSpares(s, e) && sy > 10 && sy < H - 140 && p.y > e.y && Math.hypot(dxWrap(p.x, e.x), p.y - e.y) < cfg.range) { e.st = 'aim'; e.t = 0; Sound.play('warn'); }
  } else if (e.st === 'aim') {
    if (e.t < cfg.aim - cfg.lock) { e.tx = e.x + dxWrap(p.x, e.x); e.ty = p.y; }
    if (e.t >= cfg.aim) {
      const dx = e.tx - e.x, dy = e.ty - e.y, len = Math.hypot(dx, dy) || 1;
      e.vx = (dx / len) * cfg.dive; e.vy = (dy / len) * cfg.dive; e.st = 'dive'; e.t = 0;
    }
  } else if (e.st === 'dive') {
    e.x += e.vx * dt; e.y += e.vy * dt;
    if (e.t > cfg.diveTime) { e.st = 'leave'; e.vx = (e.vx > 0 ? 1 : -1) * 90; e.vy = -190; }
  } else { e.x += e.vx * dt; e.y += e.vy * dt; }
}

function collideEnemy(s, e) {
  const p = s.p;
  if (e.dead || p.dead) return;
  const dx = dxWrap(p.x, e.x), dy = p.y - e.y;
  if (Math.hypot(dx, dy) > PHYS.radius + e.r) return;
  const stompable = e.type !== 'slipper';
  if (stompable && p.vy > 120 && p.y < e.y - 2 && p.kite <= 0) { killEnemy(s, e, true); launch(s, PHYS.stomp, 'stomp'); return; }
  if (perkSpares(s, e)) return;
  playerHit(s, e);
}

function updatePickups(s) {
  const p = s.p;
  s.coins.forEach(c => {
    const dx = dxWrap(p.x, c.x), dy = p.y - c.y, d = Math.hypot(dx, dy);
    if (!c.got && s.magR > 0 && d < s.magR && d > 1 && !p.dead) { const pull = Math.min(d, (200 + 320 * (1 - d / (s.magR + 30))) * (s.dt || 0.016)); c.x = wrapX(c.x + (dx / d) * pull); c.y += (dy / d) * pull; }
    if (!c.got && d < 26) {
      c.got = true; s.coinsGot += s.coinMult; s.stats.coins += 1; Sound.play('coin');
      puff(s, c.x, c.y, 4, 14, 'spark');
    }
  });
  s.coins = s.coins.filter(c => !c.got && c.y < s.cam + H + 60);
  s.pows.forEach(w => {
    if (w.got || Math.hypot(dxWrap(p.x, w.x), p.y - w.y) > 30) return;
    w.got = true; Sound.play('power');
    if (w.type === 'kite') p.kite = s.kiteTime;
    if (w.type === 'ful') p.shoes = PHYS.shoesBounces;
    if (w.type === 'bead') p.shield = true;
    s.stats[w.type === 'kite' ? 'kites' : w.type === 'bead' ? 'beads' : 'ful'] += 1;
    pop(s, t(w.type), p.x, p.y - 50, K.gold);
    puff(s, w.x, w.y, 6, 24, 'spark');
  });
  s.pows = s.pows.filter(w => !w.got && w.y < s.cam + H + 60);
}

function updateFx(s, dt) {
  s.parts.forEach(q => { q.t += dt; q.x += q.vx * dt; q.y += q.vy * dt; if (q.kind === 'drop') q.vy += 600 * dt; });
  s.parts = s.parts.filter(q => q.t < q.life);
  s.pops.forEach(q => { q.t += dt; });
  s.pops = s.pops.filter(q => q.t < 1.3);
}

/** Advance the run by dt seconds. Returns nothing; read s.over / s.ended afterwards. */
function updateRun(s, dt) {
  s.t += dt;
  s.dt = dt;
  updatePlayer(s, dt);
  perkGlide(s);
  twistMove(s, dt);
  updatePlatforms(s, dt);
  if (!s.demo) {
    updateEnemies(s, dt);
    updatePickups(s);
    const p = s.p;
    s.maxUp = Math.max(s.maxUp, -(p.y + PHYS.halfH));
    s.meters = Math.max(s.meters, Math.floor(s.maxUp / METER));
    if (p.y < s.cam + PHYS.camLine) s.cam = p.y - PHYS.camLine;
    genUntil(s, s.cam - 700);
    if (s.daily && !s.targetHit && s.meters >= s.target) { s.targetHit = true; if (typeof showPop === 'function') showPop(t('targetHit')); Sound.play('mile'); }
    const ms = MILESTONES[s.milestone];
    if (ms && s.meters >= ms.m) { s.milestone++; if (typeof showPop === 'function') showPop(pick(ms)); Sound.play('mile'); }
    if (!s.over && p.y - s.cam > H + 60) { s.over = true; s.overT = 0; Sound.play('over'); }
    if (p.dead && !s.over && p.y - s.cam > H + 80) { s.over = true; s.overT = 0; Sound.play('over'); }
    if (s.over) { s.overT += dt; if (s.overT > 0.5) s.ended = true; }
  }
  updateFx(s, dt);
}
