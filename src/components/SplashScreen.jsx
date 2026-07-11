import { useEffect, useState } from "react";
import { AnimatedLogo } from "./Logo.jsx";

// Splash: znak ładuje się tak jak przy budowaniu planu (logofill),
// pod spodem dopisuje się nazwa aplikacji, potem krótki fade-out.
// `quick` = kolejne otwarcie tego samego dnia — skrócony przebieg (~0,8 s),
// żeby częste zaglądanie do appki nie zderzało się z pełną animacją
export function SplashScreen({ onDone, quick = false }) {
  const [leaving, setLeaving] = useState(false);
  useEffect(() => {
    const t1 = setTimeout(() => setLeaving(true), quick ? 450 : 1700);
    const t2 = setTimeout(onDone, quick ? 800 : 2150);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [onDone, quick]);
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
