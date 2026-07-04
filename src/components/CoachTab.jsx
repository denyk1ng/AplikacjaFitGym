import { useEffect, useMemo, useRef, useState } from "react";
import { Send, Bot, KeyRound, Sparkles, Loader2 } from "lucide-react";
import { T } from "../theme.js";
import { loadSettings, saveSettings } from "../lib/settings.js";
import { loadWorkoutLog } from "../lib/workoutLog.js";
import { computeInsights, insightText, cardText } from "../lib/coach.js";
import { sendCoachMessage } from "../lib/aiClient.js";

const U = "'Urbanist',sans-serif";

function buildSystemPrompt(exercisesData, insights, log) {
  const planSummary = Object.entries(exercisesData)
    .map(
      ([k, d]) =>
        `Trening ${k} (${d.label}): ` +
        d.exercises.map((e) => `${e.name.split("—")[0].trim()} ${e.sets}x${e.reps}${e.weight ? ` @ ${e.weight}${e.unit}` : ""}`).join(", ")
    )
    .join("\n");
  const insightsSummary = insights.length ? insights.map(insightText).join("\n") : "Brak jeszcze wystarczających danych do sugestii.";
  const recent =
    [...log]
      .sort((a, b) => b.ts - a.ts)
      .slice(0, 8)
      .map((e) => `${e.date}: Trening ${e.type}, ${e.sets ?? "?"} serii${e.volume ? `, ${Math.round(e.volume)}kg objętości` : ""}`)
      .join("\n") || "brak zapisanych sesji";

  return `Jesteś osobistym trenerem siłowym w polskiej aplikacji FORMA. Odpowiadaj krótko, konkretnie i po polsku, jak doświadczony trener personalny — bez lania wody.

Plan treningowy użytkownika:
${planSummary}

Automatyczne obserwacje z historii treningów:
${insightsSummary}

Ostatnie sesje:
${recent}

Odpowiadaj na pytania o technikę, plan, ciężary, regenerację i ból. Jeśli sugerujesz zmianę ciężaru, odnoś się do realnych danych powyżej.`;
}

function greeting(insights) {
  const top = cardText(insights);
  return `Cześć! Jestem Twoim trenerem AI — widzę Twój plan i historię treningów.\n\n${top}\n\nZapytaj mnie o technikę, plan albo powiedz, że coś Cię boli.`;
}

