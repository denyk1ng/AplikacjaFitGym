import { useEffect, useState } from "react";
import { AnimatedLogo } from "./Logo.jsx";

// Splash: znak ładuje się tak jak przy budowaniu planu (logofill),
// pod spodem dopisuje się nazwa aplikacji, potem krótki fade-out
export function SplashScreen({ onDone }) {
  const [leaving, setLeaving] = useState(false);
  useEffect(() => {
    const t1 = setTimeout(() => setLeaving(true), 1700);
    const t2 = setTimeout(onDone, 2150);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [onDone]);
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 3000,
        background: "#171717",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 20,
        opacity: leaving ? 0 : 1,
        transition: "opacity .45s ease",
      }}
    >
      <AnimatedLogo size={96} />
      <div
        className="fu"
        style={{
          animationDelay: ".4s",
          fontFamily: "'Urbanist',sans-serif",
          fontWeight: 800,
          fontSize: "1.55rem",
          letterSpacing: ".13em",
          color: "#fff",
        }}
      >
        FOR<span style={{ color: "#bcff31" }}>MA</span>
      </div>
    </div>
  );
}
