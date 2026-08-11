import { useEffect, useState } from "react";
import { ArrowLeft, Flame, Heart, Play, Dumbbell, Layers, Clock, Pencil, Check, RotateCcw } from "lucide-react";
import { T, FONT_NUM, TR, stagger } from "../theme.js";
import { EXERCISES_DATA } from "../data/plan.js";
import { PHOTOS } from "../data/photos.js";
import { storage } from "../lib/storage.js";
import { estimateWorkoutMin } from "../lib/utils.js";
import { EX_THUMB } from "../data/exerciseThumbs.js";
import { EditNum, EditStr } from "./Editable.jsx";
import { loadWorkoutLog } from "../lib/workoutLog.js";

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

// oryginalne wartości ćwiczenia z planu bazowego — do wykrywania zmian
// (chip "ZMIENIONE") i przywracania domyślnych w trybie edycji
function origOf(id) {
  for (const day of Object.values(EXERCISES_DATA)) {
    const e = day.exercises.find((x) => x.id === id);
    if (e) return e;
  }
  return null;
}

// Skala trudności 5 stopni, niebieski = łatwy, czerwony = trudny.
// Priorytet mają PRAWDZIWE odczucia użytkownika: RPE zaznaczane po seriach
// w sesji live (perExercise.avgRpe w workout_log). Gdy danych RPE brak
// (świeży plan), trudność liczona z planu: serie ważone długością przerwy.
const DIFF_LEVELS = [
  { label: "Łatwy", color: T.blue },
  { label: "Umiarkowany", color: T.ok },
  { label: "Średni", color: T.yellow },
  { label: "Wymagający", color: T.orange },
  { label: "Trudny", color: T.danger },
];
const rpeLevel = (rpe) => Math.min(Math.max(Math.round(rpe) - 6, 0), 4); // RPE 6→0 … 10→4

// "dziś" / "wczoraj" / "5 dni temu" — podpis przy pasku RPE ćwiczenia
function agoLabel(ts) {
  const d = Math.round((Date.now() - ts) / 86400000);
  return d <= 0 ? "dziś" : d === 1 ? "wczoraj" : d < 14 ? `${d} dni temu` : `${Math.round(d / 7)} tyg. temu`;
}

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

