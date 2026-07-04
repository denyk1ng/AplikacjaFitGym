import { useState } from "react";
import { ChevronDown, ArrowLeft, Zap, Dumbbell, Footprints, ArrowUpFromLine, Lightbulb, Layers, Clock, Check, PersonStanding } from "lucide-react";
import { T, FONT_NUM } from "../theme.js";
import { WARMUP_DATA } from "../data/plan.js";
import { PHOTOS } from "../data/photos.js";

const U = "'Urbanist',sans-serif";
const SECTION_ICON = { zap: Zap, a: Dumbbell, b: Footprints, c: ArrowUpFromLine };
const DAY_KEYS = ["A", "B", "C"];

function StatCell({ Icon, label, value, unit, sub, divider }) {
  return (
    <div style={{ flex: 1, padding: "12px 6px 12px 14px", borderLeft: divider ? `1px solid ${T.borderSoft}` : "none" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 7 }}>
        <Icon size={13} color={T.accent} strokeWidth={2.4} />
        <span style={{ fontSize: 11.5, fontWeight: 700, color: "#fff", fontFamily: U }}>{label}</span>
      </div>
      <div style={{ fontFamily: FONT_NUM, fontWeight: 800, fontSize: "1.35rem", color: T.light, lineHeight: 1 }}>
        {value}
        {unit && <span style={{ fontSize: 11 }}>{unit}</span>}
      </div>
      <div style={{ fontSize: 10, color: T.sub, marginTop: 5 }}>{sub}</div>
    </div>
  );
}

