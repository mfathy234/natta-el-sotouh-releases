/* The intro comic overlay: three panels (art in art/comic.js, script in COMIC), tap to continue, skippable.
   Shown once on first launch (save.meta.comicSeen) and again from the album. Bubbles are HTML so Arabic shapes properly. */

const COMICUI = { i: 0, done: null, art: {} };

const comicArtSrc = i => COMICUI.art[i] || (COMICUI.art[i] = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(comicPanelSvg(i)));
const needComic = () => !UI.save.meta.comicSeen;

function openComic(done) {
  COMICUI.i = 0;
  COMICUI.done = done || null;
  UI.state = 'comic';
  showScreen('comic');
  renderComic();
}

function renderComic() {
  const i = COMICUI.i, p = COMIC[i], ar = LANG.cur === 'ar', last = i === COMIC.length - 1;
  const frame = $('comicFrame');
  frame.classList.remove('turn');
  void frame.offsetWidth;
  frame.classList.add('turn');
  $('comicArt').src = comicArtSrc(i);
  const box = $('comicBubbles');
  box.textContent = '';
  p.bubbles.forEach((b, k) => {
    const d = el('div', `cbub ${b.style} tail-${b.tail}`, ar ? b.ar : b.en);
    d.style.cssText = `left:${b.x}%;top:${b.y}%;width:${b.w}%;animation-delay:${0.25 + k * 0.35}s`;
    box.appendChild(d);
  });
  $('comicCap').textContent = ar ? p.cap.ar : p.cap.en;
  $('comicNext').textContent = t(last ? 'comicDone' : 'comicNext');
  $('comicDots').replaceChildren(...COMIC.map((_, k) => el('i', k === i ? 'on' : '')));
  $('comicSkip').classList.toggle('hidden', last);
}

function closeComic() {
  setSave(markComicSeen(UI.save));
  const done = COMICUI.done;
  COMICUI.done = null;
  if (done) done();
  else goMenu();
}

function nextComic() {
  Sound.play('click');
  if (COMICUI.i >= COMIC.length - 1) closeComic();
  else { COMICUI.i += 1; renderComic(); }
}

function initComicUi() {
  $('comicNext').onclick = nextComic;
  $('comicFrame').onclick = nextComic;
  $('comicSkip').onclick = () => { Sound.play('click'); closeComic(); };
}
