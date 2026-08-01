// Klimatyczne miniatury ćwiczeń (Unsplash, styl spójny z hero) — dobrane per ćwiczenie.
// EX_IMG (instruktażowe duotone) zostają do sekcji techniki na ekranie ćwiczenia.
import { PHOTOS } from "./photos.js";

const mods = import.meta.glob("../assets/thumb/*.jpg", { eager: true, import: "default" });
const S = Object.fromEntries(Object.entries(mods).map(([p, u]) => [p.match(/([^/]+)\.jpg$/)[1], u]));

// surowe miniatury po nazwie pliku — używa ich katalog ćwiczeń spoza planu
export const THUMB = S;

// klucz = id ćwiczenia z planu; id nie odpowiada dniowi (patrz komentarz przy
// EXERCISES_DATA w plan.js) — grupy niżej odzwierciedlają układ planu
export const EX_THUMB = {
  // Trening A — poniedziałek
  a2: PHOTOS.hero, // wyciskanie — ławka płaska (ciężka praca przy stojaku)
  c2: S["deadlift"], // martwy ciąg
  b1: S["machines"], // rozpiętki na maszynie
  b6: S["rack-woman"], // wykrok bułgarski
  a6: S["curl"], // uginanie hantli stojąc
  a7: S["rope"], // pushdown (lina)
  // Trening B — środa
  b10: S["pullup"], // podciąganie podchwytem
  c4: PHOTOS.C, // wyciskanie żołnierskie (overhead)
  b3: PHOTOS.hero, // wiosłowanie siedząc
  c5: S["dumbbells"], // unoszenie hantli bokiem
  b4: S["rope"], // face pull (lina)
  b8: S["band"], // kółko do ćwiczeń brzucha (akcesoria)
  // Trening C — piątek
  c8: S["bench"], // wyciskanie — ławka płaska (wariant objętościowy)
  b5: S["squat"], // przysiad ze sztangą
  c9: S["dumbbells"], // wyciskanie hantli — ławka skośna
  a3: S["barbell-floor"], // seal row — sztanga nisko
  b7: PHOTOS.B, // uginanie nóg leżąc (nogi/sztanga)
  c10: S["curl"], // uginanie hantli stojąc (drugi raz w tygodniu)
};
