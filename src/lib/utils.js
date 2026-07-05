// szacowane maksimum na jedno powtórzenie (wzór Epley) — na bazie ciężaru
// roboczego i docelowych powtórzeń z planu; zwraca null gdy powtórzenia
// nie są liczbą (np. ćwiczenia czasowe "30s" albo ciężar własny)
export function estimate1RM(weight, reps) {
  const r = parseInt(reps);
  if (!weight || weight <= 0 || !r || r <= 0) return null;
  if (r === 1) return weight;
  return Math.round(weight * (1 + r / 30) * 10) / 10;
}

export function formatRest(s) {
  if (s >= 120) return `${s / 60} min`;
  if (s >= 60) return "1 min";
  return `${s}s`;
}

export function isoWeekStart(ts) {
  const d = new Date(ts);
  const day = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export function computeStreak(snapshots) {
  if (!snapshots.length) return 0;
  const WEEK = 7 * 24 * 3600 * 1000;
  const weeks = Array.from(new Set(snapshots.map((s) => isoWeekStart(s.ts)))).sort((a, b) => b - a);
  const nowW = isoWeekStart(Date.now());
  let expect = null;
  if (weeks[0] === nowW) expect = nowW;
  else if (weeks[0] === nowW - WEEK) expect = nowW - WEEK;
  else return 0;
  let streak = 0;
  for (const w of weeks) {
    if (w === expect) {
      streak++;
      expect -= WEEK;
    } else if (w < expect) break;
  }
  return streak;
}

export function computeTotalGain(snapshots) {
  const first = {},
    last = {};
  const sorted = [...snapshots].sort((a, b) => a.ts - b.ts);
  sorted.forEach((s) => {
    Object.entries(s.weights || {}).forEach(([id, w]) => {
      if (!(id in first)) first[id] = w;
      last[id] = w;
    });
  });
  let g = 0;
  Object.keys(first).forEach((id) => {
    g += last[id] - first[id];
  });
  return Math.round(g * 100) / 100;
}

export function earnedBadges(snapCount, streak, gain) {
  return {
    first: snapCount >= 1,
    s3: streak >= 3,
    g5: gain >= 5,
    n10: snapCount >= 10,
    g15: gain >= 15,
    s6: streak >= 6,
  };
}
