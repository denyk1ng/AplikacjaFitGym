import { useMemo, useState } from "react";
import { ArrowLeft, Dumbbell, Gauge, Tag, TrendingUp, Youtube } from "lucide-react";
import { T, FONT_NUM } from "../theme.js";
import { EXERCISES_DATA, CAT_LABEL } from "../data/plan.js";
import { EX_IMG } from "../data/exerciseImages.js";
import { EditNum } from "./Editable.jsx";
import { EmptyState } from "./EmptyState.jsx";
import { MuscleHighlight } from "./MuscleMap.jsx";
import { estimate1RM } from "../lib/utils.js";

const U = "'Urbanist',sans-serif";

// znajdź ćwiczenie po id we wszystkich dniach
function findExercise(id) {
  for (const [dayKey, day] of Object.entries(EXERCISES_DATA)) {
    const ex = day.exercises.find((e) => e.id === id);
    if (ex) return { ...ex, dayKey };
  }
  return null;
}

// sprzęt wywnioskowany z nazwy ćwiczenia
function equipmentOf(name) {
  const n = name.toLowerCase();
  if (n.includes("martwy") || n.includes("przysiad")) return "Sztanga";
  if (n.includes("sztang") && !n.includes("hantl")) return "Sztanga";
  if (n.includes("hantl")) return "Hantle";
  if (n.includes("maszyn") || n.includes("rozpiętki")) return "Maszyna";
  if (n.includes("link") || n.includes("drążk") || n.includes("pull")) return "Wyciąg";
  if (n.includes("ez")) return "Sztanga EZ";
  if (n.includes("gum")) return "Guma";
  if (n.includes("kółko")) return "Kółko AB";
  return "Ciężar własny";
}

