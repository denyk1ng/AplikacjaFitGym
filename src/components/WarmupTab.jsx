import { useState } from "react";
import { ChevronDown, ArrowLeft, Zap, Dumbbell, Footprints, ArrowUpFromLine, Lightbulb, Layers, Clock, Check } from "lucide-react";
import { T, FONT_NUM, TR, stagger } from "../theme.js";
import { WARMUP_DATA } from "../data/plan.js";
import { PHOTOS, WARMUP_PHOTOS } from "../data/photos.js";

const U = "'Urbanist',sans-serif";
const SECTION_ICON = { zap: Zap, a: Dumbbell, b: Footprints, c: ArrowUpFromLine };
const DAY_KEYS = ["A", "B", "C"];

// zdjęcia A/C są portretowe (postać stojąca) — w szerokim, niskim kadrze
// domyślne centrowanie ucina głowę, więc kadr trzymamy wyżej; B jest już
// poziome i dobrze wypada wyśrodkowane
const WARMUP_PHOTO_POS = { A: "center 20%", B: "center 42%", C: "center 15%" };

// hero jest dużo szerszy/niższy niż kafelek dnia, więc dla tego samego zdjęcia
// widoczny jest inny, węższy wycinek wysokości — C potrzebuje niżej niż w kafelku,
// żeby złapać twarz/bark zamiast samej ściany za postacią
const HERO_PHOTO_POS = { A: "center 20%", B: "center 42%", C: "center 40%" };

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

// kompaktowa karta ze zdjęciem dnia (trzy obok siebie w rzędzie) — osobne
// zdjęcia niż Trening A/B/C, żeby się nie powielały
function DayCard({ dayKey, onClick, delay }) {
  const d = WARMUP_DATA[dayKey];
  const count = WARMUP_DATA.BASE.items.length + d.items.length;
  const muscleRaw = d.sublabel.replace("Aktywacja — ", "").split(" + ")[0];
  const muscle = muscleRaw.charAt(0).toUpperCase() + muscleRaw.slice(1);
  return (
    <button
      onClick={onClick}
      className="fu"
      style={{
        animationDelay: delay,
        flex: 1,
        minWidth: 0,
        display: "flex",
        flexDirection: "column",
        textAlign: "left",
        background: T.card,
        border: `1px solid ${T.borderSoft}`,
        borderRadius: 18,
        overflow: "hidden",
        padding: 0,
        cursor: "pointer",
        fontFamily: "inherit",
      }}
    >
      <div style={{ position: "relative", height: 128 }}>
        <img src={WARMUP_PHOTOS[dayKey]} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: WARMUP_PHOTO_POS[dayKey] }} />
        <div style={{ position: "absolute", inset: 0, background: `linear-gradient(180deg, rgba(23,23,23,0) 35%, ${T.card} 100%)` }} />
        <div style={{ position: "absolute", left: 8, right: 8, bottom: 6 }}>
          <span
            style={{
              fontFamily: U,
              fontStyle: "italic",
              fontWeight: 800,
              fontSize: "1.02rem",
              color: "#fff",
              letterSpacing: "-0.01em",
              textShadow: "0 2px 10px rgba(0,0,0,0.55)",
            }}
          >
            {dayKey}
          </span>
        </div>
      </div>
      <div style={{ padding: "7px 8px 9px", textAlign: "center" }}>
        <div style={{ fontSize: 9.5, fontWeight: 700, color: T.accent }}>{muscle}</div>
        <div style={{ fontFamily: FONT_NUM, fontWeight: 800, fontSize: 10, color: T.faint, marginTop: 3 }}>{count} ćw.</div>
      </div>
    </button>
  );
}

