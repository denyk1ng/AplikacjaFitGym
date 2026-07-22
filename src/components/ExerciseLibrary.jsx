import { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowLeft, Bookmark, Search, X, ChevronRight, Play, Plus, Dumbbell, HeartPulse, LayoutGrid, PersonStanding, Heart, Youtube } from "lucide-react";
import { T } from "../theme.js";
import { EXERCISES_DATA, CAT_LABEL } from "../data/plan.js";
import { EX_THUMB } from "../data/exerciseThumbs.js";
import { CATALOG } from "../data/exerciseCatalog.js";
import { QUICK_WORKOUTS } from "../data/quickWorkouts.js";
import { PHOTOS } from "../data/photos.js";
import { estimateWorkoutMin } from "../lib/utils.js";
import { QuickWorkoutSheet } from "./QuickWorkoutSheet.jsx";
import { EmptyState } from "./EmptyState.jsx";

const H = "'Urbanist',sans-serif";
const D = "'Doto',sans-serif";

// normalizacja do wyszukiwania: małe litery bez polskich znaków, żeby
// "cwiczenie" znajdowało "ćwiczenie" — filtr działa przy każdej literze
const norm = (s) =>
  (s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ł/g, "l");

// plan A/B/C spłaszczony (źródło "plan") + katalog zewnętrzny (źródło
// "katalog") — dwa rozłączne zbiory, katalog nie dotyka treningów A/B/C
const PLAN_LIST = Object.entries(EXERCISES_DATA).flatMap(([dayKey, day]) =>
  day.exercises.map((e) => ({ ...e, src: "plan", dayKey, dayLabel: day.label, thumb: EX_THUMB[e.id] }))
);
const ALL_LIST = [...PLAN_LIST, ...CATALOG.map((e) => ({ ...e, src: "katalog" }))];

const TYPE_CHIPS = [
  { key: "ALL", label: "Wszystkie", Icon: LayoutGrid },
  { key: "sila", label: "Siła", Icon: Dumbbell },
  { key: "cardio", label: "Cardio", Icon: HeartPulse },
  { key: "mobilnosc", label: "Mobilność", Icon: PersonStanding },
];

const loadFavs = () => {
  try {
    return JSON.parse(localStorage.getItem("fav_quick") || "[]");
  } catch (e) {
    return [];
  }
};

