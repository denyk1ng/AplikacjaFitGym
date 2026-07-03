import { Home, Dumbbell, BarChart3, Apple, Plus, Check } from "lucide-react";
import { T } from "../theme.js";

const BAR_BG = "#1d1e18";
const BTN = 56; // średnica centralnego przycisku
const NOTCH = 34; // promień wgłębienia (przycisk 28 + 6 px prześwitu)

// Dolny pasek 1:1 wg referencji:
// - pastylka z półkolistym WGŁĘBIENIEM w górnej krawędzi pod centralnym przyciskiem
//   (radial-gradient wycina niecke, przez którą prześwituje tło strony)
// - przycisk z plusem osadzony w niecce, wystaje do połowy ponad pasek
// - aktywna ikona: czarne kółko + limonkowa ikona; nieaktywne: jaśniejsze szare kółka
export function BottomNav({ tab, setTab, onSave, saveAnim }) {
  const items = [
    { id: "dom", Icon: Home, label: "Dom" },
    { id: "trening", Icon: Dumbbell, label: "Trening" },
    { id: "CENTER" },
    { id: "dieta", Icon: Apple, label: "Dieta" },
    { id: "stats", Icon: BarChart3, label: "Statystyki" },
  ];
  return (
    <div style={{ position: "fixed", bottom: 14, left: "50%", transform: "translateX(-50%)", zIndex: 900, width: "calc(100% - 28px)", maxWidth: 400 }}>
      <div style={{ position: "relative" }}>
        {/* pasek z wycięciem */}
        <div
          style={{
            background: `radial-gradient(circle ${NOTCH}px at 50% 0px, transparent ${NOTCH - 1}px, ${BAR_BG} ${NOTCH}px)`,
            borderRadius: 999,
            padding: "7px 10px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            filter: "drop-shadow(0 16px 30px rgba(0,0,0,0.6))",
          }}
        >
          {items.map((it) => {
            if (it.id === "CENTER") return <div key="spacer" style={{ width: BTN, flexShrink: 0 }} />;
            const on = tab === it.id;
            const Icon = it.Icon;
            return (
              <button
                key={it.id}
                onClick={() => setTab(it.id)}
                title={it.label}
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: "50%",
                  background: on ? "#0a0b07" : "rgba(255,255,255,0.055)",
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
                <Icon size={21} color={on ? T.accent : "#8b8e80"} strokeWidth={on ? 2.2 : 1.9} />
              </button>
            );
          })}
        </div>

        {/* centralny przycisk w niecce — środek dokładnie na górnej krawędzi paska */}
        <button
          onClick={onSave}
          title="Zapisz ciężary + punkt progresu"
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
              : "0 6px 24px rgba(198,244,50,0.45), 0 0 48px rgba(198,244,50,0.22)",
            transition: "transform .3s cubic-bezier(.22,1,.36,1), background .3s, box-shadow .3s",
          }}
        >
          {saveAnim ? <Check size={26} color="#000" strokeWidth={2.6} /> : <Plus size={27} color="#000" strokeWidth={2.2} />}
        </button>
      </div>
    </div>
  );
}
