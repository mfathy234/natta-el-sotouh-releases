/* The share card: after a run, a 1080 x 1350 PNG drawn on a canvas. The hero (Mar3y slouching by default) on a rooftop ledge,
   the height in big Arabic-Indic digits, a funny line from a pool, the logo and the game URL. Shares as a file through the
   system share sheet when the browser can, and downloads the PNG otherwise. */

const SHARE = { w: 1080, h: 1350, url: 'https://natta-el-sotouh.pages.dev', file: 'natta-el-sotouh.png', heroW: 600 };

const SHARE_LINES = {
  low: [{ ar: 'أنا لسه بسخّن!', en: 'I am only warming up!' }, { ar: 'وقعت بس بشياكة', en: 'I fell, but stylishly' }, { ar: 'الجيران ما لحقوش يشوفوني', en: 'The neighbours missed me' }],
  mid: [{ ar: 'أنا والبلكونة صحاب', en: 'The balcony and I are friends' }, { ar: 'نطّيت أعلى من إيجار الشقة', en: 'Jumped higher than the rent' }, { ar: 'ولا أسانسير ولا حاجة', en: 'No elevator needed' }],
  high: [{ ar: 'الحمام بقى تحتي!', en: 'The pigeons are below me now!' }, { ar: 'وصلت فوق الدِش والمنارة', en: 'Above the dishes and the minaret' }, { ar: 'سلّموا لي على الجيران', en: 'Say hi to the neighbours for me' }],
  best: [{ ar: 'رقم قياسي جديد، والسمك لسه بعيد', en: 'New record, and the fish is still far' }, { ar: 'أحسن نطّة في حياتي', en: 'Best bounce of my life' }],
  tower: [{ ar: 'طلعت أدوار من غير أسانسير!', en: 'Climbed floors with no elevator!' }, { ar: 'البرج ده بيعرفني بالاسم', en: 'This tower knows me by name' }]
};

/** A line for a result: kind free/daily/tower, value (m or floors), newBest. rnd is injectable for tests. */
function shareLine(kind, value, newBest, rnd = Math.random) {
  const pool = kind === 'tower' ? SHARE_LINES.tower : newBest ? SHARE_LINES.best : value >= 200 ? SHARE_LINES.high : value >= 60 ? SHARE_LINES.mid : SHARE_LINES.low;
  return pool[Math.floor(rnd() * pool.length) % pool.length];
}

/** "وصلت ٢٤٣ م" / "I reached 243 m" (floors for the Tower). */
function shareHeadline(kind, value, lang) {
  const v = lang === 'ar' ? toArabicDigits(value) : String(value);
  if (lang === 'ar') return kind === 'tower' ? `وصلت دور ${v}` : `وصلت ${v} م`;
  return kind === 'tower' ? `I reached floor ${v}` : `I reached ${v} m`;
}

function hiImage(vb, body, w, h) {
  const img = new Image();
  img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgDoc(vb, body, `width="${w}" height="${h}"`));
  return img.decode().then(() => img);
}

/** The hero at full size: Mar3y shows a mood (proud on a best, unimpressed on a short run), others the slouch. */
async function shareHeroImage(heroId, newBest, value) {
  const w = SHARE.heroW, h = Math.round(w * 136 / 146);
  const art = heroId === 'marei' ? mareiSlouch({ mode: newBest ? 'proud' : value < 30 ? 'meh' : 'calm' }) : HERO_ART[heroId]('slouch');
  return { img: await hiImage('-10 -2 146 136', art, w, h), w, h };
}

async function drawShareHero(ctx, info, x, yBottom) {
  const { img, w, h } = await shareHeroImage(info.hero, info.newBest, info.value), u = w / HERO_UNITS.w, top = yBottom - h, left = x - w / 2;
  ctx.drawImage(img, left, top, w, h);
  for (const slot of LOOK_SLOTS) {
    const look = LOOKS.find(l => l.id === (info.worn || {})[slot]), pl = look && lookPlace(info.hero, look, 'slouch');
    if (!pl) continue;
    const size = Math.round(64 * pl.s * u), li = await hiImage(LOOK_VB, LOOK_ART[look.id](), size, size);
    ctx.save();
    ctx.translate(left + (pl.x + HERO_UNITS.ox) * u, top + (pl.y + HERO_UNITS.oy) * u);
    ctx.rotate((pl.rot * Math.PI) / 180);
    ctx.drawImage(li, -size / 2, -size / 2, size, size);
    ctx.restore();
  }
}

function shareWrap(ctx, text, maxW) {
  const words = text.split(' '), lines = [];
  let cur = '';
  words.forEach(wd => {
    const next = cur ? cur + ' ' + wd : wd;
    if (ctx.measureText(next).width > maxW && cur) { lines.push(cur); cur = wd; } else cur = next;
  });
  if (cur) lines.push(cur);
  return lines;
}

function shareStroked(ctx, text, x, y, font, fill, stroke, lw) {
  ctx.font = font;
  ctx.lineJoin = 'round';
  ctx.lineWidth = lw;
  ctx.strokeStyle = stroke;
  ctx.strokeText(text, x, y);
  ctx.fillStyle = fill;
  ctx.fillText(text, x, y);
}

