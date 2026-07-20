import { T } from "../theme.js";
import { CAT_LABEL } from "../data/plan.js";

// Anatomiczna sylwetka (przód + tył) w stylu map mięśni z aplikacji
// treningowych: ciemne ciało, poszczególne mięśnie jako osobne kształty,
// partie trenowane podświetlone limonką (intensywność = liczba serii).
// Jedna geometria obsługuje trzy widoki:
//  - MuscleMap  — duże figury przód/tył + legenda (ekran treningu)
//  - MuscleThumb — małe kółko z jedną podświetloną partią (lista ćwiczeń)
//
// Lewa strona ciała jest rysowana ścieżkami, prawa powstaje przez lustrzane
// odbicie (transform), więc sylwetka jest zawsze symetryczna.

const BODY = "#262723"; // ciało — odrobinę jaśniejsze od tła karty
const BODY_LINE = "#31322e";
const MUSCLE_OFF = "#31322e"; // mięsień nietrenowany
const SEP = "rgba(19,19,17,0.9)"; // separacja między mięśniami

const lime = (op) => `rgba(188,255,49,${op})`;

// ── geometria mięśni ───────────────────────────────────────────────────────
// [cat, ścieżka lewej strony (mirror=true) lub centralna (mirror=false)]
const FRONT_MUSCLES = [
  // kaptury (przód) — skos od szyi do barku
  { cat: "PLECY", mirror: true, d: "M93,42 C85,42 75,47 69,53 C78,55 89,53 95,48 C96,45 95,42 93,42 Z" },
  // naramienny
  { cat: "BARKI", mirror: true, d: "M64,52 C55,54 48,63 48,74 C48,82 54,86 60,84 C67,81 71,71 71,61 C71,55 68,51 64,52 Z" },
  // klatka
  { cat: "KLATKA", mirror: true, d: "M98,56 C87,53 75,59 71,70 C68,81 77,91 89,93 C95,94 98,90 98,83 Z" },
  // biceps
  { cat: "BICEPS", mirror: true, d: "M61,86 C54,88 51,96 52,105 C53,113 58,117 62,114 C66,111 68,103 67,95 C66,89 64,85 61,86 Z" },
  // skośne brzucha
  { cat: "BRZUCH", mirror: true, d: "M81,98 C77,110 77,127 81,139 C84,145 87,143 87,137 L87,105 C87,99 83,94 81,98 Z" },
  // prosty brzucha (centralnie)
  { cat: "BRZUCH", mirror: false, d: "M90,96 L110,96 C113,96 114,99 114,102 L114,144 C114,150 108,154 100,154 C92,154 86,150 86,144 L86,102 C86,99 87,96 90,96 Z" },
  // czworogłowy uda
  { cat: "NOGI", mirror: true, d: "M77,172 C70,192 70,216 76,238 C80,250 91,250 94,239 C97,224 97,197 93,181 C89,168 81,164 77,172 Z" },
  // piszczel / łydka z przodu
  { cat: "NOGI", mirror: true, d: "M79,256 C75,270 75,292 79,308 C82,316 88,314 89,305 C90,289 89,269 86,257 C84,251 81,250 79,256 Z" },
];

