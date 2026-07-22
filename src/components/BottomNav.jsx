import { Home, Dumbbell, BarChart3, CalendarDays, Plus, Check } from "lucide-react";
import { T } from "../theme.js";

// Pasek nawigacji wg projektu: pastylka bez wcięcia, etykiety pod ikonami,
// aktywna pozycja limonką; centralny przycisk "+" unosi się nad paskiem
// z limonkową poświatą.
export function BottomNav({ tab, setTab, onSave, saveAnim }) {
  const items = [
    { id: "dom", Icon: Home, label: "Dom" },
    { id: "trening", Icon: Dumbbell, label: "Trening" },
    { id: "CENTER" },
    { id: "kalendarz", Icon: CalendarDays, label: "Kalendarz" },
    { id: "stats", Icon: BarChart3, label: "Statystyki" },
  ];

  return (
    <div style={{ position: "fixed", bottom: "calc(6px + env(safe-area-inset-bottom))", left: "50%", transform: "translateX(-50%)", zIndex: 900, width: "calc(100% - 28px)", maxWidth: 402 }}>
      <div style={{ position: "relative", height: 66, background: T.inset, borderRadius: 26, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 6px", boxShadow: "0 16px 30px rgba(0,0,0,0.6)" }}>
        {items.map((it) => {
          if (it.id === "CENTER") return <div key="spacer" style={{ width: 62, flexShrink: 0 }} />;
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

        {/* centralny przycisk uniesiony nad pasek */}
        <button
          onClick={onSave}
          title="Szybkie akcje"
          style={{
            position: "absolute",
            left: "50%",
            top: -16,
            transform: `translateX(-50%) scale(${saveAnim ? 1.08 : 1})`,
            width: 56,
            height: 56,
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
          {saveAnim ? <Check size={26} color="#000" strokeWidth={2.6} /> : <Plus size={26} color="#000" strokeWidth={2.2} />}
        </button>
      </div>
    </div>
  );
}
