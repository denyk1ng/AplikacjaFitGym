import { useEffect, useState } from "react";
import { ArrowLeft, Flame, Heart, Play, Dumbbell, Layers, Clock } from "lucide-react";
import { T, FONT_NUM } from "../theme.js";
import { EXERCISES_DATA } from "../data/plan.js";
import { PHOTOS } from "../data/photos.js";
import { storage } from "../lib/storage.js";
import { EX_THUMB } from "../data/exerciseThumbs.js";

const U = "'Urbanist',sans-serif";

// miniatury ćwiczeń wg partii mięśniowej (do czasu własnych zdjęć per ćwiczenie)
const THUMB = {
  KLATKA: PHOTOS.hero,
  PLECY: PHOTOS.A,
  BARKI: PHOTOS.C,
  BICEPS: PHOTOS.A,
  TRICEPS: PHOTOS.A,
  NOGI: PHOTOS.B,
  BRZUCH: PHOTOS.stretch,
};

function StatCell({ Icon, label, value, unit, sub, divider }) {
  return (
    <div style={{ flex: 1, padding: "12px 6px 12px 14px", borderLeft: divider ? `1px solid ${T.borderSoft}` : "none" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 7 }}>
        <Icon size={13} color={T.accent} strokeWidth={2.4} />
        <span style={{ fontSize: 11.5, fontWeight: 700, color: "#fff", fontFamily: U }}>{label}</span>
      </div>
      <div style={{ fontFamily: FONT_NUM, fontWeight: 800, fontSize: "1.35rem", color: T.light, lineHeight: 1 }}>
        {value}
        {unit && <span style={{ fontSize: 11 }}>{unit}</span>}
      </div>
      <div style={{ fontSize: 10, color: T.sub, marginTop: 5 }}>{sub}</div>
    </div>
  );
}

