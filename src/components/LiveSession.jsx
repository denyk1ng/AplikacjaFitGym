import { useEffect, useMemo, useRef, useState } from "react";
import { X, Check, ChevronRight, Trophy, Medal, LogOut, Plus } from "lucide-react";
import { T, FONT_NUM } from "../theme.js";
import { EX_THUMB } from "../data/exerciseThumbs.js";
import { playBeep } from "../lib/sound.js";
import { EditNum } from "./Editable.jsx";

const U = "'Urbanist',sans-serif";

const fmtTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
const repsInt = (r) => parseInt(r) || 0;
const fmtKg = (v) => (v >= 1000 ? `${(Math.round(v / 100) / 10).toString().replace(".", ",")}k` : String(Math.round(v)));

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

export function LiveSession({ dayKey, data, onExit, onSaveAll, updateWeight, snapshots }) {
  const exs = data.exercises;
  const [idx, setIdx] = useState(0);
  const [setsDone, setSetsDone] = useState(() => exs.map(() => 0));
  const [elapsed, setElapsed] = useState(0);
  const [rest, setRest] = useState(0);
  const [stage, setStage] = useState("live"); // live | summary
  const [confirmExit, setConfirmExit] = useState(false);
  const restEnd = useRef(null);
  const startTs = useRef(Date.now());

  const ex = exs[idx];

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

  const doneSet = () => {
    if (setsDone[idx] >= ex.sets) return;
    const next = [...setsDone];
    next[idx] += 1;
    setSetsDone(next);
    if (!(next[idx] >= ex.sets && idx === exs.length - 1)) {
      restEnd.current = Date.now() + ex.rest * 1000;
      setRest(ex.rest);
    }
  };

  const nextExercise = () => {
    setRest(0);
    if (idx < exs.length - 1) setIdx(idx + 1);
    else setStage("summary");
  };

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
          <button onClick={onExit} style={{ background: "transparent", border: "none", color: T.sub, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: U }}>
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
          {exs.map((e, i) =>
            setsDone[i] > 0 ? (
              <div key={e.id} style={{ display: "flex", alignItems: "center", padding: "10px 2px", borderBottom: `1px solid ${T.borderSoft}` }}>
                <span style={{ flex: 1, fontSize: 13, color: "#fff", fontFamily: U, fontWeight: 600 }}>{e.name.split("—")[0].trim()}</span>
                <span style={{ fontSize: 12, color: T.sub }}>
                  {setsDone[i]} serie{e.weight > 0 ? ` · ${String(e.weight).replace(".", ",")} ${e.unit}` : ""}
                </span>
              </div>
            ) : null
          )}
        </div>

        <button
          onClick={() => onSaveAll({ time: elapsed, sets: totalSetsDone, volume })}
          className="fu"
          style={{ animationDelay: ".45s", marginTop: 22, width: "100%", background: T.accent, color: "#000", border: "none", borderRadius: 99, fontFamily: U, fontWeight: 700, fontSize: 15, padding: "16px 24px", cursor: "pointer", boxShadow: T.accentGlow }}
        >
          Zapisz trening
        </button>
        <p style={{ fontSize: 10.5, color: T.faint, textAlign: "center", marginTop: 10, lineHeight: 1.5 }}>
          Zapis odhaczy {data.label} w kalendarzu tygodnia i doda punkt progresu ciężarów.
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

      {/* bieżące ćwiczenie: duża karta ze zdjęciem, serią i ciężarem */}
      <div key={ex.id} className="fu" style={{ position: "relative", flex: 1, minHeight: 210, borderRadius: 24, overflow: "hidden", marginTop: 14, border: `1px solid ${T.borderSoft}` }}>
        <img src={EX_THUMB[ex.id]} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(6,9,16,0.12) 0%, rgba(6,9,16,0.35) 52%, rgba(6,9,16,0.94) 100%)" }} />
        <div style={{ position: "absolute", left: 16, right: 16, bottom: 14, display: "flex", alignItems: "flex-end", gap: 10 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#fff", fontFamily: U }}>
              Seria {Math.min(setsDone[idx] + 1, ex.sets)} / {ex.sets} · {ex.reps} powt.
            </div>
            <div style={{ fontSize: 12, color: "#c9c9cd", marginTop: 4, display: "flex", alignItems: "center", gap: 5 }}>
              {ex.weight > 0 ? (
                <>
                  ciężar: <EditNum value={ex.weight} unit={ex.unit} onChange={(v) => updateWeight(ex.id, v)} />
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

      {/* akcje */}
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
        {idx < exs.length - 1 ? "Następne ćwiczenie" : "Zakończ trening"}
        <ChevronRight size={17} strokeWidth={2.6} />
      </button>

      {/* arkusz potwierdzenia wyjścia */}
      {confirmExit && (
        <div style={{ position: "fixed", inset: 0, zIndex: 1600 }}>
          <div onClick={() => setConfirmExit(false)} style={{ position: "absolute", inset: 0, background: "rgba(6,9,16,0.7)", backdropFilter: "blur(3px)" }} />
          <div className="slideup" style={{ position: "absolute", left: 0, right: 0, bottom: 0, background: T.card2, borderRadius: "26px 26px 0 0", padding: "26px 22px 34px", textAlign: "center" }}>
            <div style={{ width: 54, height: 54, borderRadius: "50%", background: "rgba(244,63,94,0.15)", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
              <LogOut size={22} color={T.danger} strokeWidth={2.2} />
            </div>
            <div style={{ fontFamily: U, fontWeight: 700, fontSize: "1.2rem", color: "#fff", marginTop: 12 }}>Przerwać sesję?</div>
            <div style={{ fontSize: 12, color: T.sub, marginTop: 5 }}>Postęp tej sesji nie zostanie zapisany.</div>
            <button onClick={onExit} style={{ width: "100%", marginTop: 20, background: T.accent, color: "#000", border: "none", borderRadius: 99, fontFamily: U, fontWeight: 700, fontSize: 14.5, padding: "15px 20px", cursor: "pointer" }}>
              Przerwij
            </button>
            <button onClick={() => setConfirmExit(false)} style={{ width: "100%", marginTop: 10, background: T.inset, color: T.light, border: "none", borderRadius: 99, fontFamily: U, fontWeight: 700, fontSize: 14, padding: "14px 20px", cursor: "pointer" }}>
              Wróć do treningu
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
