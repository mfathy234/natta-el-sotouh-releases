/* El Bawab (البواب), the Tower boss. When you reach the flag-ground BAWAB.floors under the roof he starts climbing from below like rising water, but fair:
   he is slower when you are close, a red wash and edge marker show where he is, and every throw (a key or a slipper) has a red line and "!" first.
   A hit knocks you off your ledge. If he catches up with your feet you go back to the flag-ground and he drops back. Reaching the roof beats him.
   State: s.bawab = { x, y, st: 'climb' | 'warn' | 'beat', t, throwT, tx, ty, home }, s.keys = flying throws. Tuning: BAWAB in data.js. */

const bawabStartFloor = s => s.top - BAWAB.floors;

function bawabNew(s) { s.bawab = null; s.keys = []; }

function bawabPlace(s, home) {
  const b = s.bawab;
  b.y = home.y + BAWAB.start * TOWER.floorH;
  b.x = W / 2; b.st = 'climb'; b.t = 0; b.throwT = rr({ rnd: Math.random }, ...BAWAB.throw.every); b.home = home;
  s.keys = [];
}

function bawabStart(s) {
  const home = s.plats.find(pl => pl.type === 'ground' && pl.floor === bawabStartFloor(s));
  if (!home) return;
  s.bawab = { x: W / 2, y: 0, st: 'climb', t: 0, throwT: 0, tx: 0, ty: 0, home, sprite: 0 };
  bawabPlace(s, home);
  bannerPush(s, BAWAB.lines.start, 'boss');
  Sound.play('warn');
}

function bawabCaught(s) {
  const b = s.bawab, p = s.p, h = b.home;
  p.on = h; p.x = W / 2; p.y = h.y; p.vx = 0; p.vy = 0; p.landT = 0.34;
  s.floor = h.floor; s.fromFloor = h.floor; s.charging = false; s.charge = 0;
  bawabPlace(s, h);
  bannerPush(s, BAWAB.lines.caught, 'boss');
  puff(s, p.x, p.y - 4, 6, 40);
  Sound.play('hit');
}

function bawabThrow(s) {
  const b = s.bawab, T = BAWAB.throw, x0 = b.x, y0 = b.y - 30, dx = b.tx - x0, dy = b.ty - y0, len = Math.hypot(dx, dy) || 1;
  s.keys.push({ kind: s.jumps % 2 ? 'slipper' : 'key', x: x0, y: y0, vx: (dx / len) * T.speed, vy: (dy / len) * T.speed, rot: 0 });
  Sound.play('jump');
}

function bawabHit(s, k) {
  const p = s.p, T = BAWAB.throw;
  k.dead = true;
  s.fromFloor = p.on ? p.on.floor : s.fromFloor;
  p.on = null; p.vy = -T.hop; p.vx = (k.vx >= 0 ? 1 : -1) * T.push; p.inv = T.inv; p.hopT = 0;
  s.charging = false; s.charge = 0;
  puff(s, p.x, p.y - 20, 5, 30);
  Sound.play('hit');
  pop(s, t('ouch'), p.x, p.y - 60, K.red);
}

function updateBawab(s, dt) {
  if (!s.bawab) {
    if (!s.won && s.maxFloor >= bawabStartFloor(s) && s.floor >= bawabStartFloor(s)) bawabStart(s);
    return;
  }
  const b = s.bawab, p = s.p, B = BAWAB, T = TOWER, [lo, hi] = towerBounds();
  b.t += dt;
  p.inv = Math.max(0, (p.inv || 0) - dt);
  if (s.won) { b.st = 'beat'; return; }
  const lead = (b.y - p.y) / T.floorH, visible = b.y - s.cam < H + 20;
  const k = clamp(B.minK + ((lead - B.closeFloors) / (B.farFloors - B.closeFloors)) * (B.maxK - B.minK), B.minK, B.maxK);
  b.x = lerp(b.x, clamp(p.x, lo + 10, hi - 10), 1 - Math.exp(-0.7 * dt));
  if (b.st === 'climb') {
    b.y -= B.rise * k * dt;
    b.throwT -= dt;
    if (b.throwT <= 0 && visible && lead > 0.35 && lead < 1.9) { b.st = 'warn'; b.t = 0; b.tx = p.x; b.ty = p.y - 26; }
  } else if (b.st === 'warn') {
    if (b.t < B.throw.warn - 0.3) { b.tx = p.x; b.ty = p.y - 26; }
    if (b.t >= B.throw.warn) { bawabThrow(s); b.st = 'climb'; b.t = 0; b.throwT = rr({ rnd: Math.random }, ...B.throw.every); }
  }
  s.keys.forEach(q => {
    q.x += q.vx * dt; q.y += q.vy * dt; q.rot += dt * 11;
    if (q.y < s.cam - 120 || q.y > s.cam + H + 120 || q.x < -60 || q.x > W + 60) q.dead = true;
    if (!q.dead && !p.dead && p.inv <= 0 && Math.hypot(q.x - p.x, q.y - (p.y - 26)) < B.throw.r + T.radius) bawabHit(s, q);
  });
  s.keys = s.keys.filter(q => !q.dead);
  if (!p.dead && p.y >= b.y - B.size * 0.42) bawabCaught(s);
}

