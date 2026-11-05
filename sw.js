/* Dr. Kabir's Eye Files – offline service worker
   Naya version push karo to CACHE ka number badal do (v1 -> v2). */
const CACHE = "kabir-files-v1";
const CORE = ["./index.html", "./manifest.json", "./icon-192.png", "./icon-512.png", "./icon-maskable-512.png", "./apple-touch-icon.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  const url = new URL(req.url);
  // Sirf apni site ke GET requests. Azure TTS jaise bahari calls ko haath nahi lagate.
  if (req.method !== "GET" || url.origin !== location.origin) return;

  const isPage = req.mode === "navigate";
  const key = isPage ? "./index.html" : req;

  e.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const cached = await cache.match(key, { ignoreSearch: true });
      // Background me check: server pe naya ho to cache update (agli baar khulne par dikhega)
      const refresh = fetch(isPage ? "./index.html" : req, { cache: "no-cache" })
        .then((res) => { if (res && res.ok) cache.put(key, res.clone()); return res; })
        .catch(() => null);
      if (cached) { e.waitUntil(refresh); return cached; }
      const res = await refresh;
      return res || new Response("Offline", { status: 503, statusText: "Offline" });
    })
  );
});
