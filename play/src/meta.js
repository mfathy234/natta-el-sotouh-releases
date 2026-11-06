/* Meta layer, pure and immutable: the achievements, the album (what you have met) and the intro comic flag.
   Everything lives in save.meta (sanitized here). Rules read the save, so they never depend on a run being on screen.
   Ownership-based goals read what was bought for good (save.owned / save.looks), never the quick pass. */

const META_STAT_KEYS = ['stomps', 'coins', 'kites', 'ful', 'beads', 'falls'];
const HAZARD_IDS = ['pigeon', 'crow', 'bag', 'slipper'];

/** A tiny event bus so other files can report things without knowing who listens: NattaEvents.emit('stomp', { type }). */
const NattaEvents = (() => {
  const subs = {};
  return {
    on(name, fn) { (subs[name] = subs[name] || []).push(fn); },
    emit(name, data) { (subs[name] || []).forEach(fn => { try { fn(data); } catch (e) { /* a listener never breaks the game */ } }); }
  };
})();

const HAZARD_INFO = [
  { id: 'pigeon', ar: 'الحمامة الغلسة', en: 'Grumpy pigeon', lineAr: 'بتبصلك بصّة وتنزل عليك. ما تاخدهاش على قد عقلها.', lineEn: 'Gives you a look, then dives. Do not trust that face.' },
  { id: 'crow', ar: 'الغراب', en: 'Crow', lineAr: 'بيجي من الحيطة ومعاه ميعاد. ركّز في الخط الأحمر.', lineEn: 'Flies in from the edge, always punctual. Watch the red lane.' },
  { id: 'bag', ar: 'الكيس', en: 'Plastic bag', lineAr: 'بيتنفخ ويتفشخر. نطّه من فوق وخلاص.', lineEn: 'Puffs up and shows off. Just bounce on it.' },
  { id: 'slipper', ar: 'الشبشب', en: 'Flying slipper', lineAr: 'سلاح الجارات السري. ما بيتنطش.', lineEn: "The neighbours' secret weapon. Cannot be stomped." }
];
const LOOK_LINES = {
  tarboosh: { ar: 'الأناقة الرسمية لأي قط محترم.', en: 'Formal wear for any respectable cat.' },
  jasmine: { ar: 'ريحة الفل قبل ما تشوفه.', en: 'You smell the jasmine before you see it.' },
  shades: { ar: 'الشمس على السطوح جامدة.', en: 'The rooftop sun is no joke.' },
  scarf: { ar: 'إيشارب الماتش: الأهلي ولا الزمالك؟ سر.', en: 'Match-day scarf. Which team? A secret.' }
};

