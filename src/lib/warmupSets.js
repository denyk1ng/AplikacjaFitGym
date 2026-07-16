// Serie rozgrzewkowe liczone automatycznie z ciężaru roboczego.
// Zasada dla początkującego: przed cięższymi bojami 2–3 lekkie serie
// z rosnącym ciężarem i malejącą liczbą powtórzeń — bez zmęczenia mięśnia.
// Zwraca [] gdy rozgrzewka z obciążeniem nie ma sensu (mały ciężar / brak).

// zaokrąglenie do realnego skoku talerzy/hantli
function roundLoad(v, unit) {
  const step = unit && unit.startsWith("kg/") ? 1 : 2.5; // hantle/strona: co 1 kg, sztanga/maszyna: co 2,5 kg
  return Math.max(step, Math.round(v / step) * step);
}

export function warmupSetsFor(weight, unit) {
  if (!weight || weight < 20) return []; // przy małych ciężarach wystarczy 1. seria robocza wykonana spokojnie
  const plan =
    weight >= 40
      ? [
          { pct: 0.4, reps: 8 },
          { pct: 0.6, reps: 5 },
          { pct: 0.8, reps: 3 },
        ]
      : [
          { pct: 0.5, reps: 6 },
          { pct: 0.75, reps: 4 },
        ];
  const out = [];
  const seen = new Set();
  plan.forEach(({ pct, reps }) => {
    const w = roundLoad(weight * pct, unit);
    if (w >= weight || seen.has(w)) return; // rozgrzewka nie może dobić do ciężaru roboczego
    seen.add(w);
    out.push({ w, reps });
  });
  return out;
}
