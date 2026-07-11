// Lokalne przypomnienie o treningu — bez backendu, więc odpala się przy
// otwarciu/wznowieniu appki: jeśli użytkownik włączył przypomnienia, minęła
// jego zwykła pora treningu (typicalHour z historii, domyślnie 17:00),
// a dzisiejszy trening wciąż niezrobiony — pokazuje powiadomienie systemowe.
// Raz dziennie (klucz reminder_last), żeby nie spamować.
import { loadWorkoutLog, suggestToday, typicalHour } from "./workoutLog.js";
import { loadSettings } from "./settings.js";
import { EXERCISES_DATA } from "../data/plan.js";

export async function maybeTrainingReminder() {
  try {
    const s = loadSettings();
    if (!s.pushReminder) return;
    if (!("Notification" in window) || Notification.permission !== "granted") return;
    const today = new Date().toLocaleDateString("sv-SE");
    if (localStorage.getItem("reminder_last") === today) return;

    const log = await loadWorkoutLog();
    const sug = suggestToday(log);
    if (!sug) return; // dziś nic nie wisi — cardio/regeneracja albo komplet

    const hour = new Date().getHours();
    const typ = typicalHour(log);
    if (hour < (typ !== null ? typ : 17)) return; // jeszcze nie pora

    localStorage.setItem("reminder_last", today);
    const title = `Pora na ${EXERCISES_DATA[sug.type].label}`;
    const body = sug.overdue ? "Trening zaległy — tydzień kończy się w niedzielę." : "Twoja zwykła pora treningu. Wchodzisz?";
    const reg = await navigator.serviceWorker?.getRegistration?.();
    if (reg && reg.showNotification) {
      reg.showNotification(title, { body, icon: "icons/icon-192.png", badge: "icons/icon-192.png", tag: "forma-reminder" });
    } else {
      new Notification(title, { body });
    }
  } catch (e) {}
}
