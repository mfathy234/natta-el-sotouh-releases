/* Offline cache. Bump CACHE when any file changes. All URLs are relative so it works under any subpath such as /play/. */
const CACHE = 'natta-v1';
const FILES = [
  './', 'index.html', 'style.css', 'manifest.webmanifest', 'og.png',
  'art/core.js', 'art/heroes.js', 'art/shams.js', 'art/platforms.js', 'art/enemies.js', 'art/items.js', 'art/world.js', 'art/sprites.js',
  'src/data.js', 'src/save.js', 'src/strings.js', 'src/audio.js', 'src/engine.js', 'src/gen.js', 'src/play.js', 'src/render.js', 'src/ui.js', 'src/main.js',
  'icons/icon-192.png', 'icons/icon-512.png', 'icons/icon-maskable-512.png', 'icons/apple-touch-icon.png', 'icons/favicon-48.png',
  'fonts/lalezar-arabic-400-normal.woff2', 'fonts/lalezar-latin-400-normal.woff2', 'fonts/cairo-arabic-400-normal.woff2',
  'fonts/cairo-arabic-700-normal.woff2', 'fonts/cairo-latin-400-normal.woff2', 'fonts/cairo-latin-700-normal.woff2'
];

self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(caches.match(e.request).then(hit => hit || fetch(e.request).then(res => {
    const copy = res.clone();
    caches.open(CACHE).then(c => c.put(e.request, copy)).catch(() => null);
    return res;
  })));
});
