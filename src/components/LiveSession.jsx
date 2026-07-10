import { useEffect, useMemo, useRef, useState } from "react";
import { X, Check, ChevronRight, Trophy, Medal, LogOut, Plus, Repeat, Gauge, Share2 } from "lucide-react";
import { T, FONT_NUM } from "../theme.js";
import { EX_THUMB } from "../data/exerciseThumbs.js";
import { EXERCISES_DATA } from "../data/plan.js";
import { playBeep, unlockAudio } from "../lib/sound.js";
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

function avg(arr) {
  const nums = arr.filter((v) => v !== null && v !== undefined);
  if (!nums.length) return null;
  return Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 10) / 10;
}

// półkolisty zegar z kresek (wg wzorca rest-timera)
function TickGauge({ pct, color }) {
  const N = 26;
  const R1 = 52;
  const R2 = 66;
  const cx = 75;
  const cy = 72;
  const filled = Math.round(Math.min(Math.max(pct, 0), 1) * N);
  return (
    <svg width="150" height="80" viewBox="0 0 150 80">
      {Array.from({ length: N }, (_, i) => {
        const a = Math.PI + (i / (N - 1)) * Math.PI;
        return (
          <line
            key={i}
            x1={cx + R1 * Math.cos(a)}
            y1={cy + R1 * Math.sin(a)}
            x2={cx + R2 * Math.cos(a)}
            y2={cy + R2 * Math.sin(a)}
            stroke={i < filled ? color : T.track}
            strokeWidth="4.5"
            strokeLinecap="round"
          />
        );
      })}
    </svg>
  );
}

