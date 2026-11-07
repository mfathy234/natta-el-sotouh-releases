/* Audio: music loops, stingers, SFX and Egyptian-Arabic voice barks from game/audio/ (made by tools/audio), played with WebAudio.
   Nothing starts before the first tap or key (browser rule); Sound.arm() listens for it and creates / resumes the context. Files that are not loaded
   yet fall back to tiny synth blips.
   API: Sound.play(name)  sfx / stinger by short name (jump spring coin snap hit stomp power mile click warn meow | over best tier boss)
        Sound.voice(id)   a bark, see Sound.VOICES (jump ash qashta gamed roof power slipper ground)
        Sound.music(name) 'menu' | 'free' | 'tower' | 'night' | null, crossfades; Sound.sync(UI) picks it from the game state each frame
        Sound.setMuted(m), Sound.setPrefs(save.prefs) (music / sfx volume 0-100, voices on or off), Sound.status()
   Phones: the context is created and resumed from the first tap anywhere and again after any interruption (call, lock, tab switch); iOS is told to
   play on the media channel so the silent switch does not mute it; Safari gets mp3 and any ogg that fails to decode falls back to mp3; everything
   goes through a limiter so music + sfx + voice can never clip. */

const Sound = {
  ctx: null, muted: false, ready: false, want: null, cur: null, bufs: {}, failed: [], ext: null, started: false,
  voiceUntil: 0, voiceLast: -9, stingerSrc: null, night: false, loading: {}, armed: false, silent: null,
  vol: { music: 1, sfx: 1, voices: true },
  DIR: 'audio/', LOOP_SEC: 32, FADE: 1.2, MP3_DELAY: 1105 / 24000,
  TRACKS: { menu: 'music_menu', free: 'music_free', tower: 'music_tower', night: 'music_night' },
  SFX: {
    jump: 'sfx_jump', spring: 'sfx_spring', coin: 'sfx_coin', snap: 'sfx_snap', hit: 'sfx_hurt', stomp: 'sfx_stomp',
    power: 'sfx_power', mile: 'sfx_mile', click: 'sfx_click', warn: 'sfx_warn', meow: 'sfx_meow'
  },
  STINGERS: { over: 'stinger_over', best: 'stinger_best', tier: 'stinger_tier', boss: 'stinger_boss' },
  VOICES: {
    jump: { file: 'vo_jump', text: 'نُطّ يا مرعي!', use: 'run start' },
    ash: { file: 'vo_ash', text: 'عاش!', use: 'new best, combo praise' },
    qashta: { file: 'vo_qashta', text: 'قشطة!', use: 'power-up / long chain' },
    gamed: { file: 'vo_gamed', text: 'يا جامد!', use: 'big spring / milestone' },
    roof: { file: 'vo_roof', text: 'وصلت السطوح!', use: 'Tower top reached' },
    power: { file: 'vo_power', text: 'الكهربا قطعت!', use: 'night / dark twist starts' },
    slipper: { file: 'vo_slipper', text: 'حاسب الشبشب!', use: 'slipper enemy warn' },
    ground: { file: 'vo_ground', text: 'رجعت للدور الأرضي!', use: 'Tower fall to the ground floor' }
  },
  GAIN: { music: 0.8, sfx: 0.9, voice: 1, duck: 0.35 },

  isIos() {
    const ua = navigator.userAgent || '';
    return /iP(hone|ad|od)/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
  },
  isSafari() {
    const ua = navigator.userAgent || '';
    return this.isIos() || (/Safari/.test(ua) && !/Chrome|Chromium|CriOS|FxiOS|Android|Edg/.test(ua));
  },
  pickExt() {
    if (this.isSafari()) return 'mp3';
    const probe = document.createElement('audio');
    return probe.canPlayType && probe.canPlayType('audio/ogg; codecs="vorbis"') ? 'ogg' : 'mp3';
  },
  musicGain() { return this.GAIN.music * this.vol.music; },
  sfxGain() { return this.GAIN.sfx * this.vol.sfx; },
  voiceGain() { return this.GAIN.voice * this.vol.sfx; },

  /* The graph, on any context (the audio test builds it on an OfflineAudioContext): buses -> master -> limiter -> output. */
  build(c) {
    this.master = c.createGain(); this.master.gain.value = this.muted ? 0 : 1;
    const l = this.limiter = c.createDynamicsCompressor();
    l.threshold.value = -6; l.knee.value = 3; l.ratio.value = 20; l.attack.value = 0.002; l.release.value = 0.12;
    this.trim = c.createGain(); this.trim.gain.value = 0.94;
    this.master.connect(l); l.connect(this.trim); this.trim.connect(c.destination);
    this.musicBus = c.createGain(); this.musicBus.gain.value = this.musicGain(); this.musicBus.connect(this.master);
    this.sfxBus = c.createGain(); this.sfxBus.gain.value = this.sfxGain(); this.sfxBus.connect(this.master);
    this.voiceBus = c.createGain(); this.voiceBus.gain.value = this.voiceGain(); this.voiceBus.connect(this.master);
  },
  arm() {
    if (this.armed || typeof document === 'undefined') return;
    this.armed = true;
    const go = () => { if (!this.ctx) this.start(); else if (this.ctx.state !== 'running') this.apply(); this.keepAwake(); };
    ['pointerup', 'touchend', 'click', 'keydown'].forEach(ev => document.addEventListener(ev, go, true));
    document.addEventListener('visibilitychange', () => this.apply());
    addEventListener('pageshow', () => this.apply());
    addEventListener('pagehide', () => this.apply());
  },
  start() {
    if (this.ctx) { this.apply(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    try { this.ctx = new AC(); } catch (e) { this.ctx = null; return; }
    this.build(this.ctx);
    this.ext = this.pickExt();
    this.started = true;
    try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch (e) { /* not supported */ }
    this.keepAwake();
    this.prime();
    this.apply();
    this.preload();
    if (this.want) this.music(this.want);
  },
  prime() {
    try {
      const c = this.ctx, src = c.createBufferSource();
      src.buffer = c.createBuffer(1, 1, 22050);
      src.connect(c.destination);
      src.start(0);
    } catch (e) { /* the first real sound unlocks it instead */ }
  },
  /* iOS before 17 has no audioSession: a silent looping <audio> moves WebAudio to the media channel, which the ring/silent switch does not mute. */
  keepAwake() {
    if (!this.isIos() || navigator.audioSession) return;
    if (!this.silent) {
      const n = 4000, b = new Uint8Array(44 + n), v = new DataView(b.buffer), w = (o, str) => { for (let i = 0; i < str.length; i++) b[o + i] = str.charCodeAt(i); };
      w(0, 'RIFF'); v.setUint32(4, 36 + n, true); w(8, 'WAVEfmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
      v.setUint32(24, 8000, true); v.setUint32(28, 8000, true); v.setUint16(32, 1, true); v.setUint16(34, 8, true); w(36, 'data'); v.setUint32(40, n, true);
      b.fill(128, 44);
      const a = document.createElement('audio');
      a.src = URL.createObjectURL(new Blob([b], { type: 'audio/wav' }));
      a.loop = true; a.setAttribute('playsinline', ''); a.volume = 0.01;
      this.silent = a;
    }
    if (this.silent.paused && !document.hidden) { const p = this.silent.play(); if (p && p.catch) p.catch(() => null); }
  },
  apply() {
    const c = this.ctx;
    if (!c) return;
    if (document.hidden) {
      if (c.state === 'running') c.suspend().catch(() => null);
      if (this.silent) this.silent.pause();
    } else {
      if (c.state !== 'running') c.resume().catch(() => null);
      this.keepAwake();
    }
  },
  setPrefs(p) {
    const q = p || {};
    this.vol = { music: (q.music == null ? 100 : q.music) / 100, sfx: (q.sfx == null ? 100 : q.sfx) / 100, voices: q.voices !== false };
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    this.musicBus.gain.cancelScheduledValues(t);
    this.musicBus.gain.setTargetAtTime(this.musicGain(), t, 0.03);
    this.sfxBus.gain.setTargetAtTime(this.sfxGain(), t, 0.03);
    this.voiceBus.gain.setTargetAtTime(this.voiceGain(), t, 0.03);
  },
  setMuted(m) {
    this.muted = m;
    if (this.master) this.master.gain.setTargetAtTime(m ? 0 : 1, this.ctx.currentTime, 0.03);
    if (m && this.stingerSrc) { try { this.stingerSrc.stop(); } catch (e) { /* already ended */ } }
  },

  fetchDecode(file, ext) {
    const c = this.ctx;
    return fetch(this.DIR + file + '.' + ext + (typeof NATTA_BUILD === 'string' ? '?v=' + NATTA_BUILD : '')).then(r => { if (!r.ok) throw new Error(r.status); return r.arrayBuffer(); })
      .then(ab => new Promise((ok, no) => { const p = c.decodeAudioData(ab, ok, no); if (p && p.catch) p.catch(no); }));
  },
  load(file) {
    if (this.bufs[file]) return Promise.resolve(this.bufs[file]);
    if (this.loading[file]) return this.loading[file];
    this.loading[file] = this.fetchDecode(file, this.ext)
      .catch(err => {
        if (this.ext !== 'ogg') throw err;
        this.ext = 'mp3';
        return this.fetchDecode(file, 'mp3');
      })
      .then(b => { this.bufs[file] = b; return b; })
      .catch(() => { delete this.loading[file]; if (!this.failed.includes(file)) this.failed.push(file); return null; });
    return this.loading[file];
  },
  preload() {
    const small = [...Object.values(this.SFX), ...Object.values(this.STINGERS), ...Object.values(this.VOICES).map(v => v.file)];
    const first = this.TRACKS[this.want] || this.TRACKS.menu;
    this.load(first)
      .then(() => Promise.all(small.map(f => this.load(f))))
      .then(() => Promise.all(Object.values(this.TRACKS).map(f => this.load(f))))
      .then(() => { this.ready = true; });
  },

  music(name) {
    this.want = name || null;
    if (!this.ctx) return;
    if (!name) { this.fadeOut(); return; }
    if (this.cur && this.cur.name === name) return;
    this.load(this.TRACKS[name]).then(buf => {
      if (!buf || this.want !== name || (this.cur && this.cur.name === name)) return;
      this.crossTo(name, buf);
    });
  },
  /* An mp3 that kept its encoder delay is longer than the 32 s loop, so the loop starts after the delay; a trimmed one (Safari) starts at 0. */
  crossTo(name, buf) {
    const c = this.ctx, t = c.currentTime, off = buf.duration > this.LOOP_SEC + 0.03 ? this.MP3_DELAY : 0;
    this.fadeOut();
    const src = c.createBufferSource(), g = c.createGain();
    src.buffer = buf; src.loop = true; src.loopStart = off; src.loopEnd = Math.min(off + this.LOOP_SEC, buf.duration);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(1, t + this.FADE);
    src.connect(g).connect(this.musicBus);
    src.start(0, off);
    this.cur = { name, src, g };
  },
  fadeOut() {
    const old = this.cur, c = this.ctx;
    if (!old) return;
    this.cur = null;
    const t = c.currentTime;
    old.g.gain.cancelScheduledValues(t);
    old.g.gain.setValueAtTime(old.g.gain.value, t);
    old.g.gain.linearRampToValueAtTime(0.0001, t + this.FADE);
    try { old.src.stop(t + this.FADE + 0.05); } catch (e) { /* already stopped */ }
  },
  duck(sec) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime, g = this.musicBus.gain, full = this.musicGain(), low = full * this.GAIN.duck;
    g.cancelScheduledValues(t);
    g.setValueAtTime(g.value, t);
    g.linearRampToValueAtTime(low, t + 0.1);
    g.setValueAtTime(low, t + sec);
    g.linearRampToValueAtTime(full, t + sec + 0.8);
  },
  sync(ui) {
    if (!this.started) return;
    const run = ui.state === 'play' || ui.state === 'pause' ? ui.run : null;
    let track = 'menu';
    if (run) {
      if (run.tower) track = 'tower';
      else {
        const dark = !!(run.twist && run.twist.night);
        if (run.meters >= 900) this.night = true;
        else if (run.meters < 300) this.night = false;
        track = this.night || dark ? 'night' : 'free';
      }
    } else this.night = false;
    if (track !== this.want) this.music(track);
  },

  buffer(file, bus, vol = 1, rate = 1) {
    const b = this.bufs[file];
    if (!b || !this.ctx) return null;
    const src = this.ctx.createBufferSource(), g = this.ctx.createGain();
    src.buffer = b; src.playbackRate.value = rate; g.gain.value = vol;
    src.connect(g).connect(bus);
    try { src.start(); } catch (e) { return null; }
    return src;
  },
  voice(id) {
    const v = this.VOICES[id];
    if (this.muted || !this.vol.voices || !this.ctx || !v || !this.bufs[v.file]) return false;
    const now = this.ctx.currentTime, len = this.bufs[v.file].duration;
    if (now < this.voiceUntil || now - this.voiceLast < (typeof barkGap === 'function' ? barkGap() : 3)) return false;
    this.voiceLast = now;
    this.voiceUntil = now + len;
    this.buffer(v.file, this.voiceBus);
    this.duck(len);
    return true;
  },
  play(name) {
    if (typeof Haptic !== 'undefined') { if (name === 'hit') Haptic.buzz(40); else if (name === 'over') Haptic.buzz([70, 40, 110]); }
    if (this.muted || !this.ctx) return;
    const st = this.STINGERS[name];
    if (st && this.bufs[st]) {
      if (this.stingerSrc) { try { this.stingerSrc.stop(); } catch (e) { /* already ended */ } }
      this.stingerSrc = this.buffer(st, this.sfxBus, 1);
      this.duck(this.bufs[st].duration);
      return;
    }
    const file = this.SFX[name];
    if (file && this.bufs[file]) {
      this.buffer(file, this.sfxBus, name === 'warn' || name === 'click' ? 0.8 : 1, name === 'coin' ? 1 + (Math.random() - 0.5) * 0.04 : 1);
      return;
    }
    this.fallback(name);
  },
  status() {
    return { started: this.started, ext: this.ext, ready: this.ready, loaded: Object.keys(this.bufs).length, failed: this.failed.slice(), music: this.cur && this.cur.name, want: this.want, muted: this.muted, state: this.ctx && this.ctx.state, vol: this.vol };
  },

  tone(freq, dur, o = {}) {
    if (this.muted || !this.ctx) return;
    const { type = 'square', vol = 0.12, to = freq, delay = 0 } = o;
    const c = this.ctx, t0 = c.currentTime + delay;
    const osc = c.createOscillator(), g = c.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    osc.frequency.exponentialRampToValueAtTime(Math.max(30, to), t0 + dur);
    g.gain.setValueAtTime(vol, t0);
    g.gain.exponentialRampToValueAtTime(0.0008, t0 + dur);
    osc.connect(g).connect(this.sfxBus);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  },
  noise(dur, vol = 0.1) {
    if (this.muted || !this.ctx) return;
    const c = this.ctx, n = Math.floor(c.sampleRate * dur), buf = c.createBuffer(1, n, c.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
    const src = c.createBufferSource(), g = c.createGain();
    src.buffer = buf;
    g.gain.value = vol;
    src.connect(g).connect(this.sfxBus);
    src.start();
  },
  fallback(name) {
    switch (name) {
      case 'jump': this.tone(330, 0.12, { to: 620, type: 'triangle', vol: 0.14 }); break;
      case 'spring': this.tone(220, 0.28, { to: 980, type: 'sawtooth', vol: 0.1 }); break;
      case 'coin': this.tone(988, 0.07, { vol: 0.09 }); this.tone(1318, 0.14, { vol: 0.09, delay: 0.06 }); break;
      case 'snap': this.noise(0.12, 0.14); break;
      case 'hit': this.noise(0.25, 0.16); this.tone(200, 0.3, { to: 60, type: 'sawtooth', vol: 0.14 }); break;
      case 'stomp': this.tone(260, 0.1, { to: 520, type: 'square', vol: 0.12 }); break;
      case 'power': [523, 659, 784, 1046].forEach((f, i) => this.tone(f, 0.12, { type: 'triangle', vol: 0.1, delay: i * 0.06 })); break;
      case 'mile': [392, 523, 659].forEach((f, i) => this.tone(f, 0.16, { type: 'triangle', vol: 0.1, delay: i * 0.09 })); break;
      case 'over': [330, 262, 196].forEach((f, i) => this.tone(f, 0.28, { type: 'triangle', vol: 0.12, delay: i * 0.18 })); break;
      case 'click': this.tone(700, 0.05, { vol: 0.07 }); break;
      case 'warn': this.tone(880, 0.08, { vol: 0.06 }); break;
      default: break;
    }
  }
};

Sound.arm();
