import { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar } from "recharts";
import { TrendingUp, Award, Flame, Target, Dumbbell, Medal, Crown, BarChart3, Radar as RadarIcon, Rocket, Layers, Trophy, Moon, Star, Share2, Check } from "lucide-react";
import { T, FONT_NUM, TR, stagger } from "../theme.js";
import { EmptyState } from "./EmptyState.jsx";
import { EditNum, EditStr } from "./Editable.jsx";
import { EXERCISES_DATA, BADGES, CAT_LABEL } from "../data/plan.js";
import { computeTotalGain, earnedBadges, isoWeekStart, CHART_ANIM, prefersReducedMotion } from "../lib/utils.js";
import { loadWorkoutLog, weekStatus, logStreak, weekVolumes, volumeByCategory, weekHistory, weekEntries } from "../lib/workoutLog.js";
import { shareProgressImage } from "../lib/shareCard.js";

const U = "'Urbanist',sans-serif";
const fmtVol = (v) => (v >= 10000 ? `${Math.round(v / 1000)}k` : v >= 1000 ? `${(Math.round(v / 100) / 10).toString().replace(".", ",")}k` : String(v));
const pl = (n) => String(n).replace(".", ",");
// skróty dni tygodnia dla łańcucha passy (pon.–niedz., jak isoWeekStart)
const DOW_SHORT = ["PN", "WT", "ŚR", "CZ", "PT", "SB", "ND"];

// ikony odznak (bez emoji — spójnie z resztą designu)
const BADGE_ICON = {
  first: Target,
  s3: Flame,
  g5: Dumbbell,
  n10: Medal,
  g15: TrendingUp,
  s6: Crown,
  s12: Rocket,
  sessions25: Layers,
  sessions50: Trophy,
  vol10k: BarChart3,
  perfectMonth: Star,
  nightOwl: Moon,
};

// pierścień celu tygodnia — pokazuje ułamek (np. "1/3"), gdy podany, inaczej %
function GoalRing({ pct, size = 86, fraction }) {
  const S = size;
  const R = (S - 12) / 2;
  const C = 2 * Math.PI * R;
  const p = Math.min(Math.max(pct, 0), 100);
  return (
    <div style={{ position: "relative", width: S, height: S }}>
      <svg width={S} height={S} viewBox={`0 0 ${S} ${S}`}>
        <circle cx={S / 2} cy={S / 2} r={R} fill="none" stroke={T.track} strokeWidth="8" />
        <circle
          cx={S / 2}
          cy={S / 2}
          r={R}
          fill="none"
          stroke={T.accent}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={`${(p / 100) * C} ${C}`}
          transform={`rotate(-90 ${S / 2} ${S / 2})`}
          style={{ transition: "stroke-dasharray .6s cubic-bezier(.22,1,.36,1)" }}
        />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FONT_NUM, fontWeight: 800, fontSize: fraction ? Math.round(S * 0.19) : 19, color: "#fff" }}>
        {fraction || `${p}%`}
      </div>
    </div>
  );
}

