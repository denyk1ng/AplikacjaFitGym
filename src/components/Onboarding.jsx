import { T } from "../theme.js";

export function Onboarding({ onDone }) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 2000,
        background: `radial-gradient(circle at 50% 30%, rgba(198,244,50,0.10), ${T.bg} 60%)`,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "32px 28px",
        textAlign: "center",
      }}
    >
      <div className="pop" style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: "3.4rem", letterSpacing: "-0.03em" }}>
        FOR<span style={{ color: T.accent }}>MA</span>
      </div>
      <div className="fu" style={{ animationDelay: ".3s", marginTop: 18, fontSize: 15, color: T.soft, lineHeight: 1.75, maxWidth: 300 }}>
        „Formy fizycznej nie zdobędziesz życzeniem ani zakupem. Zdobywa się ją treningiem."
      </div>
      <div className="fu" style={{ animationDelay: ".5s", marginTop: 10, fontSize: 11, color: T.faint, letterSpacing: ".1em", textTransform: "uppercase", fontWeight: 700 }}>
        Twój plan · Twoje zasady
      </div>
      <button
        onClick={onDone}
        className="fu"
        style={{ animationDelay: ".7s", marginTop: 36, background: T.accent, color: "#000", border: "none", borderRadius: 99, fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 15, padding: "16px 44px", cursor: "pointer", boxShadow: T.accentGlow }}
      >
        Zaczynamy →
      </button>
    </div>
  );
}
