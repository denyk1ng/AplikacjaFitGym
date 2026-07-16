import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { Play } from "lucide-react";
import { T } from "./theme.js";
import { EXERCISES_DATA } from "./data/plan.js";
import { PHOTOS } from "./data/photos.js";
import { storage } from "./lib/storage.js";
import { isoWeekStart } from "./lib/utils.js";
import { loadWorkoutLog, saveWorkoutLog, weekStatus } from "./lib/workoutLog.js";
import { maybeTrainingReminder } from "./lib/reminder.js";
import { DashboardTab } from "./components/DashboardTab.jsx";
import { WarmupTab } from "./components/WarmupTab.jsx";
import { BottomNav } from "./components/BottomNav.jsx";
import { OnboardingFlow } from "./components/OnboardingFlow.jsx";
// Statystyki i Profil ciągną Recharts (~200 kB) — ładowane leniwie, żeby
// pierwszy start appki nie płacił za wykresy, których jeszcze nie widać
const StatsTab = lazy(() => import("./components/StatsTab.jsx").then((m) => ({ default: m.StatsTab })));
const ProfileTab = lazy(() => import("./components/ProfileTab.jsx").then((m) => ({ default: m.ProfileTab })));
import { CalendarTab } from "./components/CalendarTab.jsx";
import { SplashScreen } from "./components/SplashScreen.jsx";
import { LogoMark } from "./components/Logo.jsx";
import { WorkoutDetail } from "./components/WorkoutDetail.jsx";
import { ExerciseDetail } from "./components/ExerciseDetail.jsx";
import { LiveSession, loadLiveState, clearLiveState } from "./components/LiveSession.jsx";
import { QuickAddSheet } from "./components/QuickAddSheet.jsx";
import { ConfirmSheet } from "./components/ConfirmSheet.jsx";
import { WelcomeTour } from "./components/WelcomeTour.jsx";

