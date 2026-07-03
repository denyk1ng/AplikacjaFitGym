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
