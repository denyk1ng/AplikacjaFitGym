import { Flame } from "lucide-react";
import { T } from "../theme.js";
import { EXERCISES_DATA } from "../data/plan.js";
import { computeStreak, computeTotalGain, earnedBadges, isoWeekStart } from "../lib/utils.js";
import { useCountUp } from "../hooks/useCountUp.js";
import { Ring } from "./Ring.jsx";

export function DashboardTab({ snapshots, exercises, goTraining }) {
  const dow = new Date().getDay();
  const todayKey = dow === 1 ? "A" : dow === 3 ? "B" : dow === 5 ? "C" : null;
  const isCardio = dow === 2 || dow === 4;
  const streak = computeStreak(snapshots);
  const gain = computeTotalGain(snapshots);
  const badges = earnedBadges(snapshots.length, streak, gain);
  const earnedCount = Object.values(badges).filter(Boolean).length;
  const weekStart = isoWeekStart(Date.now());
  const thisWeek = snapshots.filter((s) => s.ts >= weekStart).length;

  const cGain = useCountUp(gain, 1100);
  const cSnaps = useCountUp(snapshots.length, 900);
  const cStreak = useCountUp(streak, 800);

  const dateStr = new Date().toLocaleDateString("pl-PL", { weekday: "long", day: "numeric", month: "long" });

  return (
    <div>
      <div className="fu" style={{ fontSize: 12, color: T.sub, marginBottom: 14 }}>
        {dateStr.charAt(0).toUpperCase() + dateStr.slice(1)}
      </div>

      {/* DZIŚ — HERO */}
      <div
        className="fu"
        style={{
          animationDelay: ".05s",
          borderRadius: 24,
          padding: "20px 18px",
          marginBottom: 14,
          position: "relative",
          overflow: "hidden",
          background: todayKey
            ? `linear-gradient(135deg, ${EXERCISES_DATA[todayKey].color}26, ${T.card} 60%)`
            : isCardio
              ? `linear-gradient(135deg, rgba(52,211,153,0.2), ${T.card} 60%)`
              : `linear-gradient(135deg, ${T.accentSoftBg}, ${T.card} 60%)`,
          border: `1px solid ${T.border}`,
        }}
      >
        <div style={{ position: "absolute", right: -18, top: -14, fontSize: 96, opacity: 0.07, transform: "rotate(12deg)" }}>
          {todayKey ? "🏋️" : isCardio ? "🏃" : "🧘"}
        </div>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: T.sub, marginBottom: 6 }}>Dziś na planie</div>
        {todayKey ? (
          <>
            <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: "1.5rem", color: EXERCISES_DATA[todayKey].color }}>
              {EXERCISES_DATA[todayKey].label}
            </div>
            <div style={{ fontSize: 12.5, color: T.soft, marginTop: 3 }}>{EXERCISES_DATA[todayKey].desc}</div>
            <div style={{ fontSize: 12, color: T.sub, marginTop: 2 }}>
              {exercises[todayKey].exercises.length} ćwiczeń · ~60 min · potem 20 min cardio
            </div>
            <button
              onClick={() => goTraining(todayKey)}
              style={{ marginTop: 14, background: T.accent, color: "#000", border: "none", borderRadius: 99, fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 13, padding: "12px 24px", cursor: "pointer", boxShadow: T.accentGlow }}
            >
              Zacznij trening →
            </button>
          </>
        ) : isCardio ? (
          <>
            <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: "1.5rem", color: T.ok }}>Cardio + sauna</div>
            <div style={{ fontSize: 12.5, color: T.soft, marginTop: 3 }}>Bieżnia 12% skos · 3,5 km/h · 50 min</div>
            <div style={{ fontSize: 12, color: T.sub, marginTop: 2 }}>~670 kcal · regeneracja aktywna</div>
          </>
        ) : (
          <>
            <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: "1.5rem", color: T.accent }}>Regeneracja</div>
            <div style={{ fontSize: 12.5, color: T.soft, marginTop: 3 }}>Spacer, rozciąganie, pełny odpoczynek</div>
            <div style={{ fontSize: 12, color: T.sub, marginTop: 2 }}>Mięśnie rosną w dni wolne 💤</div>
          </>
        )}
      </div>

      {/* PIERŚCIEŃ TYGODNIA + SERIA */}
      <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
        <div className="fu" style={{ animationDelay: ".1s", flex: 1, background: T.card, border: `1px solid ${T.borderSoft}`, borderRadius: 22, padding: "14px", display: "flex", alignItems: "center", gap: 12 }}>
          <Ring pct={Math.min(thisWeek / 3, 1)} size={72} stroke={7} color={T.accent}>
            <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 16 }}>
              {thisWeek}
              <span style={{ fontSize: 10, color: T.sub }}>/3</span>
            </span>
          </Ring>
          <div>
            <div style={{ fontSize: 12.5, fontWeight: 700 }}>Zapisy w tym tygodniu</div>
            <div style={{ fontSize: 11, color: T.sub, marginTop: 2, lineHeight: 1.4 }}>{thisWeek >= 3 ? "Komplet! 💪" : "Cel: 3 treningi z zapisem"}</div>
          </div>
        </div>
        <div className="fu" style={{ animationDelay: ".15s", width: 108, background: `linear-gradient(160deg, rgba(255,107,53,0.14), ${T.card})`, border: "1px solid rgba(255,107,53,0.25)", borderRadius: 22, padding: "14px 10px", textAlign: "center" }}>
          <div style={{ display: "flex", justifyContent: "center" }}>
            <Flame size={22} color={T.orange} strokeWidth={2.2} />
          </div>
          <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: "1.5rem", color: T.orange }}>{Math.round(cStreak)}</div>
          <div style={{ fontSize: 9.5, color: T.sub, textTransform: "uppercase", letterSpacing: ".06em", fontWeight: 700 }}>tyg. serii</div>
        </div>
      </div>

      {/* STATYSTYKI */}
      <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
        <div className="fu" style={{ animationDelay: ".2s", flex: 1, background: T.card, border: `1px solid ${T.borderSoft}`, borderRadius: 18, padding: "13px", textAlign: "center" }}>
          <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: "1.4rem", color: T.ok }}>
            {gain >= 0 ? "+" : ""}
            {cGain.toFixed(1)}
          </div>
          <div style={{ fontSize: 9.5, color: T.sub, textTransform: "uppercase", letterSpacing: ".06em", fontWeight: 700, marginTop: 2 }}>kg łącznie</div>
        </div>
        <div className="fu" style={{ animationDelay: ".25s", flex: 1, background: T.card, border: `1px solid ${T.borderSoft}`, borderRadius: 18, padding: "13px", textAlign: "center" }}>
          <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: "1.4rem", color: T.accent }}>{Math.round(cSnaps)}</div>
          <div style={{ fontSize: 9.5, color: T.sub, textTransform: "uppercase", letterSpacing: ".06em", fontWeight: 700, marginTop: 2 }}>zapisów</div>
        </div>
        <div className="fu" style={{ animationDelay: ".3s", flex: 1, background: T.card, border: `1px solid ${T.borderSoft}`, borderRadius: 18, padding: "13px", textAlign: "center" }}>
          <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: "1.4rem", color: T.purple }}>
            {earnedCount}
            <span style={{ fontSize: 12, color: T.faint }}>/6</span>
          </div>
          <div style={{ fontSize: 9.5, color: T.sub, textTransform: "uppercase", letterSpacing: ".06em", fontWeight: 700, marginTop: 2 }}>odznaki</div>
        </div>
      </div>

      {/* PLAN TYGODNIA */}
      <div className="fu" style={{ animationDelay: ".35s", background: T.card, border: `1px solid ${T.borderSoft}`, borderRadius: 22, padding: "14px 16px" }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: T.sub, marginBottom: 10 }}>Twój tydzień</div>
        {[
          { d: "PN", t: "Trening A", c: T.blue, dw: 1 },
          { d: "WT", t: "Cardio + sauna", c: T.ok, dw: 2 },
          { d: "ŚR", t: "Trening B", c: T.orange, dw: 3 },
          { d: "CZ", t: "Cardio + sauna", c: T.ok, dw: 4 },
          { d: "PT", t: "Trening C", c: T.purple, dw: 5 },
          { d: "SB", t: "Regeneracja", c: T.faint, dw: 6 },
          { d: "ND", t: "Regeneracja", c: T.faint, dw: 0 },
        ].map((r, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 0", borderBottom: i < 6 ? `1px solid ${T.borderSoft}` : "none", opacity: r.dw === dow ? 1 : 0.55 }}>
            <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 11, width: 24, color: r.dw === dow ? T.accent : T.faint }}>{r.d}</span>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: r.c, flexShrink: 0 }}></span>
            <span style={{ fontSize: 12.5, fontWeight: r.dw === dow ? 700 : 500, flex: 1 }}>{r.t}</span>
            {r.dw === dow && (
              <span style={{ fontSize: 9, fontWeight: 800, color: T.accent, background: T.accentSoftBg, border: `1px solid ${T.accentSoftBorder}`, padding: "2px 8px", borderRadius: 99 }}>DZIŚ</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
