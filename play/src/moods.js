/* Mar3y's moods on the menu. Between runs he idles on the couch: slow blinks, a yawn, a paw lick, a stretch, and now and then
   he knocks the tea glass off the ledge. He reacts to the last run (proud on a new best, unimpressed on a short one) and
   falls asleep when nobody touches the menu for a while. Frames are mood:<name>:0 sprites (art/mood.js). */

const MOOD = { timer: 0, token: 0, last: '', sleepAfter: 28000, lastTouch: 0, reacted: 0, asleep: false };

/* Each mood is a list of [frame, ms]; the glass: 'fall' drops the DOM glass when that step starts. */
const MOOD_SEQ = {
  blink: [['blink', 190]],
  yawn: [['yawn', 1900], ['blink', 260]],
  lick: [['lick0', 280], ['lick1', 280], ['lick0', 280], ['lick1', 280], ['lick0', 280], ['lick1', 280], ['blink', 240]],
  stretch: [['stretch', 2000], ['yawn', 500]],
  knock: [['knock0', 750], ['knock1', 380], ['knock2', 2600, 'fall'], ['blink', 220]],
  proud: [['proud', 5200]],
  meh: [['meh', 4200], ['blink', 300]]
};
const MOOD_IDLE = ['blink', 'blink', 'yawn', 'lick', 'stretch', 'knock'];

const moodImg = () => $('menuHero');
const moodSet = name => { moodImg().src = spriteSrc(`mood:${name}:0`); };
const moodOnMenu = () => UI.state === 'menu' && $('menu').classList.contains('show');

function moodGlassFall() {
  const g = $('moodGlass');
  g.src = spriteSrc('mood:glass:0');
  g.classList.remove('hidden', 'fall');
  void g.offsetWidth;
  g.classList.add('fall');
  setTimeout(() => g.classList.add('hidden'), 1000);
}

/** Play a mood: steps run in order, then Mar3y settles back to calm. Starting another mood cancels this one. */
function moodPlay(name, then) {
  const steps = MOOD_SEQ[name], mine = ++MOOD.token;
  let i = 0;
  const step = () => {
    if (mine !== MOOD.token) return;
    if (i >= steps.length || !moodOnMenu()) { moodSet('calm'); if (then) then(); return; }
    const [frame, ms, fx] = steps[i++];
    moodSet(frame);
    if (fx === 'fall') moodGlassFall();
    MOOD.timer = setTimeout(step, ms);
  };
  clearTimeout(MOOD.timer);
  step();
}

function moodNext() {
  clearTimeout(MOOD.timer);
  if (!moodOnMenu()) return;
  const idleMs = Date.now() - MOOD.lastTouch;
  if (!MOOD.asleep && idleMs > MOOD.sleepAfter) return moodSleep();
  if (MOOD.asleep) return;
  let pickName = MOOD_IDLE[Math.floor(Math.random() * MOOD_IDLE.length)];
  if (pickName === MOOD.last && pickName !== 'blink') pickName = 'blink';
  MOOD.last = pickName;
  MOOD.timer = setTimeout(() => moodPlay(pickName, moodNext), 2400 + Math.random() * 3600);
}

function moodSleep() {
  MOOD.asleep = true;
  const mine = ++MOOD.token;
  let k = 0;
  const z = () => { if (mine !== MOOD.token || !moodOnMenu()) return; moodSet(k++ % 2 ? 'sleep1' : 'sleep0'); MOOD.timer = setTimeout(z, 900); };
  z();
}

/** Any touch or key on the menu: wake him up (a yawn) and restart the idle clock. */
function moodTouch() {
  MOOD.lastTouch = Date.now();
  if (!MOOD.asleep) return;
  MOOD.asleep = false;
  moodPlay('yawn', moodNext);
}

/** Entering the menu: react to the run you just finished, then idle. */
function moodEnter() {
  MOOD.lastTouch = Date.now();
  MOOD.asleep = false;
  MOOD.token += 1;
  clearTimeout(MOOD.timer);
  $('moodGlass').classList.add('hidden');
  moodSet('calm');
  const last = UI.save.meta.last;
  if (last.at && last.at !== MOOD.reacted) {
    MOOD.reacted = last.at;
    if (last.best) return moodPlay('proud', moodNext);
    if (last.kind !== 'tower' && last.meters < 40) return moodPlay('meh', moodNext);
  }
  moodNext();
}

function initMoods() {
  ['pointerdown', 'keydown'].forEach(ev => addEventListener(ev, moodTouch, { passive: true }));
}
