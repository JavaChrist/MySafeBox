// MySafeBox Service Worker
// Le repère ci-dessous est remplacé à chaque construction (vite.config.ts) :
// le fichier change donc à chaque déploiement et le navigateur détecte la nouvelle version.
const BUILD_ID = "__MYSAFEBOX_BUILD_ID__";
const STATIC_CACHE = `mysafebox-static-${BUILD_ID}`;
const PAGE_CACHE = `mysafebox-pages-${BUILD_ID}`;

const STATIC_ASSETS = [
  "/index.html",
  "/MySafeBoxHeader.png",
  "/logo-180.png",
  "/logo-192.png",
  "/logo-512.png",
  "/favicon.ico",
  "/manifest.json",
];

// Pas de skipWaiting ici : la nouvelle version attend le clic sur « Mettre à jour ».
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(STATIC_ASSETS))
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((names) =>
        Promise.all(
          names
            .filter((name) => name !== STATIC_CACHE && name !== PAGE_CACHE)
            .map((name) => caches.delete(name))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  // Firebase, les autres sites et le serveur de l'application ne passent jamais par le cache.
  if (url.origin !== self.location.origin) return;
  if (
    url.pathname.startsWith("/api/") ||
    url.pathname === "/version.json" ||
    url.pathname === "/sw.js"
  ) {
    return;
  }

  // Pages : réseau d'abord, pour toujours servir la version en ligne ; le cache sert hors connexion.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(PAGE_CACHE).then((cache) => cache.put("/index.html", copy));
          }
          return response;
        })
        .catch(() =>
          caches.match("/index.html").then((cached) => cached || Response.error())
        )
    );
    return;
  }

  // Fichiers construits (noms uniques à chaque version) et icônes : cache d'abord.
  event.respondWith(
    caches.match(request).then(
      (cached) =>
        cached ||
        fetch(request).then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(STATIC_CACHE).then((cache) => cache.put(request, copy));
          }
          return response;
        })
    )
  );
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
