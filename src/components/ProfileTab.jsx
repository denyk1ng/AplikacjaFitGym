import { useEffect, useRef, useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { Plus, Trash2, User, Volume2, Vibrate, CalendarClock, BellRing, RotateCcw, Eraser, Settings, Smartphone, Check, ChevronRight, Ruler, Scale, Target, AlarmClock, Download, Upload, Quote } from "lucide-react";
import { T } from "../theme.js";
import { storage } from "../lib/storage.js";
import { loadSettings, saveSettings } from "../lib/settings.js";
import { canInstall, onInstallable, promptInstall, isStandalone, isIOS } from "../lib/install.js";
import { EditNum } from "./Editable.jsx";
import { EmptyState } from "./EmptyState.jsx";
import { ConfirmSheet } from "./ConfirmSheet.jsx";
import { LogoMark } from "./Logo.jsx";

const DEFAULT_PROFILE = { name: "", height: 180, goalWeight: 0 };

// etykiety celów z kreatora onboardingu (src/components/OnboardingFlow.jsx) —
// profil pokazuje realnie wybrany cel zamiast stałego tekstu
const GOAL_LABELS = {
  muscle: "budowa mięśni",
  cut: "redukcja",
  fit: "forma i zdrowie",
  strength: "siła",
};

// przełącznik w stylu iOS, w kolorach systemu
function Toggle({ on, onChange }) {
  return (
    <button
      onClick={() => onChange(!on)}
      role="switch"
      aria-checked={on}
      style={{ width: 44, height: 26, borderRadius: 99, background: on ? T.accent : T.track, border: "none", position: "relative", cursor: "pointer", transition: "background .25s", padding: 0, flexShrink: 0 }}
    >
      <span style={{ position: "absolute", top: 3, left: on ? 21 : 3, width: 20, height: 20, borderRadius: "50%", background: on ? "#000" : T.soft, transition: "left .25s" }} />
    </button>
  );
}

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
  const [measurements, setMeasurements] = useState([]);
  const [mInputs, setMInputs] = useState({ waist: "", chest: "", arm: "", thigh: "" });
  const [ready, setReady] = useState(false);
  const [input, setInput] = useState("");
  const [settings, setSettings] = useState(loadSettings);
  const [confirm, setConfirm] = useState(null); // null | "wipe" | "reset" | "install" | "import"
  // cytaty zapisane z ekranu intro przed sesją (QuoteIntro.jsx)
  const [favQuotes, setFavQuotes] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("fav_quotes") || "[]");
    } catch (e) {
      return [];
    }
  });
  const removeFavQuote = (t) => {
    const next = favQuotes.filter((q) => q.t !== t);
    setFavQuotes(next);
    try {
      localStorage.setItem("fav_quotes", JSON.stringify(next));
    } catch (e) {}
  };
  const [installable, setInstallable] = useState(canInstall());
  const [monthlyGoal, setMonthlyGoal] = useState(() => {
    const v = parseInt(localStorage.getItem("monthly_goal") || "12", 10);
    return !isNaN(v) && v > 0 ? v : 12;
  });
  const inputRef = useRef(null);
  const fileRef = useRef(null);
  const pendingImport = useRef(null); // sparowany JSON kopii czekający na potwierdzenie

  const changeMonthlyGoal = (v) => {
    setMonthlyGoal(v);
    try {
      localStorage.setItem("monthly_goal", String(v));
    } catch (e) {}
  };

  // przypomnienia o treningu wymagają zgody systemowej — włączenie pyta o nią,
  // odmowa cofa przełącznik zamiast udawać, że działa
  const setReminder = async (v) => {
    if (v && "Notification" in window && Notification.permission !== "granted") {
      const p = await Notification.requestPermission();
      if (p !== "granted") {
        setOpt("pushReminder", false);
        return;
      }
    }
    setOpt("pushReminder", v && "Notification" in window);
  };

  // kopia zapasowa: cały localStorage do pliku JSON (dane żyją tylko na tym
  // urządzeniu — plik to jedyna polisa przed czyszczeniem danych przeglądarki)
  const exportData = () => {
    try {
      const data = {};
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        data[k] = localStorage.getItem(k);
      }
      const blob = new Blob([JSON.stringify({ app: "forma", version: 1, ts: Date.now(), data }, null, 2)], { type: "application/json" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `forma-kopia-${new Date().toLocaleDateString("sv-SE")}.json`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    } catch (e) {}
  };

  const onImportFile = (ev) => {
    const file = ev.target.files && ev.target.files[0];
    ev.target.value = ""; // ten sam plik można wybrać ponownie
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result);
        if (parsed && parsed.app === "forma" && parsed.data && typeof parsed.data === "object") {
          pendingImport.current = parsed.data;
          setConfirm("import");
        } else {
          alert("To nie wygląda na plik kopii FORMY.");
        }
      } catch (e) {
        alert("Nie udało się odczytać pliku kopii.");
      }
    };
    reader.readAsText(file);
  };

  const applyImport = () => {
    const data = pendingImport.current;
    if (!data) return;
    try {
      localStorage.clear();
      Object.entries(data).forEach(([k, v]) => {
        if (typeof v === "string") localStorage.setItem(k, v);
      });
    } catch (e) {}
    location.reload();
  };

  useEffect(() => onInstallable(setInstallable), []);

  const handleInstall = async () => {
    if (installable) {
      const done = await promptInstall();
      if (!done) setConfirm("install"); // odrzucone/niedostępne — pokaż instrukcję
    } else {
      setConfirm("install");
    }
  };

  const setOpt = (k, v) => {
    const s = { ...settings, [k]: v };
    setSettings(s);
    saveSettings(s);
  };

  const wipeHistory = () => {
    try {
      localStorage.removeItem("workout_log");
      localStorage.removeItem("progress_snapshots");
      localStorage.removeItem("live_session");
      if ("clearAppBadge" in navigator) navigator.clearAppBadge().catch(() => {});
    } catch (e) {}
    location.reload();
  };

  const resetApp = () => {
    try {
      localStorage.clear();
      if ("clearAppBadge" in navigator) navigator.clearAppBadge().catch(() => {});
    } catch (e) {}
    location.reload();
  };

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
      try {
        const m = await storage.get("body_measurements_log");
        if (m && m.value) setMeasurements(JSON.parse(m.value));
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

  const persistMeasurements = (updated) => {
    setMeasurements(updated);
    storage.set("body_measurements_log", JSON.stringify(updated));
  };

  const addMeasurement = () => {
    const parse = (v) => {
      const n = parseFloat(String(v).replace(",", "."));
      return !isNaN(n) && n > 0 ? Math.round(n * 10) / 10 : null;
    };
    const entry = { waist: parse(mInputs.waist), chest: parse(mInputs.chest), arm: parse(mInputs.arm), thigh: parse(mInputs.thigh) };
    if (!entry.waist && !entry.chest && !entry.arm && !entry.thigh) return; // nic nie wypełniono
    const now = new Date();
    persistMeasurements(
      [...measurements, { ts: now.getTime(), dateShort: now.toLocaleDateString("pl-PL", { day: "numeric", month: "short" }), ...entry }].sort((a, b) => a.ts - b.ts)
    );
    setMInputs({ waist: "", chest: "", arm: "", thigh: "" });
  };

  const removeMeasurement = (ts) => {
    persistMeasurements(measurements.filter((e) => e.ts !== ts));
  };

  const sorted = [...log].sort((a, b) => a.ts - b.ts);
  const last = sorted[sorted.length - 1];
  const first = sorted[0];
  const diff = first && last ? Math.round((last.kg - first.kg) * 10) / 10 : 0;
  const bmi = last && profile.height > 0 ? Math.round((last.kg / Math.pow(profile.height / 100, 2)) * 10) / 10 : null;
  const toGoal = last && profile.goalWeight > 0 ? Math.round((last.kg - profile.goalWeight) * 10) / 10 : null;

  const chartData = sorted.map((e) => ({ date: e.dateShort, kg: e.kg }));

  const sortedM = [...measurements].sort((a, b) => a.ts - b.ts);
  const lastM = sortedM[sortedM.length - 1];
  const prevM = sortedM.length >= 2 ? sortedM[sortedM.length - 2] : null;
  const measureDelta = (field) => {
    if (!lastM || lastM[field] == null || !prevM || prevM[field] == null) return null;
    return Math.round((lastM[field] - prevM[field]) * 10) / 10;
  };

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
            style={{ fontFamily: "'Urbanist',sans-serif", fontWeight: 700, fontSize: "1.25rem", background: "transparent", border: "none", borderBottom: `1px dashed ${T.faint}`, color: T.text, outline: "none", width: "100%", padding: "0 0 2px" }}
          />
          <div style={{ fontSize: 12, color: T.sub, marginTop: 4 }}>
            Cel: {profile.goal ? GOAL_LABELS[profile.goal] || profile.goal : "nie ustawiono"}
          </div>
        </div>
      </div>

      {/* DANE */}
      <div className="fu" style={{ animationDelay: ".05s", display: "flex", gap: 10, marginBottom: 14 }}>
        <div style={{ flex: 1, background: T.card, border: `1px solid ${T.borderSoft}`, borderRadius: 18, padding: "13px", textAlign: "center" }}>
          <div style={{ fontSize: 9.5, color: T.sub, textTransform: "uppercase", letterSpacing: ".06em", fontWeight: 700, marginBottom: 6 }}>Wzrost</div>
          <EditNum value={profile.height} unit="cm" min={100} max={250} onChange={(v) => setProfile({ ...profile, height: v })} />
        </div>
        <div style={{ flex: 1, background: T.card, border: `1px solid ${T.borderSoft}`, borderRadius: 18, padding: "13px", textAlign: "center" }}>
          <div style={{ fontSize: 9.5, color: T.sub, textTransform: "uppercase", letterSpacing: ".06em", fontWeight: 700, marginBottom: 6 }}>Waga teraz</div>
          <div style={{ fontFamily: "'Urbanist',sans-serif", fontWeight: 800, fontSize: "1.15rem", color: T.accent }}>{last ? `${last.kg} kg` : "—"}</div>
        </div>
        <div style={{ flex: 1, background: T.card, border: `1px solid ${T.borderSoft}`, borderRadius: 18, padding: "13px", textAlign: "center" }}>
          <div style={{ fontSize: 9.5, color: T.sub, textTransform: "uppercase", letterSpacing: ".06em", fontWeight: 700, marginBottom: 6 }}>Cel wagi</div>
          <EditNum value={profile.goalWeight} unit="kg" min={30} max={300} onChange={(v) => setProfile({ ...profile, goalWeight: v })} />
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
            <div style={{ fontFamily: "'Doto',sans-serif", fontWeight: 800, fontSize: "1.9rem", color: "#fff", lineHeight: 1 }}>
              {last.kg}
              <span style={{ fontSize: 14, color: T.sub }}> kg</span>
            </div>
            <div style={{ fontSize: 10.5, color: T.sub, marginTop: 3, fontWeight: 600 }}>aktualna waga</div>
          </Gauge>
          <div style={{ display: "flex", marginTop: 14, borderTop: `1px solid ${T.borderSoft}`, paddingTop: 12 }}>
            <div style={{ flex: 1, textAlign: "center" }}>
              <div style={{ fontFamily: "'Urbanist',sans-serif", fontWeight: 700, fontSize: "1.05rem", color: diff <= 0 ? T.ok : T.yellow }}>
                {diff > 0 ? "+" : ""}
                {diff} kg
              </div>
              <div style={{ fontSize: 9.5, color: T.sub, fontWeight: 600, marginTop: 2 }}>zmiana</div>
            </div>
            <div style={{ width: 1, background: T.borderSoft }} />
            <div style={{ flex: 1, textAlign: "center" }}>
              <div style={{ fontFamily: "'Urbanist',sans-serif", fontWeight: 700, fontSize: "1.05rem", color: T.accent }}>
                {profile.goalWeight > 0 ? `${profile.goalWeight} kg` : "—"}
              </div>
              <div style={{ fontSize: 9.5, color: T.sub, fontWeight: 600, marginTop: 2 }}>cel</div>
            </div>
            <div style={{ width: 1, background: T.borderSoft }} />
            <div style={{ flex: 1, textAlign: "center" }}>
              <div style={{ fontFamily: "'Urbanist',sans-serif", fontWeight: 700, fontSize: "1.05rem", color: "#fff" }}>{sorted.length}</div>
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
              <div style={{ fontFamily: "'Urbanist',sans-serif", fontWeight: 800, fontSize: "1.4rem", color: bmiLabel(bmi).c }}>{bmi}</div>
              <div style={{ fontSize: 10.5, color: bmiLabel(bmi).c, fontWeight: 700 }}>{bmiLabel(bmi).txt}</div>
            </div>
          )}
          {toGoal !== null && (
            <div style={{ flex: 1, background: T.card, border: `1px solid ${T.borderSoft}`, borderRadius: 18, padding: "13px", textAlign: "center" }}>
              <div style={{ fontSize: 9.5, color: T.sub, textTransform: "uppercase", letterSpacing: ".06em", fontWeight: 700 }}>Do celu</div>
              <div style={{ fontFamily: "'Urbanist',sans-serif", fontWeight: 800, fontSize: "1.4rem", color: Math.abs(toGoal) <= 0.5 ? T.ok : T.accent }}>
                {toGoal > 0 ? `−${toGoal}` : toGoal < 0 ? `+${Math.abs(toGoal)}` : "✓"}
              </div>
              <div style={{ fontSize: 10.5, color: T.sub, fontWeight: 700 }}>{Math.abs(toGoal) <= 0.5 ? "cel osiągnięty!" : "kg"}</div>
            </div>
          )}
          {sorted.length >= 2 && (
            <div style={{ flex: 1, background: T.card, border: `1px solid ${T.borderSoft}`, borderRadius: 18, padding: "13px", textAlign: "center" }}>
              <div style={{ fontSize: 9.5, color: T.sub, textTransform: "uppercase", letterSpacing: ".06em", fontWeight: 700 }}>Zmiana</div>
              <div style={{ fontFamily: "'Urbanist',sans-serif", fontWeight: 800, fontSize: "1.4rem", color: diff <= 0 ? T.ok : T.yellow }}>
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
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: T.sub, marginBottom: 10 }}>Zapisz dzisiejszą wagę</div>
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
                  <div style={{ fontSize: 11, fontWeight: 800, color: d < 0 ? T.ok : T.yellow, minWidth: 38, textAlign: "right" }}>
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
        <EmptyState icon={Scale} title="Brak wpisów wagi" desc="Dodaj pierwszy powyżej — zobaczysz tu wykres i trend." />
      )}

      {/* POMIARY CIAŁA */}
      <div className="fu" style={{ animationDelay: ".26s", display: "flex", alignItems: "center", gap: 6, fontSize: 10.5, fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: T.soft, margin: "22px 0 10px" }}>
        <Ruler size={13} color={T.accent} strokeWidth={2.4} />
        Pomiary ciała
      </div>

      <div className="fu" style={{ animationDelay: ".27s", display: "flex", gap: 8, marginBottom: 10 }}>
        {[
          { key: "waist", l: "Talia" },
          { key: "chest", l: "Klatka" },
          { key: "arm", l: "Biceps" },
          { key: "thigh", l: "Uda" },
        ].map(({ key, l }) => {
          const d = measureDelta(key);
          return (
            <div key={key} style={{ flex: 1, background: T.card, border: `1px solid ${T.borderSoft}`, borderRadius: 16, padding: "10px 6px", textAlign: "center" }}>
              <div style={{ fontSize: 9, color: T.sub, textTransform: "uppercase", letterSpacing: ".05em", fontWeight: 700 }}>{l}</div>
              <div style={{ fontFamily: "'Urbanist',sans-serif", fontWeight: 800, fontSize: "1.05rem", color: "#fff", marginTop: 4 }}>
                {lastM && lastM[key] != null ? `${lastM[key]}` : "—"}
                {lastM && lastM[key] != null && <span style={{ fontSize: 10, color: T.sub }}> cm</span>}
              </div>
              {d !== null && d !== 0 && (
                <div style={{ fontSize: 9.5, fontWeight: 700, color: d < 0 ? T.ok : T.yellow, marginTop: 2 }}>
                  {d > 0 ? "+" : ""}
                  {d}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="fu" style={{ animationDelay: ".28s", background: T.card, border: `1px solid ${T.borderSoft}`, borderRadius: 20, padding: "14px 16px", marginBottom: 14 }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: T.sub, marginBottom: 10 }}>Dodaj pomiar</div>
        <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
          <input
            value={mInputs.waist}
            onChange={(e) => setMInputs({ ...mInputs, waist: e.target.value })}
            placeholder="Talia cm"
            inputMode="decimal"
            style={{ flex: 1, minWidth: 0, background: T.inset, border: `1px solid ${T.border}`, borderRadius: 12, color: T.text, padding: "10px 11px", fontSize: 13.5, fontWeight: 700, fontFamily: "inherit", outline: "none" }}
          />
          <input
            value={mInputs.chest}
            onChange={(e) => setMInputs({ ...mInputs, chest: e.target.value })}
            placeholder="Klatka cm"
            inputMode="decimal"
            style={{ flex: 1, minWidth: 0, background: T.inset, border: `1px solid ${T.border}`, borderRadius: 12, color: T.text, padding: "10px 11px", fontSize: 13.5, fontWeight: 700, fontFamily: "inherit", outline: "none" }}
          />
        </div>
        <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
          <input
            value={mInputs.arm}
            onChange={(e) => setMInputs({ ...mInputs, arm: e.target.value })}
            placeholder="Biceps cm"
            inputMode="decimal"
            style={{ flex: 1, minWidth: 0, background: T.inset, border: `1px solid ${T.border}`, borderRadius: 12, color: T.text, padding: "10px 11px", fontSize: 13.5, fontWeight: 700, fontFamily: "inherit", outline: "none" }}
          />
          <input
            value={mInputs.thigh}
            onChange={(e) => setMInputs({ ...mInputs, thigh: e.target.value })}
            placeholder="Uda cm"
            inputMode="decimal"
            style={{ flex: 1, minWidth: 0, background: T.inset, border: `1px solid ${T.border}`, borderRadius: 12, color: T.text, padding: "10px 11px", fontSize: 13.5, fontWeight: 700, fontFamily: "inherit", outline: "none" }}
          />
        </div>
        <button
          onClick={addMeasurement}
          style={{ width: "100%", background: T.accent, color: "#000", border: "none", borderRadius: 14, fontWeight: 800, fontSize: 13, padding: "12px 18px", cursor: "pointer", fontFamily: "inherit", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 5 }}
        >
          <Plus size={16} strokeWidth={2.8} /> Dodaj pomiar
        </button>
        <div style={{ fontSize: 10.5, color: T.faint, marginTop: 8 }}>Wypełnij tylko to, co akurat mierzysz — reszta zostaje puste.</div>
      </div>

      {sortedM.length > 0 ? (
        <div className="fu" style={{ animationDelay: ".29s", background: T.card, border: `1px solid ${T.borderSoft}`, borderRadius: 20, overflow: "hidden", marginBottom: 14 }}>
          <div style={{ padding: "10px 14px", fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: T.sub, borderBottom: `1px solid ${T.borderSoft}` }}>
            Historia pomiarów
          </div>
          {[...sortedM].reverse().slice(0, 10).map((e, i, arr) => (
            <div key={e.ts} style={{ padding: "10px 14px", display: "flex", alignItems: "center", gap: 10, borderBottom: i < arr.length - 1 ? `1px solid ${T.borderSoft}` : "none" }}>
              <div style={{ flex: 1, fontSize: 12.5, color: T.light }}>{e.dateShort}</div>
              <div style={{ fontSize: 11, color: T.sub }}>
                {[e.waist && `talia ${e.waist}`, e.chest && `klatka ${e.chest}`, e.arm && `biceps ${e.arm}`, e.thigh && `uda ${e.thigh}`].filter(Boolean).join(" · ")}
              </div>
              <button onClick={() => removeMeasurement(e.ts)} title="Usuń wpis" style={{ background: "transparent", border: "none", cursor: "pointer", padding: 4, display: "flex", flexShrink: 0 }}>
                <Trash2 size={14} color={T.faint} strokeWidth={2.2} />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState nested icon={Ruler} desc="Brak pomiarów. Dodaj pierwszy powyżej — zobaczysz tu historię zmian." />
      )}

      {/* ZAPISANE CYTATY — odłożone z ekranu cytatu przed sesją */}
      {favQuotes.length > 0 && (
        <div className="fu" style={{ animationDelay: ".3s", background: T.card, border: `1px solid ${T.borderSoft}`, borderRadius: 20, overflow: "hidden", marginBottom: 14 }}>
          <div style={{ padding: "10px 14px", fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: T.sub, borderBottom: `1px solid ${T.borderSoft}` }}>
            Zapisane cytaty
          </div>
          {favQuotes.map((q, i) => (
            <div key={q.ts || i} style={{ padding: "11px 14px", display: "flex", gap: 10, alignItems: "flex-start", borderBottom: i < favQuotes.length - 1 ? `1px solid ${T.borderSoft}` : "none" }}>
              <Quote size={13} color={T.accent} fill={T.accent} strokeWidth={0} style={{ flexShrink: 0, transform: "rotate(180deg)", marginTop: 2 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, color: T.light, fontStyle: "italic", lineHeight: 1.5 }}>{q.t}</div>
                <div style={{ fontSize: 10, color: T.faint, marginTop: 3 }}>
                  ~ {q.a || "autor nieznany"}
                  {q.y ? `, ${q.y}` : ""}
                </div>
              </div>
              <button onClick={() => removeFavQuote(q.t)} title="Usuń cytat" style={{ background: "transparent", border: "none", cursor: "pointer", padding: 4, display: "flex", flexShrink: 0 }}>
                <Trash2 size={14} color={T.faint} strokeWidth={2.2} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* USTAWIENIA */}
      <div className="fu" style={{ animationDelay: ".3s", display: "flex", alignItems: "center", gap: 6, fontSize: 10.5, fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: T.soft, margin: "22px 0 10px" }}>
        <Settings size={13} color={T.accent} strokeWidth={2.4} />
        Ustawienia
      </div>

      {/* instalacja na telefonie */}
      {!isStandalone() && (
        <button
          onClick={handleInstall}
          className="fu"
          style={{ animationDelay: ".29s", width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "13px 16px", background: T.accentSoftBg, border: `1px solid ${T.accentSoftBorder}`, borderRadius: 20, cursor: "pointer", textAlign: "left", fontFamily: "inherit", marginBottom: 12 }}
        >
          <span style={{ width: 38, height: 38, borderRadius: 12, background: T.accent, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Smartphone size={17} color="#000" strokeWidth={2.2} />
          </span>
          <span style={{ flex: 1 }}>
            <span style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#fff", fontFamily: "'Urbanist',sans-serif" }}>Zainstaluj na telefonie</span>
            <span style={{ display: "block", fontSize: 10.5, color: T.sub, marginTop: 2 }}>ikonka na pulpicie · pełny ekran · działa offline</span>
          </span>
          <ChevronRight size={15} color={T.accent} strokeWidth={2.2} />
        </button>
      )}
      {isStandalone() && (
        <div className="fu" style={{ animationDelay: ".29s", display: "flex", alignItems: "center", gap: 12, padding: "13px 16px", background: T.card, border: `1px solid ${T.borderSoft}`, borderRadius: 20, marginBottom: 12 }}>
          <span style={{ width: 38, height: 38, borderRadius: 12, background: "rgba(52,211,153,0.12)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Check size={17} color={T.ok} strokeWidth={2.4} />
          </span>
          <span style={{ flex: 1 }}>
            <span style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#fff", fontFamily: "'Urbanist',sans-serif" }}>Aplikacja zainstalowana</span>
            <span style={{ display: "block", fontSize: 10.5, color: T.sub, marginTop: 2 }}>działasz z ikonki na pulpicie</span>
          </span>
        </div>
      )}

      <div className="fu" style={{ animationDelay: ".3s", background: T.card, border: `1px solid ${T.borderSoft}`, borderRadius: 20, overflow: "hidden", marginBottom: 12 }}>
        {[
          { k: "sound", Icon: Volume2, t: "Dźwięk końca przerwy", d: "sygnał po odliczeniu przerwy w sesji" },
          { k: "vibrate", Icon: Vibrate, t: "Wibracje", d: "wibracja razem z sygnałem (telefon)" },
          { k: "remindPlan", Icon: CalendarClock, t: "Plan dnia na głównym", d: "karta „dziś na planie” z podpowiedzią treningu" },
          { k: "overdueAlert", Icon: BellRing, t: "Alerty zaległych treningów", d: "dzwonek i ostrzeżenia w kalendarzu" },
          { k: "pushReminder", Icon: AlarmClock, t: "Przypomnienie o treningu", d: "powiadomienie o Twojej zwykłej porze, gdy trening dnia wisi" },
        ].map((row, i, arr) => (
          <div key={row.k} style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 16px", borderBottom: i < arr.length - 1 ? `1px solid ${T.borderSoft}` : "none" }}>
            <span style={{ width: 38, height: 38, borderRadius: 12, background: T.inset, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <row.Icon size={17} color={settings[row.k] ? T.accent : T.soft} strokeWidth={2.2} />
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", fontFamily: "'Urbanist',sans-serif" }}>{row.t}</div>
              <div style={{ fontSize: 10.5, color: T.sub, marginTop: 2 }}>{row.d}</div>
            </div>
            <Toggle on={!!settings[row.k]} onChange={(v) => (row.k === "pushReminder" ? setReminder(v) : setOpt(row.k, v))} />
          </div>
        ))}
      </div>

      {/* CEL MIESIĄCA — liczba treningów A/B/C, pasek na ekranie głównym */}
      <div className="fu" style={{ animationDelay: ".31s", display: "flex", alignItems: "center", gap: 12, padding: "13px 16px", background: T.card, border: `1px solid ${T.borderSoft}`, borderRadius: 20, marginBottom: 12 }}>
        <span style={{ width: 38, height: 38, borderRadius: 12, background: T.inset, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Target size={17} color={T.accent} strokeWidth={2.2} />
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", fontFamily: "'Urbanist',sans-serif" }}>Cel miesiąca</div>
          <div style={{ fontSize: 10.5, color: T.sub, marginTop: 2 }}>liczba treningów A/B/C — pasek postępu na ekranie głównym</div>
        </div>
        <EditNum value={monthlyGoal} unit="tr." min={1} max={60} onChange={changeMonthlyGoal} />
      </div>

      {/* KOPIA ZAPASOWA */}
      <div className="fu" style={{ animationDelay: ".315s", background: T.card, border: `1px solid ${T.borderSoft}`, borderRadius: 20, overflow: "hidden", marginBottom: 12 }}>
        <button
          onClick={exportData}
          style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "13px 16px", background: "transparent", border: "none", borderBottom: `1px solid ${T.borderSoft}`, cursor: "pointer", textAlign: "left", fontFamily: "inherit" }}
        >
          <span style={{ width: 38, height: 38, borderRadius: 12, background: T.inset, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Download size={17} color={T.accent} strokeWidth={2.2} />
          </span>
          <span style={{ flex: 1 }}>
            <span style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#fff", fontFamily: "'Urbanist',sans-serif" }}>Eksportuj dane (kopia zapasowa)</span>
            <span style={{ display: "block", fontSize: 10.5, color: T.sub, marginTop: 2 }}>plik JSON z całą historią — trzymaj np. na Dysku Google</span>
          </span>
        </button>
        <button
          onClick={() => fileRef.current && fileRef.current.click()}
          style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "13px 16px", background: "transparent", border: "none", cursor: "pointer", textAlign: "left", fontFamily: "inherit" }}
        >
          <span style={{ width: 38, height: 38, borderRadius: 12, background: T.inset, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Upload size={17} color={T.accent} strokeWidth={2.2} />
          </span>
          <span style={{ flex: 1 }}>
            <span style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#fff", fontFamily: "'Urbanist',sans-serif" }}>Przywróć z kopii</span>
            <span style={{ display: "block", fontSize: 10.5, color: T.sub, marginTop: 2 }}>wczytuje plik kopii i zastępuje obecne dane</span>
          </span>
        </button>
        <input ref={fileRef} type="file" accept="application/json,.json" onChange={onImportFile} style={{ display: "none" }} />
      </div>

      {/* DANE */}
      <div className="fu" style={{ animationDelay: ".32s", background: T.card, border: `1px solid ${T.borderSoft}`, borderRadius: 20, overflow: "hidden", marginBottom: 14 }}>
        <button
          onClick={() => setConfirm("wipe")}
          style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "13px 16px", background: "transparent", border: "none", borderBottom: `1px solid ${T.borderSoft}`, cursor: "pointer", textAlign: "left", fontFamily: "inherit" }}
        >
          <span style={{ width: 38, height: 38, borderRadius: 12, background: T.inset, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Eraser size={17} color={T.yellow} strokeWidth={2.2} />
          </span>
          <span style={{ flex: 1 }}>
            <span style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#fff", fontFamily: "'Urbanist',sans-serif" }}>Wyczyść historię treningów</span>
            <span style={{ display: "block", fontSize: 10.5, color: T.sub, marginTop: 2 }}>kalendarz, zapisy ciężarów i statystyki — plan zostaje</span>
          </span>
        </button>
        <button
          onClick={() => setConfirm("reset")}
          style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "13px 16px", background: "transparent", border: "none", cursor: "pointer", textAlign: "left", fontFamily: "inherit" }}
        >
          <span style={{ width: 38, height: 38, borderRadius: 12, background: "rgba(244,63,94,0.12)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <RotateCcw size={17} color={T.danger} strokeWidth={2.2} />
          </span>
          <span style={{ flex: 1 }}>
            <span style={{ display: "block", fontSize: 13, fontWeight: 700, color: T.danger, fontFamily: "'Urbanist',sans-serif" }}>Zresetuj aplikację</span>
            <span style={{ display: "block", fontSize: 10.5, color: T.sub, marginTop: 2 }}>usuwa wszystko i uruchamia konfigurację od nowa</span>
          </span>
        </button>
      </div>

      {/* STOPKA */}
      <div className="fu" style={{ animationDelay: ".34s", textAlign: "center", padding: "4px 0 8px" }}>
        <LogoMark size={18} />
        <div style={{ fontSize: 10, color: T.faint, marginTop: 6, letterSpacing: ".08em" }}>
          FORMA v1.0 · dane trzymane lokalnie na tym urządzeniu
        </div>
      </div>

      <ConfirmSheet
        open={confirm === "install"}
        onClose={() => setConfirm(null)}
        icon={Smartphone}
        tone="accent"
        single
        title="Jak zainstalować FORMĘ"
        desc={
          isIOS()
            ? "1. Otwórz tę stronę w Safari (nie w okienku Messengera/WhatsAppa — tam wybierz „Otwórz w Safari”).\n2. Stuknij przycisk Udostępnij — kwadrat ze strzałką na dolnym pasku.\n3. Przewiń listę i wybierz „Dodaj do ekranu początkowego”.\n4. Stuknij „Dodaj” — ikonka FORMA pojawi się na pulpicie."
            : "1. Otwórz tę stronę w Chrome (nie w okienku Messengera/WhatsAppa — tam wybierz „Otwórz w przeglądarce”).\n2. Stuknij menu ⋮ w prawym górnym rogu.\n3. Wybierz „Dodaj do ekranu głównego” albo „Zainstaluj aplikację”.\n4. Potwierdź — ikonka FORMA pojawi się na pulpicie."
        }
        confirmLabel="Rozumiem"
        onConfirm={() => setConfirm(null)}
      />
      <ConfirmSheet
        open={confirm === "wipe"}
        onClose={() => setConfirm(null)}
        icon={Eraser}
        title="Wyczyścić historię?"
        desc="Usunie kalendarz treningów, zapisy ciężarów i statystyki. Twój plan i profil zostają. Tej operacji nie można cofnąć."
        confirmLabel="Wyczyść historię"
        onConfirm={wipeHistory}
        cancelLabel="Wróć"
      />
      <ConfirmSheet
        open={confirm === "import"}
        onClose={() => {
          pendingImport.current = null;
          setConfirm(null);
        }}
        icon={Upload}
        title="Przywrócić dane z kopii?"
        desc="Obecne dane aplikacji (plan, historia, profil, ustawienia) zostaną zastąpione zawartością pliku kopii. Tej operacji nie można cofnąć."
        confirmLabel="Przywróć z kopii"
        onConfirm={applyImport}
        cancelLabel="Wróć"
      />
      <ConfirmSheet
        open={confirm === "reset"}
        onClose={() => setConfirm(null)}
        icon={RotateCcw}
        title="Zresetować aplikację?"
        desc="Usunie wszystkie dane: plan, historię, profil i ustawienia. Aplikacja wystartuje od ekranu powitalnego."
        confirmLabel="Zresetuj wszystko"
        onConfirm={resetApp}
        cancelLabel="Wróć"
      />
    </div>
  );
}