/* ---------- drawing ---------- */
function renderBawab(s) {
  const b = s.bawab;
  if (!b) return;
  const ctx = Eng.ctx, B = BAWAB, sy = b.y - s.cam, top = sy - B.size * 0.42, pulse = 0.5 + 0.5 * Math.sin(Eng.clock * 14);
  if (top < H) {
    ctx.save();
    const g = ctx.createLinearGradient(0, top, 0, H);
    g.addColorStop(0, 'rgba(214,58,47,.28)'); g.addColorStop(1, 'rgba(158,38,32,.55)');
    ctx.fillStyle = g; ctx.fillRect(TOWER.wall, Math.max(0, top), W - TOWER.wall * 2, H - Math.max(0, top));
    ctx.strokeStyle = K.red; ctx.lineWidth = 3; ctx.globalAlpha = 0.9; ctx.setLineDash([12, 8]); ctx.lineDashOffset = -Eng.clock * 30;
    ctx.beginPath(); ctx.moveTo(TOWER.wall, top); ctx.lineTo(W - TOWER.wall, top); ctx.stroke();
    ctx.restore();
    const pose = b.st === 'beat' ? 'bawab:beat' : b.st === 'warn' ? 'bawab:throw' : `bawab:${animFrame(0)}`;
    drawSpr(pose, b.x, sy, { w: B.size, h: B.size, sx: b.st === 'beat' ? 1 : beatBounce(0, 0.03), sy: b.st === 'beat' ? 1 : 1 / beatBounce(0, 0.03) });
    if (b.st === 'warn') {
      const locked = b.t >= B.throw.warn - 0.3, ty = b.ty - s.cam;
      ctx.save(); ctx.strokeStyle = K.red; ctx.lineWidth = locked ? 4 : 2.5; ctx.globalAlpha = locked ? 0.95 : 0.35 + pulse * 0.4; ctx.setLineDash(locked ? [] : [8, 7]);
      ctx.beginPath(); ctx.moveTo(b.x, sy - 30); ctx.lineTo(b.tx, ty); ctx.stroke(); ctx.restore();
      drawText('!', b.tx, ty - 40, 30, K.red);
    }
  } else {
    const k = clamp(1 - (top - H) / 260, 0.2, 1);
    ctx.save();
    const g = ctx.createLinearGradient(0, H - 46, 0, H);
    g.addColorStop(0, 'rgba(214,58,47,0)'); g.addColorStop(1, `rgba(214,58,47,${0.5 * k + pulse * 0.1})`);
    ctx.fillStyle = g; ctx.fillRect(TOWER.wall, H - 46, W - TOWER.wall * 2, 46);
    ctx.globalAlpha = 0.4 + 0.6 * k; ctx.fillStyle = K.red; ctx.strokeStyle = K.ink; ctx.lineWidth = 3; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(b.x, H - 34); ctx.lineTo(b.x + 14, H - 12); ctx.lineTo(b.x - 14, H - 12); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.restore();
  }
  s.keys.forEach(q => drawSpr(q.kind === 'key' ? 'enemy:key:0' : 'enemy:slipper:0', q.x, q.y - s.cam, { rot: q.rot }));
}

if (typeof module !== 'undefined' && module.exports) module.exports = { bawabStartFloor };
