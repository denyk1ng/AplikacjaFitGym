import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import "./lib/install.js"; // musi się załadować zanim przeglądarka wyśle beforeinstallprompt
import { initAutoUpdate } from "./lib/autoUpdate.js";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Blokada zoomu jak w natywnej aplikacji: iOS Safari ignoruje user-scalable=no
// w karcie przeglądarki, więc pinch ubijamy na zdarzeniach gesture*;
// zoom podwójnym tapnięciem załatwia touch-action w index.css
["gesturestart", "gesturechange", "gestureend"].forEach((ev) =>
  document.addEventListener(ev, (e) => e.preventDefault(), { passive: false })
);

// PWA: rejestracja service workera (instalacja na pulpicie + offline)
// + automatyczne wykrywanie nowych deployów (src/lib/autoUpdate.js)
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`, { updateViaCache: "none" }).catch(() => {});
  });
}
initAutoUpdate();
