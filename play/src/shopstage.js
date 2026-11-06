/* The pinned shop preview: one big hero on a little rooftop, idle bounce, wearing what it wears, plus the item being tried on.
   It is built once and updated in place (no rebuild per tap), so nothing flickers or jumps and it never scrolls away.
   State: SHOP.prev (hero shown), SHOP.tryLook (look id being tried, not yet worn). */

const STAGE_POSES = { idle: 'idle', hop: 'up' };

/** The looks a preview shows: what the hero wears, with the tried look in its slot. */
function stageWorn(save, heroId, tryId) {
  const worn = { ...wornOf(save, heroId) }, look = LOOKS.find(l => l.id === tryId);
  if (look) worn[look.slot] = look.id;
  return worn;
}

function stageKey(heroId, worn, pose) { return [heroId, pose, ...LOOK_SLOTS.map(s => worn[s] || '-')].join('|'); }

function buildStage() {
  const root = $('shopStage');
  if (root.firstChild) return;
  const scene = el('div', 'stage-scene');
  const sun = el('i', 'stage-sun');
  const cloud = el('i', 'stage-cloud');
  const ledge = el('div', 'stage-ledge');
  const holder = el('button', 'stage-hero');
  holder.type = 'button';
  holder.setAttribute('aria-hidden', 'true');
  holder.tabIndex = -1;
  holder.onclick = () => { if (holder.classList.contains('hop')) return; holder.classList.add('hop'); Sound.play('click'); setTimeout(() => holder.classList.remove('hop'), 520); stageDraw(true); };
  const tag = el('span', 'try-tag');
  const info = el('div', 'stage-info');
  info.append(el('span', 'name'), el('span', 'req'));
  const chips = el('div', 'chips');
  scene.append(sun, cloud, ledge, holder, tag, info, chips);
  root.appendChild(scene);
}

let stageToken = 0, stageShown = '';
/** Draw the hero in the holder; builds off-screen and swaps once the images have decoded, so there is never a blank frame. */
function stageDraw(force) {
  const holder = $('shopStage').querySelector('.stage-hero');
  if (!holder) return;
  const hop = holder.classList.contains('hop'), pose = hop ? STAGE_POSES.hop : STAGE_POSES.idle;
  const worn = stageWorn(UI.save, SHOP.prev, SHOP.tryLook), key = stageKey(SHOP.prev, worn, pose) + '|' + LANG.cur;
  if (key === stageShown && !force) return;
  stageShown = key;
  const mine = ++stageToken, view = heroView(SHOP.prev, pose, worn, 'stage-view');
  const imgs = [...view.querySelectorAll('img')];
  Promise.all(imgs.map(i => (i.decode ? i.decode().catch(() => null) : null))).then(() => { if (mine === stageToken) holder.replaceChildren(view); });
}

function stageRender() {
  buildStage();
  const root = $('shopStage'), look = SHOP.tab === 'look', hero = heroById(SHOP.prev) || HEROES[0];
  root.classList.toggle('hidden', SHOP.tab === 'ups');
  root.classList.toggle('with-chips', look);
  const worn = wornOf(UI.save, hero.id), tryL = LOOKS.find(l => l.id === SHOP.tryLook);
  const wearing = LOOK_SLOTS.map(sl => LOOKS.find(l => l.id === worn[sl])).filter(Boolean).map(pick).join(' · ');
  const tag = root.querySelector('.try-tag'), flies = heroFlies(UI.save, hero.id);
  const tagText = tryL ? t('tryTag', pick(tryL)) : !flies ? t('previewTag') : '';
  tag.textContent = tagText;
  tag.classList.toggle('hidden', !tagText);
  root.querySelector('.stage-info .name').textContent = pick(hero);
  root.querySelector('.stage-info .req').textContent = tryL ? t(ownsLook(UI.save, tryL.id) ? 'tryHint' : 'tryBuy') : wearing ? t('wearing', wearing) : t('wearsNothing');
  const chips = root.querySelector('.chips');
  chips.textContent = '';
  if (look) HEROES.filter(h => heroFlies(UI.save, h.id)).forEach(h => {
    const b = el('button', 'chip-btn' + (h.id === hero.id ? ' on' : ''));
    b.type = 'button';
    b.setAttribute('aria-label', pick(h));
    b.appendChild(heroView(h.id, 'idle', wornOf(UI.save, h.id)));
    b.onclick = () => { Sound.play('click'); SHOP.tryLook = null; SHOP.prev = h.id; setSave(selectHero(UI.save, h.id)); renderShop(); };
    chips.appendChild(b);
  });
  stageDraw(false);
}
