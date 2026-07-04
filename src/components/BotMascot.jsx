// Maskotka-bot w stylu przemysłowego "sci-fi droida" (boxy głowa, obiektyw kamery,
// żółto-kremowy pancerz) — czysty SVG z gradientami/poświatą, bez zewnętrznych zdjęć.
export function BotMascot({ size = 110 }) {
  return (
    <svg width={size} height={(size * 160) / 130} viewBox="0 0 130 160" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="botCream" x1="10%" y1="0%" x2="90%" y2="100%">
          <stop offset="0%" stopColor="#f7f3e9" />
          <stop offset="55%" stopColor="#e8e1cf" />
          <stop offset="100%" stopColor="#c6bda5" />
        </linearGradient>
        <linearGradient id="botMustard" x1="10%" y1="0%" x2="90%" y2="100%">
          <stop offset="0%" stopColor="#ffd873" />
          <stop offset="55%" stopColor="#f2b83e" />
          <stop offset="100%" stopColor="#c98a1f" />
        </linearGradient>
        <linearGradient id="botDark" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#2b2b2c" />
          <stop offset="100%" stopColor="#0a0a0a" />
        </linearGradient>
        <radialGradient id="botEye" cx="50%" cy="35%" r="70%">
          <stop offset="0%" stopColor="#fff4c2" />
          <stop offset="55%" stopColor="#ffc93f" />
          <stop offset="100%" stopColor="#c9860a" />
        </radialGradient>
        <radialGradient id="botShadow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(0,0,0,0.4)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0)" />
        </radialGradient>
        <filter id="botEmit" x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="2.6" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* cień */}
      <ellipse cx="65" cy="153" rx="36" ry="7" fill="url(#botShadow)" />

      {/* antena */}
      <line x1="46" y1="6" x2="52" y2="24" stroke="#3a3a3c" strokeWidth="3" strokeLinecap="round" />
      <circle cx="46" cy="5" r="3" fill="#3a3a3c" />

      {/* ramiona / kikuty boczne korpusu (koła jak zawiasy) */}
      <circle cx="16" cy="120" r="14" fill="url(#botMustard)" stroke="#0a0a0a" strokeOpacity="0.25" />
      <circle cx="114" cy="120" r="14" fill="url(#botMustard)" stroke="#0a0a0a" strokeOpacity="0.25" />

      {/* korpus */}
      <rect x="26" y="100" width="78" height="50" rx="18" fill="url(#botMustard)" stroke="#0a0a0a" strokeOpacity="0.25" />
      <rect x="26" y="120" width="78" height="7" fill="#0a0a0a" opacity="0.55" />
      <rect x="52" y="128" width="26" height="16" rx="4" fill="url(#botDark)" />

      {/* szyja — segmentowe "kable" */}
      <rect x="58" y="88" width="14" height="16" fill="#2b2b2c" />
      <circle cx="58" cy="92" r="3.5" fill="#3a3a3c" />
      <circle cx="72" cy="98" r="3.5" fill="#3a3a3c" />

      {/* głowa (boxy) */}
      <rect x="24" y="26" width="82" height="64" rx="16" fill="url(#botCream)" stroke="#9b9280" strokeOpacity="0.4" />

      {/* obiektyw kamery z boku głowy */}
      <circle cx="100" cy="58" r="15" fill="url(#botDark)" />
      <circle cx="100" cy="58" r="9.5" fill="#171717" />
      <circle cx="103" cy="55" r="3" fill="#565656" opacity="0.8" />

      {/* wizjer z dwoma pionowymi światłami */}
      <rect x="35" y="42" width="42" height="34" rx="9" fill="url(#botDark)" />
      <rect x="44" y="49" width="8" height="20" rx="4" fill="url(#botEye)" filter="url(#botEmit)" />
      <rect x="60" y="49" width="8" height="20" rx="4" fill="url(#botEye)" filter="url(#botEmit)" />

      {/* drobne wentylacje po lewej */}
      <rect x="29" y="34" width="10" height="3" rx="1.5" fill="#9b9280" opacity="0.6" />
      <rect x="29" y="40" width="10" height="3" rx="1.5" fill="#9b9280" opacity="0.6" />

      {/* glossy highlight na głowie */}
      <ellipse cx="42" cy="36" rx="13" ry="7" fill="#ffffff" opacity="0.45" transform="rotate(-14 42 36)" />
    </svg>
  );
}
