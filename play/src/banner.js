/* On-screen banners, drawn on the canvas: tier / event / boss strips at the top and big centred combo shouts.
   s.banners holds { text: { ar, en }, kind, t, life }. Everything is skipped in the menu demo. */

function bannerPush(s, text, kind = 'tier') {
  if (!s.banners) s.banners = [];
  const life = kind === 'shout' ? BANNER.shoutTime : BANNER.time;
  if (kind === 'shout') s.banners = s.banners.filter(b => b.kind !== 'shout');
  s.banners.push({ text, kind, t: 0, life });
  if (s.banners.filter(b => b.kind !== 'shout').length > BANNER.strips) {
    const i = s.banners.findIndex(b => b.kind !== 'shout');
    s.banners.splice(i, 1);
  }
}

function updateBanners(s, dt) {
  if (!s.banners || !s.banners.length) return;
  s.banners.forEach(b => { b.t += dt; });
  s.banners = s.banners.filter(b => b.t < b.life);
}

const BANNER_COLORS = { tier: ['#fff4ec', '#2fbfa6'], event: ['#fff4ec', '#ffd23f'], boss: ['#fff4ec', '#d63a2f'] };

function bannerFont(size) {
  return LANG.cur === 'ar' ? `${size}px Lalezar, Cairo, sans-serif` : `700 ${size}px Cairo, Lalezar, sans-serif`;
}

function fitFont(ctx, text, maxW, size) {
  let sz = size;
  ctx.font = bannerFont(sz);
  while (sz > 11 && ctx.measureText(text).width > maxW) { sz -= 1; ctx.font = bannerFont(sz); }
  return sz;
}

function renderStrip(ctx, b, row) {
  const text = pick(b.text), k = b.t / b.life;
  const inK = clamp(b.t / 0.3, 0, 1), outK = clamp((b.life - b.t) / 0.4, 0, 1);
  const slide = (1 - (1 - Math.pow(1 - inK, 3))) * -34, alpha = Math.min(inK, outK);
  const [fill, accent] = BANNER_COLORS[b.kind] || BANNER_COLORS.tier;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.direction = LANG.cur === 'ar' ? 'rtl' : 'ltr';
  const sz = fitFont(ctx, text, W - 56, 22), y = BANNER.y + row * 46 + slide, w = Math.min(W - 20, ctx.measureText(text).width + 40), h = 38;
  ctx.fillStyle = fill; ctx.strokeStyle = K.ink; ctx.lineWidth = 3.5; ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.roundRect(W / 2 - w / 2, y - h / 2, w, h, 12); ctx.fill(); ctx.stroke();
  ctx.fillStyle = accent; ctx.beginPath(); ctx.roundRect(W / 2 - w / 2 + 5, y - h / 2 + 5, 7, h - 10, 3); ctx.fill();
  ctx.beginPath(); ctx.roundRect(W / 2 + w / 2 - 12, y - h / 2 + 5, 7, h - 10, 3); ctx.fill();
  ctx.font = bannerFont(sz); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillStyle = K.ink; ctx.fillText(text, W / 2, y + 1);
  ctx.restore();
  return k;
}

function renderShout(ctx, b) {
  const text = pick(b.text), k = b.t / b.life;
  const pop = b.t < 0.18 ? 0.5 + (b.t / 0.18) * 0.9 : b.t < 0.3 ? 1.4 - ((b.t - 0.18) / 0.12) * 0.4 : 1;
  const alpha = clamp((1 - k) / 0.3, 0, 1), y = H * 0.4 - k * 26, size = 58 * pop;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.direction = LANG.cur === 'ar' ? 'rtl' : 'ltr';
  ctx.translate(W / 2, y); ctx.rotate(-0.06);
  ctx.font = bannerFont(size); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
  ctx.lineWidth = size * 0.26; ctx.strokeStyle = K.ink; ctx.strokeText(text, 0, 0);
  ctx.fillStyle = b.t % 0.2 < 0.1 ? K.gold : K.orange; ctx.fillText(text, 0, 0);
  ctx.restore();
}

function renderBanners(s) {
  if (!s.banners || !s.banners.length) return;
  const ctx = Eng.ctx;
  let row = 0;
  s.banners.forEach(b => { if (b.kind === 'shout') renderShout(ctx, b); else renderStrip(ctx, b, row++); });
}
