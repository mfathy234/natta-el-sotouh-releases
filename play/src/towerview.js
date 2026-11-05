/* Drawing the Tower: brick walls, ledges, flag-ground, the dotted aim arc, the power meter and the squashing hero.
   Reuses the sky, pickups and particles from render.js. */

function renderTowerWalls(s) {
  const ctx = Eng.ctx, w = TOWER.wall, off = ((-s.cam * 0.9) % 46 + 46) % 46;
  ctx.save();
  [[0, w], [W - w, w]].forEach(([x]) => {
    ctx.fillStyle = '#b8829f'; ctx.fillRect(x, 0, w, H);
    ctx.strokeStyle = K.ink; ctx.globalAlpha = 0.5; ctx.lineWidth = 1.6;
    for (let y = off - 46; y < H; y += 23) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + w, y); ctx.stroke(); }
    ctx.globalAlpha = 1; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(x === 0 ? w : W - w, 0); ctx.lineTo(x === 0 ? w : W - w, H); ctx.stroke();
  });
  ctx.restore();
}

function renderTowerGround(s, pl, sy) {
  const ctx = Eng.ctx, x0 = pl.x - pl.w / 2, reached = s.checkpoint >= pl.floor, top = pl.floor === TOWER.top;
  ctx.save();
  ctx.fillStyle = K.wood; ctx.strokeStyle = K.ink; ctx.lineWidth = 3.5; ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.roundRect(x0, sy, pl.w, 26, 6); ctx.fill(); ctx.stroke();
  ctx.fillStyle = K.sandLight; ctx.beginPath(); ctx.roundRect(x0, sy - 5, pl.w, 10, 5); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = K.woodDark; ctx.lineWidth = 2;
  for (let x = x0 + 30; x < x0 + pl.w - 10; x += 44) { ctx.beginPath(); ctx.moveTo(x, sy + 8); ctx.lineTo(x, sy + 26); ctx.stroke(); }
  ctx.restore();
  drawText(nf(pl.floor), x0 + 30, sy + 16, 20, K.white);
  const tx = x0 + pl.w - 46;
  drawSpr('plat:tower:0', tx, sy + 4, { sx: 1.1, sy: 1.1 });
  ctx.save();
  ctx.strokeStyle = K.ink; ctx.lineWidth = 3; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(tx, sy - 4); ctx.lineTo(tx, sy - 62); ctx.stroke();
  const wave = Math.sin(Eng.clock * 5) * 3, fy = reached ? sy - 62 : sy - 36;
  ctx.fillStyle = top ? K.gold : reached ? K.red : K.grey; ctx.lineWidth = 3; ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.moveTo(tx, fy); ctx.lineTo(tx + 30 + wave, fy + 10); ctx.lineTo(tx, fy + 22); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.restore();
  if (reached) drawText('★', tx + 9, fy + 11, 11, K.gold);
}

function renderTowerPlats(s) {
  s.plats.forEach(pl => {
    const sy = pl.y - s.cam;
    if (sy < -80 || sy > H + 60 || pl.state === 'gone') return;
    if (pl.type === 'ground') { renderTowerGround(s, pl, sy); return; }
    const o = { sx: pl.w / 64, alpha: 1 }, frame = pl.type === 'ac' ? animFrame(pl.x * 0.01) : pl.type === 'laundry' ? (pl.state === 'snap' ? 1 : 0) : 0;
    let x = pl.x, y = sy;
    if (pl.state === 'wobble') { x += Math.sin(Eng.clock * 55) * 2.2; drawText('!', pl.x, sy - 30, 26, K.red); }
    if (pl.state === 'snap') { o.alpha = clamp(1 - pl.t / TOWER.snap.fall, 0, 1); y += pl.t * 240; o.rot = pl.t * 1.2; }
    if (pl.type === 'tower') o.sy = beatBounce(pl.x * 0.01, 0.015);
    drawSpr(`plat:${pl.type}:${frame}`, x, y, o);
    if (pl.slick) { Eng.ctx.save(); Eng.ctx.globalAlpha = 0.5; Eng.ctx.fillStyle = K.tealLight; Eng.ctx.beginPath(); Eng.ctx.ellipse(pl.x, sy + 1, pl.w * 0.36, 3, 0, 0, Math.PI * 2); Eng.ctx.fill(); Eng.ctx.restore(); }
  });
}

