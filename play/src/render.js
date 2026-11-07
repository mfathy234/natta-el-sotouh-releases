/* Drawing a run: sky, parallax scenery, platforms, pickups, enemies and their telegraphs, the hero, particles. */

const DECOR = buildDecor();

const mixColor = (a, b, k) => {
  const pa = [1, 3, 5].map(i => parseInt(a.slice(i, i + 2), 16)), pb = [1, 3, 5].map(i => parseInt(b.slice(i, i + 2), 16));
  return '#' + pa.map((v, i) => Math.round(lerp(v, pb[i], k)).toString(16).padStart(2, '0')).join('');
};
function skyAt(m) {
  let i = 0;
  while (i < SKY.length - 1 && SKY[i + 1].m <= m) i++;
  const a = SKY[i], b = SKY[Math.min(i + 1, SKY.length - 1)];
  const k = b.m === a.m ? 0 : clamp((m - a.m) / (b.m - a.m), 0, 1);
  return [mixColor(a.top, b.top, k), mixColor(a.bot, b.bot, k)];
}

function renderSky(s) {
  const ctx = Eng.ctx, climbed = -s.cam - (H - 120), m = climbed / METER;
  const [top, bot] = skyAt(m);
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, top); g.addColorStop(1, bot);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  DECOR.forEach(d => {
    const spr = SPR[d.spr];
    if (!spr) return;
    const y = d.fixed ? d.y + climbed * d.f : 260 + (climbed - d.atM * METER) * d.f;
    if (y < -spr.h || y > H + spr.h) return;
    let alpha = d.alpha == null ? 1 : d.alpha;
    if (d.spr === 'bg:sun') alpha *= clamp(1 - (m - 100) / 500, 0, 1) * clamp((m - 60) / 60, 0, 1);
    if (d.spr === 'bg:moon') alpha *= clamp((m - 650) / 120, 0, 1);
    if (d.twinkle != null) alpha *= 0.5 + 0.5 * Math.sin(Eng.clock * 3 + d.twinkle);
    const x = d.x + (d.sway ? Math.sin(Eng.clock + d.x) * 6 : d.bob ? Math.sin(Eng.clock * 0.6 + d.bob) * 5 : 0);
    drawSpr(d.spr, x, y, { ax: d.ax == null ? 0.5 : d.ax, sx: d.s || 1, sy: d.s || 1, alpha });
  });
  const a = clamp(1 - (m - FACADE.fadeFrom) / (FACADE.fadeTo - FACADE.fadeFrom), 0, 1);
  if (a > 0) {
    const off = (climbed * FACADE.factor) % FACADE.tile;
    for (let y = -FACADE.tile + off; y < H; y += FACADE.tile) drawSpr('bg:facade', W / 2, y, { ax: 0.5, ay: 0, alpha: a });
  }
}

function platFrame(pl) {
  if (pl.type === 'dish') return pl.press > 0 ? 1 : 0;
  if (pl.type === 'cloud') return pl.press > 0 ? 1 : 0;
  if (pl.type === 'ac') return animFrame(pl.x * 0.01);
  if (pl.type === 'laundry') return pl.state === 'snap' ? 1 : 0;
  if (pl.type === 'shutter') return pl.state === 'flip' ? 1 : 0;
  return 0;
}

function renderPlatforms(s) {
  s.plats.forEach(pl => {
    const sy = pl.y - s.cam;
    if (sy < -40 || sy > H + 40) return;
    const o = { sx: pl.w / 64, alpha: 1 };
    const key = `plat:${pl.type}:${platFrame(pl)}`;
    if (pl.state === 'pulled') o.alpha = clamp(1 - pl.t / 0.55, 0, 1);
    if (pl.shake) { drawSpr(key, pl.x + Math.sin(Eng.clock * 55) * 2.4, sy, o); return; }
    if (pl.state === 'snap') { o.alpha = clamp(1 - pl.t / 0.7, 0, 1); drawSpr(key, pl.x, sy + pl.t * 220, { ...o, rot: pl.t * 1.2 }); return; }
    if (pl.state === 'flip') { o.sy = clamp(1 - pl.t / 0.35, 0.05, 1); o.alpha = o.sy; }
    if (pl.type === 'dish' || pl.type === 'tower') o.sy = beatBounce(pl.x * 0.01, 0.015);
    drawSpr(key, pl.x, sy, o);
  });
}

