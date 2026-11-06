/* Neighbours (الجيران), free mode. Two hazards, both telegraphed first:
   bucket: a window pops open at the top, a red column + shadow + "!" mark where the water will land, then a bucket of water pours down that column.
           It is not a hit: it knocks you down a little and washes coins in the column away.
   pull:   a hand reaches out of a window beside a laundry line; the line shakes with "!" and is then pulled in.
   State is s.nbr = { bucketT, pullT, list }. Tuning: NEIGHBOURS in data.js; which tier switches them on: TIERS[].nbr. */

function nbrNew(rnd = Math.random) {
  const r = { rnd };
  return { bucketT: rr(r, ...NEIGHBOURS.bucket.every) * 0.7, pullT: rr(r, ...NEIGHBOURS.pull.every) * 0.7, list: [] };
}

function spawnBucket(s) {
  const p = s.p;
  s.nbr.list.push({ type: 'bucket', st: 'warn', t: 0, x: clamp(p.x, 34, W - 34), front: 0, tail: 0, hit: false });
  Sound.play('warn');
}

/** The laundry line to pull: one on screen, preferring the one nearest below the hero's feet. */
function pullTarget(s) {
  const N = NEIGHBOURS.pull, feet = s.p.y + PHYS.halfH;
  let best = null, score = 1e9;
  s.plats.forEach(pl => {
    const sy = pl.y - s.cam;
    if (pl.type !== 'laundry' || pl.state !== 'ok' || pl.shake || sy < N.minY || sy > N.maxY) return;
    const sc = Math.abs(pl.y - (feet + 60)) + (pl.y < feet - 20 ? 200 : 0);
    if (sc < score) { score = sc; best = pl; }
  });
  return best;
}

function spawnPull(s) {
  const pl = pullTarget(s);
  if (!pl) return false;
  pl.shake = true;
  s.nbr.list.push({ type: 'pull', st: 'warn', t: 0, pl, side: pl.x < W / 2 ? -1 : 1, ax: 0 });
  Sound.play('warn');
  return true;
}

function updateBucket(s, n, dt) {
  const N = NEIGHBOURS.bucket, p = s.p;
  n.t += dt;
  if (n.st === 'warn') {
    if (n.t < N.warn - N.lock) n.x = lerp(n.x, clamp(p.x, 34, W - 34), 0.16);
    if (n.t >= N.warn) { n.st = 'pour'; n.t = 0; Sound.play('spring'); }
    return;
  }
  const y0 = s.cam + NEIGHBOURS.window.y + NEIGHBOURS.window.h / 2 + 22;
  n.front = N.speed * n.t;
  n.tail = Math.max(0, N.speed * (n.t - N.pour));
  const top = y0 + n.tail, bot = y0 + n.front;
  if (!n.hit && !p.dead && p.kite <= 0 && Math.abs(dxWrap(p.x, n.x)) < N.width / 2 + 10 && p.y + PHYS.halfH > top && p.y - PHYS.halfH < bot) {
    n.hit = true;
    p.vy = Math.max(p.vy * 0.25, N.knock * 0.6);
    p.soak = N.inv;
    Sound.play('hit');
    puff(s, p.x, p.y, 7, 36, 'drop');
    pop(s, t('wet'), p.x, p.y - 44, K.blueLight);
  }
  s.coins.forEach(c => {
    if (c.got || Math.abs(dxWrap(c.x, n.x)) > N.width / 2 + N.washR * 0.4 || c.y < top - 10 || c.y > bot + 10) return;
    c.got = true;
    puff(s, c.x, c.y, 5, 18, 'drop');
  });
  if (n.tail > H + 80) n.st = 'done';
}

