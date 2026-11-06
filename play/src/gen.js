/* World generation: platforms, coins, power-ups and ground enemies placed as the camera climbs.
   Everything is tuned from data.js. World y grows upward as it gets more negative; the start ledge is at y = 0. */

const metersAt = y => Math.max(0, Math.floor(-y / METER));

/** Platform weights at a height: the tier's row (TIERS in data.js), so the mix changes in steps. */
const weightsAt = m => ({ ...tierAt(m).w });

/** Seeded random in [a, b): s.rnd is Math.random in a normal run and a date-seeded generator in the daily challenge. */
const rr = (s, a, b) => a + s.rnd() * (b - a);

function weightedPick(weights, rnd = Math.random) {
  const entries = Object.entries(weights).filter(([, w]) => w > 0);
  let r = rnd() * entries.reduce((s, [, w]) => s + w, 0);
  for (const [type, w] of entries) { r -= w; if (r <= 0) return type; }
  return entries.length ? entries[0][0] : 'balcony';
}

const gapRange = m => {
  const tier = tierAt(m), k = tier.gapK;
  return [lerp(GAP.min[0], GAP.min[1], k) * tier.gapMul, lerp(GAP.max[0], GAP.max[1], k) * tier.gapMul];
};

/** Apex of a normal bounce (px). */
const jumpHeight = (v = PHYS.bounce) => (v * v) / (2 * PHYS.gravity);

/** Sideways distance (px) the hero can cover between leaving a ledge and coming down to one `gap` px higher, at full sideways speed. */
function jumpReach(gap, v = PHYS.bounce) {
  const disc = v * v - 2 * PHYS.gravity * gap;
  if (disc < 0) return 0;
  const t = (v + Math.sqrt(disc)) / PHYS.gravity, vm = PHYS.maxVx;
  return Math.max(0, vm * t - (vm * vm) / (2 * PHYS.accel));
}

/** Largest centre-to-centre distance a ledge of width w may sit from the one below it, with the safety margin. */
const maxStepX = (gap, w) => jumpReach(gap) * REACH.margin + w / 2;

function makePlatform(type, x, y, rnd = Math.random, widthK = 1) {
  const def = PLATFORMS[type];
  const p = { type, x, y, w: def.w * widthK, kind: def.kind, state: 'ok', t: 0, vx: 0, press: 0 };
  if (def.kind === 'moving') p.vx = (def.speed[0] + rnd() * (def.speed[1] - def.speed[0])) * (rnd() < 0.5 ? -1 : 1);
  return p;
}

/** Choose a type, avoiding more than MAX_UNSAFE_RUN breakable or vanishing ledges in a row. */
function pickPlatformType(s, m) {
  let type = weightedPick(twistWeights(s, weightsAt(m)), s.rnd);
  const kind = PLATFORMS[type].kind;
  const unsafe = kind === 'breakable' || kind === 'vanishing';
  if (unsafe && s.unsafeRun >= MAX_UNSAFE_RUN) type = m >= 190 ? 'cloud' : m >= 70 ? 'tank' : 'balcony';
  s.unsafeRun = unsafe && PLATFORMS[type].kind === kind ? s.unsafeRun + 1 : 0;
  return type;
}

function genPickups(s, p, m, gap) {
  const odds = twistOdds(s), tier = tierAt(m), tw = s.twist;
  const coinChance = tw && tw.coinChance ? tw.coinChance : tier.coin;
  if (p.kind === 'normal' || p.kind === 'spring') {
    if (s.rnd() < coinChance) s.coins.push({ x: p.x, y: p.y - 34, got: false, ph: s.rnd() * 6 });
    else if (s.rnd() < COIN.lineChance) [-1, 0, 1].forEach(i => s.coins.push({ x: wrapX(p.x + i * 34), y: p.y - 56 - gap * 0.2, got: false, ph: i }));
    if (s.rnd() < POWERUPS.chance && s.lastPowY - p.y > POWERUPS.minSpacingPx) {
      const ok = ['kite', 'ful', 'bead'].filter(k => m >= POWERUPS[k].from);
      if (ok.length) {
        const type = weightedPick(Object.fromEntries(ok.map(k => [k, POWERUPS[k].weight])), s.rnd);
        s.pows.push({ type, x: p.x, y: p.y - 40, ph: s.rnd() * 6 });
        s.lastPowY = p.y;
      }
    }
  }
  const E = ENEMIES, pgChance = tw && tw.pigeonChance ? tw.pigeonChance : tier.pigeon, pgFrom = tw && tw.pigeonFrom != null ? tw.pigeonFrom : 0;
  if (s.lastEnemyY - p.y > (tw && tw.spacing ? tw.spacing : tier.spacing)) {
    if (m >= pgFrom && s.rnd() < pgChance) {
      s.enemies.push({ type: 'pigeon', x: wrapX(p.x + rr(s, -120, 120)), y: p.y - gap * 0.5 - 40, y0: p.y - gap * 0.5 - 40, st: 'idle', t: 0, ph: s.rnd() * 6, r: E.pigeon.r, vx: 0, vy: 0 });
      s.lastEnemyY = p.y;
    } else if (s.rnd() < tier.bag) {
      s.enemies.push({ type: 'bag', x: rr(s, 20, W - 20), y: p.y - gap * 0.5 - 30, y0: p.y - gap * 0.5 - 30, st: 'drift', t: 0, ph: s.rnd() * 6, r: E.bag.r, vx: rr(s, E.bag.speed[0], E.bag.speed[1]) * (s.rnd() < 0.5 ? -1 : 1), vy: 0 });
      s.lastEnemyY = p.y;
    }
  }
}

const wrapX = x => ((x % W) + W) % W;

function genUntil(s, topY) {
  while (s.genTop > topY) {
    const m = metersAt(s.genTop);
    const [lo, hi] = gapRange(m);
    const gap = Math.min(rr(s, lo, hi), jumpHeight() * REACH.maxGapShare);
    const type = pickPlatformType(s, m);
    const def = PLATFORMS[type], wk = tierAt(m).widthK, pw = def.w * wk;
    let x = clamp(wrapX(s.lastX + rr(s, -190, 190)), pw / 2 + 4, W - pw / 2 - 4);
    const step = dxWrap(x, s.lastX), reach = maxStepX(gap, pw);
    const xLo = pw / 2 + 4, xHi = W - pw / 2 - 4;
    if (Math.abs(step) > reach) x = clamp(wrapX(s.lastX + Math.sign(step) * reach), xLo, xHi);
    if (Math.abs(dxWrap(x, s.lastX)) > reach) x = clamp(s.lastX - Math.sign(step) * reach * 0.5, xLo, xHi);
    const p = makePlatform(type, x, s.genTop - gap, s.rnd, wk);
    s.plats.push(p);
    s.genTop = p.y;
    s.lastX = x;
    genPickups(s, p, m, gap);
  }
}
