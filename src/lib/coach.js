// Heurystyczny "trener" — bez żadnego API, czysta analiza danych z workout_log.
// Wyłapuje sytuacje typu "3 treningi z rzędu ten sam ciężar, zawsze pełne serie
// → czas dodać ciężar" na podstawie realnych wpisów per-ćwiczenie z sesji na żywo.

const MIN_STREAK = 2; // ile ostatnich sesji z rzędu musi się powtórzyć, żeby coś zasugerować

function exerciseLabels(exercisesData) {
  const map = {};
  Object.values(exercisesData).forEach((day) =>
    day.exercises.forEach((e) => {
      map[e.id] = e.name.split("—")[0].trim();
    })
  );
  return map;
}

// per-ćwiczenie historia (ts, weight, completed) z wpisów workout_log, rosnąco
function buildHistory(workoutLog) {
  const hist = {};
  [...workoutLog]
    .sort((a, b) => a.ts - b.ts)
    .forEach((entry) => {
      (entry.perExercise || []).forEach((pe) => {
        if (!hist[pe.id]) hist[pe.id] = [];
        hist[pe.id].push({
          ts: entry.ts,
          weight: pe.weight || 0,
          unit: pe.unit || "kg",
          completed: pe.setsDone >= pe.sets,
          setsDone: pe.setsDone,
          sets: pe.sets,
        });
      });
    });
  return hist;
}

function suggestNextWeight(weight) {
  if (weight <= 0) return 0;
  if (weight < 20) return Math.round((weight + 1) * 2) / 2;
  return weight + 2.5;
}

// zwraca listę insightów posortowaną: najpierw "gotowy na więcej", potem "coś nie gra"
export function computeInsights(workoutLog, exercisesData) {
  const labels = exerciseLabels(exercisesData);
  const hist = buildHistory(workoutLog);
  const insights = [];

  Object.entries(hist).forEach(([id, entries]) => {
    if (entries.length < MIN_STREAK) return;
    const last = entries.slice(-MIN_STREAK);
    const label = labels[id] || id;
    const weight = last[last.length - 1].weight;

    if (weight > 0 && last.every((e) => e.weight === weight && e.completed)) {
      // policz pełny streak (może być dłuższy niż MIN_STREAK)
      let streak = 0;
      for (let i = entries.length - 1; i >= 0; i--) {
        if (entries[i].weight === weight && entries[i].completed) streak++;
        else break;
      }
      insights.push({
        kind: "increase",
        exerciseId: id,
        label,
        weight,
        unit: last[0].unit,
        streak,
        suggestedWeight: suggestNextWeight(weight),
        priority: 10 + streak,
      });
    } else if (last.every((e) => !e.completed)) {
      insights.push({
        kind: "struggle",
        exerciseId: id,
        label,
        weight,
        unit: last[0].unit,
        priority: 6,
      });
    }
  });

  return insights.sort((a, b) => b.priority - a.priority);
}

export function insightText(i) {
  if (!i) return null;
  if (i.kind === "increase") {
    const w = String(i.weight).replace(".", ",");
    const sw = String(i.suggestedWeight).replace(".", ",");
    return `${i.label}: ${i.streak} treningi z rzędu pełne serie przy ${w} ${i.unit} — czas dodać ciężar, spróbuj ${sw} ${i.unit}.`;
  }
  if (i.kind === "struggle") {
    return `${i.label}: ostatnie sesje bez kompletu serii — może warto obniżyć ciężar albo sprawdzić technikę.`;
  }
  return null;
}

export function cardText(insights) {
  if (insights.length === 0) return "Zrób kilka treningów, a zacznę podpowiadać kiedy dodać ciężar.";
  return insightText(insights[0]);
}
