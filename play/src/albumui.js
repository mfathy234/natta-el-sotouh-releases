/* Album and achievements screens, the achievement toast queue, and the glue between a run and the meta rules (src/meta.js).
   NattaEvents ('hazard', 'achievement') carry what happens, so other files never call into this one. */

const ALBUM = { tab: 'album', toasts: [], showing: false };

/** What a finished run tells the meta layer. */
function runMetaInfo(s, kind, newBest) {
  const st = s.stats || {};
  return { kind, meters: kind === 'tower' ? s.maxFloor : s.meters, newBest, pigeons: st.pigeons || 0, coins: st.coins || 0, kites: st.kites || 0, ful: st.ful || 0, beads: st.beads || 0, hazards: [...UI.hazards] };
}

/** Called every frame of a run: notes the hazards that have come on screen (once each). */
function metaTick(run) {
  if (!run || !run.enemies) return;
  run.enemies.forEach(e => {
    if (UI.hazards.has(e.type) || e.y < run.cam - 30 || e.y > run.cam + 640) return;
    UI.hazards.add(e.type);
    NattaEvents.emit('hazard', { type: e.type });
  });
}

/** After every save change: note what was met, award achievements, queue their toasts. */
function metaAfterSave() {
  if (ALBUM.busy || !UI.save || !UI.save.meta) return;
  ALBUM.busy = true;
  try {
    const seen = noteSeenMeta(UI.save), r = evalAchievements(seen, Date.now());
    if (r.save !== UI.save) { UI.save = r.save; persistSave(window.localStorage, r.save); }
    r.earned.forEach(id => NattaEvents.emit('achievement', { id }));
    if (r.earned.length) refreshCoinLabels();
  } finally { ALBUM.busy = false; }
}

function refreshCoinLabels() {
  ['menuCoins', 'hangarCoins', 'dailyCoins', 'albumCoins'].forEach(id => { $(id).textContent = nf(UI.save.coins); });
}

/* ---------- toast ---------- */
function toastAchievement(id) { ALBUM.toasts.push(id); if (!ALBUM.showing) nextAchToast(); }

function nextAchToast() {
  const id = ALBUM.toasts.shift(), box = $('achToast');
  if (!id) { ALBUM.showing = false; box.classList.remove('show'); return; }
  const a = ACHIEVEMENTS.find(x => x.id === id);
  ALBUM.showing = true;
  $('achToastHead').textContent = t('achNew') + ' ' + t('achReward', nf(a.reward));
  $('achToastName').textContent = pick(a);
  $('achToastCap').textContent = LANG.cur === 'ar' ? a.capAr : a.capEn;
  box.classList.add('show');
  Sound.play('power');
  setTimeout(() => { box.classList.remove('show'); setTimeout(nextAchToast, 350); }, 3000);
}

/* ---------- screens ---------- */
function openAlbum(tab) {
  UI.state = 'menu';
  if (tab) ALBUM.tab = tab;
  showScreen('album');
  renderAlbum();
}

const albumCountText = () => `${nf(Object.keys(UI.save.meta.ach).length)}/${nf(ACHIEVEMENTS.length)}`;

function albumCard(img, name, line, seen, extra) {
  const card = el('div', 'card album-card' + (seen ? '' : ' unseen'));
  const info = el('div', 'info');
  info.append(el('span', 'name small', seen ? name : t('unseenName')), el('span', 'bio', seen ? line : t('unseen')));
  if (extra) info.appendChild(extra);
  card.append(img, info);
  return card;
}

function albumImg(src) {
  const i = el('img', 'album-img');
  i.src = src;
  i.alt = '';
  return i;
}

function renderAlbumTab(body) {
  const m = UI.save.meta, ar = LANG.cur === 'ar';
  body.appendChild(el('h3', 'h3', t('albumHeroes')));
  HEROES.forEach(h => {
    const seen = m.seen.heroes.includes(h.id), img = heroView(h.id, 'idle', wornOf(UI.save, h.id));
    img.className = 'hv album-hv';
    body.appendChild(albumCard(img, pick(h), pick(h.bio), seen));
  });
  body.appendChild(el('h3', 'h3', t('albumLooks')));
  LOOKS.forEach(l => body.appendChild(albumCard(albumImg(spriteSrc(`look:${l.id}`)), pick(l), ar ? LOOK_LINES[l.id].ar : LOOK_LINES[l.id].en, m.seen.looks.includes(l.id))));
  body.appendChild(el('h3', 'h3', t('albumHazards')));
  HAZARD_INFO.forEach(h => body.appendChild(albumCard(albumImg(spriteSrc(`enemy:${h.id}:0`)), pick(h), ar ? h.lineAr : h.lineEn, m.seen.hazards.includes(h.id))));
}

function renderAchTab(body) {
  const ar = LANG.cur === 'ar';
  body.appendChild(el('h3', 'h3', albumCountText()));
  ACHIEVEMENTS.forEach(a => {
    const got = Boolean(UI.save.meta.ach[a.id]);
    const card = el('div', 'card ach-card' + (got ? ' current' : ' locked'));
    const icon = albumImg(spriteSrc('item:star:0'));
    const info = el('div', 'info');
    info.append(el('span', 'name small', pick(a)), el('span', 'bio', got ? (ar ? a.capAr : a.capEn) : (ar ? a.descAr : a.descEn)));
    card.append(icon, info, el('span', 'reward', got ? t('done') : t('achReward', nf(a.reward))));
    body.appendChild(card);
  });
}

function renderAlbum() {
  const body = $('albumBody'), keep = body.scrollTop;
  $('albumTabs').querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.tab === ALBUM.tab));
  $('albumCoins').textContent = nf(UI.save.coins);
  body.textContent = '';
  if (ALBUM.tab === 'album') renderAlbumTab(body); else renderAchTab(body);
  body.scrollTop = keep;
}

function refreshAlbumCount() { $('albumCount').textContent = albumCountText(); }

function initAlbumUi() {
  UI.hazards = new Set();
  NattaEvents.on('achievement', e => toastAchievement(e.id));
  $('btnAlbum').onclick = () => { Sound.start(); Sound.play('click'); openAlbum(); };
  $('albumBack').onclick = () => { Sound.play('click'); goMenu(); };
  $('albumTabs').onclick = e => { const b = e.target.closest('button[data-tab]'); if (b) { Sound.play('click'); ALBUM.tab = b.dataset.tab; $('albumBody').scrollTop = 0; renderAlbum(); } };
  $('btnComicAgain').onclick = () => { Sound.play('click'); openComic(() => openAlbum()); };
}