function renderTowerAim(s) {
  if (!s.charging) return;
  const ctx = Eng.ctx, p = s.p, v = towerLaunch(s.charge, s.aim);
  const r = towerSim(p.x, p.y, v.vx, v.vy, s.plats, { points: true, maxT: TOWER.previewTime });
  ctx.save();
  r.pts.forEach((q, i) => {
    const k = 1 - i / Math.max(1, r.pts.length), rad = 2 + 2.6 * k;
    ctx.globalAlpha = 0.35 + 0.65 * k;
    ctx.fillStyle = K.gold; ctx.strokeStyle = K.ink; ctx.lineWidth = 1.8;
    ctx.beginPath(); ctx.arc(q.x, q.y - s.cam - 26, rad, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  });
  if (r.pl) {
    const pulse = 1 + 0.12 * Math.sin(Eng.clock * 10);
    ctx.globalAlpha = 0.9; ctx.strokeStyle = K.ink; ctx.lineWidth = 6;
    ctx.beginPath(); ctx.ellipse(r.x, r.y - s.cam, 17 * pulse, 5.5 * pulse, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = K.gold; ctx.lineWidth = 3; ctx.stroke();
  }
  ctx.restore();
  renderTowerMeter(s);
}

function renderTowerMeter(s) {
  const ctx = Eng.ctx, p = s.p, h = 74, w = 14, side = s.aim >= 0 ? -1 : 1;
  const x = clamp(p.x + side * 40, TOWER.wall + 14, W - TOWER.wall - 14), y = p.y - s.cam - 8 - h;
  const full = s.charge >= 1, fill = h * s.charge;
  ctx.save();
  ctx.fillStyle = K.white; ctx.strokeStyle = K.ink; ctx.lineWidth = 3.5; ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.roundRect(x - w / 2, y, w, h, 6); ctx.fill();
  ctx.save(); ctx.beginPath(); ctx.roundRect(x - w / 2, y, w, h, 6); ctx.clip();
  ctx.fillStyle = full && Math.floor(Eng.clock * 10) % 2 ? K.orange : K.gold;
  ctx.fillRect(x - w / 2, y + h - fill, w, fill);
  ctx.fillStyle = K.goldDark; ctx.fillRect(x - w / 2, y + h - fill, w, Math.min(3, fill));
  ctx.restore();
  ctx.beginPath(); ctx.roundRect(x - w / 2, y, w, h, 6); ctx.stroke();
  ctx.lineWidth = 2; ctx.globalAlpha = 0.6;
  [0.25, 0.5, 0.75].forEach(q => { ctx.beginPath(); ctx.moveTo(x - w / 2, y + h * q); ctx.lineTo(x - w / 2 + 5, y + h * q); ctx.stroke(); });
  ctx.restore();
}

function renderTowerHero(s) {
  const p = s.p, ctx = Eng.ctx, sy = p.y - s.cam + 1;
  const c = s.charging ? s.charge : 0, lk = clamp(p.landT / 0.34, 0, 1), air = p.on ? 0 : clamp(Math.abs(p.vy) / 4200, 0, 0.16);
  const sq = Math.max(c * 0.3, lk > 0.5 ? (lk - 0.5) * 0.5 : 0);
  const sx = (1 + sq * 0.8 - air * 0.6) * (p.face > 0 ? -1 : 1), syy = 1 - sq + air;
  const pose = s.charging ? (c > 0.6 ? 'land' : 'idle') : !p.on ? (p.vy < -140 ? 'up' : p.vy > 200 ? 'fall' : 'idle') : lk > 0.4 ? 'land' : 'idle';
  const shake = c >= 1 ? Math.sin(Eng.clock * 70) * 1.6 : 0;
  ctx.save();
  ctx.globalAlpha = 0.22; ctx.fillStyle = K.ink; ctx.beginPath(); ctx.ellipse(p.x, p.on ? sy : p.y - s.cam + 1, 16, 4, 0, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
  drawSpr(`hero:${s.hero}:${pose}`, p.x + shake, sy, { ay: 0.97, sx, sy: syy });
}

function renderTower(s) {
  renderSky(s);
  renderTowerWalls(s);
  renderTowerPlats(s);
  renderPickups(s);
  renderTowerAim(s);
  renderTowerHero(s);
  renderParts(s);
}
