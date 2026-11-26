/* CodeMentor service worker: caches the app shell so it opens even when the launcher is not running.
   Strategy: network-first (always fresh when the local server is up), cache fallback when it is not. */
const CACHE = 'codementor-v1';
const ASSETS = [
  './', 'index.html', 'css/app.css', 'manifest.webmanifest',
  'icons/icon.svg', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/icon-maskable-512.png',
  'js/core/icons.js', 'js/core/util.js', 'js/core/db.js', 'js/core/security.js', 'js/core/auth.js',
  'js/render/highlight.js', 'js/render/markdown.js',
  'js/kb/registry.js', 'js/kb/concepts-basics.js', 'js/kb/concepts-oop.js', 'js/kb/concepts-dsa.js', 'js/kb/concepts-lang.js',
  'js/kb/errors-python.js', 'js/kb/errors-js.js', 'js/kb/errors-java-c.js', 'js/kb/errors-tools.js', 'js/kb/recipes.js', 'js/kb/compare-faq.js',
  'js/engine/search.js', 'js/engine/analyzer.js', 'js/engine/brain.js', 'js/engine/llm.js', 'js/engine/runner.js',
  'js/ui/editor.js', 'js/ui/auth-view.js', 'js/ui/chat-view.js', 'js/ui/history-view.js', 'js/ui/library-view.js',
  'js/ui/playground-view.js', 'js/ui/saved-view.js', 'js/ui/profile-view.js', 'js/ui/settings-view.js', 'js/ui/palette.js', 'js/ui/app.js'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== self.location.origin || url.pathname.startsWith('/api/')) return;
  e.respondWith(
    fetch(req)
      .then((res) => {
        if (res && res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
        return res;
      })
      .catch(() => caches.match(req, { ignoreSearch: true }).then((hit) => hit || caches.match('index.html')))
  );
});
