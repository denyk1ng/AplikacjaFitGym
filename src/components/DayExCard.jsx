import { useState } from "react";
import { ChevronDown, Timer, Dumbbell, Grip, ArrowUpFromLine, BicepsFlexed, Footprints, Activity, BookOpen, Info, Check, RotateCcw } from "lucide-react";
import { T } from "../theme.js";
import { formatRest } from "../lib/utils.js";
import { EX_THUMB } from "../data/exerciseThumbs.js";
import { EditNum, EditStr } from "./Editable.jsx";
import { SetCounter } from "./SetCounter.jsx";
import { RestDisplay } from "./RestDisplay.jsx";

// ikona partii mięśniowej (lucide, spójnie z resztą aplikacji)
const CAT_ICON = {
  KLATKA: Dumbbell,
  PLECY: Grip,
  BARKI: ArrowUpFromLine,
  BICEPS: BicepsFlexed,
  TRICEPS: BicepsFlexed,
  NOGI: Footprints,
  BRZUCH: Activity,
};

const chip = {
  display: "inline-flex",
  alignItems: "center",
  gap: 5,
  borderRadius: 11,
  padding: "7px 12px",
  fontSize: 13.5,
  fontWeight: 600,
};

export function DayExCard({ ex, idx, onUpdate }) {
  const [expanded, setExpanded] = useState(false);
  const [doneCount, setDoneCount] = useState(0);
  const [timer, setTimer] = useState(false);
  const allDone = doneCount >= ex.sets;
  const CatIcon = CAT_ICON[ex.cat] || Dumbbell;

  const handleSetDone = (i) => {
    if (i < doneCount) setDoneCount(i);
    else if (i === doneCount) {
      setDoneCount(i + 1);
      // po zaliczonej serii (poza ostatnią) od razu startuje przerwa
      if (i + 1 < ex.sets) setTimer(true);
    }
  };

  return (
    <>
      <div
        className="fu"
        style={{
          animationDelay: `${idx * 0.04}s`,
          background: allDone ? "rgba(52,211,153,0.06)" : T.card,
          border: `1px solid ${allDone ? "rgba(52,211,153,0.25)" : T.borderSoft}`,
          borderRadius: 20,
          padding: "14px",
          marginBottom: 10,
          transition: "all 0.25s",
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
          {EX_THUMB[ex.id] ? (
            <img src={EX_THUMB[ex.id]} alt="" style={{ width: 44, height: 44, borderRadius: 13, objectFit: "cover", flexShrink: 0, marginTop: 1 }} />
          ) : (
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 13,
                flexShrink: 0,
                background: `${ex.catColor}16`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginTop: 1,
              }}
            >
              <CatIcon size={18} color={ex.catColor} strokeWidth={2.2} />
            </div>
          )}

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: T.faint, marginBottom: 3 }}>
              {ex.cat}
            </div>
            <div
              style={{ fontWeight: 600, fontSize: 14.5, marginBottom: 10, lineHeight: 1.3, cursor: "pointer", color: "#fff" }}
              onClick={() => setExpanded(!expanded)}
            >
              {ex.name}
              <ChevronDown
                size={14}
                color={T.faint}
                strokeWidth={2.5}
                style={{ marginLeft: 5, verticalAlign: "-2px", transition: "transform .25s", transform: expanded ? "rotate(180deg)" : "none" }}
              />
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 7, alignItems: "center" }}>
              <div style={{ ...chip, background: T.inset, color: T.light }}>
                <EditNum value={ex.sets} unit="" onChange={(v) => onUpdate({ ...ex, sets: Math.round(v) })} />
                <span style={{ color: T.faint, fontSize: 12 }}>×</span>
                <EditStr value={ex.reps} onChange={(v) => onUpdate({ ...ex, reps: v })} />
              </div>
              {ex.weight > 0 && (
                <div style={{ ...chip, background: T.accentSoftBg, fontWeight: 700 }}>
                  <EditNum value={ex.weight} unit={ex.unit} onChange={(v) => onUpdate({ ...ex, weight: v })} />
                </div>
              )}
              <button
                onClick={() => setTimer(true)}
                style={{ ...chip, background: "rgba(37,99,235,0.1)", border: "none", color: T.blue, cursor: "pointer", fontWeight: 700, fontSize: 13 }}
              >
                <Timer size={14} strokeWidth={2.4} />
                {formatRest(ex.rest)}
              </button>
            </div>
          </div>

          <div
            onClick={() => setDoneCount(allDone ? 0 : ex.sets)}
            title="Zaznacz/odznacz całe ćwiczenie"
            style={{
              width: 42,
              height: 42,
              borderRadius: 14,
              flexShrink: 0,
              cursor: "pointer",
              background: allDone ? T.ok : doneCount > 0 ? `${ex.catColor}22` : T.inset,
              border: allDone ? "none" : `1.5px solid ${doneCount > 0 ? ex.catColor : T.border}`,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 11,
              fontWeight: 700,
              color: allDone ? "#000" : doneCount > 0 ? ex.catColor : T.faint,
              transition: "all 0.25s cubic-bezier(.22,1,.36,1)",
            }}
          >
            {allDone ? (
              <Check size={20} strokeWidth={3} />
            ) : doneCount > 0 ? (
              <>
                <span style={{ fontSize: 14, fontFamily: "'Urbanist',sans-serif" }}>{doneCount}</span>
                <span style={{ fontSize: 8.5, opacity: 0.75 }}>/{ex.sets}</span>
              </>
            ) : (
              <span style={{ fontSize: 10.5, fontFamily: "'Urbanist',sans-serif", opacity: 0.7 }}>
                0/{ex.sets}
              </span>
            )}
          </div>
        </div>

        {expanded && (
          <div className="fu" style={{ marginTop: 12, borderTop: `1px solid ${T.borderSoft}`, paddingTop: 12 }}>
            {ex.note ? (
              <div style={{ display: "flex", gap: 8, alignItems: "flex-start", fontSize: 12, color: "#ffa580", marginBottom: 10, padding: "8px 11px", background: "rgba(255,107,53,0.07)", borderRadius: 12, lineHeight: 1.5 }}>
                <Info size={14} strokeWidth={2.3} style={{ flexShrink: 0, marginTop: 1.5 }} />
                {ex.note}
              </div>
            ) : null}
            {ex.tech ? (
              <div style={{ marginBottom: 12, padding: "10px 12px", background: "rgba(37,99,235,0.06)", borderRadius: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: T.blue, marginBottom: 5 }}>
                  <BookOpen size={13} strokeWidth={2.3} />
                  Technika
                </div>
                <div style={{ fontSize: 12.5, color: "#aab4c8", lineHeight: 1.6 }}>{ex.tech}</div>
              </div>
            ) : null}
            <SetCounter total={ex.sets} done={doneCount} onSetDone={handleSetDone} />
            <button
              onClick={() => setDoneCount(allDone ? 0 : ex.sets)}
              style={{
                marginTop: 12,
                width: "100%",
                background: allDone ? T.inset : T.accent,
                color: allDone ? T.soft : "#000",
                border: "none",
                borderRadius: 99,
                fontFamily: "'Urbanist',sans-serif",
                fontWeight: 700,
                fontSize: 13,
                padding: "13px 20px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 7,
              }}
            >
              {allDone ? (
                <>
                  <RotateCcw size={15} strokeWidth={2.4} /> Wyzeruj ćwiczenie
                </>
              ) : (
                <>
                  <Check size={15} strokeWidth={2.8} /> Zalicz całe ćwiczenie
                </>
              )}
            </button>
          </div>
        )}
      </div>
      {timer && <RestDisplay key={doneCount} seconds={ex.rest} onClose={() => setTimer(false)} onUpdate={(v) => onUpdate({ ...ex, rest: v })} />}
    </>
  );
}
