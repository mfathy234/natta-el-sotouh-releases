/* Service worker. tools/build-web.mjs stamps BUILD and FILES (every file as name?v=BUILD); serving game/ directly runs in dev mode (no precache, network only).
   index.html, navigations and version.json are network-first; ?v= URLs are cache-first; the cache is named after the build and old ones are deleted on activate. */
/*build:start*/
const BUILD = '41d57e3e3bdb';
const FILES = ["./","art/batta.js?v=41d57e3e3bdb","art/bawab.js?v=41d57e3e3bdb","art/comic.js?v=41d57e3e3bdb","art/core.js?v=41d57e3e3bdb","art/crew.js?v=41d57e3e3bdb","art/enemies.js?v=41d57e3e3bdb","art/events.js?v=41d57e3e3bdb","art/hadeel.js?v=41d57e3e3bdb","art/hanafy.js?v=41d57e3e3bdb","art/heroes.js?v=41d57e3e3bdb","art/items.js?v=41d57e3e3bdb","art/looks.js?v=41d57e3e3bdb","art/mood.js?v=41d57e3e3bdb","art/neighbours.js?v=41d57e3e3bdb","art/platforms.js?v=41d57e3e3bdb","art/shams.js?v=41d57e3e3bdb","art/shawish.js?v=41d57e3e3bdb","art/sprites.js?v=41d57e3e3bdb","art/world.js?v=41d57e3e3bdb","fonts/cairo-arabic-400-normal.woff2?v=41d57e3e3bdb","fonts/cairo-arabic-700-normal.woff2?v=41d57e3e3bdb","fonts/cairo-latin-400-normal.woff2?v=41d57e3e3bdb","fonts/cairo-latin-700-normal.woff2?v=41d57e3e3bdb","fonts/lalezar-arabic-400-normal.woff2?v=41d57e3e3bdb","fonts/lalezar-latin-400-normal.woff2?v=41d57e3e3bdb","icons/apple-touch-icon.png?v=41d57e3e3bdb","icons/favicon-48.png?v=41d57e3e3bdb","icons/icon-192.png?v=41d57e3e3bdb","icons/icon-512.png?v=41d57e3e3bdb","icons/icon-maskable-512.png?v=41d57e3e3bdb","manifest.webmanifest?v=41d57e3e3bdb","og.png?v=41d57e3e3bdb","src/albumui.js?v=41d57e3e3bdb","src/audio.js?v=41d57e3e3bdb","src/banner.js?v=41d57e3e3bdb","src/bawab.js?v=41d57e3e3bdb","src/combo.js?v=41d57e3e3bdb","src/comicui.js?v=41d57e3e3bdb","src/daily.js?v=41d57e3e3bdb","src/data.js?v=41d57e3e3bdb","src/engine.js?v=41d57e3e3bdb","src/events.js?v=41d57e3e3bdb","src/gen.js?v=41d57e3e3bdb","src/ghost.js?v=41d57e3e3bdb","src/input.js?v=41d57e3e3bdb","src/looks.js?v=41d57e3e3bdb","src/main.js?v=41d57e3e3bdb","src/meta.js?v=41d57e3e3bdb","src/moods.js?v=41d57e3e3bdb","src/neighbours.js?v=41d57e3e3bdb","src/perks.js?v=41d57e3e3bdb","src/play.js?v=41d57e3e3bdb","src/render.js?v=41d57e3e3bdb","src/save.js?v=41d57e3e3bdb","src/share.js?v=41d57e3e3bdb","src/shop.js?v=41d57e3e3bdb","src/shopstage.js?v=41d57e3e3bdb","src/shopui.js?v=41d57e3e3bdb","src/strings.js?v=41d57e3e3bdb","src/tiers.js?v=41d57e3e3bdb","src/tower.js?v=41d57e3e3bdb","src/towergen.js?v=41d57e3e3bdb","src/towerview.js?v=41d57e3e3bdb","src/twist.js?v=41d57e3e3bdb","src/ui.js?v=41d57e3e3bdb","src/update.js?v=41d57e3e3bdb","src/weekly.js?v=41d57e3e3bdb","style.css?v=41d57e3e3bdb"];
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