const BACK_MUSCLES = [
  // kaptur (romb od karku po środek pleców)
  { cat: "PLECY", mirror: false, d: "M100,40 C89,46 79,52 74,58 C86,66 96,79 100,94 C104,79 114,66 126,58 C121,52 111,46 100,40 Z" },
  // naramienny tylny
  { cat: "BARKI", mirror: true, d: "M64,52 C55,54 48,63 48,74 C48,82 54,86 60,84 C67,81 71,71 71,61 C71,55 68,51 64,52 Z" },
  // odcinek lędźwiowy (pod kapturami, nad pośladkami)
  { cat: "PLECY", mirror: false, d: "M90,124 L110,124 C113,124 114,127 114,130 L113,152 C112,158 106,161 100,161 C94,161 88,158 87,152 L86,130 C86,127 87,124 90,124 Z" },
  // najszerszy grzbietu
  { cat: "PLECY", mirror: true, d: "M74,66 C69,84 72,107 82,125 C88,135 96,141 98,141 L98,97 C94,83 84,70 74,66 Z" },
  // triceps
  { cat: "TRICEPS", mirror: true, d: "M61,86 C54,88 51,96 52,105 C53,113 58,117 62,114 C66,111 68,103 67,95 C66,89 64,85 61,86 Z" },
  // pośladek
  { cat: "NOGI", mirror: true, d: "M79,160 C72,167 71,181 77,191 C85,200 97,198 98,188 L98,168 C93,159 85,155 79,160 Z" },
  // dwugłowy uda
  { cat: "NOGI", mirror: true, d: "M78,198 C73,214 74,232 79,246 C83,254 93,254 95,244 C97,228 96,210 92,200 C88,192 81,190 78,198 Z" },
  // łydka
  { cat: "NOGI", mirror: true, d: "M79,254 C74,268 74,292 79,308 C83,317 89,315 90,305 C91,288 90,268 87,257 C85,250 81,248 79,254 Z" },
];

// pełna sylwetka (tło pod mięśniami): głowa, tors, ręce, nogi
function BodyBase() {
  const limb = { stroke: BODY, strokeLinecap: "round", fill: "none" };
  return (
    <g>
      {/* ręce i nogi jako kapsuły (grube linie z okrągłym zakończeniem) */}
      <line x1="64" y1="62" x2="52" y2="108" strokeWidth="17" {...limb} />
      <line x1="52" y1="108" x2="44" y2="154" strokeWidth="13" {...limb} />
      <circle cx="42" cy="164" r="7" fill={BODY} />
      <line x1="136" y1="62" x2="148" y2="108" strokeWidth="17" {...limb} />
      <line x1="148" y1="108" x2="156" y2="154" strokeWidth="13" {...limb} />
      <circle cx="158" cy="164" r="7" fill={BODY} />
      <line x1="86" y1="176" x2="83" y2="248" strokeWidth="27" {...limb} />
      <line x1="83" y1="250" x2="81" y2="318" strokeWidth="17" {...limb} />
      <line x1="81" y1="324" x2="73" y2="331" strokeWidth="10" {...limb} />
      <line x1="114" y1="176" x2="117" y2="248" strokeWidth="27" {...limb} />
      <line x1="117" y1="250" x2="119" y2="318" strokeWidth="17" {...limb} />
      <line x1="119" y1="324" x2="127" y2="331" strokeWidth="10" {...limb} />
      {/* tors + biodra */}
      <path d="M64,50 C60,80 66,112 75,134 C80,148 78,158 77,168 L123,168 C122,158 120,148 125,134 C134,112 140,80 136,50 C122,44 78,44 64,50 Z" fill={BODY} stroke={BODY_LINE} strokeWidth="1" />
      <rect x="76" y="150" width="48" height="28" rx="11" fill={BODY} />
      {/* szyja + głowa */}
      <rect x="92" y="36" width="16" height="15" rx="5" fill={BODY} />
      <ellipse cx="100" cy="23" rx="13.5" ry="16" fill={BODY} stroke={BODY_LINE} strokeWidth="1" />
    </g>
  );
}

