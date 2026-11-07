/* Rooftop events, free mode: about every EVENTS.every metres one event from the pool (see EVENTS in data.js), announced with a banner.
   s.ev = { id, t, phase, ... } while one runs. flock: a red band at your height, then a pigeon flock sweeps across it. icecream: the cart's bell rings
   from the street, then cones drift up for a few seconds and are worth coins. powercut: dark, platforms glow. wedding: firework rockets on ledges
   launch you. gust: arrows on one side, then a sideways push. Nothing here changes the game speed. */

function eventsInit(s, startM) {
  s.ev = null; s.evLast = '';
  s.nextEvM = startM > 0 ? (Math.floor(startM / EVENTS.every) + 1) * EVENTS.every : EVENTS.first + rr(s, 0, EVENTS.jitter);
}

function eventAllowed(s, id) {
  if (id === s.evLast) return false;
  if (id === 'gust' && s.twist && s.twist.wind) return false;
  if (id === 'powercut' && s.twist && s.twist.night) return false;
  return true;
}

function startEvent(s, id) {
  const E = EVENTS[id], p = s.p;
  s.ev = { id, t: 0, phase: 'warn', k: 0, dir: s.rnd() < 0.5 ? -1 : 1, sy: clamp(p.y - s.cam, 150, H - 150), birds: false, fired: 0 };
  bannerPush(s, { ar: E.ar, en: E.en }, 'event');
  Sound.play(id === 'flock' || id === 'gust' ? 'warn' : 'mile');
}

function endEvent(s) {
  const id = s.ev.id;
  if (id === 'wedding') s.plats.forEach(pl => { pl.rocket = null; });
  if (id === 'icecream') s.coins = s.coins.filter(c => !c.cone || c.got);
  s.evLast = id;
  s.ev = null;
  s.nextEvM = Math.max(s.meters + EVENTS.every + rr(s, -EVENTS.jitter, EVENTS.jitter), s.meters + EVENTS.gap);
}

/** Ice-cream cart: after the bell, E.cones cones appear around the hero one after another and drift up; each is worth E.coins coins. */
function updateIceCream(s, ev, dt) {
  const E = EVENTS.icecream, p = s.p;
  if (ev.phase === 'warn') {
    if (ev.t >= E.warn) { ev.phase = 'sweet'; ev.t = 0; ev.spawned = 0; }
    return;
  }
  while (ev.spawned < E.cones && ev.t >= (ev.spawned / E.cones) * (E.time - 1.2)) {
    s.coins.push({ x: wrapX(p.x + rr(s, -E.spread, E.spread)), y: p.y - rr(s, 30, 190), got: false, ph: ev.spawned * 0.37, cone: true, vy: -E.drift });
    ev.spawned++;
  }
  s.coins.forEach(c => { if (c.cone && !c.got) c.y += c.vy * dt; });
  if (ev.t >= E.time) endEvent(s);
}

function updateFlock(s, ev, dt) {
  const E = EVENTS.flock, p = s.p;
  if (ev.phase === 'warn') {
    if (ev.t < E.warn * 0.6) ev.sy = clamp(p.y - s.cam, 150, H - 150);
    if (ev.t >= E.warn) {
      ev.phase = 'sweep'; ev.t = 0;
      for (let i = 0; i < E.birds; i++) {
        const sy = ev.sy + rr(s, -E.band * 0.32, E.band * 0.32);
        s.enemies.push({ type: 'pigeon', st: 'flock', t: 0, x: ev.dir > 0 ? -30 - i * 44 : W + 30 + i * 44, sy, y: s.cam + sy, y0: s.cam + sy, vx: ev.dir * E.speed, vy: 0, r: E.r, ph: i * 0.7, flock: true });
      }
    }
    return;
  }
  if (ev.t > 0.6 && !s.enemies.some(e => e.flock && !e.dead)) endEvent(s);
}

