import { useEffect, useState } from "react";
import { LogoMark } from "./Logo.jsx";

// Splash: czysta czerń + wyśrodkowany znak (wg wzorca), krótki pop i fade-out
export function SplashScreen({ onDone }) {
  const [leaving, setLeaving] = useState(false);
  useEffect(() => {
    const t1 = setTimeout(() => setLeaving(true), 1400);
    const t2 = setTimeout(onDone, 1850);
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
        background: "#060910",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        opacity: leaving ? 0 : 1,
        transition: "opacity .45s ease",
      }}
    >
      <div className="pop">
        <LogoMark size={92} />
      </div>
    </div>
  );
}
