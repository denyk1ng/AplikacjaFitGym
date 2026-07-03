import { useEffect, useState } from "react";
import { Bell, Footprints, Moon, HeartPulse, Plus, ArrowUpRight, Droplets } from "lucide-react";
import { T } from "../theme.js";
import { EXERCISES_DATA } from "../data/plan.js";
import { PHOTOS } from "../data/photos.js";
import { storage } from "../lib/storage.js";
import { computeStreak, computeTotalGain, isoWeekStart } from "../lib/utils.js";
import { Ring } from "./Ring.jsx";

const H = "'Space Grotesk',sans-serif";

// Nagłówek sekcji: pogrubiony tytuł + limonkowe "Zobacz wszystkie" (jak w referencji)
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

// mini wykres słupkowy (kafelek "sen"/seria)
function MiniBars({ values, color }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 34 }}>
      {values.map((v, i) => (
        <div key={i} style={{ width: 7, height: `${Math.max(v * 100, 12)}%`, borderRadius: 4, background: i === values.length - 1 ? color : `${color}55` }} />
      ))}
    </div>
  );
}

// mini "EKG" (kafelek tętna → trend progresu)
function Waveform({ color }) {
  return (
    <svg width="72" height="34" viewBox="0 0 72 34" fill="none">
      <polyline
        points="0,20 10,20 15,10 21,28 27,6 33,24 38,17 48,17 53,11 60,22 66,17 72,17"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
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

  // aktywność ostatnich 4 tygodni (słupki)
  const WEEK = 7 * 24 * 3600 * 1000;
  const weekBars = [3, 2, 1, 0].map((off) => {
    const start = weekStart - off * WEEK;
    const n = snapshots.filter((s) => s.ts >= start && s.ts < start + WEEK).length;
    return Math.min(n / 3, 1);
  });

  // podgląd diety (kcal dziś)
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
    ? { chip: "DZIŚ NA PLANIE", title: EXERCISES_DATA[todayKey].label, sub: `${exercises[todayKey].exercises.length} ćwiczeń · ~60 min · + cardio`, photo: PHOTOS[todayKey], go: () => goTraining(todayKey) }
    : isCardio
      ? { chip: "DZIŚ NA PLANIE", title: "Cardio + sauna", sub: "Bieżnia 12% · 3,5 km/h · 50 min", photo: PHOTOS.cardio, go: () => goTo("trening") }
      : { chip: "DZIŚ NA PLANIE", title: "Regeneracja", sub: "Spacer, rozciąganie, odpoczynek", photo: PHOTOS.stretch, go: () => goTo("rozgrzewka") };

  const cats = [
    { icon: "🔥", c: T.orange, l: "Rozgrzewka", go: () => goTo("rozgrzewka") },
    { icon: "🏋️", c: T.blue, l: "Trening A", go: () => goTraining("A") },
    { icon: "🦵", c: T.orange, l: "Trening B", go: () => goTraining("B") },
    { icon: "💪", c: T.purple, l: "Trening C", go: () => goTraining("C") },
    { icon: "🏃", c: T.ok, l: "Cardio", go: () => goTo("trening") },
  ];

  return (
    <div>
      {/* HEADER: avatar + Cześć + dzwonek */}
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
        <button onClick={() => goTo("stats")} title="Aktywność" style={{ position: "relative", width: 42, height: 42, borderRadius: "50%", background: T.card, border: `1px solid ${T.border}`, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Bell size={18} color="#fff" strokeWidth={2} />
          <span style={{ position: "absolute", top: 9, right: 10, width: 7, height: 7, borderRadius: "50%", background: T.accent, border: `1.5px solid ${T.card}` }} />
        </button>
      </div>

      {/* KATEGORIE */}
      <SectionHead title="Kategorie" onSee={() => goTo("trening")} delay=".05s" />
      <div className="fu hscroll" style={{ animationDelay: ".08s", marginBottom: 20 }}>
        {cats.map((c) => (
          <button
            key={c.l}
            onClick={c.go}
            style={{ display: "inline-flex", alignItems: "center", gap: 8, background: T.card, border: `1px solid ${T.border}`, borderRadius: 99, padding: "8px 14px 8px 8px", cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap", flexShrink: 0 }}
          >
            <span style={{ width: 28, height: 28, borderRadius: "50%", background: `${c.c}22`, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>{c.icon}</span>
            <span style={{ color: "#fff", fontSize: 12.5, fontWeight: 600 }}>{c.l}</span>
          </button>
        ))}
      </div>

      {/* DUŻA KARTA — dziś na planie (zdjęcie po prawej jak w referencji) */}
      <div
        className="fu"
        onClick={hero.go}
        style={{ animationDelay: ".12s", position: "relative", borderRadius: 26, overflow: "hidden", background: `linear-gradient(105deg, ${T.card2} 42%, transparent 100%)`, border: `1px solid ${T.border}`, height: 168, marginBottom: 22, cursor: "pointer" }}
      >
        <img src={hero.photo} alt="" style={{ position: "absolute", right: 0, top: 0, width: "62%", height: "100%", objectFit: "cover" }} />
        <div style={{ position: "absolute", inset: 0, background: `linear-gradient(90deg, ${T.card2} 34%, rgba(20,26,12,0.72) 58%, rgba(20,26,12,0.15) 100%)` }} />
        <div style={{ position: "relative", height: "100%", padding: "16px 18px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <span style={{ alignSelf: "flex-start", background: T.accent, color: "#000", fontSize: 9.5, fontWeight: 800, letterSpacing: ".08em", padding: "5px 11px", borderRadius: 99 }}>
            {hero.chip}
          </span>
          <div>
            <div style={{ fontFamily: H, fontWeight: 700, fontSize: "1.65rem", color: "#fff", lineHeight: 1.02 }}>{hero.title}</div>
            <div style={{ fontSize: 11.5, color: "rgba(255,255,255,0.65)", marginTop: 5 }}>{hero.sub}</div>
          </div>
          <div style={{ position: "absolute", right: 14, bottom: 14, width: 40, height: 40, borderRadius: "50%", background: T.accent, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: T.accentGlow }}>
            <ArrowUpRight size={20} color="#000" strokeWidth={2.6} />
          </div>
        </div>
      </div>

      {/* AKTYWNOŚĆ — 3 kafelki jak Steps / Sleep / Heart */}
      <SectionHead title="Aktywność" onSee={() => goTo("stats")} delay=".16s" />
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
          <MiniBars values={weekBars} color={T.purple} />
          <span style={{ fontSize: 9.5, color: T.sub, fontWeight: 600 }}>
            <strong style={{ color: "#fff", fontFamily: H, fontSize: 13 }}>{streak}</strong> tyg. z rzędu
          </span>
        </div>

        <div className="fu" style={{ animationDelay: ".28s", flex: 1, background: T.card, border: `1px solid ${T.borderSoft}`, borderRadius: 22, padding: "12px 10px", display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5, alignSelf: "flex-start" }}>
            <HeartPulse size={13} color={T.danger} strokeWidth={2.4} />
            <span style={{ fontSize: 10, color: T.soft, fontWeight: 600 }}>Progres</span>
          </div>
          <Waveform color={T.danger} />
          <span style={{ fontSize: 9.5, color: T.sub, fontWeight: 600 }}>
            <strong style={{ color: "#fff", fontFamily: H, fontSize: 13 }}>
              {gain >= 0 ? "+" : ""}
              {Math.round(gain * 10) / 10}
            </strong>{" "}
            kg łącznie
          </span>
        </div>
      </div>

      {/* DIETA I ODŻYWIANIE */}
      <SectionHead title="Dieta i odżywianie" onSee={() => goTo("dieta")} delay=".32s" />
      <div className="fu" style={{ animationDelay: ".36s", background: T.card, border: `1px solid ${T.borderSoft}`, borderRadius: 22, padding: 10, display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
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
      <div className="fu" style={{ animationDelay: ".4s", background: T.card, border: `1px solid ${T.borderSoft}`, borderRadius: 22, padding: 10, display: "flex", alignItems: "center", gap: 12, marginBottom: 22 }}>
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

      {/* TWÓJ TYDZIEŃ */}
      <SectionHead title="Twój tydzień" delay=".44s" />
      <div className="fu" style={{ animationDelay: ".48s", background: T.card, border: `1px solid ${T.borderSoft}`, borderRadius: 22, padding: "6px 16px" }}>
        {[
          { d: "PN", t: "Trening A", c: T.blue, dw: 1 },
          { d: "WT", t: "Cardio + sauna", c: T.ok, dw: 2 },
          { d: "ŚR", t: "Trening B", c: T.orange, dw: 3 },
          { d: "CZ", t: "Cardio + sauna", c: T.ok, dw: 4 },
          { d: "PT", t: "Trening C", c: T.purple, dw: 5 },
          { d: "SB", t: "Regeneracja", c: T.faint, dw: 6 },
          { d: "ND", t: "Regeneracja", c: T.faint, dw: 0 },
        ].map((r, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: i < 6 ? `1px solid ${T.borderSoft}` : "none", opacity: r.dw === dow ? 1 : 0.55 }}>
            <span style={{ fontFamily: H, fontWeight: 700, fontSize: 11, width: 24, color: r.dw === dow ? T.accent : T.faint }}>{r.d}</span>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: r.c, flexShrink: 0 }}></span>
            <span style={{ fontSize: 12.5, fontWeight: r.dw === dow ? 700 : 500, flex: 1, color: "#fff" }}>{r.t}</span>
            {r.dw === dow && (
              <span style={{ fontSize: 9, fontWeight: 800, color: T.accent, background: T.accentSoftBg, border: `1px solid ${T.accentSoftBorder}`, padding: "2px 8px", borderRadius: 99 }}>DZIŚ</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