function updateWedding(s, ev, dt) {
  const E = EVENTS.wedding, p = s.p;
  if (ev.t < E.time - 1.5) {
    const have = s.plats.filter(pl => pl.rocket).length;
    if (have < E.rockets) {
      const pl = s.plats.find(q => !q.rocket && q.kind === 'normal' && q.type !== 'cloud' && q.y < p.y - 50 && q.y - s.cam > 40 && q.y - s.cam < H * 0.55 && q.w >= 56);
      if (pl) pl.rocket = { fired: 0 };
    }
  }
  s.plats.forEach(pl => { if (pl.rocket && pl.rocket.fired > 0) pl.rocket.fired = Math.max(0, pl.rocket.fired - dt); });
  if (ev.t >= E.time) endEvent(s);
}

function updateEvents(s, dt) {
  if (s.demo || s.tower || !s.nextEvM) return;
  const p = s.p;
  if (!s.ev) {
    if (!p.dead && s.meters >= s.nextEvM) {
      const ok = EVENTS.pool.filter(id => eventAllowed(s, id));
      startEvent(s, ok[Math.floor(s.rnd() * ok.length)]);
    }
    return;
  }
  const ev = s.ev, E = EVENTS[ev.id];
  ev.t += dt;
  if (ev.id === 'flock') updateFlock(s, ev, dt);
  else if (ev.id === 'icecream') updateIceCream(s, ev, dt);
  else if (ev.id === 'powercut') {
    ev.k = clamp(Math.min(ev.t / E.fade, (E.time - ev.t) / E.fade), 0, 1);
    if (ev.t >= E.time) endEvent(s);
  } else if (ev.id === 'wedding') updateWedding(s, ev, dt);
  else if (ev.id === 'gust') {
    if (ev.t >= E.warn) {
      const k = (ev.t - E.warn) / E.time;
      if (k >= 1) { endEvent(s); return; }
      if (!p.dead) p.x = wrapX(p.x + ev.dir * E.push * Math.sin(Math.PI * k) * dt);
    }
  }
  if (s.ev && s.ev.id === 'flock') s.enemies.forEach(e => {
    if (!e.flock) return;
    e.y = s.cam + e.sy;
    if (e.x < -200 || e.x > W + 200) e.dead = true;
  });
}

/** Called from landOn: a firework rocket under the hero's feet turns the bounce into a big launch. */
function eventBounce(s, pl, power) {
  if (!pl.rocket || Math.abs(dxWrap(s.p.x, pl.x)) > EVENTS.wedding.r) return power;
  pl.rocket.fired = 0.7;
  for (let i = 0; i < 12; i++) s.parts.push({ kind: 'spark', x: pl.x + rand(-10, 10), y: pl.y - 20, vx: rand(-120, 120), vy: rand(-260, -60), r: rand(3, 6), t: 0, life: rand(0.5, 0.9) });
  bannerPush(s, { ar: 'يلا يا صاروخ!', en: 'Blast off!' }, 'minor');
  return Math.max(power, EVENTS.wedding.power);
}

/* ---------- drawing ---------- */
function renderLitWindows(s, k) {
  const ctx = Eng.ctx, off = (-s.cam * 0.3) % 120;
  ctx.save();
  for (let i = 0; i < 18; i++) {
    const x = (i * 71 + 20) % (W - 30) + 10, y = ((i * 97 + off + 600) % 760) - 60, lit = (i * 7) % 3 !== 0;
    if (!lit) continue;
    ctx.globalAlpha = 0.5 * k;
    ctx.fillStyle = '#ffd98a';
    ctx.beginPath(); ctx.roundRect(x, y, 12, 16, 3); ctx.fill();
    ctx.globalAlpha = 0.35 * k; ctx.fillStyle = K.orange; ctx.fillRect(x + 5, y + 2, 2, 12);
  }
  ctx.restore();
}