const heldAllLooks = sv => LOOKS.every(l => sv.looks.includes(l.id));
const bestMeters = sv => Math.max(sv.best, ...Object.values(sv.daily.bests));
const ACHIEVEMENTS = [
  { id: 'm100', reward: 20, ar: 'أول ١٠٠ متر', en: 'First 100 m', capAr: 'لسه بتسخّن يا معلّم', capEn: 'Still warming up', descAr: 'اوصل ١٠٠ متر', descEn: 'Reach 100 m', ok: sv => bestMeters(sv) >= 100 },
  { id: 'm250', reward: 30, ar: 'نص الطريق للسما', en: 'Halfway to the sky', capAr: 'الجيران بقوا صغيرين تحت', capEn: 'The neighbours look tiny now', descAr: 'اوصل ٢٥٠ متر', descEn: 'Reach 250 m', ok: sv => bestMeters(sv) >= 250 },
  { id: 'm500', reward: 60, ar: 'قطة فضاء', en: 'Space cat', capAr: 'الأكسجين هنا خفيف يا مرعي', capEn: 'The air is thin up here, Mar3y', descAr: 'اوصل ٥٠٠ متر', descEn: 'Reach 500 m', ok: sv => bestMeters(sv) >= 500 },
  { id: 'tower_20', reward: 25, ar: 'مستأجر جديد', en: 'New tenant', capAr: 'أول علم حمام ومش آخر واحد', capEn: 'First pigeon flag, not the last', descAr: 'اوصل دور ٢٠ في البرج', descEn: 'Reach floor 20 in the Tower', ok: sv => sv.tower.best >= 20 },
  { id: 'tower_win', reward: 100, ar: 'فتحت السطوح', en: 'Beat the Tower', capAr: 'الدور المية وصلته من غير أسانسير', capEn: 'Floor 100, no elevator needed', descAr: 'اوصل سطوح البرج', descEn: 'Reach the rooftop of the Tower', ok: sv => sv.tower.wins >= 1 },
  { id: 'stomp50', reward: 50, ar: 'عدو الحمام', en: 'Pigeon nemesis', capAr: 'الحمام عمل اجتماع طارئ', capEn: 'The pigeons called an emergency meeting', descAr: 'اضرب ٥٠ حمامة من فوق', descEn: 'Stomp 50 pigeons', ok: sv => sv.meta.stats.stomps >= 50 },
  { id: 'coins300', reward: 40, ar: 'جيب مليان', en: 'Full pockets', capAr: 'ولا كان فيه جيب أصلاً', capEn: 'You have no pockets, yet here we are', descAr: 'اجمع ٣٠٠ عملة', descEn: 'Collect 300 coins', ok: sv => sv.meta.stats.coins >= 300 },
  { id: 'kites10', reward: 40, ar: 'سيد الطيارات', en: 'Kite master', capAr: 'الواد اللي فوق بيشتكي', capEn: 'The kid upstairs is complaining', descAr: 'امسك ١٠ طيارات ورق', descEn: 'Catch 10 kites', ok: sv => sv.meta.stats.kites >= 10 },
  { id: 'ful10', reward: 40, ar: 'فطار الأبطال', en: 'Breakfast of champions', capAr: 'فول بالزيت الحار ونطّة', capEn: 'Ful, hot oil and a bounce', descAr: 'كُل ١٠ أطباق فول', descEn: 'Eat 10 bowls of ful', ok: sv => sv.meta.stats.ful >= 10 },
  { id: 'beads5', reward: 30, ar: 'محسود بس محمي', en: 'Envied but protected', capAr: 'العين صابتك والخرزة ردّتها', capEn: 'The evil eye missed. Thanks, bead', descAr: 'خلّي الخرزة تشيل ٥ ضربات', descEn: 'Let the bead take 5 hits', ok: sv => sv.meta.stats.beads >= 5 },
  { id: 'runs25', reward: 50, ar: 'مدمن نطّ', en: 'Bounce addict', capAr: 'قول للجيران إنك بخير', capEn: 'Tell the neighbours you are fine', descAr: 'العب ٢٥ جولة', descEn: 'Play 25 runs', ok: sv => sv.runs >= 25 },
  { id: 'allLooks', reward: 60, ar: 'ماشي شيك', en: 'Fashion cat', capAr: 'كله حاجة حاجة', capEn: 'Every look, bought for good', descAr: 'اشتري كل الأشكال (التجربة ببلاش ما تحسبش)', descEn: 'Buy every look (the free trial does not count)', ok: sv => heldAllLooks(sv) },
  { id: 'allHeroes', reward: 100, ar: 'السطوح كله معايا', en: 'The whole rooftop crew', capAr: 'الشلة اكتملت', capEn: 'The gang is complete', descAr: 'افتح كل الشخصيات (التجربة ببلاش ما تحسبش)', descEn: 'Unlock every hero (the free trial does not count)', ok: sv => HEROES.every(h => sv.owned.includes(h.id)) },
  { id: 'daily1', reward: 30, ar: 'تحدي اليوم', en: 'Daily dose', capAr: 'الجايزة جت وكمان الكبرياء', capEn: 'A reward and a little pride', descAr: 'حقق هدف التحدي اليومي مرة', descEn: 'Beat a daily target once', ok: sv => sv.daily.lastWin !== '' },
  { id: 'streak7', reward: 80, ar: 'أسبوع على السطوح', en: 'A week on the roof', capAr: 'سبع أيام ورا بعض، تقول وظيفة', capEn: 'Seven days in a row, basically a job', descAr: 'حقق التحدي اليومي ٧ أيام ورا بعض', descEn: 'Win the daily challenge 7 days in a row', ok: sv => sv.daily.streak >= 7 },
  { id: 'album', reward: 40, ar: 'الألبوم الكامل', en: 'Complete album', capAr: 'قابلت كل العيلة، للأسف', capEn: 'You met the whole family, sadly', descAr: 'قابل كل المخاطر', descEn: 'Meet every hazard', ok: sv => HAZARD_IDS.every(h => sv.meta.seen.hazards.includes(h)) }
];