// Ekran "Ćwiczenia" wg projektu referencyjnego: własny nagłówek (wstecz,
// zakładka, lupa), chipy typów, duży przycisk startu, karty "Dla Ciebie" /
// "Idealne do domu" i szeroka karta "Mój plan". Lupa otwiera wyszukiwarkę
// na żywo po wszystkich ćwiczeniach (plan + katalog).
export function ExerciseLibrary({ onBack, onOpen, planDay, dayKey, onStartToday, onOpenPlan }) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState("ALL"); // partia mięśniowa (tryb wyszukiwania)
  const [typeChip, setTypeChip] = useState("ALL"); // typ mini-treningów (hub)
  const [onlyFavs, setOnlyFavs] = useState(false);
  const [favs, setFavs] = useState(loadFavs);
  const [quickSheet, setQuickSheet] = useState(null);
  const [catalogSheet, setCatalogSheet] = useState(null); // ćwiczenie z katalogu

  const toggleFav = (id) => {
    const next = favs.includes(id) ? favs.filter((f) => f !== id) : [...favs, id];
    setFavs(next);
    try {
      localStorage.setItem("fav_quick", JSON.stringify(next));
    } catch (e) {}
  };

  const results = useMemo(() => {
    const q = norm(query.trim());
    return ALL_LIST.filter((e) => {
      if (cat !== "ALL" && e.cat !== cat) return false;
      if (!q) return true;
      return norm(e.name).includes(q) || norm(CAT_LABEL[e.cat]).includes(q);
    });
  }, [query, cat]);

  const quicks = QUICK_WORKOUTS.filter((w) => (typeChip === "ALL" || w.type === typeChip) && (!onlyFavs || favs.includes(w.id)));
  const forYou = quicks.slice(0, 2);
  const forHome = quicks.filter((w) => w.home);

  const openRow = (e) => (e.src === "plan" ? onOpen(e.id) : setCatalogSheet(e));

  return (
    <div>
      {/* NAGŁÓWEK — wstecz · tytuł · zakładka · lupa */}
      <div className="fu" style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <button
          onClick={() => (searchOpen ? (setSearchOpen(false), setQuery("")) : onBack())}
          aria-label="Wstecz"
          style={{ width: 40, height: 40, borderRadius: 14, background: T.card, border: `1px solid ${T.borderSoft}`, color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
        >
          <ArrowLeft size={18} strokeWidth={2.2} />
        </button>
        <span style={{ flex: 1, fontFamily: H, fontWeight: 800, fontSize: "1.35rem", letterSpacing: "-0.01em", color: "#fff" }}>Ćwiczenia</span>
        <button
          onClick={() => setOnlyFavs(!onlyFavs)}
          title="Zapisane"
          style={{ width: 40, height: 40, borderRadius: 14, background: onlyFavs ? T.accent : T.card, border: `1px solid ${onlyFavs ? T.accent : T.borderSoft}`, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all .2s" }}
        >
          <Bookmark size={17} color={onlyFavs ? "#000" : "#fff"} fill={onlyFavs ? "#000" : "none"} strokeWidth={2.2} />
        </button>
        <button
          onClick={() => setSearchOpen(true)}
          title="Szukaj ćwiczenia"
          style={{ width: 40, height: 40, borderRadius: 14, background: searchOpen ? T.accent : T.card, border: `1px solid ${searchOpen ? T.accent : T.borderSoft}`, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all .2s" }}
        >
          <Search size={17} color={searchOpen ? "#000" : "#fff"} strokeWidth={2.2} />
        </button>
      </div>

      {searchOpen ? (
        /* ——— TRYB WYSZUKIWANIA: pole + chipy partii + wyniki na żywo ——— */
        <>
          <div className="fu" style={{ display: "flex", alignItems: "center", gap: 10, background: T.card, border: `1px solid ${T.borderSoft}`, borderRadius: 16, padding: "0 14px", marginBottom: 12 }}>
            <Search size={17} color={T.soft} strokeWidth={2.2} style={{ flexShrink: 0 }} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Szukaj ćwiczenia…"
              autoFocus
              autoCorrect="off"
              autoCapitalize="none"
              style={{ flex: 1, minWidth: 0, background: "transparent", border: "none", outline: "none", color: "#fff", fontFamily: H, fontSize: 14, fontWeight: 600, padding: "14px 0" }}
            />
            {query && (
              <button onClick={() => setQuery("")} aria-label="Wyczyść" style={{ width: 26, height: 26, borderRadius: 9, background: T.inset, border: "none", color: T.sub, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <X size={13} strokeWidth={2.4} />
              </button>
            )}
          </div>

          <div className="fu hscroll" style={{ animationDelay: ".04s", marginBottom: 14 }}>
            {[["ALL", "Wszystkie"], ...Object.entries(CAT_LABEL)].map(([key, label]) => {
              const act = cat === key;
              return (
                <button
                  key={key}
                  onClick={() => setCat(key)}
                  style={{ flexShrink: 0, padding: "8px 16px", borderRadius: 99, border: `1.5px solid ${act ? T.accent : T.borderSoft}`, background: act ? T.accent : T.card, color: act ? "#000" : T.light, fontFamily: H, fontWeight: 700, fontSize: 12, cursor: "pointer", transition: "all .2s", whiteSpace: "nowrap" }}
                >
                  {label}
                </button>
              );
            })}
          </div>

          <div className="fu" style={{ animationDelay: ".06s", fontSize: 10.5, color: T.faint, marginBottom: 10 }}>
            {results.length} {results.length === 1 ? "ćwiczenie" : results.length < 5 && results.length > 0 ? "ćwiczenia" : "ćwiczeń"}
            {query.trim() ? ` dla „${query.trim()}"` : " (plan + katalog)"}
          </div>

          {results.length === 0 ? (
            <EmptyState icon={Dumbbell} title="Nic nie znaleziono" desc={`Brak ćwiczeń dla „${query.trim()}". Spróbuj innej nazwy albo zmień partię mięśniową.`} />
          ) : (
            <div className="fu" style={{ animationDelay: ".08s", background: T.card, border: `1px solid ${T.borderSoft}`, borderRadius: 20, overflow: "hidden", marginBottom: 8 }}>
              {results.map((e, i) => (
                <button
                  key={e.id}
                  onClick={() => openRow(e)}
                  style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", background: "transparent", border: "none", borderBottom: i < results.length - 1 ? `1px solid ${T.borderSoft}` : "none", cursor: "pointer", textAlign: "left", fontFamily: "inherit" }}
                >
                  <span style={{ width: 52, height: 52, borderRadius: 14, overflow: "hidden", flexShrink: 0, background: T.inset }}>
                    {e.thumb && <img src={e.thumb} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
                  </span>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#fff", fontFamily: H, lineHeight: 1.3 }}>{e.name}</span>
                    <span style={{ display: "block", fontSize: 10.5, color: T.sub, marginTop: 3 }}>
                      <span style={{ color: e.catColor || T.accent, fontWeight: 700 }}>{CAT_LABEL[e.cat]}</span>
                      {" · "}
                      {e.src === "plan" ? `${e.dayLabel} · ${e.sets}×${e.reps}` : `${e.equip} · ${e.level}`}
                    </span>
                  </span>
                  {e.src === "plan" && (
                    <span style={{ fontSize: 8.5, fontWeight: 800, letterSpacing: ".06em", color: T.accent, border: `1px solid ${T.accentSoftBorder}`, background: T.accentSoftBg, borderRadius: 99, padding: "3px 8px", flexShrink: 0 }}>
                      PLAN
                    </span>
                  )}
                  <ChevronRight size={15} color={T.faint} strokeWidth={2.2} />
                </button>
              ))}
            </div>
          )}
        </>
      ) : (
        /* ——— HUB wg referencji ——— */
        <>
          {/* chipy typów z ikonami */}
          <div className="fu hscroll" style={{ animationDelay: ".04s", marginBottom: 14 }}>
            {TYPE_CHIPS.map(({ key, label, Icon }) => {
              const act = typeChip === key;
              return (
                <button
                  key={key}
                  onClick={() => setTypeChip(key)}
                  style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 6, padding: "9px 15px", borderRadius: 12, border: `1.5px solid ${act ? T.accent : T.borderSoft}`, background: act ? T.accent : T.card, color: act ? "#000" : T.light, fontFamily: H, fontWeight: 700, fontSize: 12, cursor: "pointer", transition: "all .2s", whiteSpace: "nowrap" }}
                >
                  <Icon size={13} strokeWidth={2.4} />
                  {label}
                </button>
              );
            })}
          </div>

          {/* duży przycisk startu jak w referencji */}
          <button
            onClick={onStartToday}
            className="fu"
            style={{ animationDelay: ".06s", width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: T.accent, color: "#000", border: "none", borderRadius: 14, fontFamily: H, fontWeight: 800, fontSize: 13.5, padding: "15px 18px", cursor: "pointer", marginBottom: 20 }}
          >
            <Plus size={16} strokeWidth={2.6} />
            Rozpocznij dzisiejszy trening
          </button>

          {/* DLA CIEBIE — dwie karty obok siebie, tekst pod zdjęciem */}
          <div className="fu" style={{ animationDelay: ".08s", display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <span style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: ".14em", textTransform: "uppercase", color: T.soft }}>Treningi dla Ciebie</span>
            <button onClick={() => setSearchOpen(true)} style={{ background: "transparent", border: "none", color: T.accent, fontSize: 11.5, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", padding: 0 }}>
              Zobacz wszystkie
            </button>
          </div>
          {forYou.length === 0 ? (
            <div className="fu" style={{ fontSize: 11.5, color: T.sub, background: T.card, border: `1px solid ${T.borderSoft}`, borderRadius: 16, padding: 14, marginBottom: 20 }}>
              {onlyFavs ? "Brak zapisanych treningów — serduszkiem na karcie dodasz je do zakładek." : "Brak treningów w tej kategorii."}
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
              {forYou.map((w, i) => (
                <div key={w.id} className="fu" onClick={() => setQuickSheet(w)} style={{ animationDelay: `${0.1 + i * 0.04}s`, cursor: "pointer" }}>
                  <div style={{ position: "relative", height: 108, borderRadius: 16, overflow: "hidden", border: `1px solid ${T.border}` }}>
                    <img src={w.photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFav(w.id);
                      }}
                      aria-label="Zapisz trening"
                      style={{ position: "absolute", top: 8, right: 8, width: 28, height: 28, borderRadius: "50%", background: "rgba(23,23,23,0.55)", backdropFilter: "blur(6px)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                    >
                      <Heart size={13} color={favs.includes(w.id) ? T.accent : "#fff"} fill={favs.includes(w.id) ? T.accent : "none"} strokeWidth={2.2} />
                    </button>
                    <span style={{ position: "absolute", left: 8, bottom: 8, background: T.accent, color: "#000", fontSize: 8.5, fontWeight: 800, letterSpacing: ".04em", padding: "3px 9px", borderRadius: 99 }}>
                      {w.level}
                    </span>
                  </div>
                  <div style={{ fontFamily: H, fontWeight: 700, fontSize: 13, color: "#fff", marginTop: 8, lineHeight: 1.25 }}>{w.title}</div>
                  <div style={{ fontSize: 10.5, color: T.sub, marginTop: 3 }}>{w.chip} · {w.meta}</div>
                </div>
              ))}
            </div>
          )}

          {/* IDEALNE DO DOMU — rząd kart z odznaką play */}
          <div className="fu" style={{ animationDelay: ".14s", display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <span style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: ".14em", textTransform: "uppercase", color: T.soft }}>Idealne do domu</span>
            <button onClick={() => setSearchOpen(true)} style={{ background: "transparent", border: "none", color: T.accent, fontSize: 11.5, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", padding: 0 }}>
              Zobacz wszystkie
            </button>
          </div>
          <div className="hscroll" style={{ marginBottom: 20 }}>
            {forHome.map((w, i) => (
              <div key={w.id} className="fu" onClick={() => setQuickSheet(w)} style={{ animationDelay: `${0.16 + i * 0.04}s`, width: 132, flexShrink: 0, cursor: "pointer" }}>
                <div style={{ position: "relative", height: 96, borderRadius: 16, overflow: "hidden", border: `1px solid ${T.border}` }}>
                  <img src={w.photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  <span style={{ position: "absolute", right: 8, bottom: 8, width: 26, height: 26, borderRadius: "50%", background: T.accent, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 3px 8px rgba(0,0,0,0.35)" }}>
                    <Play size={12} color="#000" fill="#000" strokeWidth={0} />
                  </span>
                </div>
                <div style={{ fontFamily: H, fontWeight: 700, fontSize: 12, color: "#fff", marginTop: 7, lineHeight: 1.25 }}>{w.title}</div>
                <div style={{ fontSize: 10, color: T.sub, marginTop: 2 }}>{w.chip}</div>
              </div>
            ))}
          </div>

          {/* MÓJ PLAN — szeroka karta dzisiejszego dnia */}
          <div className="fu" style={{ animationDelay: ".2s", display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <span style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: ".14em", textTransform: "uppercase", color: T.soft }}>Mój plan</span>
            <button onClick={onOpenPlan} style={{ background: "transparent", border: "none", color: T.accent, fontSize: 11.5, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", padding: 0 }}>
              Edytuj
            </button>
          </div>
          <div
            className="fu"
            onClick={onOpenPlan}
            style={{ animationDelay: ".22s", display: "flex", alignItems: "center", gap: 14, background: T.card, border: `1px solid ${T.borderSoft}`, borderRadius: 18, padding: 12, marginBottom: 8, cursor: "pointer" }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: ".12em", color: T.accent, textTransform: "uppercase" }}>
                Trening {dayKey} · {planDay.day}
              </div>
              <div style={{ fontFamily: H, fontWeight: 700, fontSize: 13.5, color: "#fff", marginTop: 5, lineHeight: 1.3, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                {planDay.exercises.slice(0, 3).map((e) => e.name.split("—")[0].trim()).join(", ")}
              </div>
              <div style={{ fontSize: 10.5, color: T.sub, marginTop: 4 }}>
                {planDay.exercises.length} ćwiczeń · ~{estimateWorkoutMin(planDay.exercises)} min
              </div>
            </div>
            <div style={{ width: 84, height: 84, borderRadius: 14, overflow: "hidden", flexShrink: 0, border: `1px solid ${T.border}` }}>
              <img src={PHOTOS[dayKey]} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
          </div>
        </>
      )}

      {/* arkusz mini-treningu (wspólny z ekranem Dom) */}
      <QuickWorkoutSheet workout={quickSheet} onClose={() => setQuickSheet(null)} />

      {/* arkusz ćwiczenia z katalogu — technika + film, bez mieszania z planem */}
      {catalogSheet &&
        createPortal(
          <div style={{ position: "fixed", inset: 0, zIndex: 1600 }}>
            <div onClick={() => setCatalogSheet(null)} style={{ position: "absolute", inset: 0, background: "rgba(23,23,23,0.7)", backdropFilter: "blur(3px)" }} />
            <div className="slideup" style={{ position: "absolute", left: 0, right: 0, bottom: 0, maxWidth: 430, margin: "0 auto", background: T.card2, borderRadius: "26px 26px 0 0", padding: "20px 20px calc(30px + env(safe-area-inset-bottom))", maxHeight: "82vh", overflowY: "auto" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ flex: 1, minWidth: 0, fontFamily: H, fontWeight: 700, fontSize: "1.15rem", color: "#fff", lineHeight: 1.25, paddingRight: 10 }}>{catalogSheet.name}</span>
                <button onClick={() => setCatalogSheet(null)} aria-label="Zamknij" style={{ width: 34, height: 34, borderRadius: 11, background: T.inset, border: "none", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <X size={16} strokeWidth={2.4} />
                </button>
              </div>
              <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginBottom: 14 }}>
                {[CAT_LABEL[catalogSheet.cat], catalogSheet.equip, catalogSheet.level].map((l) => (
                  <span key={l} style={{ background: T.card, border: `1px solid ${T.borderSoft}`, borderRadius: 99, padding: "6px 11px", fontSize: 11, fontWeight: 600, color: T.light }}>
                    {l}
                  </span>
                ))}
              </div>
              {catalogSheet.tech.map((s, i) => (
                <div key={i} style={{ display: "flex", gap: 12, marginBottom: 11 }}>
                  <span style={{ width: 24, height: 24, borderRadius: "50%", background: T.accentSoftBg, border: `1px solid ${T.accentSoftBorder}`, color: T.accent, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, fontFamily: D, flexShrink: 0, marginTop: 1 }}>
                    {i + 1}
                  </span>
                  <p style={{ fontSize: 13, color: T.light, lineHeight: 1.55, margin: 0 }}>{s}</p>
                </div>
              ))}
              <button
                onClick={() => window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(`${catalogSheet.name} technika jak robić`)}`, "_blank", "noopener")}
                style={{ width: "100%", marginTop: 10, background: "transparent", color: T.light, border: `1.5px solid ${T.border}`, borderRadius: 99, fontFamily: H, fontWeight: 700, fontSize: 13, padding: "12px 18px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
              >
                <Youtube size={16} color={T.accent} strokeWidth={2.2} />
                Film instruktażowy (YouTube)
              </button>
              <p style={{ fontSize: 10, color: T.faint, textAlign: "center", margin: "12px 0 0" }}>
                Ćwiczenie z katalogu — nie należy do planu A/B/C i nie zapisuje ciężarów.
              </p>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
