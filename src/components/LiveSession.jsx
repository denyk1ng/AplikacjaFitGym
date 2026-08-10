import { useEffect, useMemo, useRef, useState } from "react";
import { X, Check, ChevronRight, Trophy, Medal, LogOut, Plus, Minus, Repeat, Gauge, Share2, Pause, Play, History, Info, ArrowUp, ArrowDown, Flame, SlidersHorizontal } from "lucide-react";
import { T, FONT_NUM, TR } from "../theme.js";
import { EX_THUMB } from "../data/exerciseThumbs.js";
import { EX_IMG } from "../data/exerciseImages.js";
import { EXERCISES_DATA, EXTRA_ALTS, CAT_LABEL } from "../data/plan.js";
import { loadWorkoutLog } from "../lib/workoutLog.js";
import { playBeep, unlockAudio } from "../lib/sound.js";
import { buzzTap, buzzRestEnd, buzzRecord } from "../lib/haptics.js";
import { warmupSetsFor } from "../lib/warmupSets.js";
import { EditNum, EditStr } from "./Editable.jsx";
import { shareWorkoutImage } from "../lib/shareCard.js";

const U = "'Urbanist',sans-serif";

// stan trwającej sesji trzymany w localStorage — wyjście z aplikacji
// (odświeżenie, zamknięcie karty) nie kasuje postępu; wygasa po 6 h
const LIVE_KEY = "live_session";
const LIVE_MAX_AGE = 6 * 3600 * 1000;

export function loadLiveState(dayKey) {
  try {
    const raw = localStorage.getItem(LIVE_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw);
    if (dayKey && s.dayKey !== dayKey) return null;
    if (Date.now() - (s.savedAt || 0) > LIVE_MAX_AGE) return null;
    return s;
  } catch (e) {
    return null;
  }
}

export function clearLiveState() {
  try {
    localStorage.removeItem(LIVE_KEY);
  } catch (e) {}
}

const fmtTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
const repsInt = (r) => parseInt(r) || 0;
const fmtKg = (v) => (v >= 1000 ? `${(Math.round(v / 100) / 10).toString().replace(".", ",")}k` : String(Math.round(v)));
const RPE_OPTS = [6, 7, 8, 9, 10];
const MAX_SETS = 12;
const MAX_WEIGHT = 500;

// ćwiczenia z masą własną mają w planie pustą jednostkę — gdy trener dołoży
// obciążenie (pas, kamizelka), pokazujemy kilogramy zamiast gołej liczby
const unitOf = (e) => e.unit || "kg";
// krok przycisków −/+ : hantle (kg/h) i doczepiane obciążenie idą co 1 kg,
// sztanga i maszyny co 2,5 kg (najmniejszy typowy talerz na stronę) —
// ta sama zasada co w roundLoad() z lib/warmupSets.js
const stepOf = (e) => (!e.unit || e.unit.startsWith("kg/") ? 1 : 2.5);

function avg(arr) {
  const nums = arr.filter((v) => v !== null && v !== undefined);
  if (!nums.length) return null;
  return Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 10) / 10;
}

// konfetti przy nowym rekordzie — czysty CSS (animacja confettiFall w index.css),
// paleta ograniczona do kolorów systemu; znika samo po opadnięciu
function Confetti() {
  const parts = useMemo(() => {
    const colors = [T.accent, "#FCFCFC", "#7C7C74", T.ok];
    return Array.from({ length: 36 }, (_, i) => ({
      left: Math.random() * 100,
      delay: Math.random() * 0.9,
      dur: 2.2 + Math.random() * 1.4,
      size: 6 + Math.random() * 5,
      color: colors[i % colors.length],
      spin: Math.random() > 0.5 ? 1 : -1,
    }));
  }, []);
  return (
    <div aria-hidden style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 1500, overflow: "hidden" }}>
      {parts.map((p, i) => (
        <span
          key={i}
          style={{
            position: "absolute",
            top: -14,
            left: `${p.left}%`,
            width: p.size,
            height: p.size * 0.55,
            borderRadius: 2,
            background: p.color,
            animation: `confettiFall ${p.dur}s ease-in ${p.delay}s forwards`,
            transform: `rotate(${p.spin * 40}deg)`,
          }}
        />
      ))}
    </div>
  );
}

// półkolisty zegar z kresek (wg wzorca rest-timera)
//
// Kreska, która jest właśnie "w trakcie", rozjaśnia się stopniowo zamiast
// zapalać się skokiem. Bez tego przy 180-sekundowej przerwie wskaźnik stał
// nieruchomo blisko 7 sekund i przeskakiwał — wyglądał na zawieszony.
// Każda pozycja to dwie linie: przygaszony tor i zapalający się nad nim
// wskaźnik, więc częściowa jasność nie odsłania dziury w torze.
function TickGauge({ pct, color }) {
  const N = 26;
  const R1 = 52;
  const R2 = 66;
  const cx = 75;
  const cy = 72;
  const exact = Math.min(Math.max(pct, 0), 1) * N;
  const full = Math.floor(exact);
  const frac = exact - full; // ile brakuje kresce na styku, 0–1
  const pos = (i) => {
    const a = Math.PI + (i / (N - 1)) * Math.PI;
    return { x1: cx + R1 * Math.cos(a), y1: cy + R1 * Math.sin(a), x2: cx + R2 * Math.cos(a), y2: cy + R2 * Math.sin(a) };
  };
  return (
    <svg width="150" height="80" viewBox="0 0 150 80">
      {Array.from({ length: N }, (_, i) => (
        <line key={`t${i}`} {...pos(i)} stroke={T.track} strokeWidth="4.5" strokeLinecap="round" />
      ))}
      {Array.from({ length: N }, (_, i) => {
        const o = i < full ? 1 : i === full ? frac : 0;
        if (o === 0) return null;
        return <line key={`f${i}`} {...pos(i)} stroke={color} strokeWidth="4.5" strokeLinecap="round" opacity={o} />;
      })}
    </svg>
  );
}

// okrągły przycisk −/+ (stepper). Duży wariant w arkuszu edycji — na siłowni
// celuje się w niego spoconym palcem, więc 44 px zamiast tekstowego linku
function StepBtn({ onClick, disabled, label, size = 44, icon: Icon }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className="tap"
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        flexShrink: 0,
        background: disabled ? T.inset : size >= 40 ? T.card2 : "rgba(23,23,23,0.62)",
        backdropFilter: size >= 40 ? "none" : "blur(4px)",
        border: `1.5px solid ${disabled ? T.borderSoft : T.border}`,
        color: disabled ? T.faint : "#fff",
        cursor: disabled ? "default" : "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 0,
      }}
    >
      <Icon size={size >= 40 ? 19 : 13} strokeWidth={2.6} />
    </button>
  );
}

// wiersz arkusza edycji: etykieta + podpowiedź nad rzędem [−] wartość [+]
function SheetRow({ label, hint, children }) {
  return (
    <div style={{ background: T.card, border: `1px solid ${T.borderSoft}`, borderRadius: 18, padding: "12px 14px", marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <span style={{ fontSize: 12.5, fontWeight: 700, color: "#fff", fontFamily: U }}>{label}</span>
        {hint && <span style={{ fontSize: 10.5, color: T.sub }}>{hint}</span>}
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 14, minHeight: 46 }}>{children}</div>
    </div>
  );
}

