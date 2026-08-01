// Zdjęcia demonstracyjne ćwiczeń (free-exercise-db, licencja Unlicense/public domain),
// zbundlowane lokalnie — klucz = id ćwiczenia z planu (a1..c7)
const mods = import.meta.glob("../assets/ex/*.jpg", { eager: true, import: "default" });

export const EX_IMG = Object.fromEntries(
  Object.entries(mods).map(([path, url]) => [path.match(/([^/]+)\.jpg$/)[1], url])
);

// Ten sam ruch w dwóch dniach ma dwa id (osobna historia ciężarów), ale to
// wciąż jedno ćwiczenie — dzieli zdjęcia z oryginałem zamiast dublować pliki.
const ALIAS = { c8: "a2", c10: "a6" };
Object.entries(ALIAS).forEach(([to, from]) => {
  EX_IMG[to] = EX_IMG[from];
  EX_IMG[`${to}-2`] = EX_IMG[`${from}-2`];
});