function renderWeddingBursts(k) {
  const ctx = Eng.ctx, cols = [K.gold, K.coral, K.tealLight, K.lilac];
  ctx.save();
  for (let i = 0; i < 4; i++) {
    const ph = (Eng.clock * 0.7 + i * 0.29) % 1, cx = 50 + ((i * 97) % 260), cy = 90 + ((i * 53) % 170);
    ctx.globalAlpha = (1 - ph) * 0.9 * k; ctx.fillStyle = cols[i]; ctx.strokeStyle = cols[i]; ctx.lineWidth = 3; ctx.lineCap = 'round';
    for (let a = 0; a < 12; a++) {
      const ang = (a / 12) * Math.PI * 2, r0 = 8 + 56 * ph, r1 = r0 + 10 * (1 - ph);
      ctx.beginPath(); ctx.moveTo(cx + Math.cos(ang) * r0, cy + Math.sin(ang) * r0 + ph * 18); ctx.lineTo(cx + Math.cos(ang) * r1, cy + Math.sin(ang) * r1 + ph * 18); ctx.stroke();
    }
  }
  ctx.restore();
}

/** After the sky, before the platforms. */
function renderEventBack(s) {
  const ev = s.ev;
  if (!ev) return;
  const ctx = Eng.ctx;
  if (ev.id === 'powercut') {
    ctx.save();
    ctx.fillStyle = `rgba(12,8,34,${EVENTS.powercut.dark * ev.k})`; ctx.fillRect(0, 0, W, H);
    ctx.restore();
    renderLitWindows(s, ev.k);
    ctx.save();
    s.plats.forEach(pl => {
      const sy = pl.y - s.cam;
      if (sy < -60 || sy > H + 60) return;
      const g = ctx.createRadialGradient(pl.x, sy, 4, pl.x, sy, pl.w * 0.9);
      g.addColorStop(0, `rgba(255,226,140,${0.7 * ev.k})`); g.addColorStop(1, 'rgba(255,226,140,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(pl.x, sy, pl.w * 0.9, 34, 0, 0, Math.PI * 2); ctx.fill();
    });
    ctx.restore();
  } else if (ev.id === 'wedding') renderWeddingBursts(clamp(Math.min(ev.t / 0.4, (EVENTS.wedding.time - ev.t) / 0.8), 0, 1));
}

/** The ice-cream cart rolls in along the bottom edge, rings its bell (two frames) and rolls out again. A little drawing, never a hazard. */
function renderIceCreamCart(ev) {
  const E = EVENTS.icecream, total = ev.phase === 'warn' ? ev.t : E.warn + ev.t, inK = clamp(total / 0.6, 0, 1), outK = clamp((E.warn + E.time - total) / 0.6, 0, 1);
  const side = ev.dir > 0 ? -1 : 1, rest = side < 0 ? 52 : W - 52, x = rest + side * 130 * (1 - Math.min(inK, outK)), y = H - 30;
  drawSpr('event:cart:' + (Math.floor(Eng.clock * 8) % 2), x, y, { w: 76, h: 66, ay: 1, sx: side < 0 ? 1 : -1, alpha: Math.min(inK, outK) * 0.95, sy: beatBounce(0, 0.03) });
}

/** After pickups: the flock band, gust arrows and the rockets. */
function renderEventMid(s) {
  const ev = s.ev, ctx = Eng.ctx, pulse = 0.5 + 0.5 * Math.sin(Eng.clock * 18);
  s.plats.forEach(pl => {
    if (!pl.rocket) return;
    const sy = pl.y - s.cam;
    if (sy < -60 || sy > H + 60) return;
    drawSpr(`event:rocket:${pl.rocket.fired > 0 ? 1 : 0}`, pl.x, sy + 1, { w: 34, h: 54, ay: 1, sy: pl.rocket.fired > 0 ? 1 : beatBounce(pl.x * 0.01, 0.04) });
  });
  if (!ev) return;
  if (ev.id === 'icecream') renderIceCreamCart(ev);
  else if (ev.id === 'flock') {
    const E = EVENTS.flock, locked = ev.phase === 'warn' && ev.t >= E.warn * 0.6, live = ev.phase === 'sweep';
    if (ev.phase === 'warn' || (live && ev.t < 1.2)) {
      ctx.save();
      ctx.fillStyle = K.red; ctx.globalAlpha = live ? 0.1 : locked ? 0.22 : 0.1 + pulse * 0.08;
      ctx.fillRect(0, ev.sy - E.band / 2, W, E.band);
      ctx.globalAlpha = 0.9; ctx.strokeStyle = K.red; ctx.lineWidth = locked || live ? 3.5 : 2.2; ctx.setLineDash(locked || live ? [] : [12, 8]);
      ctx.beginPath(); ctx.moveTo(0, ev.sy - E.band / 2); ctx.lineTo(W, ev.sy - E.band / 2); ctx.moveTo(0, ev.sy + E.band / 2); ctx.lineTo(W, ev.sy + E.band / 2); ctx.stroke();
      ctx.restore();
      const ex = ev.dir > 0 ? 24 : W - 24;
      drawText('!', ex, ev.sy, 38, K.red, { alpha: 0.6 + pulse * 0.4 });
      ctx.save(); ctx.fillStyle = K.red; ctx.globalAlpha = 0.6 + pulse * 0.4; ctx.beginPath();
      ctx.moveTo(ex + ev.dir * 26, ev.sy); ctx.lineTo(ex + ev.dir * 12, ev.sy - 11); ctx.lineTo(ex + ev.dir * 12, ev.sy + 11); ctx.fill(); ctx.restore();
    }
  } else if (ev.id === 'gust' && ev.t < EVENTS.gust.warn + 0.4) {
    const x = ev.dir > 0 ? 22 : W - 22;
    for (let i = 0; i < 3; i++) {
      const y = H * 0.3 + i * 90, a = 0.4 + pulse * 0.5;
      ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = K.white; ctx.strokeStyle = K.ink; ctx.lineWidth = 3; ctx.lineJoin = 'round';
      ctx.beginPath(); ctx.moveTo(x - ev.dir * 12, y - 16); ctx.lineTo(x + ev.dir * 14, y); ctx.lineTo(x - ev.dir * 12, y + 16); ctx.lineTo(x - ev.dir * 6, y); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
    }
    drawText('!', ev.dir > 0 ? 54 : W - 54, H * 0.3 + 90, 38, K.red);
  }
}

/** Over the hero: wind streaks and a lantern glow in the dark. */
function renderEventFront(s) {
  const ev = s.ev;
  if (!ev) return;
  const ctx = Eng.ctx;
  if (ev.id === 'gust' && ev.t >= EVENTS.gust.warn) {
    const k = Math.sin(Math.PI * clamp((ev.t - EVENTS.gust.warn) / EVENTS.gust.time, 0, 1));
    ctx.save(); ctx.strokeStyle = K.white; ctx.lineWidth = 2.6; ctx.lineCap = 'round'; ctx.globalAlpha = 0.15 + 0.5 * k;
    for (let i = 0; i < 10; i++) {
      const y = (i * 67 + Eng.clock * 30) % H, x = ((i * 109 + Eng.clock * 340 * ev.dir) % (W + 140) + (W + 140)) % (W + 140) - 70, len = 30 + (i % 3) * 16;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + len * ev.dir, y + 2); ctx.stroke();
    }
    ctx.restore();
  } else if (ev.id === 'powercut') {
    const p = s.p, sy = p.y - s.cam - 20;
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const g = ctx.createRadialGradient(p.x, sy, 6, p.x, sy, 120);
    g.addColorStop(0, `rgba(255,214,120,${0.55 * ev.k})`); g.addColorStop(1, 'rgba(255,214,120,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x, sy, 120, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
}

