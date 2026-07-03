import { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { T } from "../theme.js";
import { EXERCISES_DATA, BADGES } from "../data/plan.js";
import { computeStreak, computeTotalGain, earnedBadges } from "../lib/utils.js";

export function StatsTab({ snapshots }) {
  const [range, setRange] = useState(0);
  const [filterDay, setFilterDay] = useState("ALL");
  const [selectedId, setSelectedId] = useState("");

  const now = Date.now();
  const filtered = range === 0 ? snapshots : snapshots.filter((s) => s.ts >= now - range * 24 * 3600 * 1000);

  const streak = computeStreak(snapshots);
  const gain = computeTotalGain(snapshots);
  const badgeMap = earnedBadges(snapshots.length, streak, gain);

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
        </div>
      )}

      {snapshots.length === 0 ? (
        <div className="fu" style={{ textAlign: "center", padding: "40px 20px" }}>
          <div style={{ fontSize: 44, marginBottom: 14 }}>📈</div>
          <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 800, fontSize: "1.05rem", marginBottom: 8 }}>Brak zapisów</div>
          <div style={{ fontSize: 13, color: T.sub, lineHeight: 1.6 }}>
            Ustaw ciężary w Treningu i kliknij limonkowy
            <br />
            <strong style={{ color: T.accent }}>💾 przycisk na dole</strong> — każdy zapis to punkt tutaj.
          </div>
        </div>
      ) : history.length === 0 ? (
        <div className="fu" style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 18, padding: "22px", textAlign: "center", marginBottom: 12 }}>
          <div style={{ fontSize: 13, color: T.sub, lineHeight: 1.6 }}>
            Brak zapisów dla tego ćwiczenia
            <br />w wybranym okresie.
          </div>
        </div>
      ) : (
        <>
          <div className="fu" style={{ animationDelay: ".15s", display: "flex", gap: 8, marginBottom: 12 }}>
            <div style={{ flex: 1, background: T.card, border: `1px solid ${T.borderSoft}`, borderRadius: 16, padding: "11px", textAlign: "center" }}>
              <div style={{ fontSize: 10, color: T.sub, marginBottom: 3 }}>Pierwszy</div>
              <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 800, fontSize: "1.15rem", color: T.sub }}>{first.weight}</div>
              <div style={{ fontSize: 9, color: T.faint }}>{first.dateShort}</div>
            </div>
            <div style={{ flex: 1, background: T.card, border: `1px solid ${T.borderSoft}`, borderRadius: 16, padding: "11px", textAlign: "center" }}>
              <div style={{ fontSize: 10, color: T.sub, marginBottom: 3 }}>Aktualnie</div>
              <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 800, fontSize: "1.15rem", color: T.accent }}>{last.weight}</div>
              <div style={{ fontSize: 9, color: T.faint }}>{last.dateShort}</div>
            </div>
            <div style={{ flex: 1, background: "rgba(52,211,153,0.07)", border: "1px solid rgba(52,211,153,0.25)", borderRadius: 16, padding: "11px", textAlign: "center" }}>
              <div style={{ fontSize: 10, color: T.sub, marginBottom: 3 }}>Przyrost</div>
              <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 800, fontSize: "1.15rem", color: exGain >= 0 ? T.ok : T.danger }}>
                {exGain >= 0 ? "+" : ""}
                {exGain}
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
                    {h.weight} {ex.unit}
                  </div>
                  {diff !== null && diff !== 0 ? (
                    <div style={{ fontSize: 11, fontWeight: 800, color: diff > 0 ? T.ok : T.danger, minWidth: 38, textAlign: "right" }}>
                      {diff > 0 ? "+" : ""}
                      {diff}
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

      {/* ODZNAKI */}
      <div className="fu" style={{ animationDelay: ".3s", background: T.card, border: `1px solid ${T.borderSoft}`, borderRadius: 22, padding: "14px 16px" }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: T.sub, marginBottom: 12 }}>🏅 Odznaki</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}>
          {BADGES.map((b) => {
            const on = badgeMap[b.id];
            return (
              <div
                key={b.id}
                title={b.need}
                style={{ background: on ? T.accentSoftBg : T.card2, border: `1.5px solid ${on ? T.accentSoftBorder : T.borderSoft}`, borderRadius: 16, padding: "12px 6px", textAlign: "center", opacity: on ? 1 : 0.45, transition: "all .3s" }}
              >
                <div style={{ fontSize: 22, filter: on ? "none" : "grayscale(1)" }}>{b.icon}</div>
                <div style={{ fontSize: 9.5, fontWeight: 700, marginTop: 5, color: on ? T.accent : T.sub, lineHeight: 1.3 }}>{b.label}</div>
              </div>
            );
          })}
        </div>
        <div style={{ fontSize: 10.5, color: T.faint, marginTop: 10, textAlign: "center" }}>Odznaki zdobywasz zapisując ciężary i utrzymując serię tygodni</div>
      </div>
    </div>
  );
}
