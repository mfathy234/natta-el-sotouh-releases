/* Service worker. tools/build-web.mjs stamps BUILD and FILES (every file as name?v=BUILD); serving game/ directly runs in dev mode (no precache, network only).
   index.html, navigations and version.json are network-first; ?v= URLs are cache-first; the cache is named after the build and old ones are deleted on activate. */
/*build:start*/
const BUILD = '4b9b2753898f';
const FILES = ["./","art/batta.js?v=4b9b2753898f","art/bawab.js?v=4b9b2753898f","art/comic.js?v=4b9b2753898f","art/core.js?v=4b9b2753898f","art/crew.js?v=4b9b2753898f","art/enemies.js?v=4b9b2753898f","art/events.js?v=4b9b2753898f","art/hadeel.js?v=4b9b2753898f","art/hanafy.js?v=4b9b2753898f","art/heroes.js?v=4b9b2753898f","art/items.js?v=4b9b2753898f","art/looks.js?v=4b9b2753898f","art/mood.js?v=4b9b2753898f","art/neighbours.js?v=4b9b2753898f","art/platforms.js?v=4b9b2753898f","art/shams.js?v=4b9b2753898f","art/shawish.js?v=4b9b2753898f","art/sprites.js?v=4b9b2753898f","art/world.js?v=4b9b2753898f","fonts/cairo-arabic-400-normal.woff2?v=4b9b2753898f","fonts/cairo-arabic-700-normal.woff2?v=4b9b2753898f","fonts/cairo-latin-400-normal.woff2?v=4b9b2753898f","fonts/cairo-latin-700-normal.woff2?v=4b9b2753898f","fonts/lalezar-arabic-400-normal.woff2?v=4b9b2753898f","fonts/lalezar-latin-400-normal.woff2?v=4b9b2753898f","icons/apple-touch-icon.png?v=4b9b2753898f","icons/favicon-48.png?v=4b9b2753898f","icons/icon-192.png?v=4b9b2753898f","icons/icon-512.png?v=4b9b2753898f","icons/icon-maskable-512.png?v=4b9b2753898f","manifest.webmanifest?v=4b9b2753898f","og.png?v=4b9b2753898f","src/albumui.js?v=4b9b2753898f","src/audio.js?v=4b9b2753898f","src/banner.js?v=4b9b2753898f","src/bawab.js?v=4b9b2753898f","src/combo.js?v=4b9b2753898f","src/comicui.js?v=4b9b2753898f","src/daily.js?v=4b9b2753898f","src/data.js?v=4b9b2753898f","src/engine.js?v=4b9b2753898f","src/events.js?v=4b9b2753898f","src/gen.js?v=4b9b2753898f","src/ghost.js?v=4b9b2753898f","src/input.js?v=4b9b2753898f","src/looks.js?v=4b9b2753898f","src/main.js?v=4b9b2753898f","src/meta.js?v=4b9b2753898f","src/moods.js?v=4b9b2753898f","src/neighbours.js?v=4b9b2753898f","src/perks.js?v=4b9b2753898f","src/play.js?v=4b9b2753898f","src/prefs.js?v=4b9b2753898f","src/render.js?v=4b9b2753898f","src/save.js?v=4b9b2753898f","src/settingsui.js?v=4b9b2753898f","src/share.js?v=4b9b2753898f","src/shop.js?v=4b9b2753898f","src/shopstage.js?v=4b9b2753898f","src/shopui.js?v=4b9b2753898f","src/strings.js?v=4b9b2753898f","src/tiers.js?v=4b9b2753898f","src/tower.js?v=4b9b2753898f","src/towergen.js?v=4b9b2753898f","src/towerview.js?v=4b9b2753898f","src/twist.js?v=4b9b2753898f","src/ui.js?v=4b9b2753898f","src/update.js?v=4b9b2753898f","src/weekly.js?v=4b9b2753898f","style.css?v=4b9b2753898f"];
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