// figura z podświetleniem: fillFor(cat) -> kolor wypełnienia mięśnia
export function MuscleFigure({ side, fillFor, width = 120, viewBox = "22 0 156 342", label }) {
  const muscles = side === "front" ? FRONT_MUSCLES : BACK_MUSCLES;
  const h = Math.round((width / 156) * 342);
  return (
    <div style={{ textAlign: "center" }}>
      <svg width={width} height={h} viewBox={viewBox} aria-hidden>
        <BodyBase />
        {muscles.map((m, i) => (
          <g key={i}>
            <path d={m.d} fill={fillFor(m.cat)} stroke={SEP} strokeWidth="1.2" />
            {m.mirror && <path d={m.d} fill={fillFor(m.cat)} stroke={SEP} strokeWidth="1.2" transform="translate(200,0) scale(-1,1)" />}
          </g>
        ))}
        {/* separacja mięśni brzucha */}
        {side === "front" && (
          <g stroke={SEP} strokeWidth="1.1">
            <line x1="100" y1="96" x2="100" y2="154" />
            <line x1="87" y1="112" x2="113" y2="112" />
            <line x1="87" y1="126" x2="113" y2="126" />
            <line x1="87" y1="140" x2="113" y2="140" />
          </g>
        )}
      </svg>
      {label && (
        <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: ".12em", color: T.faint, fontFamily: "'Urbanist',sans-serif", marginTop: 2 }}>{label}</div>
      )}
    </div>
  );
}

// duża mapa: przód + tył + legenda serii — ekran szczegółów treningu
export function MuscleMap({ setsByCat }) {
  const trained = Object.entries(setsByCat)
    .filter(([, s]) => s > 0)
    .sort((a, b) => b[1] - a[1]);
  const maxSets = trained.length ? trained[0][1] : 1;
  const fillFor = (cat) => {
    const s = setsByCat[cat] || 0;
    if (s === 0) return MUSCLE_OFF;
    return lime((0.4 + 0.6 * Math.min(s / maxSets, 1)).toFixed(2));
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "center", gap: 18 }}>
        <MuscleFigure side="front" fillFor={fillFor} width={124} label="PRZÓD" />
        <MuscleFigure side="back" fillFor={fillFor} width={124} label="TYŁ" />
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "center", marginTop: 12 }}>
        {trained.map(([cat, s]) => (
          <span key={cat} style={{ display: "inline-flex", alignItems: "center", gap: 5, background: T.accentSoftBg, border: `1px solid ${T.accentSoftBorder}`, borderRadius: 99, padding: "4px 10px", fontSize: 10.5, fontWeight: 700, color: T.light, fontFamily: "'Urbanist',sans-serif" }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: lime((0.4 + 0.6 * Math.min(s / maxSets, 1)).toFixed(2)) }} />
            {CAT_LABEL[cat] || cat} <span style={{ color: T.sub, fontFamily: "'Doto',sans-serif", fontWeight: 800 }}>×{s}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

// partie widoczne tylko od tyłu pokazujemy na tylnej figurze
const BACK_ONLY = { PLECY: true, TRICEPS: true };
// kadr miniatury: górne partie = tors, nogi = dół sylwetki
const THUMB_VIEW = {
  NOGI: "40 150 120 178",
  BRZUCH: "44 44 112 124",
  DEFAULT: "40 26 120 132",
};

// małe kółko z sylwetką i JEDNĄ podświetloną partią — lista ćwiczeń
export function MuscleThumb({ cat, size = 54 }) {
  const side = BACK_ONLY[cat] ? "back" : "front";
  const muscles = side === "front" ? FRONT_MUSCLES : BACK_MUSCLES;
  const fillFor = (c) => (c === cat ? lime(0.95) : MUSCLE_OFF);
  const vb = THUMB_VIEW[cat] || THUMB_VIEW.DEFAULT;
  return (
    <span
      style={{ width: size, height: size, borderRadius: "50%", background: T.card2, border: `1px solid ${T.borderSoft}`, display: "inline-flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0 }}
      aria-hidden
    >
      <svg width={size - 8} height={size - 8} viewBox={vb}>
        <BodyBase />
        {muscles.map((m, i) => (
          <g key={i}>
            <path d={m.d} fill={fillFor(m.cat)} stroke={SEP} strokeWidth="1.2" />
            {m.mirror && <path d={m.d} fill={fillFor(m.cat)} stroke={SEP} strokeWidth="1.2" transform="translate(200,0) scale(-1,1)" />}
          </g>
        ))}
      </svg>
    </span>
  );
}
