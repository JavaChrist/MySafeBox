// MySafeBox Service Worker - PWA iPhone Ready - FORCE UPDATE
const CACHE_NAME = "mysafebox-v2.0.0-FORCE";
const STATIC_CACHE = "mysafebox-static-v2-FORCE";
const DYNAMIC_CACHE = "mysafebox-dynamic-v2-FORCE";

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
  console.log("MySafeBox SW: Activating - FORCE CACHE CLEAR...");

  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        console.log("MySafeBox SW: Found caches:", cacheNames);
        // SUPPRIME TOUS LES ANCIENS CACHES
        return Promise.all(
          cacheNames.map((cacheName) => {
            console.log("MySafeBox SW: FORCE DELETING cache:", cacheName);
            return caches.delete(cacheName);
          })
        );
      })
      .then(() => {
        console.log("MySafeBox SW: ALL CACHES CLEARED - Activation complete");
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
