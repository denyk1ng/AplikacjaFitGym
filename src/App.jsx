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
import { Onboarding } from "./components/Onboarding.jsx";
import { ProfileTab } from "./components/ProfileTab.jsx";
import { CalendarTab } from "./components/CalendarTab.jsx";
import { SplashScreen } from "./components/SplashScreen.jsx";
import { LogoMark } from "./components/Logo.jsx";

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

  const titles = { dom: "Dom", trening: "Trening", stats: "Statystyki", rozgrzewka: "Rozgrzewka", profil: "Profil", kalendarz: "Kalendarz" };

  return (
    <div style={{ color: T.text, minHeight: "100vh", padding: "20px 18px 140px", maxWidth: 680, margin: "0 auto" }}>
      {showSplash && <SplashScreen onDone={() => setShowSplash(false)} />}
      {showOnboard && <Onboarding onDone={dismissOnboard} />}

      {tab !== "dom" && (
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

              <div style={{ display: "flex", gap: 4, marginBottom: 14, background: T.card, border: `1px solid ${T.borderSoft}`, borderRadius: 18, padding: 4 }}>
                {Object.entries(exercises).map(([key, d]) => (
                  <button
                    key={key}
                    onClick={() => setSelectedDay(key)}
                    style={{
                      flex: 1,
                      background: selectedDay === key ? T.accent : "transparent",
                      color: selectedDay === key ? "#000" : T.sub,
                      border: "none",
                      borderRadius: 14,
                      padding: "9px 6px",
                      cursor: "pointer",
                      fontFamily: "inherit",
                      transition: "all 0.2s",
                    }}
                  >
                    <div style={{ fontFamily: "'Urbanist',sans-serif", fontWeight: 700, fontSize: "1.15rem", lineHeight: 1 }}>{key}</div>
                    <div style={{ fontSize: 9.5, marginTop: 3, fontWeight: 600, opacity: selectedDay === key ? 0.65 : 0.9 }}>{d.day}</div>
                  </button>
                ))}
              </div>

              <div style={{ position: "relative", borderRadius: 22, overflow: "hidden", marginBottom: 14, border: `1px solid ${T.border}`, height: 110 }}>
                <img src={PHOTOS[selectedDay]} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, rgba(6,9,16,0.92) 30%, rgba(6,9,16,0.45) 100%)" }} />
                <div style={{ position: "absolute", inset: 0, padding: "14px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontFamily: "'Urbanist',sans-serif", fontWeight: 700, fontSize: "1.2rem", color: "#fff" }}>{day.label}</div>
                    <div style={{ fontSize: 11.5, color: "rgba(255,255,255,0.7)", marginTop: 2, maxWidth: 210 }}>{day.desc}</div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div style={{ color: T.accent, fontWeight: 800, fontSize: 13 }}>{day.exercises.length} ćwiczeń</div>
                    <div style={{ fontSize: 11.5, color: "rgba(255,255,255,0.6)" }}>~60 min</div>
                  </div>
                </div>
              </div>

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