export function LiveSession({ dayKey, data, onExit, onSaveAll, updateWeight, updateReps, updateSets, snapshots }) {
  const baseExs = data.exercises;
  const [restored] = useState(() => loadLiveState(dayKey));
  const [exsState, setExsState] = useState(() =>
    restored && Array.isArray(restored.exsState) && restored.exsState.length === baseExs.length ? restored.exsState : baseExs
  );
  const exs = exsState;
  const [idx, setIdx] = useState(restored && restored.idx < exs.length ? restored.idx : 0);
  const [setsDone, setSetsDone] = useState(() =>
    restored && Array.isArray(restored.setsDone) && restored.setsDone.length === exs.length ? restored.setsDone : exs.map(() => 0)
  );
  const [rpeData, setRpeData] = useState(() =>
    restored && Array.isArray(restored.rpeData) && restored.rpeData.length === exs.length ? restored.rpeData : exs.map(() => [])
  );
  const [pendingRpe, setPendingRpe] = useState(false);
  const [showEdit, setShowEdit] = useState(false); // arkusz "Edytuj ćwiczenie" — ciężar/serie/powtórzenia w trakcie sesji
  const [showSwap, setShowSwap] = useState(false);
  const [showInfo, setShowInfo] = useState(false); // technika ćwiczenia bez wychodzenia z sesji
  const [slideDir, setSlideDir] = useState("r"); // kierunek wjazdu karty ćwiczenia (animacja)
  const touchStart = useRef(null); // start gestu swipe na karcie ćwiczenia
  const [sharing, setSharing] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [rest, setRest] = useState(0);
  // pozostały czas z dokładnością do milisekund — sam licznik pokazuje pełne
  // sekundy, ale wskaźnik potrzebuje wartości pośrednich, żeby narastać płynnie
  const [restMs, setRestMs] = useState(0);
  const [restPaused, setRestPaused] = useState(false);
  const [stage, setStage] = useState(restored && restored.stage === "summary" ? "summary" : "live"); // live | summary
  const [confirmExit, setConfirmExit] = useState(false);
  const [prevLog, setPrevLog] = useState([]);
  const restEnd = useRef(null);
  const restBeeped = useRef(false); // sygnał końca przerwy odpala się dokładnie raz
  const startTs = useRef(restored && restored.startTs ? restored.startTs : Date.now());
  const pendingRestRef = useRef(true);

  const ex = exs[idx];

  // historia poprzednich sesji — do linijki "ostatnio: ..." przy ćwiczeniu
  useEffect(() => {
    loadWorkoutLog().then(setPrevLog);
  }, []);

  // ostatni zapisany wynik bieżącego ćwiczenia z wcześniejszej sesji
  const lastResult = useMemo(() => {
    for (let i = prevLog.length - 1; i >= 0; i--) {
      const entry = prevLog[i];
      if (entry.ts >= startTs.current) continue; // pomiń wpis z tej samej sesji
      const pe = (entry.perExercise || []).find((p) => p.id === ex.id);
      if (pe) return { ...pe, date: new Date(entry.ts).toLocaleDateString("pl-PL", { day: "numeric", month: "short" }) };
    }
    return null;
  }, [prevLog, ex.id]);

  // każda zmiana postępu ląduje od razu w localStorage
  useEffect(() => {
    try {
      localStorage.setItem(LIVE_KEY, JSON.stringify({ dayKey, idx, setsDone, rpeData, exsState, stage, startTs: startTs.current, savedAt: Date.now() }));
    } catch (e) {}
  }, [dayKey, idx, setsDone, rpeData, exsState, stage]);

  const exit = () => {
    clearLiveState();
    onExit();
  };

  // zegar sesji
  useEffect(() => {
    const t = setInterval(() => setElapsed(Math.floor((Date.now() - startTs.current) / 1000)), 1000);
    return () => clearInterval(t);
  }, []);

  // odliczanie przerwy (wstrzymywalne — pauza zamraża pozostały czas).
  // Tyka co 100 ms, żeby wskaźnik dostawał wartości pośrednie; sam napis
  // z sekundami i tak zmienia się tylko przy przejściu przez pełną sekundę.
  useEffect(() => {
    if (rest <= 0 || restPaused) return;
    const t = setInterval(() => {
      const msLeft = Math.max(0, restEnd.current - Date.now());
      setRestMs(msLeft);
      const rem = Math.ceil(msLeft / 1000);
      setRest(rem);
      // sygnał końca tylko raz: przy 100 ms interval kilka tyknięć potrafi
      // trafić w zero, zanim efekt zdąży się rozmontować
      if (rem === 0 && !restBeeped.current) {
        restBeeped.current = true;
        playBeep();
        buzzRestEnd();
      }
    }, 100);
    return () => clearInterval(t);
  }, [rest > 0, restPaused]);

  const toggleRestPause = () => {
    if (rest <= 0) return;
    if (restPaused) {
      // wznowienie liczy od zamrożonych milisekund, nie od zaokrąglonej
      // sekundy — inaczej każda pauza dokładałaby do przerwy ułamek sekundy
      restEnd.current = Date.now() + restMs;
      setRestPaused(false);
    } else {
      setRestPaused(true);
    }
  };

  const stopRest = () => {
    setRest(0);
    setRestMs(0);
    setRestPaused(false);
  };

  const totalSetsDone = setsDone.reduce((a, b) => a + b, 0);
  const volume = exs.reduce((sum, e, i) => sum + setsDone[i] * repsInt(e.reps) * (e.weight || 0), 0);

  // zaliczenie serii nie startuje od razu przerwy — najpierw krótkie,
  // opcjonalne pytanie o RPE (jak ciężko było), potem leci timer
  const doneSet = () => {
    if (setsDone[idx] >= ex.sets) return;
    unlockAudio(); // gest użytkownika — odblokuj Web Audio dla beeta końca przerwy (iOS)
    buzzTap();
    const next = [...setsDone];
    next[idx] += 1;
    setSetsDone(next);
    pendingRestRef.current = !(next[idx] >= ex.sets && idx === exs.length - 1);
    setPendingRpe(true);
  };

  // edycja ciężaru/serii/powtórzeń w trakcie sesji: aktualizuje lokalny stan
  // sesji (UI + objętość od razu) ORAZ plan/progres przez rodzica — wcześniej
  // szła tylko do planu, więc na ekranie sesji nic się nie zmieniało
  //
  // ciężar leci do planu z opóźnieniem: rodzic dopisuje punkt progresu przy
  // KAŻDEJ zmianie, więc dokładanie talerzy przyciskiem +2,5 kg zostawiłoby na
  // wykresie schodek z kilku punktów w odstępie sekundy zamiast jednej zmiany
  const updateWeightRef = useRef(updateWeight);
  updateWeightRef.current = updateWeight;
  const pendingWeight = useRef(null);
  const weightTimer = useRef(null);
  const flushWeight = () => {
    if (weightTimer.current) {
      clearTimeout(weightTimer.current);
      weightTimer.current = null;
    }
    const p = pendingWeight.current;
    pendingWeight.current = null;
    if (p && updateWeightRef.current) updateWeightRef.current(p.id, p.v);
  };
  const flushWeightRef = useRef(flushWeight);
  flushWeightRef.current = flushWeight;
  // wyjście z sesji (zapis, porzucenie, zabicie karty przez system) nie może
  // zgubić ostatniej zmiany ciężaru czekającej w kolejce
  useEffect(() => () => flushWeightRef.current(), []);

  const editWeight = (v) => {
    const w = Math.min(MAX_WEIGHT, Math.max(0, Math.round(v * 10) / 10));
    setExsState((s) => s.map((e, i) => (i === idx ? { ...e, weight: w } : e)));
    pendingWeight.current = { id: ex.id, v: w };
    if (weightTimer.current) clearTimeout(weightTimer.current);
    weightTimer.current = setTimeout(() => flushWeightRef.current(), 900);
  };
  const bumpWeight = (d) => {
    buzzTap();
    editWeight((ex.weight || 0) + d);
  };

  // liczba serii: trener dorzuca lub ucina serię w trakcie ćwiczenia.
  // W dół nie schodzimy poniżej serii już zaliczonych — inaczej zrobiona
  // robota zniknęłaby z objętości i z zapisu treningu
  const editSets = (v) => {
    const n = Math.max(Math.max(1, setsDone[idx]), Math.min(MAX_SETS, Math.round(v)));
    setExsState((s) => s.map((e, i) => (i === idx ? { ...e, sets: n } : e)));
    updateSets && updateSets(ex.id, n);
  };
  const bumpSets = (d) => {
    buzzTap();
    editSets((ex.sets || 1) + d);
  };

  const editReps = (v) => {
    setExsState((s) => s.map((e, i) => (i === idx ? { ...e, reps: v } : e)));
    updateReps && updateReps(ex.id, v);
  };

  const submitRpe = (value) => {
    setRpeData((prev) => {
      const copy = prev.map((a) => [...a]);
      copy[idx] = [...copy[idx], value];
      return copy;
    });
    setPendingRpe(false);
    if (pendingRestRef.current) {
      restEnd.current = Date.now() + ex.rest * 1000;
      restBeeped.current = false;
      setRestPaused(false);
      setRestMs(ex.rest * 1000);
      setRest(ex.rest);
    }
  };

  // kolejne NIEDOKOŃCZONE ćwiczenie (z zawinięciem) — pominięte przez
  // zajętą maszynę wracają do kolejki; podsumowanie dopiero gdy komplet
  // przy otwartym pytaniu o RPE nawigacja jest zablokowana — skok na inne
  // ćwiczenie zapisywałby odpowiedź do złego ćwiczenia i startował przerwę
  // z cudzym czasem
  const nextExercise = () => {
    if (pendingRpe) return;
    stopRest();
    flushWeight(); // zmiana ciężaru musi trafić do planu POD id ćwiczenia, które się właśnie kończy
    for (let step = 1; step <= exs.length; step++) {
      const j = (idx + step) % exs.length;
      if (setsDone[j] < exs[j].sets) {
        setSlideDir("r");
        setIdx(j);
        return;
      }
    }
    setStage("summary");
  };

  // poprzednie niedokończone (dla swipe'a w prawo) — lustrzane do nextExercise
  const prevExercise = () => {
    if (pendingRpe) return;
    stopRest();
    flushWeight();
    for (let step = 1; step <= exs.length; step++) {
      const j = (idx - step + exs.length) % exs.length;
      if (setsDone[j] < exs[j].sets) {
        setSlideDir("l");
        setIdx(j);
        return;
      }
    }
  };

  const jumpTo = (i) => {
    if (pendingRpe) return;
    stopRest();
    flushWeight();
    setSlideDir(i >= idx ? "r" : "l");
    setIdx(i);
  };

  // przejście do podsumowania — z domknięciem oczekującej zmiany ciężaru,
  // żeby "Zapisz trening" zapisał plan już z nowym obciążeniem
  const goSummary = () => {
    flushWeight();
    setStage("summary");
  };

  // swipe w lewo/prawo na karcie ćwiczenia = następne/poprzednie niedokończone
  // (naturalny gest na telefonie zamiast celowania w numerki na górze)
  const onCardTouchStart = (e) => {
    touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };
  const onCardTouchEnd = (e) => {
    if (!touchStart.current) return;
    const dx = e.changedTouches[0].clientX - touchStart.current.x;
    const dy = e.changedTouches[0].clientY - touchStart.current.y;
    touchStart.current = null;
    if (Math.abs(dx) < 56 || Math.abs(dx) < Math.abs(dy) * 1.6) return; // za krótki albo pionowy gest
    if (dx < 0) nextExercise();
    else prevExercise();
  };

  // alternatywy dla bieżącego ćwiczenia: ta sama partia (cat) z całego planu
  // + dodatkowe zamienniki spoza planu (EXTRA_ALTS — sprzęt zajęty itp.),
  // bez powtórzeń nazw i bez ćwiczeń już będących w dzisiejszej sesji
  const alternatives = useMemo(() => {
    const seen = new Set(exs.map((e) => e.name));
    const out = [];
    Object.values(EXERCISES_DATA).forEach((day) => {
      day.exercises.forEach((cand) => {
        if (cand.cat === ex.cat && cand.id !== ex.id && !seen.has(cand.name)) {
          seen.add(cand.name);
          out.push(cand);
        }
      });
    });
    (EXTRA_ALTS[ex.id] || []).forEach((a, i) => {
      if (seen.has(a.name)) return;
      seen.add(a.name);
      // ciężar 0 = dobierany na miejscu — to inny ruch, przenoszenie ciężaru
      // z oryginału podpowiadałoby niebezpieczne obciążenie
      out.push({ id: `xalt-${ex.id}-${i}`, name: a.name, reps: a.reps, weight: 0, unit: "kg", cat: ex.cat, catColor: ex.catColor, extra: true });
    });
    return out;
  }, [ex.id, ex.cat]);

  const swapExercise = (alt) => {
    flushWeight(); // ciężar sprzed zamiany należy jeszcze do starego ćwiczenia
    const next = [...exsState];
    next[idx] = { ...alt, sets: ex.sets, rest: ex.rest }; // te same serie/przerwa co zaplanowane, inny ruch
    setExsState(next);
    const nextSets = [...setsDone];
    nextSets[idx] = 0;
    setSetsDone(nextSets);
    const nextRpe = rpeData.map((a) => [...a]);
    nextRpe[idx] = [];
    setRpeData(nextRpe);
    setShowSwap(false);
  };

  const hasOtherUnfinished = exs.some((e, i) => i !== idx && setsDone[i] < e.sets);

  // rekordy: aktualny ciężar > maksimum z zapisów SPRZED tej sesji — edycja
  // ciężaru w trakcie sesji sama dopisuje snapshot, więc bez odcięcia po
  // startTs rekord porównywałby się z samym sobą i nigdy nie wypadł
  const records = useMemo(() => {
    if (stage !== "summary") return [];
    return exs
      .filter((e, i) => setsDone[i] > 0 && e.weight > 0)
      .filter((e) => {
        const hist = snapshots
          .filter((s) => s.ts < startTs.current)
          .map((s) => (s.weights || {})[e.id])
          .filter((w) => w !== undefined);
        return hist.length > 0 && e.weight > Math.max(...hist);
      });
  }, [stage]);

  // wibracja przy nowym rekordzie — razem z konfetti na podsumowaniu
  useEffect(() => {
    if (stage === "summary" && records.length > 0) buzzRecord();
  }, [stage, records.length]);

  // ── PODSUMOWANIE ──────────────────────────────────────────────────────────
  if (stage === "summary") {
    const doneExs = exs.filter((_, i) => setsDone[i] > 0);
    return (
      <div style={{ margin: "-20px -18px -140px", minHeight: "100vh", padding: "22px 18px 40px", display: "flex", flexDirection: "column" }}>
        {records.length > 0 && <Confetti />}
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          {/* powrót do sesji: podsumowanie bywa otwarte za wcześnie (dorzucona
              seria, doradzone przez trenera dodatkowe ćwiczenie) */}
          <button onClick={() => setStage("live")} style={{ display: "flex", alignItems: "center", gap: 4, background: "transparent", border: "none", color: T.accent, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: U, padding: 0 }}>
            <ChevronRight size={15} strokeWidth={2.6} style={{ transform: "rotate(180deg)" }} />
            Wróć do sesji
          </button>
          <button onClick={exit} style={{ background: "transparent", border: "none", color: T.sub, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: U }}>
            Pomiń zapis
          </button>
        </div>

        <div style={{ textAlign: "center", marginTop: 6 }}>
          <div className="pop" style={{ width: 64, height: 64, borderRadius: "50%", background: T.accent, display: "inline-flex", alignItems: "center", justifyContent: "center", boxShadow: T.accentGlow }}>
            <Trophy size={28} color="#000" strokeWidth={2.2} />
          </div>
          <div className="fu" style={{ animationDelay: ".1s", fontFamily: U, fontWeight: 700, fontSize: "1.5rem", color: "#fff", marginTop: 14 }}>
            Trening ukończony!
          </div>
          <div className="fu" style={{ animationDelay: ".18s", fontSize: 12, color: T.sub, marginTop: 3 }}>
            {data.label} · {data.desc}
          </div>
        </div>

        {/* statystyki sesji */}
        <div className="fu" style={{ animationDelay: ".25s", display: "flex", gap: 10, marginTop: 22 }}>
          {[
            { v: fmtTime(elapsed), l: "czas" },
            { v: String(totalSetsDone), l: "serie" },
            { v: fmtKg(volume), l: "kg objętości" },
          ].map((s) => (
            <div key={s.l} style={{ flex: 1, background: T.card, border: `1px solid ${T.borderSoft}`, borderRadius: 16, padding: "14px 8px", textAlign: "center" }}>
              <div style={{ fontFamily: FONT_NUM, fontWeight: 800, fontSize: "1.25rem", color: "#fff" }}>{s.v}</div>
              <div style={{ fontSize: 10, color: T.sub, fontWeight: 600, marginTop: 4 }}>{s.l}</div>
            </div>
          ))}
        </div>

        {/* rekordy */}
        {records.map((r) => (
          <div key={r.id} className="fu" style={{ animationDelay: ".32s", display: "flex", alignItems: "center", gap: 10, background: T.accentSoftBg, border: `1px solid ${T.accentSoftBorder}`, borderRadius: 16, padding: "12px 14px", marginTop: 12 }}>
            <Medal size={17} color={T.accent} strokeWidth={2.2} />
            <span style={{ flex: 1, fontSize: 13, fontWeight: 700, color: "#fff", fontFamily: U }}>Nowy rekord — {r.name.split("—")[0].trim()}</span>
            <span style={{ fontFamily: FONT_NUM, fontWeight: 800, fontSize: 15, color: T.accent }}>{String(r.weight).replace(".", ",")} {unitOf(r)}</span>
          </div>
        ))}

        {/* lista ćwiczeń */}
        <div className="fu" style={{ animationDelay: ".38s", marginTop: 20, flex: 1 }}>
          <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: T.soft, marginBottom: 8 }}>Ćwiczenia</div>
          {doneExs.length === 0 && <p style={{ fontSize: 12.5, color: T.sub }}>Żadna seria nie została zaliczona.</p>}
          {exs.map((e, i) => {
            if (setsDone[i] === 0) return null;
            const avgR = avg(rpeData[i] || []);
            return (
              <div key={e.id} style={{ display: "flex", alignItems: "center", padding: "10px 2px", borderBottom: `1px solid ${T.borderSoft}` }}>
                <span style={{ flex: 1, fontSize: 13, color: "#fff", fontFamily: U, fontWeight: 600 }}>{e.name.split("—")[0].trim()}</span>
                <span style={{ fontSize: 12, color: T.sub }}>
                  {setsDone[i]} serie{e.weight > 0 ? ` · ${String(e.weight).replace(".", ",")} ${unitOf(e)}` : ""}
                  {avgR !== null ? ` · RPE ${String(avgR).replace(".", ",")}` : ""}
                </span>
              </div>
            );
          })}
        </div>

        <button
          onClick={async () => {
            if (sharing) return;
            setSharing(true);
            try {
              await shareWorkoutImage({
                label: data.label,
                desc: data.desc,
                time: fmtTime(elapsed),
                sets: totalSetsDone,
                volume: fmtKg(volume),
                record: records[0] ? records[0].name.split("—")[0].trim() : null,
              });
            } catch (e) {
              // AbortError = użytkownik anulował okno udostępniania — nic nie robimy
              if (e.name !== "AbortError") console.error(e);
            } finally {
              setSharing(false);
            }
          }}
          className="fu"
          style={{ animationDelay: ".42s", marginTop: 22, width: "100%", background: "transparent", color: T.light, border: `1.5px solid ${T.border}`, borderRadius: 99, fontFamily: U, fontWeight: 700, fontSize: 14, padding: "14px 20px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
        >
          <Share2 size={16} strokeWidth={2.2} />
          {sharing ? "Generuję…" : "Udostępnij trening"}
        </button>

        <button
          onClick={() => {
            if (totalSetsDone === 0) return;
            clearLiveState();
            const perExercise = exs
              .map((e, i) => ({ id: e.id, weight: e.weight || 0, unit: unitOf(e), setsDone: setsDone[i], sets: e.sets, avgRpe: avg(rpeData[i] || []) }))
              .filter((e) => e.setsDone > 0);
            onSaveAll({ time: elapsed, sets: totalSetsDone, volume, perExercise });
          }}
          disabled={totalSetsDone === 0}
          className="fu"
          style={{ animationDelay: ".45s", marginTop: 10, width: "100%", background: totalSetsDone === 0 ? T.inset : T.accent, color: totalSetsDone === 0 ? T.faint : "#000", border: "none", borderRadius: 99, fontFamily: U, fontWeight: 700, fontSize: 15, padding: "16px 24px", cursor: totalSetsDone === 0 ? "default" : "pointer", boxShadow: totalSetsDone === 0 ? "none" : T.accentGlow }}
        >
          Zapisz trening
        </button>
        <p style={{ fontSize: 10.5, color: T.faint, textAlign: "center", marginTop: 10, lineHeight: 1.5 }}>
          {totalSetsDone === 0
            ? "Zalicz przynajmniej jedną serię, żeby zapisać trening."
            : `Zapis odhaczy ${data.label} w kalendarzu tygodnia i doda punkt progresu ciężarów.`}
        </p>
      </div>
    );
  }

  // ── SESJA NA ŻYWO ─────────────────────────────────────────────────────────
  const allSetsDone = setsDone[idx] >= ex.sets;
  const wStep = stepOf(ex);
  const minSets = Math.max(1, setsDone[idx]); // nie da się skasować serii już zrobionych
  // postęp liczony z milisekund, nie z zaokrąglonych sekund — to różnica
  // między wskaźnikiem, który płynie, a takim, który stoi i przeskakuje
  const restPct = ex.rest > 0 ? 1 - restMs / (ex.rest * 1000) : 1;
  // serie rozgrzewkowe — tylko zanim poleci pierwsza seria robocza
  const warmups = setsDone[idx] === 0 ? warmupSetsFor(ex.weight, ex.unit) : [];
  // porównanie ciężaru z poprzednią sesją: strzałka góra/dół obok ciężaru
  const weightDelta = lastResult && lastResult.weight > 0 && ex.weight > 0 ? Math.round((ex.weight - lastResult.weight) * 100) / 100 : null;
  // po zamianie na ćwiczenie spoza planu nie ma miniatury — zostaje zdjęcie
  // oryginalnego ćwiczenia z tego slotu (ta sama partia mięśniowa)
  const cardThumb = EX_THUMB[ex.id] || EX_THUMB[baseExs[idx] && baseExs[idx].id];
  const infoSteps = ex.tech ? ex.tech.split(". ").map((s) => s.trim().replace(/\.$/, "")).filter(Boolean) : [];
  const infoImg = EX_IMG[ex.id];

  return (
    <div style={{ margin: "-20px -18px -140px", minHeight: "100vh", padding: "18px 18px 30px", display: "flex", flexDirection: "column" }}>
      {/* nagłówek */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <button onClick={() => setConfirmExit(true)} aria-label="Przerwij sesję" style={{ width: 38, height: 38, borderRadius: 12, background: T.card, border: `1px solid ${T.borderSoft}`, color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <X size={17} strokeWidth={2.2} />
        </button>
        <div style={{ flex: 1, textAlign: "center", minWidth: 0 }}>
          <div style={{ fontFamily: U, fontWeight: 700, fontSize: 15, color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{ex.name.split("—")[0].trim()}</div>
          <div style={{ fontSize: 10.5, color: T.sub, marginTop: 1 }}>
            {data.label} · ćwiczenie {idx + 1} / {exs.length}
          </div>
        </div>
        <button onClick={goSummary} style={{ background: "transparent", border: "none", color: T.accent, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: U, flexShrink: 0 }}>
          Zakończ
        </button>
      </div>

      {/* karta rest timera */}
      <div className="fu" style={{ background: T.card, border: `1px solid ${T.borderSoft}`, borderRadius: 22, padding: "14px 16px 10px", marginTop: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#fff", fontFamily: U }}>Przerwa</span>
          {rest > 0 && (
            <button onClick={stopRest} style={{ background: "transparent", border: "none", color: T.sub, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: U }}>
              Pomiń
            </button>
          )}
        </div>
        <div style={{ position: "relative", display: "flex", justifyContent: "center", marginTop: 2 }}>
          <TickGauge pct={rest > 0 ? restPct : 1} color={rest > 0 ? (restPaused ? T.yellow : T.accent) : T.ok} />
          <div style={{ position: "absolute", bottom: 4, left: 0, right: 0, textAlign: "center" }}>
            <span style={{ fontFamily: FONT_NUM, fontWeight: 800, fontSize: "1.9rem", color: rest > 0 ? "#fff" : T.ok, lineHeight: 1 }}>
              {rest > 0 ? rest : <Check size={26} strokeWidth={3} style={{ verticalAlign: "-4px" }} />}
            </span>
          </div>
          {/* pauza/wznowienie odliczania — np. gdy ktoś zagadał między seriami */}
          {rest > 0 && (
            <button
              onClick={toggleRestPause}
              aria-label={restPaused ? "Wznów przerwę" : "Wstrzymaj przerwę"}
              style={{ position: "absolute", right: 4, bottom: 0, width: 40, height: 40, borderRadius: "50%", background: restPaused ? T.accent : T.inset, border: `1px solid ${restPaused ? T.accent : T.border}`, color: restPaused ? "#000" : "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              {restPaused ? <Play size={16} strokeWidth={2.4} style={{ marginLeft: 2 }} /> : <Pause size={16} strokeWidth={2.4} />}
            </button>
          )}
        </div>
        <div style={{ textAlign: "center", fontSize: 10, color: restPaused && rest > 0 ? T.yellow : T.sub, marginTop: 4, fontWeight: restPaused && rest > 0 ? 700 : 400 }}>
          {rest > 0 ? (restPaused ? "przerwa wstrzymana" : "auto między seriami") : "gotowy na serię"}
        </div>
      </div>

      {/* kafelki na żywo */}
      <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
        {[
          { v: fmtTime(elapsed), l: "czas" },
          { v: String(totalSetsDone), l: "serie" },
          { v: fmtKg(volume), l: "kg" },
        ].map((s) => (
          <div key={s.l} style={{ flex: 1, background: T.card, border: `1px solid ${T.borderSoft}`, borderRadius: 16, padding: "12px 8px", textAlign: "center" }}>
            <div style={{ fontFamily: FONT_NUM, fontWeight: 800, fontSize: "1.15rem", color: "#fff" }}>{s.v}</div>
            <div style={{ fontSize: 9.5, color: T.sub, fontWeight: 600, marginTop: 3 }}>{s.l}</div>
          </div>
        ))}
      </div>

      {/* przełącznik ćwiczeń — zajęta maszyna? przeskocz i wróć później */}
      <div className="hscroll" style={{ marginTop: 14, paddingTop: 2, paddingBottom: 2 }}>
        {exs.map((e, i) => {
          const done = setsDone[i] >= e.sets;
          const cur = i === idx;
          const started = !done && setsDone[i] > 0;
          return (
            <button
              key={e.id}
              onClick={() => jumpTo(i)}
              disabled={pendingRpe}
              className="tap"
              title={e.name.split("—")[0].trim()}
              style={{
                width: 38,
                height: 38,
                borderRadius: "50%",
                flexShrink: 0,
                opacity: pendingRpe ? 0.35 : 1,
                border: `1.5px solid ${cur ? T.accent : done ? "rgba(52,211,153,0.4)" : started ? T.accentSoftBorder : T.border}`,
                background: cur ? T.accent : done ? "rgba(52,211,153,0.12)" : T.card,
                color: cur ? "#000" : done ? T.ok : started ? T.accent : T.sub,
                fontFamily: FONT_NUM,
                fontWeight: 800,
                fontSize: 14,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                transition: TR.colors,
              }}
            >
              {done ? <Check size={15} strokeWidth={3} /> : i + 1}
            </button>
          );
        })}
      </div>
      <p style={{ fontSize: 9.5, color: T.faint, textAlign: "center", margin: "7px 0 0" }}>
        maszyna zajęta? stuknij numer, aby przeskoczyć — wrócisz później
      </p>

      {/* bieżące ćwiczenie: duża karta ze zdjęciem, serią i ciężarem;
          swipe w lewo/prawo przełącza ćwiczenia, wjazd karty animowany
          zgodnie z kierunkiem ruchu */}
      <div
        key={ex.id}
        className={slideDir === "l" ? "card-in-l" : "card-in-r"}
        onTouchStart={onCardTouchStart}
        onTouchEnd={onCardTouchEnd}
        style={{ position: "relative", flex: 1, minHeight: 210, borderRadius: 24, overflow: "hidden", marginTop: 14, border: `1px solid ${T.borderSoft}` }}
      >
        {cardThumb && <img src={cardThumb} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(23,23,23,0.12) 0%, rgba(23,23,23,0.35) 52%, rgba(23,23,23,0.94) 100%)" }} />
        {/* edycja ciężaru/serii/powtórzeń — dostępna na każdym etapie ćwiczenia,
            także po zaliczonych seriach (trener zmienia obciążenie w trakcie) */}
        <button
          onClick={() => setShowEdit(true)}
          title="Edytuj ciężar i serie"
          aria-label="Edytuj ciężar i serie"
          style={{ position: "absolute", top: 12, right: 12, width: 36, height: 36, borderRadius: "50%", background: T.accent, border: `1px solid ${T.accent}`, color: "#000", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          <SlidersHorizontal size={15} strokeWidth={2.4} />
        </button>
        {/* technika/notatki bez wychodzenia z sesji */}
        <button
          onClick={() => setShowInfo(true)}
          title="Technika ćwiczenia"
          aria-label="Technika ćwiczenia"
          style={{ position: "absolute", top: 12, right: 54, width: 36, height: 36, borderRadius: "50%", background: "rgba(23,23,23,0.6)", backdropFilter: "blur(6px)", border: `1px solid ${T.borderSoft}`, color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          <Info size={15} strokeWidth={2.2} />
        </button>
        {setsDone[idx] === 0 && (
          <button
            onClick={() => setShowSwap(true)}
            title="Zamień ćwiczenie"
            style={{ position: "absolute", top: 12, right: 96, width: 36, height: 36, borderRadius: "50%", background: "rgba(23,23,23,0.6)", backdropFilter: "blur(6px)", border: `1px solid ${T.borderSoft}`, color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            <Repeat size={15} strokeWidth={2.2} />
          </button>
        )}
        <div style={{ position: "absolute", left: 16, right: 16, bottom: 14, display: "flex", alignItems: "flex-end", gap: 10 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* serie rozgrzewkowe z ciężaru roboczego — znikają po 1. serii */}
            {warmups.length > 0 && (
              <div style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "rgba(23,23,23,0.62)", backdropFilter: "blur(4px)", border: `1px solid ${T.borderSoft}`, borderRadius: 99, padding: "4px 10px", marginBottom: 7, fontSize: 10.5, color: T.light }}>
                <Flame size={11} color={T.accent} strokeWidth={2.4} />
                Rozgrzewka: {warmups.map((w) => `${String(w.w).replace(".", ",")}×${w.reps}`).join(" · ")}
              </div>
            )}
            <div style={{ fontSize: 14, fontWeight: 700, color: "#fff", fontFamily: U, display: "flex", alignItems: "center", gap: 5, flexWrap: "wrap" }}>
              Seria {Math.min(setsDone[idx] + 1, ex.sets)} / <EditNum value={ex.sets} min={minSets} max={MAX_SETS} onChange={editSets} /> ·{" "}
              <EditStr value={String(ex.reps)} onChange={editReps} /> powt.
            </div>
            <div style={{ fontSize: 12, color: T.light, marginTop: 4, display: "flex", alignItems: "center", gap: 5, flexWrap: "wrap" }}>
              {ex.weight > 0 ? (
                <>
                  ciężar: <EditNum value={ex.weight} unit={unitOf(ex)} min={0} max={MAX_WEIGHT} onChange={editWeight} />
                  {/* dokładanie/zdejmowanie talerzy jednym stuknięciem — bez wpisywania liczby */}
                  <StepBtn size={26} icon={Minus} label={`Zmniejsz o ${String(wStep).replace(".", ",")} ${unitOf(ex)}`} onClick={() => bumpWeight(-wStep)} disabled={ex.weight <= 0} />
                  <StepBtn size={26} icon={Plus} label={`Zwiększ o ${String(wStep).replace(".", ",")} ${unitOf(ex)}`} onClick={() => bumpWeight(wStep)} disabled={ex.weight >= MAX_WEIGHT} />
                  {/* strzałka vs poprzednia sesja — więcej/mniej/tyle samo */}
                  {weightDelta !== null &&
                    (weightDelta > 0 ? (
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 2, color: T.ok, fontSize: 10.5, fontWeight: 800 }}>
                        <ArrowUp size={11} strokeWidth={3} />+{String(weightDelta).replace(".", ",")}
                      </span>
                    ) : weightDelta < 0 ? (
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 2, color: T.danger, fontSize: 10.5, fontWeight: 800 }}>
                        <ArrowDown size={11} strokeWidth={3} />{String(weightDelta).replace(".", ",")}
                      </span>
                    ) : (
                      <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 10.5, fontWeight: 800 }}>=</span>
                    ))}
                </>
              ) : (
                <>
                  ciężar własny
                  {/* ćwiczenie z planu bez obciążenia też można dociążyć w trakcie
                      (pas, kamizelka, hantel) — bez tego nie było jak dodać ciężaru */}
                  <button
                    onClick={() => bumpWeight(wStep)}
                    style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "rgba(23,23,23,0.62)", backdropFilter: "blur(4px)", border: `1px solid ${T.accentSoftBorder}`, borderRadius: 99, color: T.accent, fontFamily: U, fontWeight: 700, fontSize: 11, padding: "4px 10px", cursor: "pointer" }}
                  >
                    <Plus size={11} strokeWidth={2.8} /> dodaj ciężar
                  </button>
                </>
              )}
            </div>
            {/* wynik z poprzedniej sesji — od razu wiadomo, czy atakować więcej */}
            {lastResult && (
              <div style={{ fontSize: 10.5, color: "rgba(255,255,255,0.62)", marginTop: 4, display: "flex", alignItems: "center", gap: 4 }}>
                <History size={11} strokeWidth={2.2} />
                Ostatnio: {lastResult.weight > 0 ? `${String(lastResult.weight).replace(".", ",")} ${lastResult.unit} × ` : ""}
                {lastResult.setsDone}/{lastResult.sets} serii
                {lastResult.avgRpe != null ? ` · RPE ${String(lastResult.avgRpe).replace(".", ",")}` : ""} ({lastResult.date})
              </div>
            )}
          </div>
          <div style={{ display: "flex", gap: 5, paddingBottom: 4 }}>
            {Array.from({ length: ex.sets }, (_, i) => (
              <span key={i} style={{ width: 9, height: 9, borderRadius: "50%", background: i < setsDone[idx] ? T.ok : "rgba(255,255,255,0.28)" }} />
            ))}
          </div>
        </div>
      </div>

      {/* pytanie o RPE — krótkie, opcjonalne, pojawia się zaraz po zaliczeniu serii */}
      {pendingRpe ? (
        <div className="fu" style={{ background: T.card, border: `1px solid ${T.accentSoftBorder}`, borderRadius: 18, padding: "12px 14px", marginTop: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <Gauge size={15} color={T.accent} strokeWidth={2.2} />
            <span style={{ fontSize: 12.5, fontWeight: 700, color: "#fff", fontFamily: U }}>Jak ciężka była ta seria? (RPE)</span>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            {RPE_OPTS.map((v) => (
              <button
                key={v}
                onClick={() => submitRpe(v)}
                className="tap"
                style={{ flex: 1, background: T.inset, border: `1px solid ${T.border}`, borderRadius: 12, color: "#fff", fontFamily: FONT_NUM, fontWeight: 800, fontSize: 15, padding: "10px 0", cursor: "pointer" }}
              >
                {v}
              </button>
            ))}
          </div>
          <button onClick={() => submitRpe(null)} style={{ width: "100%", marginTop: 8, background: "transparent", border: "none", color: T.sub, fontSize: 11.5, fontWeight: 600, cursor: "pointer", fontFamily: U }}>
            Pomiń
          </button>
        </div>
      ) : (
        <>
          {/* komplet serii nie kończy tematu — trener potrafi dorzucić jeszcze
              jedną; "Dodaj serię" podnosi plan o 1 i odblokowuje zaliczanie */}
          {allSetsDone ? (
            <div style={{ display: "flex", gap: 8, marginTop: 18 }}>
              <div style={{ flex: 1, background: T.inset, color: T.soft, border: `1px solid ${T.border}`, borderRadius: 99, fontFamily: U, fontWeight: 700, fontSize: 14, padding: "15px 12px", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                <Check size={16} color={T.ok} strokeWidth={2.8} /> Serie komplet
              </div>
              <button
                onClick={() => bumpSets(1)}
                disabled={ex.sets >= MAX_SETS}
                className="tap"
                style={{ flexShrink: 0, background: "transparent", color: ex.sets >= MAX_SETS ? T.faint : T.accent, border: `1.5px solid ${ex.sets >= MAX_SETS ? T.border : T.accentSoftBorder}`, borderRadius: 99, fontFamily: U, fontWeight: 700, fontSize: 14, padding: "15px 18px", cursor: ex.sets >= MAX_SETS ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
              >
                <Plus size={16} strokeWidth={2.6} /> Seria
              </button>
            </div>
          ) : (
            <button
              onClick={doneSet}
              className="tap tap-wide"
              style={{ width: "100%", background: T.card, color: "#fff", border: `1px solid ${T.border}`, borderRadius: 99, fontFamily: U, fontWeight: 700, fontSize: 14, padding: "15px 20px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 18 }}
            >
              <Plus size={16} strokeWidth={2.6} /> Zalicz serię ({setsDone[idx] + 1}/{ex.sets})
            </button>
          )}
          <button
            onClick={nextExercise}
            className="tap tap-wide"
            style={{ width: "100%", background: T.accent, color: "#000", border: "none", borderRadius: 99, fontFamily: U, fontWeight: 700, fontSize: 14.5, padding: "16px 20px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 10, boxShadow: T.accentGlow }}
          >
            {exs.every((e, i) => setsDone[i] >= e.sets) ? "Zobacz podsumowanie" : "Następne ćwiczenie"}
            <ChevronRight size={17} strokeWidth={2.6} />
          </button>
        </>
      )}

      {/* arkusz potwierdzenia wyjścia */}
      {confirmExit && (
        <div style={{ position: "fixed", inset: 0, zIndex: 1600 }}>
          <div onClick={() => setConfirmExit(false)} style={{ position: "absolute", inset: 0, background: "rgba(23,23,23,0.7)", backdropFilter: "blur(3px)" }} />
          <div className="slideup" style={{ position: "absolute", left: 0, right: 0, bottom: 0, background: T.card2, borderRadius: "26px 26px 0 0", padding: "26px 22px calc(34px + env(safe-area-inset-bottom))", textAlign: "center" }}>
            <div style={{ width: 54, height: 54, borderRadius: "50%", background: "rgba(244,63,94,0.15)", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
              <LogOut size={22} color={T.danger} strokeWidth={2.2} />
            </div>
            <div style={{ fontFamily: U, fontWeight: 700, fontSize: "1.2rem", color: "#fff", marginTop: 12 }}>Przerwać sesję?</div>
            <div style={{ fontSize: 12, color: T.sub, marginTop: 5 }}>Postęp tej sesji nie zostanie zapisany.</div>
            <button onClick={exit} style={{ width: "100%", marginTop: 20, background: T.accent, color: "#000", border: "none", borderRadius: 99, fontFamily: U, fontWeight: 700, fontSize: 14.5, padding: "15px 20px", cursor: "pointer" }}>
              Przerwij
            </button>
            <button onClick={() => setConfirmExit(false)} style={{ width: "100%", marginTop: 10, background: T.inset, color: T.light, border: "none", borderRadius: 99, fontFamily: U, fontWeight: 700, fontSize: 14, padding: "14px 20px", cursor: "pointer" }}>
              Wróć do treningu
            </button>
          </div>
        </div>
      )}

      {/* arkusz edycji ćwiczenia — ciężar, serie i powtórzenia w trakcie sesji;
          dostępny również po zaliczonych seriach (zmiany od trenera na miejscu) */}
      {showEdit && (
        <div style={{ position: "fixed", inset: 0, zIndex: 1600 }}>
          <div onClick={() => setShowEdit(false)} style={{ position: "absolute", inset: 0, background: "rgba(23,23,23,0.7)", backdropFilter: "blur(3px)" }} />
          <div className="slideup" style={{ position: "absolute", left: 0, right: 0, bottom: 0, maxHeight: "86vh", overflowY: "auto", background: T.card2, borderRadius: "26px 26px 0 0", padding: "20px 20px calc(30px + env(safe-area-inset-bottom))" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ fontFamily: U, fontWeight: 700, fontSize: "1.1rem", color: "#fff" }}>Edytuj ćwiczenie</span>
              <button onClick={() => setShowEdit(false)} aria-label="Zamknij" style={{ width: 32, height: 32, borderRadius: 10, background: T.inset, border: "none", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <X size={15} strokeWidth={2.4} />
              </button>
            </div>
            <p style={{ fontSize: 11.5, color: T.sub, marginBottom: 14 }}>
              {ex.name.split("—")[0].trim()} — zmiany działają od razu w sesji i zapisują się w Twoim planie.
            </p>

            <SheetRow label="Ciężar" hint={`krok ${String(wStep).replace(".", ",")} ${unitOf(ex)}`}>
              <StepBtn icon={Minus} label="Zmniejsz ciężar" onClick={() => bumpWeight(-wStep)} disabled={ex.weight <= 0} />
              {ex.weight > 0 ? (
                <EditNum value={ex.weight} unit={unitOf(ex)} min={0} max={MAX_WEIGHT} onChange={editWeight} fontSize={26} font={FONT_NUM} width={130} />
              ) : (
                <span style={{ fontSize: 13, color: T.soft, fontFamily: U, fontWeight: 600, minWidth: 130, textAlign: "center" }}>ciężar własny</span>
              )}
              <StepBtn icon={Plus} label="Zwiększ ciężar" onClick={() => bumpWeight(wStep)} disabled={ex.weight >= MAX_WEIGHT} />
            </SheetRow>

            <SheetRow label="Serie" hint={setsDone[idx] > 0 ? `zaliczone: ${setsDone[idx]}` : null}>
              <StepBtn icon={Minus} label="Mniej serii" onClick={() => bumpSets(-1)} disabled={ex.sets <= minSets} />
              <EditNum value={ex.sets} min={minSets} max={MAX_SETS} onChange={editSets} fontSize={26} font={FONT_NUM} width={90} />
              <StepBtn icon={Plus} label="Więcej serii" onClick={() => bumpSets(1)} disabled={ex.sets >= MAX_SETS} />
            </SheetRow>

            <SheetRow label="Powtórzenia" hint="np. 8 albo 8-10">
              <EditStr value={String(ex.reps)} onChange={editReps} width={130} />
            </SheetRow>

            <button
              onClick={() => setShowEdit(false)}
              style={{ width: "100%", marginTop: 6, background: T.accent, color: "#000", border: "none", borderRadius: 99, fontFamily: U, fontWeight: 700, fontSize: 14.5, padding: "15px 20px", cursor: "pointer" }}
            >
              Gotowe
            </button>
          </div>
        </div>
      )}

      {/* arkusz zamiany ćwiczenia — tylko zanim zaliczysz pierwszą serię */}
      {showSwap && (
        <div style={{ position: "fixed", inset: 0, zIndex: 1600 }}>
          <div onClick={() => setShowSwap(false)} style={{ position: "absolute", inset: 0, background: "rgba(23,23,23,0.7)", backdropFilter: "blur(3px)" }} />
          <div className="slideup" style={{ position: "absolute", left: 0, right: 0, bottom: 0, maxHeight: "72vh", overflowY: "auto", background: T.card2, borderRadius: "26px 26px 0 0", padding: "20px 20px calc(30px + env(safe-area-inset-bottom))" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ fontFamily: U, fontWeight: 700, fontSize: "1.1rem", color: "#fff" }}>Zamień ćwiczenie</span>
              <button onClick={() => setShowSwap(false)} aria-label="Zamknij" style={{ width: 32, height: 32, borderRadius: 10, background: T.inset, border: "none", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <X size={15} strokeWidth={2.4} />
              </button>
            </div>
            <p style={{ fontSize: 11.5, color: T.sub, marginBottom: 14 }}>Ta sama partia mięśniowa co „{ex.name.split("—")[0].trim()}" — zamiana obowiązuje tylko na dzisiejszą sesję.</p>
            {alternatives.length === 0 ? (
              <p style={{ fontSize: 12.5, color: T.sub, textAlign: "center", padding: "10px 0" }}>Brak innych ćwiczeń na tę partię w planie.</p>
            ) : (
              alternatives.map((alt) => (
                <button
                  key={alt.id}
                  onClick={() => swapExercise(alt)}
                  style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, background: T.card, border: `1px solid ${T.borderSoft}`, borderRadius: 16, padding: 10, marginBottom: 8, cursor: "pointer", textAlign: "left", fontFamily: "inherit" }}
                >
                  {EX_THUMB[alt.id] ? (
                    <img src={EX_THUMB[alt.id]} alt="" style={{ width: 46, height: 46, borderRadius: 12, objectFit: "cover", flexShrink: 0 }} />
                  ) : (
                    <span style={{ width: 46, height: 46, borderRadius: 12, flexShrink: 0, background: T.inset, border: `1px solid ${T.borderSoft}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800, color: T.soft, fontFamily: U }}>
                      {(CAT_LABEL[alt.cat] || alt.cat || "").slice(0, 3).toUpperCase()}
                    </span>
                  )}
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#fff", fontFamily: U }}>{alt.name}</span>
                    <span style={{ display: "block", fontSize: 11, color: T.sub, marginTop: 2 }}>
                      {ex.sets} serie · {alt.reps} powt.{alt.weight > 0 ? ` · ${String(alt.weight).replace(".", ",")} ${alt.unit}` : alt.extra ? " · dobierz ciężar na miejscu" : ""}
                    </span>
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {/* arkusz techniki — szczegóły ćwiczenia bez wychodzenia z sesji */}
      {showInfo && (
        <div style={{ position: "fixed", inset: 0, zIndex: 1600 }}>
          <div onClick={() => setShowInfo(false)} style={{ position: "absolute", inset: 0, background: "rgba(23,23,23,0.7)", backdropFilter: "blur(3px)" }} />
          <div className="slideup" style={{ position: "absolute", left: 0, right: 0, bottom: 0, maxHeight: "82vh", overflowY: "auto", background: T.card2, borderRadius: "26px 26px 0 0", padding: "20px 20px calc(30px + env(safe-area-inset-bottom))" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ fontFamily: U, fontWeight: 700, fontSize: "1.1rem", color: "#fff" }}>{ex.name.split("—")[0].trim()}</span>
              <button onClick={() => setShowInfo(false)} aria-label="Zamknij" style={{ width: 32, height: 32, borderRadius: 10, background: T.inset, border: "none", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <X size={15} strokeWidth={2.4} />
              </button>
            </div>
            <p style={{ fontSize: 11, color: T.sub, marginBottom: 12 }}>{CAT_LABEL[ex.cat] || ex.cat} · {ex.sets} serie × {ex.reps} powt.</p>
            {/* zdjęcie ćwiczenia, jak w szczegółach — statyczne, bez animacji */}
            {infoImg && (
              <div style={{ position: "relative", height: 190, borderRadius: 18, overflow: "hidden", background: T.card, border: `1px solid ${T.borderSoft}`, marginBottom: 14 }}>
                <img src={infoImg} alt={ex.name} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
            )}
            {infoSteps.length > 0 ? (
              infoSteps.map((s, i) => (
                <div key={i} style={{ display: "flex", gap: 12, marginBottom: 10 }}>
                  <span style={{ width: 22, height: 22, borderRadius: "50%", background: T.accentSoftBg, border: `1px solid ${T.accentSoftBorder}`, color: T.accent, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10.5, fontWeight: 800, fontFamily: FONT_NUM, flexShrink: 0, marginTop: 1 }}>
                    {i + 1}
                  </span>
                  <p style={{ fontSize: 12.5, color: T.light, lineHeight: 1.55, margin: 0 }}>{s}.</p>
                </div>
              ))
            ) : (
              <p style={{ fontSize: 12.5, color: T.soft, lineHeight: 1.6, margin: 0 }}>
                Kontrola w całym zakresie ruchu — 2 s faza opuszczania, bez szarpania. Pełen zakres, stabilna pozycja, wydech przy wysiłku.
              </p>
            )}
            {ex.note && (
              <div style={{ marginTop: 10, padding: "10px 13px", background: T.accentSoftBg, border: `1px solid ${T.accentSoftBorder}`, borderRadius: 14, fontSize: 12, color: T.light, lineHeight: 1.5 }}>
                {ex.note}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
