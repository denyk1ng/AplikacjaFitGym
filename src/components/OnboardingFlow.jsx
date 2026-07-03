import { useEffect, useState } from "react";
import { ArrowLeft, Check, Dumbbell, Flame, HeartPulse, Trophy, Play } from "lucide-react";
import { T, FONT_NUM } from "../theme.js";
import { PHOTOS } from "../data/photos.js";
import { storage } from "../lib/storage.js";
import { LogoMark } from "./Logo.jsx";

const U = "'Urbanist',sans-serif";

const GOALS = [
  { id: "muscle", label: "Budowa mięśni", Icon: Dumbbell },
  { id: "cut", label: "Redukcja", Icon: Flame },
  { id: "fit", label: "Forma i zdrowie", Icon: HeartPulse },
  { id: "strength", label: "Siła", Icon: Trophy },
];
const LEVELS = [
  { id: "beginner", label: "Początkujący", sub: "nowy lub wracający na siłownię" },
  { id: "intermediate", label: "Średniozaawansowany", sub: "6+ miesięcy treningu" },
  { id: "advanced", label: "Zaawansowany", sub: "2+ lata, systematycznie" },
];
const DAY_HINTS = {
  1: "Lepiej niż nic — ale efekty przyjdą wolno",
  2: "Minimum do utrzymania formy",
  3: "Idealnie pod Twój plan A / B / C",
  4: "3 siłowe + 1 cardio — dobry układ",
  5: "Twój pełny plan: 3 siłowe + 2 cardio",
  6: "Pamiętaj o regeneracji",
  7: "Mięśnie rosną w dni wolne — zostaw 1 dzień",
};

const SLIDES = [
  { photo: PHOTOS.hero, title: "Wiesz dokładnie,\nco robić", desc: "Gotowy plan A / B / C z ciężarami i techniką — wchodzisz na siłownię i działasz." },
  { photo: PHOTOS.C, title: "Buduj serie,\nnie wymówki", desc: "Kalendarz tygodnia pilnuje treningów i przypomina o zaległych do niedzieli." },
  { photo: PHOTOS.cardio, title: "Zobacz realny\nprogres", desc: "Ciężary, serie i waga ciała na wykresach — czarno na białym." },
];

// ── wspólne drobne elementy ────────────────────────────────────────────────
function PrimaryBtn({ children, onClick, style }) {
  return (
    <button
      onClick={onClick}
      style={{ width: "100%", background: T.accent, color: "#000", border: "none", borderRadius: 99, fontFamily: U, fontWeight: 700, fontSize: 15, padding: "16px 24px", cursor: "pointer", boxShadow: T.accentGlow, ...style }}
    >
      {children}
    </button>
  );
}