function updatePull(s, n, dt) {
  const N = NEIGHBOURS.pull, pl = n.pl;
  n.t += dt;
  if (n.st === 'warn') {
    if (pl.state !== 'ok') { n.st = 'done'; pl.shake = false; return; }
    n.ax = clamp((n.t - (N.warn - 0.35)) / 0.35, 0, 1);
    if (n.t >= N.warn) { n.st = 'pull'; n.t = 0; pl.shake = false; pl.state = 'pulled'; pl.t = 0; Sound.play('snap'); }
    return;
  }
  if (n.st === 'pull') {
    pl.x += n.side * 380 * dt;
    n.ax = 1;
    if (n.t >= N.pull) n.st = 'done';
  }
}

function updateNeighbours(s, dt) {
  if (s.demo || s.tower || !s.nbr) return;
  const p = s.p;
  if (p.soak > 0) p.soak = Math.max(0, p.soak - dt);
  if (p.dead) return;
  const tier = tierAt(s.meters), nb = s.nbr, active = type => nb.list.some(n => n.type === type && n.st !== 'done');
  if (tier.nbr[0]) {
    nb.bucketT -= dt;
    if (nb.bucketT <= 0 && !active('bucket')) { spawnBucket(s); nb.bucketT = rr(s, ...NEIGHBOURS.bucket.every); }
  }
  if (tier.nbr[1]) {
    nb.pullT -= dt;
    if (nb.pullT <= 0 && !active('pull')) nb.pullT = spawnPull(s) ? rr(s, ...NEIGHBOURS.pull.every) : 3;
  }
  nb.list.forEach(n => (n.type === 'bucket' ? updateBucket(s, n, dt) : updatePull(s, n, dt)));
  nb.list = nb.list.filter(n => n.st !== 'done');
}

/* ---------- drawing ---------- */
function renderWindow(x, sy, side) {
  const w = NEIGHBOURS.window;
  drawSpr('nbr:window:0', x, sy, { w: w.w, h: w.h, sx: side < 0 ? -1 : 1 });
}

