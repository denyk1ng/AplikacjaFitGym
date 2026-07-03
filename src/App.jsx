import { useEffect, useState } from "react";
import { Flame, ChevronRight } from "lucide-react";
import { T } from "./theme.js";
import { EXERCISES_DATA } from "./data/plan.js";
import { PHOTOS } from "./data/photos.js";
import { storage } from "./lib/storage.js";
import { DashboardTab } from "./components/DashboardTab.jsx";
import { StatsTab } from "./components/StatsTab.jsx";
import { WarmupTab } from "./components/WarmupTab.jsx";
import { DayExCard } from "./components/DayExCard.jsx";
import { BottomNav } from "./components/BottomNav.jsx";
import { OnboardingFlow } from "./components/OnboardingFlow.jsx";
import { ProfileTab } from "./components/ProfileTab.jsx";
import { CalendarTab } from "./components/CalendarTab.jsx";
import { SplashScreen } from "./components/SplashScreen.jsx";
import { LogoMark } from "./components/Logo.jsx";
import { WorkoutDetail } from "./components/WorkoutDetail.jsx";
import { ExerciseDetail } from "./components/ExerciseDetail.jsx";

export default function App() {
  const [tab, setTab] = useState("dom");
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

  // imię z profilu (odświeżane przy wejściu na ekran główny)
  useEffect(() => {
    if (tab !== "dom") return;
    storage.get("profile").then((p) => {
      try {
        if (p && p.value) setUserName(JSON.parse(p.value).name || "");
      } catch (e) {}
    });
  }, [tab]);

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
      setStorageReady(true);
    }
    load();
  }, []);

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

  const titles = { dom: "Dom", trening: "Trening", sesja: `Sesja — Trening ${selectedDay}`, stats: "Statystyki", rozgrzewka: "Rozgrzewka", profil: "Profil", kalendarz: "Kalendarz" };

  return (
    <div style={{ color: T.text, minHeight: "100vh", padding: "20px 18px 140px", maxWidth: 680, margin: "0 auto" }}>
      {showSplash && <SplashScreen onDone={() => setShowSplash(false)} />}
      {showOnboard && !showSplash && <OnboardingFlow onDone={dismissOnboard} />}

      {tab !== "dom" && tab !== "trening" && tab !== "cwiczenie" && (
        <div style={{ marginBottom: 20, display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
          <div>
            <p style={{ display: "flex", alignItems: "center", gap: 5, color: T.sub, fontSize: 10, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", marginBottom: 5 }}>
              <LogoMark size={13} />
              FOR<span style={{ color: T.accent, marginLeft: -5 }}>MA</span>
            </p>
            <h1 style={{ fontFamily: "'Urbanist',sans-serif", fontSize: "1.6rem", fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1, color: "#fff" }}>
              {titles[tab]}
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
              border: `1.5px solid ${tab === "profil" ? T.accent : T.border}`,
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
        <div key={tab} className="fu">
          {tab === "dom" && <DashboardTab snapshots={snapshots} exercises={exercises} goTraining={goTraining} goTo={setTab} userName={userName} />}

          {tab === "trening" && (
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

          {tab === "cwiczenie" && exerciseId && (
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
              onBack={() => setTab("trening")}
            />
          )}

          {tab === "sesja" && (
            <>
              <button
                onClick={() => setTab("rozgrzewka")}
                style={{ width: "100%", background: T.card, border: `1px solid ${T.borderSoft}`, borderRadius: 20, padding: "12px 14px", cursor: "pointer", fontFamily: "inherit", marginBottom: 12, display: "flex", alignItems: "center", gap: 12, textAlign: "left" }}
              >
                <span style={{ width: 40, height: 40, borderRadius: 13, background: "rgba(255,107,53,0.13)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Flame size={19} color={T.orange} strokeWidth={2.2} />
                </span>
                <span style={{ flex: 1 }}>
                  <span style={{ display: "block", fontSize: 13.5, fontWeight: 700, color: "#fff" }}>Rozgrzewka</span>
                  <span style={{ display: "block", fontSize: 11, color: T.sub, marginTop: 1 }}>baza + aktywacja · 8–10 min</span>
                </span>
                <ChevronRight size={18} color={T.faint} strokeWidth={2.2} />
              </button>

              <p style={{ fontSize: 11, color: T.faint, lineHeight: 1.5, margin: "0 2px 12px", textAlign: "center" }}>
                Kliknij wartość, aby ją zmienić · nazwa ćwiczenia otwiera technikę i serie
              </p>

              {day.exercises.map((ex, idx) => (
                <DayExCard key={ex.id} ex={ex} idx={idx} onUpdate={(updated) => updateEx(selectedDay, idx, updated)} />
              ))}
            </>
          )}

          {tab === "stats" && <StatsTab snapshots={snapshots} />}
          {tab === "rozgrzewka" && <WarmupTab onBack={() => setTab("trening")} />}
          {tab === "profil" && <ProfileTab />}
          {tab === "kalendarz" && <CalendarTab goTraining={goTraining} />}
        </div>
      )}

      {storageReady && !showOnboard && <BottomNav tab={tab} setTab={setTab} onSave={handleSave} saveAnim={saveAnim} />}
    </div>
  );
}
