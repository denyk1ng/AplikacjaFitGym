import { useEffect, useState } from "react";
import { T } from "../theme.js";

export function Ring({ pct, size, stroke, color, children }) {
  const S = size || 86;
  const W = stroke || 8;
  const r = (S - W) / 2;
  const c = 2 * Math.PI * r;
  const [off, setOff] = useState(c);
  useEffect(() => {
    const t = setTimeout(() => setOff(c * (1 - Math.min(Math.max(pct, 0), 1))), 150);
    return () => clearTimeout(t);
  }, [pct, c]);
  return (
    <div style={{ position: "relative", width: S, height: S, flexShrink: 0 }}>
      <svg width={S} height={S} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={S / 2} cy={S / 2} r={r} stroke={T.track} strokeWidth={W} fill="none" />
        <circle
          cx={S / 2}
          cy={S / 2}
          r={r}
          stroke={color || T.accent}
          strokeWidth={W}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={off}
          style={{ transition: "stroke-dashoffset 1.3s cubic-bezier(.22,1,.36,1)" }}
        />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        {children}
      </div>
    </div>
  );
}
