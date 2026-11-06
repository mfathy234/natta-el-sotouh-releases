/* Shop and daily challenge screens: the tabs (heroes, look, upgrades), the daily card with its missions,
   the shared confirm dialog, and the game-over extras. Rules live in shop.js and daily.js; this file only draws and wires. */

const SHOP = { tab: 'heroes', prev: null, tryLook: null };

function el(tag, cls, text) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text != null) n.textContent = text;
  return n;
}

/** The one confirm dialog for every purchase: the item is named in the title and on the button. */
function askConfirm(title, body, btn, onYes) {
  $('confirmTitle').textContent = title;
  $('confirmBody').textContent = body;
  $('confirmYes').textContent = btn;
  UI.confirmYes = () => { onYes(); closeConfirm(); refreshText(); };
  $('confirm').classList.add('show');
}
function closeConfirm() { $('confirm').classList.remove('show'); UI.confirmYes = null; }

/** Spend coins on a purchase after confirming. `buy` is a pure shop function returning { ok, save }. */
/** kind: 'buy' or 'upgrade' (picks the dialog wording). */
function confirmBuy(name, price, kind, buy, after) {
  const up = kind === 'upgrade';
  askConfirm(t(up ? 'upgradeTitle' : 'buyTitle', name), t('buyBody', nf(price)), t(up ? 'upgradeBtn' : 'buyBtn', name, nf(price)), () => {
    const r = buy(UI.save, Date.now());
    if (r.ok) { SHOP.tryLook = null; setSave(after ? after(r.save) : r.save); Sound.play('power'); }
  });
}

/* ---------- shop ---------- */
function openHangar(from) {
  UI.hangarFrom = from;
  UI.state = from === 'over' ? 'over' : 'menu';
  SHOP.prev = UI.save.hero;
  SHOP.tryLook = null;
  showScreen('hangar');
  renderShop();
}

function renderShop() {
  $('hangarCoins').textContent = nf(UI.save.coins);
  if (!SHOP.prev || (SHOP.tab === 'look' && SHOP.prev !== UI.save.hero)) SHOP.prev = UI.save.hero;
  $('shopTabs').querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.tab === SHOP.tab));
  $('heroList').classList.toggle('hidden', SHOP.tab !== 'heroes');
  $('lookPane').classList.toggle('hidden', SHOP.tab !== 'look');
  $('upList').classList.toggle('hidden', SHOP.tab !== 'ups');
  const live = { heroes: $('heroList'), look: $('lookPane'), ups: $('upList') }[SHOP.tab], keep = live.scrollTop;
  if (SHOP.tab === 'heroes') renderHeroes();
  else if (SHOP.tab === 'look') renderLook();
  else renderUpgrades();
  stageRender();
  live.scrollTop = keep;
}

/** Tapping a card (not its button) previews it in the pinned stage. */
const onCardTap = fn => e => { if (!e.target.closest('button')) { Sound.play('click'); fn(); renderShop(); } };

function priceButton(price, onclick, affordable) {
  const b = el('button', 'btn small' + (affordable ? '' : ' poor'), nf(price));
  b.type = 'button';
  b.onclick = onclick;
  return b;
}

function renderHeroes() {
  const list = $('heroList');
  list.textContent = '';
  HEROES.forEach(h => {
    const held = UI.save.owned.includes(h.id), owned = heroFlies(UI.save, h.id), current = UI.save.hero === h.id;
    const card = el('div', 'card tappable' + (current ? ' current' : '') + (SHOP.prev === h.id ? ' trying' : '') + (owned ? '' : ' locked'));
    card.onclick = onCardTap(() => { SHOP.prev = h.id; });
    const info = el('div', 'info');
    info.append(el('span', 'name', pick(h)), el('span', 'bio', pick(h.bio)));
    if (h.perk.id !== 'none') info.appendChild(el('span', 'perk', t('perk', pick(h.perk))));
    if (!held) info.append(el('span', 'req', t(owned ? 'passFree' : 'unlockWith', nf(h.price))), el('span', 'req', t('orReach', nf(h.unlockScore) + ' ' + t('m'))));
    if (owned && !held) info.appendChild(priceButton(h.price, () => askBuyHero(h), UI.save.coins >= h.price));
    card.append(heroView(h.id, 'slouch', wornOf(UI.save, h.id)), info);
    let btn;
    if (current) { btn = el('button', 'btn small', t('current')); btn.disabled = true; }
    else if (owned) { btn = el('button', 'btn small', t('choose')); btn.onclick = () => { Sound.play('click'); SHOP.prev = h.id; setSave(selectHero(UI.save, h.id)); renderShop(); }; }
    else btn = priceButton(h.price, () => askBuyHero(h), UI.save.coins >= h.price);
    btn.type = 'button';
    card.appendChild(btn);
    list.appendChild(card);
  });
}

