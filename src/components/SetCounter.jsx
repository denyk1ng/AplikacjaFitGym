import { T } from "../theme.js";

export function SetCounter({ total, done, onSetDone }) {
  return (
    <div style={{ marginTop: 10 }}>
      <div style={{ fontSize: 10, color: T.sub, marginBottom: 6, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>
        Serie — kliknij gdy zaliczysz
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {Array.from({ length: total }).map((_, i) => {
          const isDone = i < done;
          return (
            <button
              key={i}
              onClick={() => onSetDone(i)}
              style={{
                width: 46,
                height: 46,
                borderRadius: 14,
                background: isDone ? T.ok : T.inset,
                border: `2px solid ${isDone ? T.ok : T.border}`,
                color: isDone ? "#000" : T.faint,
                fontSize: 15,
                fontWeight: 800,
                cursor: "pointer",
                fontFamily: "inherit",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.25s cubic-bezier(.22,1,.36,1)",
                transform: isDone ? "scale(1.02)" : "scale(1)",
              }}
            >
              {isDone ? "✓" : i + 1}
            </button>
          );
        })}
      </div>
      <div style={{ marginTop: 6, fontSize: 12, color: T.sub }}>
        {done === 0 ? (
          "Jeszcze nie zaczęto"
        ) : done === total ? (
          <span style={{ color: T.ok, fontWeight: 700 }}>✓ Wszystkie serie ukończone!</span>
        ) : (
          `${done} / ${total} serii`
        )}
      </div>
    </div>
  );
}
