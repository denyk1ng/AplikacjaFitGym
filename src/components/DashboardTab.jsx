import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Bell, BellRing, Play, Dumbbell, Check, Medal, X, ChevronRight, Target, Quote, Trophy, Flame, Zap, TrendingUp } from "lucide-react";
import { T } from "../theme.js";
import { EXERCISES_DATA } from "../data/plan.js";
import { PHOTOS } from "../data/photos.js";
import { computeTotalGain, isoWeekStart, estimateWorkoutMin } from "../lib/utils.js";
import { loadWorkoutLog, weekStatus, suggestToday, logStreak, PLAN_DOW, DOW_NAMES, weekHistory, weekVolumes, weekEntries, typicalHour } from "../lib/workoutLog.js";
import { loadSettings } from "../lib/settings.js";
import { dailyQuote } from "../lib/quotes.js";
import { useCountUp } from "../hooks/useCountUp.js";
import { Ring } from "./Ring.jsx";

const H = "'Urbanist',sans-serif";
const D = "'Doto',sans-serif";
// skróty dni tygodnia dla łańcucha passy (pon.–niedz., jak isoWeekStart)
const DOW_SHORT = ["PN", "WT", "ŚR", "CZ", "PT", "SB", "ND"];

function SectionHead({ title, onSee, delay }) {
  return (
    <div className="fu" style={{ animationDelay: delay || "0s", display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
      <span style={{ fontFamily: H, fontWeight: 700, fontSize: "0.98rem", color: "#fff" }}>{title}</span>
      {onSee && (
        <button onClick={onSee} style={{ background: "transparent", border: "none", color: T.accent, fontSize: 11.5, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", padding: 0 }}>
          Zobacz wszystkie
        </button>
      )}
    </div>
  );
}

export function DashboardTab({ snapshots, exercises, goTraining, goTo, userName }) {
  const dow = new Date().getDay();
  const isCardio = dow === 2 || dow === 4;
  const gain = computeTotalGain(snapshots);
  const weekStart = isoWeekStart(Date.now());

  const cGain = useCountUp(gain, 1100);

  // dziennik treningów — podpowiedź dnia + postęp tygodnia
  const [log, setLog] = useState([]);
  const [showNotif, setShowNotif] = useState(false);
  useEffect(() => {
    loadWorkoutLog().then(setLog);
  }, []);

  // cel miesiąca: liczba treningów A/B/C w bieżącym miesiącu kalendarzowym
  // (wartość celu edytowalna w Profilu, klucz monthly_goal)
  const monthlyGoal = (() => {
    const v = parseInt(localStorage.getItem("monthly_goal") || "12", 10);
    return !isNaN(v) && v > 0 ? v : 12;
  })();
  const now = new Date();
  const monthDone = log.filter((e) => {
    const d = new Date(e.ts);
    return ["A", "B", "C"].includes(e.type) && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;
  const monthPct = Math.min(monthDone / monthlyGoal, 1);
  const monthName = now.toLocaleDateString("pl-PL", { month: "long" });

  // seria tygodni z dziennika treningów — to samo źródło co w Statystykach
  // (wcześniej Dom liczył ją z zapisów ciężarów i liczby się rozjeżdżały)
  const streak = logStreak(log);
  const cStreak = useCountUp(streak, 800);

  const settings = loadSettings();
  const st = weekStatus(log);
  const doneCount = ["A", "B", "C"].filter((k) => st[k].done).length;
  const suggestion = suggestToday(log);

  // powiadomienia generowane ze stanu (lokalne, bez backendu)
  const notifs = [];
  if (settings.overdueAlert)
    ["A", "B", "C"].forEach((k) => {
      if (st[k].overdue)
        notifs.push({
          Icon: BellRing,
          warn: true,
          t: `Zaległy ${EXERCISES_DATA[k].label}`,
          d: `planowo ${DOW_NAMES[PLAN_DOW[k]]} — nadrób do niedzieli`,
          go: () => goTraining(k),
        });
    });
  const typHour = typicalHour(log);
  const nearUsualTime = typHour !== null && Math.abs(new Date().getHours() - typHour) <= 1;
  if (settings.remindPlan && suggestion && !suggestion.overdue)
    notifs.push({
      Icon: Dumbbell,
      t: nearUsualTime ? `Zwykle trenujesz teraz — ${EXERCISES_DATA[suggestion.type].label}` : `Dziś na planie: ${EXERCISES_DATA[suggestion.type].label}`,
      d: `${exercises[suggestion.type].exercises.length} ćwiczeń · ~${estimateWorkoutMin(exercises[suggestion.type].exercises)} min`,
      go: () => goTraining(suggestion.type),
    });

  // objętości tygodniowe — potrzebne do wyzwania "pobij objętość"
  const vols3 = weekVolumes(log, EXERCISES_DATA, 3);
  const lastWeekVol = vols3[vols3.length - 2]?.vol || 0;
  if (snapshots.length >= 2) {
    const lastS = snapshots[snapshots.length - 1];
    const prevMax = {};
    snapshots.slice(0, -1).forEach((s) =>
      Object.entries(s.weights || {}).forEach(([id, w]) => {
        prevMax[id] = Math.max(prevMax[id] ?? -Infinity, w);
      })
    );
    const recs = Object.entries(lastS.weights || {}).filter(([id, w]) => prevMax[id] !== undefined && w > prevMax[id]);
    if (recs.length > 0)
      notifs.push({
        Icon: Medal,
        t: recs.length === 1 ? "Nowy rekord ciężaru" : `Nowe rekordy: ${recs.length}`,
        d: "ostatni zapis pobił wcześniejsze maksima — zobacz statystyki",
        go: () => goTo("stats"),
      });
  }
  if (doneCount === 3)
    notifs.push({
      Icon: Check,
      t: "Komplet tygodnia!",
      d: "A, B i C zaliczone — cardio i regeneracja",
      go: () => goTo("kalendarz"),
    });
  const hasAlert = notifs.some((n) => n.warn);

  // słupki progresu: ukończone treningi A/B/C per tydzień, 5 ostatnich tygodni
  const weekBars = weekHistory(log, 5).map((w) => w.done / 3);

  const dateStr = new Date().toLocaleDateString("pl-PL", { weekday: "long", day: "numeric", month: "long" });

  // cytat dnia — deterministyczny, zmienia się o północy (src/lib/quotes.js)
  const quote = dailyQuote();

  // wyzwanie tygodnia — rotacja 3 typów po numerze tygodnia; postęp liczony
  // z dziennika, więc aktualizuje się sam po każdej zapisanej sesji
  const WEEK_MS = 7 * 24 * 3600 * 1000;
  const fmtV = (v) => (v >= 1000 ? `${(Math.round(v / 100) / 10).toString().replace(".", ",")}k` : String(Math.round(v)));
  const wkEntries = weekEntries(log);
  const curWeekVol = vols3[vols3.length - 1]?.vol || 0;
  const chType = Math.floor(weekStart / WEEK_MS) % 3;
  const challenge =
    chType === 1
      ? { label: "Zalicz 60 serii w tym tygodniu", cur: wkEntries.reduce((s, e) => s + (e.sets || 0), 0), target: 60, fmt: (v) => String(v) }
      : chType === 2 && lastWeekVol > 0
        ? { label: "Pobij objętość zeszłego tygodnia", cur: curWeekVol, target: lastWeekVol, fmt: fmtV, beat: true }
        : { label: "Zrób komplet: A + B + C", cur: doneCount, target: 3, fmt: (v) => String(v) };
  const chDone = challenge.beat ? challenge.cur > challenge.target : challenge.cur >= challenge.target;
  const chPct = Math.min(challenge.cur / Math.max(challenge.target, 1), 1);

  // łańcuch passy — dni bieżącego tygodnia (pon.–niedz.): ile aktywności
  // wylądowało w dzienniku danego dnia; dzisiejszy dzień z obwódką
  const dayCounts = (() => {
    const c = [0, 0, 0, 0, 0, 0, 0];
    wkEntries.forEach((e) => {
      c[(new Date(e.ts).getDay() + 6) % 7]++;
    });
    return c;
  })();
  const todayIdx = (new Date().getDay() + 6) % 7;

  // pigułki kategorii na górze — szybkie wejścia w Rozgrzewkę / A / B / C / Cardio.
  // Podświetlona jest OSTATNIO KLIKNIĘTA pigułka (klucz last_cat, przeżywa
  // powrót i restart appki); zanim cokolwiek klikniesz — sugestia na dziś.
  const [activeCat, setActiveCat] = useState(() => {
    try {
      return localStorage.getItem("last_cat") || null;
    } catch (e) {
      return null;
    }
  });
  const pickCat = (l, go) => {
    setActiveCat(l);
    try {
      localStorage.setItem("last_cat", l);
    } catch (e) {}
    go();
  };
  const defaultCat = suggestion ? `Trening ${suggestion.type}` : isCardio ? "Cardio" : null;
  const litCat = activeCat || defaultCat;
  const cats = [
    { photo: PHOTOS.stretch, l: "Rozgrzewka", go: () => goTo("rozgrzewka") },
    { photo: PHOTOS.A, l: "Trening A", go: () => goTraining("A") },
    { photo: PHOTOS.B, l: "Trening B", go: () => goTraining("B") },
    { photo: PHOTOS.C, l: "Trening C", go: () => goTraining("C") },
    { photo: PHOTOS.cardio, l: "Cardio", go: () => goTo("kalendarz") },
  ].map((c) => ({ ...c, act: c.l === litCat }));

  // karta hero: dzisiejszy plan → zaległości → cardio/regeneracja/komplet
  const heroChip = { border: "1.5px solid rgba(255,255,255,0.6)", color: "#000", background: "rgba(255,255,255,0.10)", boxShadow: "0 0 12px rgba(255,255,255,0.25)" };
  const hero = suggestion
    ? {
        chip: suggestion.overdue && settings.overdueAlert ? "ZALEGŁY TRENING" : "DZIŚ NA PLANIE",
        chipStyle: suggestion.overdue && settings.overdueAlert ? { background: "#171717", color: T.accent } : heroChip,
        title: EXERCISES_DATA[suggestion.type].label,
        sub: suggestion.overdue
          ? `Nadrób do niedzieli — ${exercises[suggestion.type].exercises.length} ćwiczeń`
          : `${exercises[suggestion.type].exercises.length} ćwiczeń do zrobienia`,
        cta: "Zacznij trening",
        go: () => goTraining(suggestion.type),
      }
    : doneCount === 3
      ? { chip: "KOMPLET W TYM TYGODNIU", chipStyle: heroChip, title: "Wszystko zrobione", sub: "A, B i C zaliczone — cardio i regeneracja", cta: "Zobacz kalendarz", go: () => goTo("kalendarz") }
      : isCardio
        ? { chip: "DZIŚ NA PLANIE", chipStyle: heroChip, title: "Cardio + sauna", sub: "Bieżnia 12% · 3,5 km/h · 50 min", cta: "Zobacz kalendarz", go: () => goTo("kalendarz") }
        : { chip: "DZIŚ NA PLANIE", chipStyle: heroChip, title: "Regeneracja", sub: "Rozciąganie i pełny odpoczynek", cta: "Zobacz kalendarz", go: () => goTo("kalendarz") };


  return (
    <div>
      {/* HEADER — kompaktowy: avatar z cienką limonkową obwódką, data pod powitaniem */}
      <div className="fu" style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
        <button onClick={() => goTo("profil")} title="Profil" style={{ width: 44, height: 44, borderRadius: "50%", padding: 2, border: `1.5px solid ${T.accent}`, overflow: "hidden", cursor: "pointer", flexShrink: 0, background: T.bg }}>
          <img src={PHOTOS.hero} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }} />
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: H, fontWeight: 800, fontSize: "1.15rem", letterSpacing: "-0.01em", color: "#fff", lineHeight: 1.12, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            Cześć{userName ? `, ${userName}` : ""} 👋
          </div>
          <div style={{ fontSize: 11, color: T.sub, marginTop: 2 }}>{dateStr.charAt(0).toUpperCase() + dateStr.slice(1)}</div>
        </div>
        <button onClick={() => setShowNotif(true)} title="Powiadomienia" style={{ position: "relative", width: 40, height: 40, borderRadius: 14, background: T.card, border: `1px solid ${T.borderSoft}`, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Bell size={17} color="#fff" strokeWidth={2} />
          {hasAlert && (
            <span style={{ position: "absolute", top: 7, right: 8, width: 7, height: 7, borderRadius: "50%", background: T.accent, border: `1.5px solid ${T.card}` }} />
          )}
        </button>
      </div>

      {/* KATEGORIE — pigułki ze zdjęciem, aktywna z limonkowym obrysem i tekstem */}
      <SectionHead title="Kategorie" onSee={() => goTo("trening")} delay=".06s" />
      <div className="fu hscroll" style={{ animationDelay: ".08s", marginBottom: 20 }}>
        {cats.map(({ photo, l, act, go }) => (
          <button
            key={l}
            onClick={() => pickCat(l, go)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 7,
              flexShrink: 0,
              padding: "5px 13px 5px 5px",
              borderRadius: 99,
              border: `1.5px solid ${act ? T.accent : T.borderSoft}`,
              background: T.card,
              cursor: "pointer",
              fontFamily: "inherit",
              transition: "all .2s",
            }}
          >
            <span
              style={{
                width: 27,
                height: 27,
                borderRadius: "50%",
                flexShrink: 0,
                overflow: "hidden",
                border: `1.5px solid ${act ? T.accent : "transparent"}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <img src={photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </span>
            <span style={{ fontSize: 11.5, fontWeight: 700, color: act ? T.accent : "#fff", whiteSpace: "nowrap" }}>{l}</span>
          </button>
        ))}
      </div>

      {/* LIMONKOWA KARTA HERO — energetyczny gradient, smugi światła i raster,
          sportowa kursywa, neonowy CTA (dekoracje statyczne, czysty CSS/SVG) */}
      <div
        className="fu"
        style={{
          animationDelay: ".12s",
          position: "relative",
          overflow: "hidden",
          background: "radial-gradient(135% 175% at 8% -5%, #e4ff85 0%, #cdff4d 24%, #bcff31 50%, #a3e522 76%, #86be13 100%)",
          borderRadius: 24,
          padding: "16px 16px 14px",
          marginBottom: 20,
          boxShadow: "0 20px 48px rgba(188,255,49,0.16)",
        }}
      >
        {/* warstwa dekoracyjna wg konceptu: szerokie promienie u góry z prawej,
            gęsta wiązka falistych włókien światła przez środek, raster przy
            lewej krawędzi, iskry i winieta w ciemniejszym prawym dolnym rogu */}
        <div aria-hidden style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
          <div
            style={{
              position: "absolute",
              inset: 0,
              backgroundImage: "radial-gradient(rgba(0,0,0,0.13) 1.2px, transparent 1.2px)",
              backgroundSize: "11px 11px",
              WebkitMaskImage: "radial-gradient(58% 66% at 0% 58%, #000 0%, transparent 72%)",
              maskImage: "radial-gradient(58% 66% at 0% 58%, #000 0%, transparent 72%)",
            }}
          />
          <svg viewBox="0 0 394 200" preserveAspectRatio="none" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
            <defs>
              <filter id="heroBlurSoft" x="-40%" y="-40%" width="180%" height="180%">
                <feGaussianBlur stdDeviation="5" />
              </filter>
              <filter id="heroBlurFine" x="-40%" y="-40%" width="180%" height="180%">
                <feGaussianBlur stdDeviation="2" />
              </filter>
            </defs>
            <g filter="url(#heroBlurSoft)" stroke="#ffffff" strokeLinecap="round">
              <line x1="200" y1="-30" x2="424" y2="108" strokeWidth="20" opacity="0.20" />
              <line x1="256" y1="-42" x2="434" y2="72" strokeWidth="10" opacity="0.16" />
              <line x1="148" y1="-44" x2="362" y2="92" strokeWidth="6" opacity="0.12" />
            </g>
            <path d="M-10,124 C70,80 150,152 235,116 C315,82 362,118 404,94" fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth="7" strokeLinecap="round" filter="url(#heroBlurFine)" />
            <g fill="none" strokeLinecap="round">
              <path d="M-10,102 C55,62 135,126 218,96 C298,68 350,98 404,78" stroke="rgba(255,255,255,0.36)" strokeWidth="1.6" />
              <path d="M-10,112 C65,72 145,138 228,106 C308,76 356,108 404,86" stroke="rgba(255,255,255,0.22)" strokeWidth="1.2" />
              <path d="M-10,124 C70,80 150,152 235,116 C315,82 362,118 404,94" stroke="rgba(255,255,255,0.52)" strokeWidth="2.2" />
              <path d="M-10,133 C78,92 158,160 242,124 C318,92 366,126 404,102" stroke="rgba(255,255,255,0.18)" strokeWidth="1" />
              <path d="M-10,144 C85,106 168,170 250,136 C324,106 370,138 404,114" stroke="rgba(23,23,23,0.11)" strokeWidth="1.2" />
              <path d="M-10,154 C92,120 175,180 256,148 C328,120 374,148 404,128" stroke="rgba(255,255,255,0.30)" strokeWidth="1.4" />
              <path d="M-10,164 C98,132 182,190 262,160 C332,134 378,158 404,140" stroke="rgba(255,255,255,0.13)" strokeWidth="1" />
              <path d="M-10,176 C108,148 192,200 272,172 C340,148 382,168 404,152" stroke="rgba(23,23,23,0.08)" strokeWidth="1" />
            </g>
            <g fill="#ffffff">
              <circle cx="300" cy="178" r="1.2" opacity="0.30" />
              <circle cx="330" cy="160" r="1" opacity="0.35" />
              <circle cx="352" cy="150" r="1.4" opacity="0.30" />
              <circle cx="368" cy="172" r="1" opacity="0.25" />
              <circle cx="385" cy="140" r="1" opacity="0.20" />
              <circle cx="342" cy="184" r="1" opacity="0.25" />
            </g>
          </svg>
          <div style={{ position: "absolute", inset: 0, background: "radial-gradient(72% 62% at 100% 105%, rgba(23,23,23,0.20), transparent 62%)" }} />
        </div>

        <div style={{ position: "relative" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 9, fontWeight: 800, letterSpacing: ".1em", padding: "4px 10px", borderRadius: 99, marginBottom: 10, ...hero.chipStyle }}>
                <Zap size={10} color={hero.chipStyle.color} fill={hero.chipStyle.color} strokeWidth={0} />
                {hero.chip}
              </span>
              <div style={{ fontFamily: H, fontWeight: 800, fontStyle: "italic", fontSize: "1.6rem", letterSpacing: "-0.02em", color: "#000", lineHeight: 1, paddingRight: 6 }}>{hero.title}</div>
              <div style={{ fontSize: 11.5, color: "rgba(0,0,0,0.62)", marginTop: 5, fontWeight: 600, fontStyle: "italic" }}>{hero.sub}</div>
            </div>
            <div style={{ flexShrink: 0, borderRadius: "50%", boxShadow: "0 0 0 2px rgba(255,255,255,0.55), 0 0 16px rgba(255,255,255,0.35)" }}>
              <Ring pct={doneCount / 3} size={60} stroke={6.5} color="#000" track="rgba(0,0,0,0.14)">
                <span style={{ fontFamily: D, fontWeight: 800, fontSize: 13, color: "#000" }}>{doneCount}/3</span>
              </Ring>
            </div>
          </div>
          <div style={{ position: "relative", marginTop: 14 }}>
            {/* trailsy światła "przelatujące" za przyciskiem — wystają nad i pod pastylką */}
            <svg aria-hidden viewBox="0 0 380 84" preserveAspectRatio="none" style={{ position: "absolute", inset: "-15px -8px", width: "calc(100% + 16px)", height: "calc(100% + 30px)", pointerEvents: "none" }}>
              <g stroke="#ffffff" strokeLinecap="round">
                <line x1="0" y1="14" x2="380" y2="10" strokeWidth="1.4" opacity="0.45" />
                <line x1="14" y1="22" x2="366" y2="19" strokeWidth="1" opacity="0.25" />
                <line x1="0" y1="66" x2="380" y2="70" strokeWidth="1.4" opacity="0.40" />
                <line x1="20" y1="74" x2="360" y2="77" strokeWidth="1" opacity="0.22" />
              </g>
              <g stroke="#ecffb0" strokeLinecap="round">
                <line x1="0" y1="42" x2="52" y2="42" strokeWidth="2.2" opacity="0.85" />
                <line x1="328" y1="42" x2="380" y2="42" strokeWidth="2.2" opacity="0.85" />
              </g>
            </svg>
            <button
              onClick={hero.go}
              style={{
                position: "relative",
                overflow: "hidden",
                width: "100%",
                background: "#171717",
                color: "#fff",
                border: "none",
                borderRadius: 99,
                fontFamily: H,
                fontWeight: 800,
                fontStyle: "italic",
                fontSize: 13.5,
                padding: "13px 18px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 9,
                boxShadow: "0 0 0 1.5px rgba(222,255,122,0.9), 0 0 20px rgba(255,255,255,0.4), 0 8px 24px rgba(23,23,23,0.18), inset 0 1px 0 rgba(255,255,255,0.12)",
              }}
            >
              {/* połysk cyklicznie przelatujący po przycisku (keyframes ctaSheen w index.css) */}
              <span
                aria-hidden
                style={{
                  position: "absolute",
                  top: 0,
                  bottom: 0,
                  left: 0,
                  width: "40%",
                  background: "linear-gradient(105deg, transparent 0%, rgba(255,255,255,0.45) 40%, rgba(188,255,49,0.5) 60%, transparent 100%)",
                  transform: "translateX(-150%) skewX(-16deg)",
                  animation: "ctaSheen 3s cubic-bezier(.4,0,.2,1) 1.2s infinite",
                }}
              />
              <Play size={16} color={T.accent} fill={T.accent} strokeWidth={0} />
              {hero.cta}
            </button>
          </div>
        </div>
      </div>

      {/* AKTYWNOŚĆ — trzy kolumny wg projektu: pierścień+seria | słupki progresu | cel+łańcuch dni */}
      <SectionHead title="Aktywność" onSee={() => goTo("stats")} delay=".16s" />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 0.95fr 1.45fr", gap: 8, marginBottom: 8 }}>
        {/* Treningi (pierścień) + Seria */}
        <div className="fu" style={{ animationDelay: ".18s", background: T.card, border: `1px solid ${T.borderSoft}`, borderRadius: 18, padding: 10, display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <Check size={12} color={T.accent} strokeWidth={2.6} />
            <span style={{ fontSize: 10, color: T.soft, fontWeight: 700 }}>Treningi</span>
          </div>
          <div style={{ alignSelf: "center" }}>
            <Ring pct={doneCount / 3} size={72} stroke={7} color={T.accent}>
              <span style={{ fontFamily: D, fontWeight: 800, fontSize: 16, color: "#fff" }}>{doneCount}/3</span>
            </Ring>
          </div>
          <div style={{ marginTop: "auto" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <Flame size={12} color={T.accent} strokeWidth={2.4} />
              <span style={{ fontSize: 10, color: T.soft, fontWeight: 700 }}>Seria</span>
            </div>
            <div style={{ fontSize: 9.5, color: T.sub, fontWeight: 600, marginTop: 3 }}>
              <strong style={{ color: "#fff", fontFamily: D, fontWeight: 800, fontSize: 14 }}>{Math.round(cStreak)}</strong> tyg. z rzędu
            </div>
          </div>
        </div>
        {/* Progres — słupki tygodni jak korektor */}
        <div className="fu" style={{ animationDelay: ".21s", background: T.card, border: `1px solid ${T.borderSoft}`, borderRadius: 18, padding: 10, display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <TrendingUp size={12} color={T.accent} strokeWidth={2.4} />
            <span style={{ fontSize: 10, color: T.soft, fontWeight: 700 }}>Progres</span>
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "center", gap: 6, height: 56, flex: 1 }}>
            {weekBars.map((v, i) => (
              <div key={i} style={{ width: 9, height: `${Math.max(v * 100, 10)}%`, borderRadius: 99, background: i === weekBars.length - 1 ? T.accent : "rgba(188,255,49,0.30)" }} />
            ))}
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 9.5, color: T.sub, fontWeight: 600 }}>
              <strong style={{ color: "#fff", fontFamily: D, fontWeight: 800, fontSize: 14 }}>
                {gain >= 0 ? "+" : ""}
                {Math.round(cGain * 10) / 10}
              </strong>{" "}
              kg łącznie
            </div>
            {gain > 0 && <div style={{ fontSize: 9, color: T.sub, marginTop: 2 }}>Świetna robota!</div>}
          </div>
        </div>
        {/* Cel miesiąca + łańcuch dni tygodnia (kolumna dwóch kart) */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div className="fu" style={{ animationDelay: ".24s", background: T.card, border: `1px solid ${T.borderSoft}`, borderRadius: 18, padding: 10, flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Target size={13} color={T.accent} strokeWidth={2.3} />
              <span style={{ flex: 1, minWidth: 0, fontSize: 11, fontWeight: 700, color: "#fff", fontFamily: H, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>Cel na {monthName}</span>
              <span style={{ fontFamily: D, fontWeight: 800, fontSize: 13, color: monthDone >= monthlyGoal ? T.ok : T.accent }}>
                {monthDone}
                <span style={{ color: T.sub, fontSize: 10 }}>/{monthlyGoal}</span>
              </span>
            </div>
            <div style={{ height: 6, borderRadius: 99, background: T.track, marginTop: 8, overflow: "hidden" }}>
              <div style={{ width: `${monthPct * 100}%`, height: "100%", borderRadius: 99, background: monthDone >= monthlyGoal ? T.ok : T.accent, transition: "width .6s cubic-bezier(.22,1,.36,1)" }} />
            </div>
            <div style={{ fontSize: 9, color: T.faint, marginTop: 6, lineHeight: 1.45 }}>
              {monthDone >= monthlyGoal
                ? "Cel osiągnięty — tak trzymaj!"
                : `Jeszcze ${monthlyGoal - monthDone} ${monthlyGoal - monthDone === 1 ? "trening" : monthlyGoal - monthDone < 5 ? "treningi" : "treningów"} do celu — zmienisz cel w Profilu`}
            </div>
          </div>
          <div className="fu" style={{ animationDelay: ".27s", background: T.card, border: `1px solid ${T.borderSoft}`, borderRadius: 18, padding: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Flame size={13} color={T.accent} strokeWidth={2.3} />
              <span style={{ fontSize: 11, fontWeight: 700, color: "#fff", fontFamily: H }}>Łańcuch passy</span>
            </div>
            <div style={{ fontSize: 9, color: T.sub, marginTop: 2 }}>{streak} tyg. z rzędu</div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
              {dayCounts.map((c, i) => (
                <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
                  <span
                    style={{
                      width: 16,
                      height: 16,
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: c > 0 ? T.accent : T.track,
                      border: `1.5px solid ${i === todayIdx ? T.accent : "transparent"}`,
                      color: c > 0 ? "#000" : T.faint,
                      fontFamily: D,
                      fontWeight: 800,
                      fontSize: 9,
                    }}
                  >
                    {c > 0 ? c : "·"}
                  </span>
                  <span style={{ fontSize: 6.5, fontWeight: 700, color: i === todayIdx ? T.accent : T.faint, fontFamily: D }}>{DOW_SHORT[i]}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* WYZWANIE TYGODNIA — pozioma karta: opis po lewej, licznik i pasek po prawej */}
      <div className="fu" style={{ animationDelay: ".29s", display: "flex", alignItems: "center", gap: 11, background: T.card, border: `1px solid ${chDone ? "rgba(52,211,153,0.35)" : T.borderSoft}`, borderRadius: 18, padding: "12px 14px", marginBottom: 8 }}>
        <Trophy size={17} color={chDone ? T.ok : T.accent} strokeWidth={2.2} style={{ flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: "#fff", fontFamily: H }}>Wyzwanie tygodnia</div>
          <div style={{ fontSize: 10.5, color: T.sub, marginTop: 2 }}>{challenge.label}</div>
        </div>
        <div style={{ width: 128, flexShrink: 0 }}>
          <div style={{ textAlign: "right", fontFamily: D, fontWeight: 800, fontSize: 14, color: chDone ? T.ok : T.accent }}>
            {challenge.fmt(challenge.cur)}
            <span style={{ color: T.sub, fontSize: 11 }}>/{challenge.fmt(challenge.target)}</span>
          </div>
          <div style={{ height: 6, borderRadius: 99, background: T.track, marginTop: 5, overflow: "hidden" }}>
            <div style={{ width: `${chPct * 100}%`, height: "100%", borderRadius: 99, background: chDone ? T.ok : T.accent, transition: "width .6s cubic-bezier(.22,1,.36,1)" }} />
          </div>
        </div>
      </div>

      {/* CYTAT DNIA — karta z dużym limonkowym cudzysłowem */}
      <div className="fu" style={{ animationDelay: ".3s", display: "flex", gap: 12, alignItems: "flex-start", background: T.card, border: `1px solid ${T.borderSoft}`, borderRadius: 18, padding: "13px 16px", marginBottom: 20 }}>
        <Quote size={19} color={T.accent} fill={T.accent} strokeWidth={0} style={{ flexShrink: 0, transform: "rotate(180deg)", marginTop: 1 }} />
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 12.5, color: T.light, lineHeight: 1.6, fontStyle: "italic" }}>{quote.t}</div>
          {quote.a && <div style={{ fontSize: 10, color: T.faint, marginTop: 6, fontWeight: 600 }}>— {quote.a}</div>}
        </div>
      </div>

      {/* TWOJE TRENINGI */}
      <SectionHead title="Twoje treningi" onSee={() => goTo("trening")} delay=".3s" />
      <div className="hscroll" style={{ marginBottom: 8 }}>
        {["A", "B", "C"].map((k, i) => (
          <div
            key={k}
            className="fu"
            onClick={() => goTraining(k)}
            style={{ animationDelay: `${0.32 + i * 0.05}s`, position: "relative", width: 150, height: 190, borderRadius: 18, overflow: "hidden", flexShrink: 0, cursor: "pointer", border: `1px solid ${T.border}` }}
          >
            <img src={PHOTOS[k]} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(23,23,23,0) 32%, rgba(23,23,23,0.96) 100%)" }} />
            {st[k].done && (
              <span style={{ position: "absolute", top: 10, right: 10, width: 26, height: 26, borderRadius: "50%", background: T.ok, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Check size={15} color="#000" strokeWidth={3} />
              </span>
            )}
            <div style={{ position: "absolute", inset: 0, padding: 12, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
              <span style={{ alignSelf: "flex-start", background: st[k].done ? T.ok : T.accent, color: "#000", fontSize: 9.5, fontWeight: 800, letterSpacing: ".02em", padding: "4px 10px", borderRadius: 99, marginBottom: 8 }}>
                {st[k].done ? "ZROBIONY" : EXERCISES_DATA[k].day}
              </span>
              <div style={{ fontFamily: H, fontWeight: 800, fontSize: "1rem", letterSpacing: "-0.01em", color: "#fff", lineHeight: 1.1 }}>{EXERCISES_DATA[k].label}</div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.65)", marginTop: 3 }}>
                {EXERCISES_DATA[k].exercises.length} ćwiczeń · ~{estimateWorkoutMin(exercises[k] ? exercises[k].exercises : EXERCISES_DATA[k].exercises)} min
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* PANEL POWIADOMIEŃ */}
      {showNotif &&
        createPortal(
          <div style={{ position: "fixed", inset: 0, zIndex: 1600 }}>
            <div onClick={() => setShowNotif(false)} style={{ position: "absolute", inset: 0, background: "rgba(23,23,23,0.7)", backdropFilter: "blur(3px)" }} />
            <div className="slideup" style={{ position: "absolute", left: 0, right: 0, bottom: 0, maxWidth: 430, margin: "0 auto", background: T.card2, borderRadius: "26px 26px 0 0", padding: "20px 20px calc(30px + env(safe-area-inset-bottom))", maxHeight: "72vh", overflowY: "auto" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                <span style={{ fontFamily: H, fontWeight: 700, fontSize: "1.15rem", color: "#fff" }}>Powiadomienia</span>
                <button onClick={() => setShowNotif(false)} aria-label="Zamknij" style={{ width: 34, height: 34, borderRadius: 11, background: T.inset, border: "none", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <X size={16} strokeWidth={2.4} />
                </button>
              </div>
              {notifs.length === 0 ? (
                <div style={{ textAlign: "center", padding: "26px 10px 18px" }}>
                  <span style={{ width: 52, height: 52, borderRadius: "50%", background: T.inset, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                    <Bell size={21} color={T.soft} strokeWidth={2} />
                  </span>
                  <div style={{ fontSize: 13, color: T.sub, marginTop: 12, lineHeight: 1.6 }}>
                    Wszystko ogarnięte — brak powiadomień.
                  </div>
                </div>
              ) : (
                notifs.map((n, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setShowNotif(false);
                      n.go && n.go();
                    }}
                    style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "12px 4px", background: "transparent", border: "none", borderBottom: i < notifs.length - 1 ? `1px solid ${T.borderSoft}` : "none", cursor: "pointer", textAlign: "left", fontFamily: "inherit" }}
                  >
                    <span style={{ width: 40, height: 40, borderRadius: 13, background: n.warn ? "rgba(251,191,36,0.13)" : T.inset, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <n.Icon size={17} color={n.warn ? T.yellow : T.accent} strokeWidth={2.2} />
                    </span>
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#fff", fontFamily: H }}>{n.t}</span>
                      <span style={{ display: "block", fontSize: 11, color: T.sub, marginTop: 2 }}>{n.d}</span>
                    </span>
                    <ChevronRight size={15} color={T.faint} strokeWidth={2.2} />
                  </button>
                ))
              )}
              <p style={{ fontSize: 10, color: T.faint, textAlign: "center", margin: "14px 0 0" }}>
                Rodzaje powiadomień włączasz w Profilu → Ustawienia.
              </p>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
