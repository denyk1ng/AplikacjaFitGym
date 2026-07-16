// Haptyka jak w natywnej appce — krótkie wibracje na kluczowych akcjach.
// navigator.vibrate działa na Androidzie (Chrome); iOS Safari go nie wspiera,
// tam wywołanie po prostu nic nie robi — dlatego bez feature-detection w UI.
const canBuzz = () => typeof navigator !== "undefined" && typeof navigator.vibrate === "function";

// pojedyncze "tapnięcie" — zaliczenie serii, kliknięcie ważnego przycisku
export function buzzTap() {
  if (canBuzz()) navigator.vibrate(25);
}

// koniec przerwy między seriami — wyraźniejsze podwójne buczenie
export function buzzRestEnd() {
  if (canBuzz()) navigator.vibrate([70, 50, 70]);
}

// nowy rekord — "fanfara" wibracyjna przy konfetti
export function buzzRecord() {
  if (canBuzz()) navigator.vibrate([40, 30, 40, 30, 120]);
}
