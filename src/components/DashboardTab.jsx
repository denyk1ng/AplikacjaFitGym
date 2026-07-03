import { useEffect, useState } from "react";
import { Bell, Footprints, Moon, HeartPulse, Play, Flame, Dumbbell, BicepsFlexed, Check } from "lucide-react";
import { T } from "../theme.js";
import { EXERCISES_DATA } from "../data/plan.js";
import { PHOTOS } from "../data/photos.js";
import { computeStreak, computeTotalGain, isoWeekStart } from "../lib/utils.js";
import { loadWorkoutLog, weekStatus, suggestToday } from "../lib/workoutLog.js";
import { useCountUp } from "../hooks/useCountUp.js";
import { Ring } from "./Ring.jsx";

const H = "'Urbanist',sans-serif";

function SectionHead({ title, onSee, delay }) {
  return (
    <div className="fu" style={{ animationDelay: delay || "0s", display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
      <span style={{ fontFamily: H, fontWeight: 700, fontSize: "1.02rem", color: "#fff" }}>{title}</span>
      {onSee && (
        <button onClick={onSee} style={{ background: "transparent", border: "none", color: T.accent, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
          Zobacz wszystkie
        </button>
      )}
    </div>
  );
}

export function DashboardTab({ snapshots, exercises, goTraining, goTo, userName }) {
  const dow = new Date().getDay();
  const isCardio = dow === 2 || dow === 4;
  const streak = computeStreak(snapshots);
  const gain = computeTotalGain(snapshots);
  const weekStart = isoWeekStart(Date.now());
  const thisWeekSaves = snapshots.filter((s) => s.ts >= weekStart).length;

  const cGain = useCountUp(gain, 1100);
  const cStreak = useCountUp(streak, 800);

  // dziennik treningów — podpowiedź dnia + postęp tygodnia
  const [log, setLog] = useState([]);
  useEffect(() => {
    loadWorkoutLog().then(setLog);
  }, []);
  const st = weekStatus(log);
  const doneCount = ["A", "B", "C"].filter((k) => st[k].done).length;
  const suggestion = suggestToday(log);

  const WEEK = 7 * 24 * 3600 * 1000;
  const weekBars = [3, 2, 1, 0].map((off) => {
    const start = weekStart - off * WEEK;
    const n = snapshots.filter((s) => s.ts >= start && s.ts < start + WEEK).length;
    return Math.min(n / 3, 1);
  });

  const dateStr = new Date().toLocaleDateString("pl-PL", { weekday: "long", day: "numeric", month: "long" });

  // karta hero: dzisiejszy plan → zaległości → cardio/regeneracja/komplet
  const hero = suggestion
    ? {
        chip: suggestion.overdue ? "ZALEGŁY TRENING" : "DZIŚ NA PLANIE",
        chipStyle: suggestion.overdue ? { background: T.orange, color: "#000" } : { background: "rgba(0,0,0,0.14)", color: "#000" },
        title: EXERCISES_DATA[suggestion.type].label,
        sub: suggestion.overdue
          ? `Nadrób do niedzieli — ${exercises[suggestion.type].exercises.length} ćwiczeń`
          : `${exercises[suggestion.type].exercises.length} ćwiczeń do zrobienia`,
        cta: "Zacznij trening",
        go: () => goTraining(suggestion.type),
      }
    : doneCount === 3
      ? { chip: "KOMPLET W TYM TYGODNIU", chipStyle: { background: "rgba(0,0,0,0.14)", color: "#000" }, title: "Wszystko zrobione", sub: "A, B i C zaliczone — cardio i regeneracja", cta: "Zobacz kalendarz", go: () => goTo("kalendarz") }
      : isCardio
        ? { chip: "DZIŚ NA PLANIE", chipStyle: { background: "rgba(0,0,0,0.14)", color: "#000" }, title: "Cardio + sauna", sub: "Bieżnia 12% · 3,5 km/h · 50 min", cta: "Zobacz kalendarz", go: () => goTo("kalendarz") }
        : { chip: "DZIŚ NA PLANIE", chipStyle: { background: "rgba(0,0,0,0.14)", color: "#000" }, title: "Regeneracja", sub: "Rozciąganie i pełny odpoczynek", cta: "Zobacz kalendarz", go: () => goTo("kalendarz") };

  const cats = [
    { Icon: Flame, l: "Rozgrzewka", act: false, go: () => goTo("rozgrzewka") },
    { Icon: Dumbbell, l: "Trening A", act: suggestion?.type === "A", go: () => goTraining("A") },
    { Icon: Footprints, l: "Trening B", act: suggestion?.type === "B", go: () => goTraining("B") },
    { Icon: BicepsFlexed, l: "Trening C", act: suggestion?.type === "C", go: () => goTraining("C") },
    { Icon: HeartPulse, l: "Cardio", act: !suggestion && isCardio, go: () => goTo("kalendarz") },
  ];

  return (
    <div>
      {/* HEADER */}
      <div className="fu" style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <button onClick={() => goTo("profil")} style={{ width: 46, height: 46, borderRadius: "50%", padding: 0, border: `1.5px solid ${T.accentSoftBorder}`, overflow: "hidden", cursor: "pointer", flexShrink: 0, background: T.card }}>
          <img src={PHOTOS.hero} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: H, fontWeight: 700, fontSize: "1.18rem", color: "#fff", lineHeight: 1.15, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            Cześć{userName ? `, ${userName}` : ""} 👋
          </div>
          <div style={{ fontSize: 11.5, color: T.sub, marginTop: 2 }}>{dateStr.charAt(0).toUpperCase() + dateStr.slice(1)}</div>
        </div>
        <button onClick={() => goTo("kalendarz")} title="Kalendarz" style={{ position: "relative", width: 42, height: 42, borderRadius: "50%", background: T.card, border: `1px solid ${T.border}`, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Bell size={18} color="#fff" strokeWidth={2} />
          {suggestion?.overdue && (
            <span style={{ position: "absolute", top: 9, right: 10, width: 7, height: 7, borderRadius: "50%", background: T.orange, border: `1.5px solid ${T.card}` }} />
          )}
        </button>
      </div>

      {/* LIMONKOWA KARTA HERO */}
      <div className="fu" style={{ animationDelay: ".06s", background: T.accent, borderRadius: 26, padding: "18px 18px 16px", marginBottom: 22, boxShadow: "0 18px 44px rgba(255,77,0,0.18)" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <span style={{ display: "inline-block", fontSize: 9.5, fontWeight: 800, letterSpacing: ".08em", padding: "5px 11px", borderRadius: 99, marginBottom: 12, ...hero.chipStyle }}>
              {hero.chip}
            </span>
            <div style={{ fontFamily: H, fontWeight: 700, fontSize: "1.45rem", color: "#000", lineHeight: 1.05 }}>{hero.title}</div>
            <div style={{ fontSize: 12, color: "rgba(0,0,0,0.62)", marginTop: 4, fontWeight: 600 }}>{hero.sub}</div>
          </div>
          <Ring pct={doneCount / 3} size={64} stroke={7} color="#000" track="rgba(0,0,0,0.14)">
            <span style={{ fontFamily: "'Doto',sans-serif", fontWeight: 800, fontSize: 13, color: "#000" }}>{doneCount}/3</span>
          </Ring>
        </div>
        <button
          onClick={hero.go}
          style={{ marginTop: 14, width: "100%", background: "#060910", color: "#fff", border: "none", borderRadius: 99, fontFamily: H, fontWeight: 700, fontSize: 13.5, padding: "14px 20px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
        >
          <Play size={15} color={T.accent} fill={T.accent} strokeWidth={0} />
          {hero.cta}
        </button>
      </div>

      {/* KATEGORIE */}
      <SectionHead title="Kategorie" onSee={() => goTo("trening")} delay=".1s" />
      <div className="fu hscroll" style={{ animationDelay: ".12s", marginBottom: 22 }}>
        {cats.map(({ Icon, l, act, go }) => (
          <button key={l} onClick={go} style={{ background: "transparent", border: "none", cursor: "pointer", fontFamily: "inherit", display: "flex", flexDirection: "column", alignItems: "center", gap: 8, flexShrink: 0, padding: 0 }}>
            <span
              style={{
                width: 60,
                height: 60,
                borderRadius: 20,
                background: act ? T.accent : "#16181f",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: act ? "0 6px 22px rgba(255,77,0,0.35)" : "none",
                transition: "all .2s",
              }}
            >
              <Icon size={24} color={act ? "#000" : "#e8e8ea"} strokeWidth={2} />
            </span>
            <span style={{ fontSize: 10.5, fontWeight: 600, color: act ? "#fff" : T.sub, whiteSpace: "nowrap" }}>{l}</span>
          </button>
        ))}
      </div>

      {/* AKTYWNOŚĆ */}
      <SectionHead title="Aktywność" onSee={() => goTo("stats")} delay=".16s" />
      <div style={{ display: "flex", gap: 10, marginBottom: 22 }}>
        <div className="fu" style={{ animationDelay: ".18s", flex: 1, background: T.card, border: `1px solid ${T.borderSoft}`, borderRadius: 22, padding: "12px 10px", display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5, alignSelf: "flex-start" }}>
            <Check size={13} color={T.accent} strokeWidth={2.6} />
            <span style={{ fontSize: 10, color: T.soft, fontWeight: 600 }}>Treningi</span>
          </div>
          <Ring pct={doneCount / 3} size={58} stroke={6} color={T.accent}>
            <span style={{ fontFamily: "'Doto',sans-serif", fontWeight: 800, fontSize: 13, color: "#fff" }}>{doneCount}/3</span>
          </Ring>
          <span style={{ fontSize: 9.5, color: T.sub, fontWeight: 600 }}>w tym tygodniu</span>
        </div>
        <div className="fu" style={{ animationDelay: ".22s", flex: 1, background: T.card, border: `1px solid ${T.borderSoft}`, borderRadius: 22, padding: "12px 10px", display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5, alignSelf: "flex-start" }}>
            <Moon size={13} color={T.purple} strokeWidth={2.4} />
            <span style={{ fontSize: 10, color: T.soft, fontWeight: 600 }}>Seria</span>
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 34 }}>
            {weekBars.map((v, i) => (
              <div key={i} style={{ width: 7, height: `${Math.max(v * 100, 12)}%`, borderRadius: 4, background: i === weekBars.length - 1 ? T.purple : `${T.purple}55` }} />
            ))}
          </div>
          <span style={{ fontSize: 9.5, color: T.sub, fontWeight: 600 }}>
            <strong style={{ color: "#fff", fontFamily: "'Doto',sans-serif", fontWeight: 800, fontSize: 14 }}>{Math.round(cStreak)}</strong> tyg. z rzędu
          </span>
        </div>
        <div className="fu" style={{ animationDelay: ".26s", flex: 1, background: T.card, border: `1px solid ${T.borderSoft}`, borderRadius: 22, padding: "12px 10px", display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5, alignSelf: "flex-start" }}>
            <HeartPulse size={13} color={T.danger} strokeWidth={2.4} />
            <span style={{ fontSize: 10, color: T.soft, fontWeight: 600 }}>Progres</span>
          </div>
          <svg width="72" height="34" viewBox="0 0 72 34" fill="none">
            <polyline points="0,20 10,20 15,10 21,28 27,6 33,24 38,17 48,17 53,11 60,22 66,17 72,17" stroke={T.danger} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span style={{ fontSize: 9.5, color: T.sub, fontWeight: 600 }}>
            <strong style={{ color: "#fff", fontFamily: H, fontSize: 13 }}>
              {gain >= 0 ? "+" : ""}
              {Math.round(cGain * 10) / 10}
            </strong>{" "}
            kg łącznie
          </span>
        </div>
      </div>

      {/* TWOJE TRENINGI */}
      <SectionHead title="Twoje treningi" onSee={() => goTo("trening")} delay=".3s" />
      <div className="hscroll" style={{ marginBottom: 8 }}>
        {["A", "B", "C"].map((k, i) => (
          <div
            key={k}
            className="fu"
            onClick={() => goTraining(k)}
            style={{ animationDelay: `${0.32 + i * 0.05}s`, position: "relative", width: 150, height: 190, borderRadius: 22, overflow: "hidden", flexShrink: 0, cursor: "pointer", border: `1px solid ${T.border}` }}
          >
            <img src={PHOTOS[k]} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(6,9,16,0.05) 30%, rgba(6,9,16,0.92) 100%)" }} />
            {st[k].done && (
              <span style={{ position: "absolute", top: 10, right: 10, width: 24, height: 24, borderRadius: "50%", background: T.ok, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Check size={14} color="#000" strokeWidth={3} />
              </span>
            )}
            <div style={{ position: "absolute", inset: 0, padding: 12, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
              <span style={{ alignSelf: "flex-start", background: st[k].done ? T.ok : T.accent, color: "#000", fontSize: 9.5, fontWeight: 800, padding: "3px 9px", borderRadius: 99, marginBottom: 6 }}>
                {st[k].done ? "ZROBIONY" : EXERCISES_DATA[k].day}
              </span>
              <div style={{ fontFamily: H, fontWeight: 700, fontSize: "1.02rem", color: "#fff", lineHeight: 1.1 }}>{EXERCISES_DATA[k].label}</div>
              <div style={{ fontSize: 10.5, color: "rgba(255,255,255,0.65)", marginTop: 3 }}>{EXERCISES_DATA[k].exercises.length} ćwiczeń · ~60 min</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
