import { useId } from "react";

// Cieniowana ilustracja Apple Watch (SVG, bez zewnętrznych obrazków) —
// koperta w gradiencie niebieskim (T.blue) dla efektu 3D, ciemny ekran
// z minireplikacją pierścienia aktywności w limonce, żeby spiąć z marką.
export function WatchIcon3D({ size = 28 }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      <defs>
        <linearGradient id={`case${id}`} x1="6" y1="2" x2="30" y2="38" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#5b8dfa" />
          <stop offset="45%" stopColor="#2563eb" />
          <stop offset="100%" stopColor="#12306e" />
        </linearGradient>
        <radialGradient id={`screen${id}`} cx="35%" cy="30%" r="75%">
          <stop offset="0%" stopColor="#1c2740" />
          <stop offset="100%" stopColor="#050810" />
        </radialGradient>
        <linearGradient id={`crown${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#7ea6fb" />
          <stop offset="100%" stopColor="#1a3f8f" />
        </linearGradient>
      </defs>

      {/* pasek (fragmenty widoczne nad i pod kopertą) */}
      <rect x="13" y="0" width="14" height="6" rx="2.5" fill="#12306e" opacity="0.55" />
      <rect x="13" y="34" width="14" height="6" rx="2.5" fill="#12306e" opacity="0.55" />

      {/* korona (digital crown) */}
      <rect x="31" y="13" width="5" height="7" rx="2" fill={`url(#crown${id})`} />
      {/* boczny przycisk */}
      <rect x="31.5" y="22" width="3.5" height="8" rx="1.5" fill="#173a82" />

      {/* koperta */}
      <rect x="7" y="4" width="24" height="32" rx="9" fill={`url(#case${id})`} />
      <rect x="7.5" y="4.5" width="23" height="31" rx="8.5" stroke="#a9c4ff" strokeOpacity="0.35" strokeWidth="1" />

      {/* ekran */}
      <rect x="11" y="8" width="16" height="24" rx="5.5" fill={`url(#screen${id})`} />
      <ellipse cx="15.5" cy="12.5" rx="4.5" ry="2.6" fill="#ffffff" opacity="0.1" />

      {/* mini pierścień aktywności — akcent limonkowy, spina z resztą appki */}
      <circle cx="19" cy="20" r="5.4" stroke="#2b2f27" strokeWidth="2.2" fill="none" />
      <path d="M 19 14.6 A 5.4 5.4 0 1 1 13.9 22.4" stroke="#bcff31" strokeWidth="2.2" strokeLinecap="round" fill="none" />
    </svg>
  );
}