function RadioMark({ on }) {
  return on ? (
    <span style={{ width: 22, height: 22, borderRadius: "50%", background: T.accent, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      <Check size={13} color="#000" strokeWidth={3.2} />
    </span>
  ) : (
    <span style={{ width: 22, height: 22, borderRadius: "50%", border: `1.5px solid ${T.border}`, flexShrink: 0 }} />
  );
}

// ── INTRO CAROUSEL ─────────────────────────────────────────────────────────
function Intro({ onDone }) {
  const [i, setI] = useState(0);
  const s = SLIDES[i];
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 2000, background: T.bg, overflow: "hidden" }}>
      <img key={i} src={s.photo} alt="" className="fu" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(6,9,16,0.5) 0%, rgba(6,9,16,0.25) 40%, rgba(6,9,16,0.96) 82%)" }} />
      <button onClick={onDone} style={{ position: "absolute", top: 22, right: 20, background: "rgba(6,9,16,0.5)", border: `1px solid ${T.border}`, color: T.soft, borderRadius: 99, fontSize: 12, fontWeight: 600, padding: "8px 14px", cursor: "pointer", fontFamily: U }}>
        Pomiń
      </button>
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, padding: "0 24px 42px", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
        <div key={`t${i}`} className="fu" style={{ fontFamily: U, fontWeight: 700, fontSize: "1.9rem", lineHeight: 1.2, color: "#fff", whiteSpace: "pre-line" }}>
          {s.title}
        </div>
        <div key={`d${i}`} className="fu" style={{ animationDelay: ".08s", marginTop: 10, fontSize: 13.5, color: "rgba(255,255,255,0.66)", lineHeight: 1.6, maxWidth: 300 }}>
          {s.desc}
        </div>
        <div style={{ display: "flex", gap: 6, margin: "22px 0 24px" }}>
          {SLIDES.map((_, d) => (
            <span key={d} style={{ width: d === i ? 24 : 8, height: 5, borderRadius: 99, background: d === i ? "#fff" : "rgba(255,255,255,0.28)", transition: "all .3s" }} />
          ))}
        </div>
        <PrimaryBtn onClick={() => (i < SLIDES.length - 1 ? setI(i + 1) : onDone())}>
          {i < SLIDES.length - 1 ? "Dalej" : "Zaczynamy"}
        </PrimaryBtn>
      </div>
    </div>
  );
}

