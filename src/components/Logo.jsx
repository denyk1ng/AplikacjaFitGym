import { useId } from "react";

// Znak FORMA — pochylone F z ukośnym cięciem w negatywie, dwukolorowe:
// część nad cięciem `top` (domyślnie pomarańcz), pod cięciem `bottom` (biel).
// Geometria wybrana przez właściciela (wariant 2D bez kropki, wersja A).
const P = {
  leg: "30,12 48,12 30,88 12,88",
  armTop: "48,12 84,12 78,27 44,27",
  armMid: "38,44 72,44 66,59 34,59",
  clipUp: "-5,-5 105,-5 105,46 -5,64",
  clipDown: "-5,70 105,52 105,105 -5,105",
};

export function LogoMark({ size = 32, top = "#ff4d00", bottom = "#ffffff", style }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" style={style} aria-label="FORMA">
      <defs>
        <clipPath id={`u${id}`}>
          <polygon points={P.clipUp} />
        </clipPath>
        <clipPath id={`d${id}`}>
          <polygon points={P.clipDown} />
        </clipPath>
      </defs>
      <g clipPath={`url(#u${id})`} fill={top}>
        <polygon points={P.leg} />
        <polygon points={P.armTop} />
        <polygon points={P.armMid} />
      </g>
      <g clipPath={`url(#d${id})`} fill={bottom}>
        <polygon points={P.leg} />
        <polygon points={P.armTop} />
        <polygon points={P.armMid} />
      </g>
    </svg>
  );
}

// Lockup: znak + napis FORMA
export function LogoLockup({ markSize = 22, fontSize = 15, gap = 8, style }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap, ...style }}>
      <LogoMark size={markSize} />
      <span style={{ fontFamily: "'Urbanist',sans-serif", fontWeight: 800, fontSize, letterSpacing: ".06em", color: "#fff", lineHeight: 1 }}>
        FOR<span style={{ color: "#ff4d00" }}>MA</span>
      </span>
    </span>
  );
}