function askBuyHero(h) {
  if (!canBuyHero(UI.save, h.id)) { toast(t('poor')); return; }
  askConfirm(t('confirmTitle', pick(h)), t('confirmBody', nf(h.price)), t('confirmBtn', pick(h), nf(h.price)), () => {
    const r = buyHero(UI.save, h.id, Date.now());
    if (r.ok) { setSave(selectHero(r.save, h.id)); Sound.play('power'); }
    renderShop();
  });
}

function renderLook() {
  const pane = $('lookPane'), hero = HEROES.find(h => h.id === UI.save.hero), worn = wornOf(UI.save, hero.id);
  pane.textContent = '';
  LOOKS.forEach(l => {
    const owned = ownsLook(UI.save, l.id), on = worn[l.slot] === l.id, trying = SHOP.tryLook === l.id;
    const card = el('div', 'card tappable' + (on ? ' current' : '') + (trying ? ' trying' : '') + (owned ? '' : ' locked'));
    card.onclick = onCardTap(() => { SHOP.tryLook = on || trying ? null : l.id; });
    const icon = el('img', 'look-icon');
    icon.src = spriteSrc(`look:${l.id}`);
    icon.alt = '';
    const info = el('div', 'info');
    info.append(el('span', 'name', pick(l)), el('span', 'req', pick(SLOT_NAMES[l.slot])));
    if (owned && !heldLook(UI.save, l.id)) info.appendChild(priceButton(l.price, () => askBuyLook(l), UI.save.coins >= l.price));
    card.append(icon, info);
    let btn;
    if (!owned) btn = priceButton(l.price, () => askBuyLook(l), UI.save.coins >= l.price);
    else if (on) { btn = el('button', 'btn small', t('takeOff')); btn.onclick = () => { Sound.play('click'); SHOP.tryLook = null; setSave(takeOffLook(UI.save, hero.id, l.slot)); renderShop(); }; }
    else { btn = el('button', 'btn small', t('wear')); btn.onclick = () => { Sound.play('click'); SHOP.tryLook = null; setSave(wearLook(UI.save, hero.id, l.id)); renderShop(); }; }
    btn.type = 'button';
    card.appendChild(btn);
    pane.appendChild(card);
  });
}

function askBuyLook(l) {
  if (!canBuyLook(UI.save, l.id)) { toast(t('poor')); return; }
  confirmBuy(pick(l), l.price, 'buy', (sv, now) => buyLook(sv, l.id, now), sv => wearLook(sv, sv.hero, l.id));
}

function renderUpgrades() {
  const list = $('upList');
  list.textContent = '';
  Object.keys(UPGRADES).forEach(key => {
    const u = UPGRADES[key], lvl = upgradeLevel(UI.save, key), next = nextUpgrade(UI.save, key), passMax = !u.boost && lvl > heldUpgradeLevel(UI.save, key);
    const card = el('div', 'card' + (lvl > 0 ? ' current' : ''));
    const icon = el('img', 'look-icon');
    icon.src = spriteSrc(`item:${u.icon}:0`);
    icon.alt = '';
    const info = el('div', 'info');
    info.append(el('span', 'name', pick(u)), el('span', 'bio', LANG.cur === 'ar' ? u.descAr : u.descEn));
    if (!u.boost) info.appendChild(el('span', 'perk', t('levelOf', nf(lvl), nf(u.levels.length)) + (passMax ? ' · ' + t('passFree') : '')));
    card.append(icon, info);
    let btn;
    if (next) btn = priceButton(next.price, () => askBuyUpgrade(key), UI.save.coins >= next.price);
    else { btn = el('button', 'btn small', t(u.boost ? 'armed' : 'maxed')); btn.disabled = true; }
    btn.type = 'button';
    card.appendChild(btn);
    list.appendChild(card);
  });
}

