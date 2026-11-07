/* Service worker. tools/build-web.mjs stamps BUILD and FILES (every file as name?v=BUILD); serving game/ directly runs in dev mode (no precache, network only).
   index.html, navigations and version.json are network-first; ?v= URLs are cache-first; the cache is named after the build and old ones are deleted on activate. */
/*build:start*/
const BUILD = 'ee9b12306734';
const FILES = ["./","art/batta.js?v=ee9b12306734","art/bawab.js?v=ee9b12306734","art/comic.js?v=ee9b12306734","art/core.js?v=ee9b12306734","art/crew.js?v=ee9b12306734","art/enemies.js?v=ee9b12306734","art/events.js?v=ee9b12306734","art/hadeel.js?v=ee9b12306734","art/hanafy.js?v=ee9b12306734","art/heroes.js?v=ee9b12306734","art/items.js?v=ee9b12306734","art/looks.js?v=ee9b12306734","art/mood.js?v=ee9b12306734","art/neighbours.js?v=ee9b12306734","art/platforms.js?v=ee9b12306734","art/shams.js?v=ee9b12306734","art/shawish.js?v=ee9b12306734","art/sprites.js?v=ee9b12306734","art/world.js?v=ee9b12306734","fonts/cairo-arabic-400-normal.woff2?v=ee9b12306734","fonts/cairo-arabic-700-normal.woff2?v=ee9b12306734","fonts/cairo-latin-400-normal.woff2?v=ee9b12306734","fonts/cairo-latin-700-normal.woff2?v=ee9b12306734","fonts/lalezar-arabic-400-normal.woff2?v=ee9b12306734","fonts/lalezar-latin-400-normal.woff2?v=ee9b12306734","icons/apple-touch-icon.png?v=ee9b12306734","icons/favicon-48.png?v=ee9b12306734","icons/icon-192.png?v=ee9b12306734","icons/icon-512.png?v=ee9b12306734","icons/icon-maskable-512.png?v=ee9b12306734","manifest.webmanifest?v=ee9b12306734","og.png?v=ee9b12306734","src/albumui.js?v=ee9b12306734","src/audio.js?v=ee9b12306734","src/banner.js?v=ee9b12306734","src/bawab.js?v=ee9b12306734","src/combo.js?v=ee9b12306734","src/comicui.js?v=ee9b12306734","src/daily.js?v=ee9b12306734","src/data.js?v=ee9b12306734","src/engine.js?v=ee9b12306734","src/events.js?v=ee9b12306734","src/gen.js?v=ee9b12306734","src/ghost.js?v=ee9b12306734","src/input.js?v=ee9b12306734","src/looks.js?v=ee9b12306734","src/main.js?v=ee9b12306734","src/meta.js?v=ee9b12306734","src/moods.js?v=ee9b12306734","src/neighbours.js?v=ee9b12306734","src/notify.js?v=ee9b12306734","src/perks.js?v=ee9b12306734","src/play.js?v=ee9b12306734","src/prefs.js?v=ee9b12306734","src/render.js?v=ee9b12306734","src/save.js?v=ee9b12306734","src/settingsui.js?v=ee9b12306734","src/share.js?v=ee9b12306734","src/shop.js?v=ee9b12306734","src/shopstage.js?v=ee9b12306734","src/shopui.js?v=ee9b12306734","src/strings.js?v=ee9b12306734","src/tiers.js?v=ee9b12306734","src/tower.js?v=ee9b12306734","src/towergen.js?v=ee9b12306734","src/towerview.js?v=ee9b12306734","src/twist.js?v=ee9b12306734","src/ui.js?v=ee9b12306734","src/update.js?v=ee9b12306734","src/weekly.js?v=ee9b12306734","style.css?v=ee9b12306734"];
/*build:end*/
const CACHE = 'natta-' + BUILD;
const DEV = BUILD === 'dev';

self.addEventListener('install', e => {
  if (DEV) { self.skipWaiting(); return; }
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES.map(u => new Request(u, { cache: 'reload' })))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

const put = (req, res) => { if (res && res.status === 200) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)).catch(() => null); } };

const networkFirst = (req, key) => fetch(req, { cache: 'no-store' }).then(res => { put(key || req, res); return res; })
  .catch(() => caches.match(key || req, { ignoreSearch: !key }).then(hit => hit || Response.error()));

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin || DEV) return;
  const file = url.pathname.split('/').pop();
  if (req.mode === 'navigate' || file === '' || file === 'index.html') {
    e.respondWith(networkFirst(new Request(req.url, { cache: 'no-store' }), new Request(new URL('./', location.href).href)));
    return;
  }
  if (file === 'version.json' || file === 'sw.js') return;
  if (url.searchParams.get('v') === BUILD) {
    e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(res => { put(req, res); return res; })));
    return;
  }
  e.respondWith(networkFirst(req));
});
