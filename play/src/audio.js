/* Audio: music loops, stingers, SFX and Egyptian-Arabic voice barks from game/audio/ (made by tools/audio), played with WebAudio.
   Nothing starts before the first tap or key (browser rule): call Sound.start() from a gesture. Files that are not loaded yet fall back to tiny synth blips.
   API: Sound.play(name)  sfx / stinger by short name (jump spring coin snap hit stomp power mile click warn meow | over best tier boss)
        Sound.voice(id)   a bark, see Sound.VOICES (jump ash qashta gamed roof power slipper ground)
        Sound.music(name) 'menu' | 'free' | 'tower' | 'night' | null, crossfades; Sound.sync(UI) picks it from the game state each frame
        Sound.setMuted(m), Sound.status() */

const Sound = {
  ctx: null, muted: false, ready: false, want: null, cur: null, bufs: {}, failed: [], ext: null, started: false,
  voiceUntil: 0, voiceLast: -9, stingerSrc: null, night: false, loading: {},
  DIR: 'audio/', LOOP_SEC: 32, FADE: 1.2, MP3_DELAY: 2210 / 24000,
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

  start() {
    if (this.ctx) { this.apply(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    try { this.ctx = new AC(); } catch (e) { this.ctx = null; return; }
    const c = this.ctx;
    this.master = c.createGain(); this.master.gain.value = this.muted ? 0 : 1; this.master.connect(c.destination);
    this.musicBus = c.createGain(); this.musicBus.gain.value = this.GAIN.music; this.musicBus.connect(this.master);
    this.sfxBus = c.createGain(); this.sfxBus.gain.value = this.GAIN.sfx; this.sfxBus.connect(this.master);
    this.voiceBus = c.createGain(); this.voiceBus.gain.value = this.GAIN.voice; this.voiceBus.connect(this.master);
    const probe = document.createElement('audio');
    this.ext = probe.canPlayType && probe.canPlayType('audio/ogg; codecs="vorbis"') ? 'ogg' : 'mp3';
    this.started = true;
    document.addEventListener('visibilitychange', () => this.apply());
    this.apply();
    this.preload();
    if (this.want) this.music(this.want);
  },
  apply() {
    const c = this.ctx;
    if (!c) return;
    if (document.hidden) { if (c.state === 'running') c.suspend().catch(() => null); }
    else if (c.state !== 'running') c.resume().catch(() => null);
  },
  setMuted(m) {
    this.muted = m;
    if (this.master) this.master.gain.setTargetAtTime(m ? 0 : 1, this.ctx.currentTime, 0.03);
    if (m && this.stingerSrc) { try { this.stingerSrc.stop(); } catch (e) { /* already ended */ } }
  },

  load(file) {
    if (this.bufs[file]) return Promise.resolve(this.bufs[file]);
    if (this.loading[file]) return this.loading[file];
    const c = this.ctx;
    this.loading[file] = fetch(this.DIR + file + '.' + this.ext).then(r => { if (!r.ok) throw new Error(r.status); return r.arrayBuffer(); })
      .then(ab => new Promise((ok, no) => { const p = c.decodeAudioData(ab, ok, no); if (p && p.catch) p.catch(no); }))
      .then(b => { this.bufs[file] = b; return b; })
      .catch(() => { if (!this.failed.includes(file)) this.failed.push(file); return null; });
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
  crossTo(name, buf) {
    const c = this.ctx, t = c.currentTime, off = this.ext === 'mp3' ? this.MP3_DELAY : 0;
    this.fadeOut();
    const src = c.createBufferSource(), g = c.createGain();
    src.buffer = buf; src.loop = true; src.loopStart = off; src.loopEnd = off + this.LOOP_SEC;
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
    const t = this.ctx.currentTime, g = this.musicBus.gain, low = this.GAIN.music * this.GAIN.duck;
    g.cancelScheduledValues(t);
    g.setValueAtTime(g.value, t);
    g.linearRampToValueAtTime(low, t + 0.1);
    g.setValueAtTime(low, t + sec);
    g.linearRampToValueAtTime(this.GAIN.music, t + sec + 0.8);
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
    src.start();
    return src;
  },
  voice(id) {
    const v = this.VOICES[id];
    if (this.muted || !this.ctx || !v || !this.bufs[v.file]) return false;
    const now = this.ctx.currentTime, len = this.bufs[v.file].duration;
    if (now < this.voiceUntil || now - this.voiceLast < 1.2) return false;
    this.voiceLast = now;
    this.voiceUntil = now + len;
    this.buffer(v.file, this.voiceBus);
    this.duck(len);
    return true;
  },
  play(name) {
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
    return { started: this.started, ext: this.ext, ready: this.ready, loaded: Object.keys(this.bufs).length, failed: this.failed.slice(), music: this.cur && this.cur.name, want: this.want, muted: this.muted, state: this.ctx && this.ctx.state };
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
