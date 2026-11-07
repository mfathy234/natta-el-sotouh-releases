/* Ghost race (free mode). The best run's path is sampled every GHOST.dt s as (x, height) and kept as one compact base-36 string in its own
   localStorage entry (GHOST.key). Later runs draw it as a translucent hero and announce the moment you pass it. Pure helpers first, then the run hooks. */

const g36 = (n, len) => Math.max(0, Math.floor(n)).toString(36).padStart(len, '0').slice(-len);
const GHOST_STRIDE = 6;
const ghostInt = (v, min, max) => (Number.isFinite(Number(v)) ? Math.max(min, Math.min(max, Math.round(Number(v)))) : min);

/** points: [[x, y]] in world px (y grows downward, so climbing is negative). Six base-36 characters per sample. */
function ghostEncode(points) {
  return points.slice(0, GHOST.max).map(([x, y]) => g36(ghostInt(x, 0, W), 2) + g36(ghostInt(-y / 2 + 2000, 0, 1679615), 4)).join('');
}

function ghostDecode(str) {
  const out = [];
  for (let i = 0; i + GHOST_STRIDE <= str.length; i += GHOST_STRIDE) {
    out.push({ x: parseInt(str.slice(i, i + 2), 36), y: -(parseInt(str.slice(i + 2, i + 6), 36) - 2000) * 2 });
  }
  return out;
}

/** Validate a stored ghost; null when it is not a usable one. */
function sanitizeGhost(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw) || typeof raw.d !== 'string') return null;
  if (!/^[0-9a-z]*$/.test(raw.d) || raw.d.length < GHOST_STRIDE * 2 || raw.d.length > GHOST_STRIDE * GHOST.max || raw.d.length % GHOST_STRIDE) return null;
  const hero = HEROES.some(h => h.id === raw.hero) ? raw.hero : DEFAULT_HERO;
  return { v: 1, m: ghostInt(raw.m, 0, 1e7), hero, dt: GHOST.dt, d: raw.d };
}

/** The ghost's place at run time t: { x, y, up, ended }. y is the hero's centre in world px. */
function ghostAt(g, t) {
  const pts = g.pts || (g.pts = ghostDecode(g.d)), f = Math.max(0, t) / g.dt, i = Math.floor(f);
  if (i >= pts.length - 1) { const l = pts[pts.length - 1]; return { x: l.x, y: l.y, up: false, ended: true }; }
  const a = pts[i], b = pts[i + 1], k = f - i;
  let dx = b.x - a.x;
  if (dx > W / 2) dx -= W; else if (dx < -W / 2) dx += W;
  return { x: ((a.x + dx * k) % W + W) % W, y: a.y + (b.y - a.y) * k, up: b.y < a.y, ended: false };
}

function loadGhost(storage) {
  try {
    const raw = storage && storage.getItem(GHOST.key);
    return raw ? sanitizeGhost(JSON.parse(raw)) : null;
  } catch (e) { return null; }
}
function persistGhost(storage, ghost) {
  try { storage.setItem(GHOST.key, JSON.stringify({ v: ghost.v, m: ghost.m, hero: ghost.hero, dt: ghost.dt, d: ghost.d })); return true; } catch (e) { return false; }
}

/** Build the record to keep after a run: the new path when it beat the stored ghost, otherwise null. */
function ghostCandidate(points, meters, hero, stored) {
  if (points.length < 4 || meters < 10 || (stored && meters <= stored.m)) return null;
  return { v: 1, m: meters, hero, dt: GHOST.dt, d: ghostEncode(points) };
}

/* ---------- run hooks ---------- */
function ghostStorage() {
  try { return typeof window !== 'undefined' ? window.localStorage : null; } catch (e) { return null; }
}

/** The ghost to race in a new run, or null (daily, debug heights, the toggle off, or none recorded yet). */
function ghostForRun(opts) {
  if (opts.ghost !== undefined) return opts.ghost;
  if (opts.demo || opts.daily || opts.startMeters) return null;
  if (typeof UI !== 'undefined' && UI.save && UI.save.ghost === false) return null;
  return loadGhost(ghostStorage());
}

function ghostTick(s, dt) {
  if (s.demo || s.daily || s.tower || s.p.dead) return;
  if (!s.rec) return;
  s.rec.acc += dt;
  while (s.rec.acc >= GHOST.dt && s.rec.pts.length < GHOST.max) { s.rec.acc -= GHOST.dt; s.rec.pts.push([s.p.x, s.p.y]); }
  if (!s.ghost || s.ghostPassed) return;
  const g = ghostAt(s.ghost, s.t), gh = -g.y;
  if (gh > s.maxUp + 40) s.ghostBehind = true;
  if (s.maxUp > gh + 10 && (s.ghostBehind || g.ended) && s.t > 2) {
    s.ghostPassed = true;
    bannerPush(s, GHOST.line, 'minor');
    Sound.play('mile');
    for (let i = 0; i < 8; i++) s.parts.push({ kind: 'spark', x: s.p.x + rand(-20, 20), y: s.p.y, vx: rand(-90, 90), vy: rand(-120, -20), r: rand(3, 6), t: 0, life: rand(0.5, 0.9) });
  }
}

/** When a run ends: keep its path if it is the best so far. */
function ghostFinish(s) {
  if (s.ghostSaved || !s.rec || s.daily || s.tower || s.startM) return;
  s.ghostSaved = true;
  const st = ghostStorage(), cand = ghostCandidate(s.rec.pts, s.meters, s.hero, s.ghost || (st ? loadGhost(st) : null));
  if (cand && st) persistGhost(st, cand);
}

function renderGhost(s) {
  if (!s.ghost || s.demo || s.p.dead) return;
  const g = ghostAt(s.ghost, s.t), sy = g.y - s.cam + PHYS.halfH + 1;
  if (sy < -60 || sy > H + 60) return;
  const pose = g.ended ? 'idle' : g.up ? 'up' : 'fall';
  drawSpr(`hero:${s.ghost.hero}:${pose}`, g.x, sy, { ay: 0.97, alpha: GHOST.alpha, sx: -1 });
  drawText(pick({ ar: 'شبحك', en: 'ghost' }), g.x, sy - 70, 15, K.white, { alpha: GHOST.alpha + 0.25 });
}

if (typeof module !== 'undefined' && module.exports) module.exports = { ghostEncode, ghostDecode, sanitizeGhost, ghostAt, ghostCandidate, loadGhost, persistGhost };
