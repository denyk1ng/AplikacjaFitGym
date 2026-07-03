import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { T } from "../theme.js";

export function RestDisplay({ seconds, onClose, onUpdate }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(String(seconds));
  const ref = useRef(null);
  useEffect(() => {
    if (editing && ref.current) ref.current.focus();
  }, [editing]);
  const commit = () => {
    setEditing(false);
    const n = parseInt(val);
    if (!isNaN(n) && n > 0 && n !== seconds) onUpdate(n);
    else setVal(String(seconds));
  };
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const display = mins > 0 ? `${mins}:${secs.toString().padStart(2, "0")}` : `${seconds}s`;
  return (
    <div
      className="slideup"
      style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 999, background: T.card2, borderTop: `2px solid ${T.border}`, padding: "16px 24px 32px", boxShadow: "0 -8px 40px rgba(0,0,0,0.95)" }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
        <div>
          <div style={{ fontSize: 11, color: T.sub, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 4 }}>Czas przerwy</div>
          {editing ? (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input
                ref={ref}
                value={val}
                onChange={(e) => setVal(e.target.value)}
                onBlur={commit}
                onKeyDown={(e) => {
                  if (e.key === "Enter") commit();
                  if (e.key === "Escape") {
                    setEditing(false);
                    setVal(String(seconds));
                  }
                }}
                style={{ background: T.inset, border: `1px solid ${T.accent}`, borderRadius: 8, color: T.accent, padding: "6px 10px", fontSize: "2rem", fontWeight: 800, width: 100, fontFamily: "'Syne',sans-serif", outline: "none", textAlign: "center" }}
              />
              <span style={{ fontSize: 13, color: T.sub }}>sekund</span>
            </div>
          ) : (
            <div
              onClick={() => setEditing(true)}
              style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: "3.5rem", lineHeight: 1, color: T.blue, cursor: "pointer", borderBottom: `2px dashed ${T.border}` }}
              title="Kliknij aby zmienić"
            >
              {display}
            </div>
          )}
          <div style={{ fontSize: 11, color: T.faint, marginTop: 4 }}>kliknij liczbę żeby zmienić czas</div>
        </div>
        <button
          onClick={onClose}
          style={{ background: T.card, color: T.soft, border: `1px solid ${T.border}`, borderRadius: 12, fontSize: 13, fontWeight: 600, padding: "12px 18px", cursor: "pointer", fontFamily: "inherit", display: "inline-flex", alignItems: "center", gap: 6 }}
        >
          <X size={16} strokeWidth={2.4} />
          Zamknij
        </button>
      </div>
    </div>
  );
}