export function LiveSession({ dayKey, data, onExit, onSaveAll, updateWeight, updateReps, snapshots }) {
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
  const [showSwap, setShowSwap] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [rest, setRest] = useState(0);
  const [stage, setStage] = useState(restored && restored.stage === "summary" ? "summary" : "live"); // live | summary
  const [confirmExit, setConfirmExit] = useState(false);
  const restEnd = useRef(null);
  const startTs = useRef(restored && restored.startTs ? restored.startTs : Date.now());
  const pendingRestRef = useRef(true);

  const ex = exs[idx];

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

  // odliczanie przerwy
  useEffect(() => {
    if (rest <= 0) return;
    const t = setInterval(() => {
      const rem = Math.max(0, Math.ceil((restEnd.current - Date.now()) / 1000));
      setRest(rem);
      if (rem === 0) playBeep();
    }, 250);
    return () => clearInterval(t);
  }, [rest > 0]);

  const totalSetsDone = setsDone.reduce((a, b) => a + b, 0);
  const volume = exs.reduce((sum, e, i) => sum + setsDone[i] * repsInt(e.reps) * (e.weight || 0), 0);

  // zaliczenie serii nie startuje od razu przerwy — najpierw krótkie,
  // opcjonalne pytanie o RPE (jak ciężko było), potem leci timer
  const doneSet = () => {
    if (setsDone[idx] >= ex.sets) return;
    unlockAudio(); // gest użytkownika — odblokuj Web Audio dla beeta końca przerwy (iOS)
    const next = [...setsDone];
    next[idx] += 1;
    setSetsDone(next);
    pendingRestRef.current = !(next[idx] >= ex.sets && idx === exs.length - 1);
    setPendingRpe(true);
  };

  // edycja ciężaru/powtórzeń w trakcie sesji: aktualizuje lokalny stan sesji
  // (UI + objętość od razu) ORAZ plan/progres przez rodzica — wcześniej szła
  // tylko do planu, więc na ekranie sesji nic się nie zmieniało
  const editWeight = (v) => {
    setExsState((s) => s.map((e, i) => (i === idx ? { ...e, weight: v } : e)));
    updateWeight && updateWeight(ex.id, v);
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
    setRest(0);
    for (let step = 1; step <= exs.length; step++) {
      const j = (idx + step) % exs.length;
      if (setsDone[j] < exs[j].sets) {
        setIdx(j);
        return;
      }
    }
    setStage("summary");
  };

  const jumpTo = (i) => {
    if (pendingRpe) return;
    setRest(0);
    setIdx(i);
  };

  // alternatywy dla bieżącego ćwiczenia: ta sama partia (cat), z całego
  // planu, bez powtórzeń nazw i bez ćwiczeń już będących w dzisiejszej sesji
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
    return out;
  }, [ex.id, ex.cat]);

  const swapExercise = (alt) => {
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

  // rekordy: aktualny ciężar > poprzednie maksimum z zapisów
  const records = useMemo(() => {
    if (stage !== "summary") return [];
    return exs
      .filter((e, i) => setsDone[i] > 0 && e.weight > 0)
      .filter((e) => {
        const hist = snapshots.map((s) => (s.weights || {})[e.id]).filter((w) => w !== undefined);
        return hist.length > 0 && e.weight > Math.max(...hist);
      });
  }, [stage]);

  // ── PODSUMOWANIE ──────────────────────────────────────────────────────────
  if (stage === "summary") {
    const doneExs = exs.filter((_, i) => setsDone[i] > 0);
    return (
      <div style={{ margin: "-20px -18px -140px", minHeight: "100vh", padding: "22px 18px 40px", display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
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
            <span style={{ fontFamily: FONT_NUM, fontWeight: 800, fontSize: 15, color: T.accent }}>{String(r.weight).replace(".", ",")} {r.unit}</span>
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
                  {setsDone[i]} serie{e.weight > 0 ? ` · ${String(e.weight).replace(".", ",")} ${e.unit}` : ""}
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
              .map((e, i) => ({ id: e.id, weight: e.weight || 0, unit: e.unit, setsDone: setsDone[i], sets: e.sets, avgRpe: avg(rpeData[i] || []) }))
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
  const restPct = ex.rest > 0 ? 1 - rest / ex.rest : 1;

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
        <button onClick={() => setStage("summary")} style={{ background: "transparent", border: "none", color: T.accent, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: U, flexShrink: 0 }}>
          Zakończ
        </button>
      </div>

      {/* karta rest timera */}
      <div className="fu" style={{ background: T.card, border: `1px solid ${T.borderSoft}`, borderRadius: 22, padding: "14px 16px 10px", marginTop: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#fff", fontFamily: U }}>Przerwa</span>
          {rest > 0 && (
            <button onClick={() => setRest(0)} style={{ background: "transparent", border: "none", color: T.sub, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: U }}>
              Pomiń
            </button>
          )}
        </div>
        <div style={{ position: "relative", display: "flex", justifyContent: "center", marginTop: 2 }}>
          <TickGauge pct={rest > 0 ? restPct : 1} color={rest > 0 ? T.accent : T.ok} />
          <div style={{ position: "absolute", bottom: 4, left: 0, right: 0, textAlign: "center" }}>
            <span style={{ fontFamily: FONT_NUM, fontWeight: 800, fontSize: "1.9rem", color: rest > 0 ? "#fff" : T.ok, lineHeight: 1 }}>
              {rest > 0 ? rest : <Check size={26} strokeWidth={3} style={{ verticalAlign: "-4px" }} />}
            </span>
          </div>
        </div>
        <div style={{ textAlign: "center", fontSize: 10, color: T.sub, marginTop: 4 }}>{rest > 0 ? "auto między seriami" : "gotowy na serię"}</div>
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
                transition: "all .2s",
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

      {/* bieżące ćwiczenie: duża karta ze zdjęciem, serią i ciężarem */}
      <div key={ex.id} className="fu" style={{ position: "relative", flex: 1, minHeight: 210, borderRadius: 24, overflow: "hidden", marginTop: 14, border: `1px solid ${T.borderSoft}` }}>
        <img src={EX_THUMB[ex.id]} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(23,23,23,0.12) 0%, rgba(23,23,23,0.35) 52%, rgba(23,23,23,0.94) 100%)" }} />
        {setsDone[idx] === 0 && (
          <button
            onClick={() => setShowSwap(true)}
            title="Zamień ćwiczenie"
            style={{ position: "absolute", top: 12, right: 12, width: 36, height: 36, borderRadius: "50%", background: "rgba(23,23,23,0.6)", backdropFilter: "blur(6px)", border: `1px solid ${T.borderSoft}`, color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            <Repeat size={15} strokeWidth={2.2} />
          </button>
        )}
        <div style={{ position: "absolute", left: 16, right: 16, bottom: 14, display: "flex", alignItems: "flex-end", gap: 10 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#fff", fontFamily: U, display: "flex", alignItems: "center", gap: 5, flexWrap: "wrap" }}>
              Seria {Math.min(setsDone[idx] + 1, ex.sets)} / {ex.sets} · <EditStr value={String(ex.reps)} onChange={editReps} /> powt.
            </div>
            <div style={{ fontSize: 12, color: T.light, marginTop: 4, display: "flex", alignItems: "center", gap: 5 }}>
              {ex.weight > 0 ? (
                <>
                  ciężar: <EditNum value={ex.weight} unit={ex.unit} min={0.5} max={500} onChange={editWeight} />
                </>
              ) : (
                "ciężar własny"
              )}
            </div>
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
          <button
            onClick={doneSet}
            disabled={allSetsDone}
            style={{ width: "100%", background: allSetsDone ? T.inset : T.card, color: allSetsDone ? T.faint : "#fff", border: `1px solid ${T.border}`, borderRadius: 99, fontFamily: U, fontWeight: 700, fontSize: 14, padding: "15px 20px", cursor: allSetsDone ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 18 }}
          >
            {allSetsDone ? (
              <>
                <Check size={16} color={T.ok} strokeWidth={2.8} /> Serie komplet
              </>
            ) : (
              <>
                <Plus size={16} strokeWidth={2.6} /> Zalicz serię ({setsDone[idx] + 1}/{ex.sets})
              </>
            )}
          </button>
          <button
            onClick={nextExercise}
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
                  <img src={EX_THUMB[alt.id]} alt="" style={{ width: 46, height: 46, borderRadius: 12, objectFit: "cover", flexShrink: 0 }} />
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#fff", fontFamily: U }}>{alt.name}</span>
                    <span style={{ display: "block", fontSize: 11, color: T.sub, marginTop: 2 }}>
                      {ex.sets} serie · {alt.reps} powt.{alt.weight > 0 ? ` · ${String(alt.weight).replace(".", ",")} ${alt.unit}` : ""}
                    </span>
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
