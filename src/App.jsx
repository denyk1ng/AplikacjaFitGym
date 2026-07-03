import { useEffect, useState } from "react";
import { Flame, User } from "lucide-react";
import { T } from "./theme.js";
import { EXERCISES_DATA } from "./data/plan.js";
import { storage } from "./lib/storage.js";
import { DashboardTab } from "./components/DashboardTab.jsx";
import { StatsTab } from "./components/StatsTab.jsx";
import { WarmupTab } from "./components/WarmupTab.jsx";
import { DayExCard } from "./components/DayExCard.jsx";
import { BottomNav } from "./components/BottomNav.jsx";
import { Onboarding } from "./components/Onboarding.jsx";
import { ProfileTab } from "./components/ProfileTab.jsx";

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

  const titles = { dom: "Dom", trening: "Trening", stats: "Statystyki", rozgrzewka: "Rozgrzewka", profil: "Profil" };

  return (
    <div style={{ color: T.text, minHeight: "100vh", padding: "20px 16px 140px", maxWidth: 680, margin: "0 auto" }}>
      {showOnboard && <Onboarding onDone={dismissOnboard} />}

      <div style={{ marginBottom: 18, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontFamily: "'Syne',sans-serif", fontSize: "1.65rem", fontWeight: 800, letterSpacing: "-0.03em", marginBottom: 2 }}>
            FOR<span style={{ color: T.accent }}>MA</span>
          </h1>
          <p style={{ color: T.sub, fontSize: 12.5 }}>{titles[tab]}</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          <span style={{ background: T.accentSoftBg, border: `1px solid ${T.accentSoftBorder}`, color: T.accent, fontSize: 11, fontWeight: 800, padding: "6px 12px", borderRadius: 99, display: "inline-flex", alignItems: "center", gap: 5 }}>
            <Flame size={13} strokeWidth={2.5} />
            REKOMP
          </span>
          <button
            onClick={() => setTab("profil")}
            title="Profil"
            style={{
              width: 38,
              height: 38,
              borderRadius: "50%",
              background: tab === "profil" ? T.accent : T.accentSoftBg,
              border: `1px solid ${T.accentSoftBorder}`,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <User size={18} color={tab === "profil" ? "#000" : T.accent} strokeWidth={2.4} />
          </button>
        </div>
      </div>

      {!storageReady && <div style={{ textAlign: "center", padding: "48px", color: T.faint, fontSize: 13 }}>Ładowanie...</div>}

      {storageReady && (
        <div key={tab} className="fu">
          {tab === "dom" && <DashboardTab snapshots={snapshots} exercises={exercises} goTraining={goTraining} />}

          {tab === "trening" && (
            <>
              <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                {Object.entries(exercises).map(([key, d]) => (
                  <button
                    key={key}
                    onClick={() => setSelectedDay(key)}
                    style={{
                      flex: 1,
                      background: selectedDay === key ? d.color : T.card,
                      color: selectedDay === key ? "#000" : T.sub,
                      border: `1px solid ${selectedDay === key ? d.color : T.border}`,
                      borderRadius: 16,
                      padding: "10px 6px",
                      cursor: "pointer",
                      fontFamily: "inherit",
                      transition: "all 0.25s",
                    }}
                  >
                    <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: "1.4rem" }}>{key}</div>
                    <div style={{ fontSize: 10, marginTop: 2, opacity: 0.8 }}>{d.day}</div>
                  </button>
                ))}
              </div>

              <div style={{ background: `${day.color}12`, border: `1px solid ${day.color}30`, borderRadius: 18, padding: "12px 16px", marginBottom: 14, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: "1rem", color: day.color }}>{day.label}</div>
                  <div style={{ fontSize: 12, color: T.sub, marginTop: 1 }}>{day.desc}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ color: T.accent, fontWeight: 700, fontSize: 13 }}>{day.exercises.length} ćwiczeń</div>
                  <div style={{ fontSize: 12, color: T.sub }}>~60 min</div>
                </div>
              </div>

              <div style={{ background: T.card, border: `1px solid ${T.borderSoft}`, borderRadius: 14, padding: "8px 14px", marginBottom: 12, fontSize: 12, color: T.sub, lineHeight: 1.6 }}>
                <span style={{ color: T.accent }}>limonkowa liczba</span> = edytuj · nazwa = szczegóły i technika · 💾 na dole = zapis + punkt progresu
              </div>

              {day.exercises.map((ex, idx) => (
                <DayExCard key={ex.id} ex={ex} idx={idx} onUpdate={(updated) => updateEx(selectedDay, idx, updated)} />
              ))}
            </>
          )}

          {tab === "stats" && <StatsTab snapshots={snapshots} />}
          {tab === "rozgrzewka" && <WarmupTab />}
          {tab === "profil" && <ProfileTab />}
        </div>
      )}

      {storageReady && !showOnboard && <BottomNav tab={tab} setTab={setTab} onSave={handleSave} saveAnim={saveAnim} />}
    </div>
  );
}
