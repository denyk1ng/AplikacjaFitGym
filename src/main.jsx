import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import "./lib/install.js"; // musi się załadować zanim przeglądarka wyśle beforeinstallprompt
import { initAutoUpdate } from "./lib/autoUpdate.js";
import { initBackupMirror, restoreIfEmpty } from "./lib/backup.js";

// Kopia zapasowa real-time: najpierw ewentualne automatyczne odzyskanie danych
// z IndexedDB (gdy przeglądarka wyczyściła localStorage), dopiero potem render —
// inaczej appka wstałaby "na pusto" i pokazała onboarding zamiast danych.
restoreIfEmpty().finally(() => {
  initBackupMirror();
  ReactDOM.createRoot(document.getElementById("root")).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
});

// Blokada zoomu jak w natywnej aplikacji: iOS Safari ignoruje user-scalable=no
// w karcie przeglądarki, więc pinch ubijamy na zdarzeniach gesture*;
// zoom podwójnym tapnięciem załatwia touch-action w index.css
["gesturestart", "gesturechange", "gestureend"].forEach((ev) =>
  document.addEventListener(ev, (e) => e.preventDefault(), { passive: false })
);

// Blokada orientacji na pion — działa w zainstalowanej PWA (Android);
// tam gdzie API jest niedostępne (iOS, karta przeglądarki) łapie ją
// nakładka "obróć telefon" w index.css, aktywna tylko na ekranach dotykowych
try {
  if (screen.orientation && screen.orientation.lock) screen.orientation.lock("portrait").catch(() => {});
} catch (e) {}

// PWA: rejestracja service workera (instalacja na pulpicie + offline)
// + automatyczne wykrywanie nowych deployów (src/lib/autoUpdate.js)
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`, { updateViaCache: "none" }).catch(() => {});
  });
}
initAutoUpdate();