function askBuyUpgrade(key) {
  const next = nextUpgrade(UI.save, key);
  if (!next || UI.save.coins < next.price) { toast(t('poor')); return; }
  confirmBuy(pick(UPGRADES[key]), next.price, UPGRADES[key].boost ? 'buy' : 'upgrade', (sv, now) => buyUpgrade(sv, key, now));
}

/* ---------- daily challenge ---------- */
function openDaily() {
  UI.state = 'menu';
  showScreen('daily');
  renderDaily();
}

function statBox(label, value) {
  const b = el('div', 'dstat');
  b.append(el('small', null, label), el('b', null, value));
  return b;
}

function renderDaily() {
  const key = dateKey(), v = dailyView(UI.save, key), body = $('dailyBody');
  body.textContent = '';
  const card = el('div', 'daily-card');
  card.append(el('span', 'ddate', dateLabel(key)), el('span', 'dtwist', pick(v.twist)), el('span', 'bio', LANG.cur === 'ar' ? v.twist.descAr : v.twist.descEn));
  const grid = el('div', 'dgrid');
  grid.append(
    statBox(t('dTarget'), nf(v.target) + ' ' + t('m')),
    statBox(t('dReward'), nf(v.reward) + ' ' + t('coinsUnit')),
    statBox(t('dBest'), nf(v.best) + ' ' + t('m')),
    statBox(t('dStreak'), nf(v.streak))
  );
  card.appendChild(grid);
  if (v.done) card.appendChild(el('span', 'badge-done', t('dailyDone')));
  body.appendChild(card);
  body.appendChild(el('h3', 'h3', t('missions')));
  missionState(UI.save, key).forEach(m => {
    const row = el('div', 'card mission' + (m.done ? ' current' : ''));
    const info = el('div', 'info');
    const bar = el('div', 'bar-track');
    const fill = el('i');
    fill.style.width = `${Math.round((m.progress / m.n) * 100)}%`;
    bar.appendChild(fill);
    const line = el('div', 'mline-row');
    line.append(bar, el('span', 'req', `${nf(m.progress)} / ${nf(m.n)}`));
    info.append(el('span', 'name small', missionText(m)), line);
    row.append(info, el('span', 'reward', m.done ? t('done') : `${nf(m.reward)} ${t('coinsUnit')}`));
    body.appendChild(row);
  });
  $('dailyStart').textContent = v.done || v.best > 0 ? t('dailyAgain') : t('dailyStart');
}

/** The target chip shown during a daily run. */
function dailyChipUpdate(s) {
  const chip = $('dailyChip');
  if (!s || !s.daily) return;
  const txt = pick(s.twist) + ' · ' + (s.targetHit ? t('hudTargetDone') : t('hudTarget', nf(s.target)));
  if (chip.textContent !== txt) chip.textContent = txt;
  chip.classList.toggle('hit', s.targetHit);
}

/** Fold a finished run into the save: coins and unlocks, then the daily result and the missions. */
function settleRun(save, s, now) {
  const key = dateKey();
  let next = recordRun(save, { meters: s.meters, coins: s.coinsGot, daily: Boolean(s.daily) }, now);
  let daily = null;
  if (s.daily) { daily = applyDaily(next, s.daily.key, s.meters, now); next = daily.save; }
  const missions = applyMissions(next, key, { ...s.stats, meters: s.meters, runs: 1 }, now);
  return { save: missions.save, daily, missions, run: s };
}

function showRunExtras(res) {
  const line = $('overDaily'), box = $('overMissions');
  box.textContent = '';
  line.classList.toggle('hidden', !res.daily);
  if (res.daily) {
    const left = Math.max(0, res.run.target - res.run.meters);
    line.textContent = res.daily.won ? t('dailyWon', nf(res.daily.reward)) : t('dailyMiss', nf(left));
    line.classList.toggle('good', res.daily.won);
  }
  res.missions.completed.forEach(c => box.appendChild(el('p', 'mline', t('missionPaid', nf(c.reward)) + ' ' + missionText(MISSIONS.find(m => m.id === c.id)))));
  if (res.missions.bonus) box.appendChild(el('p', 'mline', t('missionsAll', nf(res.missions.bonus))));
}
