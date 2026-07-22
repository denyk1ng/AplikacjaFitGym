// Kopia zapasowa w czasie rzeczywistym — bez żadnej akcji użytkownika.
// localStorage bywa czyszczony przez system/przeglądarkę (np. iOS po długiej
// nieaktywności), więc każda zmiana danych jest automatycznie odkładana
// do IndexedDB (osobny, trwalszy magazyn). Przy starcie: jeśli localStorage
// jest pusty, a kopia w IndexedDB istnieje — dane wracają same, zanim
// aplikacja się wyrenderuje. Ręczny eksport/import w Profilu zostaje jako
// dodatkowa warstwa (przeniesienie na inny telefon).

const DB_NAME = "forma-backup";
const STORE = "kv";
const RECORD_KEY = "mirror";

// klucze appki, które podlegają kopii (bez śmieci typu cache innych skryptów)
const APP_KEYS = [
  "plan_custom",
  "progress_snapshots",
  "workout_log",
  "body_weight_log",
  "profile",
  "fav_exercises",
  "forma_onboarded",
  "settings",
  "warmup_progress",
  "monthly_goal",
  "live_session",
  "last_cat",
  "fav_quotes",
  "reminder_last",
  "walkthrough_done",
];

function openDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function idbGet(db, key) {
  return new Promise((resolve, reject) => {
    const req = db.transaction(STORE, "readonly").objectStore(STORE).get(key);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function idbSet(db, key, value) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(value, key);
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
}

// zrzut aktualnego stanu localStorage do IndexedDB
export async function mirrorNow() {
  try {
    const data = {};
    APP_KEYS.forEach((k) => {
      const v = localStorage.getItem(k);
      if (v !== null) data[k] = v;
    });
    if (Object.keys(data).length === 0) return; // nic nie nadpisuj pustką
    const db = await openDb();
    await idbSet(db, RECORD_KEY, { ts: Date.now(), data });
    db.close();
  } catch (e) {}
}

// automatyczne odzyskanie: localStorage bez danych appki + istniejąca kopia
// => przywróć wszystko. Zwraca true, gdy coś przywrócono.
export async function restoreIfEmpty() {
  try {
    const hasData = ["forma_onboarded", "workout_log", "progress_snapshots", "plan_custom"].some((k) => localStorage.getItem(k) !== null);
    if (hasData) return false;
    const db = await openDb();
    const rec = await idbGet(db, RECORD_KEY);
    db.close();
    if (!rec || !rec.data) return false;
    Object.entries(rec.data).forEach(([k, v]) => localStorage.setItem(k, v));
    return true;
  } catch (e) {
    return false;
  }
}

let scheduled = null;
function scheduleMirror() {
  if (scheduled) return;
  scheduled = setTimeout(() => {
    scheduled = null;
    mirrorNow();
  }, 800); // krótki debounce — seria zapisów (np. w sesji live) = jeden zrzut
}

// uruchamiane raz przy starcie: każda zmiana localStorage odkłada kopię
export function initBackupMirror() {
  try {
    // trwałość magazynu — przeglądarka ma nie czyścić danych appki przy presji na dysk
    if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
    const origSet = localStorage.setItem.bind(localStorage);
    const origRemove = localStorage.removeItem.bind(localStorage);
    localStorage.setItem = (k, v) => {
      origSet(k, v);
      scheduleMirror();
    };
    localStorage.removeItem = (k) => {
      origRemove(k);
      scheduleMirror();
    };
    // dodatkowe zrzuty: przy chowaniu appki i okresowo w tle
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") mirrorNow();
    });
    setInterval(mirrorNow, 5 * 60 * 1000);
    mirrorNow();
  } catch (e) {}
}
