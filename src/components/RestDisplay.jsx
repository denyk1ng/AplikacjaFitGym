import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X, Pause, Play, RotateCcw, Plus, Minus } from "lucide-react";
import { T } from "../theme.js";
import { playBeep } from "../lib/sound.js";

function fmt(s) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return m > 0 ? `${m}:${sec.toString().padStart(2, "0")}` : `${s}`;
}

// Odliczający timer przerwy. `seconds` to domyślny czas przerwy ćwiczenia;
// onUpdate zapisuje nowy domyślny czas w planie.
export function RestDisplay({ seconds, onClose, onUpdate }) {
  const [target, setTarget] = useState(seconds);
  const [remaining, setRemaining] = useState(seconds);
  const [running, setRunning] = useState(true);
  const [finished, setFinished] = useState(false);
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(String(seconds));
  const endRef = useRef(Date.now() + seconds * 1000);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!running || finished) return;
    const tick = setInterval(() => {
      const rem = Math.max(0, Math.ceil((endRef.current - Date.now()) / 1000));
      setRemaining(rem);
      if (rem <= 0) {
        setFinished(true);
        setRunning(false);
        playBeep();
      }
    }, 200);
    return () => clearInterval(tick);
  }, [running, finished]);

  useEffect(() => {
    if (editing && inputRef.current) inputRef.current.focus();
  }, [editing]);

  const pause = () => {
    setRemaining(Math.max(0, Math.ceil((endRef.current - Date.now()) / 1000)));
    setRunning(false);
  };
  const resume = () => {
    endRef.current = Date.now() + remaining * 1000;
    setRunning(true);
  };
  const addTime = (d) => {
    const next = Math.max(5, remaining + d);
    setRemaining(next);
    endRef.current = Date.now() + next * 1000;
    if (finished) setFinished(false);
    if (!running) return;
  };
  const reset = () => {
    setFinished(false);
    setRemaining(target);
    endRef.current = Date.now() + target * 1000;
    setRunning(true);
  };
  const commitEdit = () => {
    setEditing(false);
    const n = parseInt(val);
    if (!isNaN(n) && n > 0) {
      setTarget(n);
      setRemaining(n);
      endRef.current = Date.now() + n * 1000;
      setFinished(false);
      setRunning(true);
      if (n !== seconds) onUpdate(n);
    } else setVal(String(target));
  };

  const pct = target > 0 ? remaining / target : 0;
  const color = finished ? T.ok : remaining <= 10 ? T.orange : T.blue;

  const roundBtn = {
    background: T.inset,
    color: T.light,
    border: `1px solid ${T.border}`,
    borderRadius: 99,
    fontSize: 12,
    fontWeight: 700,
    padding: "10px 14px",
    cursor: "pointer",
    fontFamily: "inherit",
    display: "inline-flex",
    alignItems: "center",
    gap: 5,
  };

  // portal do <body> — inaczej fixed panel wpada w stacking context animowanych kart
  return createPortal(
    <div
      className="slideup"
      style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 1500, background: T.card2, borderTop: `2px solid ${finished ? T.ok : T.border}`, padding: "16px 20px 30px", boxShadow: "0 -8px 40px rgba(0,0,0,0.95)", transition: "border-color .3s" }}
    >
      {/* pasek postępu */}
      <div style={{ position: "absolute", top: -2, left: 0, right: 0, height: 3, background: "transparent" }}>
        <div style={{ height: "100%", width: `${pct * 100}%`, background: color, transition: "width .25s linear, background .3s" }} />
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, color: T.sub, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 4 }}>
            {finished ? "Koniec przerwy!" : "Przerwa"}
          </div>

          {editing ? (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input
                ref={inputRef}
                value={val}
                onChange={(e) => setVal(e.target.value)}
                onBlur={commitEdit}
                onKeyDown={(e) => {
                  if (e.key === "Enter") commitEdit();
                  if (e.key === "Escape") {
                    setEditing(false);
                    setVal(String(target));
                  }
                }}
                style={{ background: T.inset, border: `1px solid ${T.accent}`, borderRadius: 10, color: T.accent, padding: "6px 10px", fontSize: "2rem", fontWeight: 800, width: 110, fontFamily: "'Space Grotesk',sans-serif", outline: "none", textAlign: "center" }}
              />
              <span style={{ fontSize: 13, color: T.sub }}>sekund</span>
            </div>
          ) : (
            <div
              onClick={() => {
                setVal(String(target));
                setEditing(true);
              }}
              style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 800, fontSize: "3.6rem", lineHeight: 1, color, cursor: "pointer", transition: "color .3s" }}
              title="Kliknij aby ustawić inny czas"
            >
              {finished ? "💪" : fmt(remaining)}
            </div>
          )}

          <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
            {finished ? (
              <button onClick={reset} style={{ ...roundBtn, background: T.accent, color: "#000", border: "none", fontWeight: 800 }}>
                <RotateCcw size={14} strokeWidth={2.6} /> Jeszcze raz
              </button>
            ) : (
              <>
                <button onClick={() => addTime(-15)} style={roundBtn}>
                  <Minus size={14} strokeWidth={2.6} /> 15s
                </button>
                <button onClick={() => addTime(15)} style={roundBtn}>
                  <Plus size={14} strokeWidth={2.6} /> 15s
                </button>
                {running ? (
                  <button onClick={pause} style={roundBtn}>
                    <Pause size={14} strokeWidth={2.6} /> Pauza
                  </button>
                ) : (
                  <button onClick={resume} style={{ ...roundBtn, background: T.accent, color: "#000", border: "none", fontWeight: 800 }}>
                    <Play size={14} strokeWidth={2.6} /> Wznów
                  </button>
                )}
                <button onClick={reset} style={roundBtn}>
                  <RotateCcw size={14} strokeWidth={2.6} />
                </button>
              </>
            )}
          </div>
          <div style={{ fontSize: 10.5, color: T.faint, marginTop: 8 }}>kliknij liczbę żeby ustawić domyślny czas przerwy</div>
        </div>

        <button
          onClick={onClose}
          style={{ background: T.card, color: T.soft, border: `1px solid ${T.border}`, borderRadius: 14, fontSize: 13, fontWeight: 600, padding: "12px 16px", cursor: "pointer", fontFamily: "inherit", display: "inline-flex", alignItems: "center", gap: 6, flexShrink: 0 }}
        >
          <X size={16} strokeWidth={2.4} />
          Zamknij
        </button>
      </div>
    </div>,
    document.body
  );
}