const newMeta = () => ({ ach: {}, seen: { heroes: [], looks: [], hazards: [] }, stats: { stomps: 0, coins: 0, kites: 0, ful: 0, beads: 0, falls: 0 }, comicSeen: false, last: { kind: '', meters: 0, best: false, at: 0 } });

const metaInt = (v, max) => (Number.isFinite(Number(v)) ? Math.max(0, Math.min(max, Math.floor(Number(v)))) : 0);
const metaObj = v => (v && typeof v === 'object' && !Array.isArray(v) ? v : {});
const metaList = (v, ids) => [...new Set(Array.isArray(v) ? v : [])].filter(id => ids.includes(id));

/** Validate the meta block read from storage; missing or broken parts fall back to defaults. */
function sanitizeMeta(raw) {
  const r = metaObj(raw), seen = metaObj(r.seen), stats = metaObj(r.stats), last = metaObj(r.last), ach = {};
  ACHIEVEMENTS.forEach(a => { if (metaObj(r.ach)[a.id]) ach[a.id] = metaInt(r.ach[a.id], 9e15) || 1; });
  const st = {};
  META_STAT_KEYS.forEach(k => { st[k] = metaInt(stats[k], 1e9); });
  return {
    ach,
    seen: { heroes: metaList(seen.heroes, HEROES.map(h => h.id)), looks: metaList(seen.looks, LOOKS.map(l => l.id)), hazards: metaList(seen.hazards, HAZARD_IDS) },
    stats: st,
    comicSeen: r.comicSeen === true,
    last: { kind: ['free', 'daily', 'tower'].includes(last.kind) ? last.kind : '', meters: metaInt(last.meters, 1e7), best: last.best === true, at: metaInt(last.at, 9e15) }
  };
}

/** Fold one finished run into the counters. info: { kind, meters, newBest, pigeons, coins, kites, ful, beads, hazards[] }. */
function foldRunMeta(save, info, now = 0) {
  const m = save.meta, s = m.stats, add = (k, v) => Math.min(1e9, s[k] + metaInt(v, 1e7));
  const stats = { stomps: add('stomps', info.pigeons), coins: add('coins', info.coins), kites: add('kites', info.kites), ful: add('ful', info.ful), beads: add('beads', info.beads), falls: add('falls', 1) };
  const hazards = [...new Set([...m.seen.hazards, ...metaList(info.hazards, HAZARD_IDS)])];
  const last = { kind: info.kind, meters: metaInt(info.meters, 1e7), best: Boolean(info.newBest), at: metaInt(now, 9e15) };
  return { ...save, meta: { ...m, stats, seen: { ...m.seen, hazards }, last } };
}

/** Note the heroes and looks you have met (own, wear or try through the quick pass). Returns the same save when nothing is new. */
function noteSeenMeta(save) {
  const m = save.meta, worn = Object.values(save.worn).flatMap(row => Object.values(row));
  const heroes = [...new Set([...m.seen.heroes, ...save.owned, save.hero])], looks = [...new Set([...m.seen.looks, ...save.looks, ...worn])];
  if (heroes.length === m.seen.heroes.length && looks.length === m.seen.looks.length) return save;
  return { ...save, meta: { ...m, seen: { ...m.seen, heroes, looks } } };
}

/** Award every achievement that is now met (once each, with its coin reward). Returns { save, earned: [ids] }. */
function evalAchievements(save, now = 0) {
  const ach = { ...save.meta.ach }, earned = [];
  let coins = save.coins;
  ACHIEVEMENTS.forEach(a => { if (!ach[a.id] && a.ok(save)) { ach[a.id] = now || 1; coins += a.reward; earned.push(a.id); } });
  return earned.length ? { save: { ...save, coins, meta: { ...save.meta, ach } }, earned } : { save, earned };
}

const markComicSeen = save => (save.meta.comicSeen ? save : { ...save, meta: { ...save.meta, comicSeen: true } });

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { newMeta, sanitizeMeta, foldRunMeta, noteSeenMeta, evalAchievements, markComicSeen, ACHIEVEMENTS, HAZARD_IDS, HAZARD_INFO, LOOK_LINES, NattaEvents };
}
