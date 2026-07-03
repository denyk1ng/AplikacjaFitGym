import { useEffect, useState } from "react";
import { Bell, Footprints, Moon, HeartPulse, Plus, Play, Droplets, Flame, Dumbbell, BicepsFlexed } from "lucide-react";
import { T } from "../theme.js";
import { EXERCISES_DATA } from "../data/plan.js";
import { PHOTOS } from "../data/photos.js";
import { storage } from "../lib/storage.js";
import { computeStreak, computeTotalGain, isoWeekStart } from "../lib/utils.js";
import { Ring } from "./Ring.jsx";

const H = "'Space Grotesk',sans-serif";

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

// Pasek kalendarza tygodnia (jak "Weekly Summary" z referencji)
function WeekStrip({ dow }) {
  const monday = new Date(isoWeekStart(Date.now()));
  const days = ["PN", "WT", "ŚR", "CZ", "PT", "SB", "ND"].map((label, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const jsDow = (i + 1) % 7; // PN=1 ... ND=0
    const plan = jsDow === 1 ? T.blue : jsDow === 3 ? T.orange : jsDow === 5 ? T.purple : jsDow === 2 || jsDow === 4 ? T.ok : T.faint;
    return { label, num: d.getDate(), today: jsDow === dow, dot: plan };
  });
  return (
    <div className="fu" style={{ animationDelay: ".04s", display: "flex", gap: 6, marginBottom: 20 }}>
      {days.map((d) => (
        <div
          key={d.label}
          style={{
            flex: 1,
            background: d.today ? T.accent : T.card,
            border: `1px solid ${d.today ? T.accent : T.borderSoft}`,
            borderRadius: 14,
            padding: "9px 2px 8px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 3,
          }}
        >
          <span style={{ fontSize: 8.5, fontWeight: 800, letterSpacing: ".04em", color: d.today ? "rgba(0,0,0,0.6)" : T.sub }}>{d.label}</span>
          <span style={{ fontFamily: H, fontWeight: 700, fontSize: 14.5, color: d.today ? "#000" : "#fff" }}>{d.num}</span>
          <span style={{ width: 5, height: 5, borderRadius: "50%", background: d.today ? "#000" : d.dot }} />
        </div>
      ))}
    </div>
  );
}

