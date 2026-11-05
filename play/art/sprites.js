/* One catalogue of every sprite: { key, vb, w, h, svg }. The game rasterises these at 3x
   and tools/sprites/export.mjs writes the same list to art-out/ as PNGs. */

const SPRITE_Q = 3;
const HERO_ART = { marei: mareiArt, shams: shamsArt };

function spriteCatalogue() {
  const list = [];
  const add = (key, vb, w, h, svg) => list.push({ key, vb, w, h, svg });
  HEROES.forEach(h => HERO_POSES.forEach(pose => add(`hero:${h.id}:${pose}`, HERO_VB, Math.round(h.size * 146 / 130), h.size, HERO_ART[h.id](pose))));
  Object.keys(PLATFORM_ART).forEach(t => PLATFORM_ART[t].forEach((fr, i) => add(`plat:${t}:${i}`, PLAT_VB, 64, 24, fr())));
  Object.keys(ENEMY_ART).forEach(t => (t === 'slipper' ? [0] : [0, 1]).forEach(f => add(`enemy:${t}:${f}`, ENEMY_VB, ENEMY_SIZE[t], ENEMY_SIZE[t], ENEMY_ART[t](f))));
  Object.keys(ITEM_ART).forEach(t => ITEM_ART[t].forEach((fr, i) => add(`item:${t}:${i}`, ITEM_VB, ITEM_SIZE[t], ITEM_SIZE[t], fr())));
  add('bg:facade', '0 0 360 320', 360, 320, facadeArt());
  add('bg:skyline', '0 0 360 220', 360, 220, skylineArt());
  add('bg:rooftops', '0 0 360 200', 360, 200, rooftopsArt());
  add('bg:minaret', '0 0 80 360', 54, 243, minaretFarArt());
  add('bg:cloud', '0 0 120 70', 96, 56, softCloudArt());
  add('bg:sun', '0 0 128 128', 84, 84, sunArt());
  add('bg:moon', '0 0 128 128', 64, 64, moonArt());
  add('bg:kite', '0 0 60 96', 26, 42, farKiteArt());
  add('bg:star', '0 0 64 64', 24, 24, starDotArt());
  return list;
}
