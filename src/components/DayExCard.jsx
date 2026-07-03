import { useState } from "react";
import { ChevronDown, Timer } from "lucide-react";
import { T } from "../theme.js";
import { formatRest } from "../lib/utils.js";
import { EditNum, EditStr } from "./Editable.jsx";
import { SetCounter } from "./SetCounter.jsx";
import { RestDisplay } from "./RestDisplay.jsx";

export function DayExCard({ ex, idx, onUpdate }) {
  const [expanded, setExpanded] = useState(false);
  const [doneCount, setDoneCount] = useState(0);
  const [timer, setTimer] = useState(false);
  const allDone = doneCount >= ex.sets;
  const handleSetDone = (i) => {
    if (i < doneCount) setDoneCount(i);
    else if (i === doneCount) setDoneCount(i + 1);
  };
  return (
    <>
      <div
        className="fu"
        style={{
          animationDelay: `${idx * 0.05}s`,
          background: allDone ? "rgba(52,211,153,0.05)" : T.card,
          border: `1px solid ${T.borderSoft}`,
          borderLeft: `3px solid ${allDone ? T.ok : ex.catColor}`,
          borderRadius: 18,
          padding: "12px 14px",
          marginBottom: 8,
          transition: "all 0.25s",
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: T.faint, marginBottom: 3 }}>
              {idx + 1} · {ex.cat}
            </div>
            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 8, lineHeight: 1.3, cursor: "pointer" }} onClick={() => setExpanded(!expanded)}>
              {ex.name}
              <ChevronDown size={14} color={T.faint} strokeWidth={2.5} style={{ marginLeft: 5, verticalAlign: "-2px", transition: "transform .25s", transform: expanded ? "rotate(180deg)" : "none" }} />
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
              <div style={{ background: T.inset, borderRadius: 10, padding: "7px 14px", fontSize: 15, color: T.light, display: "flex", alignItems: "center", gap: 6, fontWeight: 600 }}>
                <EditNum value={ex.sets} unit="" onChange={(v) => onUpdate({ ...ex, sets: Math.round(v) })} />
                <span style={{ color: T.faint }}>×</span>
                <EditStr value={ex.reps} onChange={(v) => onUpdate({ ...ex, reps: v })} />
              </div>
              {ex.weight > 0 && (
                <div style={{ background: T.accentSoftBg, border: `1px solid ${T.accentSoftBorder}`, borderRadius: 10, padding: "7px 14px", display: "flex", alignItems: "center", gap: 6, fontSize: 15, fontWeight: 700 }}>
                  🏋️ <EditNum value={ex.weight} unit={ex.unit} onChange={(v) => onUpdate({ ...ex, weight: v })} />
                </div>
              )}
              <button
                onClick={() => setTimer(true)}
                style={{ background: "rgba(74,158,255,0.12)", border: "1px solid rgba(74,158,255,0.3)", borderRadius: 10, padding: "7px 12px", fontSize: 14, color: T.blue, cursor: "pointer", fontFamily: "inherit", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 5 }}
              >
                <Timer size={15} strokeWidth={2.4} />
                {formatRest(ex.rest)}
              </button>
            </div>
          </div>
          <div
            onClick={() => setDoneCount(allDone ? 0 : ex.sets)}
            title="Zaznacz/odznacz całe ćwiczenie"
            style={{
              width: 44,
              height: 44,
              borderRadius: 14,
              flexShrink: 0,
              cursor: "pointer",
              background: allDone ? T.ok : doneCount > 0 ? `${ex.catColor}30` : T.inset,
              border: `2px solid ${allDone ? T.ok : doneCount > 0 ? ex.catColor : T.border}`,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 11,
              fontWeight: 800,
              color: allDone ? "#000" : doneCount > 0 ? ex.catColor : T.faint,
              transition: "all 0.25s cubic-bezier(.22,1,.36,1)",
              transform: allDone ? "scale(1.06)" : "scale(1)",
            }}
          >
            {allDone ? (
              "✓"
            ) : doneCount > 0 ? (
              <>
                <span style={{ fontSize: 15 }}>{doneCount}</span>
                <span style={{ fontSize: 9, opacity: 0.8 }}>/{ex.sets}</span>
              </>
            ) : (
              <span style={{ fontSize: 10, opacity: 0.6 }}>0/{ex.sets}</span>
            )}
          </div>
        </div>
        {expanded && (
          <div className="fu" style={{ marginTop: 10, borderTop: `1px solid ${T.borderSoft}`, paddingTop: 10 }}>
            {ex.note ? (
              <div style={{ fontSize: 11, color: "#ff9966", marginBottom: 8, padding: "5px 9px", background: "rgba(255,107,53,0.07)", borderRadius: 8 }}>⚠️ {ex.note}</div>
            ) : null}
            {ex.tech ? (
              <div style={{ marginBottom: 10, padding: "9px 11px", background: "rgba(74,158,255,0.06)", border: "1px solid rgba(74,158,255,0.18)", borderRadius: 10 }}>
                <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: T.blue, marginBottom: 4 }}>📖 Technika</div>
                <div style={{ fontSize: 12, color: "#aab4c8", lineHeight: 1.6 }}>{ex.tech}</div>
              </div>
            ) : null}
            <SetCounter total={ex.sets} done={doneCount} onSetDone={handleSetDone} />
          </div>
        )}
      </div>
      {timer && <RestDisplay seconds={ex.rest} onClose={() => setTimer(false)} onUpdate={(v) => onUpdate({ ...ex, rest: v })} />}
    </>
  );
}
