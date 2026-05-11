// sw.js — Service Worker para QualityCast offline
// ⚠️  Si cambiás algo en index.html, incrementá el número de versión
const CACHE_NAME = "qc-v3";

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

// Fetch: network-first para index.html (siempre toma la versión más nueva)
//         cache-first para todo lo demás (React, íconos, etc.)
self.addEventListener("fetch", (e) => {
  // No interceptar requests a Apps Script
  if (e.request.url.includes("script.google.com")) return;

  const isHTML = e.request.url.endsWith("/") || e.request.url.endsWith(".html");

  if (isHTML) {
    // index.html: intentar red primero, cache como fallback offline
    e.respondWith(
      fetch(e.request).then((response) => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(e.request, clone));
        return response;
      }).catch(() => caches.match(e.request))
    );
  } else {
    // Resto (React CDN, íconos, manifest): cache-first
    e.respondWith(
      caches.match(e.request).then((cached) => {
        if (cached) return cached;
        return fetch(e.request).then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(e.request, clone));
          }
          return response;
        });
      })
    );
  }
});