export default function App() {
  const [tab, setTab] = useState("dom");
  // treść i nagłówek renderują się z opóźnionym `displayTab` zamiast `tab`
  // bezpośrednio — daje to krótkie płynne zniknięcie starej zakładki przed
  // wejściem nowej, zamiast twardego cięcia. BottomNav podświetla się od razu
  // na `tab`, żeby dotyk czuł się responsywnie.
  const [displayTab, setDisplayTab] = useState("dom");
  const [tabPhase, setTabPhase] = useState("in"); // "out" | "in"
  useEffect(() => {
    if (tab === displayTab) return;
    setTabPhase("out");
    const t = setTimeout(() => {
      setDisplayTab(tab);
      setTabPhase("in");
    }, 160);
    return () => clearTimeout(t);
  }, [tab]);
  const [selectedDay, setSelectedDay] = useState(() => {
    const d = new Date().getDay();
    return d === 3 ? "B" : d === 5 ? "C" : "A";
  });
  const [exercises, setExercises] = useState(() => {
    const r = {};
    Object.entries(EXERCISES_DATA).forEach(([k, v]) => {
      r[k] = { ...v, exercises: v.exercises.map((e) => ({ ...e })) };
    });
    return r;
  });
  const [storageReady, setStorageReady] = useState(false);
  const [saveAnim, setSaveAnim] = useState(false);
  const [snapshots, setSnapshots] = useState([]);
  const [showOnboard, setShowOnboard] = useState(false);
  const [showTour, setShowTour] = useState(false); // przewodnik po pierwszym onboardingu
  const [showSplash, setShowSplash] = useState(true);
  // skrócony splash przy kolejnych otwarciach tego samego dnia
  const [quickSplash] = useState(() => {
    try {
      const today = new Date().toLocaleDateString("sv-SE");
      const quick = localStorage.getItem("splash_last") === today;
      localStorage.setItem("splash_last", today);
      return quick;
    } catch (e) {
      return false;
    }
  });
  const [exerciseId, setExerciseId] = useState(null);
  const [userName, setUserName] = useState("");
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [logRefresh, setLogRefresh] = useState(0); // odświeża dom/kalendarz po szybkiej akcji
  const [pendingStart, setPendingStart] = useState(null); // dzień, którego start koliduje z trwającą sesją
  const [toast, setToast] = useState(null); // krótki komunikat sukcesu (np. po zapisie treningu)

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2600);
  };

  // start sesji z ochroną przed nadpisaniem: jeśli w localStorage wisi
  // niedokończona sesja INNEGO dnia, pytamy zamiast po cichu ją skasować
  const startSession = (dayKey) => {
    const saved = loadLiveState();
    if (saved && saved.dayKey && saved.dayKey !== dayKey && EXERCISES_DATA[saved.dayKey]) {
      setPendingStart(dayKey);
      return;
    }
    setSelectedDay(dayKey);
    setTab("sesja");
  };

  // appka nie ma routera, więc przeglądarka nie scrolluje sama do góry przy
  // zmianie "ekranu" — bez tego nowa zakładka otwiera się w tym samym miejscu
  // przewinięcia co poprzednia (potrafi schować przycisk "wstecz" pod górną krawędzią)
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [displayTab, exerciseId, selectedDay]);

  // minimalna integracja z przyciskiem "wstecz" (Android/gest): wejście na
  // ekran inny niż Dom odkłada wpis w historii, a cofnięcie wraca na Dom
  // zamiast od razu zamykać aplikację; z Domu — standardowe wyjście.
  // Sesja live jest bezpieczna: jej stan i tak siedzi w localStorage.
  const tabRef = useRef(tab);
  tabRef.current = tab;
  useEffect(() => {
    if (displayTab !== "dom") history.pushState({ t: displayTab }, "");
  }, [displayTab]);
  useEffect(() => {
    const onPop = () => {
      if (tabRef.current !== "dom") setTab("dom");
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  // imię z profilu (odświeżane przy wejściu na ekran główny)
  useEffect(() => {
    if (displayTab !== "dom") return;
    storage.get("profile").then((p) => {
      try {
        if (p && p.value) setUserName(JSON.parse(p.value).name || "");
      } catch (e) {}
    });
  }, [displayTab]);

  useEffect(() => {
    async function load() {
      let saved = null;
      try {
        const result = await storage.get("plan_custom");
        if (result && result.value) saved = JSON.parse(result.value);
      } catch (e) {
        saved = null;
      }
      if (saved) {
        setExercises((prev) => {
          const updated = {};
          Object.entries(prev).forEach(([dayKey, dayData]) => {
            updated[dayKey] = {
              ...dayData,
              exercises: dayData.exercises.map((ex) => {
                const s = saved[ex.id];
                return s ? { ...ex, weight: s.weight ?? ex.weight, sets: s.sets ?? ex.sets, reps: s.reps ?? ex.reps, rest: s.rest ?? ex.rest } : ex;
              }),
            };
          });
          return updated;
        });
      }
      try {
        const snap = await storage.get("progress_snapshots");
        if (snap && snap.value) setSnapshots(JSON.parse(snap.value));
      } catch (e) {}
      const onboarded = await storage.get("forma_onboarded");
      if (!onboarded) setShowOnboard(true);
      // niedokończona sesja? wróć prosto do niej
      const live = loadLiveState();
      if (onboarded && live && live.dayKey && EXERCISES_DATA[live.dayKey]) {
        setSelectedDay(live.dayKey);
        setTab("sesja");
      }
      setStorageReady(true);
      updateAppBadge();
      maybeTrainingReminder(); // lokalne przypomnienie o treningu (jeśli włączone i pora minęła)
    }
    load();
  }, []);

  useEffect(() => {
    if (storageReady && logRefresh > 0) updateAppBadge();
  }, [logRefresh]);

  const persist = async (exState) => {
    try {
      const data = {};
      Object.values(exState).forEach((day) => {
        day.exercises.forEach((ex) => {
          data[ex.id] = { weight: ex.weight, sets: ex.sets, reps: ex.reps, rest: ex.rest };
        });
      });
      await storage.set("plan_custom", JSON.stringify(data));
    } catch (e) {}
  };

  useEffect(() => {
    if (storageReady) persist(exercises);
  }, [exercises, storageReady]);

  const day = exercises[selectedDay];

  const updateEx = (dayKey, idx, updated) => {
    setExercises((prev) => ({
      ...prev,
      [dayKey]: { ...prev[dayKey], exercises: prev[dayKey].exercises.map((e, i) => (i === idx ? updated : e)) },
    }));
  };

  // buduje wpis snapshotu (punkt na wykresie progresu) z aktualnego stanu ćwiczeń
  const buildSnapshot = (exState) => {
    const now = new Date();
    const dateFull = now.toLocaleDateString("pl-PL", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
    const dateShort = now.toLocaleDateString("pl-PL", { day: "numeric", month: "short" });
    const weights = {};
    Object.values(exState).forEach((d) =>
      d.exercises.forEach((e) => {
        if (e.weight > 0) weights[e.id] = e.weight;
      })
    );
    return { ts: now.getTime(), date: dateFull.charAt(0).toUpperCase() + dateFull.slice(1), dateShort, weights };
  };

  // dopisuje punkt progresu TYLKO gdy ciężary faktycznie się zmieniły od
  // ostatniego zapisu — wcześniej każdy "Zapisz trening" dodawał płaski dubel
  // na wykres i zawyżał licznik zapisów
  const saveSnapshot = (snapshot) => {
    setSnapshots((prev) => {
      const last = prev[prev.length - 1];
      if (last && JSON.stringify(last.weights) === JSON.stringify(snapshot.weights)) return prev;
      const updated = [...prev, snapshot];
      try {
        storage.set("progress_snapshots", JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
    setSaveAnim(true);
    setTimeout(() => setSaveAnim(false), 2200);
  };

  const handleSave = async () => {
    await persist(exercises);
    saveSnapshot(buildSnapshot(exercises));
  };

  // edycja ciężaru pojedynczego ćwiczenia z zakładki Statystyki — od razu
  // dopisuje nowy punkt do progresu (żeby zmiana była widoczna na wykresie),
  // budując snapshot z jawnie obliczonego stanu zamiast czekać na re-render
  const changeWeightAndSnapshot = async (exerciseId, v) => {
    const next = {};
    Object.entries(exercises).forEach(([dk, d]) => {
      next[dk] = { ...d, exercises: d.exercises.map((e) => (e.id === exerciseId ? { ...e, weight: v } : e)) };
    });
    setExercises(next);
    await persist(next);
    saveSnapshot(buildSnapshot(next));
  };

  // edycja docelowych powtórzeń — tylko aktualizuje plan, bez wpływu na
  // wykres progresu (który dotyczy ciężaru), zapis do plan_custom leci
  // automatycznie przez efekt obserwujący `exercises`
  const changeReps = (exerciseId, v) => {
    for (const [dk, d] of Object.entries(exercises)) {
      const i = d.exercises.findIndex((e) => e.id === exerciseId);
      if (i >= 0) {
        updateEx(dk, i, { ...d.exercises[i], reps: v });
        break;
      }
    }
  };

  // edycja liczby serii — np. plan miał zamienione miejscami serie/powtórzenia
  // (8 serii po 4 zamiast 4 serii po 8); tylko aktualizuje plan, bez wpływu
  // na wykres progresu ciężaru
  const changeSets = (exerciseId, v) => {
    for (const [dk, d] of Object.entries(exercises)) {
      const i = d.exercises.findIndex((e) => e.id === exerciseId);
      if (i >= 0) {
        updateEx(dk, i, { ...d.exercises[i], sets: v });
        break;
      }
    }
  };

  const dismissOnboard = () => {
    setShowOnboard(false);
    try {
      storage.set("forma_onboarded", "1");
    } catch (e) {}
    // świeży użytkownik: krótki przewodnik "gdzie co jest" — raz, zaraz po kreatorze
    try {
      if (!localStorage.getItem("walkthrough_done")) setShowTour(true);
    } catch (e) {
      setShowTour(true);
    }
  };

  const dismissTour = () => {
    setShowTour(false);
    try {
      localStorage.setItem("walkthrough_done", "1");
    } catch (e) {}
  };

  const goTraining = (dayKey) => {
    setSelectedDay(dayKey);
    setTab("trening");
  };

  // odhacza trening danego typu w bieżącym tygodniu (pn–nd);
  // stats z sesji na żywo (czas, serie, objętość) trafiają do wpisu
  const markWorkoutDone = async (type, stats = {}) => {
    const log = await loadWorkoutLog();
    // dopisujemy, nie zastępujemy — drugi trening tego samego typu w tygodniu
    // nie kasuje statystyk pierwszego (logika tygodnia patrzy "czy jest ≥1")
    log.push({ ts: Date.now(), date: new Date().toLocaleDateString("sv-SE"), type, ...stats });
    saveWorkoutLog(log);
    updateAppBadge();
  };

  // Badge API — pokazuje na ikonie zainstalowanej PWA liczbę treningów
  // (A/B/C) zostałych do zaliczenia w bieżącym tygodniu. Substytut widżetu
  // ekranu głównego, którego web PWA nie może zaoferować (brak API systemu).
  const updateAppBadge = async () => {
    if (!("setAppBadge" in navigator)) return;
    try {
      const log = await loadWorkoutLog();
      const st = weekStatus(log);
      const remaining = ["A", "B", "C"].filter((k) => !st[k].done).length;
      if (remaining > 0) await navigator.setAppBadge(remaining);
      else await navigator.clearAppBadge();
    } catch (e) {}
  };

  const titles = { dom: "Dom", trening: "Trening", sesja: `Sesja — Trening ${selectedDay}`, stats: "Statystyki", rozgrzewka: "Rozgrzewka", profil: "Profil", kalendarz: "Kalendarz" };

  return (
    <div
      style={{
        color: T.text,
        minHeight: "100vh",
        paddingTop: "calc(20px + env(safe-area-inset-top))",
        paddingLeft: "calc(18px + env(safe-area-inset-left))",
        paddingRight: "calc(18px + env(safe-area-inset-right))",
        paddingBottom: "calc(140px + env(safe-area-inset-bottom))",
        maxWidth: 430, // format smartfona także na dużych ekranach — to appka, nie strona
        margin: "0 auto",
      }}
    >
      {showSplash && <SplashScreen quick={quickSplash} onDone={() => setShowSplash(false)} />}
      {showOnboard && !showSplash && <OnboardingFlow onDone={dismissOnboard} />}
      {showTour && !showOnboard && !showSplash && <WelcomeTour onDone={dismissTour} />}

      {displayTab !== "dom" && displayTab !== "trening" && displayTab !== "cwiczenie" && displayTab !== "sesja" && displayTab !== "rozgrzewka" && (
        <div style={{ marginBottom: 20, display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
          <div>
            <p style={{ display: "flex", alignItems: "center", gap: 5, color: T.sub, fontSize: 10, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", marginBottom: 5 }}>
              <LogoMark size={13} />
              FOR<span style={{ color: T.accent, marginLeft: -5 }}>MA</span>
            </p>
            <h1 style={{ fontFamily: "'Urbanist',sans-serif", fontSize: "1.6rem", fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1, color: "#fff" }}>
              {titles[displayTab]}
            </h1>
          </div>
          <button
            onClick={() => setTab("profil")}
            title="Profil"
            style={{
              width: 40,
              height: 40,
              borderRadius: "50%",
              padding: 0,
              overflow: "hidden",
              background: T.card,
              border: `1.5px solid ${displayTab === "profil" ? T.accent : T.border}`,
              cursor: "pointer",
              flexShrink: 0,
            }}
          >
            <img src={PHOTOS.hero} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </button>
        </div>
      )}

      {!storageReady && <div style={{ textAlign: "center", padding: "48px", color: T.faint, fontSize: 13 }}>Ładowanie...</div>}

      {storageReady && (
        <div key={displayTab} className={tabPhase === "out" ? "tabout" : "fu"}>
          {displayTab === "dom" && <DashboardTab key={logRefresh} snapshots={snapshots} exercises={exercises} goTraining={goTraining} goTo={setTab} userName={userName} />}

          {displayTab === "trening" && (
            <WorkoutDetail
              dayKey={selectedDay}
              data={day}
              onBack={() => setTab("dom")}
              onWarmup={() => setTab("rozgrzewka")}
              onSelectDay={setSelectedDay}
              onStart={() => startSession(selectedDay)}
              onExercise={(id) => {
                setExerciseId(id);
                setTab("cwiczenie");
              }}
            />
          )}

          {displayTab === "cwiczenie" && exerciseId && (
            <ExerciseDetail
              exerciseId={exerciseId}
              snapshots={snapshots}
              currentWeight={(() => {
                for (const d of Object.values(exercises)) {
                  const e = d.exercises.find((x) => x.id === exerciseId);
                  if (e) return e.weight;
                }
                return null;
              })()}
              onChangeWeight={(v) => changeWeightAndSnapshot(exerciseId, v)}
              onBack={() => setTab("trening")}
            />
          )}

          {displayTab === "sesja" && (
            <LiveSession
              dayKey={selectedDay}
              data={day}
              snapshots={snapshots}
              onExit={() => setTab("trening")}
              updateWeight={changeWeightAndSnapshot}
              updateReps={changeReps}
              onSaveAll={async (stats) => {
                await handleSave();
                await markWorkoutDone(selectedDay, stats);
                setTab("dom");
                showToast(`Zapisano — Trening ${selectedDay} zaliczony`);
              }}
            />
          )}

          {displayTab === "stats" && (
            <Suspense fallback={<div style={{ textAlign: "center", padding: 48, color: T.faint, fontSize: 13 }}>Ładowanie…</div>}>
              <StatsTab snapshots={snapshots} exercises={exercises} onChangeWeight={changeWeightAndSnapshot} onChangeReps={changeReps} onChangeSets={changeSets} />
            </Suspense>
          )}
          {displayTab === "rozgrzewka" && <WarmupTab onBack={() => setTab("trening")} />}
          {displayTab === "profil" && (
            <Suspense fallback={<div style={{ textAlign: "center", padding: 48, color: T.faint, fontSize: 13 }}>Ładowanie…</div>}>
              <ProfileTab />
            </Suspense>
          )}
          {displayTab === "kalendarz" && <CalendarTab key={logRefresh} goTraining={goTraining} onLogChanged={updateAppBadge} />}
        </div>
      )}

      {storageReady && !showOnboard && displayTab !== "sesja" && <BottomNav tab={tab} setTab={setTab} onSave={() => setShowQuickAdd(true)} saveAnim={saveAnim} />}

      <QuickAddSheet
        open={showQuickAdd}
        onClose={() => setShowQuickAdd(false)}
        onStartWorkout={(type) => {
          setShowQuickAdd(false);
          startSession(type);
        }}
        onOpenPlan={() => {
          setShowQuickAdd(false);
          setTab("trening");
        }}
        onSaveWeights={handleSave}
        onLogChanged={() => setLogRefresh((c) => c + 1)}
      />

      {/* konflikt: start treningu przy niedokończonej sesji innego dnia */}
      <ConfirmSheet
        open={!!pendingStart}
        onClose={() => {
          // "Wznów tamten" — wracamy do zapisanej sesji zamiast ją kasować
          const saved = loadLiveState();
          setPendingStart(null);
          if (saved && saved.dayKey && EXERCISES_DATA[saved.dayKey]) {
            setSelectedDay(saved.dayKey);
            setTab("sesja");
          }
        }}
        icon={Play}
        tone="accent"
        title={`Masz niedokończony Trening ${loadLiveState()?.dayKey || ""}`}
        desc={`Rozpoczęcie Treningu ${pendingStart || ""} skasuje zapisany postęp tamtej sesji.`}
        confirmLabel={`Porzuć i zacznij Trening ${pendingStart || ""}`}
        cancelLabel={`Wznów Trening ${loadLiveState()?.dayKey || ""}`}
        onConfirm={() => {
          clearLiveState();
          const target = pendingStart;
          setPendingStart(null);
          setSelectedDay(target);
          setTab("sesja");
        }}
      />

      {/* toast sukcesu (np. po zapisie treningu) */}
      {toast && (
        <div
          className="fu"
          style={{
            position: "fixed",
            left: "50%",
            transform: "translateX(-50%)",
            bottom: "calc(96px + env(safe-area-inset-bottom))",
            zIndex: 1700,
            background: T.card2,
            border: `1px solid ${T.accentSoftBorder}`,
            color: T.accent,
            fontFamily: "'Urbanist',sans-serif",
            fontWeight: 700,
            fontSize: 13,
            padding: "12px 20px",
            borderRadius: 99,
            boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
            whiteSpace: "nowrap",
          }}
        >
          {toast}
        </div>
      )}
    </div>
  );
}
