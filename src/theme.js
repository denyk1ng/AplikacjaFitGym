// Motyw wizualny FORMA — paleta: biel #FCFCFC · czerń #0F1012 · szarość #7C7C74 ·
// limonka #B2EE37 (akcent) · zieleń #58F670 (dodatkowy, → T.ok/sukces)
// Typografia (design system): Urbanist (UI) + Doto (liczby ekspozycyjne)
export const FONT_NUM = "'Doto',sans-serif";

export const T = {
  // tła
  bg: "#0f1012",
  bgGlow:
    "radial-gradient(1100px 680px at 50% -15%, rgba(178,238,55,0.08), transparent 62%), linear-gradient(180deg, #141517 0%, #0d0e0f 48%, #0f1012 100%)",
  card: "#131415",
  card2: "#0b0c0c",
  inset: "#1a1c1b",

  // linie / obramowania
  border: "#272929",
  borderSoft: "#1b1d1b",
  track: "#232524",

  // akcent — bez poświat: cienie na przyciskach zostają neutralne/czarne,
  // nie kolorowe (patrz też T.accentGlow)
  accent: "#b2ee37",
  accentSoftBg: "rgba(178,238,55,0.09)",
  accentSoftBorder: "rgba(178,238,55,0.3)",
  accentGlow: "0 6px 16px rgba(0,0,0,0.35)",

  // tekst
  text: "#fcfcfc",
  light: "#dbdcd6",
  soft: "#7c7c74",
  sub: "#5a5a50",
  faint: "#35342e",

  // kolory funkcyjne — ok/sukces to oficjalny "dodatkowy" zielony z palety;
  // blue/orange/purple/danger/yellow to day-color-coding i stany, poza
  // zablokowaną paletą (patrz CLAUDE.md)
  ok: "#58f670",
  danger: "#f43f5e",
  blue: "#2563eb",
  orange: "#ff8a4d",
  purple: "#a78bfa",
  yellow: "#fbbf24",
};
