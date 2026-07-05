import { useEffect, useState } from "react";
import { T } from "./theme.js";
import { EXERCISES_DATA } from "./data/plan.js";
import { PHOTOS } from "./data/photos.js";
import { storage } from "./lib/storage.js";
import { isoWeekStart } from "./lib/utils.js";
import { loadWorkoutLog, saveWorkoutLog, weekStatus } from "./lib/workoutLog.js";
import { DashboardTab } from "./components/DashboardTab.jsx";
import { StatsTab } from "./components/StatsTab.jsx";
import { WarmupTab } from "./components/WarmupTab.jsx";
import { BottomNav } from "./components/BottomNav.jsx";
import { OnboardingFlow } from "./components/OnboardingFlow.jsx";
import { ProfileTab } from "./components/ProfileTab.jsx";
import { CalendarTab } from "./components/CalendarTab.jsx";
import { SplashScreen } from "./components/SplashScreen.jsx";
import { LogoMark } from "./components/Logo.jsx";
import { WorkoutDetail } from "./components/WorkoutDetail.jsx";
import { ExerciseDetail } from "./components/ExerciseDetail.jsx";
import { LiveSession, loadLiveState } from "./components/LiveSession.jsx";
import { QuickAddSheet } from "./components/QuickAddSheet.jsx";
import { CoachTab } from "./components/CoachTab.jsx";

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
  const [showSplash, setShowSplash] = useState(true);
  const [exerciseId, setExerciseId] = useState(null);
  const [userName, setUserName] = useState("");
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [logRefresh, setLogRefresh] = useState(0); // odświeża dom/kalendarz po szybkiej akcji

  // appka nie ma routera, więc przeglądarka nie scrolluje sama do góry przy
  // zmianie "ekranu" — bez tego nowa zakładka otwiera się w tym samym miejscu
  // przewinięcia co poprzednia (potrafi schować przycisk "wstecz" pod górną krawędzią)
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [displayTab, exerciseId, selectedDay]);

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

  const handleSave = async () => {
    await persist(exercises);
    const now = new Date();
    const dateFull = now.toLocaleDateString("pl-PL", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
    const dateShort = now.toLocaleDateString("pl-PL", { day: "numeric", month: "short" });
    const weights = {};
    Object.values(exercises).forEach((d) =>
      d.exercises.forEach((e) => {
        if (e.weight > 0) weights[e.id] = e.weight;
      })
    );
    const snapshot = { ts: now.getTime(), date: dateFull.charAt(0).toUpperCase() + dateFull.slice(1), dateShort, weights };
    setSnapshots((prev) => {
      const updated = [...prev, snapshot];
      try {
        storage.set("progress_snapshots", JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
    setSaveAnim(true);
    setTimeout(() => setSaveAnim(false), 2200);
  };

  const dismissOnboard = () => {
    setShowOnboard(false);
    try {
      storage.set("forma_onboarded", "1");
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
    const start = isoWeekStart(Date.now());
    const rest = log.filter((e) => !(e.type === type && e.ts >= start));
    rest.push({ ts: Date.now(), date: new Date().toLocaleDateString("sv-SE"), type, ...stats });
    saveWorkoutLog(rest);
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

  const titles = { dom: "Dom", trening: "Trening", sesja: `Sesja — Trening ${selectedDay}`, stats: "Statystyki", rozgrzewka: "Rozgrzewka", profil: "Profil", kalendarz: "Kalendarz", coach: "Trener AI" };

  return (
    <div
      style={{
        color: T.text,
        minHeight: "100vh",
        paddingTop: "calc(20px + env(safe-area-inset-top))",
        paddingLeft: "calc(18px + env(safe-area-inset-left))",
        paddingRight: "calc(18px + env(safe-area-inset-right))",
        paddingBottom: "calc(140px + env(safe-area-inset-bottom))",
        maxWidth: 680,
        margin: "0 auto",
      }}
    >
      {showSplash && <SplashScreen onDone={() => setShowSplash(false)} />}
      {showOnboard && !showSplash && <OnboardingFlow onDone={dismissOnboard} />}

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
              onStart={() => setTab("sesja")}
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
              onChangeWeight={(v) => {
                for (const [dk, d] of Object.entries(exercises)) {
                  const i = d.exercises.findIndex((e) => e.id === exerciseId);
                  if (i >= 0) {
                    updateEx(dk, i, { ...d.exercises[i], weight: v });
                    break;
                  }
                }
              }}
              onBack={() => setTab("trening")}
            />
          )}

          {displayTab === "sesja" && (
            <LiveSession
              dayKey={selectedDay}
              data={day}
              snapshots={snapshots}
              onExit={() => setTab("trening")}
              updateWeight={(id, v) => {
                const idx = day.exercises.findIndex((e) => e.id === id);
                if (idx >= 0) updateEx(selectedDay, idx, { ...day.exercises[idx], weight: v });
              }}
              onSaveAll={async (stats) => {
                await handleSave();
                await markWorkoutDone(selectedDay, stats);
                setTab("dom");
              }}
            />
          )}

          {displayTab === "stats" && <StatsTab snapshots={snapshots} />}
          {displayTab === "rozgrzewka" && <WarmupTab onBack={() => setTab("trening")} />}
          {displayTab === "profil" && <ProfileTab />}
          {displayTab === "kalendarz" && <CalendarTab key={logRefresh} goTraining={goTraining} />}
          {displayTab === "coach" && <CoachTab exercises={exercises} />}
        </div>
      )}

      {storageReady && !showOnboard && displayTab !== "sesja" && <BottomNav tab={tab} setTab={setTab} onSave={() => setShowQuickAdd(true)} saveAnim={saveAnim} />}

      <QuickAddSheet
        open={showQuickAdd}
        onClose={() => setShowQuickAdd(false)}
        onStartWorkout={(type) => {
          setShowQuickAdd(false);
          setSelectedDay(type);
          setTab("sesja");
        }}
        onOpenPlan={() => {
          setShowQuickAdd(false);
          setTab("trening");
        }}
        onSaveWeights={handleSave}
        onLogChanged={() => setLogRefresh((c) => c + 1)}
      />
    </div>
  );
}
