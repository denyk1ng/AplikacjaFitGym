import { useState } from "react";
import { ChevronDown, ArrowLeft, Zap, Dumbbell, Footprints, ArrowUpFromLine, Lightbulb } from "lucide-react";
import { T } from "../theme.js";
import { WARMUP_DATA } from "../data/plan.js";

const SECTION_ICON = { zap: Zap, a: Dumbbell, b: Footprints, c: ArrowUpFromLine };

function WarmupSection({ data, idx }) {
  const [open, setOpen] = useState(true);
  const Icon = SECTION_ICON[data.iconKey] || Zap;
  return (
    <div className="fu" style={{ animationDelay: `${idx * 0.06}s`, background: T.card, border: `1px solid ${T.borderSoft}`, borderRadius: 20, overflow: "hidden", marginBottom: 10 }}>
      <div onClick={() => setOpen(!open)} style={{ padding: "13px 14px", cursor: "pointer", display: "flex", alignItems: "center", gap: 12, borderBottom: open ? `1px solid ${T.borderSoft}` : "none" }}>
        <span style={{ width: 38, height: 38, borderRadius: 13, background: `${data.color}18`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Icon size={17} color={data.color} strokeWidth={2.3} />
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: "0.95rem", color: "#fff" }}>{data.label}</div>
          <div style={{ fontSize: 11.5, color: T.sub, marginTop: 1 }}>{data.sublabel}</div>
        </div>
        <ChevronDown size={18} color={T.faint} strokeWidth={2.4} style={{ transition: "transform .25s", transform: open ? "rotate(180deg)" : "none", flexShrink: 0 }} />
      </div>
      {open && (
        <div style={{ padding: "6px 14px 12px" }}>
          {data.items.map((item, i) => (
            <div key={i} style={{ display: "flex", gap: 10, padding: "10px 0", borderBottom: i < data.items.length - 1 ? `1px solid ${T.borderSoft}` : "none" }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: data.color, flexShrink: 0, marginTop: 6 }} />
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3, flexWrap: "wrap" }}>
                  <span style={{ fontWeight: 600, fontSize: 13, color: "#fff" }}>{item.name}</span>
                  <span style={{ background: `${data.color}16`, borderRadius: 99, padding: "2px 9px", fontSize: 11, fontWeight: 700, color: data.color, flexShrink: 0 }}>{item.sets}</span>
                </div>
                <div style={{ fontSize: 12, color: T.sub, lineHeight: 1.55 }}>{item.desc}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function WarmupTab({ onBack }) {
  return (
    <div>
      {onBack && (
        <button
          onClick={onBack}
          className="fu"
          style={{ background: T.card, border: `1px solid ${T.border}`, color: T.light, borderRadius: 99, fontSize: 12.5, fontWeight: 600, padding: "9px 16px", cursor: "pointer", fontFamily: "inherit", display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 14 }}
        >
          <ArrowLeft size={15} strokeWidth={2.4} /> Wróć do treningu
        </button>
      )}
      <div className="fu" style={{ display: "flex", gap: 10, alignItems: "flex-start", background: T.card, border: `1px solid ${T.borderSoft}`, borderRadius: 16, padding: "12px 14px", marginBottom: 16, fontSize: 12, color: T.soft, lineHeight: 1.6 }}>
        <Lightbulb size={15} color={T.accent} strokeWidth={2.2} style={{ flexShrink: 0, marginTop: 2 }} />
        <span>
          Zawsze zacznij od <strong style={{ color: T.accent }}>bazy</strong>, potem aktywacja{" "}
          <strong style={{ color: T.accent }}>właściwa dla danego dnia</strong>. Łącznie ok. 8–10 minut.
        </span>
      </div>
      {Object.values(WARMUP_DATA).map((d, i) => (
        <WarmupSection key={i} data={d} idx={i} />
      ))}
    </div>
  );
}
