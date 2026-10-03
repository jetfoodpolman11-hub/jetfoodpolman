const CACHE_NAME = "jetfood-polman-pwa-v2";
const PRECACHE_ASSETS = [
  "/manifest.json",
  "/favicon.ico?v=2",
  "/icons/favicon-32x32.png?v=2",
  "/icons/favicon-64x64.png?v=2",
  "/icons/icon-192x192.png?v=2",
  "/icons/icon-512x512.png?v=2",
  "/icons/apple-touch-icon.png?v=2",
  "/images/logo.png",
  "/images/logo-white.png"
];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_ASSETS)).catch(() => {})
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.map((key) => {
            if (key !== CACHE_NAME) {
              return caches.delete(key);
            }
            return Promise.resolve();
          })
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  // Serve static icons and images from cache with network fallback
  if (
    url.pathname.startsWith("/icons/") ||
    url.pathname.startsWith("/images/") ||
    url.pathname === "/manifest.json"
  ) {
    event.respondWith(
      caches.match(event.request).then((cached) => cached || fetch(event.request))
    );
    return;
  }

  // Network-first for all dynamic pages and API routes
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
