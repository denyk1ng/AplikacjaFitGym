import { useEffect, useState } from "react";
import { Flame, Beef, Droplets, RotateCcw, Minus } from "lucide-react";
import { T } from "../theme.js";
import { storage } from "../lib/storage.js";
import { EditNum } from "./Editable.jsx";

const DEFAULT_TARGETS = { kcal: 2500, protein: 160, water: 3000 };

function todayKey(offset = 0) {
  const d = new Date();
  d.setDate(d.getDate() - offset);
  return d.toLocaleDateString("sv-SE"); // YYYY-MM-DD lokalnie
}

function Tracker({ icon, label, unit, value, target, color, quickAdds, minusStep, onAdd, onReset, onTarget, format }) {
  const pct = target > 0 ? Math.min(value / target, 1) : 0;
  const done = value >= target && target > 0;
  const fmt = format || ((v) => v);
  return (
    <div className="fu" style={{ background: T.card, border: `1px solid ${done ? `${color}55` : T.borderSoft}`, borderRadius: 22, padding: "14px 16px", marginBottom: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
        <div style={{ width: 40, height: 40, borderRadius: 14, background: `${color}1c`, border: `1px solid ${color}38`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          {icon}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 700 }}>{label}</div>
          <div style={{ fontSize: 11.5, color: T.sub, marginTop: 1, display: "flex", alignItems: "center", gap: 4 }}>
            cel: <EditNum value={target} unit={unit} onChange={onTarget} />
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontFamily: "'Urbanist',sans-serif", fontWeight: 800, fontSize: "1.3rem", color: done ? T.ok : color }}>
            {fmt(value)}
            <span style={{ fontSize: 11, color: T.sub, fontWeight: 700 }}> / {fmt(target)} {unit}</span>
          </div>
          {done && <div style={{ fontSize: 10, color: T.ok, fontWeight: 800 }}>✓ cel osiągnięty</div>}
        </div>
      </div>

      {/* pasek postępu */}
      <div style={{ height: 8, borderRadius: 99, background: T.track, overflow: "hidden", marginBottom: 10 }}>
        <div style={{ height: "100%", width: `${pct * 100}%`, borderRadius: 99, background: done ? T.ok : color, transition: "width .5s cubic-bezier(.22,1,.36,1)" }} />
      </div>

      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {quickAdds.map((q) => (
          <button
            key={q}
            onClick={() => onAdd(q)}
            style={{ background: `${color}14`, border: `1px solid ${color}30`, color, borderRadius: 99, fontSize: 12, fontWeight: 800, padding: "8px 13px", cursor: "pointer", fontFamily: "inherit" }}
          >
            +{fmt(q)}
          </button>
        ))}
        <button
          onClick={() => onAdd(-minusStep)}
          title="Cofnij"
          style={{ background: T.inset, border: `1px solid ${T.border}`, color: T.soft, borderRadius: 99, fontSize: 12, fontWeight: 800, padding: "8px 11px", cursor: "pointer", fontFamily: "inherit", display: "inline-flex", alignItems: "center" }}
        >
          <Minus size={13} strokeWidth={2.8} />
          {fmt(minusStep)}
        </button>
        <button
          onClick={onReset}
          title="Wyzeruj dzień"
          style={{ background: T.inset, border: `1px solid ${T.border}`, color: T.faint, borderRadius: 99, fontSize: 12, padding: "8px 11px", cursor: "pointer", fontFamily: "inherit", display: "inline-flex", alignItems: "center", marginLeft: "auto" }}
        >
          <RotateCcw size={13} strokeWidth={2.4} />
        </button>
      </div>
    </div>
  );
}