export function DashboardTab({ snapshots, exercises, goTraining, goTo, userName }) {
  const dow = new Date().getDay();
  const todayKey = dow === 1 ? "A" : dow === 3 ? "B" : dow === 5 ? "C" : null;
  const isCardio = dow === 2 || dow === 4;
  const streak = computeStreak(snapshots);
  const gain = computeTotalGain(snapshots);
  const weekStart = isoWeekStart(Date.now());
  const thisWeek = snapshots.filter((s) => s.ts >= weekStart).length;

  const WEEK = 7 * 24 * 3600 * 1000;
  const weekBars = [3, 2, 1, 0].map((off) => {
    const start = weekStart - off * WEEK;
    const n = snapshots.filter((s) => s.ts >= start && s.ts < start + WEEK).length;
    return Math.min(n / 3, 1);
  });

  const [diet, setDiet] = useState({ kcal: 0, target: 2500, water: 0, waterTarget: 3000 });
  useEffect(() => {
    async function load() {
      try {
        const t = await storage.get("diet_targets");
        const l = await storage.get("diet_log");
        const targets = t && t.value ? JSON.parse(t.value) : {};
        const log = l && l.value ? JSON.parse(l.value) : {};
        const key = new Date().toLocaleDateString("sv-SE");
        const today = log[key] || {};
        setDiet({ kcal: today.kcal || 0, target: targets.kcal || 2500, water: today.water || 0, waterTarget: targets.water || 3000 });
      } catch (e) {}
    }
    load();
  }, []);

  const dateStr = new Date().toLocaleDateString("pl-PL", { weekday: "long", day: "numeric", month: "long" });

  const hero = todayKey
    ? { title: EXERCISES_DATA[todayKey].label, sub: `${exercises[todayKey].exercises.length} ćwiczeń do zrobienia`, cta: "Zacznij trening", go: () => goTraining(todayKey) }
    : isCardio
      ? { title: "Cardio + sauna", sub: "Bieżnia 12% · 3,5 km/h · 50 min", cta: "Szczegóły planu", go: () => goTo("trening") }
      : { title: "Regeneracja", sub: "Rozciąganie i pełny odpoczynek", cta: "Zobacz rozgrzewkę", go: () => goTo("rozgrzewka") };

  const cats = [
    { Icon: Flame, l: "Rozgrzewka", act: false, go: () => goTo("rozgrzewka") },
    { Icon: Dumbbell, l: "Trening A", act: todayKey === "A", go: () => goTraining("A") },
    { Icon: Footprints, l: "Trening B", act: todayKey === "B", go: () => goTraining("B") },
    { Icon: BicepsFlexed, l: "Trening C", act: todayKey === "C", go: () => goTraining("C") },
    { Icon: HeartPulse, l: "Cardio", act: isCardio, go: () => goTo("trening") },
  ];

  return (
    <div>
      {/* HEADER */}
      <div className="fu" style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
        <button onClick={() => goTo("profil")} style={{ width: 46, height: 46, borderRadius: "50%", padding: 0, border: `1.5px solid ${T.accentSoftBorder}`, overflow: "hidden", cursor: "pointer", flexShrink: 0, background: T.card }}>
          <img src={PHOTOS.hero} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: H, fontWeight: 700, fontSize: "1.18rem", color: "#fff", lineHeight: 1.15, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            Cześć{userName ? `, ${userName}` : ""} 👋
          </div>
          <div style={{ fontSize: 11.5, color: T.sub, marginTop: 2 }}>{dateStr.charAt(0).toUpperCase() + dateStr.slice(1)}</div>
        </div>
        <button onClick={() => goTo("stats")} title="Aktywność" style={{ position: "relative", width: 42, height: 42, borderRadius: "50%", background: T.card, border: `1px solid ${T.border}`, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Bell size={18} color="#fff" strokeWidth={2} />
          <span style={{ position: "absolute", top: 9, right: 10, width: 7, height: 7, borderRadius: "50%", background: T.accent, border: `1.5px solid ${T.card}` }} />
        </button>
      </div>

      {/* KALENDARZ TYGODNIA */}
      <WeekStrip dow={dow} />

      {/* LIMONKOWA KARTA HERO (jak "Weight lose" z referencji) */}
      <div className="fu" style={{ animationDelay: ".08s", background: T.accent, borderRadius: 26, padding: "18px 18px 16px", marginBottom: 22, boxShadow: "0 18px 44px rgba(198,244,50,0.18)" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ width: 42, height: 42, borderRadius: 14, background: "rgba(0,0,0,0.12)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
              <Dumbbell size={21} color="#000" strokeWidth={2.3} />
            </div>
            <div style={{ fontFamily: H, fontWeight: 700, fontSize: "1.45rem", color: "#000", lineHeight: 1.05 }}>{hero.title}</div>
            <div style={{ fontSize: 12, color: "rgba(0,0,0,0.62)", marginTop: 4, fontWeight: 600 }}>{hero.sub}</div>
          </div>
          <Ring pct={Math.min(thisWeek / 3, 1)} size={64} stroke={7} color="#000" track="rgba(0,0,0,0.14)">
            <span style={{ fontFamily: H, fontWeight: 700, fontSize: 13, color: "#000" }}>{Math.round(Math.min(thisWeek / 3, 1) * 100)}%</span>
          </Ring>
        </div>
        <button
          onClick={hero.go}
          style={{ marginTop: 14, width: "100%", background: "#0d1108", color: "#fff", border: "none", borderRadius: 99, fontFamily: H, fontWeight: 700, fontSize: 13.5, padding: "14px 20px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
        >
          <Play size={15} color={T.accent} fill={T.accent} strokeWidth={0} />
          {hero.cta}
        </button>
      </div>

      {/* KATEGORIE — kwadratowe kafelki z podpisem */}
      <SectionHead title="Kategorie" onSee={() => goTo("trening")} delay=".12s" />
      <div className="fu hscroll" style={{ animationDelay: ".14s", marginBottom: 22 }}>
        {cats.map(({ Icon, l, act, go }) => (
          <button key={l} onClick={go} style={{ background: "transparent", border: "none", cursor: "pointer", fontFamily: "inherit", display: "flex", flexDirection: "column", alignItems: "center", gap: 8, flexShrink: 0, padding: 0 }}>
            <span
              style={{
                width: 60,
                height: 60,
                borderRadius: 20,
                background: act ? T.accent : "#1d1e18",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: act ? "0 6px 22px rgba(198,244,50,0.35)" : "none",
                transition: "all .2s",
              }}
            >
              <Icon size={24} color={act ? "#000" : "#e6e8de"} strokeWidth={2} />
            </span>
            <span style={{ fontSize: 10.5, fontWeight: 600, color: act ? "#fff" : T.sub, whiteSpace: "nowrap" }}>{l}</span>
          </button>
        ))}
      </div>

      {/* AKTYWNOŚĆ */}
      <SectionHead title="Aktywność" onSee={() => goTo("stats")} delay=".18s" />
      <div style={{ display: "flex", gap: 10, marginBottom: 22 }}>
        <div className="fu" style={{ animationDelay: ".2s", flex: 1, background: T.card, border: `1px solid ${T.borderSoft}`, borderRadius: 22, padding: "12px 10px", display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5, alignSelf: "flex-start" }}>
            <Footprints size={13} color={T.accent} strokeWidth={2.4} />
            <span style={{ fontSize: 10, color: T.soft, fontWeight: 600 }}>Zapisy</span>
          </div>
          <Ring pct={Math.min(thisWeek / 3, 1)} size={58} stroke={6} color={T.accent}>
            <span style={{ fontFamily: H, fontWeight: 700, fontSize: 13, color: "#fff" }}>{thisWeek}/3</span>
          </Ring>
          <span style={{ fontSize: 9.5, color: T.sub, fontWeight: 600 }}>w tym tygodniu</span>
        </div>
        <div className="fu" style={{ animationDelay: ".24s", flex: 1, background: T.card, border: `1px solid ${T.borderSoft}`, borderRadius: 22, padding: "12px 10px", display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
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
            <strong style={{ color: "#fff", fontFamily: H, fontSize: 13 }}>{streak}</strong> tyg. z rzędu
          </span>
        </div>
        <div className="fu" style={{ animationDelay: ".28s", flex: 1, background: T.card, border: `1px solid ${T.borderSoft}`, borderRadius: 22, padding: "12px 10px", display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
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
              {Math.round(gain * 10) / 10}
            </strong>{" "}
            kg łącznie
          </span>
        </div>
      </div>

      {/* TWOJE TRENINGI — karty ze zdjęciami */}
      <SectionHead title="Twoje treningi" onSee={() => goTo("trening")} delay=".32s" />
      <div className="hscroll" style={{ marginBottom: 22 }}>
        {["A", "B", "C"].map((k, i) => (
          <div
            key={k}
            className="fu"
            onClick={() => goTraining(k)}
            style={{ animationDelay: `${0.34 + i * 0.05}s`, position: "relative", width: 150, height: 190, borderRadius: 22, overflow: "hidden", flexShrink: 0, cursor: "pointer", border: `1px solid ${T.border}` }}
          >
            <img src={PHOTOS[k]} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(13,17,8,0.05) 30%, rgba(13,17,8,0.92) 100%)" }} />
            <div style={{ position: "absolute", inset: 0, padding: 12, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
              <span style={{ alignSelf: "flex-start", background: EXERCISES_DATA[k].color, color: "#000", fontSize: 9.5, fontWeight: 800, padding: "3px 9px", borderRadius: 99, marginBottom: 6 }}>
                {EXERCISES_DATA[k].day}
              </span>
              <div style={{ fontFamily: H, fontWeight: 700, fontSize: "1.02rem", color: "#fff", lineHeight: 1.1 }}>{EXERCISES_DATA[k].label}</div>
              <div style={{ fontSize: 10.5, color: "rgba(255,255,255,0.65)", marginTop: 3 }}>{EXERCISES_DATA[k].exercises.length} ćwiczeń · ~60 min</div>
            </div>
          </div>
        ))}
      </div>

      {/* DIETA I ODŻYWIANIE */}
      <SectionHead title="Dieta i odżywianie" onSee={() => goTo("dieta")} delay=".4s" />
      <div className="fu" style={{ animationDelay: ".42s", background: T.card, border: `1px solid ${T.borderSoft}`, borderRadius: 22, padding: 10, display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
        <img src={PHOTOS.food} alt="" style={{ width: 58, height: 58, borderRadius: 16, objectFit: "cover", flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>Dzisiejsze kalorie</div>
          <div style={{ fontSize: 11, color: T.sub, marginTop: 2 }}>
            <strong style={{ color: T.accent }}>{diet.kcal}</strong> / {diet.target} kcal
          </div>
          <div style={{ height: 5, borderRadius: 99, background: T.track, overflow: "hidden", marginTop: 6 }}>
            <div style={{ height: "100%", width: `${Math.min(diet.kcal / diet.target, 1) * 100}%`, borderRadius: 99, background: T.accent, transition: "width .5s" }} />
          </div>
        </div>
        <button onClick={() => goTo("dieta")} style={{ width: 38, height: 38, borderRadius: "50%", background: T.accent, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginRight: 4 }}>
          <Plus size={18} color="#000" strokeWidth={2.8} />
        </button>
      </div>
      <div className="fu" style={{ animationDelay: ".46s", background: T.card, border: `1px solid ${T.borderSoft}`, borderRadius: 22, padding: 10, display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 58, height: 58, borderRadius: 16, background: "rgba(74,158,255,0.14)", border: "1px solid rgba(74,158,255,0.3)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Droplets size={24} color={T.blue} strokeWidth={2.2} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>Nawodnienie</div>
          <div style={{ fontSize: 11, color: T.sub, marginTop: 2 }}>
            <strong style={{ color: T.blue }}>{diet.water}</strong> / {diet.waterTarget} ml
          </div>
          <div style={{ height: 5, borderRadius: 99, background: T.track, overflow: "hidden", marginTop: 6 }}>
            <div style={{ height: "100%", width: `${Math.min(diet.water / diet.waterTarget, 1) * 100}%`, borderRadius: 99, background: T.blue, transition: "width .5s" }} />
          </div>
        </div>
        <button onClick={() => goTo("dieta")} style={{ width: 38, height: 38, borderRadius: "50%", background: T.accent, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginRight: 4 }}>
          <Plus size={18} color="#000" strokeWidth={2.8} />
        </button>
      </div>
    </div>
  );
}
