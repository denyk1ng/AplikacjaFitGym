import { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar } from "recharts";
import { TrendingUp, Award, Flame, Target, Dumbbell, Medal, Crown, BarChart3, Radar as RadarIcon, Rocket, Layers, Trophy, Moon, Star } from "lucide-react";
import { T, FONT_NUM } from "../theme.js";
import { EmptyState } from "./EmptyState.jsx";
import { EditNum, EditStr } from "./Editable.jsx";
import { EXERCISES_DATA, BADGES, CAT_LABEL } from "../data/plan.js";
import { computeTotalGain, earnedBadges } from "../lib/utils.js";
import { loadWorkoutLog, weekStatus, logStreak, weekVolumes, volumeByCategory, weekHistory } from "../lib/workoutLog.js";

const U = "'Urbanist',sans-serif";
const fmtVol = (v) => (v >= 10000 ? `${Math.round(v / 1000)}k` : v >= 1000 ? `${(Math.round(v / 100) / 10).toString().replace(".", ",")}k` : String(v));
const pl = (n) => String(n).replace(".", ",");

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

// pierścień celu tygodnia
function GoalRing({ pct }) {
  const R = 33;
  const C = 2 * Math.PI * R;
  const p = Math.min(Math.max(pct, 0), 100);
  return (
    <div style={{ position: "relative", width: 86, height: 86 }}>
      <svg width="86" height="86" viewBox="0 0 86 86">
        <circle cx="43" cy="43" r={R} fill="none" stroke={T.track} strokeWidth="8" />
        <circle
          cx="43"
          cy="43"
          r={R}
          fill="none"
          stroke={T.accent}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={`${(p / 100) * C} ${C}`}
          transform="rotate(-90 43 43)"
          style={{ transition: "stroke-dasharray .6s cubic-bezier(.22,1,.36,1)" }}
        />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FONT_NUM, fontWeight: 800, fontSize: 19, color: "#fff" }}>
        {p}%
      </div>
    </div>
  );
}

