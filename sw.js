// sw.js — Service Worker para QualityCast offline
// Versión del cache: incrementar cuando cambies assets
const CACHE_NAME = "qc-v1";
const ASSETS = ["/", "/index.html"];

// Instalar: cachear el shell de la app
self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((c) => c.addAll(ASSETS))
  );
  self.skipWaiting();
});

// Activar: limpiar caches viejos
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: cache-first para el shell, network-first para APIs
self.addEventListener("fetch", (e) => {
  // No interceptar requests a Apps Script (cross-origin con google.script.run)
  if (e.request.url.includes("script.google.com")) return;

  e.respondWith(
    caches.match(e.request).then((cached) => {
      if (cached) return cached;
      return fetch(e.request).then((response) => {
        // Cachear respuestas válidas del mismo origen
        if (response && response.status === 200 && response.type === "basic") {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((c) => c.put(e.request, clone));
        }
        return response;
      }).catch(() => {
        // Si falla la red y es HTML, devolver index cacheado
        if (e.request.headers.get("accept")?.includes("text/html")) {
          return caches.match("/index.html");
        }
      });
    })
  );
});
