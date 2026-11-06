/* Picks up a new publish without a hard refresh. The build id comes from window.NATTA_BUILD (stamped by tools/build-web.mjs; absent when serving game/ directly).
   A new service worker (controllerchange) or a different version.json marks an update as pending; the page reloads once, on the menu only. */
const NattaUpdate = {
  build: typeof NATTA_BUILD === 'string' ? NATTA_BUILD : null,
  pending: false,
  reg: null,
  GUARD_KEY: 'natta.upd.reload',
  GUARD_MS: 30000,
  POLL_MS: 300000,

  safe() { return typeof UI === 'undefined' || UI.state === 'menu' || UI.state === 'splash'; },

  init() {
    if (!this.build || location.protocol === 'file:' || !('serviceWorker' in navigator)) return;
    const hadController = !!navigator.serviceWorker.controller;
    navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' }).then(reg => { this.reg = reg; }).catch(() => null);
    navigator.serviceWorker.addEventListener('controllerchange', () => { if (hadController) this.mark(); });
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') this.check(); });
    window.addEventListener('online', () => this.check());
    setInterval(() => this.check(), this.POLL_MS);
    this.check();
  },

  async check() {
    if (!this.build) return;
    try {
      if (this.reg) this.reg.update().catch(() => null);
      const res = await fetch('version.json?t=' + Date.now(), { cache: 'no-store' });
      if (!res.ok) return;
      const j = await res.json();
      if (j && typeof j.build === 'string' && j.build !== this.build) this.mark();
    } catch (e) { /* offline: nothing to compare */ }
  },

  mark() { this.pending = true; this.apply(); },

  apply() {
    if (!this.pending) return;
    if (!this.safe()) { this.chip(true); return; }
    let last = 0;
    try { last = Number(sessionStorage.getItem(this.GUARD_KEY)) || 0; } catch (e) { /* storage blocked */ }
    if (Date.now() - last < this.GUARD_MS) return;
    try { sessionStorage.setItem(this.GUARD_KEY, String(Date.now())); } catch (e) { /* storage blocked */ }
    this.chip(false);
    location.reload();
  },

  onMenu() { this.chip(false); this.apply(); this.check(); },

  chip(show) {
    let el = document.getElementById('updChip');
    if (!el && show) {
      el = document.createElement('div');
      el.id = 'updChip';
      (document.getElementById('game') || document.body).appendChild(el);
    }
    if (!el) return;
    el.textContent = show ? t('updateChip') : '';
    el.classList.toggle('hidden', !show);
  }
};