export function StatsTab({ snapshots, exercises, onChangeWeight, onChangeReps, onChangeSets }) {
  const [range, setRange] = useState(0);
  const [filterDay, setFilterDay] = useState("A");
  const [log, setLog] = useState([]);
  const [sharingId, setSharingId] = useState(null);

  useEffect(() => {
    loadWorkoutLog().then(setLog);
  }, []);

  const now = Date.now();
  const filtered = range === 0 ? snapshots : snapshots.filter((s) => s.ts >= now - range * 24 * 3600 * 1000);

  // jedno źródło prawdy dla serii tygodni: dziennik treningów (nie zapisy
  // ciężarów) — ta sama definicja co na ekranie głównym
  const streak = logStreak(log);
  const gain = computeTotalGain(snapshots);
  const sessionsCount = log.filter((e) => e.perExercise && e.perExercise.length > 0).length;
  const totalVolume = log.reduce((s, e) => s + (e.volume || 0), 0);
  const last4Completed = weekHistory(log, 5).slice(0, 4);
  const perfectMonths = last4Completed.length === 4 && last4Completed.every((w) => w.done === 3);
  const nightOwl = log.some((e) => new Date(e.ts).getHours() >= 21);
  const badgeMap = earnedBadges({ snapCount: snapshots.length, streak, gain, sessionsCount, totalVolume, perfectMonths, nightOwl });

  // rekordy życiowe: maksymalny ciężar per ćwiczenie z całej historii
  // (zapisy ciężarów + realne sesje na żywo) wraz z datą ustanowienia
  const records = (() => {
    const meta = {};
    Object.values(EXERCISES_DATA).forEach((d) => d.exercises.forEach((e) => (meta[e.id] = e)));
    const best = {};
    snapshots.forEach((s) =>
      Object.entries(s.weights || {}).forEach(([id, w]) => {
        if (!best[id] || w > best[id].w) best[id] = { w, ts: s.ts };
      })
    );
    log.forEach((en) =>
      (en.perExercise || []).forEach((pe) => {
        if (pe.weight > 0 && (!best[pe.id] || pe.weight > best[pe.id].w)) best[pe.id] = { w: pe.weight, ts: en.ts };
      })
    );
    return Object.entries(best)
      .filter(([id]) => meta[id])
      .map(([id, b]) => ({ id, name: meta[id].name.split("—")[0].trim(), unit: meta[id].unit || "kg", ...b }))
      .sort((a, b) => b.w - a.w);
  })();
  const [showAllRecords, setShowAllRecords] = useState(false);

  const st = weekStatus(log);
  const doneCount = ["A", "B", "C"].filter((k) => st[k].done).length;
  const goalPct = Math.round((doneCount / 3) * 100);
  const vols = weekVolumes(log, EXERCISES_DATA, 6);

  // przeniesione z ekranu Dom: cel miesiąca, wyzwanie tygodnia i łańcuch dni
  const monthlyGoal = (() => {
    const v = parseInt(localStorage.getItem("monthly_goal") || "12", 10);
    return !isNaN(v) && v > 0 ? v : 12;
  })();
  const today = new Date();
  const monthDone = log.filter((e) => {
    const d = new Date(e.ts);
    return ["A", "B", "C"].includes(e.type) && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
  }).length;
  const monthPct = Math.min(monthDone / monthlyGoal, 1);
  const monthName = today.toLocaleDateString("pl-PL", { month: "long" });

  // wyzwanie tygodnia — rotacja 3 typów po numerze tygodnia, postęp z dziennika
  const WEEK_MS = 7 * 24 * 3600 * 1000;
  const weekStartTs = isoWeekStart(now);
  const wkEntries = weekEntries(log);
  const lastWeekVol = vols[vols.length - 2]?.vol || 0;
  const curWeekVol = vols[vols.length - 1]?.vol || 0;
  const chType = Math.floor(weekStartTs / WEEK_MS) % 3;
  const challenge =
    chType === 1
      ? { label: "Zalicz 60 serii w tym tygodniu", cur: wkEntries.reduce((s, e) => s + (e.sets || 0), 0), target: 60, fmt: (v) => String(v) }
      : chType === 2 && lastWeekVol > 0
        ? { label: "Pobij objętość zeszłego tygodnia", cur: curWeekVol, target: lastWeekVol, fmt: fmtVol, beat: true }
        : { label: "Zrób komplet: A + B + C", cur: doneCount, target: 3, fmt: (v) => String(v) };
  const chDone = challenge.beat ? challenge.cur > challenge.target : challenge.cur >= challenge.target;
  const chPct = Math.min(challenge.cur / Math.max(challenge.target, 1), 1);

  // łańcuch passy — dni bieżącego tygodnia (pon.–niedz.), dziś z obwódką
  const dayCounts = (() => {
    const c = [0, 0, 0, 0, 0, 0, 0];
    wkEntries.forEach((e) => {
      c[(new Date(e.ts).getDay() + 6) % 7]++;
    });
    return c;
  })();
  const todayIdx = (today.getDay() + 6) % 7;
  const weekBars = weekHistory(log, 5).map((w) => w.done / 3);
  const maxVol = Math.max(...vols.map((v) => v.vol), 1);
  const catTotals = volumeByCategory(log, EXERCISES_DATA);
  const catData = Object.keys(CAT_LABEL).map((cat) => ({ cat: CAT_LABEL[cat], vol: Math.round(catTotals[cat] || 0) }));
  const hasCatData = Object.keys(catTotals).length > 0;

  const getList = () => {
    const days = filterDay === "ALL" ? ["A", "B", "C"] : [filterDay];
    const seen = new Set();
    const result = [];
    days.forEach((d) =>
      EXERCISES_DATA[d].exercises.forEach((e) => {
        if (e.weight > 0 && !seen.has(e.id)) {
          seen.add(e.id);
          result.push({ ...e, dayKey: d, dayColor: EXERCISES_DATA[d].color });
        }
      })
    );
    return result;
  };
  const list = getList();

  // aktualny ciężar/powtórzenia z żywego stanu planu (może się różnić od
  // statycznych danych EXERCISES_DATA, jeśli użytkownik już je edytował)
  const liveVersionOf = (exId) => {
    if (!exercises) return null;
    for (const d of Object.values(exercises)) {
      const found = d.exercises.find((e) => e.id === exId);
      if (found) return found;
    }
    return null;
  };

  const historyOf = (exId) =>
    filtered
      .map((snap) => {
        const w = (snap.weights || {})[exId];
        return w !== undefined ? { date: snap.date, dateShort: snap.dateShort, weight: w, ts: snap.ts } : null;
      })
      .filter(Boolean)
      .sort((a, b) => a.ts - b.ts);

  return (
    <div>
      {/* AKTYWNOŚĆ — trzy przejrzyste kafelki: Treningi (pierścień) / Progres (słupki) / Cel miesiąca */}
      <div className="fu" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 10 }}>
        <div style={{ background: T.card, border: `1px solid ${T.borderSoft}`, borderRadius: 20, padding: "12px 10px", display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5, alignSelf: "flex-start" }}>
            <Check size={12} color={T.accent} strokeWidth={2.6} />
            <span style={{ fontSize: 10, color: T.soft, fontWeight: 700 }}>Treningi</span>
          </div>
          <GoalRing pct={goalPct} size={72} fraction={`${doneCount}/3`} />
          <div style={{ textAlign: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 4, justifyContent: "center" }}>
              <Flame size={10} color={T.accent} strokeWidth={2.4} />
              <span style={{ fontSize: 9.5, color: T.soft, fontWeight: 700 }}>Seria</span>
            </div>
            <div style={{ fontSize: 9.5, color: T.sub, marginTop: 2 }}>{streak} tyg. z rzędu</div>
          </div>
        </div>

        <div style={{ background: T.card, border: `1px solid ${T.borderSoft}`, borderRadius: 20, padding: "12px 10px", display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <TrendingUp size={12} color={T.accent} strokeWidth={2.4} />
            <span style={{ fontSize: 10, color: T.soft, fontWeight: 700 }}>Progres</span>
          </div>
          <div style={{ flex: 1, display: "flex", alignItems: "flex-end", justifyContent: "center", gap: 5, minHeight: 56 }}>
            {weekBars.map((v, i) => (
              <div key={i} style={{ width: 8, height: `${Math.max(v * 100, 10)}%`, borderRadius: 99, background: i === weekBars.length - 1 ? T.accent : "rgba(178,238,55,0.30)" }} />
            ))}
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 9.5, color: T.sub }}>{streak} tyg. z rzędu</div>
            <div style={{ fontSize: 9, color: T.faint, marginTop: 1 }}>{streak > 0 ? "Świetna robota!" : "Zacznij ten tydzień"}</div>
          </div>
        </div>

        <div style={{ background: T.card, border: `1px solid ${T.borderSoft}`, borderRadius: 20, padding: 12, display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <Target size={12} color={T.accent} strokeWidth={2.4} />
            <span style={{ flex: 1, minWidth: 0, fontSize: 10, color: T.soft, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>Cel na {monthName}</span>
          </div>
          <div style={{ fontFamily: FONT_NUM, fontWeight: 800, fontSize: 15, color: monthDone >= monthlyGoal ? T.ok : T.accent, marginTop: 8 }}>
            {monthDone}
            <span style={{ color: T.sub, fontSize: 11 }}>/{monthlyGoal}</span>
          </div>
          <div style={{ height: 6, borderRadius: 99, background: T.track, marginTop: 8, overflow: "hidden" }}>
            <div style={{ width: `${monthPct * 100}%`, height: "100%", borderRadius: 99, background: monthDone >= monthlyGoal ? T.ok : T.accent, transition: "width .6s cubic-bezier(.22,1,.36,1)" }} />
          </div>
          <div style={{ fontSize: 8.5, color: T.faint, marginTop: 8, lineHeight: 1.4 }}>
            {monthDone >= monthlyGoal ? "Cel osiągnięty!" : `Jeszcze ${monthlyGoal - monthDone} do celu`}
          </div>
        </div>
      </div>

      {/* ŁAŃCUCH PASSY — dni bieżącego tygodnia, dziś z obwódką */}
      <div className="fu" style={{ animationDelay: ".02s", background: T.card, border: `1px solid ${T.borderSoft}`, borderRadius: 20, padding: 12, marginBottom: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Flame size={13} color={T.accent} strokeWidth={2.3} />
          <span style={{ flex: 1, fontSize: 11, fontWeight: 700, color: "#fff", fontFamily: U }}>Łańcuch passy</span>
          <span style={{ fontSize: 10, color: T.sub }}>{streak} tyg. z rzędu</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10 }}>
          {dayCounts.map((c, i) => (
            <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
              <span
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: c > 0 ? T.accent : T.track,
                  border: `1.5px solid ${i === todayIdx ? T.accent : "transparent"}`,
                  color: c > 0 ? "#000" : T.faint,
                  fontFamily: FONT_NUM,
                  fontWeight: 800,
                  fontSize: 9,
                }}
              >
                {c > 0 ? c : "·"}
              </span>
              <span style={{ fontSize: 6.5, fontWeight: 700, color: i === todayIdx ? T.accent : T.faint, fontFamily: FONT_NUM }}>{DOW_SHORT[i]}</span>
            </div>
          ))}
        </div>
      </div>

      {/* WYZWANIE TYGODNIA */}
      <div className="fu" style={{ animationDelay: ".03s", display: "flex", alignItems: "center", gap: 11, background: T.card, border: `1px solid ${chDone ? "rgba(52,211,153,0.35)" : T.borderSoft}`, borderRadius: 20, padding: "12px 14px", marginBottom: 12 }}>
        <Trophy size={17} color={chDone ? T.ok : T.accent} strokeWidth={2.2} style={{ flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: "#fff", fontFamily: U }}>Wyzwanie tygodnia</div>
          <div style={{ fontSize: 10.5, color: T.sub, marginTop: 2 }}>{challenge.label}</div>
        </div>
        <div style={{ width: 128, flexShrink: 0 }}>
          <div style={{ textAlign: "right", fontFamily: FONT_NUM, fontWeight: 800, fontSize: 14, color: chDone ? T.ok : T.accent }}>
            {challenge.fmt(challenge.cur)}
            <span style={{ color: T.sub, fontSize: 11 }}>/{challenge.fmt(challenge.target)}</span>
          </div>
          <div style={{ height: 6, borderRadius: 99, background: T.track, marginTop: 5, overflow: "hidden" }}>
            <div style={{ width: `${chPct * 100}%`, height: "100%", borderRadius: 99, background: chDone ? T.ok : T.accent, transition: "width .6s cubic-bezier(.22,1,.36,1)" }} />
          </div>
        </div>
      </div>

      {/* OBJĘTOŚĆ TYGODNIOWA */}
      <div className="fu" style={{ animationDelay: ".04s", background: T.card, border: `1px solid ${T.borderSoft}`, borderRadius: 20, padding: "14px 16px 12px", marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: T.sub, marginBottom: 14 }}>
          <BarChart3 size={13} color={T.accent} strokeWidth={2.4} />
          Objętość tygodniowa · kg
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "flex-end", height: 118 }}>
          {vols.map((v) => (
            <div key={v.label} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6, height: "100%" }}>
              <span style={{ fontFamily: FONT_NUM, fontWeight: 800, fontSize: 10, color: v.isCurrent ? T.accent : v.vol > 0 ? T.sub : "transparent", lineHeight: 1 }}>
                {v.vol > 0 ? fmtVol(v.vol) : "0"}
              </span>
              <div style={{ flex: 1, width: "100%", maxWidth: 26, display: "flex", alignItems: "flex-end" }}>
                <div style={{ width: "100%", height: `${Math.max((v.vol / maxVol) * 100, 4)}%`, borderRadius: 7, background: v.isCurrent ? T.accent : v.vol > 0 ? T.track : T.card2, border: v.vol === 0 ? `1px dashed ${T.borderSoft}` : "none", transition: "height .5s cubic-bezier(.22,1,.36,1)" }} />
              </div>
              <span style={{ fontSize: 8.5, fontWeight: 700, fontFamily: FONT_NUM, color: v.isCurrent ? T.accent : T.faint }}>{v.isCurrent ? "TERAZ" : v.label}</span>
            </div>
          ))}
        </div>
        <p style={{ fontSize: 9.5, color: T.faint, margin: "10px 0 0", textAlign: "center" }}>
          suma serie × powtórzenia × ciężar z zapisanych sesji
        </p>
      </div>

      {/* OBJĘTOŚĆ PER PARTIA MIĘŚNIOWA */}
      <div className="fu" style={{ animationDelay: ".055s", background: T.card, border: `1px solid ${T.borderSoft}`, borderRadius: 20, padding: "14px 16px 12px", marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: T.sub, marginBottom: 4 }}>
          <RadarIcon size={13} color={T.accent} strokeWidth={2.4} />
          Objętość per partia mięśniowa
        </div>
        {hasCatData ? (
          <div style={{ height: 210, margin: "0 -8px" }}>
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={catData} outerRadius="72%">
                <PolarGrid stroke={T.borderSoft} />
                <PolarAngleAxis dataKey="cat" tick={{ fill: T.soft, fontSize: 10.5, fontFamily: "'Urbanist',sans-serif" }} />
                <Radar dataKey="vol" stroke={T.accent} fill={T.accent} fillOpacity={0.28} strokeWidth={2} {...CHART_ANIM} isAnimationActive={!prefersReducedMotion()} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p style={{ fontSize: 11.5, color: T.sub, textAlign: "center", padding: "22px 10px" }}>
            Zrób kilka pełnych sesji na żywo, a appka pokaże tu rozkład objętości między partiami.
          </p>
        )}
        <p style={{ fontSize: 9.5, color: T.faint, margin: "6px 0 0", textAlign: "center" }}>
          suma serie × powtórzenia × ciężar, od początku · z sesji na żywo
        </p>
      </div>

      {/* PROGRES CIĘŻARÓW */}
      <div className="fu" style={{ animationDelay: ".07s", display: "flex", alignItems: "center", gap: 6, fontSize: 10.5, fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: T.soft, margin: "18px 0 10px" }}>
        <TrendingUp size={13} color={T.accent} strokeWidth={2.4} />
        Progres ciężarów
      </div>

      {/* FILTRY CZASU */}
      <div className="fu" style={{ display: "flex", gap: 6, marginBottom: 12 }}>
        {[
          { v: 7, l: "7 dni" },
          { v: 30, l: "30 dni" },
          { v: 90, l: "90 dni" },
          { v: 0, l: "Wszystko" },
        ].map((f) => (
          <button
            key={f.v}
            onClick={() => setRange(f.v)}
            style={{ flex: 1, padding: "9px 4px", borderRadius: 99, fontSize: 11.5, fontWeight: 800, cursor: "pointer", fontFamily: "inherit", background: range === f.v ? T.accent : T.card, color: range === f.v ? "#000" : T.sub, border: `1px solid ${range === f.v ? T.accent : T.border}`, transition: TR.colors }}
          >
            {f.l}
          </button>
        ))}
      </div>

      {/* FILTR DNIA */}
      <div className="fu" style={{ animationDelay: ".05s", display: "flex", gap: 6, marginBottom: 12 }}>
        {[
          { k: "ALL", l: "Wszystkie", c: T.accent },
          { k: "A", l: "A", c: T.blue },
          { k: "B", l: "B", c: T.orange },
          { k: "C", l: "C", c: T.purple },
        ].map((f) => (
          <button
            key={f.k}
            onClick={() => setFilterDay(f.k)}
            style={{ flex: f.k === "ALL" ? 2 : 1, padding: "8px 4px", borderRadius: 99, fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", background: filterDay === f.k ? f.c : T.card, color: filterDay === f.k ? "#000" : T.sub, border: `1px solid ${filterDay === f.k ? "transparent" : T.border}`, transition: TR.colors }}
          >
            {f.l}
          </button>
        ))}
      </div>

      {snapshots.length === 0 ? (
        <EmptyState
          icon={TrendingUp}
          title="Brak zapisów"
          desc={
            <>
              Ustaw ciężary w Treningu i zapisz je
              <br />
              <strong style={{ color: T.accent }}>przyciskiem na środku dolnego paska</strong> — każdy zapis to punkt tutaj.
            </>
          }
        />
      ) : list.length === 0 ? (
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 18, marginBottom: 12 }}>
          <EmptyState nested icon={Dumbbell} desc="Brak ćwiczeń z ustawionym ciężarem w tym treningu." />
        </div>
      ) : (
        list.map((exItem, i) => {
          const history = historyOf(exItem.id);
          const chartData = history.map((h) => ({ date: h.dateShort, kg: h.weight }));
          const first = history[0];
          const last = history[history.length - 1];
          const exGain = first && last ? Math.round((last.weight - first.weight) * 100) / 100 : 0;
          const liveEx = liveVersionOf(exItem.id);
          const shortName = exItem.name;

          return (
            <div key={exItem.id} className="fu" style={{ animationDelay: stagger(i), background: T.card, border: `1px solid ${T.borderSoft}`, borderRadius: 20, padding: "14px", marginBottom: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: exItem.dayColor, flexShrink: 0 }} />
                <span style={{ flex: 1, minWidth: 0, fontSize: 12.5, fontWeight: 700, color: "#fff", fontFamily: U, lineHeight: 1.25 }}>{shortName}</span>
                {history.length > 0 && (
                  <span style={{ fontSize: 11, fontWeight: 800, color: exGain >= 0 ? T.ok : T.danger, flexShrink: 0 }}>
                    {exGain >= 0 ? "+" : ""}
                    {pl(exGain)}
                  </span>
                )}
              </div>

              {history.length === 0 ? (
                <p style={{ fontSize: 11.5, color: T.sub, margin: "4px 0 10px" }}>Brak zapisów w wybranym okresie.</p>
              ) : (
                <>
                  <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                    <div style={{ flex: 1, background: T.card2, borderRadius: 12, padding: "8px", textAlign: "center" }}>
                      <div style={{ fontSize: 9, color: T.sub, marginBottom: 2 }}>Pierwszy</div>
                      <div style={{ fontFamily: U, fontWeight: 800, fontSize: 13, color: T.sub }}>{pl(first.weight)}</div>
                    </div>
                    <div style={{ flex: 1, background: T.card2, borderRadius: 12, padding: "8px", textAlign: "center" }}>
                      <div style={{ fontSize: 9, color: T.sub, marginBottom: 2 }}>Aktualnie</div>
                      <div style={{ fontFamily: U, fontWeight: 800, fontSize: 13, color: T.accent }}>{pl(last.weight)}</div>
                    </div>
                    <div style={{ flex: 1, background: T.card2, borderRadius: 12, padding: "8px", textAlign: "center" }}>
                      <div style={{ fontSize: 9, color: T.sub, marginBottom: 2 }}>Zapisów</div>
                      <div style={{ fontFamily: U, fontWeight: 800, fontSize: 13, color: T.light }}>{history.length}</div>
                    </div>
                  </div>

                  {history.length >= 2 && (
                    <div style={{ margin: "0 -6px" }}>
                      <ResponsiveContainer width="100%" height={110}>
                        <LineChart data={chartData} margin={{ top: 5, right: 8, bottom: 0, left: -18 }}>
                          <XAxis dataKey="date" tick={{ fill: T.faint, fontSize: 9 }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fill: T.faint, fontSize: 9 }} axisLine={false} tickLine={false} domain={["auto", "auto"]} width={28} />
                          <Tooltip
                            contentStyle={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, fontSize: 11 }}
                            labelStyle={{ color: T.sub }}
                            formatter={(v) => [`${v} ${exItem.unit}`, "Ciężar"]}
                          />
                          <Line type="monotone" dataKey="kg" stroke={exItem.dayColor} strokeWidth={2.2} dot={{ fill: exItem.dayColor, r: 3 }} activeDot={{ r: 5 }} {...CHART_ANIM} isAnimationActive={!prefersReducedMotion()} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                  <button
                    onClick={async () => {
                      if (sharingId) return;
                      setSharingId(exItem.id);
                      try {
                        await shareProgressImage({ name: shortName, unit: exItem.unit || "kg", history });
                      } catch (e) {
                        if (e.name !== "AbortError") console.error(e);
                      } finally {
                        setSharingId(null);
                      }
                    }}
                    style={{ width: "100%", marginTop: 6, background: "transparent", color: T.light, border: `1.5px solid ${T.border}`, borderRadius: 99, fontFamily: U, fontWeight: 700, fontSize: 12, padding: "10px 18px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 7 }}
                  >
                    <Share2 size={13} strokeWidth={2.2} />
                    {sharingId === exItem.id ? "Generuję…" : "Udostępnij progres"}
                  </button>
                </>
              )}

              {liveEx && (
                <div style={{ display: "flex", gap: 8, marginTop: 10, paddingTop: 10, borderTop: `1px solid ${T.borderSoft}` }}>
                  <div style={{ flex: 1, background: T.inset, border: `1px solid ${T.border}`, borderRadius: 12, padding: "9px 10px" }}>
                    <div style={{ fontSize: 9, color: T.sub, marginBottom: 4 }}>Ciężar roboczy</div>
                    <EditNum value={liveEx.weight} unit={liveEx.unit || "kg"} onChange={(v) => onChangeWeight && onChangeWeight(exItem.id, v)} />
                  </div>
                  <div style={{ flex: 1, background: T.inset, border: `1px solid ${T.border}`, borderRadius: 12, padding: "9px 10px" }}>
                    <div style={{ fontSize: 9, color: T.sub, marginBottom: 4 }}>Serie</div>
                    <EditNum value={liveEx.sets} min={1} max={20} onChange={(v) => onChangeSets && onChangeSets(exItem.id, v)} />
                  </div>
                  <div style={{ flex: 1, background: T.inset, border: `1px solid ${T.border}`, borderRadius: 12, padding: "9px 10px" }}>
                    <div style={{ fontSize: 9, color: T.sub, marginBottom: 4 }}>Powtórzenia</div>
                    <EditStr value={liveEx.reps} onChange={(v) => onChangeReps && onChangeReps(exItem.id, v)} />
                  </div>
                </div>
              )}
            </div>
          );
        })
      )}

      {/* SZCZEGÓŁOWE STATYSTYKI — siatka 2x2 */}
      <div className="fu" style={{ animationDelay: ".28s", background: T.card, border: `1px solid ${T.borderSoft}`, borderRadius: 22, padding: "14px 16px", marginBottom: 12 }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: T.sub, marginBottom: 12 }}>
          Szczegółowe statystyki
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {[
            { v: log.filter((e) => ["A", "B", "C"].includes(e.type)).length, l: "treningów zaliczonych", c: T.accent },
            { v: `${gain >= 0 ? "+" : ""}${pl(gain)} kg`, l: "łączny przyrost", c: T.ok },
            { v: snapshots.length, l: "zapisów ciężarów", c: T.orange },
            {
              v: pl(
                snapshots.length
                  ? Math.round((snapshots.length / Math.max(1, (Date.now() - Math.min(...snapshots.map((s) => s.ts))) / (7 * 24 * 3600 * 1000))) * 10) / 10
                  : 0
              ),
              l: "średnio / tydzień",
              c: T.purple,
            },
          ].map((s, i) => (
            <div key={i} style={{ background: T.card2, border: `1px solid ${T.borderSoft}`, borderRadius: 16, padding: "13px 12px" }}>
              <div style={{ fontFamily: "'Doto',sans-serif", fontWeight: 800, fontSize: "1.35rem", color: s.c, lineHeight: 1 }}>{s.v}</div>
              <div style={{ fontSize: 10, color: T.sub, fontWeight: 600, marginTop: 5 }}>{s.l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* REKORDY ŻYCIOWE */}
      {records.length > 0 && (
        <div className="fu" style={{ animationDelay: ".29s", background: T.card, border: `1px solid ${T.borderSoft}`, borderRadius: 22, overflow: "hidden", marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "14px 16px 10px", fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: T.sub }}>
            <Medal size={13} color={T.accent} strokeWidth={2.4} />
            Rekordy życiowe
          </div>
          {(showAllRecords ? records : records.slice(0, 6)).map((r, i, arr) => (
            <div key={r.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 16px", borderTop: `1px solid ${T.borderSoft}` }}>
              <span style={{ fontFamily: FONT_NUM, fontWeight: 800, fontSize: 12, color: i < 3 ? T.accent : T.faint, width: 18, flexShrink: 0 }}>{i + 1}</span>
              <span style={{ flex: 1, fontSize: 12.5, fontWeight: 600, color: T.light, fontFamily: U, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.name}</span>
              <span style={{ fontSize: 9.5, color: T.faint, flexShrink: 0 }}>{new Date(r.ts).toLocaleDateString("pl-PL", { day: "numeric", month: "short" })}</span>
              <span style={{ fontFamily: FONT_NUM, fontWeight: 800, fontSize: 14, color: T.accent, flexShrink: 0, minWidth: 58, textAlign: "right" }}>
                {pl(r.w)} <span style={{ fontSize: 10, color: T.sub }}>{r.unit}</span>
              </span>
            </div>
          ))}
          {records.length > 6 && (
            <button
              onClick={() => setShowAllRecords(!showAllRecords)}
              style={{ width: "100%", padding: "10px 16px", background: "transparent", border: "none", borderTop: `1px solid ${T.borderSoft}`, color: T.accent, fontSize: 11.5, fontWeight: 700, cursor: "pointer", fontFamily: U }}
            >
              {showAllRecords ? "Zwiń" : `Pokaż wszystkie (${records.length})`}
            </button>
          )}
        </div>
      )}

      {/* ODZNAKI */}
      <div className="fu" style={{ animationDelay: ".3s", background: T.card, border: `1px solid ${T.borderSoft}`, borderRadius: 22, padding: "14px 16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: T.sub, marginBottom: 12 }}>
          <Award size={13} color={T.accent} strokeWidth={2.3} />
          Odznaki
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}>
          {BADGES.map((b) => {
            const on = badgeMap[b.id];
            const Icon = BADGE_ICON[b.id] || Award;
            return (
              <div
                key={b.id}
                title={b.need}
                style={{ background: on ? T.accentSoftBg : T.card2, border: `1.5px solid ${on ? T.accentSoftBorder : T.borderSoft}`, borderRadius: 16, padding: "13px 6px 11px", textAlign: "center", opacity: on ? 1 : 0.45, transition: TR.fade }}
              >
                <Icon size={20} color={on ? T.accent : T.soft} strokeWidth={2.1} style={{ display: "block", margin: "0 auto" }} />
                <div style={{ fontSize: 9.5, fontWeight: 700, marginTop: 7, color: on ? T.accent : T.sub, lineHeight: 1.3 }}>{b.label}</div>
              </div>
            );
          })}
        </div>
        <div style={{ fontSize: 10.5, color: T.faint, marginTop: 10, textAlign: "center" }}>Odznaki zdobywasz zapisując ciężary i utrzymując serię tygodni</div>
      </div>
    </div>
  );
}
