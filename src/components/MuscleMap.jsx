import { T } from "../theme.js";
import { CAT_LABEL } from "../data/plan.js";

// Schematyczna sylwetka (przód + tył) z podświetlonymi partiami trenowanymi
// w danym dniu. Intensywność podświetlenia = liczba serii na partię w planie
// dnia (im więcej serii, tym mocniejsza limonka — spójnie z brandem, bez
// wprowadzania nowych kolorów). Partie nieużywane zostają ciemne.
//
// setsByCat: { KLATKA: 8, PLECY: 8, ... } — liczone przez rodzica z planu dnia.

const FRONT = { BARKI: true, KLATKA: true, BICEPS: true, BRZUCH: true, NOGI: true };
const BACK = { BARKI: true, PLECY: true, TRICEPS: true, NOGI: true };

function Figure({ side, setsByCat, maxSets }) {
  // kolor partii: brak serii -> ciemny; serie -> limonka o rosnącym kryciu
  const f = (cat) => {
    const s = setsByCat[cat] || 0;
    const shown = side === "front" ? FRONT[cat] : BACK[cat];
    if (!shown || s === 0) return { fill: T.inset, stroke: T.borderSoft };
    const op = 0.4 + 0.6 * Math.min(s / maxSets, 1);
    return { fill: `rgba(188,255,49,${op.toFixed(2)})`, stroke: T.accentSoftBorder };
  };
  const base = { fill: T.card2, stroke: T.borderSoft, strokeWidth: 1 };
  const sw = { strokeWidth: 1 };

  return (
    <svg width="92" height="168" viewBox="0 0 100 182" aria-hidden>
      {/* głowa + szyja (neutralne) */}
      <circle cx="50" cy="13" r="9.5" {...base} />
      <rect x="45" y="22" width="10" height="7" rx="3" {...base} />

      {/* barki */}
      <circle cx="30" cy="34" r="7" {...f("BARKI")} {...sw} />
      <circle cx="70" cy="34" r="7" {...f("BARKI")} {...sw} />

      {/* tors: przód = klatka + brzuch, tył = plecy (góra) + odcinek lędźwiowy */}
      {side === "front" ? (
        <>
          <rect x="33.5" y="30" width="15" height="14" rx="4" {...f("KLATKA")} {...sw} />
          <rect x="51.5" y="30" width="15" height="14" rx="4" {...f("KLATKA")} {...sw} />
          <rect x="38" y="47" width="24" height="28" rx="7" {...f("BRZUCH")} {...sw} />
        </>
      ) : (
        <>
          <rect x="33.5" y="30" width="33" height="26" rx="7" {...f("PLECY")} {...sw} />
          <rect x="40" y="59" width="20" height="16" rx="5" {...f("PLECY")} {...sw} />
        </>
      )}

      {/* ramiona: przód = biceps, tył = triceps; przedramiona neutralne */}
      <rect x="18" y="40" width="9" height="20" rx="4.5" {...f(side === "front" ? "BICEPS" : "TRICEPS")} {...sw} />
      <rect x="73" y="40" width="9" height="20" rx="4.5" {...f(side === "front" ? "BICEPS" : "TRICEPS")} {...sw} />
      <rect x="16.5" y="63" width="8" height="22" rx="4" {...base} />
      <rect x="75.5" y="63" width="8" height="22" rx="4" {...base} />

      {/* nogi: uda (przód = czworogłowe, tył = pośladki/dwugłowe), łydki neutralne */}
      <rect x="33" y="79" width="14.5" height="42" rx="6" {...f("NOGI")} {...sw} />
      <rect x="52.5" y="79" width="14.5" height="42" rx="6" {...f("NOGI")} {...sw} />
      <rect x="34.5" y="124" width="11.5" height="34" rx="5" {...base} />
      <rect x="54" y="124" width="11.5" height="34" rx="5" {...base} />

      <text x="50" y="176" textAnchor="middle" style={{ fill: T.faint, fontSize: 9, fontWeight: 700, fontFamily: "'Urbanist',sans-serif", letterSpacing: ".08em" }}>
        {side === "front" ? "PRZÓD" : "TYŁ"}
      </text>
    </svg>
  );
}

export function MuscleMap({ setsByCat }) {
  const trained = Object.entries(setsByCat)
    .filter(([, s]) => s > 0)
    .sort((a, b) => b[1] - a[1]);
  const maxSets = trained.length ? trained[0][1] : 1;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "center", gap: 26 }}>
        <Figure side="front" setsByCat={setsByCat} maxSets={maxSets} />
        <Figure side="back" setsByCat={setsByCat} maxSets={maxSets} />
      </div>
      {/* legenda: partia + liczba serii, sortowana od najmocniej trenowanej */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "center", marginTop: 10 }}>
        {trained.map(([cat, s]) => (
          <span key={cat} style={{ display: "inline-flex", alignItems: "center", gap: 5, background: T.accentSoftBg, border: `1px solid ${T.accentSoftBorder}`, borderRadius: 99, padding: "4px 10px", fontSize: 10.5, fontWeight: 700, color: T.light, fontFamily: "'Urbanist',sans-serif" }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: `rgba(188,255,49,${(0.4 + 0.6 * Math.min(s / maxSets, 1)).toFixed(2)})` }} />
            {CAT_LABEL[cat] || cat} <span style={{ color: T.sub, fontFamily: "'Doto',sans-serif", fontWeight: 800 }}>×{s}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
