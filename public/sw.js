// Service worker FORMA — appka działa offline po pierwszym wejściu.
// Nawigacje: najpierw sieć (świeża wersja), przy braku netu — cache.
// Zasoby (js/css/obrazy/fonty): najpierw cache, dociągane raz z sieci.
const CACHE = "forma-v3";
const MAX_ENTRIES = 90; // stare hashowane bundle z poprzednich deployów nie mogą rosnąć bez końca

async function trimCache() {
  const c = await caches.open(CACHE);
  const keys = await c.keys();
  if (keys.length <= MAX_ENTRIES) return;
  // najstarsze wpisy siedzą na początku listy — usuwamy nadmiar
  await Promise.all(keys.slice(0, keys.length - MAX_ENTRIES).map((k) => c.delete(k)));
}

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches
      .open(CACHE)
      .then((c) => c.addAll(["./", "./index.html", "./manifest.webmanifest"]))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.searchParams.has("fresh")) return; // auto-aktualizacja pyta o wersję prosto z sieci
  const isFont = url.hostname.endsWith("gstatic.com") || url.hostname.endsWith("googleapis.com");
  if (url.origin !== location.origin && !isFont) return;

  if (req.mode === "navigate") {
    // `cache: "no-store"` omija cache HTTP przeglądarki. GitHub Pages wysyła
    // dla index.html `cache-control: max-age=600`, więc bez tego "najpierw
    // sieć" i tak potrafiło zwrócić starą stronę (a z nią stary bundel)
    // jeszcze przez 10 minut po deployu. Fetch po URL, nie po samym `req` —
    // konstruowanie Requestu z trybem "navigate" i initem bywa odrzucane.
    e.respondWith(
      fetch(req.url, { cache: "no-store", credentials: "same-origin" })
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
          return res;
        })
        .catch(() => caches.match(req).then((m) => m || caches.match("./index.html")))
    );
    return;
  }

  e.respondWith(
    caches.match(req).then(
      (hit) =>
        hit ||
        fetch(req).then((res) => {
          if (res.ok || res.type === "opaque") {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy)).then(trimCache);
          }
          return res;
        })
    )
  );
});
