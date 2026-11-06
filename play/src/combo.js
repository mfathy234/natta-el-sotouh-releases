/* Combos (free mode): stomps, spring launches and coins close together build a chain with a bonus multiplier and an Arabic shout.
   Tuning is COMBO in data.js. The multiplier scales bonus points only; coins and heights are never changed. */

const comboNew = () => ({ n: 0, t: 0, mult: 1, best: 0 });

/** Multiplier and step for a chain of n. */
function comboStep(n) {
  let step = null;
  COMBO.steps.forEach(st => { if (n >= st.n) step = st; });
  return { mult: step ? step.mult : 1, step };
}

function comboHit(s, kind) {
  if (s.demo || s.tower || !s.combo) return;
  const c = s.combo;
  c.n = c.t > 0 ? c.n + 1 : 1;
  c.t = COMBO.window;
  c.best = Math.max(c.best, c.n);
  c.mult = comboStep(c.n).mult;
  const extra = Math.round((COMBO.points[kind] || 0) * (c.mult - 1));
  if (extra > 0) s.bonus += extra;
  const hit = COMBO.steps.find(st => st.n === c.n);
  if (hit) { bannerPush(s, { ar: hit.ar, en: hit.en }, 'shout'); Sound.play('mile'); }
}

function updateCombo(s, dt) {
  const c = s.combo;
  if (!c || c.t <= 0) return;
  c.t -= dt;
  if (c.t <= 0) { c.n = 0; c.mult = 1; c.t = 0; }
}

function renderCombo(s) {
  const c = s.combo;
  if (!c || c.n < 2 || c.t <= 0) return;
  const ctx = Eng.ctx, x = W / 2, y = 62, w = 80, h = 26, k = c.t / COMBO.window;
  ctx.save();
  ctx.globalAlpha = Math.min(1, c.t * 3);
  ctx.fillStyle = K.paper; ctx.strokeStyle = K.ink; ctx.lineWidth = 3; ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.roundRect(x - w / 2, y - h / 2, w, h, 10); ctx.fill(); ctx.stroke();
  ctx.fillStyle = c.mult >= 3 ? K.red : c.mult >= 2 ? K.orange : K.gold;
  ctx.beginPath(); ctx.roundRect(x - w / 2 + 4, y + h / 2 - 9, (w - 8) * k, 5, 2); ctx.fill();
  ctx.restore();
  drawText('×' + nf(c.n), x, y - 3, 17, K.white);
}

if (typeof module !== 'undefined' && module.exports) module.exports = { comboNew, comboStep };
