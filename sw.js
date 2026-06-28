// Strompreis-Cockpit – Service Worker
// Cache-Version bei jedem Update erhöhen (v2 -> v3 ...), damit iOS die neuen Dateien lädt.
const CACHE = "strompreis-v5";

const SHELL = [
  "./",
  "index.html",
  "manifest.webmanifest",
  "icon-192.png",
  "icon-512.png",
  "icon-maskable-512.png",
  "apple-touch-icon.png"
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);

  // WICHTIG: Nur eigene Dateien behandeln. Alles Fremde (z. B. die Börsenpreis-API)
  // wird NICHT abgefangen – der Browser holt es direkt, wie ohne Service Worker.
  if (url.origin !== self.location.origin) return;
  if (e.request.method !== "GET") return;

  // App-Shell: erst Cache, dann Netz (und frisch nachcachen)
  e.respondWith(
    caches.match(e.request).then((hit) => {
      if (hit) return hit;
      return fetch(e.request)
        .then((res) => {
          if (res && res.status === 200) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(e.request, copy));
          }
          return res;
        })
        .catch(() => caches.match("index.html"));
    })
  );
});
