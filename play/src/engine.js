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

/* ---------- input: keyboard, touch halves, tilt ---------- */
const Input = {
  left: false, right: false, touch: new Map(), tilt: 0, tiltOn: false, tiltSeen: false,
  axis() {
    const k = (this.right ? 1 : 0) - (this.left ? 1 : 0);
    if (k) return k;
    let t = 0;
    this.touch.forEach(side => { t += side; });
    if (t) return clamp(t, -1, 1);
    return this.tiltOn ? this.tilt : 0;
  }
};

function initInput(isPlaying) {
  const keyMap = { ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right' };
  addEventListener('keydown', e => { const k = keyMap[e.code]; if (k) { Input[k] = true; if (isPlaying()) e.preventDefault(); } });
  addEventListener('keyup', e => { const k = keyMap[e.code]; if (k) Input[k] = false; });
  addEventListener('blur', () => { Input.left = Input.right = false; Input.touch.clear(); });
  const stage = Eng.stage;
  const side = e => (e.clientX - stage.getBoundingClientRect().left < stage.clientWidth / 2 ? -1 : 1);
  stage.addEventListener('pointerdown', e => {
    if (!isPlaying() || e.target.closest('button')) return;
    Input.touch.set(e.pointerId, side(e));
  });
  stage.addEventListener('pointermove', e => { if (Input.touch.has(e.pointerId)) Input.touch.set(e.pointerId, side(e)); });
  const up = e => Input.touch.delete(e.pointerId);
  addEventListener('pointerup', up);
  addEventListener('pointercancel', up);
  addEventListener('deviceorientation', e => {
    if (e.gamma == null) return;
    Input.tiltSeen = true;
    Input.tilt = clamp(e.gamma / 20, -1, 1);
  });
}

/** Turn tilt on. iOS needs a permission request from a tap. Resolves to true when tilt is usable. */
async function enableTilt() {
  const D = window.DeviceOrientationEvent;
  if (D && typeof D.requestPermission === 'function') {
    try { if ((await D.requestPermission()) !== 'granted') return false; } catch (e) { return false; }
  }
  Input.tiltOn = true;
  return true;
}