function renderPickups(s) {
  s.coins.forEach(c => {
    const sy = c.y - s.cam;
    if (sy < -30 || sy > H + 30) return;
    const k = beatBounce(c.ph, 0.1);
    if (c.cone) { drawSpr('item:cone:0', c.x, sy, { w: 34, h: 34, rot: Math.sin(Eng.clock * 3 + c.ph * 5) * 0.12, sx: 1 + (k - 1) * 0.5, sy: 1 + (1 - k) * 0.5 }); return; }
    drawSpr(`item:coin:${animFrame(c.ph * 0.1)}`, c.x, sy, { sx: k, sy: k });
  });
  s.pows.forEach(w => {
    const sy = w.y - s.cam + Math.sin(Eng.clock * 3 + w.ph) * 4;
    if (sy < -30 || sy > H + 30) return;
    const k = beatBounce(w.ph, 0.06);
    ctxGlow(w.x, sy, 22);
    drawSpr(`item:${w.type}:0`, w.x, sy, { sx: k, sy: 2 - k });
  });
}
function ctxGlow(x, y, r) {
  const ctx = Eng.ctx, g = ctx.createRadialGradient(x, y, 2, x, y, r);
  g.addColorStop(0, 'rgba(255,240,180,.7)'); g.addColorStop(1, 'rgba(255,240,180,0)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
}

function renderTelegraphs(s) {
  const ctx = Eng.ctx, pulse = 0.5 + 0.5 * Math.sin(Eng.clock * 18);
  s.enemies.forEach(e => {
    const sy = e.y - s.cam;
    if (e.type === 'pigeon' && e.st === 'aim') {
      const locked = e.t >= ENEMIES.pigeon.aim - ENEMIES.pigeon.lock;
      ctx.save();
      ctx.strokeStyle = K.red; ctx.lineWidth = locked ? 4 : 2.5; ctx.globalAlpha = locked ? 0.95 : 0.35 + pulse * 0.4;
      ctx.setLineDash(locked ? [] : [8, 7]);
      ctx.beginPath(); ctx.moveTo(e.x, sy); ctx.lineTo(e.tx, e.ty - s.cam); ctx.stroke();
      ctx.restore();
      drawText('!', e.x, sy - 34, 26, K.red);
    } else if (e.type === 'crow' && e.st === 'warn') {
      const x = e.dir > 0 ? 18 : W - 18, a = 0.5 + pulse * 0.5;
      ctx.save(); ctx.globalAlpha = 0.18; ctx.fillStyle = K.red; ctx.fillRect(0, sy - 20, W, 40); ctx.restore();
      drawText('!', x, sy, 34, K.red, { alpha: a });
      ctx.save(); ctx.fillStyle = K.red; ctx.globalAlpha = a; ctx.beginPath();
      ctx.moveTo(x + e.dir * 22, sy); ctx.lineTo(x + e.dir * 10, sy - 9); ctx.lineTo(x + e.dir * 10, sy + 9); ctx.fill(); ctx.restore();
    } else if (e.type === 'slipper' && e.st === 'warn') {
      const rowY = s.p.y + PHYS.halfH - s.cam;
      ctx.save(); ctx.fillStyle = K.red; ctx.globalAlpha = 0.1 + pulse * 0.08; ctx.fillRect(e.x - 18, 0, 36, H);
      ctx.globalAlpha = 0.25; ctx.fillStyle = K.ink; ctx.beginPath(); ctx.ellipse(e.x, rowY, 22, 6, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
      drawText('!', e.x, 34, 34, K.red);
    }
  });
}

function renderEnemies(s) {
  s.enemies.forEach(e => {
    const sy = e.y - s.cam;
    if (sy < -60 || sy > H + 60) return;
    const size = ENEMY_SIZE[e.type];
    if (e.type === 'slipper') {
      if (e.st === 'fall') drawSpr('enemy:slipper:0', e.x, sy, { rot: e.rot });
      return;
    }
    const shake = e.st === 'aim' ? Math.sin(Eng.clock * 60) * 2.5 : 0;
    const fr = animFrame(e.ph || 0);
    const grow = e.type === 'bag' ? 1 + 0.12 * Math.sin(Eng.clock * 4 + e.ph) : beatBounce(e.ph || 0, 0.04);
    const flip = e.type === 'crow' ? e.dir : e.vx < 0 ? -1 : 1;
    drawSpr(`enemy:${e.type}:${fr}`, e.x + shake, sy, { sx: grow * (e.type === 'pigeon' ? 1 : flip), sy: e.type === 'bag' ? grow : 1 / Math.sqrt(grow) });
  });
}

function heroPose(p) {
  if (p.dead) return 'fall';
  if (p.landT > 0.14 && p.vy < 0) return 'land';
  if (p.vy < -140) return 'up';
  if (p.vy > 260) return 'fall';
  return 'idle';
}

function renderHero(s) {
  const p = s.p, sy = p.y - s.cam + PHYS.halfH + 1, ctx = Eng.ctx;
  if (p.inv > 0 && Math.floor(Eng.clock * 12) % 2 && !p.dead) return;
  const k = clamp(p.landT / 0.34, 0, 1) * (p.vy < 0 ? 1 : 0), launch = clamp(-p.vy / 4200, 0, 0.16);
  const sq = k > 0.55 && !Calm.on() ? (k - 0.55) / 0.45 : 0;
  const pk = clamp((p.popT || 0) / FEEL.popTime, 0, 1);
  const sx = (1 + FEEL.landX * sq - launch * 0.6 - FEEL.popX * pk) * (p.face > 0 ? -1 : 1), syy = 1 - FEEL.landY * sq + launch + FEEL.popY * pk;
  const draw = x => {
    if (p.kite > 0) drawSpr('item:kite:0', x, sy - 74, { rot: Math.sin(Eng.clock * 6) * 0.12, sx: 1.3, sy: 1.3 });
    if (p.kite > 0) { ctx.save(); ctx.strokeStyle = K.ink; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, sy - 52); ctx.lineTo(x, sy - 30); ctx.stroke(); ctx.restore(); }
    drawHero(s.hero, heroPose(p), s.worn, x, sy, { ay: 0.97, sx, sy: syy, rot: p.dead ? Math.sin(s.t * 14) * 0.25 : 0 });
    if (p.shield) {
      ctx.save(); ctx.globalAlpha = 0.28 + 0.1 * Math.sin(Eng.clock * 6);
      ctx.fillStyle = K.blueLight; ctx.strokeStyle = K.bead; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(x, sy - 26, 34, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 0.8; ctx.stroke(); ctx.restore();
    }
    if (p.shoes > 0 && Math.random() < 0.3) puff(s, p.x + rand(-10, 10), p.y + PHYS.halfH, 1, 8, 'spark');
  };
  draw(p.x);
  if (p.x < 40) draw(p.x + W);
  if (p.x > W - 40) draw(p.x - W);
}

function renderParts(s) {
  const ctx = Eng.ctx;
  s.parts.forEach(q => {
    const k = q.t / q.life, sy = q.y - s.cam;
    ctx.save(); ctx.globalAlpha = 1 - k;
    if (q.kind === 'puff') { ctx.fillStyle = K.white; ctx.strokeStyle = K.ink; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(q.x, sy, q.r * (1 + k * 1.4), 0, Math.PI * 2); ctx.fill(); ctx.stroke(); }
    else if (q.kind === 'spark') { ctx.fillStyle = K.gold; ctx.strokeStyle = K.ink; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.arc(q.x, sy, q.r * (1 - k * 0.5), 0, Math.PI * 2); ctx.fill(); ctx.stroke(); }
    else { ctx.fillStyle = K.tealLight; ctx.beginPath(); ctx.ellipse(q.x, sy, q.r * 0.8, q.r * 1.3, 0, 0, Math.PI * 2); ctx.fill(); }
    ctx.restore();
  });
  const cfg = noteCfg();
  s.pops.forEach(q => drawText(q.text, clamp(q.x, 40, W - 40), q.y - s.cam - Math.min(q.t, 0.6) * cfg.popRise, cfg.popSize, q.color, { alpha: clamp((cfg.popLife - q.t) / 0.35, 0, 1) }));
}

function renderRun(s) {
  if (s.tower) { renderTower(s); return; }
  renderSky(s);
  if (s.demo) return;
  renderEventBack(s);
  renderTwistBack(s);
  renderPlatforms(s);
  renderPickups(s);
  renderNeighbourBack(s);
  renderEventMid(s);
  renderTelegraphs(s);
  renderEnemies(s);
  renderGhost(s);
  renderHero(s);
  renderNeighbourFront(s);
  renderTwistFront(s);
  renderEventFront(s);
  renderParts(s);
  renderCombo(s);
  renderBanners(s);
}
