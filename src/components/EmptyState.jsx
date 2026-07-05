import { T } from "../theme.js";

const U = "'Urbanist',sans-serif";

// wspólny pusty stan (ikona w kafelku + tytuł + opis) — `nested` zmniejsza
// rozmiar i używa tła `T.inset`, gdy stan renderuje się wewnątrz istniejącej
// karty (T.card), żeby uniknąć karty-w-karcie tego samego koloru
export function EmptyState({ icon: Icon, title, desc, nested = false }) {
  return (
    <div className="fu" style={{ textAlign: "center", padding: nested ? "22px 10px" : "40px 20px" }}>
      <div
        style={{
          width: nested ? 52 : 68,
          height: nested ? 52 : 68,
          borderRadius: nested ? 16 : 22,
          background: nested ? T.inset : T.card,
          border: `1px solid ${T.borderSoft}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto 14px",
        }}
      >
        <Icon size={nested ? 22 : 30} color={T.accent} strokeWidth={2} />
      </div>
      {title && <div style={{ fontFamily: U, fontWeight: 800, fontSize: nested ? "0.92rem" : "1.05rem", marginBottom: 7 }}>{title}</div>}
      {desc && <div style={{ fontSize: nested ? 12 : 13, color: T.sub, lineHeight: 1.6 }}>{desc}</div>}
    </div>
  );
}
