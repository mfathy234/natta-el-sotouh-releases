/* Input: keyboard (always on), plus one pointer/tilt mode from the save: drag, tilt, buttons or mouse.
   Every mode ends in Input.axis(p, dt): -1 = full speed left, +1 = full speed right, in screen terms (never mirrored by dir=rtl). */

const Input = {
  left: false, right: false, space: false, mode: DEFAULT_CONTROLS,
  touch: new Map(), drag: null, mouseX: 0, mouseIn: false, worldX: 0,
  tiltOn: false, tiltSeen: false, tiltRaw: 0, tiltSm: 0, tiltNeutral: null,
  stage: null,
  setMode(m) { this.mode = CONTROL_MODES.includes(m) ? m : DEFAULT_CONTROLS; this.drag = null; this.touch.clear(); },
  reset() { this.left = this.right = this.space = false; this.touch.clear(); this.drag = null; this.mouseIn = false; },
  calibrate() { this.tiltNeutral = this.tiltSeen ? this.tiltSm : null; },
  get tiltUsable() { return this.tiltOn && this.tiltSeen; },
  get effective() { return this.mode === 'tilt' && !this.tiltUsable ? 'drag' : this.mode; },
  /** Hold = a finger or mouse button is down, or Space. The Tower charges while this is true. */
  get holding() { return Boolean(this.drag) || this.space; },
  /** Direct follow: where the hero should be right now (null = use the axis and momentum path). Keys always win. */
  followTarget(p) {
    if (this.left || this.right) return null;
    const m = this.effective, D = this.drag;
    if (m === 'drag' && D) return { x: D.anchorHero + (D.fingerX - D.anchorFinger) * CONTROLS.drag.gain, follow: CONTROLS.drag.follow, max: CONTROLS.drag.maxSpeed };
    if (m === 'mouse' && this.mouseIn && !D && Math.abs(dxWrap(this.mouseX, p.x)) >= CONTROLS.mouse.dead) return { x: this.mouseX, follow: CONTROLS.mouse.follow, max: CONTROLS.mouse.maxSpeed };
    return null;
  },
  dragAxis(p) {
    const D = Input.drag, C = CONTROLS.drag;
    if (!D) return 0;
    const target = D.anchorHero + (D.fingerX - D.anchorFinger) * C.gain;
    let d = dxWrap(target, p.x);
    if (Math.abs(d) > C.leash) { D.anchorHero += d - Math.sign(d) * C.leash; d = Math.sign(d) * C.leash; }
    return Math.abs(d) < C.still ? 0 : clamp((d * C.follow) / PHYS.maxVx, -1, 1);
  },
  tiltAxis(dt) {
    const C = CONTROLS.tilt;
    this.tiltSm += angleDiff(this.tiltRaw, this.tiltSm) * Math.min(1, C.smooth * dt);
    if (this.tiltNeutral == null) this.tiltNeutral = this.tiltSm;
    const a = angleDiff(this.tiltSm, this.tiltNeutral), mag = Math.abs(a);
    if (mag <= C.dead) return 0;
    return Math.sign(a) * Math.pow(clamp((mag - C.dead) / (C.range - C.dead), 0, 1), C.curve);
  },
  axis(p, dt = 1 / 60) {
    const k = (this.right ? 1 : 0) - (this.left ? 1 : 0);
    if (k) return k;
    const m = this.effective;
    if (m === 'tilt') return this.tiltAxis(dt);
    if (m === 'buttons') {
      let t = 0;
      this.touch.forEach(side => { t += side; });
      return clamp(t, -1, 1);
    }
    if (m === 'mouse' && this.mouseIn && !this.drag) {
      const d = dxWrap(this.mouseX, p.x), C = CONTROLS.mouse;
      return Math.abs(d) < C.dead ? 0 : clamp((d * C.follow) / PHYS.maxVx, -1, 1);
    }
    return this.dragAxis(p);
  }
};

const angleDiff = (a, b) => { let d = (a - b) % 360; if (d > 180) d -= 360; if (d < -180) d += 360; return d; };

/** Screen-space sideways tilt in degrees (+ = right edge down) from a DeviceOrientation event, for the current screen rotation. */
function tiltAngle(beta, gamma, screenAngle) {
  const a = ((Math.round(screenAngle || 0) % 360) + 360) % 360;
  if (a === 90) return beta;
  if (a === 270) return -beta;
  if (a === 180) return -gamma;
  return gamma;
}

function initInput(isPlaying) {
  const keyMap = { ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right', Space: 'space' };
  addEventListener('keydown', e => { const k = keyMap[e.code]; if (k) { Input[k] = true; if (isPlaying()) e.preventDefault(); } });
  addEventListener('keyup', e => { const k = keyMap[e.code]; if (k) Input[k] = false; });
  addEventListener('blur', () => Input.reset());
  const stage = Input.stage = Eng.stage;
  const worldX = e => { const r = stage.getBoundingClientRect(); return ((e.clientX - r.left) / r.width) * W; };
  stage.addEventListener('pointerdown', e => {
    if (!isPlaying() || e.target.closest('button')) return;
    const x = worldX(e);
    Input.touch.set(e.pointerId, x < W / 2 ? -1 : 1);
    Input.drag = { id: e.pointerId, fingerX: x, anchorFinger: x, anchorHero: UI.run ? UI.run.p.x : x };
    Input.mouseX = x;
  });
  addEventListener('pointermove', e => {
    const x = worldX(e);
    if (Input.touch.has(e.pointerId)) Input.touch.set(e.pointerId, x < W / 2 ? -1 : 1);
    if (Input.drag && Input.drag.id === e.pointerId) Input.drag.fingerX = x;
    if (e.pointerType === 'mouse') { Input.mouseX = x; Input.mouseIn = x >= 0 && x <= W; }
  });
  stage.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse') Input.mouseIn = false; });
  const up = e => {
    Input.touch.delete(e.pointerId);
    if (Input.drag && Input.drag.id === e.pointerId) Input.drag = null;
  };
  addEventListener('pointerup', up);
  addEventListener('pointercancel', up);
  const screenAngle = () => (screen.orientation && screen.orientation.angle != null ? screen.orientation.angle : window.orientation || 0);
  addEventListener('deviceorientation', e => {
    if (e.gamma == null && e.beta == null) return;
    const first = !Input.tiltSeen;
    Input.tiltRaw = tiltAngle(e.beta || 0, e.gamma || 0, screenAngle());
    if (first) { Input.tiltSeen = true; Input.tiltSm = Input.tiltRaw; }
  });
  const recal = () => { Input.tiltSeen = false; Input.tiltNeutral = null; };
  if (screen.orientation && screen.orientation.addEventListener) screen.orientation.addEventListener('change', recal);
  else addEventListener('orientationchange', recal);
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

if (typeof module !== 'undefined' && module.exports) module.exports = { angleDiff, tiltAngle };
