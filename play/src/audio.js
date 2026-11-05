/* Audio: tiny WebAudio synth blips. No files. Starts on the first tap or key (browser rule). */

const Sound = {
  ctx: null, muted: false,
  start() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (AC) { try { this.ctx = new AC(); } catch (e) { this.ctx = null; } }
  },
  setMuted(m) { this.muted = m; },
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
    osc.connect(g).connect(c.destination);
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
    src.connect(g).connect(c.destination);
    src.start();
  },
  play(name) {
    switch (name) {
      case 'jump': this.tone(330, 0.12, { to: 620, type: 'triangle', vol: 0.14 }); break;
      case 'spring': this.tone(220, 0.28, { to: 980, type: 'sawtooth', vol: 0.1 }); this.tone(660, 0.2, { to: 1320, type: 'triangle', delay: 0.05 }); break;
      case 'coin': this.tone(988, 0.07, { vol: 0.09 }); this.tone(1318, 0.14, { vol: 0.09, delay: 0.06 }); break;
      case 'snap': this.noise(0.12, 0.14); this.tone(180, 0.1, { to: 90, type: 'sawtooth', vol: 0.08 }); break;
      case 'hit': this.noise(0.25, 0.16); this.tone(200, 0.3, { to: 60, type: 'sawtooth', vol: 0.14 }); break;
      case 'stomp': this.tone(260, 0.1, { to: 520, type: 'square', vol: 0.12 }); this.noise(0.08, 0.1); break;
      case 'power': [523, 659, 784, 1046].forEach((f, i) => this.tone(f, 0.12, { type: 'triangle', vol: 0.1, delay: i * 0.06 })); break;
      case 'mile': [392, 523, 659].forEach((f, i) => this.tone(f, 0.16, { type: 'triangle', vol: 0.1, delay: i * 0.09 })); break;
      case 'over': [330, 262, 196].forEach((f, i) => this.tone(f, 0.28, { type: 'triangle', vol: 0.12, delay: i * 0.18 })); break;
      case 'click': this.tone(700, 0.05, { vol: 0.07 }); break;
      case 'warn': this.tone(880, 0.08, { vol: 0.06 }); break;
      default: break;
    }
  }
};
