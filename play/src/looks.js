/* Drawing a hero with its looks on top. Look anchors are in hero-sprite units (art/looks.js), so a look is placed
   inside the same transform as the hero sprite and follows its bounce, flip and tilt. */

const HERO_UNITS = { w: 146, h: 130, ox: 10, oy: 2 };

/** Draw hero sprite `hero:<id>:<pose>` and the looks in `worn` ({ hat, eyes, neck } ids). o: { ax, ay, rot, sx, sy, alpha }. */
function drawHero(heroId, pose, worn, x, y, o = {}) {
  const spr = SPR[`hero:${heroId}:${pose}`];
  if (!spr) return;
  const { ax = 0.5, ay = 0.5, rot = 0, sx = 1, sy = 1, alpha = 1 } = o, ctx = Eng.ctx;
  const u = spr.w / HERO_UNITS.w, v = spr.h / HERO_UNITS.h;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(x, y);
  if (rot) ctx.rotate(rot);
  ctx.scale(sx, sy);
  ctx.drawImage(spr.img, -spr.w * ax, -spr.h * ay, spr.w, spr.h);
  LOOK_SLOTS.forEach(slot => {
    const look = worn && LOOKS.find(l => l.id === worn[slot]), ls = look && SPR[`look:${look.id}`], pl = look && lookPlace(heroId, look, pose);
    if (!ls || !pl) return;
    const size = 64 * pl.s * u;
    ctx.save();
    ctx.translate(-spr.w * ax + (pl.x + HERO_UNITS.ox) * u, -spr.h * ay + (pl.y + HERO_UNITS.oy) * v);
    ctx.rotate((pl.rot * Math.PI) / 180);
    ctx.drawImage(ls.img, -size / 2, -size / 2, size, size);
    ctx.restore();
  });
  ctx.restore();
}

/** A hero picture for the DOM: the hero sprite with look images laid over it, so menus show what the hero wears. */
function heroView(heroId, pose, worn, cls = '') {
  const wrap = document.createElement('div');
  wrap.className = 'hv ' + cls;
  const img = document.createElement('img');
  img.src = spriteSrc(`hero:${heroId}:${pose}`);
  img.alt = '';
  wrap.appendChild(img);
  LOOK_SLOTS.forEach(slot => {
    const look = worn && LOOKS.find(l => l.id === worn[slot]), pl = look && lookPlace(heroId, look, pose);
    if (!pl) return;
    const o = document.createElement('img');
    o.src = spriteSrc(`look:${look.id}`);
    o.alt = '';
    o.className = 'hv-look';
    o.style.cssText = `left:${((pl.x + HERO_UNITS.ox) / HERO_UNITS.w) * 100}%;top:${((pl.y + HERO_UNITS.oy) / HERO_UNITS.h) * 100}%;width:${((64 * pl.s) / HERO_UNITS.w) * 100}%;transform:translate(-50%,-50%) rotate(${pl.rot}deg)`;
    wrap.appendChild(o);
  });
  return wrap;
}
