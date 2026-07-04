// Prosty, płaski maskotka-bot (SVG, bez zewnętrznych zdjęć) — używany na kafelku
// Trenera AI na Dashboardzie, w stylu geometrycznym spójnym z logo FORMA.
export function BotMascot({ size = 110 }) {
  return (
    <svg width={size} height={(size * 140) / 120} viewBox="0 0 120 140" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* antena */}
      <line x1="60" y1="10" x2="60" y2="24" stroke="#c7cbd3" strokeWidth="3" strokeLinecap="round" />
      <circle cx="60" cy="8" r="6" fill="#bcff31" />

      {/* głowa */}
      <rect x="25" y="22" width="70" height="54" rx="22" fill="#eef1f6" />
      {/* czujniki po bokach głowy */}
      <circle cx="21" cy="50" r="7" fill="#d7dbe3" />
      <circle cx="99" cy="50" r="7" fill="#d7dbe3" />

      {/* wizjer z oczami */}
      <rect x="38" y="41" width="44" height="21" rx="10.5" fill="#12141a" />
      <circle cx="52" cy="51.5" r="5.2" fill="#bcff31" />
      <circle cx="68" cy="51.5" r="5.2" fill="#bcff31" />

      {/* szyja */}
      <rect x="50" y="74" width="20" height="12" fill="#c7cbd3" />

      {/* korpus / ramiona */}
      <rect x="14" y="84" width="92" height="52" rx="26" fill="#eef1f6" />
      {/* panel piersiowy */}
      <rect x="44" y="98" width="32" height="26" rx="9" fill="#12141a" />
      <circle cx="60" cy="111" r="5" fill="#bcff31" />
    </svg>
  );
}
