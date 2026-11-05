/* The Tower: seeded generation and the jump maths. Pure (no DOM, no Math.random), shared by the game, the aim preview, the bot and the tests.
   Every main-path ledge is checked with the same stepping the game uses, so each floor is guaranteed reachable with room to spare. */

const towerRng = seed => {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const towerSolid = pl => pl.state === 'ok' || pl.state === 'wobble';
const towerFloorOf = y => Math.floor(-y / TOWER.floorH + 1e-6);
const towerBounds = () => [TOWER.wall + TOWER.radius, W - TOWER.wall - TOWER.radius];

/** Launch velocity for a charge (0..1) and an aim (-1 = full left, 1 = full right). */
function towerLaunch(power, aim) {
  const T = TOWER, v = T.vmin + (T.vmax - T.vmin) * Math.max(0, Math.min(1, power)), a = Math.max(-1, Math.min(1, aim)) * T.maxAngle;
  return { vx: v * Math.sin(a), vy: -v * Math.cos(a) };
}

/** Advance a body { x, y (feet), vx, vy } by dt. Bounces off the walls. Returns the platform it lands on, or null. */
function towerStep(b, dt, plats) {
  const T = TOWER, [lo, hi] = towerBounds(), prevY = b.y;
  b.vy += T.gravity * dt;
  b.x += b.vx * dt;
  b.y += b.vy * dt;
  b.hitWall = false;
  if (b.x < lo) { b.x = lo; b.vx = Math.abs(b.vx) * T.wallBounce; b.hitWall = true; }
  else if (b.x > hi) { b.x = hi; b.vx = -Math.abs(b.vx) * T.wallBounce; b.hitWall = true; }
  if (b.vy <= 0) return null;
  for (const pl of plats) {
    if (!towerSolid(pl) || prevY > pl.y || b.y < pl.y || Math.abs(b.x - pl.x) > pl.w / 2 + T.edge) continue;
    b.y = pl.y;
    return pl;
  }
  return null;
}

/** Fly a jump to its end. o.points = collect dots for the aim arc; o.maxT seconds; o.stopBelowY = give up once falling past that y. */
function towerSim(x, y, vx, vy, plats, o = {}) {
  const b = { x, y, vx, vy }, dt = 1 / 90, maxT = o.maxT || 4, pts = o.points ? [] : null;
  let t = 0, n = 0;
  while (t < maxT) {
    const pl = towerStep(b, dt, plats);
    t += dt; n++;
    if (pts && n % 6 === 0) pts.push({ x: b.x, y: b.y, t });
    if (pl) return { pl, x: b.x, y: b.y, t, pts };
    if (o.stopBelowY != null && b.vy > 0 && b.y > o.stopBelowY) break;
  }
  return { pl: null, x: b.x, y: b.y, t, pts };
}

/** Every (power, aim) that lands on `target` from a standing start at (x0, y0), best margin first. o.others = other ledges that may catch the jump on the way down; o.maxPower = ignore bigger charges. */
function towerSolve(x0, y0, target, o = {}) {
  const out = [], dp = o.dp || 0.025, da = o.da || 0.05, minMargin = o.minMargin == null ? 3 : o.minMargin;
  for (let i = 0; 0.1 + i * dp <= 1.0001; i++) {
    const power = 0.1 + i * dp;
    if (o.maxPower && power > o.maxPower + 1e-9) break;
    for (let j = 0; -1 + j * da <= 1.0001; j++) {
      const aim = Math.abs(-1 + j * da) < 1e-9 ? 0 : -1 + j * da, v = towerLaunch(power, aim);
      const r = towerSim(x0, y0, v.vx, v.vy, o.others ? [target, ...o.others] : [target], { stopBelowY: target.y + 4 });
      if (r.pl !== target) continue;
      const margin = target.w / 2 - Math.abs(r.x - target.x);
      if (margin >= minMargin) out.push({ power, aim, margin });
    }
  }
  return out.sort((a, b) => b.margin - a.margin);
}

function towerMix(n) {
  let stop = TOWER.mix[0];
  TOWER.mix.forEach(s => { if (s.f <= n) stop = s; });
  return stop.w;
}
function towerPickType(rnd, n) {
  const entries = Object.entries(towerMix(n));
  let r = rnd() * entries.reduce((s, [, w]) => s + w, 0);
  for (const [type, w] of entries) { r -= w; if (r <= 0) return type; }
  return entries[0][0];
}

function towerPlat(type, x, y, floor, extra = {}) {
  const def = PLATFORMS[type] || {};
  return { type, x, y, w: type === 'ground' ? W - TOWER.wall * 2 : def.w * TOWER.widthScale, kind: type === 'ground' ? 'ground' : def.kind, slick: type === 'ac', floor, state: 'ok', t: 0, press: 0, ...extra };
}

/** Build the whole tower. Deterministic for a seed. Returns { plats, mains (index = floor), coins }. */
function buildTower(seed = TOWER.seed) {
  const T = TOWER, rnd = towerRng(seed), [lo, hi] = towerBounds(), plats = [], mains = [], coins = [];
  const pad = w => [lo - 4 + w / 2, hi + 4 - w / 2];
  for (let n = 0; n <= T.top; n++) {
    const y = -n * T.floorH, prev = mains[n - 1];
    if (n % T.checkEvery === 0) {
      const g = towerPlat('ground', W / 2, y, n, { check: n });
      mains.push(g); plats.push(g);
      continue;
    }
    const type = towerPickType(rnd, n), probe = towerPlat(type, 0, y, n), [a, b] = pad(probe.w);
    const reach = T.maxDx * (0.45 + 0.55 * Math.min(1, n / 60));
    let placed = null;
    for (let attempt = 0; attempt < 24 && !placed; attempt++) {
      const x = Math.max(a, Math.min(b, prev.x + (rnd() * 2 - 1) * reach * (attempt > 14 ? 0.5 : 1)));
      const cand = { ...probe, x };
      const starts = prev.type === 'ground' ? [{ x, need: 5 }] : [{ x: prev.x, need: 5 }, { x: prev.x - prev.w / 3, need: 1 }, { x: prev.x + prev.w / 3, need: 1 }];
      const maxPower = prev.kind === 'breakable' ? T.snapPower : 0;
      const ok = starts.every(s => towerSolve(Math.max(lo, Math.min(hi, s.x)), prev.y, cand, { dp: 0.04, da: 0.08, maxPower }).length >= s.need);
      if (ok) placed = cand;
    }
    if (!placed) placed = { ...probe, x: Math.max(a, Math.min(b, prev.x)) };
    mains.push(placed); plats.push(placed);
    if (rnd() < T.coinChance) coins.push({ x: placed.x, y: y - 36, got: false, ph: rnd() * 6 });
  }
  for (let n = 1; n < T.top; n++) {
    if (n % T.checkEvery === 0) continue;
    const count = rnd() < T.secondCatch ? 2 : 1;
    for (let k = 0; k < count; k++) {
      const type = towerPickType(rnd, n), probe = towerPlat(type, 0, 0, 0), [a, b] = pad(probe.w);
      let x = a + rnd() * (b - a), tries = 0;
      while (Math.abs(x - mains[n].x) < 90 && tries++ < 8) x = a + rnd() * (b - a);
      const y = -(n - 0.5 - k * 0.25) * T.floorH, pl = towerPlat(type === 'minaret' || type === 'cloud' ? 'tank' : type, x, y, towerFloorOf(y), { side: true });
      if (!towerKeepsPathOpen(mains, plats, pl)) continue;
      plats.push(pl);
      if (rnd() < T.catchCoin) coins.push({ x, y: y - 36, got: false, ph: rnd() * 6 });
    }
  }
  return { plats, mains, coins };
}

/** A catch ledge may only stay if every main jump it could intercept still has solutions. */
function towerKeepsPathOpen(mains, plats, pl) {
  const [lo, hi] = towerBounds(), T = TOWER, n = Math.round(-pl.y / T.floorH);
  for (let m = Math.max(1, n - 2); m <= Math.min(T.top, n + 3); m++) {
    const prev = mains[m - 1], cur = mains[m];
    const others = plats.concat(pl).filter(q => q !== cur && q.y > cur.y - T.floorH * 4 && q.y < prev.y + T.floorH);
    const x0 = prev.type === 'ground' ? cur.x : prev.x;
    if (towerSolve(Math.max(lo, Math.min(hi, x0)), prev.y, cur, { dp: 0.04, da: 0.08, others, maxPower: prev.kind === 'breakable' ? T.snapPower : 0 }).length < 3) return false;
  }
  return true;
}

let towerCache = null;
const getTower = () => towerCache || (towerCache = buildTower());

if (typeof module !== 'undefined' && module.exports) module.exports = { towerRng, towerLaunch, towerStep, towerSim, towerSolve, towerFloorOf, buildTower, getTower, towerMix, towerBounds };
