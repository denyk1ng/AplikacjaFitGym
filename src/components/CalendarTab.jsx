import { useEffect, useMemo, useState } from "react";
import { Check, Info, RotateCcw, Dumbbell, Footprints, BicepsFlexed, HeartPulse, Moon, ChevronDown, History } from "lucide-react";
import { T, FONT_NUM, stagger } from "../theme.js";
import { EXERCISES_DATA } from "../data/plan.js";
import { isoWeekStart } from "../lib/utils.js";
import { loadWorkoutLog, saveWorkoutLog, weekStatus, weekEntries, weekHistory, PLAN_DOW, DOW_NAMES, dayIndex } from "../lib/workoutLog.js";
import { loadSettings } from "../lib/settings.js";

const H = "'Urbanist',sans-serif";
const TYPE_ICON = { A: Dumbbell, B: Footprints, C: BicepsFlexed };

const fmtSesTime = (s) => (s >= 60 ? `${Math.floor(s / 60)} min` : `${s} s`);
const fmtSesVol = (v) => (v >= 1000 ? `${(Math.round(v / 100) / 10).toString().replace(".", ",")}k` : String(Math.round(v)));

export function CalendarTab({ goTraining, onLogChanged }) {
  const [log, setLog] = useState([]);
  const [ready, setReady] = useState(false);
  const [expandedTs, setExpandedTs] = useState(null); // rozwinięty wpis historii sesji

  // meta ćwiczeń po id — do rozbicia sesji na ćwiczenia w historii
  const exMeta = useMemo(() => {
    const m = {};
    Object.values(EXERCISES_DATA).forEach((d) => d.exercises.forEach((e) => (m[e.id] = e)));
    return m;
  }, []);

  useEffect(() => {
    loadWorkoutLog().then((l) => {
      setLog(l);
      setReady(true);
    });
  }, []);

  const persist = (updated) => {
    setLog(updated);
    saveWorkoutLog(updated);
    onLogChanged && onLogChanged(); // m.in. odświeżenie badge'a na ikonie appki
  };

  const mark = (type) => {
    // jeden wpis danego typu na tydzień
    const start = isoWeekStart(Date.now());
    const cleaned = log.filter((e) => !(e.type === type && e.ts >= start));
    const now = new Date();
    persist([...cleaned, { ts: now.getTime(), date: now.toLocaleDateString("sv-SE"), type }]);
  };

  const unmark = (type) => {
    const start = isoWeekStart(Date.now());
    persist(log.filter((e) => !(e.type === type && e.ts >= start)));
  };

  if (!ready) return null;

  const st = weekStatus(log);
  const doneCount = ["A", "B", "C"].filter((k) => st[k].done).length;
  const overdueList = loadSettings().overdueAlert ? ["A", "B", "C"].filter((k) => st[k].overdue) : [];
  const entries = weekEntries(log);
  const history = weekHistory(log, 4);

  const todayDow = new Date().getDay();
  const monday = new Date(isoWeekStart(Date.now()));

  // dane paska tygodnia
  const days = ["PN", "WT", "ŚR", "CZ", "PT", "SB", "ND"].map((label, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const jsDow = (i + 1) % 7;
    const planType = Object.keys(PLAN_DOW).find((k) => PLAN_DOW[k] === jsDow) || null;
    const isCardio = jsDow === 2 || jsDow === 4;
    const dateKey = d.toLocaleDateString("sv-SE");
    const doneHere = entries.filter((e) => e.date === dateKey).map((e) => e.type);
    const missed = planType && !st[planType].done && dayIndex(todayDow) > i;
    return { label, num: d.getDate(), today: jsDow === todayDow, planType, isCardio, doneHere, missed };
  });

  const monthName = new Date().toLocaleDateString("pl-PL", { month: "long", year: "numeric" });

  return (
    <div>
      {/* PASEK TYGODNIA */}
      <div className="fu" style={{ fontSize: 12, color: T.sub, marginBottom: 12 }}>
        Bieżący tydzień · {monthName.charAt(0).toUpperCase() + monthName.slice(1)}
      </div>
      <div className="fu" style={{ animationDelay: ".04s", display: "flex", gap: 6, marginBottom: 16 }}>
        {days.map((d) => (
          <div
            key={d.label}
            style={{
              flex: 1,
              background: d.today ? T.accent : T.inset,
              borderRadius: 16,
              padding: "10px 2px 9px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 4,
            }}
          >
            <span style={{ fontSize: 8.5, fontWeight: 800, letterSpacing: ".04em", color: d.today ? "rgba(0,0,0,0.6)" : T.sub }}>{d.label}</span>
            <span style={{ fontFamily: "'Doto',sans-serif", fontWeight: 800, fontSize: 14.5, color: d.today ? "#000" : "#fff" }}>{d.num}</span>
            {/* status dnia */}
            {d.doneHere.length > 0 ? (
              <span style={{ width: 15, height: 15, borderRadius: "50%", background: d.today ? "#000" : T.ok, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Check size={10} color={d.today ? T.accent : "#000"} strokeWidth={3.4} />
              </span>
            ) : d.missed ? (
              <span style={{ width: 15, height: 15, borderRadius: "50%", background: "rgba(251,191,36,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 800, color: T.yellow }}>
                !
              </span>
            ) : d.planType ? (
              <span style={{ fontSize: 9, fontWeight: 800, fontFamily: H, color: d.today ? "rgba(0,0,0,0.65)" : T.soft }}>{d.planType}</span>
            ) : d.isCardio ? (
              <HeartPulse size={11} color={d.today ? "rgba(0,0,0,0.65)" : T.faint} strokeWidth={2.4} />
            ) : (
              <Moon size={11} color={d.today ? "rgba(0,0,0,0.65)" : T.faint} strokeWidth={2.4} />
            )}
          </div>
        ))}
      </div>

      {/* ALERT O ZALEGŁOŚCIACH / KOMPLET */}
      {overdueList.length > 0 ? (
        <div className="fu" style={{ animationDelay: ".08s", display: "flex", gap: 10, alignItems: "flex-start", background: "rgba(251,191,36,0.09)", border: "1px solid rgba(251,191,36,0.3)", borderRadius: 18, padding: "12px 14px", marginBottom: 16 }}>
          <Info size={17} color={T.yellow} strokeWidth={2.3} style={{ flexShrink: 0, marginTop: 1 }} />
          <div style={{ fontSize: 12.5, color: "#fde68a", lineHeight: 1.55 }}>
            <strong style={{ color: T.yellow }}>
              Nie {overdueList.length > 1 ? "zrobiłeś treningów" : "zrobiłeś treningu"} {overdueList.join(" i ")}
            </strong>{" "}
            w {overdueList.length > 1 ? "planowane dni" : "planowany dzień"}. Tydzień kończy się w niedzielę — wskocz na siłownię w wolny dzień, żeby nadrobić.
          </div>
        </div>
      ) : doneCount === 3 ? (
        <div className="fu" style={{ animationDelay: ".08s", display: "flex", gap: 10, alignItems: "center", background: "rgba(52,211,153,0.09)", border: "1px solid rgba(52,211,153,0.3)", borderRadius: 18, padding: "12px 14px", marginBottom: 16 }}>
          <span style={{ width: 26, height: 26, borderRadius: "50%", background: T.ok, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Check size={15} color="#000" strokeWidth={3} />
          </span>
          <div style={{ fontSize: 12.5, color: "#8fe5c2", lineHeight: 1.5 }}>
            <strong style={{ color: T.ok }}>Komplet!</strong> Wszystkie trzy treningi w tym tygodniu zrobione. Reszta tygodnia to cardio i regeneracja.
          </div>
        </div>
      ) : null}

      {/* CHECKLISTA TRENINGÓW TYGODNIA */}
      <div className="fu" style={{ animationDelay: ".12s", fontFamily: H, fontWeight: 700, fontSize: "1.02rem", color: "#fff", marginBottom: 12 }}>
        Treningi tego tygodnia
        <span style={{ fontFamily: H, color: doneCount === 3 ? T.ok : T.accent, marginLeft: 8, fontSize: "0.95rem" }}>{doneCount}/3</span>
      </div>

      {["A", "B", "C"].map((k, i) => {
        const s = st[k];
        const Icon = TYPE_ICON[k];
        const doneDay = s.ts ? DOW_NAMES[new Date(s.ts).getDay()] : null;
        const statusTxt = s.done
          ? `Zrobiony — ${doneDay}`
          : s.overdue
            ? `Zaległy — planowo ${DOW_NAMES[s.plannedDow]}`
            : PLAN_DOW[k] === todayDow
              ? "Zaplanowany na dziś"
              : `Zaplanowany — ${DOW_NAMES[s.plannedDow]}`;
        return (
          <div
            key={k}
            className="fu"
            style={{
              animationDelay: stagger(i, 0.14),
              background: s.done ? "rgba(52,211,153,0.06)" : T.card,
              border: `1px solid ${s.done ? "rgba(52,211,153,0.25)" : s.overdue ? "rgba(251,191,36,0.35)" : T.borderSoft}`,
              borderRadius: 20,
              padding: "13px 14px",
              marginBottom: 10,
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <span
              style={{
                width: 42,
                height: 42,
                borderRadius: 14,
                background: s.done ? T.ok : T.inset,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              {s.done ? <Check size={19} color="#000" strokeWidth={2.8} /> : <Icon size={18} color={s.overdue ? T.yellow : T.light} strokeWidth={2} />}
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: "#fff" }}>{EXERCISES_DATA[k].label}</div>
              <div style={{ fontSize: 11, color: s.overdue ? T.yellow : T.sub, marginTop: 2, fontWeight: s.overdue ? 700 : 500 }}>{statusTxt}</div>
            </div>
            {s.done ? (
              <button
                onClick={() => unmark(k)}
                title="Cofnij oznaczenie"
                style={{ background: T.inset, border: "none", color: T.soft, borderRadius: 99, fontSize: 11.5, fontWeight: 600, padding: "9px 12px", cursor: "pointer", fontFamily: "inherit", display: "inline-flex", alignItems: "center", gap: 5, flexShrink: 0 }}
              >
                <RotateCcw size={13} strokeWidth={2.4} />
                Cofnij
              </button>
            ) : (
              <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                <button
                  onClick={() => goTraining(k)}
                  style={{ background: T.inset, border: "none", color: T.light, borderRadius: 99, fontSize: 11.5, fontWeight: 600, padding: "9px 12px", cursor: "pointer", fontFamily: "inherit" }}
                >
                  Otwórz
                </button>
                <button
                  onClick={() => mark(k)}
                  style={{ background: T.accent, border: "none", color: "#000", borderRadius: 99, fontSize: 11.5, fontWeight: 700, padding: "9px 13px", cursor: "pointer", fontFamily: "inherit", display: "inline-flex", alignItems: "center", gap: 5 }}
                >
                  <Check size={13} strokeWidth={3} />
                  Zrobiony
                </button>
              </div>
            )}
          </div>
        );
      })}

      {/* PLAN POZOSTAŁYCH DNI */}
      <div className="fu" style={{ animationDelay: ".3s", background: T.card, border: `1px solid ${T.borderSoft}`, borderRadius: 20, padding: "12px 14px", margin: "6px 0 18px", display: "flex", gap: 12 }}>
        <span style={{ width: 42, height: 42, borderRadius: 14, background: T.inset, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <HeartPulse size={18} color={T.light} strokeWidth={2} />
        </span>
        <div style={{ fontSize: 12, color: T.sub, lineHeight: 1.6 }}>
          <strong style={{ color: T.light }}>Wtorek i czwartek:</strong> cardio + sauna (bieżnia 12% · 3,5 km/h · 50 min).
          <br />
          <strong style={{ color: T.light }}>Sobota i niedziela:</strong> regeneracja.
        </div>
      </div>

      {/* HISTORIA TYGODNI */}
      <div className="fu" style={{ animationDelay: ".34s", background: T.card, border: `1px solid ${T.borderSoft}`, borderRadius: 22, padding: "14px 16px" }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: T.sub, marginBottom: 14 }}>
          Ostatnie tygodnie
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          {history.map((h, i) => (
            <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
              <div style={{ height: 58, width: "100%", maxWidth: 40, display: "flex", alignItems: "flex-end" }}>
                <div
                  style={{
                    width: "100%",
                    height: `${Math.max((h.done / 3) * 100, 7)}%`,
                    borderRadius: 8,
                    background: h.done === 3 ? T.ok : h.isCurrent ? T.accent : T.track,
                    transition: "height .5s cubic-bezier(.22,1,.36,1)",
                  }}
                />
              </div>
              <span style={{ fontFamily: H, fontWeight: 700, fontSize: 12, color: h.done === 3 ? T.ok : h.isCurrent ? T.accent : T.soft }}>{h.done}/3</span>
              <span style={{ fontSize: 9, color: T.faint, fontWeight: 600 }}>{h.isCurrent ? "TEN TYDZIEŃ" : h.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* HISTORIA SESJI — każdy zapisany trening z rozbiciem na ćwiczenia */}
      {log.length > 0 && (
        <div className="fu" style={{ animationDelay: ".38s", background: T.card, border: `1px solid ${T.borderSoft}`, borderRadius: 22, overflow: "hidden", marginTop: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "14px 16px 10px", fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: T.sub }}>
            <History size={13} color={T.accent} strokeWidth={2.4} />
            Historia sesji
          </div>
          {[...log]
            .sort((a, b) => b.ts - a.ts)
            .slice(0, 20)
            .map((e, i, arr) => {
              const Icon = TYPE_ICON[e.type] || HeartPulse;
              const label = ["A", "B", "C"].includes(e.type) ? EXERCISES_DATA[e.type].label : "Cardio";
              const d = new Date(e.ts);
              const dateTxt = `${DOW_NAMES[d.getDay()]}, ${d.toLocaleDateString("pl-PL", { day: "numeric", month: "short" })}`;
              const hasDetails = Array.isArray(e.perExercise) && e.perExercise.length > 0;
              const open = expandedTs === e.ts;
              return (
                <div key={e.ts} style={{ borderTop: `1px solid ${T.borderSoft}` }}>
                  <button
                    onClick={() => hasDetails && setExpandedTs(open ? null : e.ts)}
                    style={{ width: "100%", display: "flex", alignItems: "center", gap: 11, padding: "11px 16px", background: "transparent", border: "none", cursor: hasDetails ? "pointer" : "default", textAlign: "left", fontFamily: "inherit" }}
                  >
                    <span style={{ width: 36, height: 36, borderRadius: 12, background: T.inset, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Icon size={16} color={T.accent} strokeWidth={2.1} />
                    </span>
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#fff", fontFamily: H }}>{label}</span>
                      <span style={{ display: "block", fontSize: 10.5, color: T.sub, marginTop: 2 }}>
                        {dateTxt.charAt(0).toUpperCase() + dateTxt.slice(1)}
                        {typeof e.time === "number" ? ` · ${fmtSesTime(e.time)}` : ""}
                      </span>
                    </span>
                    {typeof e.volume === "number" && e.volume > 0 ? (
                      <span style={{ fontFamily: FONT_NUM, fontWeight: 800, fontSize: 13, color: T.accent, flexShrink: 0 }}>
                        {fmtSesVol(e.volume)} <span style={{ fontSize: 9.5, color: T.sub }}>kg</span>
                      </span>
                    ) : (
                      <span style={{ fontSize: 9.5, color: T.faint, flexShrink: 0 }}>odhaczony ręcznie</span>
                    )}
                    {hasDetails && (
                      <ChevronDown size={14} color={T.faint} strokeWidth={2.2} style={{ flexShrink: 0, transform: open ? "rotate(180deg)" : "none", transition: "transform .2s" }} />
                    )}
                  </button>
                  {open && hasDetails && (
                    <div style={{ padding: "0 16px 12px 63px" }}>
                      {e.perExercise.map((pe) => {
                        const meta = exMeta[pe.id];
                        return (
                          <div key={pe.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 0", fontSize: 11.5 }}>
                            <span style={{ flex: 1, color: T.light, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {meta ? meta.name.split("—")[0].trim() : pe.id}
                            </span>
                            <span style={{ color: T.sub, flexShrink: 0 }}>
                              {pe.weight > 0 ? `${String(pe.weight).replace(".", ",")} ${pe.unit || "kg"} · ` : ""}
                              {pe.setsDone}/{pe.sets} serii
                              {pe.avgRpe != null ? ` · RPE ${String(pe.avgRpe).replace(".", ",")}` : ""}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          {log.length > 20 && (
            <div style={{ padding: "9px 16px", fontSize: 10, color: T.faint, textAlign: "center", borderTop: `1px solid ${T.borderSoft}` }}>
              pokazuję 20 ostatnich z {log.length} sesji
            </div>
          )}
        </div>
      )}
    </div>
  );
}
