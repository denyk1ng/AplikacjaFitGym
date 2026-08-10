import { useState } from "react";
import { createPortal } from "react-dom";
import { Play, Plus, TrendingUp, CalendarClock } from "lucide-react";
import { T, TR } from "../theme.js";

const U = "'Urbanist',sans-serif";

// Krótki przewodnik po pierwszym onboardingu — 4 kroki tłumaczące, gdzie co
// jest. Pokazywany raz (klucz walkthrough_done ustawia App.jsx po zamknięciu);
// portal na body, żeby nałożyć się na dashboard renderowany pod spodem.
const STEPS = [
  {
    Icon: Play,
    title: "Zacznij trening jednym klikiem",
    desc: "Limonkowa karta na górze Domu zawsze pokazuje, co dziś trenujesz — dzisiejszy plan albo zaległość z tygodnia. Klikasz i jesteś w sesji.",
  },
  {
    Icon: Plus,
    title: "Sesja prowadzi Cię za rękę",
    desc: "Zaliczasz serię, oceniasz jak była ciężka (RPE), a przerwa odlicza się sama z sygnałem. Przesuń kartę ćwiczenia palcem w bok, żeby przeskoczyć zajętą maszynę.",
  },
  {
    Icon: TrendingUp,
    title: "Postępy zapisują się same",
    desc: "Każda zmiana ciężaru trafia na wykres w Statystykach. Tam też ustawisz serie i powtórzenia oraz zobaczysz rekordy życiowe i odznaki.",
  },
  {
    Icon: CalendarClock,
    title: "Tydzień pod kontrolą",
    desc: "Treningi A, B i C możesz robić w dowolne dni — ważne, żeby wszystkie trzy wpadły do niedzieli. Kalendarz i pierścień na Domu pilnują tego za Ciebie.",
  },
];

export function WelcomeTour({ onDone }) {
  const [step, setStep] = useState(0);
  const s = STEPS[step];
  const last = step === STEPS.length - 1;

  return createPortal(
    <div style={{ position: "fixed", inset: 0, zIndex: 2500 }}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(23,23,23,0.82)", backdropFilter: "blur(4px)" }} />
      <div className="slideup" style={{ position: "absolute", left: 0, right: 0, bottom: 0, maxWidth: 430, margin: "0 auto", background: T.card2, borderRadius: "26px 26px 0 0", padding: "26px 22px calc(30px + env(safe-area-inset-bottom))" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
          <div style={{ display: "flex", gap: 6 }}>
            {STEPS.map((_, i) => (
              <span key={i} style={{ width: i === step ? 22 : 7, height: 7, borderRadius: 99, background: i <= step ? T.accent : T.track, transition: TR.dot }} />
            ))}
          </div>
          <button onClick={onDone} style={{ background: "transparent", border: "none", color: T.sub, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: U }}>
            Pomiń
          </button>
        </div>

        <div key={step} className="fu">
          <div style={{ width: 58, height: 58, borderRadius: 18, background: T.accentSoftBg, border: `1px solid ${T.accentSoftBorder}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <s.Icon size={24} color={T.accent} strokeWidth={2.2} />
          </div>
          <div style={{ fontFamily: U, fontWeight: 700, fontSize: "1.25rem", color: "#fff", marginTop: 14, lineHeight: 1.2 }}>{s.title}</div>
          <p style={{ fontSize: 13, color: T.sub, lineHeight: 1.6, margin: "10px 0 0", minHeight: 82 }}>{s.desc}</p>
        </div>

        <button
          onClick={() => (last ? onDone() : setStep(step + 1))}
          style={{ width: "100%", marginTop: 20, background: T.accent, color: "#000", border: "none", borderRadius: 99, fontFamily: U, fontWeight: 700, fontSize: 14.5, padding: "15px 20px", cursor: "pointer", boxShadow: T.accentGlow }}
        >
          {last ? "Zaczynamy!" : "Dalej"}
        </button>
      </div>
    </div>,
    document.body
  );
}
