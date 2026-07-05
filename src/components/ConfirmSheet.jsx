import { createPortal } from "react-dom";
import { T } from "../theme.js";

const U = "'Urbanist',sans-serif";

// Dolny arkusz potwierdzenia (wzór: logout sheet z referencji).
// Portal do <body> — nie podlega stacking contextom animowanych rodziców.
export function ConfirmSheet({ open, onClose, icon: Icon, tone = "danger", title, desc, confirmLabel, onConfirm, cancelLabel = "Wróć", single = false }) {
  if (!open) return null;
  const toneBg = tone === "danger" ? "rgba(244,63,94,0.15)" : T.accentSoftBg;
  const toneColor = tone === "danger" ? T.danger : T.accent;
  return createPortal(
    <div style={{ position: "fixed", inset: 0, zIndex: 1600 }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(23,23,23,0.7)", backdropFilter: "blur(3px)" }} />
      <div className="slideup" style={{ position: "absolute", left: 0, right: 0, bottom: 0, maxWidth: 680, margin: "0 auto", background: T.card2, borderRadius: "26px 26px 0 0", padding: "26px 22px calc(34px + env(safe-area-inset-bottom))", textAlign: "center" }}>
        <div style={{ width: 54, height: 54, borderRadius: "50%", background: toneBg, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
          <Icon size={22} color={toneColor} strokeWidth={2.2} />
        </div>
        <div style={{ fontFamily: U, fontWeight: 700, fontSize: "1.2rem", color: "#fff", marginTop: 12 }}>{title}</div>
        <div style={{ fontSize: 12, color: T.sub, marginTop: 5, lineHeight: 1.6, whiteSpace: "pre-line", textAlign: single ? "left" : "center" }}>{desc}</div>
        <button
          onClick={onConfirm}
          style={{ width: "100%", marginTop: 20, background: T.accent, color: "#000", border: "none", borderRadius: 99, fontFamily: U, fontWeight: 700, fontSize: 14.5, padding: "15px 20px", cursor: "pointer" }}
        >
          {confirmLabel}
        </button>
        {!single && (
          <button
            onClick={onClose}
            style={{ width: "100%", marginTop: 10, background: T.inset, color: T.light, border: "none", borderRadius: 99, fontFamily: U, fontWeight: 700, fontSize: 14, padding: "14px 20px", cursor: "pointer" }}
          >
            {cancelLabel}
          </button>
        )}
      </div>
    </div>,
    document.body
  );
}