export function StatsTab({ snapshots, exercises, onChangeWeight, onChangeReps, onChangeSets }) {
  const [range, setRange] = useState(0);
  const [filterDay, setFilterDay] = useState("ALL");
  const [selectedId, setSelectedId] = useState("");
  const [log, setLog] = useState([]);

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

  useEffect(() => {
    if (list.length > 0 && !list.find((e) => e.id === selectedId)) setSelectedId(list[0].id);
  }, [filterDay]);

  const ex = list.find((e) => e.id === selectedId) || list[0];

  // aktualny ciężar/powtórzenia z żywego stanu planu (może się różnić od
  // statycznych danych EXERCISES_DATA, jeśli użytkownik już je edytował)
  const liveEx = (() => {
    if (!ex || !exercises) return ex;
    for (const d of Object.values(exercises)) {
      const found = d.exercises.find((e) => e.id === ex.id);
      if (found) return found;
    }
    return ex;
  })();

  const history = ex
    ? filtered
        .map((snap) => {
          const w = (snap.weights || {})[ex.id];
          return w !== undefined ? { date: snap.date, dateShort: snap.dateShort, weight: w, ts: snap.ts } : null;
        })
        .filter(Boolean)
        .sort((a, b) => a.ts - b.ts)
    : [];

  const chartData = history.map((h) => ({ date: h.dateShort, kg: h.weight }));
  const first = history[0];
  const last = history[history.length - 1];
  const exGain = first && last ? Math.round((last.weight - first.weight) * 100) / 100 : 0;

  return (
    <div>
      {/* HERO: SERIA TYGODNI + CEL TYGODNIA */}
      <div className="fu" style={{ display: "flex", gap: 10, marginBottom: 12 }}>
        <div style={{ flex: 1, background: T.card, border: `1px solid ${T.borderSoft}`, borderRadius: 20, padding: "16px 16px 14px" }}>
          <span style={{ width: 36, height: 36, borderRadius: 12, background: T.accentSoftBg, border: `1px solid ${T.accentSoftBorder}`, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
            <Flame size={17} color={T.accent} strokeWidth={2.2} />
          </span>
          <div style={{ fontFamily: FONT_NUM, fontWeight: 800, fontSize: "2rem", color: "#fff", lineHeight: 1, marginTop: 12 }}>{streak}</div>
          <div style={{ fontSize: 11, color: T.sub, fontWeight: 600, marginTop: 5 }}>{streak === 1 ? "tydzień z rzędu" : "tygodni z rzędu"}</div>
          <div style={{ fontSize: 9.5, color: T.faint, marginTop: 2 }}>min. 1 trening / tydzień</div>
        </div>
        <div style={{ flex: 1, background: T.card, border: `1px solid ${T.borderSoft}`, borderRadius: 20, padding: "14px 12px", display: "flex", flexDirection: "column", alignItems: "center" }}>
          <GoalRing pct={goalPct} />
          <div style={{ fontSize: 11, color: T.sub, fontWeight: 600, marginTop: 6 }}>cel tygodnia</div>
          <div style={{ fontSize: 9.5, color: T.faint, marginTop: 2 }}>{doneCount}/3 treningi A·B·C</div>
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
                <Radar dataKey="vol" stroke={T.accent} fill={T.accent} fillOpacity={0.28} strokeWidth={2} />
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
            style={{ flex: 1, padding: "9px 4px", borderRadius: 99, fontSize: 11.5, fontWeight: 800, cursor: "pointer", fontFamily: "inherit", background: range === f.v ? T.accent : T.card, color: range === f.v ? "#000" : T.sub, border: `1px solid ${range === f.v ? T.accent : T.border}`, transition: "all .2s" }}
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
            style={{ flex: f.k === "ALL" ? 2 : 1, padding: "8px 4px", borderRadius: 99, fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", background: filterDay === f.k ? f.c : T.card, color: filterDay === f.k ? "#000" : T.sub, border: `1px solid ${filterDay === f.k ? "transparent" : T.border}`, transition: "all .2s" }}
          >
            {f.l}
          </button>
        ))}
      </div>

      {ex && (
        <div className="fu" style={{ animationDelay: ".1s", background: T.card, border: `1px solid ${T.borderSoft}`, borderRadius: 18, padding: "14px", marginBottom: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: T.sub, marginBottom: 8 }}>Ćwiczenie</div>
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            style={{ width: "100%", background: T.inset, border: `1px solid ${T.border}`, borderRadius: 10, color: T.text, padding: "10px 12px", fontSize: 13, fontFamily: "inherit", outline: "none" }}
          >
            {list.map((e) => (
              <option key={e.id} value={e.id}>
                [{e.dayKey}] {e.name}
              </option>
            ))}
          </select>

          {liveEx && (
            <>
              <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                <div style={{ flex: 1, background: T.inset, border: `1px solid ${T.border}`, borderRadius: 12, padding: "9px 10px" }}>
                  <div style={{ fontSize: 9.5, color: T.sub, marginBottom: 4 }}>Ciężar roboczy</div>
                  <EditNum value={liveEx.weight} unit={liveEx.unit || "kg"} onChange={(v) => onChangeWeight && onChangeWeight(ex.id, v)} />
                </div>
                <div style={{ flex: 1, background: T.inset, border: `1px solid ${T.border}`, borderRadius: 12, padding: "9px 10px" }}>
                  <div style={{ fontSize: 9.5, color: T.sub, marginBottom: 4 }}>Serie</div>
                  <EditNum value={liveEx.sets} min={1} max={20} onChange={(v) => onChangeSets && onChangeSets(ex.id, v)} />
                </div>
                <div style={{ flex: 1, background: T.inset, border: `1px solid ${T.border}`, borderRadius: 12, padding: "9px 10px" }}>
                  <div style={{ fontSize: 9.5, color: T.sub, marginBottom: 4 }}>Powtórzenia</div>
                  <EditStr value={liveEx.reps} onChange={(v) => onChangeReps && onChangeReps(ex.id, v)} />
                </div>
              </div>
              <p style={{ fontSize: 9.5, color: T.faint, margin: "8px 0 0" }}>
                Zmiana ciężaru dopisuje nowy punkt do wykresu progresu poniżej. Serie i powtórzenia zmieniają się też w sesji live.
              </p>
            </>
          )}
        </div>
      )}

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
      ) : history.length === 0 ? (
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 18, marginBottom: 12 }}>
          <EmptyState nested icon={Dumbbell} desc="Brak zapisów dla tego ćwiczenia w wybranym okresie." />
        </div>
      ) : (
        <>
          <div className="fu" style={{ animationDelay: ".15s", display: "flex", gap: 8, marginBottom: 12 }}>
            <div style={{ flex: 1, background: T.card, border: `1px solid ${T.borderSoft}`, borderRadius: 16, padding: "11px", textAlign: "center" }}>
              <div style={{ fontSize: 10, color: T.sub, marginBottom: 3 }}>Pierwszy</div>
              <div style={{ fontFamily: "'Urbanist',sans-serif", fontWeight: 800, fontSize: "1.15rem", color: T.sub }}>{pl(first.weight)}</div>
              <div style={{ fontSize: 9, color: T.faint }}>{first.dateShort}</div>
            </div>
            <div style={{ flex: 1, background: T.card, border: `1px solid ${T.borderSoft}`, borderRadius: 16, padding: "11px", textAlign: "center" }}>
              <div style={{ fontSize: 10, color: T.sub, marginBottom: 3 }}>Aktualnie</div>
              <div style={{ fontFamily: "'Urbanist',sans-serif", fontWeight: 800, fontSize: "1.15rem", color: T.accent }}>{pl(last.weight)}</div>
              <div style={{ fontSize: 9, color: T.faint }}>{last.dateShort}</div>
            </div>
            <div style={{ flex: 1, background: "rgba(52,211,153,0.07)", border: "1px solid rgba(52,211,153,0.25)", borderRadius: 16, padding: "11px", textAlign: "center" }}>
              <div style={{ fontSize: 10, color: T.sub, marginBottom: 3 }}>Przyrost</div>
              <div style={{ fontFamily: "'Urbanist',sans-serif", fontWeight: 800, fontSize: "1.15rem", color: exGain >= 0 ? T.ok : T.danger }}>
                {exGain >= 0 ? "+" : ""}
                {pl(exGain)}
              </div>
              <div style={{ fontSize: 9, color: T.faint }}>{history.length} zapisów</div>
            </div>
          </div>

          {history.length >= 2 && (
            <div className="fu" style={{ animationDelay: ".2s", background: T.card, border: `1px solid ${T.borderSoft}`, borderRadius: 20, padding: "14px", marginBottom: 12 }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: T.sub, marginBottom: 12 }}>Wykres w czasie</div>
              <ResponsiveContainer width="100%" height={190}>
                <LineChart data={chartData} margin={{ top: 5, right: 10, bottom: 0, left: -8 }}>
                  <XAxis dataKey="date" tick={{ fill: T.faint, fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: T.faint, fontSize: 11 }} axisLine={false} tickLine={false} domain={["auto", "auto"]} />
                  <Tooltip
                    contentStyle={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, fontSize: 12 }}
                    labelStyle={{ color: T.sub }}
                    formatter={(v) => [`${v} ${ex.unit}`, "Ciężar"]}
                  />
                  <Line type="monotone" dataKey="kg" stroke={ex.dayColor} strokeWidth={2.5} dot={{ fill: ex.dayColor, r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          <div className="fu" style={{ animationDelay: ".25s", background: T.card, border: `1px solid ${T.borderSoft}`, borderRadius: 20, overflow: "hidden", marginBottom: 12 }}>
            <div style={{ padding: "10px 14px", fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: T.sub, borderBottom: `1px solid ${T.borderSoft}` }}>
              Zapisy — {ex.name.split("—")[0].trim()}
            </div>
            {[...history].reverse().map((h, i) => {
              const prevIdx = history.length - 1 - i - 1;
              const prev = prevIdx >= 0 ? history[prevIdx] : null;
              const diff = prev ? Math.round((h.weight - prev.weight) * 100) / 100 : null;
              return (
                <div key={i} style={{ padding: "10px 14px", display: "flex", alignItems: "center", gap: 10, borderBottom: i < history.length - 1 ? `1px solid ${T.borderSoft}` : "none" }}>
                  <div style={{ flex: 1, fontSize: 12.5, color: T.light }}>{h.date}</div>
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: T.accent }}>
                    {pl(h.weight)} {ex.unit}
                  </div>
                  {diff !== null && diff !== 0 ? (
                    <div style={{ fontSize: 11, fontWeight: 800, color: diff > 0 ? T.ok : T.danger, minWidth: 38, textAlign: "right" }}>
                      {diff > 0 ? "+" : ""}
                      {pl(diff)}
                    </div>
                  ) : (
                    <div style={{ minWidth: 38, textAlign: "right", fontSize: 10, color: T.faint }}>{diff === 0 ? "=" : "start"}</div>
                  )}
                </div>
              );
            })}
          </div>
        </>
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
                style={{ background: on ? T.accentSoftBg : T.card2, border: `1.5px solid ${on ? T.accentSoftBorder : T.borderSoft}`, borderRadius: 16, padding: "13px 6px 11px", textAlign: "center", opacity: on ? 1 : 0.45, transition: "all .3s" }}
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
