import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, Play, TrendingUp, Scale, HeartPulse, Check, ChevronRight, ClipboardList, Moon } from "lucide-react";
import { T } from "../theme.js";
import { EXERCISES_DATA } from "../data/plan.js";
import { loadWorkoutLog, saveWorkoutLog, suggestToday } from "../lib/workoutLog.js";
import { storage } from "../lib/storage.js";

const U = "'Urbanist',sans-serif";

// Menu szybkich akcji pod centralnym plusem w navbarze.
export function QuickAddSheet({ open, onClose, onStartWorkout, onOpenPlan, onSaveWeights, onLogChanged }) {
  const [log, setLog] = useState([]);
  const [showWeight, setShowWeight] = useState(false);
  const [weightInput, setWeightInput] = useState("");
  const [weightSaved, setWeightSaved] = useState(false);
  const [weightsLogged, setWeightsLogged] = useState(false);

  useEffect(() => {
    if (!open) return;
    setShowWeight(false);
    setWeightInput("");
    setWeightSaved(false);
    setWeightsLogged(false);
    loadWorkoutLog().then(setLog);
  }, [open]);

  const logWeights = () => {
    onSaveWeights();
    setWeightsLogged(true);
  };

  if (!open) return null;

  const suggestion = suggestToday(log);
  const todayKey = new Date().toLocaleDateString("sv-SE");
  const cardioDone = log.some((e) => e.type === "cardio" && e.date === todayKey);
  const restDone = log.some((e) => e.type === "rest" && e.date === todayKey);

  const toggleCardio = () => {
    const updated = cardioDone
      ? log.filter((e) => !(e.type === "cardio" && e.date === todayKey))
      : [...log, { ts: Date.now(), date: todayKey, type: "cardio" }];
    setLog(updated);
    saveWorkoutLog(updated);
    onLogChanged && onLogChanged();
  };

  const toggleRest = () => {
    const updated = restDone
      ? log.filter((e) => !(e.type === "rest" && e.date === todayKey))
      : [...log, { ts: Date.now(), date: todayKey, type: "rest" }];
    setLog(updated);
    saveWorkoutLog(updated);
    onLogChanged && onLogChanged();
  };

  const addWeight = async () => {
    const kg = parseFloat(String(weightInput).replace(",", "."));
    if (isNaN(kg) || kg <= 0) return;
    let list = [];
    try {
      const r = await storage.get("body_weight_log");
      if (r && r.value) list = JSON.parse(r.value);
    } catch (e) {}
    const now = new Date();
    list = [...list, { ts: now.getTime(), dateShort: now.toLocaleDateString("pl-PL", { day: "numeric", month: "short" }), kg: Math.round(kg * 10) / 10 }].sort((a, b) => a.ts - b.ts);
    storage.set("body_weight_log", JSON.stringify(list));
    setWeightInput("");
    setShowWeight(false);
    setWeightSaved(true);
  };

  const rowStyle = (last) => ({
    width: "100%",
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "13px 4px",
    background: "transparent",
    border: "none",
    borderBottom: last ? "none" : `1px solid ${T.borderSoft}`,
    cursor: "pointer",
    textAlign: "left",
    fontFamily: "inherit",
  });

  const Bubble = ({ Icon, accent, ok }) => (
    <span style={{ width: 42, height: 42, borderRadius: 14, background: ok ? "rgba(52,211,153,0.12)" : accent ? T.accent : T.inset, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      <Icon size={18} color={ok ? T.ok : accent ? "#000" : T.accent} strokeWidth={2.2} />
    </span>
  );

  const Title = ({ children }) => <span style={{ display: "block", fontSize: 13.5, fontWeight: 700, color: "#fff", fontFamily: U }}>{children}</span>;
  const Desc = ({ children }) => <span style={{ display: "block", fontSize: 11, color: T.sub, marginTop: 2 }}>{children}</span>;

  return createPortal(
    <div style={{ position: "fixed", inset: 0, zIndex: 1600 }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(23,23,23,0.7)", backdropFilter: "blur(3px)" }} />
      <div className="slideup" style={{ position: "absolute", left: 0, right: 0, bottom: 0, maxWidth: 430, margin: "0 auto", background: T.card2, borderRadius: "26px 26px 0 0", padding: "20px 20px calc(30px + env(safe-area-inset-bottom))" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <span style={{ fontFamily: U, fontWeight: 700, fontSize: "1.15rem", color: "#fff" }}>Szybkie akcje</span>
          <button onClick={onClose} aria-label="Zamknij" style={{ width: 34, height: 34, borderRadius: 11, background: T.inset, border: "none", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <X size={16} strokeWidth={2.4} />
          </button>
        </div>

        {/* 1. start treningu / otwórz plan */}
        {suggestion ? (
          <button onClick={() => onStartWorkout(suggestion.type)} style={rowStyle(false)}>
            <Bubble Icon={Play} accent />
            <span style={{ flex: 1, minWidth: 0 }}>
              <Title>Zacznij {EXERCISES_DATA[suggestion.type].label}</Title>
              <Desc>{suggestion.overdue ? "zaległy — nadrób do niedzieli" : "dziś na planie"} · sesja na żywo</Desc>
            </span>
            <ChevronRight size={15} color={T.faint} strokeWidth={2.2} />
          </button>
        ) : (
          <button onClick={onOpenPlan} style={rowStyle(false)}>
            <Bubble Icon={ClipboardList} />
            <span style={{ flex: 1, minWidth: 0 }}>
              <Title>Otwórz plan treningów</Title>
              <Desc>komplet A·B·C w tym tygodniu zaliczony</Desc>
            </span>
            <ChevronRight size={15} color={T.faint} strokeWidth={2.2} />
          </button>
        )}

        {/* 2. zapisz ciężary */}
        <button onClick={weightsLogged ? undefined : logWeights} style={{ ...rowStyle(false), cursor: weightsLogged ? "default" : "pointer" }}>
          <Bubble Icon={weightsLogged ? Check : TrendingUp} ok={weightsLogged} />
          <span style={{ flex: 1, minWidth: 0 }}>
            <Title>{weightsLogged ? "Ciężary zapisane" : "Zapisz ciężary"}</Title>
            <Desc>{weightsLogged ? "nowy punkt progresu dodany do statystyk" : "punkt progresu do statystyk i historii ćwiczeń"}</Desc>
          </span>
          {!weightsLogged && <ChevronRight size={15} color={T.faint} strokeWidth={2.2} />}
        </button>

        {/* 3. zapisz wagę */}
        {showWeight ? (
          <div style={{ ...rowStyle(false), cursor: "default" }}>
            <Bubble Icon={Scale} />
            <input
              autoFocus
              value={weightInput}
              onChange={(e) => setWeightInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addWeight()}
              placeholder="np. 76,5"
              inputMode="decimal"
              style={{ flex: 1, background: T.inset, border: `1px solid ${T.border}`, borderRadius: 12, color: T.text, padding: "10px 12px", fontSize: 15, fontWeight: 700, fontFamily: "inherit", outline: "none", minWidth: 0 }}
            />
            <button onClick={addWeight} style={{ background: T.accent, color: "#000", border: "none", borderRadius: 12, fontWeight: 800, fontSize: 12.5, padding: "10px 16px", cursor: "pointer", fontFamily: "inherit", flexShrink: 0 }}>
              Dodaj
            </button>
          </div>
        ) : (
          <button onClick={() => setShowWeight(true)} style={rowStyle(false)}>
            <Bubble Icon={weightSaved ? Check : Scale} ok={weightSaved} />
            <span style={{ flex: 1, minWidth: 0 }}>
              <Title>{weightSaved ? "Waga zapisana" : "Zapisz wagę ciała"}</Title>
              <Desc>{weightSaved ? "wpis trafił do historii w Profilu" : "szybki wpis do dziennika wagi"}</Desc>
            </span>
            <ChevronRight size={15} color={T.faint} strokeWidth={2.2} />
          </button>
        )}

        {/* 4. cardio */}
        <button onClick={toggleCardio} style={rowStyle(false)}>
          <Bubble Icon={cardioDone ? Check : HeartPulse} ok={cardioDone} />
          <span style={{ flex: 1, minWidth: 0 }}>
            <Title>{cardioDone ? "Cardio odhaczone" : "Odhacz cardio / saunę"}</Title>
            <Desc>{cardioDone ? "kliknij, aby cofnąć dzisiejszy wpis" : "bieżnia 12% · 3,5 km/h · 50 min — wpis do kalendarza"}</Desc>
          </span>
          {!cardioDone && <ChevronRight size={15} color={T.faint} strokeWidth={2.2} />}
        </button>

        {/* 5. szybki check-in — dziś regeneracja, gdy nie ma czasu na trening */}
        <button onClick={toggleRest} style={rowStyle(true)}>
          <Bubble Icon={restDone ? Check : Moon} ok={restDone} />
          <span style={{ flex: 1, minWidth: 0 }}>
            <Title>{restDone ? "Regeneracja odhaczona" : "Dziś regeneracja"}</Title>
            <Desc>{restDone ? "kliknij, aby cofnąć dzisiejszy wpis" : "brak czasu na trening? odhacz dzień odpoczynku"}</Desc>
          </span>
          {!restDone && <ChevronRight size={15} color={T.faint} strokeWidth={2.2} />}
        </button>
      </div>
    </div>,
    document.body
  );
}
