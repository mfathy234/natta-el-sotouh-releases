/* Notification rules (pure, tested in game/tests/notify.test.js). One place decides what may show and when, so a busy moment stays readable:
   a telegraph is never covered, big strips take turns, repeated "+n" pops merge, voice barks are rare. Numbers: BANNER and NOTIFY in data.js.
   "Fewer pop-ups" (prefs.quiet, on by default) uses the calm numbers; off uses NOTIFY.loud, close to the old behaviour. */

/** The numbers in force right now. */
function noteCfg(quiet = typeof Quiet === 'undefined' || Quiet.on()) {
  const P = NOTIFY.pops, L = NOTIFY.loud;
  return quiet
    ? { quiet, strips: 1, gap: BANNER.gap, stale: BANNER.stale, shoutGap: BANNER.shoutGap, bark: NOTIFY.bark, popLife: P.life, popMax: P.max, popRise: P.rise, popSize: P.size, merge: true }
    : { quiet, strips: L.strips, gap: L.gap, stale: L.stale, shoutGap: L.shoutGap, bark: L.bark, popLife: L.popLife, popMax: L.popMax, popRise: L.popRise, popSize: L.popSize, merge: false };
}

/** True while any warning the player must read is on screen (enemy aim lines, neighbours, El Bawab, an event wind-up). */
function telegraphActive(s) {
  if (!s || s.demo) return false;
  if (s.enemies && s.enemies.some(e => !e.dead && (e.st === 'aim' || e.st === 'warn'))) return true;
  if (s.nbr && s.nbr.list && s.nbr.list.some(n => n.st === 'warn')) return true;
  if (s.bawab && s.bawab.st === 'warn') return true;
  return Boolean(s.ev && s.ev.phase === 'warn' && (s.ev.id === 'flock' || s.ev.id === 'gust'));
}

const noteStrips = s => (s.banners || []).filter(b => b.kind !== 'shout');
const noteSlotFree = (s, cfg) => noteStrips(s).length < cfg.strips && (s.bannerWait || 0) <= 0;

function noteLife(kind) { return kind === 'shout' ? BANNER.shoutTime : kind === 'minor' ? BANNER.minorTime : BANNER.time; }

/** Queue order: higher priority first, then who waited longest. */
function noteBest(q) {
  let best = -1;
  q.forEach((b, i) => { if (best < 0 || NOTIFY.prio[b.kind] > NOTIFY.prio[q[best].kind] || (NOTIFY.prio[b.kind] === NOTIFY.prio[q[best].kind] && b.wait > q[best].wait)) best = i; });
  return best;
}

const noteSame = (a, b) => a.text.ar === b.text.ar && a.text.en === b.text.en;

/** Show a banner. kind: boss, event, tier (strips), minor (small chip, same slot) or shout (combo, small, drops itself when busy). */
function bannerPush(s, text, kind = 'tier') {
  if (!s.banners) s.banners = [];
  if (!s.bannerQ) s.bannerQ = [];
  const cfg = noteCfg(), now = s.t || 0;
  if (kind === 'shout') {
    if (cfg.quiet && (noteStrips(s).length || telegraphActive(s) || now - (s.lastShoutT == null ? -99 : s.lastShoutT) < cfg.shoutGap)) return false;
    s.lastShoutT = now;
    s.banners = s.banners.filter(b => b.kind !== 'shout');
    s.banners.push({ text, kind, t: 0, life: noteLife(kind) });
    return true;
  }
  const item = { text, kind, t: 0, life: noteLife(kind), wait: 0 };
  if (s.banners.some(b => noteSame(b, item)) || s.bannerQ.some(b => noteSame(b, item))) return false;
  if (kind === 'boss') { s.banners = s.banners.filter(b => b.kind === 'shout'); s.bannerQ = s.bannerQ.filter(b => b.kind === 'boss'); s.banners.push(item); return true; }
  if (noteSlotFree(s, cfg) && !s.bannerQ.length) { s.banners.push(item); return true; }
  s.bannerQ.push(item);
  while (s.bannerQ.length > 4) s.bannerQ.splice(noteLowest(s.bannerQ), 1);
  return true;
}

function noteLowest(q) {
  let low = 0;
  q.forEach((b, i) => { if (NOTIFY.prio[b.kind] < NOTIFY.prio[q[low].kind] || (NOTIFY.prio[b.kind] === NOTIFY.prio[q[low].kind] && b.wait > q[low].wait)) low = i; });
  return low;
}

function updateBanners(s, dt) {
  const cfg = noteCfg();
  if (s.banners && s.banners.length) {
    const had = noteStrips(s).length;
    s.banners.forEach(b => { b.t += dt; });
    s.banners = s.banners.filter(b => b.t < b.life);
    if (noteStrips(s).length < had) s.bannerWait = cfg.gap;
  }
  if ((s.bannerWait || 0) > 0) s.bannerWait = Math.max(0, s.bannerWait - dt);
  const q = s.bannerQ;
  if (!q || !q.length) return;
  q.forEach(b => { b.wait += dt; });
  s.bannerQ = q.filter(b => b.kind === 'boss' || b.wait <= cfg.stale);
  while (s.bannerQ.length && noteSlotFree(s, cfg)) {
    const i = noteBest(s.bannerQ), b = s.bannerQ.splice(i, 1)[0];
    s.banners.push({ text: b.text, kind: b.kind, t: 0, life: b.life });
  }
}

/* ---------- floating pops ---------- */
/** A "+n" gain pop. Quiet: it merges into the one just shown, and is skipped while a telegraph is up. */
function popGain(s, n, x, y, color) {
  const cfg = noteCfg();
  if (cfg.quiet && telegraphActive(s)) return;
  const old = cfg.merge && s.pops.find(q => q.gain && q.t < NOTIFY.pops.mergeT);
  if (old) { old.val += n; old.text = '+' + nf(old.val); old.t = 0.15; old.x = x; old.y = y; return; }
  popPush(s, '+' + nf(n), x, y, color, n);
}

/** Any other pop (shield broke, ouch, power-up name). Same text refreshes; extra pops push the oldest out. */
function popPush(s, text, x, y, color, gainVal) {
  const cfg = noteCfg();
  const same = cfg.merge && s.pops.find(q => q.text === text && q.t < 0.5);
  if (same) { same.t = 0; same.x = x; same.y = y; return; }
  s.pops.push({ text, x, y, t: 0, color, gain: gainVal != null, val: gainVal || 0 });
  while (s.pops.length > cfg.popMax) s.pops.shift();
}

/* ---------- DOM lines (milestones, fall lines, daily target) ---------- */
const NoteLine = { last: -99, pending: null, timer: 0 };

/** Decide whether a DOM line may show now. force bypasses the gap and the strip check (target reached, roof reached). */
function lineDecide(now, last, blocked, force, quiet = typeof Quiet === 'undefined' || Quiet.on()) {
  if (force || !quiet) return 'show';
  if (blocked || now - last < NOTIFY.line.gap) return 'wait';
  return 'show';
}

/** Voice barks: at most one per cfg.bark seconds (checked by Sound.voice). */
const barkGap = () => noteCfg().bark;

if (typeof module !== 'undefined' && module.exports) module.exports = { noteCfg, telegraphActive, lineDecide, barkGap };
