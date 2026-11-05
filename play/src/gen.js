/* World generation: platforms, coins, power-ups and ground enemies placed as the camera climbs.
   Everything is tuned from data.js. World y grows upward as it gets more negative; the start ledge is at y = 0. */

const metersAt = y => Math.max(0, Math.floor(-y / METER));

function weightsAt(m) {
  const S_ = WEIGHT_STOPS;
  let i = 0;
  while (i < S_.length - 1 && S_[i + 1].m <= m) i++;
  const a = S_[i], b = S_[Math.min(i + 1, S_.length - 1)];
  const k = b.m === a.m ? 0 : clamp((m - a.m) / (b.m - a.m), 0, 1);
  const out = {};
  new Set([...Object.keys(a.w), ...Object.keys(b.w)]).forEach(type => { out[type] = lerp(a.w[type] || 0, b.w[type] || 0, k); });
  return out;
}

function weightedPick(weights) {
  const entries = Object.entries(weights).filter(([, w]) => w > 0);
  let r = Math.random() * entries.reduce((s, [, w]) => s + w, 0);
  for (const [type, w] of entries) { r -= w; if (r <= 0) return type; }
  return entries.length ? entries[0][0] : 'balcony';
}

const gapRange = m => {
  const k = clamp(m / GAP.fullAt, 0, 1);
  return [lerp(GAP.min[0], GAP.min[1], k), lerp(GAP.max[0], GAP.max[1], k)];
};

function makePlatform(type, x, y) {
  const def = PLATFORMS[type];
  const p = { type, x, y, w: def.w, kind: def.kind, state: 'ok', t: 0, vx: 0, press: 0 };
  if (def.kind === 'moving') p.vx = rand(def.speed[0], def.speed[1]) * (Math.random() < 0.5 ? -1 : 1);
  return p;
}

/** Choose a type, avoiding more than MAX_UNSAFE_RUN breakable or vanishing ledges in a row. */
function pickPlatformType(s, m) {
  let type = weightedPick(weightsAt(m));
  const kind = PLATFORMS[type].kind;
  const unsafe = kind === 'breakable' || kind === 'vanishing';
  if (unsafe && s.unsafeRun >= MAX_UNSAFE_RUN) type = m >= 190 ? 'cloud' : m >= 70 ? 'tank' : 'balcony';
  s.unsafeRun = unsafe && PLATFORMS[type].kind === kind ? s.unsafeRun + 1 : 0;
  return type;
}

function genPickups(s, p, m, gap) {
  if (p.kind === 'normal' || p.kind === 'spring') {
    if (Math.random() < COIN.chance) s.coins.push({ x: p.x, y: p.y - 34, got: false, ph: Math.random() * 6 });
    else if (Math.random() < COIN.lineChance) [-1, 0, 1].forEach(i => s.coins.push({ x: wrapX(p.x + i * 34), y: p.y - 56 - gap * 0.2, got: false, ph: i }));
    if (Math.random() < POWERUPS.chance && s.lastPowY - p.y > POWERUPS.minSpacingPx) {
      const ok = ['kite', 'ful', 'bead'].filter(k => m >= POWERUPS[k].from);
      if (ok.length) {
        const type = weightedPick(Object.fromEntries(ok.map(k => [k, POWERUPS[k].weight])));
        s.pows.push({ type, x: p.x, y: p.y - 40, ph: Math.random() * 6 });
        s.lastPowY = p.y;
      }
    }
  }
  const E = ENEMIES;
  if (s.lastEnemyY - p.y > E.minSpacingPx) {
    if (m >= E.pigeon.from && Math.random() < E.pigeon.chance) {
      s.enemies.push({ type: 'pigeon', x: wrapX(p.x + rand(-120, 120)), y: p.y - gap * 0.5 - 40, y0: p.y - gap * 0.5 - 40, st: 'idle', t: 0, ph: Math.random() * 6, r: E.pigeon.r, vx: 0, vy: 0 });
      s.lastEnemyY = p.y;
    } else if (m >= E.bag.from && Math.random() < E.bag.chance) {
      s.enemies.push({ type: 'bag', x: rand(20, W - 20), y: p.y - gap * 0.5 - 30, y0: p.y - gap * 0.5 - 30, st: 'drift', t: 0, ph: Math.random() * 6, r: E.bag.r, vx: rand(E.bag.speed[0], E.bag.speed[1]) * (Math.random() < 0.5 ? -1 : 1), vy: 0 });
      s.lastEnemyY = p.y;
    }
  }
}

const wrapX = x => ((x % W) + W) % W;

function genUntil(s, topY) {
  while (s.genTop > topY) {
    const m = metersAt(s.genTop);
    const [lo, hi] = gapRange(m);
    const gap = rand(lo, hi);
    const type = pickPlatformType(s, m);
    const def = PLATFORMS[type];
    const x = clamp(wrapX(s.lastX + rand(-190, 190)), def.w / 2 + 4, W - def.w / 2 - 4);
    const p = makePlatform(type, x, s.genTop - gap);
    s.plats.push(p);
    s.genTop = p.y;
    s.lastX = x;
    genPickups(s, p, m, gap);
  }
}
