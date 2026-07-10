// Dziennik wykonanych treningów A/B/C + logika tygodnia.
// Zasada: każdy z treningów A, B, C ma być zrobiony w ciągu pełnego tygodnia (pn–nd).
// Dni są elastyczne — plan (pn/śr/pt) to tylko domyślna podpowiedź.
import { isoWeekStart } from "./utils.js";
import { storage } from "./storage.js";

export const PLAN_DOW = { A: 1, B: 3, C: 5 }; // domyślne dni: pn / śr / pt
const DAY = 24 * 3600 * 1000;

export const DOW_NAMES = ["niedziela", "poniedziałek", "wtorek", "środa", "czwartek", "piątek", "sobota"];

export async function loadWorkoutLog() {
  try {
    const r = await storage.get("workout_log");
    if (r && r.value) return JSON.parse(r.value);
  } catch (e) {}
  return [];
}

export function saveWorkoutLog(log) {
  storage.set("workout_log", JSON.stringify(log));
}

// pozycja dnia w tygodniu: poniedziałek = 0 ... niedziela = 6
export const dayIndex = (dow) => (dow + 6) % 7;

export function weekEntries(log, ref = Date.now()) {
  const start = isoWeekStart(ref);
  return log.filter((e) => e.ts >= start && e.ts < start + 7 * DAY);
}

// status treningów A/B/C w tygodniu zawierającym `ref`
export function weekStatus(log, ref = Date.now()) {
  const entries = weekEntries(log, ref);
  const todayIdx = dayIndex(new Date(ref).getDay());
  const res = {};
  ["A", "B", "C"].forEach((k) => {
    const e = entries.find((x) => x.type === k);
    const plannedIdx = dayIndex(PLAN_DOW[k]);
    res[k] = {
      done: !!e,
      ts: e ? e.ts : null,
      plannedDow: PLAN_DOW[k],
      // zaległy = planowany dzień minął, a trening niezrobiony
      overdue: !e && todayIdx > plannedIdx,
    };
  });
  return res;
}

// co dziś trenować: najpierw dzisiejszy plan, potem zaległości (A przed B przed C)
export function suggestToday(log, ref = Date.now()) {
  const st = weekStatus(log, ref);
  const dow = new Date(ref).getDay();
  const todayPlan = Object.keys(PLAN_DOW).find((k) => PLAN_DOW[k] === dow) || null;
  if (todayPlan && !st[todayPlan].done) return { type: todayPlan, overdue: st[todayPlan].overdue };
  const overdue = ["A", "B", "C"].find((k) => st[k].overdue);
  if (overdue) return { type: overdue, overdue: true };
  return null; // wszystko na dziś zrobione — cardio / regeneracja wg planu
}

// seria tygodni z min. 1 treningiem (bieżący tydzień w toku nie przerywa serii)
export function logStreak(log, ref = Date.now()) {
  const WEEK = 7 * DAY;
  const has = (ws) => log.some((e) => e.ts >= ws && e.ts < ws + WEEK);
  let w = isoWeekStart(ref);
  let streak = 0;
  if (!has(w)) w -= WEEK;
  while (has(w)) {
    streak++;
    w -= WEEK;
  }
  return streak;
}

// objętość (kg) per tydzień: z zapisanych sesji, a dla wpisów odhaczonych
// ręcznie w kalendarzu — szacunkowo z planu (serie × powtórzenia × ciężar)
export function weekVolumes(log, exercisesData, weeks = 6, ref = Date.now()) {
  const start = isoWeekStart(ref);
  const planVol = (type) => {
    const day = exercisesData[type];
    if (!day) return 0;
    return day.exercises.reduce((s, e) => s + (e.sets || 0) * (parseInt(e.reps) || 0) * (e.weight || 0), 0);
  };
  return Array.from({ length: weeks }, (_, i) => {
    const wStart = start - (weeks - 1 - i) * 7 * DAY;
    const entries = log.filter((e) => e.ts >= wStart && e.ts < wStart + 7 * DAY);
    const vol = entries.reduce((s, e) => s + (typeof e.volume === "number" ? e.volume : planVol(e.type)), 0);
    const d = new Date(wStart);
    return { label: `${d.getDate()}.${String(d.getMonth() + 1).padStart(2, "0")}`, vol: Math.round(vol), count: entries.length, isCurrent: wStart === start };
  });
}

// objętość (kg) łącznie per partia mięśniowa (cat) — na bazie perExercise
// zapisanego przy realnych sesjach na żywo (LiveSession); wpisy odhaczone
// ręcznie w kalendarzu nie mają perExercise i nie wchodzą do tego rozbicia
export function volumeByCategory(log, exercisesData) {
  const meta = {};
  Object.values(exercisesData).forEach((day) => day.exercises.forEach((e) => (meta[e.id] = e)));
  const totals = {};
  log.forEach((entry) => {
    (entry.perExercise || []).forEach((pe) => {
      const e = meta[pe.id];
      if (!e) return;
      const vol = (parseInt(e.reps) || 0) * pe.setsDone * (pe.weight || 0);
      totals[e.cat] = (totals[e.cat] || 0) + vol;
    });
  });
  return totals;
}

// najczęstsza godzina treningu (tryb) na bazie znaczników czasu z historii —
// używane do przypomnienia "zwykle trenujesz teraz"; null gdy za mało danych
export function typicalHour(log, minEntries = 3) {
  if (log.length < minEntries) return null;
  const counts = {};
  log.forEach((e) => {
    const h = new Date(e.ts).getHours();
    counts[h] = (counts[h] || 0) + 1;
  });
  let best = null;
  let bestCount = 0;
  Object.entries(counts).forEach(([h, c]) => {
    if (c > bestCount) {
      bestCount = c;
      best = parseInt(h);
    }
  });
  return best;
}

// podsumowanie ostatnich tygodni: ile z 3 treningów zrobiono
export function weekHistory(log, weeks = 4, ref = Date.now()) {
  const start = isoWeekStart(ref);
  return Array.from({ length: weeks }, (_, i) => {
    const wStart = start - (weeks - 1 - i) * 7 * DAY;
    const st = weekStatus(log, wStart + DAY);
    const done = ["A", "B", "C"].filter((k) => st[k].done).length;
    const d = new Date(wStart);
    return {
      label: `${d.getDate()}.${String(d.getMonth() + 1).padStart(2, "0")}`,
      done,
      isCurrent: wStart === start,
    };
  });
}