function renderBucketBack(s, n, ctx, pulse) {
  const N = NEIGHBOURS.bucket, win = NEIGHBOURS.window, wy = win.y + win.h / 2, pour = n.st === 'pour';
  const appear = clamp(n.t / 0.25, 0, 1), x = n.x;
  if (n.st === 'warn') {
    const rowY = s.p.y + PHYS.halfH - s.cam, locked = n.t >= N.warn - N.lock;
    ctx.save();
    ctx.fillStyle = K.red; ctx.globalAlpha = locked ? 0.2 : 0.09 + pulse * 0.08;
    ctx.fillRect(x - N.width / 2, wy, N.width, H);
    ctx.globalAlpha = 0.9; ctx.strokeStyle = K.red; ctx.lineWidth = locked ? 3 : 2; ctx.setLineDash(locked ? [] : [9, 7]);
    ctx.beginPath(); ctx.moveTo(x - N.width / 2, wy); ctx.lineTo(x - N.width / 2, H); ctx.moveTo(x + N.width / 2, wy); ctx.lineTo(x + N.width / 2, H); ctx.stroke();
    ctx.setLineDash([]); ctx.globalAlpha = 0.28; ctx.fillStyle = K.ink; ctx.beginPath(); ctx.ellipse(x, rowY, 24, 6, 0, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    drawText('!', x, wy + 60, 34, K.red);
  }
  const shake = n.st === 'warn' ? Math.sin(Eng.clock * 50) * 1.6 : 0;
  ctx.save(); ctx.globalAlpha = appear;
  renderWindow(x + shake, wy, 1);
  drawSpr(`nbr:bucket:${pour ? 1 : 0}`, x + shake + (pour ? 4 : 0), wy + 24, { w: 84, h: 70, ay: 0.3 });
  ctx.restore();
}

function renderPullBack(s, n, ctx, pulse) {
  const pl = n.pl, sy = pl.y - s.cam, wx = n.side < 0 ? 32 : W - 32, dir = -n.side;
  renderWindow(wx, sy - 8, n.side);
  const tx = pl.x - dir * (pl.w / 2 - 8), len = Math.max(60, Math.abs(tx - wx) * n.ax + 60 * (1 - n.ax));
  const ay = sy - 2 + (n.st === 'pull' ? 0 : Math.sin(Eng.clock * 8) * 1.5), endX = wx + dir * Math.max(8, len - 48);
  ctx.save(); ctx.lineCap = 'round';
  ctx.strokeStyle = K.ink; ctx.lineWidth = 22; ctx.beginPath(); ctx.moveTo(wx, ay); ctx.lineTo(endX, ay); ctx.stroke();
  ctx.strokeStyle = K.white; ctx.lineWidth = 14; ctx.beginPath(); ctx.moveTo(wx, ay); ctx.lineTo(endX, ay); ctx.stroke();
  ctx.strokeStyle = K.blue; ctx.globalAlpha = 0.5; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(wx, ay - 3); ctx.lineTo(endX, ay - 3); ctx.moveTo(wx, ay + 3); ctx.lineTo(endX, ay + 3); ctx.stroke();
  ctx.restore();
  drawSpr(`nbr:arm:${n.st === 'pull' ? 1 : 0}`, endX + dir * 24, ay, { w: 48, h: 32, sx: dir });
  if (n.st === 'warn') {
    drawText('!', pl.x, sy - 34, 30, K.red);
    ctx.save(); ctx.globalAlpha = 0.12 + pulse * 0.1; ctx.fillStyle = K.red;
    ctx.fillRect(Math.min(wx, pl.x), sy - 14, Math.abs(pl.x - wx), 28); ctx.restore();
  }
}

function renderNeighbourBack(s) {
  if (!s.nbr || !s.nbr.list.length) return;
  const ctx = Eng.ctx, pulse = 0.5 + 0.5 * Math.sin(Eng.clock * 18);
  s.nbr.list.forEach(n => (n.type === 'bucket' ? renderBucketBack(s, n, ctx, pulse) : renderPullBack(s, n, ctx, pulse)));
}

function renderNeighbourFront(s) {
  if (!s.nbr) return;
  const ctx = Eng.ctx;
  s.nbr.list.forEach(n => {
    if (n.type !== 'bucket' || n.st !== 'pour') return;
    const N = NEIGHBOURS.bucket, y0 = NEIGHBOURS.window.y + NEIGHBOURS.window.h / 2 + 22;
    const top = y0 + n.tail, bot = Math.min(H + 40, y0 + n.front), w = N.width;
    if (bot <= top) return;
    ctx.save();
    const g = ctx.createLinearGradient(0, top, 0, bot);
    g.addColorStop(0, 'rgba(127,178,229,.55)'); g.addColorStop(1, 'rgba(127,178,229,.95)');
    ctx.fillStyle = g; ctx.strokeStyle = K.ink; ctx.lineWidth = 3; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.roundRect(n.x - w / 2, top, w, bot - top, 16); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = K.white; ctx.globalAlpha = 0.75; ctx.lineWidth = 3; ctx.lineCap = 'round';
    for (let i = 0; i < 3; i++) {
      const lx = n.x - w / 4 + i * (w / 4), off = (Eng.clock * 400 + i * 90) % 140;
      const a = Math.max(top + 8, bot - 140 + off), b = Math.min(bot - 8, bot - 100 + off);
      if (b > a) { ctx.beginPath(); ctx.moveTo(lx, a); ctx.lineTo(lx, b); ctx.stroke(); }
    }
    ctx.restore();
    if (bot < H + 30) drawSpr(`nbr:splash:${animFrame(0)}`, n.x, bot + 4, { w: 74, h: 50 });
  });
  const p = s.p;
  if (p.soak > 0) {
    ctx.save(); ctx.globalAlpha = Math.min(0.5, p.soak);
    ctx.fillStyle = K.blueLight; ctx.beginPath(); ctx.ellipse(p.x, p.y - s.cam + 4, 22, 32, 0, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
}

if (typeof module !== 'undefined' && module.exports) module.exports = { nbrNew };
