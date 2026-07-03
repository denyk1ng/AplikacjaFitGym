import { Home, Dumbbell, BarChart3, Flame, Save, Check } from "lucide-react";
import { T } from "../theme.js";

export function BottomNav({ tab, setTab, onSave, saveAnim }) {
  const items = [
    { id: "dom", Icon: Home, label: "Dom" },
    { id: "trening", Icon: Dumbbell, label: "Trening" },
    { id: "CENTER" },
    { id: "stats", Icon: BarChart3, label: "Statystyki" },
    { id: "rozgrzewka", Icon: Flame, label: "Rozgrzewka" },
  ];
  return (
    <div style={{ position: "fixed", bottom: 16, left: "50%", transform: "translateX(-50%)", zIndex: 900, width: "calc(100% - 32px)", maxWidth: 400 }}>
      <div
        style={{
          background: "rgba(16,20,10,0.92)",
          backdropFilter: "blur(18px)",
          WebkitBackdropFilter: "blur(18px)",
          border: `1px solid ${T.border}`,
          borderRadius: 32,
          padding: "10px 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          boxShadow: "0 16px 48px rgba(0,0,0,0.8)",
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
                  width: 54,
                  height: 54,
                  borderRadius: "50%",
                  background: saveAnim ? T.ok : T.accent,
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: saveAnim ? "0 0 26px rgba(52,211,153,0.5)" : "0 8px 24px rgba(198,244,50,0.35)",
                  transform: saveAnim ? "scale(1.1)" : "scale(1)",
                  transition: "all .3s cubic-bezier(.22,1,.36,1)",
                  marginTop: -26,
                  flexShrink: 0,
                }}
              >
                {saveAnim ? <Check size={24} color="#000" strokeWidth={3} /> : <Save size={22} color="#000" strokeWidth={2.2} />}
              </button>
            );
          const on = tab === it.id;
          const Icon = it.Icon;
          return (
            <button
              key={it.id}
              onClick={() => setTab(it.id)}
              title={it.label}
              style={{ width: 46, height: 46, borderRadius: 18, background: on ? T.accentSoftBg : "transparent", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all .25s" }}
            >
              <Icon size={22} color={on ? T.accent : T.faint} strokeWidth={on ? 2.4 : 2} />
            </button>
          );
        })}
      </div>
    </div>
  );
}
