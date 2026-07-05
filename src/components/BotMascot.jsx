// Maskotka-bota — wektorowe odwzorowanie referencyjnego droida (boxy głowa,
// obiektyw kamery, krótkie świecące "oczy", odsłonięta szyja, zniszczony pancerz).
// Czysty SVG z gradientami, bez zewnętrznych zdjęć. Kolorystyka w palecie
// marki: biel/czerń/szarość na kopercie, limonka na świecących "oczach".
export function BotMascot({ size = 110 }) {
  return (
    <svg width={size} height={(size * 155) / 130} viewBox="0 0 130 155" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="botCream" x1="15%" y1="0%" x2="85%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="55%" stopColor="#dedfd9" />
          <stop offset="100%" stopColor="#94978f" />
        </linearGradient>
        <linearGradient id="botMustard" x1="10%" y1="0%" x2="90%" y2="100%">
          <stop offset="0%" stopColor="#3a3b38" />
          <stop offset="50%" stopColor="#232420" />
          <stop offset="100%" stopColor="#131311" />
        </linearGradient>
        <linearGradient id="botDark" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#2e2e2f" />
          <stop offset="100%" stopColor="#0a0a0a" />
        </linearGradient>
        <radialGradient id="botEye" cx="50%" cy="30%" r="80%">
          <stop offset="0%" stopColor="#eaffb0" />
          <stop offset="55%" stopColor="#bcff31" />
          <stop offset="100%" stopColor="#7a9e1f" />
        </radialGradient>
        <radialGradient id="botLens" cx="40%" cy="35%" r="70%">
          <stop offset="0%" stopColor="#5c7a24" />
          <stop offset="60%" stopColor="#1c2410" />
          <stop offset="100%" stopColor="#0a0a0a" />
        </radialGradient>
        <radialGradient id="botShadow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(0,0,0,0.4)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0)" />
        </radialGradient>
        <filter id="botEmit" x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="2.4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* cień */}
      <ellipse cx="68" cy="148" rx="38" ry="6" fill="url(#botShadow)" />

      {/* ramiona / pauldrony — zniszczony pancerz */}
      <path d="M8 135 Q4 103 34 97 Q52 93 54 115 L54 143 Q40 153 20 149 Q10 145 8 135 Z" fill="url(#botMustard)" stroke="#0a0a0a" strokeOpacity="0.25" />
      <path d="M122 135 Q126 103 96 97 Q78 93 76 115 L76 143 Q90 153 110 149 Q120 145 122 135 Z" fill="url(#botMustard)" stroke="#0a0a0a" strokeOpacity="0.25" />
      {/* zniszczenia na ramionach */}
      <ellipse cx="24" cy="113" rx="7" ry="4" fill="#0a0a0a" opacity="0.18" transform="rotate(-20 24 113)" />
      <ellipse cx="104" cy="115" rx="6" ry="3.5" fill="#0a0a0a" opacity="0.18" transform="rotate(15 104 115)" />

      {/* kule przegubów barków */}
      <circle cx="40" cy="107" r="10" fill="url(#botDark)" />
      <circle cx="90" cy="107" r="10" fill="url(#botDark)" />

      {/* klatka piersiowa (fragment widoczny u dołu) */}
      <rect x="46" y="125" width="38" height="30" rx="10" fill="url(#botMustard)" stroke="#0a0a0a" strokeOpacity="0.25" />
      <rect x="56" y="135" width="18" height="12" rx="3" fill="url(#botDark)" />

      {/* szyja — odsłonięte kable/przeguby */}
      <rect x="60" y="84" width="10" height="20" fill="#1c1c1d" />
      <circle cx="60" cy="89" r="4" fill="#333335" />
      <circle cx="70" cy="95" r="4" fill="#333335" />
      <circle cx="60" cy="101" r="4" fill="#333335" />

      {/* głowa — boxy */}
      <rect x="30" y="20" width="76" height="66" rx="14" fill="url(#botCream)" stroke="#94978f" strokeOpacity="0.4" />

      {/* obiektyw kamery, górny prawy róg głowy */}
      <circle cx="98" cy="42" r="17" fill="url(#botCream)" />
      <circle cx="98" cy="42" r="12.5" fill="url(#botLens)" />
      <circle cx="94" cy="38" r="3" fill="#bcff31" opacity="0.6" />

      {/* antena */}
      <line x1="100" y1="8" x2="94" y2="24" stroke="#2e2e2f" strokeWidth="3" strokeLinecap="round" />
      <circle cx="100" cy="7" r="2.6" fill="#2e2e2f" />

      {/* wizjer z krótkimi świecącymi "oczami" */}
      <rect x="42" y="42" width="42" height="32" rx="9" fill="url(#botDark)" />
      <rect x="52" y="49" width="7" height="18" rx="3.5" fill="url(#botEye)" filter="url(#botEmit)" />
      <rect x="66" y="49" width="7" height="18" rx="3.5" fill="url(#botEye)" filter="url(#botEmit)" />

      {/* drobne detale / śruby na głowie */}
      <circle cx="37" cy="30" r="2" fill="#94978f" opacity="0.5" />
      <circle cx="37" cy="76" r="2" fill="#94978f" opacity="0.5" />

      {/* zabrudzenia na głowie */}
      <ellipse cx="46" cy="66" rx="6" ry="3" fill="#0a0a0a" opacity="0.1" transform="rotate(-10 46 66)" />
    </svg>
  );
}
