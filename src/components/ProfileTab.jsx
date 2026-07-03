import { useEffect, useRef, useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { Plus, Trash2, User } from "lucide-react";
import { T } from "../theme.js";
import { storage } from "../lib/storage.js";
import { EditNum } from "./Editable.jsx";

const DEFAULT_PROFILE = { name: "", height: 180, goalWeight: 0 };

// Półkolisty, segmentowany wskaźnik (jak "Goal Progress" z referencji)
function Gauge({ pct, children }) {
  const N = 30;
  const R1 = 78;
  const R2 = 96;
  const cx = 110;
  const cy = 104;
  const filled = Math.round(Math.min(Math.max(pct, 0), 1) * N);
  const ticks = Array.from({ length: N }, (_, i) => {
    const a = Math.PI + (i / (N - 1)) * Math.PI;
    return {
      x1: cx + R1 * Math.cos(a),
      y1: cy + R1 * Math.sin(a),
      x2: cx + R2 * Math.cos(a),
      y2: cy + R2 * Math.sin(a),
      on: i < filled,
    };
  });
  return (
    <div style={{ position: "relative", width: 220, height: 118, margin: "0 auto" }}>
      <svg width="220" height="118" viewBox="0 0 220 118">
        {ticks.map((t, i) => (
          <line key={i} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2} stroke={t.on ? T.accent : T.track} strokeWidth="6" strokeLinecap="round" />
        ))}
      </svg>
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, textAlign: "center" }}>{children}</div>
    </div>
  );
}

function bmiLabel(bmi) {
  if (bmi < 18.5) return { txt: "niedowaga", c: T.blue };
  if (bmi < 25) return { txt: "w normie", c: T.ok };
  if (bmi < 30) return { txt: "nadwaga", c: T.yellow };
  return { txt: "otyłość", c: T.danger };
}