// ── KREATOR 5 KROKÓW ───────────────────────────────────────────────────────
function Wizard({ onDone }) {
  const [step, setStep] = useState(0);
  const [data, setData] = useState({ goal: "muscle", level: "intermediate", gender: null, days: 5, age: "", height: "", weight: "" });

  const steps = [
    { title: "Jaki jest Twój cel?", sub: "Wokół tego zbudujemy Twój plan" },
    { title: "Twój poziom?", sub: "Szczerze — dopasujemy trudność" },
    { title: "Powiedz coś o sobie", sub: "To personalizuje plan" },
    { title: "Ile dni w tygodniu?", sub: "Realnie — ile dasz radę" },
    { title: "Kilka szczegółów", sub: "Ustawią wagę startową i śledzenie progresu" },
  ];

  const canNext =
    step === 2 ? !!data.gender : step === 4 ? data.age && data.height && data.weight : true;

  const next = () => (step < 4 ? setStep(step + 1) : onDone(data));

  const optCard = (on) => ({
    display: "flex",
    alignItems: "center",
    gap: 12,
    width: "100%",
    textAlign: "left",
    background: on ? "rgba(255,77,0,0.12)" : T.card,
    border: `1.5px solid ${on ? T.accent : T.borderSoft}`,
    borderRadius: 16,
    padding: "15px 16px",
    cursor: "pointer",
    fontFamily: U,
    marginBottom: 10,
    transition: "all .15s",
  });

  const inputStyle = {
    width: "100%",
    background: T.card,
    border: `1.5px solid ${T.borderSoft}`,
    borderRadius: 14,
    color: "#fff",
    padding: "14px 15px",
    fontSize: 16,
    fontWeight: 600,
    fontFamily: U,
    outline: "none",
    boxSizing: "border-box",
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 2000, background: T.bg, display: "flex", flexDirection: "column", padding: "22px 18px 30px", overflowY: "auto" }}>
      {/* nagłówek */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 14 }}>
        <button
          onClick={() => step > 0 && setStep(step - 1)}
          style={{ width: 38, height: 38, borderRadius: 12, background: T.card, border: `1px solid ${T.borderSoft}`, color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, opacity: step === 0 ? 0.35 : 1 }}
        >
          <ArrowLeft size={17} strokeWidth={2.2} />
        </button>
        <div>
          <div style={{ fontFamily: U, fontWeight: 700, fontSize: "1.25rem", color: "#fff", lineHeight: 1.15 }}>{steps[step].title}</div>
          <div style={{ fontSize: 11.5, color: T.sub, marginTop: 3 }}>{steps[step].sub}</div>
        </div>
      </div>

      {/* pasek postępu */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 22 }}>
        <div style={{ flex: 1, height: 5, borderRadius: 99, background: T.track, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${((step + 1) / 5) * 100}%`, borderRadius: 99, background: T.accent, transition: "width .35s cubic-bezier(.22,1,.36,1)" }} />
        </div>
        <span style={{ fontSize: 11, color: T.sub, fontWeight: 700, fontFamily: FONT_NUM }}>{step + 1}/5</span>
      </div>

      {/* treść kroku */}
      <div key={step} className="fu" style={{ flex: 1 }}>
        {step === 0 &&
          GOALS.map(({ id, label, Icon }) => (
            <button key={id} onClick={() => setData({ ...data, goal: id })} style={optCard(data.goal === id)}>
              <span style={{ width: 36, height: 36, borderRadius: 11, background: data.goal === id ? T.accent : T.inset, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Icon size={17} color={data.goal === id ? "#000" : T.soft} strokeWidth={2.2} />
              </span>
              <span style={{ flex: 1, fontSize: 14.5, fontWeight: 700, color: "#fff" }}>{label}</span>
              <RadioMark on={data.goal === id} />
            </button>
          ))}

        {step === 1 &&
          LEVELS.map(({ id, label, sub }) => (
            <button key={id} onClick={() => setData({ ...data, level: id })} style={optCard(data.level === id)}>
              <span style={{ flex: 1 }}>
                <span style={{ display: "block", fontSize: 14.5, fontWeight: 700, color: "#fff" }}>{label}</span>
                <span style={{ display: "block", fontSize: 11.5, color: T.sub, marginTop: 2 }}>{sub}</span>
              </span>
              <RadioMark on={data.level === id} />
            </button>
          ))}

        {step === 2 && (
          <div style={{ display: "flex", gap: 12 }}>
            {[
              { id: "m", label: "Mężczyzna", glyph: "♂" },
              { id: "f", label: "Kobieta", glyph: "♀" },
            ].map(({ id, label, glyph }) => (
              <button
                key={id}
                onClick={() => setData({ ...data, gender: id })}
                style={{ flex: 1, aspectRatio: "1", background: data.gender === id ? "rgba(255,77,0,0.12)" : T.card, border: `1.5px solid ${data.gender === id ? T.accent : T.borderSoft}`, borderRadius: 20, cursor: "pointer", fontFamily: U, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, transition: "all .15s" }}
              >
                <span style={{ fontSize: 44, lineHeight: 1, color: data.gender === id ? T.accent : T.soft, fontWeight: 700 }}>{glyph}</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>{label}</span>
              </button>
            ))}
          </div>
        )}

        {step === 3 && (
          <>
            <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
              {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                <button
                  key={n}
                  onClick={() => setData({ ...data, days: n })}
                  style={{ flex: 1, aspectRatio: "1", borderRadius: "50%", background: data.days === n ? T.accent : T.card, border: `1.5px solid ${data.days === n ? T.accent : T.borderSoft}`, color: data.days === n ? "#000" : T.soft, fontFamily: FONT_NUM, fontWeight: 800, fontSize: 15, cursor: "pointer", transition: "all .15s" }}
                >
                  {n}
                </button>
              ))}
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.borderSoft}`, borderRadius: 14, padding: "13px 15px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 13.5, fontWeight: 700, color: "#fff", fontFamily: U }}>
                {data.days} {data.days === 1 ? "dzień" : "dni"} / tydzień
              </span>
              <span style={{ fontSize: 11, color: data.days === 5 || data.days === 3 ? T.accent : T.sub, textAlign: "right" }}>{DAY_HINTS[data.days]}</span>
            </div>
          </>
        )}

        {step === 4 && (
          <>
            <label style={{ display: "block", fontSize: 12, color: T.soft, fontWeight: 600, marginBottom: 7 }}>Wiek</label>
            <input value={data.age} onChange={(e) => setData({ ...data, age: e.target.value.replace(/\D/g, "") })} inputMode="numeric" placeholder="np. 24" style={{ ...inputStyle, marginBottom: 16 }} />
            <div style={{ display: "flex", gap: 12 }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: "block", fontSize: 12, color: T.soft, fontWeight: 600, marginBottom: 7 }}>Wzrost (cm)</label>
                <input value={data.height} onChange={(e) => setData({ ...data, height: e.target.value.replace(/\D/g, "") })} inputMode="numeric" placeholder="np. 180" style={inputStyle} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: "block", fontSize: 12, color: T.soft, fontWeight: 600, marginBottom: 7 }}>Waga (kg)</label>
                <input value={data.weight} onChange={(e) => setData({ ...data, weight: e.target.value.replace(/[^\d.,]/g, "") })} inputMode="decimal" placeholder="np. 84,5" style={inputStyle} />
              </div>
            </div>
          </>
        )}
      </div>

      <PrimaryBtn onClick={next} style={{ opacity: canNext ? 1 : 0.4, pointerEvents: canNext ? "auto" : "none", marginTop: 18 }}>
        {step < 4 ? "Dalej" : "Zbuduj mój plan"}
      </PrimaryBtn>
    </div>
  );
}

