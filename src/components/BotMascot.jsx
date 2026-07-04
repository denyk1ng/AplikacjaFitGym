// Maskotka-bot w stylu "3D toy render" (gradienty + glossy highlight + poświata oczu),
// czysty SVG bez zewnętrznych zdjęć — używany na kafelku Trenera AI na Dashboardzie.
export function BotMascot({ size = 110 }) {
  return (
    <svg width={size} height={(size * 150) / 120} viewBox="0 0 120 150" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="botHead" x1="15%" y1="5%" x2="85%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="55%" stopColor="#e7ebf1" />
          <stop offset="100%" stopColor="#aab0bd" />
        </linearGradient>
        <linearGradient id="botBody" x1="15%" y1="0%" x2="85%" y2="100%">
          <stop offset="0%" stopColor="#f5f7fa" />
          <stop offset="60%" stopColor="#dde1e7" />
          <stop offset="100%" stopColor="#a5abb8" />
        </linearGradient>
        <linearGradient id="botDark" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#20242c" />
          <stop offset="100%" stopColor="#0a0b0f" />
        </linearGradient>
        <radialGradient id="botGlow" cx="50%" cy="40%" r="65%">
          <stop offset="0%" stopColor="#eaffb0" />
          <stop offset="55%" stopColor="#bcff31" />
          <stop offset="100%" stopColor="#82c400" />
        </radialGradient>
        <radialGradient id="botShadow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(0,0,0,0.38)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0)" />
        </radialGradient>
        <filter id="botEmit" x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="3.2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* cień pod botem */}
      <ellipse cx="60" cy="144" rx="34" ry="7" fill="url(#botShadow)" />

      {/* antena */}
      <line x1="60" y1="9" x2="60" y2="23" stroke="#b6bcc7" strokeWidth="3.5" strokeLinecap="round" />
      <circle cx="60" cy="8" r="6.5" fill="url(#botGlow)" filter="url(#botEmit)" />

      {/* ramiona (kikuty, boki korpusu) */}
      <ellipse cx="10" cy="108" rx="10" ry="16" fill="url(#botBody)" />
      <ellipse cx="110" cy="108" rx="10" ry="16" fill="url(#botBody)" />

      {/* korpus */}
      <rect x="16" y="86" width="88" height="52" rx="26" fill="url(#botBody)" stroke="#8b93a3" strokeOpacity="0.3" />
      {/* panel piersiowy z rdzeniem */}
      <rect x="44" y="100" width="32" height="26" rx="9" fill="url(#botDark)" />
      <circle cx="60" cy="113" r="5" fill="url(#botGlow)" filter="url(#botEmit)" />

      {/* szyja */}
      <rect x="50" y="76" width="20" height="12" fill="#c3c8d2" />

      {/* głowa */}
      <rect x="24" y="20" width="72" height="56" rx="25" fill="url(#botHead)" stroke="#9aa1ad" strokeOpacity="0.35" />
      {/* czujniki po bokach głowy */}
      <circle cx="20" cy="50" r="7.5" fill="url(#botBody)" />
      <circle cx="100" cy="50" r="7.5" fill="url(#botBody)" />

      {/* wizjer z oczami */}
      <rect x="37" y="39" width="46" height="22" rx="11" fill="url(#botDark)" />
      <circle cx="52" cy="50" r="5.4" fill="url(#botGlow)" filter="url(#botEmit)" />
      <circle cx="68" cy="50" r="5.4" fill="url(#botGlow)" filter="url(#botEmit)" />

      {/* glossy highlight na głowie */}
      <ellipse cx="43" cy="30" rx="15" ry="8" fill="#ffffff" opacity="0.55" transform="rotate(-18 43 30)" />
    </svg>
  );
}