export function ProfileTab() {
  const [profile, setProfile] = useState(DEFAULT_PROFILE);
  const [log, setLog] = useState([]);
  const [ready, setReady] = useState(false);
  const [input, setInput] = useState("");
  const inputRef = useRef(null);

  useEffect(() => {
    async function load() {
      try {
        const p = await storage.get("profile");
        if (p && p.value) setProfile({ ...DEFAULT_PROFILE, ...JSON.parse(p.value) });
      } catch (e) {}
      try {
        const l = await storage.get("body_weight_log");
        if (l && l.value) setLog(JSON.parse(l.value));
      } catch (e) {}
      setReady(true);
    }
    load();
  }, []);

  useEffect(() => {
    if (ready) storage.set("profile", JSON.stringify(profile));
  }, [profile, ready]);

  const persistLog = (updated) => {
    setLog(updated);
    storage.set("body_weight_log", JSON.stringify(updated));
  };

  const addEntry = () => {
    const kg = parseFloat(String(input).replace(",", "."));
    if (isNaN(kg) || kg <= 0) return;
    const now = new Date();
    const entry = { ts: now.getTime(), dateShort: now.toLocaleDateString("pl-PL", { day: "numeric", month: "short" }), kg: Math.round(kg * 10) / 10 };
    persistLog([...log, entry].sort((a, b) => a.ts - b.ts));
    setInput("");
  };

  const removeEntry = (ts) => {
    persistLog(log.filter((e) => e.ts !== ts));
  };

  const sorted = [...log].sort((a, b) => a.ts - b.ts);
  const last = sorted[sorted.length - 1];
  const first = sorted[0];
  const diff = first && last ? Math.round((last.kg - first.kg) * 10) / 10 : 0;
  const bmi = last && profile.height > 0 ? Math.round((last.kg / Math.pow(profile.height / 100, 2)) * 10) / 10 : null;
  const toGoal = last && profile.goalWeight > 0 ? Math.round((last.kg - profile.goalWeight) * 10) / 10 : null;

  const chartData = sorted.map((e) => ({ date: e.dateShort, kg: e.kg }));

  if (!ready) return null;

  return (
    <div>
      {/* KARTA GŁÓWNA */}
      <div className="fu" style={{ background: `linear-gradient(135deg, ${T.accentSoftBg}, ${T.card} 60%)`, border: `1px solid ${T.border}`, borderRadius: 24, padding: "18px", marginBottom: 14, display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{ width: 62, height: 62, borderRadius: "50%", background: T.accentSoftBg, border: `2px solid ${T.accentSoftBorder}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <User size={30} color={T.accent} strokeWidth={2} />
        </div>
        <div style={{ flex: 1 }}>
          <input
            value={profile.name}
            onChange={(e) => setProfile({ ...profile, name: e.target.value })}
            placeholder="Twoje imię…"
            style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: "1.25rem", background: "transparent", border: "none", borderBottom: `1px dashed ${T.faint}`, color: T.text, outline: "none", width: "100%", padding: "0 0 2px" }}
          />
          <div style={{ fontSize: 12, color: T.sub, marginTop: 4 }}>Cel: rekompozycja — siła w górę, tłuszcz w dół</div>
        </div>
      </div>

      {/* DANE */}
      <div className="fu" style={{ animationDelay: ".05s", display: "flex", gap: 10, marginBottom: 14 }}>
        <div style={{ flex: 1, background: T.card, border: `1px solid ${T.borderSoft}`, borderRadius: 18, padding: "13px", textAlign: "center" }}>
          <div style={{ fontSize: 9.5, color: T.sub, textTransform: "uppercase", letterSpacing: ".06em", fontWeight: 700, marginBottom: 6 }}>Wzrost</div>
          <EditNum value={profile.height} unit="cm" onChange={(v) => setProfile({ ...profile, height: v })} />
        </div>
        <div style={{ flex: 1, background: T.card, border: `1px solid ${T.borderSoft}`, borderRadius: 18, padding: "13px", textAlign: "center" }}>
          <div style={{ fontSize: 9.5, color: T.sub, textTransform: "uppercase", letterSpacing: ".06em", fontWeight: 700, marginBottom: 6 }}>Waga teraz</div>
          <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 800, fontSize: "1.15rem", color: T.accent }}>{last ? `${last.kg} kg` : "—"}</div>
        </div>
        <div style={{ flex: 1, background: T.card, border: `1px solid ${T.borderSoft}`, borderRadius: 18, padding: "13px", textAlign: "center" }}>
          <div style={{ fontSize: 9.5, color: T.sub, textTransform: "uppercase", letterSpacing: ".06em", fontWeight: 700, marginBottom: 6 }}>Cel wagi</div>
          <EditNum value={profile.goalWeight} unit="kg" onChange={(v) => setProfile({ ...profile, goalWeight: v })} />
        </div>
      </div>

      {/* GAUGE — postęp do celu wagi (jak Goal Progress z referencji) */}
      {last && (
        <div className="fu" style={{ animationDelay: ".08s", background: T.card, border: `1px solid ${T.borderSoft}`, borderRadius: 24, padding: "18px 16px 16px", marginBottom: 14 }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: T.sub, marginBottom: 8, textAlign: "center" }}>
            Postęp do celu
          </div>
          <Gauge
            pct={
              profile.goalWeight > 0 && first && first.kg !== profile.goalWeight
                ? (first.kg - last.kg) / (first.kg - profile.goalWeight)
                : 0
            }
          >
            <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: "1.9rem", color: "#fff", lineHeight: 1 }}>
              {last.kg}
              <span style={{ fontSize: 14, color: T.sub }}> kg</span>
            </div>
            <div style={{ fontSize: 10.5, color: T.sub, marginTop: 3, fontWeight: 600 }}>aktualna waga</div>
          </Gauge>
          <div style={{ display: "flex", marginTop: 14, borderTop: `1px solid ${T.borderSoft}`, paddingTop: 12 }}>
            <div style={{ flex: 1, textAlign: "center" }}>
              <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: "1.05rem", color: diff <= 0 ? T.ok : T.orange }}>
                {diff > 0 ? "+" : ""}
                {diff} kg
              </div>
              <div style={{ fontSize: 9.5, color: T.sub, fontWeight: 600, marginTop: 2 }}>zmiana</div>
            </div>
            <div style={{ width: 1, background: T.borderSoft }} />
            <div style={{ flex: 1, textAlign: "center" }}>
              <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: "1.05rem", color: T.accent }}>
                {profile.goalWeight > 0 ? `${profile.goalWeight} kg` : "—"}
              </div>
              <div style={{ fontSize: 9.5, color: T.sub, fontWeight: 600, marginTop: 2 }}>cel</div>
            </div>
            <div style={{ width: 1, background: T.borderSoft }} />
            <div style={{ flex: 1, textAlign: "center" }}>
              <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: "1.05rem", color: "#fff" }}>{sorted.length}</div>
              <div style={{ fontSize: 9.5, color: T.sub, fontWeight: 600, marginTop: 2 }}>pomiary</div>
            </div>
          </div>
        </div>
      )}

      {/* BMI + DO CELU */}
      {(bmi || toGoal !== null) && (
        <div className="fu" style={{ animationDelay: ".1s", display: "flex", gap: 10, marginBottom: 14 }}>
          {bmi && (
            <div style={{ flex: 1, background: T.card, border: `1px solid ${T.borderSoft}`, borderRadius: 18, padding: "13px", textAlign: "center" }}>
              <div style={{ fontSize: 9.5, color: T.sub, textTransform: "uppercase", letterSpacing: ".06em", fontWeight: 700 }}>BMI</div>
              <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 800, fontSize: "1.4rem", color: bmiLabel(bmi).c }}>{bmi}</div>
              <div style={{ fontSize: 10.5, color: bmiLabel(bmi).c, fontWeight: 700 }}>{bmiLabel(bmi).txt}</div>
            </div>
          )}
          {toGoal !== null && (
            <div style={{ flex: 1, background: T.card, border: `1px solid ${T.borderSoft}`, borderRadius: 18, padding: "13px", textAlign: "center" }}>
              <div style={{ fontSize: 9.5, color: T.sub, textTransform: "uppercase", letterSpacing: ".06em", fontWeight: 700 }}>Do celu</div>
              <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 800, fontSize: "1.4rem", color: Math.abs(toGoal) <= 0.5 ? T.ok : T.accent }}>
                {toGoal > 0 ? `−${toGoal}` : toGoal < 0 ? `+${Math.abs(toGoal)}` : "✓"}
              </div>
              <div style={{ fontSize: 10.5, color: T.sub, fontWeight: 700 }}>{Math.abs(toGoal) <= 0.5 ? "cel osiągnięty!" : "kg"}</div>
            </div>
          )}
          {sorted.length >= 2 && (
            <div style={{ flex: 1, background: T.card, border: `1px solid ${T.borderSoft}`, borderRadius: 18, padding: "13px", textAlign: "center" }}>
              <div style={{ fontSize: 9.5, color: T.sub, textTransform: "uppercase", letterSpacing: ".06em", fontWeight: 700 }}>Zmiana</div>
              <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 800, fontSize: "1.4rem", color: diff <= 0 ? T.ok : T.orange }}>
                {diff > 0 ? "+" : ""}
                {diff}
              </div>
              <div style={{ fontSize: 10.5, color: T.sub, fontWeight: 700 }}>kg od startu</div>
            </div>
          )}
        </div>
      )}

      {/* DODAJ WPIS */}
      <div className="fu" style={{ animationDelay: ".15s", background: T.card, border: `1px solid ${T.borderSoft}`, borderRadius: 20, padding: "14px 16px", marginBottom: 14 }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: T.sub, marginBottom: 10 }}>⚖️ Zapisz dzisiejszą wagę</div>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") addEntry();
            }}
            placeholder="np. 76,5"
            inputMode="decimal"
            style={{ flex: 1, background: T.inset, border: `1px solid ${T.border}`, borderRadius: 14, color: T.text, padding: "12px 14px", fontSize: 16, fontWeight: 700, fontFamily: "inherit", outline: "none" }}
          />
          <button
            onClick={addEntry}
            style={{ background: T.accent, color: "#000", border: "none", borderRadius: 14, fontWeight: 800, fontSize: 13, padding: "12px 18px", cursor: "pointer", fontFamily: "inherit", display: "inline-flex", alignItems: "center", gap: 5 }}
          >
            <Plus size={16} strokeWidth={2.8} /> Dodaj
          </button>
        </div>
        <div style={{ fontSize: 10.5, color: T.faint, marginTop: 8 }}>Najlepiej rano, na czczo — zawsze w tych samych warunkach.</div>
      </div>

      {/* WYKRES */}
      {chartData.length >= 2 && (
        <div className="fu" style={{ animationDelay: ".2s", background: T.card, border: `1px solid ${T.borderSoft}`, borderRadius: 20, padding: "14px", marginBottom: 14 }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: T.sub, marginBottom: 12 }}>Waga w czasie</div>
          <ResponsiveContainer width="100%" height={190}>
            <LineChart data={chartData} margin={{ top: 5, right: 10, bottom: 0, left: -8 }}>
              <XAxis dataKey="date" tick={{ fill: T.faint, fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: T.faint, fontSize: 11 }} axisLine={false} tickLine={false} domain={["auto", "auto"]} />
              <Tooltip
                contentStyle={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, fontSize: 12 }}
                labelStyle={{ color: T.sub }}
                formatter={(v) => [`${v} kg`, "Waga"]}
              />
              {profile.goalWeight > 0 && <ReferenceLine y={profile.goalWeight} stroke={T.accent} strokeDasharray="6 4" strokeOpacity={0.6} />}
              <Line type="monotone" dataKey="kg" stroke={T.accent} strokeWidth={2.5} dot={{ fill: T.accent, r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* LISTA WPISÓW */}
      {sorted.length > 0 ? (
        <div className="fu" style={{ animationDelay: ".25s", background: T.card, border: `1px solid ${T.borderSoft}`, borderRadius: 20, overflow: "hidden" }}>
          <div style={{ padding: "10px 14px", fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: T.sub, borderBottom: `1px solid ${T.borderSoft}` }}>
            Historia wagi
          </div>
          {[...sorted].reverse().slice(0, 14).map((e, i, arr) => {
            const idx = sorted.findIndex((x) => x.ts === e.ts);
            const prev = idx > 0 ? sorted[idx - 1] : null;
            const d = prev ? Math.round((e.kg - prev.kg) * 10) / 10 : null;
            return (
              <div key={e.ts} style={{ padding: "10px 14px", display: "flex", alignItems: "center", gap: 10, borderBottom: i < arr.length - 1 ? `1px solid ${T.borderSoft}` : "none" }}>
                <div style={{ flex: 1, fontSize: 12.5, color: T.light }}>{e.dateShort}</div>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: T.accent }}>{e.kg} kg</div>
                {d !== null && d !== 0 ? (
                  <div style={{ fontSize: 11, fontWeight: 800, color: d < 0 ? T.ok : T.orange, minWidth: 38, textAlign: "right" }}>
                    {d > 0 ? "+" : ""}
                    {d}
                  </div>
                ) : (
                  <div style={{ minWidth: 38, textAlign: "right", fontSize: 10, color: T.faint }}>{d === 0 ? "=" : "start"}</div>
                )}
                <button onClick={() => removeEntry(e.ts)} title="Usuń wpis" style={{ background: "transparent", border: "none", cursor: "pointer", padding: 4, display: "flex" }}>
                  <Trash2 size={14} color={T.faint} strokeWidth={2.2} />
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="fu" style={{ animationDelay: ".25s", textAlign: "center", padding: "26px 20px", color: T.sub, fontSize: 13, lineHeight: 1.6 }}>
          Brak wpisów wagi. Dodaj pierwszy powyżej —<br />
          zobaczysz tu wykres i trend. 📉
        </div>
      )}
    </div>
  );
}
