import { useState } from "react";
import { ChevronDown, ArrowLeft } from "lucide-react";
import { T } from "../theme.js";
import { WARMUP_DATA } from "../data/plan.js";

function WarmupSection({ data, idx }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="fu" style={{ animationDelay: `${idx * 0.07}s`, background: T.card, border: `1px solid ${data.color}30`, borderRadius: 20, overflow: "hidden", marginBottom: 12 }}>
      <div onClick={() => setOpen(!open)} style={{ padding: "14px 16px", cursor: "pointer", display: "flex", alignItems: "center", gap: 12, borderBottom: open ? `1px solid ${data.color}20` : "none" }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: "1rem", color: data.color }}>{data.label}</div>
          <div style={{ fontSize: 12, color: T.sub, marginTop: 2 }}>{data.sublabel}</div>
        </div>
        <ChevronDown size={18} color={T.faint} strokeWidth={2.4} style={{ transition: "transform .25s", transform: open ? "rotate(180deg)" : "none", flexShrink: 0 }} />
      </div>
      {open && (
        <div style={{ padding: "10px 14px 14px", display: "flex", flexDirection: "column", gap: 8 }}>
          {data.items.map((item, i) => (
            <div key={i} style={{ display: "flex", gap: 10, padding: "10px 0", borderBottom: i < data.items.length - 1 ? `1px solid ${T.borderSoft}` : "none" }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: data.color, flexShrink: 0, marginTop: 6 }} />
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3, flexWrap: "wrap" }}>
                  <span style={{ fontWeight: 600, fontSize: 13 }}>{item.name}</span>
                  <span style={{ background: `${data.color}18`, border: `1px solid ${data.color}30`, borderRadius: 99, padding: "2px 8px", fontSize: 11, fontWeight: 700, color: data.color, flexShrink: 0 }}>{item.sets}</span>
                </div>
                <div style={{ fontSize: 12, color: T.sub, lineHeight: 1.5 }}>{item.desc}</div>
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
          style={{ background: T.card, border: `1px solid ${T.border}`, color: T.light, borderRadius: 99, fontSize: 12.5, fontWeight: 700, padding: "9px 16px", cursor: "pointer", fontFamily: "inherit", display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 14 }}
        >
          <ArrowLeft size={15} strokeWidth={2.4} /> Wróć do treningu
        </button>
      )}
      <div className="fu" style={{ background: T.accentSoftBg, border: `1px solid ${T.accentSoftBorder}`, borderRadius: 16, padding: "12px 14px", marginBottom: 18, fontSize: 12, color: T.soft, lineHeight: 1.6 }}>
        💡 Zawsze zacznij od <strong style={{ color: T.accent }}>bazy</strong>, potem aktywacja{" "}
        <strong style={{ color: T.accent }}>właściwa dla danego dnia</strong>. Łącznie ok. 8–10 minut.
      </div>
      {Object.values(WARMUP_DATA).map((d, i) => (
        <WarmupSection key={i} data={d} idx={i} />
      ))}
    </div>
  );
}
