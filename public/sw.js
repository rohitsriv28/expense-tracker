const CACHE_NAME = "cashflow-v2";
const DYNAMIC_CACHE = "cashflow-dynamic-v2";

// Resources to cache immediately (Keep minimal to avoid 404s on build hashed files)
const STATIC_URLS = [
  "/",
  "/index.html",
  "/manifest.json",
  "/cashflow.ico",
  "/apple-touch-icon.png",
];

// Install: Cache static core files
self.addEventListener("install", (event) => {
  self.skipWaiting(); // Force activation
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_URLS);
    })
  );
});

// Activate: Clean up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((key) => {
          if (key !== CACHE_NAME && key !== DYNAMIC_CACHE) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// Fetch Strategy
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 1. Navigation Requests (HTML) -> Network First, Fallback to Cache
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clonedResponse = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, clonedResponse);
          });
          return response;
        })
        .catch(() => {
          return caches.match(request).then((response) => {
            return response || caches.match("/"); // Fallback to root (SPA support)
          });
        })
    );
    return;
  }

  // 2. Assets (JS, CSS, Images) -> Stale While Revalidate
  // This ensures fast load from cache, but updates in background for next visit
  if (
    url.origin === self.location.origin &&
    (url.pathname.match(/\.(js|css|png|jpg|jpeg|svg|json|ico)$/) ||
      request.destination === "style" ||
      request.destination === "script" ||
      request.destination === "image")
  ) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        const fetchPromise = fetch(request).then((networkResponse) => {
          // Update cache with new version
          caches.open(DYNAMIC_CACHE).then((cache) => {
            cache.put(request, networkResponse.clone());
          });
          return networkResponse;
        });

        // Return cached response immediately if available, else wait for network
        return cachedResponse || fetchPromise;
      })
    );
    return;
  }

  // 3. API calls / Others -> Network Only (Don't cache sensitive data usually)
  // For Firestore, the SDK handles its own offline persistence, so we let it pass through.
  return;
});
