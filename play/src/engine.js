/* Engine: canvas sizing, sprite cache, drawing helpers, the animation beat, and input. */

const Eng = { cv: null, ctx: null, stage: null, scale: 1, dpr: 1, clock: 0 };

/* One shared beat (0.5 s): everything alive bobs to it, flapping parts change frame "on twos" (6 fps). */
const BEAT = 0.5;
const animFrame = (offset = 0) => Math.floor((Eng.clock + offset) * 6) % 2;
const beatBounce = (offset = 0, amount = 0.06) => 1 + Math.cos(((Eng.clock + offset) / BEAT) * Math.PI * 2) * amount;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const rand = (a, b) => a + Math.random() * (b - a);

function initEngine() {
  Eng.stage = document.getElementById('game');
  Eng.cv = document.getElementById('cv');
  Eng.ctx = Eng.cv.getContext('2d');
  resizeEngine();
  addEventListener('resize', resizeEngine);
}
function resizeEngine() {
  Eng.scale = Math.min(innerWidth / W, innerHeight / H);
  Eng.dpr = Math.min(3, window.devicePixelRatio || 1);
  Eng.stage.style.width = W * Eng.scale + 'px';
  Eng.stage.style.height = H * Eng.scale + 'px';
  Eng.stage.style.fontSize = 16 * Eng.scale + 'px';
  Eng.cv.width = Math.round(W * Eng.scale * Eng.dpr);
  Eng.cv.height = Math.round(H * Eng.scale * Eng.dpr);
}
function beginFrame() {
  const k = Eng.scale * Eng.dpr;
  Eng.ctx.setTransform(k, 0, 0, k, 0, 0);
  Eng.ctx.clearRect(0, 0, W, H);
}

/* ---------- sprites ---------- */
const SPR = {};
function loadSprites() {
  const jobs = spriteCatalogue().map(s => {
    const img = new Image();
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgDoc(s.vb, s.svg, `width="${s.w * SPRITE_Q}" height="${s.h * SPRITE_Q}"`));
    SPR[s.key] = { img, w: s.w, h: s.h, src: img.src };
    return img.decode().catch(() => null);
  });
  return Promise.all(jobs);
}
const spriteSrc = key => (SPR[key] ? SPR[key].src : '');

/** Draw a sprite. o: { ax, ay (anchor 0..1), rot, sx, sy, alpha, w (width override) } */
function drawSpr(key, x, y, o = {}) {
  const s = SPR[key];
  if (!s) return;
  const { ax = 0.5, ay = 0.5, rot = 0, sx = 1, sy = 1, alpha = 1 } = o;
  const w = o.w || s.w, h = o.h || s.h, ctx = Eng.ctx;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(x, y);
  if (rot) ctx.rotate(rot);
  ctx.scale(sx, sy);
  ctx.drawImage(s.img, -w * ax, -h * ay, w, h);
  ctx.restore();
}

/** Outlined text on the canvas (red "!" marks, floating pop text). */
function drawText(text, x, y, size, fill, o = {}) {
  const ctx = Eng.ctx;
  ctx.save();
  ctx.globalAlpha = o.alpha == null ? 1 : o.alpha;
  ctx.font = `${size}px Lalezar, Cairo, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';
  ctx.lineWidth = size * 0.28;
  ctx.strokeStyle = K.ink;
  ctx.strokeText(text, x, y);
  ctx.fillStyle = fill;
  ctx.fillText(text, x, y);
  ctx.restore();
}
