import { Home, Dumbbell, BarChart3, Apple, Save, Check } from "lucide-react";
import { T } from "../theme.js";

// Dolny pasek 1:1 wg referencji: pełna pastylka (radius = połowa wysokości),
// niemal czarne tło bez ramki, aktywna ikona biała, nieaktywne przygaszone,
// limonkowy okrągły przycisk lekko uniesiony z poświatą pod spodem.
export function BottomNav({ tab, setTab, onSave, saveAnim }) {
  const items = [
    { id: "dom", Icon: Home, label: "Dom" },
    { id: "trening", Icon: Dumbbell, label: "Trening" },
    { id: "CENTER" },
    { id: "dieta", Icon: Apple, label: "Dieta" },
    { id: "stats", Icon: BarChart3, label: "Statystyki" },
  ];
  return (
    <div style={{ position: "fixed", bottom: 12, left: "50%", transform: "translateX(-50%)", zIndex: 900, width: "calc(100% - 24px)", maxWidth: 408 }}>
      <div
        style={{
          background: "rgba(13,15,9,0.97)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderRadius: 999,
          padding: "13px 26px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          boxShadow: "0 18px 44px rgba(0,0,0,0.7)",
        }}
      >
        {items.map((it) => {
          if (it.id === "CENTER")
            return (
              <button
                key="c"
                onClick={onSave}
                title="Zapisz ciężary + punkt progresu"
                style={{
                  width: 58,
                  height: 58,
                  borderRadius: "50%",
                  background: saveAnim ? T.ok : T.accent,
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: saveAnim
                    ? "0 10px 28px rgba(52,211,153,0.5)"
                    : "0 12px 30px rgba(198,244,50,0.45), 0 3px 10px rgba(198,244,50,0.3)",
                  transform: saveAnim ? "scale(1.08)" : "scale(1)",
                  transition: "all .3s cubic-bezier(.22,1,.36,1)",
                  marginTop: -16,
                  marginBottom: -6,
                  flexShrink: 0,
                }}
              >
                {saveAnim ? <Check size={26} color="#000" strokeWidth={3} /> : <Save size={23} color="#000" strokeWidth={2.2} />}
              </button>
            );
          const on = tab === it.id;
          const Icon = it.Icon;
          return (
            <button
              key={it.id}
              onClick={() => setTab(it.id)}
              title={it.label}
              style={{
                width: 44,
                height: 44,
                borderRadius: "50%",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 0,
                transition: "all .2s",
              }}
            >
              <Icon size={23} color={on ? "#ffffff" : "#5d6252"} strokeWidth={on ? 2.3 : 1.9} />
            </button>
          );
        })}
      </div>
    </div>
  );
}
