import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { T } from "../theme.js";

const H = "'Urbanist',sans-serif";
const D = "'Doto',sans-serif";

// Dolny arkusz z listą ćwiczeń przykładowego mini-treningu ("Na szybko") —
// współdzielony przez ekran Dom i bibliotekę ćwiczeń. Portal na body,
// żeby uciec ze stacking contextu animacji .fu (jak inne arkusze w appce).
export function QuickWorkoutSheet({ workout, onClose }) {
  if (!workout) return null;
  return createPortal(
    <div style={{ position: "fixed", inset: 0, zIndex: 1600 }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(23,23,23,0.7)", backdropFilter: "blur(3px)" }} />
      <div className="slideup" style={{ position: "absolute", left: 0, right: 0, bottom: 0, maxWidth: 430, margin: "0 auto", background: T.card2, borderRadius: "26px 26px 0 0", padding: "20px 20px calc(30px + env(safe-area-inset-bottom))", maxHeight: "78vh", overflowY: "auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
          <span style={{ fontFamily: H, fontWeight: 700, fontSize: "1.15rem", color: "#fff" }}>{workout.title}</span>
          <button onClick={onClose} aria-label="Zamknij" style={{ width: 34, height: 34, borderRadius: 11, background: T.inset, border: "none", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <X size={16} strokeWidth={2.4} />
          </button>
        </div>
        <div style={{ fontSize: 11, color: T.sub, marginBottom: 6 }}>
          {workout.chip} · {workout.meta}
        </div>
        <div style={{ fontSize: 12, color: T.light, lineHeight: 1.55, marginBottom: 12 }}>{workout.desc}</div>
        {workout.items.map((it, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 2px", borderBottom: i < workout.items.length - 1 ? `1px solid ${T.borderSoft}` : "none" }}>
            <span style={{ width: 26, height: 26, borderRadius: "50%", background: T.accentSoftBg, border: `1px solid ${T.accentSoftBorder}`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: D, fontWeight: 800, fontSize: 11, color: T.accent, flexShrink: 0 }}>
              {i + 1}
            </span>
            <span style={{ flex: 1, minWidth: 0, fontSize: 13, fontWeight: 700, color: "#fff", fontFamily: H }}>{it.n}</span>
            <span style={{ fontFamily: D, fontWeight: 800, fontSize: 12.5, color: T.accent, flexShrink: 0 }}>{it.d}</span>
          </div>
        ))}
        <p style={{ fontSize: 10, color: T.faint, textAlign: "center", margin: "14px 0 0" }}>
          Propozycja poza planem A/B/C — zrób we własnym tempie, bez zapisu do dziennika.
        </p>
      </div>
    </div>,
    document.body
  );
}
