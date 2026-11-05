/* Daily twists in play: platform weights, enemy and coin odds, sideways wind, and the night / petal decor.
   A twist is a row of DAILY.twists in data.js; s.twist is null in an ordinary run, so every hook is a no-op there. */

/** Blend a twist's extra platform weights into the height weights. */
function twistWeights(s, w) {
  const add = s.twist && s.twist.weightAdd;
  if (!add) return w;
  const out = { ...w };
  Object.keys(add).forEach(type => { out[type] = (out[type] || 0) + add[type]; });
  return out;
}

/** Enemy and coin odds for this run (the base tables unless a twist changes them). */
function twistOdds(s) {
  const tw = s.twist, pg = ENEMIES.pigeon;
  if (!tw) return { pigeon: pg, spacing: ENEMIES.minSpacingPx, coin: COIN.chance };
  return {
    pigeon: { ...pg, chance: tw.pigeonChance || pg.chance, from: tw.pigeonFrom == null ? pg.from : tw.pigeonFrom },
    spacing: tw.spacing || ENEMIES.minSpacingPx,
    coin: tw.coinChance || COIN.chance
  };
}

/** Wind push in px/s at run time t: a slow swell that swaps sides. */
const twistWindAt = (s, t) => (s.twist && s.twist.wind ? s.twist.wind * Math.sin(t * 0.55) * (0.6 + 0.4 * Math.sin(t * 1.7 + 1)) : 0);

function twistMove(s, dt) {
  const w = twistWindAt(s, s.t);
  if (w && !s.p.dead && !s.demo) s.p.x = wrapX(s.p.x + w * dt);
}

/* ---------- drawing ---------- */
function ensureFlies(s) {
  if (!s.flies) s.flies = Array.from({ length: 26 }, (_, i) => ({ x: (i * 97) % W, y: (i * 151) % H, ph: i * 1.7, sp: 8 + (i % 5) * 3 }));
  return s.flies;
}

/** After the sky, before the platforms: the night shade and stars. */
function renderTwistBack(s) {
  if (!s.twist || !s.twist.night) return;
  const ctx = Eng.ctx;
  ctx.save();
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, 'rgba(30,20,64,.78)'); g.addColorStop(1, 'rgba(61,44,107,.55)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  for (let i = 0; i < 22; i++) {
    const x = (i * 83 + 20) % W, y = (i * 131) % (H * 0.7), a = 0.4 + 0.5 * Math.sin(Eng.clock * 2 + i);
    ctx.globalAlpha = Math.max(0.1, a); ctx.fillStyle = K.white; ctx.fillRect(x, y, 2.2, 2.2);
  }
  ctx.restore();
}

/** After the hero: fireflies, wind streaks. */
function renderTwistFront(s) {
  const tw = s.twist;
  if (!tw) return;
  const ctx = Eng.ctx;
  if (tw.night) {
    ctx.save();
    ensureFlies(s).forEach(f => {
      const x = (f.x + Math.sin(Eng.clock * 0.6 + f.ph) * 24 + W) % W, y = (f.y - Eng.clock * f.sp + s.cam * 0.2 + H * 20) % H;
      const a = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(Eng.clock * 3 + f.ph));
      const g = ctx.createRadialGradient(x, y, 0, x, y, 9);
      g.addColorStop(0, `rgba(255,236,140,${a})`); g.addColorStop(1, 'rgba(255,236,140,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, 9, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = `rgba(255,250,200,${Math.min(1, a + 0.2)})`; ctx.fillRect(x - 1, y - 1, 2, 2);
    });
    ctx.restore();
  }
  if (tw.wind) {
    const w = twistWindAt(s, s.t), dir = Math.sign(w) || 1, k = Math.min(1, Math.abs(w) / tw.wind);
    ctx.save();
    ctx.strokeStyle = K.white; ctx.lineWidth = 2.4; ctx.lineCap = 'round'; ctx.globalAlpha = 0.18 + 0.4 * k;
    for (let i = 0; i < 9; i++) {
      const y = (i * 71 + Eng.clock * 40) % H, x = ((i * 113 + Eng.clock * 260 * dir) % (W + 120) + (W + 120)) % (W + 120) - 60, len = 26 + (i % 3) * 14;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + len * dir, y + 2); ctx.stroke();
    }
    ctx.restore();
  }
}

if (typeof module !== 'undefined' && module.exports) module.exports = { twistWeights, twistOdds, twistWindAt };
