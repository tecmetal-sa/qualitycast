// sw.js — Service Worker para QualityCast offline
// ⚠️  Si cambiás algo en index.html, incrementá el número de versión
const CACHE_NAME = "qc-v2";

// Todos los recursos que la app necesita para funcionar sin internet
const ASSETS = [
  "/",
  "/index.html",
  "/manifest.json",
  "/icon-192.png",
  "/icon-512.png",
  // React desde CDN — se cachean en la primera visita con conexión
  "https://unpkg.com/react@18/umd/react.production.min.js",
  "https://unpkg.com/react-dom@18/umd/react-dom.production.min.js",
];

// Instalar: cachear todo en la primera visita (requiere conexión esa vez)
self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return Promise.allSettled(
        ASSETS.map(url =>
          cache.add(url).catch(err => {
            console.warn("No se pudo cachear:", url, err);
          })
        )
      );
    })
  );
  self.skipWaiting();
});

// Activar: limpiar caches viejos
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// Fetch: cache-first para todo (la app funciona sin red después de la primera visita)
self.addEventListener("fetch", (e) => {
  // No interceptar requests a Apps Script
  if (e.request.url.includes("script.google.com")) return;

  e.respondWith(
    caches.match(e.request).then((cached) => {
      if (cached) return cached;

      // No está en cache → buscar en red y guardar para la próxima
      return fetch(e.request).then((response) => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(e.request, clone));
        }
        return response;
      }).catch(() => {
        // Sin red y sin cache: devolver index para navegación HTML
        if (e.request.headers.get("accept")?.includes("text/html")) {
          return caches.match("/index.html");
        }
      });
    })
  );
});
