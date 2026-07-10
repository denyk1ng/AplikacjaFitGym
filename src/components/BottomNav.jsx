import { useEffect, useRef, useState } from "react";
import { Home, Dumbbell, BarChart3, CalendarDays, Plus, Check } from "lucide-react";
import { T } from "../theme.js";

const BAR_BG = T.inset;
const H = 72; // wysokość paska
const RADIUS = H / 2;
const BTN = 58; // średnica centralnego przycisku
const NOTCH_HALF = 56; // połowa szerokości wcięcia
const NOTCH_DEPTH = 35; // głębokość wcięcia

// Kształt paska: pastylka z płynnym wcięciem pod centralny przycisk.
// Wcięcie rysowane krzywymi Béziera — ramiona niecki są miękko zaokrąglone
// (bez ostrych kantów w miejscu styku z górną krawędzią).
function barPath(w) {
  const cx = w / 2;
  return [
    `M ${RADIUS} 0`,
    `L ${cx - NOTCH_HALF} 0`,
    `C ${cx - NOTCH_HALF + 20} 0, ${cx - 42} ${NOTCH_DEPTH}, ${cx} ${NOTCH_DEPTH}`,
    `C ${cx + 42} ${NOTCH_DEPTH}, ${cx + NOTCH_HALF - 20} 0, ${cx + NOTCH_HALF} 0`,
    `L ${w - RADIUS} 0`,
    `A ${RADIUS} ${RADIUS} 0 0 1 ${w - RADIUS} ${H}`,
    `L ${RADIUS} ${H}`,
    `A ${RADIUS} ${RADIUS} 0 0 1 ${RADIUS} 0`,
    "Z",
  ].join(" ");
}

export function BottomNav({ tab, setTab, onSave, saveAnim }) {
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
    { id: "stats", Icon: BarChart3, label: "Statystyki" },
  ];

  return (
    <div style={{ position: "fixed", bottom: "calc(6px + env(safe-area-inset-bottom))", left: "50%", transform: "translateX(-50%)", zIndex: 900, width: "calc(100% - 28px)", maxWidth: 652 }}>
      <div ref={ref} style={{ position: "relative", height: H }}>
        {w > 0 && (
          <svg
            width={w}
            height={H}
            viewBox={`0 0 ${w} ${H}`}
            style={{ position: "absolute", inset: 0, filter: "drop-shadow(0 16px 30px rgba(0,0,0,0.6))" }}
          >
            <path d={barPath(w)} fill={BAR_BG} />
          </svg>
        )}

        <div style={{ position: "relative", height: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 10px" }}>
          {items.map((it) => {
            if (it.id === "CENTER") return <div key="spacer" style={{ width: BTN, flexShrink: 0 }} />;
            const on = tab === it.id || (it.id === "trening" && (tab === "sesja" || tab === "cwiczenie"));
            const Icon = it.Icon;
            return (
              <button
                key={it.id}
                onClick={() => setTab(it.id)}
                title={it.label}
                style={{
                  width: 54,
                  height: 54,
                  borderRadius: "50%",
                  background: on ? "#171717" : "rgba(255,255,255,0.055)",
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: 0,
                  flexShrink: 0,
                  transition: "all .2s",
                }}
              >
                <Icon size={23} color={on ? T.accent : T.soft} strokeWidth={on ? 2.2 : 1.9} />
              </button>
            );
          })}
        </div>

        {/* centralny przycisk w niecce */}
        <button
          onClick={onSave}
          title="Szybkie akcje"
          style={{
            position: "absolute",
            left: "50%",
            top: -(BTN / 2),
            transform: `translateX(-50%) scale(${saveAnim ? 1.08 : 1})`,
            width: BTN,
            height: BTN,
            borderRadius: "50%",
            background: saveAnim ? T.ok : T.accent,
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: saveAnim
              ? "0 6px 24px rgba(52,211,153,0.55)"
              : "0 6px 24px rgba(188,255,49,0.45), 0 0 48px rgba(188,255,49,0.22)",
            transition: "transform .3s cubic-bezier(.22,1,.36,1), background .3s, box-shadow .3s",
          }}
        >
          {saveAnim ? <Check size={26} color="#000" strokeWidth={2.6} /> : <Plus size={27} color="#000" strokeWidth={2.2} />}
        </button>
      </div>
    </div>
  );
}
