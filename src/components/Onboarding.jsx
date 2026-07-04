import { LogoMark } from "./Logo.jsx";
import { T } from "../theme.js";
import { PHOTOS } from "../data/photos.js";

// Welcome screen 1:1 wg referencji: przyciemnione zdjęcie, centrowany znak,
// "Witaj w..." + podtytuł, szeroki limonkowy przycisk, drobny tekst pod spodem
export function Onboarding({ onDone }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 2000, overflow: "hidden", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "32px 28px", textAlign: "center" }}>
      <img src={PHOTOS.hero} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(6,9,16,0.82) 0%, rgba(6,9,16,0.68) 50%, rgba(6,9,16,0.9) 100%)" }} />

      <div style={{ position: "relative", width: "100%", maxWidth: 330, display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div className="pop" style={{ width: 64, height: 64, borderRadius: 22, background: T.accent, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: T.accentGlow, marginBottom: 26 }}>
          <LogoMark size={38} top="#171717" bottom="#ffffff" />
        </div>

        <div className="fu" style={{ animationDelay: ".2s", fontFamily: "'Urbanist',sans-serif", fontWeight: 700, fontSize: "2.1rem", lineHeight: 1.15, color: "#fff" }}>
          Witaj w<br />
          FOR<span style={{ color: T.accent }}>MA</span>!
        </div>

        <div className="fu" style={{ animationDelay: ".35s", marginTop: 12, fontSize: 14, color: "rgba(255,255,255,0.72)", lineHeight: 1.6 }}>
          Twój osobisty plan treningowy 💪
        </div>

        <button
          onClick={onDone}
          className="fu"
          style={{ animationDelay: ".55s", marginTop: 34, width: "100%", background: T.accent, color: "#000", border: "none", borderRadius: 99, fontFamily: "'Urbanist',sans-serif", fontWeight: 700, fontSize: 15.5, padding: "17px 24px", cursor: "pointer", boxShadow: T.accentGlow }}
        >
          Zaczynamy
        </button>

        <div className="fu" style={{ animationDelay: ".7s", marginTop: 16, fontSize: 12, color: "rgba(255,255,255,0.55)" }}>
          Trenuj mądrze · Jedz dobrze · <span style={{ color: T.accent, fontWeight: 700 }}>Rośnij</span>
        </div>
      </div>
    </div>
  );
}
