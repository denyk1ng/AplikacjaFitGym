// Automatyczna aktualizacja PWA: zainstalowana appka wznawiana z pamięci
// potrafi tygodniami trzymać starą wersję. Przy starcie, każdym powrocie do
// appki (visibilitychange) i co 15 min porównujemy hash bundla index-*.js
// z serwera z tym, który faktycznie działa — różnica oznacza nowy deploy
// i appka sama się przeładowuje (splash przy kolejnych otwarciach to ~0,8 s).
// Wyjątek: trwająca sesja treningowa (live_session) — wtedy nie przerywamy,
// aktualizacja wejdzie przy następnym otwarciu.

function runningBundle() {
  const s = document.querySelector('script[type="module"][src*="assets/index-"]');
  return s ? s.getAttribute("src") : null;
}

async function serverBundle() {
  // parametr fresh -> service worker celowo nie obsługuje tego żądania
  // (patrz sw.js), więc odpowiedź zawsze idzie z sieci, nie z cache
  const res = await fetch(`${import.meta.env.BASE_URL}index.html?fresh=${Date.now()}`, { cache: "no-store" });
  if (!res.ok) return null;
  const html = await res.text();
  const m = html.match(/src="([^"]*assets\/index-[^"]+\.js)"/);
  return m ? m[1] : null;
}

const sessionInProgress = () => {
  try {
    return !!localStorage.getItem("live_session");
  } catch (e) {
    return false;
  }
};

export function initAutoUpdate() {
  if (import.meta.env.DEV) return;
  const current = runningBundle();
  if (!current) return;

  let reloading = false;
  const check = async () => {
    if (reloading || document.visibilityState !== "visible") return;
    try {
      // przy okazji poproś przeglądarkę o sprawdzenie nowego sw.js
      const reg = await navigator.serviceWorker?.getRegistration?.();
      if (reg) reg.update().catch(() => {});
      const remote = await serverBundle();
      if (remote && remote !== current && !sessionInProgress()) {
        reloading = true;
        location.reload();
      }
    } catch (e) {} // brak netu itp. — spróbujemy następnym razem
  };

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") check();
  });
  setTimeout(check, 5000); // chwilę po starcie, żeby nie ścigać się z bootowaniem
  setInterval(check, 15 * 60 * 1000);
}
