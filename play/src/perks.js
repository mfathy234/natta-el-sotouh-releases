/* Hero perks and run loadout hooks. play.js calls these; the numbers live in data.js (HEROES[].perk, UPGRADES). */

const heroPerk = heroId => (HEROES.find(h => h.id === heroId) || {}).perk || {};

/** First bounce of a run (Hanafy's kick-start). Returns the launch power to use. */
function perkBounce(s, power) {
  if (s.firstBounceDone) return power;
  s.firstBounceDone = true;
  const k = heroPerk(s.hero).firstBounce;
  return k && !s.demo ? power * k : power;
}

/** Batta's glide: while falling, the speed is capped so she floats down. Call after the physics step. */
function perkGlide(s) {
  const cap = heroPerk(s.hero).fallCap, p = s.p;
  if (cap && !p.dead && p.kite <= 0 && p.vy > cap) p.vy = cap;
}

/** Hadeel's pigeon pals: pigeons neither aim at her nor hurt her (she can still stomp them). */
const perkSpares = (s, e) => e.type === 'pigeon' && heroPerk(s.hero).id === 'pigeons';

/** Coin pull radius: the better of the magnet upgrade and the hero's nose (Shawish). */
const perkMagnet = (s, loadout) => Math.max(loadout.magnet || 0, heroPerk(s.hero).magnet || 0);

if (typeof module !== 'undefined' && module.exports) module.exports = { heroPerk, perkBounce, perkGlide, perkSpares, perkMagnet };
