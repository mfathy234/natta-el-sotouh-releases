/* One catalogue of every sprite: { key, vb, w, h, svg }. The game rasterises these at 3x
   and tools/sprites/export.mjs writes the same list to art-out/ as PNGs. */

const SPRITE_Q = 3;
const HERO_ART = { marei: mareiArt, shams: shamsArt, hanafy: hanafyArt, batta: battaArt, hadeel: hadeelArt, shawish: shawishArt };

function spriteCatalogue() {
  const list = [];
  const add = (key, vb, w, h, svg) => list.push({ key, vb, w, h, svg });
  HEROES.forEach(h => HERO_POSES.forEach(pose => add(`hero:${h.id}:${pose}`, HERO_VB, Math.round(h.size * 146 / 130), h.size, HERO_ART[h.id](pose))));
  LOOKS.forEach(l => add(`look:${l.id}`, LOOK_VB, 64, 64, LOOK_ART[l.id]()));
  Object.keys(PLATFORM_ART).forEach(t => PLATFORM_ART[t].forEach((fr, i) => add(`plat:${t}:${i}`, PLAT_VB, 64, 24, fr())));
  Object.keys(ENEMY_ART).forEach(t => (t === 'slipper' ? [0] : [0, 1]).forEach(f => add(`enemy:${t}:${f}`, ENEMY_VB, ENEMY_SIZE[t], ENEMY_SIZE[t], ENEMY_ART[t](f))));
  Object.keys(ITEM_ART).forEach(t => ITEM_ART[t].forEach((fr, i) => add(`item:${t}:${i}`, ITEM_VB, ITEM_SIZE[t], ITEM_SIZE[t], fr())));
  MOOD_NAMES.forEach(n => add(`mood:${n}:0`, MOOD_VB, MOOD_SIZE.w, MOOD_SIZE.h, MOOD_FRAMES[n]()));
  add('mood:glass:0', GLASS_VB, 24, 28, teaGlassArt());
  add('nbr:window:0', NBR_WINDOW_VB, 58, 64, nbrWindowArt());
  [0, 1].forEach(f => {
    add(`nbr:arm:${f}`, NBR_HAND_VB, 48, 32, nbrHandArt(f));
    add(`nbr:bucket:${f}`, NBR_BUCKET_VB, 84, 70, nbrBucketArt(f));
    add(`nbr:splash:${f}`, NBR_SPLASH_VB, 74, 50, nbrSplashArt(f));
    add(`event:rocket:${f}`, ROCKET_VB, 34, 54, rocketArt(f));
  });
  [0, 1, 'throw', 'beat'].forEach(p => add(`bawab:${p}`, BAWAB_VB, 92, 92, bawabArt(p)));
  add('enemy:key:0', ENEMY_VB, 30, 30, keyArt());
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
