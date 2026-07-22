import { useEffect, useRef, useState } from "react";
import { Home, Dumbbell, BarChart3, CalendarDays, User } from "lucide-react";
import { T } from "../theme.js";

const BAR_BG = T.inset;
const H = 66; // wysokość paska
const R = 26; // promień narożników
const BTN = 56; // średnica centralnego przycisku
const NOTCH_HALF = 54; // połowa szerokości wcięcia
const NOTCH_DEPTH = 34; // głębokość wcięcia

// Kształt paska: zaokrąglony prostokąt z płynnym wgłębieniem pod centralny
// przycisk — niecka rysowana krzywymi Béziera zostawia widoczny odstęp
// wokół przycisku (siedzi w wycięciu, nie na pasku).
function barPath(w) {
  const cx = w / 2;
  return [
    `M ${R} 0`,
    `L ${cx - NOTCH_HALF} 0`,
    `C ${cx - NOTCH_HALF + 20} 0, ${cx - 42} ${NOTCH_DEPTH}, ${cx} ${NOTCH_DEPTH}`,
    `C ${cx + 42} ${NOTCH_DEPTH}, ${cx + NOTCH_HALF - 20} 0, ${cx + NOTCH_HALF} 0`,
    `L ${w - R} 0`,
    `Q ${w} 0, ${w} ${R}`,
    `L ${w} ${H - R}`,
    `Q ${w} ${H}, ${w - R} ${H}`,
    `L ${R} ${H}`,
    `Q 0 ${H}, 0 ${H - R}`,
    `L 0 ${R}`,
    `Q 0 0, ${R} 0`,
    "Z",
  ].join(" ");
}

// Pasek nawigacji: etykiety pod ikonami, aktywna pozycja limonką; centralny
// przycisk w niecce prowadzi do Statystyk (limonkowe kółko z ikoną wykresu).
export function BottomNav({ tab, setTab }) {
  const ref = useRef(null);
  const [w, setW] = useState(0);
  useEffect(() => {
    const measure = () => ref.current && setW(ref.current.offsetWidth);
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  const items = [
    { id: "dom", Icon: Home, label: "Dom" },
    { id: "trening", Icon: Dumbbell, label: "Trening" },
    { id: "CENTER" },
    { id: "kalendarz", Icon: CalendarDays, label: "Kalendarz" },
    { id: "profil", Icon: User, label: "Profil" },
  ];

  const statsOn = tab === "stats";

  return (
    <div style={{ position: "fixed", bottom: 14, left: "50%", transform: "translateX(-50%)", zIndex: 900, width: "calc(100% - 28px)", maxWidth: 402 }}>
      <div ref={ref} style={{ position: "relative", height: H }}>
        {w > 0 && (
          <svg width={w} height={H} viewBox={`0 0 ${w} ${H}`} style={{ position: "absolute", inset: 0, filter: "drop-shadow(0 16px 30px rgba(0,0,0,0.6))" }}>
            <path d={barPath(w)} fill={BAR_BG} />
          </svg>
        )}

        <div style={{ position: "relative", height: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 6px" }}>
          {items.map((it) => {
            if (it.id === "CENTER") return <div key="spacer" style={{ width: NOTCH_HALF + 14, flexShrink: 0 }} />;
            const on = tab === it.id || (it.id === "trening" && (tab === "sesja" || tab === "cwiczenie"));
            const Icon = it.Icon;
            return (
              <button
                key={it.id}
                onClick={() => setTab(it.id)}
                title={it.label}
                style={{
                  flex: 1,
                  minWidth: 0,
                  height: 54,
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 4,
                  padding: 0,
                  transition: "all .2s",
                }}
              >
                <Icon size={21} color={on ? T.accent : T.soft} strokeWidth={on ? 2.2 : 1.9} />
                <span style={{ fontSize: 9, fontWeight: on ? 800 : 600, color: on ? T.accent : T.sub, fontFamily: "'Urbanist',sans-serif", letterSpacing: ".01em", whiteSpace: "nowrap" }}>{it.label}</span>
              </button>
            );
          })}
        </div>

        {/* centralny przycisk w niecce — Statystyki */}
        <button
          onClick={() => setTab("stats")}
          title="Statystyki"
          style={{
            position: "absolute",
            left: "50%",
            top: -(BTN / 2),
            transform: `translateX(-50%) scale(${statsOn ? 1.07 : 1})`,
            width: BTN,
            height: BTN,
            borderRadius: "50%",
            background: T.accent,
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 6px 16px rgba(0,0,0,0.35)",
            transition: "transform .3s cubic-bezier(.22,1,.36,1), box-shadow .3s",
          }}
        >
          <BarChart3 size={24} color="#000" strokeWidth={2.3} />
        </button>
      </div>
    </div>
  );
}
