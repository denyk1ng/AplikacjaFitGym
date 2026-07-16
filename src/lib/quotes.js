// Cytat dnia na ekranie głównym — deterministyczny (ten sam przez cały dzień,
// zmienia się o północy), bez sieci i bez losowości między renderami.
const QUOTES = [
  { t: "Nie musisz być wielki, żeby zacząć. Musisz zacząć, żeby być wielki.", a: "Zig Ziglar" },
  { t: "Siła nie bierze się z wygrywania. Budują ją zmagania.", a: "Arnold Schwarzenegger" },
  { t: "Ostatnie powtórzenia budują mięśnie, o których inni marzą.", a: "Arnold Schwarzenegger" },
  { t: "Ciało osiąga to, w co wierzy umysł.", a: null },
  { t: "Nie licz dni. Spraw, żeby dni się liczyły.", a: "Muhammad Ali" },
  { t: "Dyscyplina to robienie tego, czego nie chcesz, żeby osiągnąć to, czego chcesz.", a: null },
  { t: "Jedyny zły trening to ten, który się nie odbył.", a: null },
  { t: "Nie rezygnuj z celu tylko dlatego, że jego osiągnięcie wymaga czasu. Czas i tak upłynie.", a: "Earl Nightingale" },
  { t: "Ból jest tymczasowy. Rezygnacja zostaje na zawsze.", a: "Lance Armstrong" },
  { t: "Sukces to suma małych wysiłków powtarzanych dzień po dniu.", a: "Robert Collier" },
  { t: "Twoje ciało wytrzyma prawie wszystko. To umysł trzeba przekonać.", a: null },
  { t: "Nie porównuj się z innymi. Porównuj się z sobą sprzed miesiąca.", a: null },
  { t: "Motywacja Cię uruchamia, nawyk trzyma Cię w ruchu.", a: "Jim Ryun" },
  { t: "Ciężko na treningu, lekko w życiu.", a: null },
  { t: "Najtrudniejszy ciężar do podniesienia to własne cztery litery z kanapy.", a: null },
  { t: "Rób dziś to, czego inni nie chcą — jutro będziesz mieć to, czego inni nie mają.", a: "Jerry Rice" },
  { t: "Mistrzowie nie powstają na siłowni. Powstają z czegoś, co mają w środku: pragnienia, marzenia, wizji.", a: "Muhammad Ali" },
  { t: "Nie chodzi o to, by być najlepszym. Chodzi o to, by być lepszym niż wczoraj.", a: null },
  { t: "Siła rośnie w chwilach, gdy myślisz, że nie dasz rady — a mimo to nie odpuszczasz.", a: null },
  { t: "Zawsze wydaje się niemożliwe, dopóki nie zostanie zrobione.", a: "Nelson Mandela" },
  { t: "Twoje jedyne ograniczenie to Ty sam.", a: null },
];

export function dailyQuote(ref = new Date()) {
  const day = Math.floor(ref.getTime() / (24 * 3600 * 1000));
  return QUOTES[day % QUOTES.length];
}