export function WorkoutDetail({ dayKey, data, onBack, onWarmup, onSelectDay, onStart, onExercise, activeExerciseId, onChangeWeight, onChangeReps, onChangeSets, onChangeName, onChangeRest, onReset }) {
  const [favs, setFavs] = useState([]);
  const [editMode, setEditMode] = useState(false); // panel edycji ćwiczeń (ołówek w hero)

  // ostatnie RPE per ćwiczenie z dziennika sesji — zasila pasek trudności
  // ćwiczenia ("jak ciężko było ostatnio") i trudność całego dnia
  const [rpeMap, setRpeMap] = useState({});
  useEffect(() => {
    loadWorkoutLog().then((log) => {
      const m = {};
      for (let i = log.length - 1; i >= 0; i--) {
        (log[i].perExercise || []).forEach((pe) => {
          if (pe.avgRpe != null && !m[pe.id]) m[pe.id] = { rpe: pe.avgRpe, ts: log[i].ts };
        });
      }
      setRpeMap(m);
    });
  }, []);
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
  // ulubione (serduszko) pływają na górę listy — inaczej ten przycisk nic nie robi
  const sortedExs = [...exs].sort((a, b) => (favs.includes(b.id) ? 1 : 0) - (favs.includes(a.id) ? 1 : 0));
  const totalSets = exs.reduce((s, e) => s + e.sets, 0);
  // czas z realnych przerw z planu, nie ze sztywnego mnożnika — patrz utils.js
  const estMin = estimateWorkoutMin(exs);
  const pad2 = (n) => String(n).padStart(2, "0");

  // które ćwiczenie odbiega od planu bazowego (edytowane przez użytkownika)
  const isModified = (ex) => {
    const o = origOf(ex.id);
    return !!o && (o.name !== ex.name || o.sets !== ex.sets || String(o.reps) !== String(ex.reps) || o.weight !== ex.weight || o.rest !== ex.rest);
  };
  // atomowy reset w App.jsx — pojedyncze wywołania change* nadpisywałyby się
  const restoreDefaults = (ex) => onReset && onReset(ex.id);

  const nameValidate = (v) => v.trim().length >= 3 && v.trim().length <= 48;

  return (
    <div style={{ margin: "-20px -18px 0", paddingBottom: 178 }}>
      {/* HERO */}
      <div style={{ position: "relative", height: 300 }}>
        <img src={PHOTOS[dayKey]} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(23,23,23,0.45) 0%, rgba(23,23,23,0.05) 35%, rgba(23,23,23,0.55) 100%)" }} />
        <div className="filmic" />
        <button
          onClick={onBack}
          style={{ position: "absolute", top: 18, left: 18, width: 40, height: 40, borderRadius: 13, background: "rgba(23,23,23,0.65)", backdropFilter: "blur(8px)", border: "none", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          <ArrowLeft size={18} strokeWidth={2.2} />
        </button>
        <button
          onClick={onWarmup}
          title="Rozgrzewka"
          style={{ position: "absolute", top: 18, right: 18, width: 40, height: 40, borderRadius: 13, background: "rgba(23,23,23,0.65)", backdropFilter: "blur(8px)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          <Flame size={18} color={T.accent} strokeWidth={2.2} />
        </button>
        {/* tryb edycji planu dnia — ołówek; aktywny zmienia się w "gotowe" */}
        <button
          onClick={() => setEditMode(!editMode)}
          title={editMode ? "Zakończ edycję" : "Edytuj ćwiczenia"}
          aria-label={editMode ? "Zakończ edycję" : "Edytuj ćwiczenia"}
          style={{ position: "absolute", top: 18, right: 66, width: 40, height: 40, borderRadius: 13, background: editMode ? T.accent : "rgba(23,23,23,0.65)", backdropFilter: "blur(8px)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "background .2s" }}
        >
          {editMode ? <Check size={18} color="#000" strokeWidth={2.6} /> : <Pencil size={17} color="#fff" strokeWidth={2.2} />}
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
              className="tap"
              style={{ flex: 1, padding: "8px 4px", borderRadius: 12, background: dayKey === k ? T.accent : T.card, border: "none", color: dayKey === k ? "#000" : T.sub, fontFamily: U, fontWeight: 700, fontSize: 13, cursor: "pointer", transition: TR.colors }}
            >
              {k} · {EXERCISES_DATA[k].day.slice(0, 3)}
            </button>
          ))}
        </div>

        {/* ścieżka nawigacji — wiadomo gdzie jesteś i dokąd cofa "wstecz" */}
        <div className="fu" style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".08em", color: T.faint, textTransform: "uppercase", marginBottom: 6 }}>
          Dom <span style={{ color: T.soft }}>/</span> <span style={{ color: T.sub }}>Trening {dayKey}</span>
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
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: editMode ? T.accent : T.soft }}>
            {editMode ? "Edycja ćwiczeń" : "Ćwiczenia"}
          </span>
          <span style={{ fontSize: 11, color: T.sub }}>{exs.length} łącznie</span>
        </div>

        {/* podpowiedź trybu edycji */}
        {editMode && (
          <div className="fu" style={{ display: "flex", gap: 10, alignItems: "flex-start", background: T.accentSoftBg, border: `1px solid ${T.accentSoftBorder}`, borderRadius: 14, padding: "10px 13px", marginBottom: 12 }}>
            <Pencil size={13} color={T.accent} strokeWidth={2.4} style={{ flexShrink: 0, marginTop: 2 }} />
            <span style={{ fontSize: 11, color: T.light, lineHeight: 1.5 }}>
              Kliknij wartość, aby ją zmienić — zapis jest automatyczny, a zmiana ciężaru od razu dopisuje punkt do wykresu progresu. Edytowane ćwiczenia dostają znacznik <strong style={{ color: T.accent }}>ZMIENIONE</strong>; strzałka przywraca wartości z planu.
            </span>
          </div>
        )}

        {sortedExs.map((ex, i) => {
          const mod = isModified(ex);
          return (
            <div
              key={ex.id}
              className="fu"
              onClick={() => !editMode && onExercise && onExercise(ex.id)}
              style={{
                animationDelay: stagger(i, 0.16),
                display: "flex",
                alignItems: "center",
                gap: 12,
                background: T.card,
                border: `1px solid ${editMode ? T.accentSoftBorder : T.borderSoft}`,
                borderRadius: 18,
                padding: 10,
                marginBottom: 10,
                cursor: !editMode && onExercise ? "pointer" : "default",
                transition: "border-color .2s",
              }}
            >
              <img
                src={EX_THUMB[ex.id] || THUMB[ex.cat] || PHOTOS.hero}
                alt=""
                style={{ width: 54, height: 54, borderRadius: 14, objectFit: "cover", flexShrink: 0, alignSelf: "flex-start", viewTransitionName: ex.id === activeExerciseId ? "ex-hero" : undefined }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                {editMode ? (
                  <>
                    {/* nazwa — edytowalna (np. inna maszyna na Twojej siłowni) */}
                    <div style={{ fontSize: 13.5, fontWeight: 700, fontFamily: U, lineHeight: 1.3 }}>
                      <EditStr value={ex.name} onChange={(v) => onChangeName && onChangeName(ex.id, v)} validate={nameValidate} width={190} align="left" />
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 14px", marginTop: 7, fontSize: 11, color: T.sub }}>
                      <span>
                        serie: <EditNum value={ex.sets} min={1} max={20} onChange={(v) => onChangeSets && onChangeSets(ex.id, v)} />
                      </span>
                      <span>
                        powt.: <EditStr value={String(ex.reps)} onChange={(v) => onChangeReps && onChangeReps(ex.id, v)} />
                      </span>
                      {ex.weight > 0 && (
                        <span>
                          ciężar: <EditNum value={ex.weight} unit={ex.unit} min={0.5} max={500} onChange={(v) => onChangeWeight && onChangeWeight(ex.id, v)} />
                        </span>
                      )}
                      <span>
                        przerwa: <EditNum value={ex.rest} unit="s" min={15} max={600} onChange={(v) => onChangeRest && onChangeRest(ex.id, v)} />
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{ fontSize: 13.5, fontWeight: 700, color: "#fff", fontFamily: U, lineHeight: 1.25 }}>{ex.name}</div>
                    <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: ".08em", color: T.sub, marginTop: 4, textTransform: "uppercase", display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap" }}>
                      <span>
                        {ex.sets} SERIE · {ex.reps} POWT.{ex.weight > 0 ? ` · ${String(ex.weight).replace(".", ",")} ${ex.unit.toUpperCase()}` : ""}
                      </span>
                      {mod && (
                        <span style={{ background: T.accentSoftBg, border: `1px solid ${T.accentSoftBorder}`, color: T.accent, borderRadius: 99, padding: "1px 7px", fontSize: 8, letterSpacing: ".1em" }}>
                          ZMIENIONE
                        </span>
                      )}
                    </div>
                    {/* trudność ćwiczenia z OSTATNIEGO wykonania — RPE zaznaczone
                        w sesji live (np. tydzień temu); brak danych = brak paska */}
                    {rpeMap[ex.id] && (
                      <div style={{ display: "flex", alignItems: "center", gap: 7, marginTop: 7 }}>
                        <span style={{ display: "flex", gap: 3 }}>
                          {DIFF_LEVELS.map((l, j) => (
                            <span
                              key={j}
                              style={{ width: 15, height: 5, borderRadius: 99, background: j <= rpeLevel(rpeMap[ex.id].rpe) ? DIFF_LEVELS[rpeLevel(rpeMap[ex.id].rpe)].color : T.track }}
                            />
                          ))}
                        </span>
                        <span style={{ fontSize: 9, color: T.faint, fontWeight: 600 }}>
                          RPE {String(rpeMap[ex.id].rpe).replace(".", ",")} · {agoLabel(rpeMap[ex.id].ts)}
                        </span>
                      </div>
                    )}
                  </>
                )}
              </div>
              {editMode ? (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    restoreDefaults(ex);
                  }}
                  disabled={!mod}
                  title="Przywróć wartości z planu"
                  aria-label="Przywróć wartości z planu"
                  style={{ width: 40, height: 40, borderRadius: "50%", background: T.inset, border: "none", cursor: mod ? "pointer" : "default", opacity: mod ? 1 : 0.3, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, alignSelf: "flex-start" }}
                >
                  <RotateCcw size={16} color={mod ? T.accent : T.soft} strokeWidth={2.2} />
                </button>
              ) : (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFav(ex.id);
                  }}
                  title="Ulubione" aria-label="Ulubione"
                  style={{ width: 40, height: 40, borderRadius: "50%", background: favs.includes(ex.id) ? T.accent : T.inset, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: TR.colors }}
                >
                  <Heart size={17} color={favs.includes(ex.id) ? "#000" : T.soft} fill={favs.includes(ex.id) ? "#000" : "none"} strokeWidth={2.1} />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* PRZYKLEJONY CTA */}
      <div style={{ position: "fixed", left: "50%", transform: "translateX(-50%)", bottom: "calc(86px + env(safe-area-inset-bottom))", zIndex: 800, width: "calc(100% - 36px)", maxWidth: 400 }}>
        <button
          onClick={onStart}
          className="tap tap-wide"
          style={{ width: "100%", background: T.accent, color: "#000", border: "none", borderRadius: 99, fontFamily: U, fontWeight: 700, fontSize: 15, padding: "16px 24px", cursor: "pointer", boxShadow: "0 6px 16px rgba(0,0,0,0.3)", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
        >
          <Play size={15} color="#000" fill="#000" strokeWidth={0} />
          Rozpocznij trening
        </button>
      </div>
    </div>
  );
}