export function DietTab() {
  const [targets, setTargets] = useState(DEFAULT_TARGETS);
  const [log, setLog] = useState({});
  const [ready, setReady] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const t = await storage.get("diet_targets");
        if (t && t.value) setTargets({ ...DEFAULT_TARGETS, ...JSON.parse(t.value) });
      } catch (e) {}
      try {
        const l = await storage.get("diet_log");
        if (l && l.value) setLog(JSON.parse(l.value));
      } catch (e) {}
      setReady(true);
    }
    load();
  }, []);

  useEffect(() => {
    if (ready) storage.set("diet_targets", JSON.stringify(targets));
  }, [targets, ready]);

  const key = todayKey();
  const today = log[key] || { kcal: 0, protein: 0, water: 0 };

  const update = (field, delta) => {
    const next = { ...today, [field]: Math.max(0, (today[field] || 0) + delta) };
    const updated = { ...log, [key]: next };
    setLog(updated);
    storage.set("diet_log", JSON.stringify(updated));
  };
  const resetField = (field) => {
    const next = { ...today, [field]: 0 };
    const updated = { ...log, [key]: next };
    setLog(updated);
    storage.set("diet_log", JSON.stringify(updated));
  };

  // pasek ostatnich 7 dni (kcal)
  const week = Array.from({ length: 7 }, (_, i) => {
    const k = todayKey(6 - i);
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const entry = log[k] || { kcal: 0 };
    return {
      label: d.toLocaleDateString("pl-PL", { weekday: "short" }).slice(0, 2).toUpperCase(),
      pct: targets.kcal > 0 ? Math.min(entry.kcal / targets.kcal, 1) : 0,
      hit: targets.kcal > 0 && entry.kcal >= targets.kcal,
      isToday: i === 6,
    };
  });

  if (!ready) return null;

  const dateStr = new Date().toLocaleDateString("pl-PL", { weekday: "long", day: "numeric", month: "long" });

  return (
    <div>
      <div className="fu" style={{ fontSize: 12, color: T.sub, marginBottom: 14 }}>
        Dzisiejsze cele · {dateStr.charAt(0).toUpperCase() + dateStr.slice(1)}
      </div>

      {/* KOMPAKTOWY PASEK CELÓW (jak "Today's target" z referencji) */}
      <div className="fu" style={{ background: T.card, border: `1px solid ${T.borderSoft}`, borderRadius: 20, padding: "13px 16px", marginBottom: 14, display: "flex", gap: 14 }}>
        {[
          { l: "kalorie", v: today.kcal, t: targets.kcal, c: T.orange },
          { l: "białko", v: today.protein, t: targets.protein, c: T.danger },
          { l: "woda", v: today.water, t: targets.water, c: T.blue },
        ].map((g) => (
          <div key={g.l} style={{ flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: g.v >= g.t && g.t > 0 ? T.ok : "#fff", fontFamily: "'Urbanist',sans-serif" }}>
              {g.v}
              <span style={{ fontSize: 9.5, color: T.sub, fontWeight: 600 }}> /{g.t}</span>
            </div>
            <div style={{ height: 5, borderRadius: 99, background: T.track, overflow: "hidden", margin: "6px 0 4px" }}>
              <div style={{ height: "100%", width: `${g.t > 0 ? Math.min(g.v / g.t, 1) * 100 : 0}%`, borderRadius: 99, background: g.v >= g.t && g.t > 0 ? T.ok : g.c, transition: "width .5s" }} />
            </div>
            <div style={{ fontSize: 9, color: T.sub, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em" }}>{g.l}</div>
          </div>
        ))}
      </div>

      <Tracker
        icon={<Flame size={20} color={T.orange} strokeWidth={2.2} />}
        label="Kalorie"
        unit="kcal"
        value={today.kcal}
        target={targets.kcal}
        color={T.orange}
        quickAdds={[100, 250, 500]}
        minusStep={100}
        onAdd={(d) => update("kcal", d)}
        onReset={() => resetField("kcal")}
        onTarget={(v) => setTargets({ ...targets, kcal: Math.round(v) })}
      />

      <Tracker
        icon={<Beef size={20} color={T.danger} strokeWidth={2.2} />}
        label="Białko"
        unit="g"
        value={today.protein}
        target={targets.protein}
        color={T.danger}
        quickAdds={[10, 25, 40]}
        minusStep={10}
        onAdd={(d) => update("protein", d)}
        onReset={() => resetField("protein")}
        onTarget={(v) => setTargets({ ...targets, protein: Math.round(v) })}
      />

      <Tracker
        icon={<Droplets size={20} color={T.blue} strokeWidth={2.2} />}
        label="Woda"
        unit="ml"
        value={today.water}
        target={targets.water}
        color={T.blue}
        quickAdds={[250, 500]}
        minusStep={250}
        onAdd={(d) => update("water", d)}
        onReset={() => resetField("water")}
        onTarget={(v) => setTargets({ ...targets, water: Math.round(v) })}
      />

      {/* OSTATNIE 7 DNI */}
      <div className="fu" style={{ animationDelay: ".2s", background: T.card, border: `1px solid ${T.borderSoft}`, borderRadius: 22, padding: "14px 16px" }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: T.sub, marginBottom: 12 }}>
          Kalorie — ostatnie 7 dni
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "flex-end", height: 72 }}>
          {week.map((d, i) => (
            <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 5, height: "100%" }}>
              <div style={{ flex: 1, width: "100%", maxWidth: 26, display: "flex", alignItems: "flex-end" }}>
                <div
                  style={{
                    width: "100%",
                    height: `${Math.max(d.pct * 100, 5)}%`,
                    borderRadius: 7,
                    background: d.hit ? T.ok : d.isToday ? T.accent : T.track,
                    opacity: d.pct === 0 && !d.isToday ? 0.45 : 1,
                    transition: "height .5s cubic-bezier(.22,1,.36,1)",
                  }}
                />
              </div>
              <span style={{ fontSize: 9, fontWeight: 800, color: d.isToday ? T.accent : T.faint, fontFamily: "'Urbanist',sans-serif" }}>{d.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="fu" style={{ animationDelay: ".25s", marginTop: 12, background: T.accentSoftBg, border: `1px solid ${T.accentSoftBorder}`, borderRadius: 16, padding: "12px 14px", fontSize: 12, color: T.soft, lineHeight: 1.6 }}>
        Przy rekompozycji celuj w <strong style={{ color: T.accent }}>~2 g białka na kg masy ciała</strong> i lekki deficyt kalorii w dni bez treningu.
      </div>
    </div>
  );
}