function WarmupSection({ data, idx, done, toggle }) {
  const [open, setOpen] = useState(true);
  const Icon = SECTION_ICON[data.iconKey] || Zap;
  const doneCount = data.items.filter((_, i) => done[`${idx}-${i}`]).length;
  const allDone = doneCount === data.items.length;
  return (
    <div className="sil" style={{ animationDelay: stagger(idx), background: T.card, border: `1px solid ${allDone ? "rgba(52,211,153,0.3)" : T.borderSoft}`, borderRadius: 20, overflow: "hidden", marginBottom: 10, transition: "border-color .3s" }}>
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
            transition: TR.colors,
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
        <div style={{ padding: "8px 14px 6px" }}>
          {data.items.map((item, i) => {
            const key = `${idx}-${i}`;
            const on = !!done[key];
            const last = i === data.items.length - 1;
            return (
              <div key={i} className="sil" onClick={() => toggle(key)} style={{ animationDelay: stagger(i, 0.12), display: "flex", gap: 12, cursor: "pointer" }}>
                <div style={{ width: 26, display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
                  <span
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: "50%",
                      background: on ? T.ok : T.card,
                      border: `1.5px solid ${on ? T.ok : data.color}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      fontFamily: FONT_NUM,
                      fontWeight: 800,
                      fontSize: 12,
                      color: on ? "#06210f" : data.color,
                      transition: TR.colorsFast,
                    }}
                  >
                    {on ? <Check size={13} color="#06210f" strokeWidth={3} /> : i + 1}
                  </span>
                  {!last && <span style={{ width: 2, flex: 1, marginTop: 3, marginBottom: 3, borderRadius: 2, background: on ? T.ok : T.faint, opacity: on ? 0.55 : 0.3, transition: "background .2s, opacity .2s" }} />}
                </div>
                <div style={{ flex: 1, minWidth: 0, paddingBottom: last ? 10 : 18 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4, opacity: on ? 0.5 : 1 }}>
                    <span style={{ fontWeight: 600, fontSize: 13, color: "#fff", textDecoration: on ? "line-through" : "none" }}>{item.name}</span>
                    <span style={{ background: `${data.color}16`, borderRadius: 99, padding: "2px 9px", fontSize: 11, fontWeight: 700, color: data.color, flexShrink: 0 }}>{item.sets}</span>
                  </div>
                  <div style={{ fontSize: 12, color: T.sub, lineHeight: 1.55, opacity: on ? 0.5 : 1 }}>{item.desc}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// wspólny hero ze zdjęciem — dzielony przez ekran wyboru dnia i przebieg rozgrzewki;
// na ekranie wyboru pokazuje ogólne zdjęcie, w przebiegu — zdjęcie wybranego dnia
function Hero({ onBack, photo = PHOTOS.stretch, height = 220, objectPosition = "center" }) {
  return (
    <div style={{ position: "relative", height }}>
      <img key={photo} src={photo} alt="" className="fu" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition }} />
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(23,23,23,0.45) 0%, rgba(23,23,23,0.1) 35%, rgba(23,23,23,0.6) 100%)" }} />
      <div className="filmic" />
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
            background: "rgba(23,23,23,0.65)",
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
          Wybierz dzień treningowy — zobacz co wchodzi w skład i ile to zajmie
        </div>

        <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
          {DAY_KEYS.map((k, i) => (
            <DayCard key={k} dayKey={k} onClick={() => onPick(k)} delay={`${0.1 + i * 0.08}s`} />
          ))}
        </div>

        <div className="fu" style={{ animationDelay: ".34s", display: "flex", gap: 10, alignItems: "flex-start", background: T.card, border: `1px solid ${T.borderSoft}`, borderRadius: 16, padding: "12px 14px", marginTop: 4, fontSize: 12, color: T.soft, lineHeight: 1.6 }}>
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

// odhaczenia rozgrzewki trzymamy w localStorage z datą — wyjście do innej
// zakładki (remount) nie kasuje postępu; nowy dzień zaczyna od zera
const WARMUP_KEY = "warmup_progress";
function loadWarmupProgress(day) {
  try {
    const s = JSON.parse(localStorage.getItem(WARMUP_KEY) || "null");
    if (s && s.date === new Date().toLocaleDateString("sv-SE") && s.day === day) return s.done || {};
  } catch (e) {}
  return {};
}
function saveWarmupProgress(day, done) {
  try {
    localStorage.setItem(WARMUP_KEY, JSON.stringify({ date: new Date().toLocaleDateString("sv-SE"), day, done }));
  } catch (e) {}
}

// ── PRZEBIEG ROZGRZEWKI DLA WYBRANEGO DNIA ─────────────────────────────────
function WarmupFlow({ day, onBack }) {
  const [done, setDone] = useState(() => loadWarmupProgress(day));
  const toggle = (key) =>
    setDone((d) => {
      const next = { ...d, [key]: !d[key] };
      saveWarmupProgress(day, next);
      return next;
    });

  const sections = [WARMUP_DATA.BASE, WARMUP_DATA[day]];
  const totalItems = sections.reduce((s, d) => s + d.items.length, 0);
  const doneTotal = Object.values(done).filter(Boolean).length;

  return (
    <div key={day} style={{ margin: "-20px -18px 0", paddingBottom: 100 }}>
      <Hero onBack={onBack} photo={WARMUP_PHOTOS[day]} height={165} objectPosition={HERO_PHOTO_POS[day]} />

      {/* karta tytułowa "wypływa" i nachodzi na dół zdjęcia */}
      <div
        className="fu"
        style={{
          position: "relative",
          margin: "-40px 18px 0",
          background: T.card,
          border: `1px solid ${T.borderSoft}`,
          borderRadius: 20,
          padding: "16px 16px 14px",
          boxShadow: "0 12px 30px rgba(0,0,0,0.4)",
        }}
      >
        <div style={{ fontFamily: U, fontStyle: "italic", fontWeight: 800, fontSize: "1.35rem", color: "#fff", lineHeight: 1.1, letterSpacing: "-0.01em" }}>
          Rozgrzewka <span style={{ color: T.accent }}>{day}</span>
        </div>
        <div style={{ fontSize: 11.5, color: T.sub, marginTop: 4 }}>Baza, potem aktywacja pod trening {day} — rób w tej kolejności</div>

        <div style={{ display: "flex", background: T.inset, borderRadius: 16, marginTop: 14 }}>
          <StatCell Icon={Layers} label="Sekcje" value={sections.length} sub="baza + dzień" />
          <StatCell Icon={Dumbbell} label="Ćwiczenia" value={totalItems} sub={`${doneTotal} zaliczone`} divider />
          <StatCell Icon={Clock} label="Czas" value="8–10" unit=" min" sub="łącznie" divider />
        </div>
      </div>

      <div style={{ padding: "18px 18px 0" }}>
        {sections.map((d, i) => (
          <WarmupSection key={i} data={d} idx={i} done={done} toggle={toggle} />
        ))}
      </div>
    </div>
  );
}

export function WarmupTab({ onBack }) {
  // wróć do rozpoczętej dziś rozgrzewki zamiast znowu pytać o dzień
  const [day, setDay] = useState(() => {
    try {
      const s = JSON.parse(localStorage.getItem(WARMUP_KEY) || "null");
      if (s && s.date === new Date().toLocaleDateString("sv-SE") && s.day) return s.day;
    } catch (e) {}
    return null;
  });
  if (day) return <WarmupFlow day={day} onBack={() => setDay(null)} />;
  return <DayPicker onBack={onBack} onPick={setDay} />;
}