// ── BUDOWANIE PLANU ────────────────────────────────────────────────────────
function Building({ data, onDone }) {
  const [ticks, setTicks] = useState(0);
  const goalLabel = GOALS.find((g) => g.id === data.goal)?.label || "";
  const items = [`Cel: ${goalLabel.toLowerCase()}`, `${data.days} dni / tydzień`, "Dobieranie ćwiczeń A / B / C"];
  useEffect(() => {
    const t = [setTimeout(() => setTicks(1), 700), setTimeout(() => setTicks(2), 1500), setTimeout(() => setTicks(3), 2300), setTimeout(onDone, 3100)];
    return () => t.forEach(clearTimeout);
  }, [onDone]);
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 2000, background: T.bg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 32 }}>
      <div style={{ width: 56, height: 56, borderRadius: "50%", border: "4px solid transparent", borderTopColor: T.accent, borderRightColor: T.accent, animation: "spin 0.9s linear infinite", marginBottom: 22 }} />
      <div style={{ fontFamily: U, fontWeight: 700, fontSize: "1.2rem", color: "#fff" }}>Buduję Twój plan…</div>
      <div style={{ fontSize: 12, color: T.sub, marginTop: 5, textAlign: "center" }}>Dopasowuję ćwiczenia do celu, poziomu i grafiku</div>
      <div style={{ marginTop: 30, display: "flex", flexDirection: "column", gap: 14, minWidth: 220 }}>
        {items.map((it, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, opacity: ticks > i ? 1 : 0.35, transition: "opacity .3s" }}>
            {ticks > i ? (
              <span style={{ width: 20, height: 20, borderRadius: "50%", background: T.accent, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Check size={12} color="#000" strokeWidth={3.2} />
              </span>
            ) : (
              <span style={{ width: 20, height: 20, borderRadius: "50%", border: `1.5px solid ${T.border}`, flexShrink: 0 }} />
            )}
            <span style={{ fontSize: 13, color: ticks > i ? "#fff" : T.sub, fontWeight: 600, fontFamily: U }}>{it}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── PLAN GOTOWY ────────────────────────────────────────────────────────────
function Ready({ data, onDone }) {
  const goalLabel = GOALS.find((g) => g.id === data.goal)?.label || "";
  const levelLabel = LEVELS.find((l) => l.id === data.level)?.label || "";
  const tiles = [
    { v: "03", l: "dni siłowe" },
    { v: "23", l: "ćwiczenia" },
    { v: "60", l: "min śr." },
  ];
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 2000, background: T.bg, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", padding: "54px 24px 0", textAlign: "center", position: "relative", zIndex: 1 }}>
        <div className="pop" style={{ width: 68, height: 68, borderRadius: "50%", background: T.accent, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: T.accentGlow }}>
          <Check size={32} color="#000" strokeWidth={3} />
        </div>
        <div className="fu" style={{ animationDelay: ".15s", fontFamily: U, fontWeight: 700, fontSize: "1.6rem", color: "#fff", marginTop: 18 }}>
          Twój plan jest gotowy!
        </div>
        <div className="fu" style={{ animationDelay: ".25s", fontSize: 12, color: T.sub, marginTop: 4 }}>
          Plan {data.days}-dniowy, zbudowany dla Ciebie
        </div>
        <div className="fu" style={{ animationDelay: ".35s", marginTop: 20 }}>
          <div style={{ fontFamily: U, fontWeight: 700, fontSize: "1.05rem", color: "#fff" }}>
            {goalLabel} · {levelLabel}
          </div>
          <div style={{ fontSize: 11.5, color: T.sub, marginTop: 2 }}>Plan spersonalizowany</div>
        </div>
        <div className="fu" style={{ animationDelay: ".45s", display: "flex", gap: 10, marginTop: 20, width: "100%", maxWidth: 340 }}>
          {tiles.map((t) => (
            <div key={t.l} style={{ flex: 1, background: T.card, border: `1px solid ${T.borderSoft}`, borderRadius: 16, padding: "14px 8px" }}>
              <div style={{ fontFamily: FONT_NUM, fontWeight: 800, fontSize: "1.4rem", color: "#fff" }}>{t.v}</div>
              <div style={{ fontSize: 10, color: T.sub, fontWeight: 600, marginTop: 3 }}>{t.l}</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ position: "relative", height: "38%" }}>
        <img src={PHOTOS.B} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
        <div style={{ position: "absolute", inset: 0, background: `linear-gradient(180deg, ${T.bg} 0%, rgba(6,9,16,0.35) 45%, rgba(6,9,16,0.85) 100%)` }} />
        <div style={{ position: "absolute", left: 24, right: 24, bottom: 34 }}>
          <PrimaryBtn onClick={onDone}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
              <Play size={15} color="#000" fill="#000" strokeWidth={0} />
              Zacznij trenować
            </span>
          </PrimaryBtn>
        </div>
      </div>
    </div>
  );
}

// ── CAŁY FLOW ──────────────────────────────────────────────────────────────
export function OnboardingFlow({ onDone }) {
  const [stage, setStage] = useState("intro");
  const [data, setData] = useState(null);

  const finishWizard = async (d) => {
    setData(d);
    // zapis do profilu + waga startowa
    try {
      const p = await storage.get("profile");
      const profile = p && p.value ? JSON.parse(p.value) : {};
      const weight = parseFloat(String(d.weight).replace(",", "."));
      await storage.set(
        "profile",
        JSON.stringify({ ...profile, goal: d.goal, level: d.level, gender: d.gender, daysPerWeek: d.days, age: parseInt(d.age) || null, height: parseInt(d.height) || profile.height || 180 })
      );
      if (!isNaN(weight) && weight > 0) {
        const l = await storage.get("body_weight_log");
        const log = l && l.value ? JSON.parse(l.value) : [];
        if (log.length === 0) {
          const now = new Date();
          log.push({ ts: now.getTime(), dateShort: now.toLocaleDateString("pl-PL", { day: "numeric", month: "short" }), kg: Math.round(weight * 10) / 10 });
          await storage.set("body_weight_log", JSON.stringify(log));
        }
      }
    } catch (e) {}
    setStage("building");
  };

  if (stage === "intro") return <Intro onDone={() => setStage("wizard")} />;
  if (stage === "wizard") return <Wizard onDone={finishWizard} />;
  if (stage === "building") return <Building data={data} onDone={() => setStage("ready")} />;
  return <Ready data={data} onDone={onDone} />;
}