export function ExerciseDetail({ exerciseId, snapshots, currentWeight, currentName, onChangeWeight, onBack }) {
  const [tab, setTab] = useState("howto");

  // nazwa z żywego planu (użytkownik mógł ją zmienić w panelu edycji dnia)
  const ex = useMemo(() => {
    const base = findExercise(exerciseId);
    return base && currentName ? { ...base, name: currentName } : base;
  }, [exerciseId, currentName]);
  if (!ex) return null;

  const img = EX_IMG[ex.id];

  // historia ciężarów tego ćwiczenia z zapisów
  const history = snapshots
    .map((s) => {
      const w = (s.weights || {})[ex.id];
      return w !== undefined ? { ts: s.ts, dateShort: s.dateShort, w } : null;
    })
    .filter(Boolean)
    .sort((a, b) => a.ts - b.ts);

  const last7 = history.slice(-7);
  const maxW = history.length ? Math.max(...history.map((h) => h.w)) : null;
  const gain = history.length >= 2 ? Math.round((history[history.length - 1].w - history[0].w) * 100) / 100 : 0;
  const chartMax = last7.length ? Math.max(...last7.map((h) => h.w)) : 1;

  const oneRM = estimate1RM(currentWeight ?? ex.weight, ex.reps);

  // kroki techniki z notatek planu
  const steps = ex.tech
    ? ex.tech.split(". ").map((s) => s.trim().replace(/\.$/, "")).filter(Boolean)
    : [];

  const fmtW = (w) => `${String(w).replace(".", ",")} ${ex.unit || "kg"}`;

  const tabs = [
    { id: "howto", l: "Technika" },
    { id: "history", l: "Historia" },
    { id: "records", l: "Rekordy" },
  ];

  return (
    <div style={{ margin: "-20px -18px 0", paddingBottom: 120 }}>
      {/* ZDJĘCIE ĆWICZENIA — statyczne; wcześniej dwie klatki przenikały się
          animacją "pokaz ruchu", teraz jest po prostu zdjęcie danego ruchu */}
      <div style={{ position: "relative", height: 290, background: T.card2, overflow: "hidden" }}>
        {img && <img src={img} alt={ex.name} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", viewTransitionName: "ex-hero" }} />}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(23,23,23,0.55) 0%, transparent 25%, transparent 70%, rgba(23,23,23,0.7) 100%)" }} />
        <div className="filmic" />
        <button
          onClick={onBack}
          style={{ position: "absolute", top: 18, left: 18, width: 40, height: 40, borderRadius: 13, background: "rgba(23,23,23,0.65)", backdropFilter: "blur(8px)", border: "none", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          <ArrowLeft size={18} strokeWidth={2.2} />
        </button>
        <span style={{ position: "absolute", left: 16, bottom: 20, fontSize: 10, fontWeight: 700, letterSpacing: ".1em", color: "rgba(255,255,255,0.65)", textTransform: "uppercase" }}>
          {CAT_LABEL[ex.cat] || ex.cat}
        </span>
      </div>

      <div style={{ padding: "16px 18px 0" }}>
        {/* ścieżka nawigacji — wiadomo gdzie jesteś i dokąd cofa "wstecz" */}
        <div className="fu" style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".08em", color: T.faint, textTransform: "uppercase", marginBottom: 6 }}>
          Dom <span style={{ color: T.soft }}>/</span> Trening {ex.dayKey} <span style={{ color: T.soft }}>/</span> <span style={{ color: T.sub }}>{ex.name.split("—")[0].trim()}</span>
        </div>

        {/* TYTUŁ + TAGI */}
        <div className="fu" style={{ fontFamily: U, fontWeight: 700, fontSize: "1.35rem", color: "#fff", lineHeight: 1.2 }}>{ex.name}</div>
        <div className="fu" style={{ animationDelay: ".05s", display: "flex", gap: 7, flexWrap: "wrap", margin: "12px 0 16px" }}>
          {[
            { Icon: Tag, l: CAT_LABEL[ex.cat] || ex.cat },
            { Icon: Dumbbell, l: equipmentOf(ex.name) },
            { Icon: Gauge, l: `Trening ${ex.dayKey}` },
          ].map(({ Icon, l }) => (
            <span key={l} style={{ display: "inline-flex", alignItems: "center", gap: 6, background: T.card, border: `1px solid ${T.borderSoft}`, borderRadius: 99, padding: "7px 12px", fontSize: 11.5, fontWeight: 600, color: T.light }}>
              <Icon size={12} color={T.accent} strokeWidth={2.4} />
              {l}
            </span>
          ))}
        </div>

        {/* TRENOWANA PARTIA — sylwetka z podświetlonym mięśniem tego ćwiczenia */}
        <div className="fu" style={{ animationDelay: ".06s", display: "flex", alignItems: "center", gap: 16, background: T.card, border: `1px solid ${T.borderSoft}`, borderRadius: 18, padding: "13px 16px", marginBottom: 16 }}>
          <MuscleHighlight cat={ex.cat} width={72} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: T.soft }}>Trenowana partia</div>
            <div style={{ fontFamily: U, fontWeight: 700, fontSize: "1.25rem", color: T.accent, marginTop: 4 }}>{CAT_LABEL[ex.cat] || ex.cat}</div>
            <div style={{ fontSize: 11, color: T.sub, marginTop: 4, lineHeight: 1.5 }}>
              Główny mięsień pracujący w tym ruchu — podświetlony na sylwetce.
            </div>
          </div>
        </div>

        {/* CIĘŻAR ROBOCZY — edycja z auto-zapisem */}
        <div className="fu" style={{ animationDelay: ".07s", display: "flex", alignItems: "center", gap: 12, background: T.card, border: `1px solid ${T.borderSoft}`, borderRadius: 18, padding: "13px 16px", marginBottom: 16 }}>
          <span style={{ width: 40, height: 40, borderRadius: 13, background: T.accentSoftBg, border: `1px solid ${T.accentSoftBorder}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Dumbbell size={18} color={T.accent} strokeWidth={2.2} />
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: "#fff", fontFamily: U }}>Twój ciężar roboczy</div>
            <div style={{ fontSize: 10.5, color: T.sub, marginTop: 2 }}>kliknij liczbę, aby zmienić · zapis automatyczny</div>
          </div>
          <EditNum value={currentWeight ?? ex.weight} unit={ex.unit || "kg"} onChange={onChangeWeight} />
        </div>

        {/* SZACOWANE 1RM — wzór Epley, na bazie ciężaru roboczego i docelowych powtórzeń */}
        {oneRM !== null && (
          <div className="fu" style={{ animationDelay: ".075s", display: "flex", alignItems: "center", gap: 12, background: T.card, border: `1px solid ${T.borderSoft}`, borderRadius: 18, padding: "13px 16px", marginBottom: 16 }}>
            <span style={{ width: 40, height: 40, borderRadius: 13, background: T.inset, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <TrendingUp size={18} color={T.soft} strokeWidth={2.2} />
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: "#fff", fontFamily: U }}>Szacowane 1RM</div>
              <div style={{ fontSize: 10.5, color: T.sub, marginTop: 2 }}>maksimum na jedno powtórzenie (wzór Epley)</div>
            </div>
            <span style={{ fontFamily: FONT_NUM, fontWeight: 800, fontSize: "1.2rem", color: T.light }}>{fmtW(oneRM)}</span>
          </div>
        )}

        {/* ZAKŁADKI */}
        <div className="fu" style={{ animationDelay: ".08s", display: "flex", gap: 18, borderBottom: `1px solid ${T.borderSoft}`, marginBottom: 14 }}>
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{ background: "transparent", border: "none", padding: "4px 2px 10px", fontFamily: U, fontWeight: 700, fontSize: 13.5, color: tab === t.id ? "#fff" : T.sub, cursor: "pointer", borderBottom: `2px solid ${tab === t.id ? T.accent : "transparent"}`, marginBottom: -1 }}
            >
              {t.l}
            </button>
          ))}
        </div>

        {/* TREŚĆ ZAKŁADEK */}
        <div key={tab} className="fu">
          {tab === "howto" && (
            <>
              {steps.length > 0 ? (
                steps.map((s, i) => (
                  <div key={i} style={{ display: "flex", gap: 12, marginBottom: 12 }}>
                    <span style={{ width: 24, height: 24, borderRadius: "50%", background: T.accentSoftBg, border: `1px solid ${T.accentSoftBorder}`, color: T.accent, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, fontFamily: FONT_NUM, flexShrink: 0, marginTop: 1 }}>
                      {i + 1}
                    </span>
                    <p style={{ fontSize: 13, color: T.light, lineHeight: 1.6, margin: 0 }}>{s}.</p>
                  </div>
                ))
              ) : (
                <p style={{ fontSize: 13, color: T.soft, lineHeight: 1.6 }}>
                  Trzymaj kontrolę w całym zakresie ruchu — 2 s faza opuszczania, bez szarpania. Pełen zakres, stabilna pozycja, oddech: wydech przy wysiłku.
                </p>
              )}
              {ex.note && (
                <div style={{ marginTop: 6, padding: "10px 13px", background: T.accentSoftBg, border: `1px solid ${T.accentSoftBorder}`, borderRadius: 14, fontSize: 12, color: T.light, lineHeight: 1.5 }}>
                  {ex.note}
                </div>
              )}
              {/* film instruktażowy — wyszukiwanie techniki na YouTube (otwiera przeglądarkę) */}
              <button
                onClick={() => window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(`${ex.name.split("—")[0].trim()} technika jak robić`)}`, "_blank", "noopener")}
                style={{ width: "100%", marginTop: 12, background: "transparent", color: T.light, border: `1.5px solid ${T.border}`, borderRadius: 99, fontFamily: U, fontWeight: 700, fontSize: 13, padding: "12px 18px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
              >
                <Youtube size={16} color={T.accent} strokeWidth={2.2} />
                Film instruktażowy (YouTube)
              </button>
            </>
          )}

          {tab === "history" && (
            <>
              {history.length === 0 ? (
                <EmptyState icon={TrendingUp} title="Brak zapisów" desc="Zapisz ciężary plusem na dolnym pasku, a historia pojawi się tutaj." />
              ) : (
                [...history].reverse().slice(0, 10).map((h, i, arr) => {
                  const idx = history.findIndex((x) => x.ts === h.ts);
                  const prev = idx > 0 ? history[idx - 1] : null;
                  const d = prev ? Math.round((h.w - prev.w) * 100) / 100 : null;
                  return (
                    <div key={h.ts} style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 2px", borderBottom: i < arr.length - 1 ? `1px solid ${T.borderSoft}` : "none" }}>
                      <span style={{ flex: 1, fontSize: 12.5, color: T.light }}>{h.dateShort}</span>
                      <span style={{ fontFamily: FONT_NUM, fontWeight: 800, fontSize: 15, color: "#fff" }}>{fmtW(h.w)}</span>
                      {d !== null && d !== 0 ? (
                        <span style={{ fontSize: 11, fontWeight: 800, color: d > 0 ? T.ok : T.danger, minWidth: 40, textAlign: "right" }}>
                          {d > 0 ? "+" : ""}
                          {String(d).replace(".", ",")}
                        </span>
                      ) : (
                        <span style={{ minWidth: 40, textAlign: "right", fontSize: 10, color: T.faint }}>{d === 0 ? "=" : "start"}</span>
                      )}
                    </div>
                  );
                })
              )}
            </>
          )}

          {tab === "records" && (
            <div style={{ display: "flex", gap: 10 }}>
              {[
                { l: "Rekord", v: maxW !== null ? fmtW(maxW) : "—" },
                { l: "Aktualnie", v: fmtW(currentWeight ?? ex.weight) },
                { l: "Przyrost", v: history.length >= 2 ? `${gain > 0 ? "+" : ""}${String(gain).replace(".", ",")} kg` : "—" },
              ].map((r) => (
                <div key={r.l} style={{ flex: 1, background: T.card, border: `1px solid ${T.borderSoft}`, borderRadius: 16, padding: "14px 10px", textAlign: "center" }}>
                  <div style={{ fontFamily: FONT_NUM, fontWeight: 800, fontSize: "1.05rem", color: T.accent }}>{r.v}</div>
                  <div style={{ fontSize: 10, color: T.sub, fontWeight: 600, marginTop: 5 }}>{r.l}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* PROGRES — OSTATNIE SESJE */}
        <div className="fu" style={{ animationDelay: ".12s", marginTop: 22 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 10.5, fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: T.soft, marginBottom: 12 }}>
            <TrendingUp size={13} color={T.accent} strokeWidth={2.4} />
            Twój progres · {last7.length === 0 ? "ostatnie sesje" : last7.length === 1 ? "ostatnia sesja" : `ostatnie ${last7.length} sesje`}
          </div>
          <div style={{ background: T.card, border: `1px solid ${T.borderSoft}`, borderRadius: 18, padding: "16px 14px 12px" }}>
            {last7.length === 0 ? (
              <p style={{ fontSize: 12, color: T.sub, textAlign: "center", margin: "8px 0" }}>Wykres pojawi się po pierwszych zapisach ciężaru.</p>
            ) : (
              <div style={{ display: "flex", gap: 10, alignItems: "flex-end", height: 92 }}>
                {last7.map((h, i) => (
                  <div key={h.ts} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6, height: "100%" }}>
                    <div style={{ flex: 1, width: "100%", maxWidth: 22, display: "flex", alignItems: "flex-end" }}>
                      <div style={{ width: "100%", height: `${Math.max((h.w / chartMax) * 100, 8)}%`, borderRadius: 6, background: i === last7.length - 1 ? T.accent : T.track }} />
                    </div>
                    <span style={{ fontSize: 8.5, fontWeight: 700, color: i === last7.length - 1 ? T.accent : T.faint, fontFamily: FONT_NUM }}>S{i + 1}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
