import { T } from "../theme.js";
import { PHOTOS } from "../data/photos.js";

export function Onboarding({ onDone }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 2000, overflow: "hidden", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", padding: "32px 28px 56px", textAlign: "center" }}>
      <img src={PHOTOS.hero} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
      <div style={{ position: "absolute", inset: 0, background: `linear-gradient(180deg, rgba(13,17,8,0.35) 0%, rgba(13,17,8,0.72) 45%, ${T.bg} 92%)` }} />

      <div style={{ position: "relative" }}>
        <div className="pop" style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: "3.4rem", letterSpacing: "-0.03em", color: "#fff" }}>
          FOR<span style={{ color: T.accent }}>MA</span>
        </div>
        <div className="fu" style={{ animationDelay: ".3s", marginTop: 16, fontSize: 15, color: "rgba(255,255,255,0.82)", lineHeight: 1.75, maxWidth: 300 }}>
          „Formy fizycznej nie zdobędziesz życzeniem ani zakupem. Zdobywa się ją treningiem."
        </div>
        <div className="fu" style={{ animationDelay: ".5s", marginTop: 10, fontSize: 11, color: "rgba(255,255,255,0.45)", letterSpacing: ".1em", textTransform: "uppercase", fontWeight: 700 }}>
          Twój plan · Twoje zasady
        </div>
        <button
          onClick={onDone}
          className="fu"
          style={{ animationDelay: ".7s", marginTop: 32, width: "100%", maxWidth: 320, background: T.accent, color: "#000", border: "none", borderRadius: 99, fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 16, padding: "17px 44px", cursor: "pointer", boxShadow: T.accentGlow }}
        >
          Zaczynamy →
        </button>
      </div>
    </div>
  );
}
