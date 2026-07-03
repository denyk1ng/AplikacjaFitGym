import { useEffect, useState } from "react";
import { Flame, User, ChevronRight, TrendingUp } from "lucide-react";
import { T } from "../theme.js";
import { EXERCISES_DATA } from "../data/plan.js";
import { PHOTOS } from "../data/photos.js";
import { storage } from "../lib/storage.js";
import { computeStreak, computeTotalGain, earnedBadges, isoWeekStart } from "../lib/utils.js";
import { useCountUp } from "../hooks/useCountUp.js";
import { Ring } from "./Ring.jsx";

const H = "'Space Grotesk',sans-serif";

function PhotoCard({ photo, height, radius, children, onClick, delay }) {
  return (
    <div
      className="fu"
      onClick={onClick}
      style={{ animationDelay: delay || "0s", position: "relative", borderRadius: radius || 26, overflow: "hidden", height, cursor: onClick ? "pointer" : "default", border: `1px solid ${T.border}` }}
    >
      <img src={photo} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(13,17,8,0.08) 0%, rgba(13,17,8,0.55) 55%, rgba(13,17,8,0.94) 100%)" }} />
      {children}
    </div>
  );
}

export function DashboardTab({ snapshots, exercises, goTraining, goTo, userName }) {
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

  // podgląd diety (kcal dziś)
  const [diet, setDiet] = useState(null);
  useEffect(() => {
    async function load() {
      try {
        const t = await storage.get("diet_targets");
        const l = await storage.get("diet_log");
        const targets = t && t.value ? JSON.parse(t.value) : { kcal: 2500 };
        const log = l && l.value ? JSON.parse(l.value) : {};
        const key = new Date().toLocaleDateString("sv-SE");
        setDiet({ kcal: (log[key] || {}).kcal || 0, target: targets.kcal || 2500 });
      } catch (e) {
        setDiet({ kcal: 0, target: 2500 });
      }
    }
    load();
  }, []);

  const dateStr = new Date().toLocaleDateString("pl-PL", { weekday: "long", day: "numeric", month: "long" });

  const heroPhoto = todayKey ? PHOTOS[todayKey] : isCardio ? PHOTOS.cardio : PHOTOS.stretch;

  const chips = [
    { l: "🔥 Rozgrzewka", act: false, go: () => goTo("rozgrzewka") },
    { l: "🏋️ Trening A", act: todayKey === "A", go: () => goTraining("A") },
    { l: "🦵 Trening B", act: todayKey === "B", go: () => goTraining("B") },
    { l: "💪 Trening C", act: todayKey === "C", go: () => goTraining("C") },
    { l: "🍎 Dieta", act: false, go: () => goTo("dieta") },
  ];

  return (
    <div>
      {/* POWITANIE */}
      <div className="fu" style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
        <button
          onClick={() => goTo("profil")}
          style={{ width: 48, height: 48, borderRadius: "50%", background: T.accentSoftBg, border: `1.5px solid ${T.accentSoftBorder}`, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
        >
          <User size={22} color={T.accent} strokeWidth={2.2} />
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: H, fontWeight: 700, fontSize: "1.3rem", lineHeight: 1.15 }}>
            Cześć{userName ? `, ${userName}` : ""}! 👋
          </div>
          <div style={{ fontSize: 12, color: T.sub, marginTop: 2 }}>{dateStr.charAt(0).toUpperCase() + dateStr.slice(1)}</div>
        </div>
        <span style={{ background: T.accentSoftBg, border: `1px solid ${T.accentSoftBorder}`, color: T.accent, fontSize: 10.5, fontWeight: 800, padding: "6px 11px", borderRadius: 99, display: "inline-flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
          <Flame size={12} strokeWidth={2.5} />
          REKOMP
        </span>
      </div>

      {/* CHIPY KATEGORII */}
      <div className="fu hscroll" style={{ animationDelay: ".05s", marginBottom: 16 }}>
        {chips.map((c) => (
          <button
            key={c.l}
            onClick={c.go}
            style={{
              background: c.act ? T.accent : T.card,
              color: c.act ? "#000" : T.light,
              border: `1px solid ${c.act ? T.accent : T.border}`,
              borderRadius: 99,
              fontSize: 12.5,
              fontWeight: 700,
              padding: "10px 16px",
              cursor: "pointer",
              fontFamily: "inherit",
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
          >
            {c.l}
          </button>
        ))}
      </div>

      {/* HERO — DZIŚ NA PLANIE (zdjęcie) */}
      <div style={{ marginBottom: 14 }}>
        <PhotoCard photo={heroPhoto} height={230} delay=".1s">
          <div style={{ position: "absolute", inset: 0, padding: "18px", display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
            <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase", color: T.accent, marginBottom: 5 }}>
              Dziś na planie
            </div>
            {todayKey ? (
              <>
                <div style={{ fontFamily: H, fontWeight: 700, fontSize: "1.75rem", lineHeight: 1.05, color: "#fff" }}>{EXERCISES_DATA[todayKey].label}</div>
                <div style={{ fontSize: 12.5, color: "rgba(255,255,255,0.75)", marginTop: 5 }}>{EXERCISES_DATA[todayKey].desc}</div>
                <div style={{ fontSize: 11.5, color: "rgba(255,255,255,0.55)", marginTop: 2 }}>
                  {exercises[todayKey].exercises.length} ćwiczeń · ~60 min · potem 20 min cardio
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    goTraining(todayKey);
                  }}
                  style={{ marginTop: 12, alignSelf: "flex-start", background: T.accent, color: "#000", border: "none", borderRadius: 99, fontFamily: H, fontWeight: 700, fontSize: 13.5, padding: "13px 26px", cursor: "pointer", boxShadow: T.accentGlow }}
                >
                  Zacznij trening →
                </button>
              </>
            ) : isCardio ? (
              <>
                <div style={{ fontFamily: H, fontWeight: 700, fontSize: "1.75rem", lineHeight: 1.05, color: "#fff" }}>Cardio + sauna</div>
                <div style={{ fontSize: 12.5, color: "rgba(255,255,255,0.75)", marginTop: 5 }}>Bieżnia 12% skos · 3,5 km/h · 50 min</div>
                <div style={{ fontSize: 11.5, color: "rgba(255,255,255,0.55)", marginTop: 2 }}>~670 kcal · regeneracja aktywna</div>
              </>
            ) : (
              <>
                <div style={{ fontFamily: H, fontWeight: 700, fontSize: "1.75rem", lineHeight: 1.05, color: "#fff" }}>Regeneracja</div>
                <div style={{ fontSize: 12.5, color: "rgba(255,255,255,0.75)", marginTop: 5 }}>Spacer, rozciąganie, pełny odpoczynek</div>
                <div style={{ fontSize: 11.5, color: "rgba(255,255,255,0.55)", marginTop: 2 }}>Mięśnie rosną w dni wolne 💤</div>
              </>
            )}
          </div>
        </PhotoCard>
      </div>

      {/* KAFELKI AKTYWNOŚCI */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
        <div className="fu" style={{ animationDelay: ".15s", flex: 1.4, background: T.card, border: `1px solid ${T.borderSoft}`, borderRadius: 24, padding: "14px", display: "flex", alignItems: "center", gap: 12 }}>
          <Ring pct={Math.min(thisWeek / 3, 1)} size={68} stroke={7} color={T.accent}>
            <span style={{ fontFamily: H, fontWeight: 700, fontSize: 16 }}>
              {thisWeek}
              <span style={{ fontSize: 10, color: T.sub }}>/3</span>
            </span>
          </Ring>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 12.5, fontWeight: 700 }}>Zapisy</div>
            <div style={{ fontSize: 11, color: T.sub, marginTop: 2, lineHeight: 1.4 }}>{thisWeek >= 3 ? "Komplet! 💪" : "cel: 3 / tydz."}</div>
          </div>
        </div>
        <div className="fu" style={{ animationDelay: ".2s", flex: 1, background: T.card, border: `1px solid ${T.borderSoft}`, borderRadius: 24, padding: "14px 10px", textAlign: "center" }}>
          <div style={{ display: "flex", justifyContent: "center" }}>
            <Flame size={20} color={T.orange} strokeWidth={2.2} />
          </div>
          <div style={{ fontFamily: H, fontWeight: 700, fontSize: "1.45rem", color: T.orange }}>{Math.round(cStreak)}</div>
          <div style={{ fontSize: 9.5, color: T.sub, textTransform: "uppercase", letterSpacing: ".06em", fontWeight: 700 }}>tyg. serii</div>
        </div>
        <div className="fu" style={{ animationDelay: ".25s", flex: 1, background: T.card, border: `1px solid ${T.borderSoft}`, borderRadius: 24, padding: "14px 10px", textAlign: "center" }}>
          <div style={{ display: "flex", justifyContent: "center" }}>
            <TrendingUp size={20} color={T.ok} strokeWidth={2.2} />
          </div>
          <div style={{ fontFamily: H, fontWeight: 700, fontSize: "1.45rem", color: T.ok }}>
            {gain >= 0 ? "+" : ""}
            {cGain.toFixed(1)}
          </div>
          <div style={{ fontSize: 9.5, color: T.sub, textTransform: "uppercase", letterSpacing: ".06em", fontWeight: 700 }}>kg progres</div>
        </div>
      </div>

      {/* TWOJE TRENINGI — poziome karty ze zdjęciami */}
      <div className="fu" style={{ animationDelay: ".3s", display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <span style={{ fontFamily: H, fontWeight: 700, fontSize: "1.05rem" }}>Twoje treningi</span>
        <button onClick={() => goTo("trening")} style={{ background: "transparent", border: "none", color: T.accent, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", display: "inline-flex", alignItems: "center", gap: 2 }}>
          Zobacz <ChevronRight size={14} strokeWidth={2.6} />
        </button>
      </div>
      <div className="hscroll" style={{ marginBottom: 16 }}>
        {["A", "B", "C"].map((k, i) => (
          <div key={k} style={{ width: 150, flexShrink: 0 }}>
            <PhotoCard photo={PHOTOS[k]} height={190} radius={22} onClick={() => goTraining(k)} delay={`${0.32 + i * 0.06}s`}>
              <div style={{ position: "absolute", inset: 0, padding: "12px", display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
                <span style={{ alignSelf: "flex-start", background: `${EXERCISES_DATA[k].color}`, color: "#000", fontSize: 10, fontWeight: 800, padding: "3px 9px", borderRadius: 99, marginBottom: 6 }}>
                  {EXERCISES_DATA[k].day}
                </span>
                <div style={{ fontFamily: H, fontWeight: 700, fontSize: "1.05rem", color: "#fff", lineHeight: 1.1 }}>{EXERCISES_DATA[k].label}</div>
                <div style={{ fontSize: 10.5, color: "rgba(255,255,255,0.65)", marginTop: 3 }}>{EXERCISES_DATA[k].exercises.length} ćwiczeń · ~60 min</div>
              </div>
            </PhotoCard>
          </div>
        ))}
      </div>

      {/* DIETA — podgląd */}
      {diet && (
        <div
          className="fu"
          onClick={() => goTo("dieta")}
          style={{ animationDelay: ".4s", background: T.card, border: `1px solid ${T.borderSoft}`, borderRadius: 24, padding: 10, marginBottom: 16, display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}
        >
          <img src={PHOTOS.food} alt="" style={{ width: 64, height: 64, borderRadius: 18, objectFit: "cover", flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 700 }}>Dieta i nawodnienie</div>
            <div style={{ fontSize: 11.5, color: T.sub, marginTop: 2 }}>
              Dziś: <strong style={{ color: T.accent }}>{diet.kcal}</strong> / {diet.target} kcal
            </div>
            <div style={{ height: 6, borderRadius: 99, background: T.track, overflow: "hidden", marginTop: 7 }}>
              <div style={{ height: "100%", width: `${Math.min(diet.kcal / diet.target, 1) * 100}%`, borderRadius: 99, background: diet.kcal >= diet.target ? T.ok : T.accent, transition: "width .5s" }} />
            </div>
          </div>
          <ChevronRight size={18} color={T.faint} strokeWidth={2.4} style={{ flexShrink: 0, marginRight: 4 }} />
        </div>
      )}

      {/* PLAN TYGODNIA */}
      <div className="fu" style={{ animationDelay: ".45s", background: T.card, border: `1px solid ${T.borderSoft}`, borderRadius: 24, padding: "14px 16px", marginBottom: 4 }}>
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
            <span style={{ fontFamily: H, fontWeight: 700, fontSize: 11, width: 24, color: r.dw === dow ? T.accent : T.faint }}>{r.d}</span>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: r.c, flexShrink: 0 }}></span>
            <span style={{ fontSize: 12.5, fontWeight: r.dw === dow ? 700 : 500, flex: 1 }}>{r.t}</span>
            {r.dw === dow && (
              <span style={{ fontSize: 9, fontWeight: 800, color: T.accent, background: T.accentSoftBg, border: `1px solid ${T.accentSoftBorder}`, padding: "2px 8px", borderRadius: 99 }}>DZIŚ</span>
            )}
          </div>
        ))}
      </div>

      {/* mini statystyki na dole */}
      <div className="fu" style={{ animationDelay: ".5s", display: "flex", gap: 10, marginTop: 14 }}>
        <div style={{ flex: 1, background: T.card, border: `1px solid ${T.borderSoft}`, borderRadius: 20, padding: "12px", textAlign: "center" }}>
          <div style={{ fontFamily: H, fontWeight: 700, fontSize: "1.25rem", color: T.accent }}>{Math.round(cSnaps)}</div>
          <div style={{ fontSize: 9.5, color: T.sub, textTransform: "uppercase", letterSpacing: ".06em", fontWeight: 700, marginTop: 2 }}>zapisów</div>
        </div>
        <div style={{ flex: 1, background: T.card, border: `1px solid ${T.borderSoft}`, borderRadius: 20, padding: "12px", textAlign: "center" }}>
          <div style={{ fontFamily: H, fontWeight: 700, fontSize: "1.25rem", color: T.purple }}>
            {earnedCount}
            <span style={{ fontSize: 12, color: T.faint }}>/6</span>
          </div>
          <div style={{ fontSize: 9.5, color: T.sub, textTransform: "uppercase", letterSpacing: ".06em", fontWeight: 700, marginTop: 2 }}>odznaki</div>
        </div>
      </div>
    </div>
  );
}
