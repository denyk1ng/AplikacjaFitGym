import { useEffect, useState } from "react";
import { Check, Info, RotateCcw, Dumbbell, Footprints, BicepsFlexed, HeartPulse, Moon } from "lucide-react";
import { T } from "../theme.js";
import { EXERCISES_DATA } from "../data/plan.js";
import { isoWeekStart } from "../lib/utils.js";
import { loadWorkoutLog, saveWorkoutLog, weekStatus, weekEntries, weekHistory, PLAN_DOW, DOW_NAMES, dayIndex } from "../lib/workoutLog.js";

const H = "'Space Grotesk',sans-serif";
const TYPE_ICON = { A: Dumbbell, B: Footprints, C: BicepsFlexed };

export function CalendarTab({ goTraining }) {
  const [log, setLog] = useState([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    loadWorkoutLog().then((l) => {
      setLog(l);
      setReady(true);
    });
  }, []);

  const persist = (updated) => {
    setLog(updated);
    saveWorkoutLog(updated);
  };

  const mark = (type) => {
    // jeden wpis danego typu na tydzień
    const start = isoWeekStart(Date.now());
    const cleaned = log.filter((e) => !(e.type === type && e.ts >= start));
    const now = new Date();
    persist([...cleaned, { ts: now.getTime(), date: now.toLocaleDateString("sv-SE"), type }]);
  };

  const unmark = (type) => {
    const start = isoWeekStart(Date.now());
    persist(log.filter((e) => !(e.type === type && e.ts >= start)));
  };

  if (!ready) return null;

  const st = weekStatus(log);
  const doneCount = ["A", "B", "C"].filter((k) => st[k].done).length;
  const overdueList = ["A", "B", "C"].filter((k) => st[k].overdue);
  const entries = weekEntries(log);
  const history = weekHistory(log, 4);

  const todayDow = new Date().getDay();
  const monday = new Date(isoWeekStart(Date.now()));

  // dane paska tygodnia
  const days = ["PN", "WT", "ŚR", "CZ", "PT", "SB", "ND"].map((label, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const jsDow = (i + 1) % 7;
    const planType = Object.keys(PLAN_DOW).find((k) => PLAN_DOW[k] === jsDow) || null;
    const isCardio = jsDow === 2 || jsDow === 4;
    const dateKey = d.toLocaleDateString("sv-SE");
    const doneHere = entries.filter((e) => e.date === dateKey).map((e) => e.type);
    const missed = planType && !st[planType].done && dayIndex(todayDow) > i;
    return { label, num: d.getDate(), today: jsDow === todayDow, planType, isCardio, doneHere, missed };
  });

  const monthName = new Date().toLocaleDateString("pl-PL", { month: "long", year: "numeric" });

  return (
    <div>
      {/* PASEK TYGODNIA */}
      <div className="fu" style={{ fontSize: 12, color: T.sub, marginBottom: 12 }}>
        Bieżący tydzień · {monthName.charAt(0).toUpperCase() + monthName.slice(1)}
      </div>
      <div className="fu" style={{ animationDelay: ".04s", display: "flex", gap: 6, marginBottom: 16 }}>
        {days.map((d) => (
          <div
            key={d.label}
            style={{
              flex: 1,
              background: d.today ? T.accent : "#16181f",
              borderRadius: 16,
              padding: "10px 2px 9px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 4,
            }}
          >
            <span style={{ fontSize: 8.5, fontWeight: 800, letterSpacing: ".04em", color: d.today ? "rgba(0,0,0,0.6)" : T.sub }}>{d.label}</span>
            <span style={{ fontFamily: H, fontWeight: 700, fontSize: 14.5, color: d.today ? "#000" : "#fff" }}>{d.num}</span>
            {/* status dnia */}
            {d.doneHere.length > 0 ? (
              <span style={{ width: 15, height: 15, borderRadius: "50%", background: d.today ? "#000" : T.ok, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Check size={10} color={d.today ? T.accent : "#000"} strokeWidth={3.4} />
              </span>
            ) : d.missed ? (
              <span style={{ width: 15, height: 15, borderRadius: "50%", background: "rgba(255,107,53,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 800, color: T.orange }}>
                !
              </span>
            ) : d.planType ? (
              <span style={{ fontSize: 9, fontWeight: 800, fontFamily: H, color: d.today ? "rgba(0,0,0,0.65)" : T.soft }}>{d.planType}</span>
            ) : d.isCardio ? (
              <HeartPulse size={11} color={d.today ? "rgba(0,0,0,0.65)" : T.faint} strokeWidth={2.4} />
            ) : (
              <Moon size={11} color={d.today ? "rgba(0,0,0,0.65)" : T.faint} strokeWidth={2.4} />
            )}
          </div>
        ))}
      </div>

      {/* ALERT O ZALEGŁOŚCIACH / KOMPLET */}
      {overdueList.length > 0 ? (
        <div className="fu" style={{ animationDelay: ".08s", display: "flex", gap: 10, alignItems: "flex-start", background: "rgba(255,107,53,0.09)", border: "1px solid rgba(255,107,53,0.3)", borderRadius: 18, padding: "12px 14px", marginBottom: 16 }}>
          <Info size={17} color={T.orange} strokeWidth={2.3} style={{ flexShrink: 0, marginTop: 1 }} />
          <div style={{ fontSize: 12.5, color: "#ffb391", lineHeight: 1.55 }}>
            <strong style={{ color: T.orange }}>
              Nie {overdueList.length > 1 ? "zrobiłeś treningów" : "zrobiłeś treningu"} {overdueList.join(" i ")}
            </strong>{" "}
            w {overdueList.length > 1 ? "planowane dni" : "planowany dzień"}. Tydzień kończy się w niedzielę — wskocz na siłownię w wolny dzień, żeby nadrobić.
          </div>
        </div>
      ) : doneCount === 3 ? (
        <div className="fu" style={{ animationDelay: ".08s", display: "flex", gap: 10, alignItems: "center", background: "rgba(52,211,153,0.09)", border: "1px solid rgba(52,211,153,0.3)", borderRadius: 18, padding: "12px 14px", marginBottom: 16 }}>
          <span style={{ width: 26, height: 26, borderRadius: "50%", background: T.ok, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Check size={15} color="#000" strokeWidth={3} />
          </span>
          <div style={{ fontSize: 12.5, color: "#8fe5c2", lineHeight: 1.5 }}>
            <strong style={{ color: T.ok }}>Komplet!</strong> Wszystkie trzy treningi w tym tygodniu zrobione. Reszta tygodnia to cardio i regeneracja.
          </div>
        </div>
      ) : null}

      {/* CHECKLISTA TRENINGÓW TYGODNIA */}
      <div className="fu" style={{ animationDelay: ".12s", fontFamily: H, fontWeight: 700, fontSize: "1.02rem", color: "#fff", marginBottom: 12 }}>
        Treningi tego tygodnia
        <span style={{ fontFamily: H, color: doneCount === 3 ? T.ok : T.accent, marginLeft: 8, fontSize: "0.95rem" }}>{doneCount}/3</span>
      </div>

      {["A", "B", "C"].map((k, i) => {
        const s = st[k];
        const Icon = TYPE_ICON[k];
        const doneDay = s.ts ? DOW_NAMES[new Date(s.ts).getDay()] : null;
        const statusTxt = s.done
          ? `Zrobiony — ${doneDay}`
          : s.overdue
            ? `Zaległy — planowo ${DOW_NAMES[s.plannedDow]}`
            : PLAN_DOW[k] === todayDow
              ? "Zaplanowany na dziś"
              : `Zaplanowany — ${DOW_NAMES[s.plannedDow]}`;
        return (
          <div
            key={k}
            className="fu"
            style={{
              animationDelay: `${0.14 + i * 0.05}s`,
              background: s.done ? "rgba(52,211,153,0.06)" : T.card,
              border: `1px solid ${s.done ? "rgba(52,211,153,0.25)" : s.overdue ? "rgba(255,107,53,0.35)" : T.borderSoft}`,
              borderRadius: 20,
              padding: "13px 14px",
              marginBottom: 10,
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <span
              style={{
                width: 42,
                height: 42,
                borderRadius: 14,
                background: s.done ? T.ok : "#16181f",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              {s.done ? <Check size={19} color="#000" strokeWidth={2.8} /> : <Icon size={18} color={s.overdue ? T.orange : "#e8e8ea"} strokeWidth={2} />}
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: "#fff" }}>{EXERCISES_DATA[k].label}</div>
              <div style={{ fontSize: 11, color: s.overdue ? T.orange : T.sub, marginTop: 2, fontWeight: s.overdue ? 700 : 500 }}>{statusTxt}</div>
            </div>
            {s.done ? (
              <button
                onClick={() => unmark(k)}
                title="Cofnij oznaczenie"
                style={{ background: T.inset, border: "none", color: T.soft, borderRadius: 99, fontSize: 11.5, fontWeight: 600, padding: "9px 12px", cursor: "pointer", fontFamily: "inherit", display: "inline-flex", alignItems: "center", gap: 5, flexShrink: 0 }}
              >
                <RotateCcw size={13} strokeWidth={2.4} />
                Cofnij
              </button>
            ) : (
              <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                <button
                  onClick={() => goTraining(k)}
                  style={{ background: T.inset, border: "none", color: T.light, borderRadius: 99, fontSize: 11.5, fontWeight: 600, padding: "9px 12px", cursor: "pointer", fontFamily: "inherit" }}
                >
                  Otwórz
                </button>
                <button
                  onClick={() => mark(k)}
                  style={{ background: T.accent, border: "none", color: "#000", borderRadius: 99, fontSize: 11.5, fontWeight: 700, padding: "9px 13px", cursor: "pointer", fontFamily: "inherit", display: "inline-flex", alignItems: "center", gap: 5 }}
                >
                  <Check size={13} strokeWidth={3} />
                  Zrobiony
                </button>
              </div>
            )}
          </div>
        );
      })}

      {/* PLAN POZOSTAŁYCH DNI */}
      <div className="fu" style={{ animationDelay: ".3s", background: T.card, border: `1px solid ${T.borderSoft}`, borderRadius: 20, padding: "12px 14px", margin: "6px 0 18px", display: "flex", gap: 12 }}>
        <span style={{ width: 42, height: 42, borderRadius: 14, background: "#16181f", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <HeartPulse size={18} color="#e8e8ea" strokeWidth={2} />
        </span>
        <div style={{ fontSize: 12, color: T.sub, lineHeight: 1.6 }}>
          <strong style={{ color: T.light }}>Wtorek i czwartek:</strong> cardio + sauna (bieżnia 12% · 3,5 km/h · 50 min).
          <br />
          <strong style={{ color: T.light }}>Sobota i niedziela:</strong> regeneracja.
        </div>
      </div>

      {/* HISTORIA TYGODNI */}
      <div className="fu" style={{ animationDelay: ".34s", background: T.card, border: `1px solid ${T.borderSoft}`, borderRadius: 22, padding: "14px 16px" }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: T.sub, marginBottom: 14 }}>
          Ostatnie tygodnie
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          {history.map((h, i) => (
            <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
              <div style={{ height: 58, width: "100%", maxWidth: 40, display: "flex", alignItems: "flex-end" }}>
                <div
                  style={{
                    width: "100%",
                    height: `${Math.max((h.done / 3) * 100, 7)}%`,
                    borderRadius: 8,
                    background: h.done === 3 ? T.ok : h.isCurrent ? T.accent : T.track,
                    transition: "height .5s cubic-bezier(.22,1,.36,1)",
                  }}
                />
              </div>
              <span style={{ fontFamily: H, fontWeight: 700, fontSize: 12, color: h.done === 3 ? T.ok : h.isCurrent ? T.accent : T.soft }}>{h.done}/3</span>
              <span style={{ fontSize: 9, color: T.faint, fontWeight: 600 }}>{h.isCurrent ? "TEN TYDZIEŃ" : h.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
