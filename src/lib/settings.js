// Ustawienia aplikacji — lokalnie, synchronicznie (localStorage).
const KEY = "settings";

export const DEFAULT_SETTINGS = {
  sound: true, // sygnał końca przerwy
  vibrate: true, // wibracja przy sygnale
  remindPlan: true, // podpowiedź "dziś na planie" na ekranie głównym
  overdueAlert: true, // alerty zaległych treningów (dzwonek, kalendarz)
};

export function loadSettings() {
  try {
    return { ...DEFAULT_SETTINGS, ...JSON.parse(localStorage.getItem(KEY) || "{}") };
  } catch (e) {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(s) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch (e) {}
}
