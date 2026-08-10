// Zdjęcia ćwiczeń (Unsplash, licencja Unsplash — użycie komercyjne bez
// atrybucji), zbundlowane lokalnie — klucz = id ćwiczenia z planu.
//
// JEDNO zdjęcie na ćwiczenie, kadr 3:2 (900×600), w kolorze i w klimacie
// zdjęć startu treningu. Wcześniej leżały tu instruktażowe klatki z
// free-exercise-db: szare, na tle pustej siłowni, po dwie na ruch
// (`{id}.jpg` + `{id}-2.jpg`) przenikające się animacją "pokaz ruchu".
// Animacja została usunięta, a zdjęcia wymienione na takie, które pokazują
// ten sam ruch, ale wyglądają jak reszta aplikacji.
//
// Każde id ma własny plik — również c8 i c10, czyli wyciskanie i uginanie
// hantli powtórzone w drugim dniu; wcześniej dzieliły plik z a2/a6 przez mapę
// ALIAS, teraz dostają inne ujęcie tego samego ruchu, żeby dwa dni tygodnia
// nie wyglądały identycznie.
const mods = import.meta.glob("../assets/ex/*.jpg", { eager: true, import: "default" });

export const EX_IMG = Object.fromEntries(
  Object.entries(mods).map(([path, url]) => [path.match(/([^/]+)\.jpg$/)[1], url])
);