// postać z pomarańczową poświatą — grafika kafelka dnia rozgrzewki
function DayGlyph({ size = 60 }) {
  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <div style={{ position: "absolute", inset: -10, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,77,0,0.4) 0%, rgba(255,77,0,0) 72%)" }} />
      <div
        style={{
          position: "relative",
          width: size,
          height: size,
          borderRadius: "50%",
          background: "linear-gradient(160deg, rgba(255,77,0,0.22), rgba(255,77,0,0.05))",
          border: `1.5px solid ${T.accentSoftBorder}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: T.accentGlow,
        }}
      >
        <PersonStanding size={size * 0.56} color={T.accent} strokeWidth={2} />
      </div>
    </div>
  );
}

function WarmupSection({ data, idx, done, toggle }) {
  const [open, setOpen] = useState(true);
  const Icon = SECTION_ICON[data.iconKey] || Zap;
  const doneCount = data.items.filter((_, i) => done[`${idx}-${i}`]).length;
  const allDone = doneCount === data.items.length;
  return (
    <div className="fu" style={{ animationDelay: `${idx * 0.08}s`, background: T.card, border: `1px solid ${allDone ? "rgba(52,211,153,0.3)" : T.borderSoft}`, borderRadius: 20, overflow: "hidden", marginBottom: 10, transition: "border-color .3s" }}>
      <div onClick={() => setOpen(!open)} style={{ padding: "13px 14px", cursor: "pointer", display: "flex", alignItems: "center", gap: 12, borderBottom: open ? `1px solid ${T.borderSoft}` : "none" }}>
        <span
          style={{
            width: 44,
            height: 44,
            borderRadius: 14,
            background: allDone ? "rgba(52,211,153,0.14)" : `${data.color}18`,
            border: `1px solid ${allDone ? "rgba(52,211,153,0.35)" : `${data.color}30`}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            transition: "all .3s",
          }}
        >
          {allDone ? <Check size={19} color={T.ok} strokeWidth={2.8} /> : <Icon size={19} color={data.color} strokeWidth={2.2} />}
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: U, fontWeight: 700, fontSize: "0.95rem", color: "#fff" }}>{data.label}</div>
          <div style={{ fontSize: 11.5, color: T.sub, marginTop: 1 }}>{data.sublabel}</div>
        </div>
        <span style={{ fontFamily: FONT_NUM, fontWeight: 800, fontSize: 12, color: allDone ? T.ok : T.faint, flexShrink: 0 }}>
          {doneCount}/{data.items.length}
        </span>
        <ChevronDown size={18} color={T.faint} strokeWidth={2.4} style={{ transition: "transform .25s", transform: open ? "rotate(180deg)" : "none", flexShrink: 0 }} />
      </div>
      {open && (
        <div style={{ padding: "6px 14px 12px" }}>
          {data.items.map((item, i) => {
            const key = `${idx}-${i}`;
            const on = !!done[key];
            return (
              <div
                key={i}
                className="fu"
                onClick={() => toggle(key)}
                style={{ animationDelay: `${i * 0.07}s`, display: "flex", gap: 12, padding: "12px 0", borderBottom: i < data.items.length - 1 ? `1px solid ${T.borderSoft}` : "none", cursor: "pointer" }}
              >
                <span
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: "50%",
                    background: on ? T.ok : "transparent",
                    border: `1.5px solid ${on ? T.ok : data.color}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    marginTop: 1,
                    transition: "all .2s",
                  }}
                >
                  {on && <Check size={13} color="#000" strokeWidth={3} />}
                </span>
                <div style={{ flex: 1, opacity: on ? 0.5 : 1, transition: "opacity .2s" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3, flexWrap: "wrap" }}>
                    <span style={{ fontWeight: 600, fontSize: 13, color: "#fff", textDecoration: on ? "line-through" : "none" }}>{item.name}</span>
                    <span style={{ background: `${data.color}16`, borderRadius: 99, padding: "2px 9px", fontSize: 11, fontWeight: 700, color: data.color, flexShrink: 0 }}>{item.sets}</span>
                  </div>
                  <div style={{ fontSize: 12, color: T.sub, lineHeight: 1.55 }}>{item.desc}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// wspólny hero ze zdjęciem — dzielony przez ekran wyboru dnia i przebieg rozgrzewki
function Hero({ onBack }) {
  return (
    <div style={{ position: "relative", height: 220 }}>
      <img src={PHOTOS.stretch} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(6,9,16,0.45) 0%, rgba(6,9,16,0.1) 35%, rgba(6,9,16,0.6) 100%)" }} />
      {onBack && (
        <button
          onClick={onBack}
          style={{
            position: "absolute",
            top: "calc(18px + env(safe-area-inset-top))",
            left: 18,
            width: 40,
            height: 40,
            borderRadius: 13,
            background: "rgba(6,9,16,0.65)",
            backdropFilter: "blur(8px)",
            border: "none",
            color: "#fff",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <ArrowLeft size={18} strokeWidth={2.2} />
        </button>
      )}
    </div>
  );
}

// ── EKRAN WYBORU DNIA — trzy kafelki A/B/C ─────────────────────────────────
function DayPicker({ onBack, onPick }) {
  return (
    <div style={{ margin: "-20px -18px 0", paddingBottom: 100 }}>
      <Hero onBack={onBack} />
      <div style={{ position: "relative", marginTop: -26, background: T.bg, borderRadius: "26px 26px 0 0", padding: "10px 18px 0" }}>
        <div style={{ width: 44, height: 4, borderRadius: 99, background: T.border, margin: "0 auto 14px" }} />

        <div className="fu" style={{ fontFamily: U, fontWeight: 700, fontSize: "1.5rem", color: "#fff", lineHeight: 1.15 }}>
          Rozgrzewka
        </div>
        <div className="fu" style={{ animationDelay: ".05s", fontSize: 12.5, color: T.soft, marginTop: 4, marginBottom: 18 }}>
          Wybierz dzień treningowy — pokażemy bazę i aktywację dopasowaną do niego
        </div>

        <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
          {DAY_KEYS.map((k, i) => {
            const d = WARMUP_DATA[k];
            const count = WARMUP_DATA.BASE.items.length + d.items.length;
            return (
              <button
                key={k}
                onClick={() => onPick(k)}
                className="fu"
                style={{
                  animationDelay: `${0.1 + i * 0.08}s`,
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 10,
                  background: T.card,
                  border: `1px solid ${T.borderSoft}`,
                  borderRadius: 20,
                  padding: "20px 8px 16px",
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                <DayGlyph />
                <span style={{ fontFamily: U, fontWeight: 700, fontSize: 13.5, color: "#fff", textAlign: "center" }}>Rozgrzewka {k}</span>
                <span style={{ fontSize: 9.5, color: T.sub, textAlign: "center", lineHeight: 1.4 }}>{d.sublabel.replace("Aktywacja — ", "")}</span>
                <span style={{ fontFamily: FONT_NUM, fontWeight: 800, fontSize: 11, color: T.accent, marginTop: 2 }}>{count} ćwiczeń</span>
              </button>
            );
          })}
        </div>

        <div className="fu" style={{ animationDelay: ".34s", display: "flex", gap: 10, alignItems: "flex-start", background: T.card, border: `1px solid ${T.borderSoft}`, borderRadius: 16, padding: "12px 14px", fontSize: 12, color: T.soft, lineHeight: 1.6 }}>
          <Lightbulb size={15} color={T.accent} strokeWidth={2.2} style={{ flexShrink: 0, marginTop: 2 }} />
          <span>
            Każda rozgrzewka łączy <strong style={{ color: T.accent }}>bazę</strong> (rozruch ogólny) z{" "}
            <strong style={{ color: T.accent }}>aktywacją pod partie dnia</strong>. Łącznie ok. 8–10 minut.
          </span>
        </div>
      </div>
    </div>
  );
}

// ── PRZEBIEG ROZGRZEWKI DLA WYBRANEGO DNIA ─────────────────────────────────
function WarmupFlow({ day, onBack }) {
  const [done, setDone] = useState({});
  const toggle = (key) => setDone((d) => ({ ...d, [key]: !d[key] }));

  const sections = [WARMUP_DATA.BASE, WARMUP_DATA[day]];
  const totalItems = sections.reduce((s, d) => s + d.items.length, 0);
  const doneTotal = Object.values(done).filter(Boolean).length;

  return (
    <div key={day} style={{ margin: "-20px -18px 0", paddingBottom: 100 }}>
      <Hero onBack={onBack} />
      <div style={{ position: "relative", marginTop: -26, background: T.bg, borderRadius: "26px 26px 0 0", padding: "10px 18px 0" }}>
        <div style={{ width: 44, height: 4, borderRadius: 99, background: T.border, margin: "0 auto 14px" }} />

        <div className="fu" style={{ fontFamily: U, fontWeight: 700, fontSize: "1.5rem", color: "#fff", lineHeight: 1.15 }}>
          Rozgrzewka <span style={{ color: T.accent }}>{day}</span>
        </div>
        <div className="fu" style={{ animationDelay: ".05s", fontSize: 12.5, color: T.soft, marginTop: 4, marginBottom: 16 }}>
          Baza, potem aktywacja pod trening {day} — rób w tej kolejności
        </div>

        <div className="fu" style={{ animationDelay: ".1s", display: "flex", background: T.card, border: `1px solid ${T.borderSoft}`, borderRadius: 18, marginBottom: 16 }}>
          <StatCell Icon={Layers} label="Sekcje" value={sections.length} sub="baza + dzień" />
          <StatCell Icon={Dumbbell} label="Ćwiczenia" value={totalItems} sub={`${doneTotal} zaliczone`} divider />
          <StatCell Icon={Clock} label="Czas" value="8–10" unit=" min" sub="łącznie" divider />
        </div>

        {sections.map((d, i) => (
          <WarmupSection key={i} data={d} idx={i} done={done} toggle={toggle} />
        ))}
      </div>
    </div>
  );
}

export function WarmupTab({ onBack }) {
  const [day, setDay] = useState(null);
  if (day) return <WarmupFlow day={day} onBack={() => setDay(null)} />;
  return <DayPicker onBack={onBack} onPick={setDay} />;
}
