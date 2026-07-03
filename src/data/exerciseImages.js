// Zdjęcia demonstracyjne ćwiczeń (free-exercise-db, licencja Unlicense/public domain),
// zbundlowane lokalnie — klucz = id ćwiczenia z planu (a1..c7)
const mods = import.meta.glob("../assets/ex/*.jpg", { eager: true, import: "default" });

export const EX_IMG = Object.fromEntries(
  Object.entries(mods).map(([path, url]) => [path.match(/([^/]+)\.jpg$/)[1], url])
);
