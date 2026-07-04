// Instalacja PWA: łapiemy beforeinstallprompt (Android/Chrome) możliwie
// wcześnie, żeby przycisk "Zainstaluj" w Profilu mógł go odpalić.
let deferred = null;
const listeners = new Set();

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferred = e;
    listeners.forEach((f) => f(true));
  });
  window.addEventListener("appinstalled", () => {
    deferred = null;
    listeners.forEach((f) => f(false));
  });
}

export const canInstall = () => !!deferred;

export function onInstallable(f) {
  listeners.add(f);
  return () => listeners.delete(f);
}

export async function promptInstall() {
  if (!deferred) return false;
  deferred.prompt();
  const choice = await deferred.userChoice;
  deferred = null;
  return choice.outcome === "accepted";
}

// już uruchomiona z ikonki na pulpicie?
export const isStandalone = () =>
  window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;

export const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent);
