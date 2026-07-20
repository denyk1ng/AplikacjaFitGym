import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Bell, BellRing, Moon, HeartPulse, Play, Dumbbell, Check, Medal, X, ChevronRight, BarChart3, Target, Quote, Trophy, Flame } from "lucide-react";
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

function SectionHead({ title, onSee, delay }) {
  return (
    <div className="fu" style={{ animationDelay: delay || "0s", display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
      <span style={{ fontFamily: H, fontWeight: 700, fontSize: "1.02rem", color: "#fff" }}>{title}</span>
      {onSee && (
        <button onClick={onSee} style={{ background: "transparent", border: "none", color: T.accent, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
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
  const [summaryDismissed, setSummaryDismissed] = useState(false);
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
      info: true, // informacyjne = niebieski akcent (limonka zostaje dla osiągnięć)
      t: nearUsualTime ? `Zwykle trenujesz teraz — ${EXERCISES_DATA[suggestion.type].label}` : `Dziś na planie: ${EXERCISES_DATA[suggestion.type].label}`,
      d: `${exercises[suggestion.type].exercises.length} ćwiczeń · ~${estimateWorkoutMin(exercises[suggestion.type].exercises)} min`,
      go: () => goTraining(suggestion.type),
    });

  // cotygodniowe podsumowanie — pokazuje się raz na tydzień, gdy poprzedni
  // tydzień miał jakąkolwiek aktywność; bez backendu więc to powiadomienie
  // w appce, nie push po zamknięciu appki
  const hist3 = weekHistory(log, 3);
  const vols3 = weekVolumes(log, EXERCISES_DATA, 3);
  const lastWeek = hist3[hist3.length - 2];
  const weekBefore = hist3[hist3.length - 3];
  const lastWeekVol = vols3[vols3.length - 2]?.vol || 0;
  const weekBeforeVol = vols3[vols3.length - 3]?.vol || 0;
  const summarySeenWeek = localStorage.getItem("week_summary_seen");
  if (lastWeek && (lastWeek.done > 0 || lastWeekVol > 0) && summarySeenWeek !== String(weekStart)) {
    const doneDelta = lastWeek.done - (weekBefore?.done || 0);
    const volDelta = weekBeforeVol > 0 ? Math.round(((lastWeekVol - weekBeforeVol) / weekBeforeVol) * 100) : null;
    notifs.push({
      Icon: BarChart3,
      info: true,
      t: "Podsumowanie tygodnia",
      d: `${lastWeek.done}/3 treningi (${doneDelta > 0 ? "+" : ""}${doneDelta} vs poprzedni)${volDelta !== null ? ` · objętość ${volDelta > 0 ? "+" : ""}${volDelta}%` : ""}`,
      go: () => {
        localStorage.setItem("week_summary_seen", String(weekStart));
        goTo("kalendarz");
      },
    });
  }
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

  // słupki serii: ukończone treningi A/B/C per tydzień (spójne z podpisem
  // "tyg. z rzędu" — wcześniej liczyły zapisy ciężarów, czyli inną metrykę)
  const weekBars = weekHistory(log, 4).map((w) => w.done / 3);

  // prawdziwy mini-wykres progresu: suma ciężarów z kolejnych zapisów
  // (wcześniej hardkodowana dekoracja udająca dane)
  const sparkPts = (() => {
    const totals = snapshots.slice(-12).map((s) => Object.values(s.weights || {}).reduce((a, b) => a + b, 0));
    if (totals.length < 2) return null;
    const min = Math.min(...totals);
    const max = Math.max(...totals);
    const span = max - min || 1;
    return totals.map((v, i) => `${(i / (totals.length - 1)) * 72},${28 - ((v - min) / span) * 22}`).join(" ");
  })();

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

  // łańcuch passy — 8 ostatnich tygodni jako ogniwa (tydzień z ≥1 treningiem
  // podtrzymuje passę); wizualne "nie przerwij łańcucha"
  const chain = weekHistory(log, 8);

  // sugestia deloadu: 5+ tygodni treningu bez przerwy — organizm początkującego
  // potrzebuje lżejszego tygodnia (te same ćwiczenia, ok. 60% ciężarów);
  // przypomnienie raz na tydzień, do zamknięcia
  const [deloadDismissed, setDeloadDismissed] = useState(false);
  const deloadSeen = (() => {
    try {
      return localStorage.getItem("deload_seen");
    } catch (e) {
      return null;
    }
  })();
  const showDeload = streak >= 5 && !deloadDismissed && deloadSeen !== String(weekStart);
  const dismissDeload = () => {
    try {
      localStorage.setItem("deload_seen", String(weekStart));
    } catch (e) {}
    setDeloadDismissed(true);
  };

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
  const hero = suggestion
    ? {
        chip: suggestion.overdue && settings.overdueAlert ? "ZALEGŁY TRENING" : "DZIŚ NA PLANIE",
        chipStyle: suggestion.overdue && settings.overdueAlert ? { background: "#171717", color: T.accent } : { background: "rgba(0,0,0,0.14)", color: "#000" },
        title: EXERCISES_DATA[suggestion.type].label,
        sub: suggestion.overdue
          ? `Nadrób do niedzieli — ${exercises[suggestion.type].exercises.length} ćwiczeń`
          : `${exercises[suggestion.type].exercises.length} ćwiczeń do zrobienia`,
        cta: "Zacznij trening",
        go: () => goTraining(suggestion.type),
      }
    : doneCount === 3
      ? { chip: "KOMPLET W TYM TYGODNIU", chipStyle: { background: "rgba(0,0,0,0.14)", color: "#000" }, title: "Wszystko zrobione", sub: "A, B i C zaliczone — cardio i regeneracja", cta: "Zobacz kalendarz", go: () => goTo("kalendarz") }
      : isCardio
        ? { chip: "DZIŚ NA PLANIE", chipStyle: { background: "rgba(0,0,0,0.14)", color: "#000" }, title: "Cardio + sauna", sub: "Bieżnia 12% · 3,5 km/h · 50 min", cta: "Zobacz kalendarz", go: () => goTo("kalendarz") }
        : { chip: "DZIŚ NA PLANIE", chipStyle: { background: "rgba(0,0,0,0.14)", color: "#000" }, title: "Regeneracja", sub: "Rozciąganie i pełny odpoczynek", cta: "Zobacz kalendarz", go: () => goTo("kalendarz") };


  return (
    <div>
      {/* HEADER */}
      <div className="fu" style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <button onClick={() => goTo("profil")} style={{ width: 46, height: 46, borderRadius: "50%", padding: 0, border: `1.5px solid ${T.accentSoftBorder}`, overflow: "hidden", cursor: "pointer", flexShrink: 0, background: T.card }}>
          <img src={PHOTOS.hero} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: H, fontWeight: 700, fontSize: "1.18rem", color: "#fff", lineHeight: 1.15, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            Cześć{userName ? `, ${userName}` : ""} 👋
          </div>
          <div style={{ fontSize: 11.5, color: T.sub, marginTop: 2 }}>{dateStr.charAt(0).toUpperCase() + dateStr.slice(1)}</div>
        </div>
        <button onClick={() => setShowNotif(true)} title="Powiadomienia" style={{ position: "relative", width: 42, height: 42, borderRadius: "50%", background: T.card, border: `1px solid ${T.border}`, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Bell size={18} color="#fff" strokeWidth={2} />
          {hasAlert && (
            <span style={{ position: "absolute", top: 9, right: 10, width: 7, height: 7, borderRadius: "50%", background: T.yellow, border: `1.5px solid ${T.card}` }} />
          )}
        </button>
      </div>

      {/* KATEGORIE — pigułki z kolorowym kółkiem ikony, aktywna podświetlona limonką */}
      <SectionHead title="Kategorie" onSee={() => goTo("trening")} delay=".06s" />
      <div className="fu hscroll" style={{ animationDelay: ".08s", marginBottom: 24 }}>
        {cats.map(({ photo, l, act, go }) => (
          <button
            key={l}
            onClick={() => pickCat(l, go)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              flexShrink: 0,
              padding: "6px 16px 6px 6px",
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
                width: 30,
                height: 30,
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
            <span style={{ fontSize: 12.5, fontWeight: 700, color: act ? T.accent : "#fff", whiteSpace: "nowrap" }}>{l}</span>
          </button>
        ))}
      </div>

      {/* LIMONKOWA KARTA HERO */}
      <div className="fu" style={{ animationDelay: ".12s", background: T.accent, borderRadius: 26, padding: "18px 18px 16px", marginBottom: 24, boxShadow: "0 18px 44px rgba(188,255,49,0.18)" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <span style={{ display: "inline-block", fontSize: 9.5, fontWeight: 800, letterSpacing: ".08em", padding: "5px 11px", borderRadius: 99, marginBottom: 12, ...hero.chipStyle }}>
              {hero.chip}
            </span>
            <div style={{ fontFamily: H, fontWeight: 700, fontSize: "1.45rem", color: "#000", lineHeight: 1.05 }}>{hero.title}</div>
            <div style={{ fontSize: 12, color: "rgba(0,0,0,0.62)", marginTop: 4, fontWeight: 600 }}>{hero.sub}</div>
          </div>
          <Ring pct={doneCount / 3} size={64} stroke={7} color="#000" track="rgba(0,0,0,0.14)">
            <span style={{ fontFamily: "'Doto',sans-serif", fontWeight: 800, fontSize: 13, color: "#000" }}>{doneCount}/3</span>
          </Ring>
        </div>
        <button
          onClick={hero.go}
          style={{ marginTop: 14, width: "100%", background: "#171717", color: "#fff", border: "none", borderRadius: 99, fontFamily: H, fontWeight: 700, fontSize: 13.5, padding: "14px 20px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
        >
          <Play size={15} color={T.accent} fill={T.accent} strokeWidth={0} />
          {hero.cta}
        </button>
      </div>

      {/* PODSUMOWANIE MINIONEGO TYGODNIA — raz na tydzień, do zamknięcia */}
      {!summaryDismissed && lastWeek && (lastWeek.done > 0 || lastWeekVol > 0) && summarySeenWeek !== String(weekStart) && (
        <div className="fu" style={{ animationDelay: ".14s", display: "flex", alignItems: "center", gap: 12, background: T.card, border: `1px solid ${T.blueSoftBorder}`, borderRadius: 20, padding: "12px 16px", marginBottom: 16 }}>
          <span style={{ width: 40, height: 40, borderRadius: 13, background: T.blueSoftBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <BarChart3 size={17} color={T.blue} strokeWidth={2.2} />
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: "#fff", fontFamily: H }}>Twój poprzedni tydzień</div>
            <div style={{ fontSize: 11, color: T.sub, marginTop: 2 }}>
              {lastWeek.done}/3 treningi
              {(() => {
                const dd = lastWeek.done - (weekBefore?.done || 0);
                return dd !== 0 ? ` (${dd > 0 ? "+" : ""}${dd} vs wcześniejszy)` : "";
              })()}
              {weekBeforeVol > 0 && lastWeekVol > 0
                ? ` · objętość ${lastWeekVol >= weekBeforeVol ? "+" : ""}${Math.round(((lastWeekVol - weekBeforeVol) / weekBeforeVol) * 100)}%`
                : ""}
            </div>
          </div>
          <button
            onClick={() => {
              localStorage.setItem("week_summary_seen", String(weekStart));
              setSummaryDismissed(true);
            }}
            aria-label="Zamknij podsumowanie"
            style={{ width: 30, height: 30, borderRadius: 10, background: T.inset, border: "none", color: T.sub, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
          >
            <X size={14} strokeWidth={2.4} />
          </button>
        </div>
      )}

      {/* SUGESTIA DELOADU — po 5+ tygodniach bez przerwy, raz na tydzień */}
      {showDeload && (
        <div className="fu" style={{ animationDelay: ".15s", display: "flex", alignItems: "flex-start", gap: 12, background: T.card, border: `1px solid rgba(251,191,36,0.35)`, borderRadius: 20, padding: "13px 14px", marginBottom: 18 }}>
          <span style={{ width: 40, height: 40, borderRadius: 13, background: "rgba(251,191,36,0.13)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Moon size={17} color={T.yellow} strokeWidth={2.2} />
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: "#fff", fontFamily: H }}>{streak} tygodni bez przerwy — czas na deload</div>
            <div style={{ fontSize: 11, color: T.sub, marginTop: 2, lineHeight: 1.5 }}>
              Zrób w tym tygodniu te same treningi na ok. 60% ciężarów. Lżejszy tydzień to regeneracja stawów i nowa siła — wrócisz mocniejszy.
            </div>
          </div>
          <button onClick={dismissDeload} aria-label="Zamknij sugestię deloadu" style={{ width: 30, height: 30, borderRadius: 10, background: T.inset, border: "none", color: T.sub, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <X size={14} strokeWidth={2.4} />
          </button>
        </div>
      )}

      {/* AKTYWNOŚĆ — układ bento: duży kafelek celu tygodnia + dwa mniejsze ułożone obok */}
      <SectionHead title="Aktywność" onSee={() => goTo("stats")} delay=".16s" />
      <div style={{ display: "grid", gridTemplateColumns: "1.15fr 1fr", gridTemplateRows: "auto auto", gap: 12, marginBottom: 24 }}>
        <div
          className="fu"
          style={{ animationDelay: ".18s", gridRow: "1 / 3", background: T.card, border: `1px solid ${T.borderSoft}`, borderRadius: 24, padding: "16px 14px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10 }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 5, alignSelf: "flex-start" }}>
            <Check size={13} color={T.accent} strokeWidth={2.6} />
            <span style={{ fontSize: 10, color: T.soft, fontWeight: 600 }}>Treningi</span>
          </div>
          <Ring pct={doneCount / 3} size={84} stroke={8} color={T.accent}>
            <span style={{ fontFamily: "'Doto',sans-serif", fontWeight: 800, fontSize: 18, color: "#fff" }}>{doneCount}/3</span>
          </Ring>
          <span style={{ fontSize: 10, color: T.sub, fontWeight: 600 }}>w tym tygodniu</span>
        </div>
        <div className="fu" style={{ animationDelay: ".22s", background: T.card, border: `1px solid ${T.borderSoft}`, borderRadius: 22, padding: "12px 10px", display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5, alignSelf: "flex-start" }}>
            <Moon size={13} color={T.accent} strokeWidth={2.4} />
            <span style={{ fontSize: 10, color: T.soft, fontWeight: 600 }}>Seria</span>
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 34 }}>
            {/* para akcentów: przeszłe tygodnie niebieskie (kontekst), bieżący limonka (teraz) */}
            {weekBars.map((v, i) => (
              <div key={i} style={{ width: 7, height: `${Math.max(v * 100, 12)}%`, borderRadius: 4, background: i === weekBars.length - 1 ? T.accent : T.blueSoft }} />
            ))}
          </div>
          <span style={{ fontSize: 9.5, color: T.sub, fontWeight: 600 }}>
            <strong style={{ color: "#fff", fontFamily: "'Doto',sans-serif", fontWeight: 800, fontSize: 16 }}>{Math.round(cStreak)}</strong> tyg. z rzędu
          </span>
        </div>
        <div className="fu" style={{ animationDelay: ".26s", background: T.card, border: `1px solid ${T.borderSoft}`, borderRadius: 22, padding: "12px 10px", display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5, alignSelf: "flex-start" }}>
            <HeartPulse size={13} color={T.accent} strokeWidth={2.4} />
            <span style={{ fontSize: 10, color: T.soft, fontWeight: 600 }}>Progres</span>
          </div>
          <svg width="72" height="34" viewBox="0 0 72 34" fill="none">
            {sparkPts ? (
              <polyline points={sparkPts} stroke={T.accent} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            ) : (
              <line x1="2" y1="17" x2="70" y2="17" stroke={T.track} strokeWidth="2.2" strokeLinecap="round" strokeDasharray="3 5" />
            )}
          </svg>
          <span style={{ fontSize: 9.5, color: T.sub, fontWeight: 600 }}>
            <strong style={{ color: "#fff", fontFamily: H, fontSize: 13 }}>
              {gain >= 0 ? "+" : ""}
              {Math.round(cGain * 10) / 10}
            </strong>{" "}
            kg łącznie
          </span>
        </div>
      </div>

      {/* CEL MIESIĄCA — pasek postępu liczby treningów (cel edytowalny w Profilu);
          razem z wyzwaniem i łańcuchem tworzy grupę "cele" (odstępy 12) */}
      <div className="fu" style={{ animationDelay: ".28s", background: T.card, border: `1px solid ${T.borderSoft}`, borderRadius: 20, padding: "13px 16px", marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Target size={15} color={T.accent} strokeWidth={2.3} />
          <span style={{ flex: 1, fontSize: 12, fontWeight: 700, color: "#fff", fontFamily: H }}>
            Cel na {monthName}
          </span>
          <span style={{ fontFamily: "'Doto',sans-serif", fontWeight: 800, fontSize: 15, color: monthDone >= monthlyGoal ? T.ok : T.accent }}>
            {monthDone}<span style={{ color: T.sub, fontSize: 12 }}>/{monthlyGoal}</span>
          </span>
        </div>
        <div style={{ height: 8, borderRadius: 99, background: T.track, marginTop: 10, overflow: "hidden" }}>
          <div style={{ width: `${monthPct * 100}%`, height: "100%", borderRadius: 99, background: monthDone >= monthlyGoal ? T.ok : T.accent, transition: "width .6s cubic-bezier(.22,1,.36,1)" }} />
        </div>
        <div style={{ fontSize: 9.5, color: T.faint, marginTop: 7 }}>
          {monthDone >= monthlyGoal ? "Cel miesiąca osiągnięty — tak trzymaj!" : `jeszcze ${monthlyGoal - monthDone} ${monthlyGoal - monthDone === 1 ? "trening" : monthlyGoal - monthDone < 5 ? "treningi" : "treningów"} do celu · zmienisz cel w Profilu`}
        </div>
      </div>

      {/* WYZWANIE TYGODNIA — rotuje co tydzień, postęp z dziennika */}
      <div className="fu" style={{ animationDelay: ".29s", background: T.card, border: `1px solid ${chDone ? "rgba(52,211,153,0.35)" : T.borderSoft}`, borderRadius: 20, padding: "13px 16px", marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Trophy size={15} color={chDone ? T.ok : T.accent} strokeWidth={2.3} />
          <span style={{ flex: 1, fontSize: 12, fontWeight: 700, color: "#fff", fontFamily: H }}>Wyzwanie tygodnia</span>
          <span style={{ fontFamily: "'Doto',sans-serif", fontWeight: 800, fontSize: 15, color: chDone ? T.ok : T.accent }}>
            {challenge.fmt(challenge.cur)}
            <span style={{ color: T.sub, fontSize: 12 }}>/{challenge.fmt(challenge.target)}</span>
          </span>
        </div>
        <div style={{ fontSize: 11.5, color: T.light, marginTop: 6 }}>{challenge.label}</div>
        <div style={{ height: 7, borderRadius: 99, background: T.track, marginTop: 8, overflow: "hidden" }}>
          <div style={{ width: `${chPct * 100}%`, height: "100%", borderRadius: 99, background: chDone ? T.ok : T.accent, transition: "width .6s cubic-bezier(.22,1,.36,1)" }} />
        </div>
        {chDone && <div style={{ fontSize: 10, color: T.ok, fontWeight: 700, marginTop: 6 }}>Wyzwanie zaliczone — brawo!</div>}
      </div>

      {/* ŁAŃCUCH PASSY — nie przerwij! 8 ostatnich tygodni jako ogniwa */}
      <div className="fu" style={{ animationDelay: ".3s", background: T.card, border: `1px solid ${T.borderSoft}`, borderRadius: 20, padding: "13px 16px", marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <Flame size={15} color={T.accent} strokeWidth={2.3} />
          <span style={{ flex: 1, fontSize: 12, fontWeight: 700, color: "#fff", fontFamily: H }}>Łańcuch passy</span>
          <span style={{ fontSize: 10.5, color: T.sub }}>
            <strong style={{ color: "#fff", fontFamily: "'Doto',sans-serif", fontWeight: 800, fontSize: 14 }}>{streak}</strong> tyg. z rzędu
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center" }}>
          {chain.map((w, i) => {
            const on = w.done > 0;
            return (
              <div key={w.label} style={{ display: "flex", alignItems: "center", flex: i < chain.length - 1 ? 1 : "0 0 auto" }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                  <span
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: on ? (w.done === 3 ? T.accent : T.accentSoftBg) : T.track,
                      border: `1.5px solid ${w.isCurrent ? T.accent : on ? T.accentSoftBorder : "transparent"}`,
                      color: on ? (w.done === 3 ? "#000" : T.accent) : T.faint,
                      fontFamily: "'Doto',sans-serif",
                      fontWeight: 800,
                      fontSize: 12,
                    }}
                  >
                    {on ? w.done : "·"}
                  </span>
                  <span style={{ fontSize: 7.5, fontWeight: 700, color: w.isCurrent ? T.accent : T.faint, fontFamily: "'Doto',sans-serif" }}>{w.isCurrent ? "TERAZ" : w.label}</span>
                </div>
                {i < chain.length - 1 && <span style={{ flex: 1, height: 2, margin: "0 3px 12px", borderRadius: 2, background: on && chain[i + 1].done > 0 ? T.accentSoftBorder : T.track }} />}
              </div>
            );
          })}
        </div>
        <div style={{ fontSize: 9.5, color: T.faint, marginTop: 8 }}>liczba w ogniwie = treningi A/B/C w danym tygodniu · min. 1 podtrzymuje passę</div>
      </div>

      {/* CYTAT DNIA — informacyjny, więc niebieski akcent */}
      <div className="fu" style={{ animationDelay: ".31s", display: "flex", gap: 12, background: T.card2, border: `1px solid ${T.borderSoft}`, borderRadius: 20, padding: "16px", marginBottom: 24 }}>
        <Quote size={16} color={T.blue} strokeWidth={2.2} style={{ flexShrink: 0, marginTop: 2 }} />
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 12.5, color: T.light, lineHeight: 1.55, fontStyle: "italic" }}>{quote.t}</div>
          {quote.a && <div style={{ fontSize: 10, color: T.faint, marginTop: 5, fontWeight: 600 }}>— {quote.a}</div>}
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
            style={{ animationDelay: `${0.32 + i * 0.05}s`, position: "relative", width: 150, height: 190, borderRadius: 22, overflow: "hidden", flexShrink: 0, cursor: "pointer", border: `1px solid ${T.border}` }}
          >
            <img src={PHOTOS[k]} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(23,23,23,0.05) 30%, rgba(23,23,23,0.92) 100%)" }} />
            {st[k].done && (
              <span style={{ position: "absolute", top: 10, right: 10, width: 24, height: 24, borderRadius: "50%", background: T.ok, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Check size={14} color="#000" strokeWidth={3} />
              </span>
            )}
            <div style={{ position: "absolute", inset: 0, padding: 12, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
              <span style={{ alignSelf: "flex-start", background: st[k].done ? T.ok : T.accent, color: "#000", fontSize: 9.5, fontWeight: 800, padding: "3px 9px", borderRadius: 99, marginBottom: 6 }}>
                {st[k].done ? "ZROBIONY" : EXERCISES_DATA[k].day}
              </span>
              <div style={{ fontFamily: H, fontWeight: 700, fontSize: "1.02rem", color: "#fff", lineHeight: 1.1 }}>{EXERCISES_DATA[k].label}</div>
              <div style={{ fontSize: 10.5, color: "rgba(255,255,255,0.65)", marginTop: 3 }}>
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
                    <span style={{ width: 40, height: 40, borderRadius: 13, background: n.warn ? "rgba(251,191,36,0.13)" : n.info ? T.blueSoftBg : T.inset, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <n.Icon size={17} color={n.warn ? T.yellow : n.info ? T.blue : T.accent} strokeWidth={2.2} />
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
