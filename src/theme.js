// Motyw wizualny FORMA (TEST) — paleta: biel #FFFFFF · czerń #171717 · szarość #94978F · limonka #BCFF31
// Typografia (design system): Urbanist (UI) + Doto (liczby ekspozycyjne)
export const FONT_NUM = "'Doto',sans-serif";

export const T = {
  // tła
  bg: "#171717",
  bgGlow:
    "radial-gradient(1100px 680px at 50% -15%, rgba(188,255,49,0.08), transparent 62%), linear-gradient(180deg, #1c1c1a 0%, #141412 48%, #171717 100%)",
  card: "#1b1c19",
  card2: "#131311",
  inset: "#222320",

  // linie / obramowania
  border: "#2f302e",
  borderSoft: "#232420",
  track: "#2b2c29",

  // akcent
  accent: "#bcff31",
  accentSoftBg: "rgba(188,255,49,0.09)",
  accentSoftBorder: "rgba(188,255,49,0.3)",
  accentGlow: "0 10px 34px rgba(188,255,49,0.32)",

  // tekst
  text: "#ffffff",
  light: "#dedfd9",
  soft: "#94978f",
  sub: "#72746b",
  faint: "#4d4f49",

  // kolory funkcyjne
  ok: "#34d399",
  danger: "#f43f5e",
  blue: "#3b82f6",
  orange: "#ff8a4d",
  purple: "#a78bfa",
  yellow: "#fbbf24",

  // niebieski jako DRUGI akcent systemu (obok limonki), świadoma para:
  //   limonka  = akcja główna, wysiłek, postęp, sukces (CTA, wykresy progresu)
  //   niebieski = informacja, kontekst danych, akcje drugorzędne
  // (rozjaśniony z #2563eb do #3b82f6 — lepszy kontrast na ciemnym tle
  // i czystsze zestawienie z limonką; to nadal kolor Treningu A)
  blueSoftBg: "rgba(59,130,246,0.12)",
  blueSoftBorder: "rgba(59,130,246,0.35)",
  blueSoft: "rgba(59,130,246,0.55)",
};
