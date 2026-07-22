import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Quote, Bookmark, Check } from "lucide-react";
import { T } from "../theme.js";
import { dailyQuote } from "../lib/quotes.js";

const TYPE_MS = 3400; // czas "pisania" całego cytatu
const HOLD_MS = 2600; // ile wisi po dopisaniu, zanim sam przejdzie do sesji

// Pełnoekranowe intro przed startem sesji: dzisiejszy cytat pisze się znak po
// znaku na czarnym tle, potem wjeżdża autor z rokiem. "Pomiń" przechodzi od
// razu do treningu, "Zapisz cytat" odkłada go do localStorage["fav_quotes"]
// (lista do wglądu w Profilu). Tap w treść dopisuje cytat natychmiast.
export function QuoteIntro({ onDone }) {
  const [quote] = useState(() => dailyQuote());
  const [chars, setChars] = useState(0);
  const [saved, setSaved] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const doneRef = useRef(false);

  const total = quote.t.length;
  const typed = chars >= total;

  useEffect(() => {
    const step = Math.max(TYPE_MS / total, 14);
    const iv = setInterval(() => setChars((c) => Math.min(c + 1, total)), step);
    return () => clearInterval(iv);
  }, [total]);

  const finish = () => {
    if (doneRef.current) return;
    doneRef.current = true;
    setLeaving(true);
    setTimeout(onDone, 320);
  };

  // auto-przejście po dopisaniu; po zapisie dajemy chwilę więcej na czytanie
  useEffect(() => {
    if (!typed) return;
    const t = setTimeout(finish, saved ? HOLD_MS + 1600 : HOLD_MS);
    return () => clearTimeout(t);
  }, [typed, saved]);

  const saveQuote = () => {
    try {
      const list = JSON.parse(localStorage.getItem("fav_quotes") || "[]");
      if (!list.some((q) => q.t === quote.t)) list.push({ ...quote, ts: Date.now() });
      localStorage.setItem("fav_quotes", JSON.stringify(list));
    } catch (e) {}
    setSaved(true);
  };

  return createPortal(
    <div
      onClick={() => (typed ? finish() : setChars(total))}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 2000,
        background: "#0b0b0a",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "0 32px",
        opacity: leaving ? 0 : 1,
        transition: "opacity .3s ease",
      }}
    >
      <Quote size={26} color={T.accent} fill={T.accent} strokeWidth={0} style={{ transform: "rotate(180deg)", marginBottom: 24 }} />
      <div style={{ maxWidth: 340, fontFamily: "'Urbanist',sans-serif", fontStyle: "italic", fontWeight: 600, fontSize: "1.3rem", lineHeight: 1.55, color: "#fff", textAlign: "center" }}>
        {quote.t.slice(0, chars)}
        <span
          aria-hidden
          style={{ display: "inline-block", width: 2, height: "1em", background: T.accent, marginLeft: 3, verticalAlign: "-0.15em", opacity: typed ? 0 : 1, animation: "caretBlink 0.9s steps(1) infinite" }}
        />
      </div>
      <div style={{ marginTop: 18, fontSize: 13, fontWeight: 600, color: T.soft, opacity: typed ? 1 : 0, transform: typed ? "none" : "translateY(6px)", transition: "opacity .5s ease, transform .5s ease" }}>
        ~ {quote.a || "autor nieznany"}
        {quote.y ? `, ${quote.y}` : ""}
      </div>

      <div
        onClick={(e) => e.stopPropagation()}
        style={{ position: "absolute", left: 0, right: 0, bottom: "calc(30px + env(safe-area-inset-bottom))", display: "flex", justifyContent: "center", gap: 10, padding: "0 32px" }}
      >
        <button
          onClick={saveQuote}
          disabled={saved}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 7,
            padding: "12px 20px",
            borderRadius: 99,
            background: saved ? "rgba(188,255,49,0.12)" : "transparent",
            border: `1.5px solid ${saved ? T.accent : "rgba(255,255,255,0.22)"}`,
            color: saved ? T.accent : "#fff",
            fontFamily: "'Urbanist',sans-serif",
            fontWeight: 700,
            fontSize: 12.5,
            cursor: saved ? "default" : "pointer",
            transition: "all .25s",
          }}
        >
          {saved ? <Check size={14} strokeWidth={2.6} /> : <Bookmark size={14} strokeWidth={2.2} />}
          {saved ? "Zapisano" : "Zapisz cytat"}
        </button>
        <button
          onClick={finish}
          style={{ padding: "12px 24px", borderRadius: 99, background: T.accent, border: "none", color: "#000", fontFamily: "'Urbanist',sans-serif", fontWeight: 800, fontSize: 12.5, cursor: "pointer" }}
        >
          Pomiń
        </button>
      </div>
    </div>,
    document.body
  );
}
