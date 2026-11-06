/* Settings model, pure and immutable. Everything lives in save.prefs (sanitized here); language, controls, mute and the ghost toggle keep their old
   top-level save fields. Also the small runtime helpers the rest of the game reads: Calm (reduced motion) and Haptic (vibration). */

const APP_VERSION = '1.0.0';
const PREF_BOOLS = ['voices', 'vibrate', 'calm', 'fps'];
const PREF_LEVELS = ['music', 'sfx'];

const newPrefs = () => ({ music: 100, sfx: 100, voices: true, vibrate: true, calm: false, fps: false });

function sanitizePrefs(raw) {
  const r = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {}, d = newPrefs();
  const level = (v, def) => (Number.isFinite(Number(v)) && v !== null && v !== '' ? Math.max(0, Math.min(100, Math.round(Number(v)))) : def);
  return {
    music: level(r.music, d.music), sfx: level(r.sfx, d.sfx),
    voices: r.voices !== false, vibrate: r.vibrate !== false, calm: r.calm === true, fps: r.fps === true
  };
}

/** Change one preference. Unknown keys and bad values leave the save as it was. */
function setPref(save, key, value) {
  if (!PREF_LEVELS.includes(key) && !PREF_BOOLS.includes(key)) return save;
  const prefs = sanitizePrefs({ ...save.prefs, [key]: value });
  return JSON.stringify(prefs) === JSON.stringify(save.prefs) ? save : { ...save, prefs };
}

/** The build line shown at the bottom of the settings screen. */
const versionLine = (build, version = APP_VERSION) => 'v' + version + ' · ' + (build || 'dev');

/** Reduced motion: the player's choice, or the phone's own setting. */
const Calm = {
  mq: null,
  on() {
    if (typeof UI !== 'undefined' && UI.save && UI.save.prefs && UI.save.prefs.calm) return true;
    if (this.mq === null) this.mq = typeof matchMedia === 'function' ? matchMedia('(prefers-reduced-motion: reduce)') : false;
    return Boolean(this.mq && this.mq.matches);
  }
};

/** Vibration (Android and a few browsers; iOS Safari has none). */
const Haptic = {
  can() { return typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function'; },
  buzz(pattern) {
    if (!this.can() || typeof UI === 'undefined' || !UI.save || !UI.save.prefs.vibrate) return;
    try { navigator.vibrate(pattern); } catch (e) { /* not allowed before a tap */ }
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { APP_VERSION, newPrefs, sanitizePrefs, setPref, versionLine, PREF_BOOLS, PREF_LEVELS };
}