export function CoachTab({ exercises }) {
  const [settings, setSettings] = useState(loadSettings);
  const [keyInput, setKeyInput] = useState("");
  const [log, setLog] = useState([]);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef(null);

  useEffect(() => {
    loadWorkoutLog().then(setLog);
  }, []);

  const insights = useMemo(() => computeInsights(log, exercises), [log, exercises]);
  const hasKey = !!settings.aiApiKey;

  useEffect(() => {
    if (hasKey && messages.length === 0) setMessages([{ role: "assistant", content: greeting(insights) }]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasKey]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, busy]);

  const saveKey = () => {
    const k = keyInput.trim();
    if (!k) return;
    const s = { ...settings, aiApiKey: k };
    setSettings(s);
    saveSettings(s);
    setKeyInput("");
  };

  const changeKey = () => {
    const s = { ...settings, aiApiKey: "" };
    setSettings(s);
    saveSettings(s);
    setMessages([]);
  };

  const send = async (text) => {
    const t = (text ?? input).trim();
    if (!t || busy) return;
    const next = [...messages, { role: "user", content: t }];
    setMessages(next);
    setInput("");
    setError("");
    setBusy(true);
    try {
      const reply = await sendCoachMessage({
        apiKey: settings.aiApiKey,
        systemPrompt: buildSystemPrompt(exercises, insights, log),
        messages: next,
      });
      setMessages((m) => [...m, { role: "assistant", content: reply }]);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  if (!hasKey) {
    return (
      <div className="fu" style={{ background: T.card, border: `1px solid ${T.borderSoft}`, borderRadius: 22, padding: 20 }}>
        <div style={{ width: 46, height: 46, borderRadius: 14, background: T.accentSoftBg, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
          <KeyRound size={21} color={T.accent} strokeWidth={2.2} />
        </div>
        <div style={{ fontFamily: U, fontWeight: 700, fontSize: "1.05rem", color: "#fff" }}>Podłącz trenera AI</div>
        <p style={{ fontSize: 12.5, color: T.sub, marginTop: 6, lineHeight: 1.55 }}>
          Ta appka nie ma własnego serwera, więc czat działa na Twoim własnym kluczu API Anthropic. Klucz zostaje wyłącznie
          w pamięci tego urządzenia (localStorage) i jest wysyłany bezpośrednio z przeglądarki do Anthropic — nigdy nie trafia
          nigdzie indziej.
        </p>
        <input
          type="password"
          value={keyInput}
          onChange={(e) => setKeyInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && saveKey()}
          placeholder="sk-ant-..."
          style={{ width: "100%", marginTop: 14, background: T.inset, border: `1px solid ${T.border}`, borderRadius: 12, color: "#fff", padding: "12px 14px", fontSize: 13.5, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }}
        />
        <button
          onClick={saveKey}
          disabled={!keyInput.trim()}
          style={{ width: "100%", marginTop: 10, background: keyInput.trim() ? T.accent : T.inset, color: keyInput.trim() ? "#000" : T.faint, border: "none", borderRadius: 99, fontFamily: U, fontWeight: 700, fontSize: 14, padding: "13px 20px", cursor: keyInput.trim() ? "pointer" : "default" }}
        >
          Zapisz klucz
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      {insights.length > 0 && (
        <div className="hscroll" style={{ marginBottom: 14 }}>
          {insights.slice(0, 4).map((i) => (
            <button
              key={i.exerciseId}
              onClick={() => send(insightText(i) + " Co robimy dalej?")}
              style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 6, background: T.card, border: `1px solid ${T.accentSoftBorder}`, borderRadius: 99, padding: "8px 14px", cursor: "pointer", fontFamily: "inherit" }}
            >
              <Sparkles size={13} color={T.accent} strokeWidth={2.2} />
              <span style={{ fontSize: 11.5, fontWeight: 700, color: "#fff", whiteSpace: "nowrap" }}>{i.label}</span>
            </button>
          ))}
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {messages.map((m, i) => (
          <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start", flexDirection: m.role === "user" ? "row-reverse" : "row" }}>
            {m.role === "assistant" && (
              <span style={{ width: 28, height: 28, borderRadius: "50%", background: T.accentSoftBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Bot size={14} color={T.accent} strokeWidth={2.2} />
              </span>
            )}
            <div
              style={{
                maxWidth: "78%",
                background: m.role === "user" ? T.accent : T.card,
                color: m.role === "user" ? "#000" : "#fff",
                border: m.role === "user" ? "none" : `1px solid ${T.borderSoft}`,
                borderRadius: 16,
                padding: "10px 14px",
                fontSize: 13,
                lineHeight: 1.55,
                whiteSpace: "pre-wrap",
              }}
            >
              {m.content}
            </div>
          </div>
        ))}
        {busy && (
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <span style={{ width: 28, height: 28, borderRadius: "50%", background: T.accentSoftBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Bot size={14} color={T.accent} strokeWidth={2.2} />
            </span>
            <Loader2 size={16} color={T.sub} className="spin" />
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {error && (
        <div style={{ marginTop: 10, background: "rgba(244,63,94,0.12)", border: `1px solid rgba(244,63,94,0.3)`, borderRadius: 14, padding: "10px 14px", fontSize: 12, color: T.danger }}>
          {error}
        </div>
      )}

      <div style={{ display: "flex", gap: 8, marginTop: 16, position: "sticky", bottom: "calc(90px + env(safe-area-inset-bottom))" }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Napisz do trenera..."
          style={{ flex: 1, background: T.card2, border: `1px solid ${T.border}`, borderRadius: 99, color: "#fff", padding: "12px 16px", fontSize: 13.5, fontFamily: "inherit", outline: "none" }}
        />
        <button
          onClick={() => send()}
          disabled={busy || !input.trim()}
          style={{ width: 44, height: 44, borderRadius: "50%", background: T.accent, border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0, opacity: busy || !input.trim() ? 0.5 : 1 }}
        >
          <Send size={17} color="#000" strokeWidth={2.4} />
        </button>
      </div>

      <button onClick={changeKey} style={{ alignSelf: "center", marginTop: 14, background: "transparent", border: "none", color: T.sub, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
        Zmień klucz API
      </button>
    </div>
  );
}