function shareBackdrop(ctx) {
  const { w, h } = SHARE, g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, '#c9a7e8');
  g.addColorStop(0.55, '#ffb59e');
  g.addColorStop(1, '#ffd9bd');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = 'rgba(255,210,63,.25)';
  ctx.beginPath(); ctx.arc(840, 400, 190, 0, 7); ctx.fill();
  ctx.fillStyle = 'rgba(255,210,63,.9)';
  ctx.beginPath(); ctx.arc(840, 400, 130, 0, 7); ctx.fill();
  const cl = (x, y, s) => { ctx.fillStyle = 'rgba(255,250,246,.75)'; [[0, 0, 60], [64, -18, 70], [130, 0, 56], [64, 22, 56]].forEach(([dx, dy, r]) => { ctx.beginPath(); ctx.arc(x + dx * s, y + dy * s, r * s, 0, 7); ctx.fill(); }); };
  cl(120, 560, 0.9); cl(760, 700, 0.7);
  ['bg:skyline', 'bg:rooftops'].forEach((k, i) => { const s = SPR[k]; if (s) ctx.drawImage(s.img, 0, SHARE.h - s.h * 3 + (i ? 20 : -240), s.w * 3, s.h * 3); });
  const ly = 1130;
  ctx.fillStyle = '#d98a6a';
  ctx.fillRect(0, ly, w, h - ly);
  ctx.fillStyle = '#cf7c5c';
  for (let x = 0; x < w; x += 170) ctx.fillRect(x + 160, ly, 10, h - ly);
  ctx.fillStyle = '#f3c9a4';
  ctx.fillRect(0, ly, w, 24);
  ctx.strokeStyle = '#2a1f3d';
  ctx.lineWidth = 10;
  ctx.beginPath(); ctx.moveTo(0, ly); ctx.lineTo(w, ly); ctx.stroke();
  return ly;
}

/** Draw the card. info: { hero, worn, kind, value, newBest, lang, line: {ar, en} }. Returns the canvas. */
async function buildShareCard(info) {
  try { await Promise.all([document.fonts.load('100px Lalezar', 'نطة'), document.fonts.load('700 40px Cairo', 'Aa ي')]); } catch (e) { /* fonts are optional */ }
  const cv = document.createElement('canvas');
  cv.width = SHARE.w;
  cv.height = SHARE.h;
  const ctx = cv.getContext('2d'), ar = info.lang === 'ar', c = SHARE.w / 2;
  ctx.direction = ar ? 'rtl' : 'ltr';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  const ly = shareBackdrop(ctx);
  shareStroked(ctx, ar ? 'نطّة السطوح' : 'NATTA EL SOTOUH', c, 150, ar ? '130px Lalezar' : '110px Lalezar', '#ffd23f', '#2a1f3d', 26);
  shareStroked(ctx, ar ? 'NATTA EL SOTOUH' : 'نطّة السطوح', c, 215, '700 44px Cairo', '#fffaf6', '#2a1f3d', 12);
  const head = shareHeadline(info.kind, info.value, info.lang);
  let size = 210;
  ctx.font = `${size}px Lalezar`;
  while (ctx.measureText(head).width > 900 && size > 90) { size -= 8; ctx.font = `${size}px Lalezar`; }
  shareStroked(ctx, head, c, 430, `${size}px Lalezar`, '#fffaf6', '#2a1f3d', Math.round(size / 6));
  ctx.font = '700 50px Cairo';
  const text = ar ? info.line.ar : info.line.en, lines = shareWrap(ctx, text, 800), bh = lines.length * 62 + 36;
  ctx.fillStyle = '#fffaf6';
  ctx.strokeStyle = '#2a1f3d';
  ctx.lineWidth = 8;
  const bx = 110, bw = SHARE.w - 220, by = 480;
  ctx.beginPath(); ctx.roundRect(bx, by, bw, bh, 46); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#2a1f3d';
  lines.forEach((l, i) => ctx.fillText(l, c, by + 58 + i * 62));
  await drawShareHero(ctx, info, c, ly + 40);
  ctx.fillStyle = '#2a1f3d';
  ctx.beginPath(); ctx.roundRect(c - 380, 1250, 760, 72, 36); ctx.fill();
  ctx.direction = 'ltr';
  ctx.fillStyle = '#ffd23f';
  ctx.font = '700 40px Cairo';
  ctx.fillText(SHARE.url.replace('https://', ''), c, 1299);
  return cv;
}

const canvasBlob = cv => new Promise(res => cv.toBlob(res, 'image/png'));

/** Share the last run: the system share sheet with the PNG as a file, or a download when that is not possible. */
async function shareLastRun() {
  const last = UI.last;
  if (!last) return false;
  try {
    const blob = await canvasBlob(await buildShareCard({ ...last, lang: LANG.cur }));
    const file = new File([blob], SHARE.file, { type: 'image/png' });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try { await navigator.share({ files: [file], title: t('title'), text: t('shareText', shareHeadline(last.kind, last.value, LANG.cur)) + ' ' + SHARE.url }); return true; } catch (e) { if (e && e.name === 'AbortError') return false; }
    }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = SHARE.file;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    toast(t('shareSaved'));
    return true;
  } catch (e) { toast(t('shareFail')); return false; }
}

if (typeof module !== 'undefined' && module.exports) module.exports = { shareLine, shareHeadline, SHARE_LINES };