export function WorkoutDetail({ dayKey, data, onBack, onWarmup, onSelectDay, onStart, onExercise }) {
  const [favs, setFavs] = useState([]);
  useEffect(() => {
    storage.get("fav_exercises").then((r) => {
      try {
        if (r && r.value) setFavs(JSON.parse(r.value));
      } catch (e) {}
    });
  }, []);
  const toggleFav = (id) => {
    const next = favs.includes(id) ? favs.filter((f) => f !== id) : [...favs, id];
    setFavs(next);
    storage.set("fav_exercises", JSON.stringify(next));
  };

  const exs = data.exercises;
  const totalSets = exs.reduce((s, e) => s + e.sets, 0);
  const estMin = Math.round((totalSets * 2.5) / 5) * 5;
  const pad2 = (n) => String(n).padStart(2, "0");

  return (
    <div style={{ margin: "-20px -18px 0", paddingBottom: 178 }}>
      {/* HERO */}
      <div style={{ position: "relative", height: 300 }}>
        <img src={PHOTOS[dayKey]} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(6,9,16,0.45) 0%, rgba(6,9,16,0.05) 35%, rgba(6,9,16,0.55) 100%)" }} />
        <button
          onClick={onBack}
          style={{ position: "absolute", top: 18, left: 18, width: 40, height: 40, borderRadius: 13, background: "rgba(6,9,16,0.65)", backdropFilter: "blur(8px)", border: "none", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          <ArrowLeft size={18} strokeWidth={2.2} />
        </button>
        <button
          onClick={onWarmup}
          title="Rozgrzewka"
          style={{ position: "absolute", top: 18, right: 18, width: 40, height: 40, borderRadius: 13, background: "rgba(6,9,16,0.65)", backdropFilter: "blur(8px)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          <Flame size={18} color={T.accent} strokeWidth={2.2} />
        </button>
      </div>

      {/* KARTA TREŚCI */}
      <div style={{ position: "relative", marginTop: -26, background: T.bg, borderRadius: "26px 26px 0 0", padding: "10px 18px 0" }}>
        {/* uchwyt */}
        <div style={{ width: 44, height: 4, borderRadius: 99, background: T.border, margin: "0 auto 14px" }} />

        {/* przełącznik dnia */}
        <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
          {["A", "B", "C"].map((k) => (
            <button
              key={k}
              onClick={() => onSelectDay(k)}
              style={{ flex: 1, padding: "8px 4px", borderRadius: 12, background: dayKey === k ? T.accent : T.card, border: "none", color: dayKey === k ? "#000" : T.sub, fontFamily: U, fontWeight: 700, fontSize: 13, cursor: "pointer", transition: "all .2s" }}
            >
              {k} · {EXERCISES_DATA[k].day.slice(0, 3)}
            </button>
          ))}
        </div>

        {/* tytuł */}
        <div className="fu" style={{ fontFamily: U, fontWeight: 700, fontSize: "1.5rem", color: "#fff", lineHeight: 1.15 }}>
          Trening – <span style={{ color: T.accent }}>{dayKey}</span>
        </div>
        <div className="fu" style={{ animationDelay: ".05s", fontSize: 12.5, color: T.soft, marginTop: 4, marginBottom: 16 }}>
          {data.desc}
        </div>

        {/* PASEK STATYSTYK */}
        <div className="fu" style={{ animationDelay: ".1s", display: "flex", background: T.card, border: `1px solid ${T.borderSoft}`, borderRadius: 18, marginBottom: 20 }}>
          <StatCell Icon={Dumbbell} label="Ćwiczenia" value={pad2(exs.length)} sub="w planie" />
          <StatCell Icon={Layers} label="Serie" value={pad2(totalSets)} sub="łącznie" divider />
          <StatCell Icon={Clock} label="Czas" value={estMin} unit="min" sub="szacunkowo" divider />
        </div>

        {/* LISTA ĆWICZEŃ */}
        <div className="fu" style={{ animationDelay: ".14s", display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: T.soft }}>Ćwiczenia</span>
          <span style={{ fontSize: 11, color: T.sub }}>{exs.length} łącznie</span>
        </div>

        {exs.map((ex, i) => (
          <div
            key={ex.id}
            className="fu"
            onClick={() => onExercise && onExercise(ex.id)}
            style={{
              animationDelay: `${0.16 + i * 0.04}s`,
              display: "flex",
              alignItems: "center",
              gap: 12,
              background: T.card,
              border: `1px solid ${T.borderSoft}`,
              borderRadius: 18,
              padding: 10,
              marginBottom: 10,
              cursor: onExercise ? "pointer" : "default",
            }}
          >
            <img src={EX_THUMB[ex.id] || THUMB[ex.cat] || PHOTOS.hero} alt="" style={{ width: 54, height: 54, borderRadius: 14, objectFit: "cover", flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: "#fff", fontFamily: U, lineHeight: 1.25 }}>{ex.name}</div>
              <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: ".08em", color: T.sub, marginTop: 4, textTransform: "uppercase" }}>
                {ex.sets} SERIE · {ex.reps} POWT.{ex.weight > 0 ? ` · ${String(ex.weight).replace(".", ",")} ${ex.unit.toUpperCase()}` : ""}
              </div>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleFav(ex.id);
              }}
              title="Ulubione"
              style={{ width: 40, height: 40, borderRadius: "50%", background: favs.includes(ex.id) ? T.accent : T.inset, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all .2s" }}
            >
              <Heart size={17} color={favs.includes(ex.id) ? "#000" : T.soft} fill={favs.includes(ex.id) ? "#000" : "none"} strokeWidth={2.1} />
            </button>
          </div>
        ))}
      </div>

      {/* PRZYKLEJONY CTA */}
      <div style={{ position: "fixed", left: "50%", transform: "translateX(-50%)", bottom: "calc(86px + env(safe-area-inset-bottom))", zIndex: 800, width: "calc(100% - 36px)", maxWidth: 400 }}>
        <button
          onClick={onStart}
          style={{ width: "100%", background: T.accent, color: "#000", border: "none", borderRadius: 99, fontFamily: U, fontWeight: 700, fontSize: 15, padding: "16px 24px", cursor: "pointer", boxShadow: "0 10px 34px rgba(255,77,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
        >
          <Play size={15} color="#000" fill="#000" strokeWidth={0} />
          Rozpocznij trening
        </button>
      </div>
    </div>
  );
}
