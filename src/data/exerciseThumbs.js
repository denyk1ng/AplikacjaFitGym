// Klimatyczne miniatury ćwiczeń (Unsplash, styl spójny z hero) — dobrane per ćwiczenie.
// EX_IMG (instruktażowe duotone) zostają do sekcji techniki na ekranie ćwiczenia.
import { PHOTOS } from "./photos.js";

const mods = import.meta.glob("../assets/thumb/*.jpg", { eager: true, import: "default" });
const S = Object.fromEntries(Object.entries(mods).map(([p, u]) => [p.match(/([^/]+)\.jpg$/)[1], u]));

export const EX_THUMB = {
  // Trening A
  a1: S["bench"], // wyciskanie — ławka skośna
  a2: PHOTOS.hero, // wyciskanie — ławka płaska (ciężka praca przy stojaku)
  a3: S["barbell-floor"], // seal row — sztanga nisko
  a4: S["pullup"], // ściąganie drążka szerokim (szeroki chwyt nad głową)
  a5: PHOTOS.C, // wyciskanie hantli nad głowę (overhead press)
  a6: S["curl"], // uginanie hantli
  a7: S["rope"], // pushdown (lina)
  // Trening B
  b1: S["machines"], // rozpiętki na maszynie
  b2: S["dumbbells"], // wyciskanie hantli — ławka płaska
  b3: PHOTOS.hero, // wiosłowanie siedząc
  b4: S["rope"], // face pull (lina)
  b5: S["squat"], // przysiad ze sztangą
  b6: S["rack-woman"], // wykrok bułgarski
  b7: PHOTOS.B, // uginanie nóg leżąc (nogi/sztanga)
  b8: S["band"], // kółko z gumą (akcesoria z gumą)
  b9: S["ropes-cardio"], // mountain climbers (dynamika)
  // Trening C
  c1: S["machines"], // rozpiętki na maszynie
  c2: S["deadlift"], // martwy ciąg
  c3: S["pullup"], // ściąganie drążka wąskim
  c4: PHOTOS.C, // wyciskanie żołnierskie (overhead)
  c5: S["dumbbells"], // unoszenie hantli bokiem
  c6: S["curl"], // uginanie EZ na modlitewniku
  c7: S["rope"], // pushdown (lina)
};
