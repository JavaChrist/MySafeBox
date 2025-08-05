// MySafeBox Service Worker - PWA iPhone Ready
const CACHE_NAME = "mysafebox-v1.0.0";
const STATIC_CACHE = "mysafebox-static-v1";
const DYNAMIC_CACHE = "mysafebox-dynamic-v1";

// Assets à mettre en cache statique
const STATIC_ASSETS = [
  "/",
  "/index.html",
  "/MySafeBoxHeader.png",
  "/logo-180.png",
  "/logo-192.png",
  "/logo-512.png",
  "/favicon.ico",
  "/manifest.json",
];

// Installation du service worker
self.addEventListener("install", (event) => {
  console.log("MySafeBox SW: Installing...");

  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => {
        console.log("MySafeBox SW: Caching static assets");
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log("MySafeBox SW: Installation complete");
        return self.skipWaiting(); // Activation immédiate
      })
  );
});

// Activation du service worker
self.addEventListener("activate", (event) => {
  console.log("MySafeBox SW: Activating...");

  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter(
              (cacheName) =>
                cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE
            )
            .map((cacheName) => {
              console.log("MySafeBox SW: Deleting old cache:", cacheName);
              return caches.delete(cacheName);
            })
        );
      })
      .then(() => {
        console.log("MySafeBox SW: Activation complete");
        return self.clients.claim(); // Prise de contrôle immédiate
      })
  );
});

// Stratégie de cache pour les requêtes
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Stratégie Cache First pour les assets statiques
  if (
    STATIC_ASSETS.includes(url.pathname) ||
    url.pathname.startsWith("/assets/") ||
    url.pathname.endsWith(".js") ||
    url.pathname.endsWith(".css") ||
    url.pathname.endsWith(".png") ||
    url.pathname.endsWith(".ico")
  ) {
    event.respondWith(
      caches.match(request).then((response) => {
        return (
          response ||
          fetch(request).then((fetchResponse) => {
            const responseClone = fetchResponse.clone();
            caches
              .open(STATIC_CACHE)
              .then((cache) => cache.put(request, responseClone));
            return fetchResponse;
          })
        );
      })
    );
    return;
  }

  // Stratégie Network First pour les API calls FileStation
  if (
    url.pathname.includes("/webapi/") ||
    url.hostname !== self.location.hostname
  ) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache seulement les réponses GET réussies
          if (request.method === "GET" && response.status === 200) {
            const responseClone = response.clone();
            caches
              .open(DYNAMIC_CACHE)
              .then((cache) => cache.put(request, responseClone));
          }
          return response;
        })
        .catch(() => {
          // Fallback vers cache en cas d'erreur réseau
          return caches.match(request);
        })
    );
    return;
  }

  // Stratégie Cache First par défaut avec Network fallback
  event.respondWith(
    caches.match(request).then((response) => {
      return (
        response ||
        fetch(request)
          .then((fetchResponse) => {
            const responseClone = fetchResponse.clone();
            caches
              .open(DYNAMIC_CACHE)
              .then((cache) => cache.put(request, responseClone));
            return fetchResponse;
          })
          .catch(() => {
            // Fallback vers page principale pour les routes SPA
            if (request.mode === "navigate") {
              return caches.match("/index.html");
            }
          })
      );
    })
  );
});

// Messages du service worker (pour debug)
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }

  if (event.data && event.data.type === "GET_VERSION") {
    event.ports[0].postMessage({
      version: CACHE_NAME,
    });
  }
});
