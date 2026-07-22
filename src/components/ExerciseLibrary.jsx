import { useMemo, useState } from "react";
import { Search, X, ChevronRight, Dumbbell } from "lucide-react";
import { T } from "../theme.js";
import { EXERCISES_DATA, CAT_LABEL } from "../data/plan.js";
import { EX_THUMB } from "../data/exerciseThumbs.js";
import { EmptyState } from "./EmptyState.jsx";

const U = "'Urbanist',sans-serif";

// normalizacja do wyszukiwania: małe litery bez polskich znaków, żeby
// "cwiczenie" znajdowało "ćwiczenie" — filtr działa przy każdej literze
const norm = (s) =>
  (s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ł/g, "l");

// wszystkie ćwiczenia planu spłaszczone do jednej listy (id są unikatowe)
const ALL_EXERCISES = Object.entries(EXERCISES_DATA).flatMap(([dayKey, day]) =>
  day.exercises.map((e) => ({ ...e, dayKey, dayLabel: day.label }))
);

// Biblioteka ćwiczeń: wyszukiwarka filtrująca na żywo + chipy partii
// mięśniowych; tap otwiera ekran ćwiczenia (technika, pokaz ruchu, film).
export function ExerciseLibrary({ onOpen }) {
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState("ALL");

  const results = useMemo(() => {
    const q = norm(query.trim());
    return ALL_EXERCISES.filter((e) => {
      if (cat !== "ALL" && e.cat !== cat) return false;
      if (!q) return true;
      return norm(e.name).includes(q) || norm(CAT_LABEL[e.cat]).includes(q);
    });
  }, [query, cat]);

  const chips = [["ALL", "Wszystkie"], ...Object.entries(CAT_LABEL)];

  return (
    <div>
      {/* WYSZUKIWARKA */}
      <div className="fu" style={{ display: "flex", alignItems: "center", gap: 10, background: T.card, border: `1px solid ${T.borderSoft}`, borderRadius: 16, padding: "0 14px", marginBottom: 12 }}>
        <Search size={17} color={T.soft} strokeWidth={2.2} style={{ flexShrink: 0 }} />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Szukaj ćwiczenia…"
          autoCorrect="off"
          autoCapitalize="none"
          style={{ flex: 1, minWidth: 0, background: "transparent", border: "none", outline: "none", color: "#fff", fontFamily: U, fontSize: 14, fontWeight: 600, padding: "14px 0" }}
        />
        {query && (
          <button onClick={() => setQuery("")} aria-label="Wyczyść" style={{ width: 26, height: 26, borderRadius: 9, background: T.inset, border: "none", color: T.sub, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <X size={13} strokeWidth={2.4} />
          </button>
        )}
      </div>

      {/* CHIPY PARTII MIĘŚNIOWYCH */}
      <div className="fu hscroll" style={{ animationDelay: ".04s", marginBottom: 14 }}>
        {chips.map(([key, label]) => {
          const act = cat === key;
          return (
            <button
              key={key}
              onClick={() => setCat(key)}
              style={{ flexShrink: 0, padding: "8px 16px", borderRadius: 99, border: `1.5px solid ${act ? T.accent : T.borderSoft}`, background: act ? T.accent : T.card, color: act ? "#000" : T.light, fontFamily: U, fontWeight: 700, fontSize: 12, cursor: "pointer", transition: "all .2s", whiteSpace: "nowrap" }}
            >
              {label}
            </button>
          );
        })}
      </div>

      <div className="fu" style={{ animationDelay: ".06s", fontSize: 10.5, color: T.faint, marginBottom: 10 }}>
        {results.length} {results.length === 1 ? "ćwiczenie" : results.length < 5 && results.length > 0 ? "ćwiczenia" : "ćwiczeń"}
        {query.trim() ? ` dla „${query.trim()}"` : " w planie"}
      </div>

      {/* LISTA WYNIKÓW */}
      {results.length === 0 ? (
        <EmptyState icon={Dumbbell} title="Nic nie znaleziono" desc={`Brak ćwiczeń dla „${query.trim()}". Spróbuj innej nazwy albo zmień partię mięśniową.`} />
      ) : (
        <div className="fu" style={{ animationDelay: ".08s", background: T.card, border: `1px solid ${T.borderSoft}`, borderRadius: 20, overflow: "hidden", marginBottom: 8 }}>
          {results.map((e, i) => (
            <button
              key={e.id}
              onClick={() => onOpen(e.id)}
              style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", background: "transparent", border: "none", borderBottom: i < results.length - 1 ? `1px solid ${T.borderSoft}` : "none", cursor: "pointer", textAlign: "left", fontFamily: "inherit" }}
            >
              <span style={{ width: 52, height: 52, borderRadius: 14, overflow: "hidden", flexShrink: 0, background: T.inset }}>
                {EX_THUMB[e.id] && <img src={EX_THUMB[e.id]} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
              </span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#fff", fontFamily: U, lineHeight: 1.3 }}>{e.name}</span>
                <span style={{ display: "block", fontSize: 10.5, color: T.sub, marginTop: 3 }}>
                  <span style={{ color: e.catColor || T.accent, fontWeight: 700 }}>{CAT_LABEL[e.cat]}</span> · {e.dayLabel} · {e.sets}×{e.reps}
                </span>
              </span>
              <ChevronRight size={15} color={T.faint} strokeWidth={2.2} />
            </button>
          ))}
        </div>
      )}

      <p className="fu" style={{ animationDelay: ".1s", fontSize: 10, color: T.faint, textAlign: "center", margin: "10px 0 0" }}>
        Tap w ćwiczenie: technika krok po kroku, pokaz ruchu i film instruktażowy.
      </p>
    </div>
  );
}
