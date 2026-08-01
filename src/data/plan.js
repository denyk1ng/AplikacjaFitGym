import { T } from "../theme.js";

// etykiety partii mięśniowych (pole `cat` każdego ćwiczenia niżej) —
// współdzielone m.in. przez ExerciseDetail.jsx i StatsTab.jsx
export const CAT_LABEL = { KLATKA: "Klatka", PLECY: "Plecy", BARKI: "Barki", BICEPS: "Biceps", TRICEPS: "Triceps", NOGI: "Nogi", BRZUCH: "Brzuch" };

// Wersja planu — podbijana przy KAŻDEJ podmianie cyklu treningowego. App.jsx
// porównuje ją z `localStorage["plan_version"]` i przy różnicy czyści zapisane
// nadpisania (`plan_custom`) oraz wiszącą sesję live. Bez tego stare edycje
// ciężarów z poprzedniego cyklu przykryłyby nowe ciężary z planu.
export const PLAN_VERSION = "2026-08-cycle2";

// Prawdziwy plan treningowy — dane użytkownika (ciężary robocze, serie, powtórzenia, przerwy).
// Źródło: "12 week program — CYCLE 2" (pon./śr./pt., po 6 ćwiczeń).
//
// UWAGA — id NIE odpowiadają dniowi, w którym ćwiczenie stoi. Id jest kluczem
// historii: `plan_custom`, `progress_snapshots.weights` i rekordy życiowe w
// StatsTab są nim indeksowane, więc ćwiczenie zachowuje swoje id nawet gdy
// przeniosło się na inny dzień (np. martwy ciąg został `c2` po przejściu z C do A).
// Stąd `a2`/`c2`/`b1` w treningu A. Zasady przy kolejnej podmianie planu:
//  · ten sam ruch = to samo id (ciągłość wykresu progresu),
//  · nowy ruch = id nigdy wcześniej nieużyte (b10, c8, c9, c10) — recykling
//    starego id zaciągnąłby cudzą historię na wykres,
//  · ten sam ruch dwa razy w tygodniu = dwa różne id (a2 vs c8, a6 vs c10),
//    bo `plan_custom` trzyma jeden wpis na id, a ciężary/powtórzenia się różnią.
export const EXERCISES_DATA = {
  A: {
    label: "Trening A", color: T.blue, day: "Poniedziałek", desc: "Ciężkie boje — klatka + martwy ciąg + nogi + ramiona",
    exercises: [
      { id: "a2", cat: "KLATKA", catColor: T.danger, name: "Wyciskanie sztangi — ławka płaska", sets: 4, reps: "5", weight: 67.5, unit: "kg", rest: 180, note: "Ciężka piątka · łokcie 45°", tech: "Stopy wbite w podłogę, lekki mostek w lędźwiach. Sztanga dotyka klatki na wysokości sutków. Wyciskaj po lekkim łuku w stronę twarzy." },
      { id: "c2", cat: "PLECY", catColor: T.blue, name: "Martwy ciąg", sets: 3, reps: "4", weight: 82.5, unit: "kg", rest: 180, note: "Każde powtórzenie od nowa z podłogi", tech: "Sztanga nad środkiem stopy. Plecy proste, klatka wypchnięta. Napnij brzuch, zaciągnij biodrami — sztanga sunie blisko nóg przez cały ruch." },
      { id: "b1", cat: "KLATKA", catColor: T.danger, name: "Rozpiętki na maszynie", sets: 4, reps: "11", weight: 20, unit: "kg", rest: 90, note: "Wolno — czujesz rozciągnięcie" },
      { id: "b6", cat: "NOGI", catColor: T.orange, name: "Wykrok bułgarski z hantlami", sets: 3, reps: "8", weight: 7, unit: "kg/h", rest: 120, note: "8 powtórzeń na nogę · wąski rozstaw stóp" },
      { id: "a6", cat: "BICEPS", catColor: T.purple, name: "Uginanie hantli stojąc", sets: 3, reps: "11", weight: 12, unit: "kg", rest: 90, note: "Łokcie przy żebrach" },
      { id: "a7", cat: "TRICEPS", catColor: T.purple, name: "Ściąganie linki górnej (pushdown)", sets: 3, reps: "8", weight: 22.5, unit: "kg", rest: 90, note: "Łokcie przy ciele" },
    ],
  },
  B: {
    label: "Trening B", color: T.orange, day: "Środa", desc: "Góra ciągnąca — podciąganie + barki + plecy + brzuch",
    exercises: [
      { id: "b10", cat: "PLECY", catColor: T.blue, name: "Podciąganie podchwytem (chin-up)", sets: 3, reps: "5", weight: 5, unit: "kg", rest: 150, note: "+5 kg w pasie lub kamizelce", tech: "Chwyt podchwytem na szerokość barków, start z pełnego zwisu z napiętym brzuchem. Ciągnij łokciami do żeber, aż broda minie drążek. Opuszczaj się wolno, bez bujania." },
      { id: "c4", cat: "BARKI", catColor: T.yellow, name: "Wyciskanie żołnierskie sztangą", sets: 3, reps: "7", weight: 25, unit: "kg", rest: 150, note: "Wypchnij klatkę · łokcie przed sztangą", tech: "Sztanga na wysokości obojczyków, przedramiona pionowo. Wypchnij klatkę, napnij pośladki. Wyciskaj po prostej — głowa lekko cofa się z drogi sztangi." },
      { id: "b3", cat: "PLECY", catColor: T.blue, name: "Wiosłowanie siedząc — maszyna Atlas", sets: 4, reps: "11", weight: 47.5, unit: "kg", rest: 120, note: "Ściśnij łopatki na końcu", tech: "Klatka oparta o poduszkę, plecy proste. Ciągnij łokciami do tyłu, na końcu ruchu zatrzymaj 1 sekundę ze ściśniętymi łopatkami." },
      { id: "c5", cat: "BARKI", catColor: T.yellow, name: "Unoszenie hantli bokiem", sets: 4, reps: "10", weight: 6, unit: "kg", rest: 60, note: "Łokcie lekko ugięte" },
      { id: "b4", cat: "PLECY", catColor: T.blue, name: "Face pull z rotacją zewnętrzną", sets: 3, reps: "12", weight: 15, unit: "kg", rest: 75, note: "Łokcie w górę · obracaj nadgarstki" },
      { id: "b8", cat: "BRZUCH", catColor: T.ok, name: "Kółko do ćwiczeń brzucha (ab wheel)", sets: 3, reps: "8", weight: 0, unit: "", rest: 90, note: "Kontroluj powrót · biodra nie opadają" },
    ],
  },
  C: {
    label: "Trening C", color: T.purple, day: "Piątek", desc: "Klatka na objętości + przysiad + plecy + biceps",
    exercises: [
      { id: "c8", cat: "KLATKA", catColor: T.danger, name: "Wyciskanie sztangi — ławka płaska", sets: 4, reps: "8", weight: 60, unit: "kg", rest: 150, note: "Lżej niż w poniedziałek · pełny zakres", tech: "Stopy wbite w podłogę, lekki mostek w lędźwiach. Sztanga dotyka klatki na wysokości sutków. Wyciskaj po lekkim łuku w stronę twarzy." },
      { id: "b5", cat: "NOGI", catColor: T.orange, name: "Przysiad ze sztangą (z tyłu)", sets: 4, reps: "5", weight: 65, unit: "kg", rest: 180, note: "Kolana w kierunku palców", tech: "Sztanga na czworobocznym, łokcie pod sztangę. Biodra w dół i do tyłu, kolana podążają za palcami stóp. Zejdź minimum do równoległości ud." },
      { id: "c9", cat: "KLATKA", catColor: T.danger, name: "Wyciskanie hantli — ławka skośna", sets: 3, reps: "10", weight: 18, unit: "kg", rest: 120, note: "Po 18 kg na rękę · ławka 30–45°", tech: "Łopatki ściągnięte, stopy wbite w podłogę. Opuszczaj hantle do lekkiego rozciągnięcia klatki, nadgarstki w linii przedramion. Wyciskaj po łuku — hantle zbliżają się u góry." },
      { id: "a3", cat: "PLECY", catColor: T.blue, name: "Wiosłowanie sztangą leżąc (Seal Row)", sets: 4, reps: "7", weight: 20, unit: "kg", rest: 120, note: "Klatka przyklejona do ławki" },
      { id: "b7", cat: "NOGI", catColor: T.orange, name: "Uginanie nóg leżąc", sets: 3, reps: "10", weight: 40, unit: "kg", rest: 90, note: "" },
      { id: "c10", cat: "BICEPS", catColor: T.purple, name: "Uginanie hantli stojąc", sets: 3, reps: "11", weight: 12, unit: "kg", rest: 90, note: "Drugi raz w tygodniu — ten sam ciężar co w A" },
    ],
  },
};

// Dodatkowe zamienniki ćwiczeń (spoza planu A/B/C) — na wypadek zajętego
// sprzętu. Klucz = id ćwiczenia z planu; każdy wpis to realny ruch na tę samą
// partię, dostępny na typowej siłowni. Ciężar dobiera się na miejscu (weight
// nie jest przenoszony z oryginału — to inny ruch). Konsumowane przez arkusz
// "Zamień ćwiczenie" w LiveSession.jsx obok zamienników z samego planu.
export const EXTRA_ALTS = {
  // Trening A
  a2: [{ name: "Pompki na poręczach (dipy)", reps: "6" }, { name: "Wyciskanie na maszynie — płasko", reps: "8" }],
  c2: [{ name: "Martwy ciąg rumuński", reps: "6" }, { name: "Rack pull (z podwyższenia)", reps: "4" }],
  b1: [{ name: "Rozpiętki hantlami — ławka płaska", reps: "11" }, { name: "Krzyżowanie linek (crossover)", reps: "11" }],
  b6: [{ name: "Wykroki chodzone z hantlami", reps: "8" }, { name: "Wypychanie jednonóż na suwnicy", reps: "10" }],
  a6: [{ name: "Uginanie sztangi prostej", reps: "11" }, { name: "Uginanie linki dolnej", reps: "12" }],
  a7: [{ name: "Wyciskanie francuskie hantlem oburącz", reps: "10" }, { name: "Prostowanie linki zza głowy", reps: "10" }],
  // Trening B
  b10: [{ name: "Podciąganie bez obciążenia", reps: "max" }, { name: "Ściąganie drążka podchwytem", reps: "10" }],
  c4: [{ name: "Wyciskanie hantli stojąc", reps: "7" }, { name: "Landmine press", reps: "10" }],
  b3: [{ name: "Wiosłowanie linką siedząc", reps: "11" }, { name: "Wiosłowanie hantlą jednorącz", reps: "11" }],
  c5: [{ name: "Unoszenie linki bokiem", reps: "12" }, { name: "Unoszenie hantli bokiem siedząc", reps: "12" }],
  b4: [{ name: "Odwrotne rozpiętki na maszynie", reps: "12" }, { name: "Unoszenie hantli w opadzie tułowia", reps: "12" }],
  b8: [{ name: "Plank (deska)", reps: "45s" }, { name: "Allahy (linka górna)", reps: "12" }],
  // Trening C
  c8: [{ name: "Pompki na poręczach (dipy)", reps: "8" }, { name: "Wyciskanie na maszynie — płasko", reps: "10" }],
  b5: [{ name: "Przysiad na suwnicy Smitha", reps: "6" }, { name: "Wypychanie na suwnicy (leg press)", reps: "8" }],
  c9: [{ name: "Wyciskanie sztangi — ławka skośna", reps: "8" }, { name: "Wyciskanie na maszynie — skos", reps: "10" }],
  a3: [{ name: "Wiosłowanie hantlą jednorącz", reps: "10" }, { name: "Wiosłowanie sztangą w opadzie", reps: "8" }],
  b7: [{ name: "Uginanie nóg siedząc", reps: "10" }, { name: "Martwy ciąg rumuński z hantlami", reps: "10" }],
  c10: [{ name: "Uginanie młotkowe", reps: "11" }, { name: "Uginanie EZ na modlitewniku", reps: "10" }],
};

export const WARMUP_DATA = {
  BASE: {
    label: "Zawsze na początku", iconKey: "zap", sublabel: "Baza — każdy trening A, B i C (4–5 min)", color: T.accent,
    items: [
      { name: "Jumping jacks / bieg w miejscu", sets: "60 sekund", desc: "Dowolne — chodzi o lekkie przyspieszenie tętna." },
      { name: "Krążenia ramion — do przodu i do tyłu", sets: "10 × każdy kierunek", desc: "Powoli, pełen zakres. Rozgrzewa staw barkowy." },
      { name: "Rotacja tułowia stojąc", sets: "10 × każda strona", desc: "Stopy na szerokość bioder, ręce przed sobą — obracasz tułów. Mobilizuje kręgosłup." },
      { name: "Rozciąganie klatki przy framudze", sets: "30 sekund", desc: "Chwyć framugę na wysokości barku, wypchnij klatkę do przodu. Rozciąga przedni bark." },
    ],
  },
  // Aktywacje są dobrane pod ćwiczenia DANEGO dnia z EXERCISES_DATA — przy
  // podmianie planu trzeba je przejrzeć razem z ćwiczeniami (zwłaszcza serie
  // rozgrzewkowe, które podają konkretne kilogramy z ciężarów roboczych).
  A: {
    label: "Trening A", iconKey: "a", sublabel: "Aktywacja — klatka + lędźwie + biodra", color: T.blue,
    items: [
      { name: "Banded No Money", sets: "2 × 15", desc: "Guma między dłońmi, łokcie 90° przy ciele — rotujesz przedramiona na zewnątrz. Aktywuje rotatory barku — kluczowe przed ciężką piątką na ławce." },
      { name: "Cat-Cow (ruch kota)", sets: "10 powtórzeń wolno", desc: "Na czworakach — wdech wygięcie w dół (krowa), wydech zaokrąglenie w górę (kot). Mobilizuje kręgosłup przed martwym ciągiem." },
      { name: "Deadbug", sets: "2 × 8 każda strona", desc: "Leżysz na plecach, nogi pod 90° — opuszczasz przeciwną rękę i nogę. Aktywuje głęboki brzuch, który trzyma lędźwie w martwym ciągu." },
      { name: "Glute bridge (mostek biodrowy)", sets: "2 × 12", desc: "Leżysz na plecach, kolana ugięte — unosisz biodra i ściskasz pośladki na górze przez 1 sek. Budzi pośladki przed martwym ciągiem i bułgarskim." },
      { name: "Serie rozgrzewkowe wyciskania", sets: "2 × 8 z ok. 35 kg", desc: "Połowa ciężaru roboczego, zanim wejdziesz z 67,5 kg. Utrwala wzorzec ruchu bez zmęczenia." },
      { name: "Serie rozgrzewkowe martwego ciągu", sets: "2 × 5 z ok. 40 kg", desc: "Dwie lekkie serie przed wejściem na 82,5 kg — sprawdzasz ustawienie sztangi i pleców." },
    ],
  },
  B: {
    label: "Trening B", iconKey: "b", sublabel: "Aktywacja — plecy + barki + łopatki", color: T.orange,
    items: [
      { name: "Banded No Money", sets: "2 × 15", desc: "Rotacja zewnętrzna z gumą, łokcie przy ciele. Ważne przed wyciskaniem żołnierskim — ochrania bark." },
      { name: "YTI Raise leżąc przodem", sets: "1 × 8 każda litera", desc: "Leżysz na brzuchu, unosisz ręce w kształt Y, T, I. Bez obciążenia lub 1–2 kg. Aktywuje czworoboczny — stabilizuje łopatki przed wyciskaniem nad głowę." },
      { name: "Scapular pull-up (zwis z pracą łopatek)", sets: "2 × 5", desc: "Zwis na drążku na prostych rękach — ściągasz same łopatki w dół, łokcie zostają wyprostowane. Ustawia łopatki przed podciąganiem." },
      { name: "Banded Pull-Apart", sets: "2 × 15", desc: "Trzymasz gumę przed sobą na wyprostowanych rękach, rozciągasz poziomo. Rozgrzewa tylne barki przed face pullami i unoszeniami bokiem." },
      { name: "Podciąganie bez obciążenia", sets: "1 × 3", desc: "Trzy spokojne powtórzenia samą masą ciała, zanim dopniesz +5 kg. Sprawdzasz chwyt i pełny zakres." },
      { name: "Serie rozgrzewkowe wyciskania żołnierskiego", sets: "2 × 6 z ok. 12,5 kg", desc: "Sam gryf lub połowa ciężaru przed wejściem na 25 kg." },
    ],
  },
  C: {
    label: "Trening C", iconKey: "c", sublabel: "Aktywacja — nogi + biodra + klatka", color: T.purple,
    items: [
      { name: "Hip circle z gumą", sets: "2 × 10 w każdą stronę", desc: "Guma powyżej kolan — zakreślasz biodrem duże koła. Aktywuje pośladki i otwiera staw biodrowy. Niezbędne przed przysiadem." },
      { name: "Przysiad do ściany (wall squat)", sets: "1 × 10 wolno", desc: "Stój twarzą do ściany, stopy 15 cm od ściany — kucasz nie dotykając ściany kolanami. Wymusza prosty tułów w przysiadzie." },
      { name: "Pompki do ściany (wall push-up)", sets: "2 × 10 wolno", desc: "Ręce na ścianie, 3 sekundy w dół — 1 sek w górę. Rozgrzewa klatkę, triceps i bark przed dwoma wyciskaniami." },
      { name: "Banded Pull-Apart", sets: "2 × 15", desc: "Guma przed sobą, rozciągasz poziomo. Ściąga łopatki — przydaje się i na ławce, i w seal rowie." },
      { name: "Serie rozgrzewkowe wyciskania", sets: "2 × 8 z ok. 30 kg", desc: "Połowa ciężaru roboczego przed wejściem na 60 kg." },
      { name: "Serie rozgrzewkowe przysiadu", sets: "2 × 5 z ok. 32,5 kg", desc: "Dwie serie z połową ciężaru zanim wejdziesz z 65 kg." },
    ],
  },
};

export const BADGES = [
  { id: "first", label: "Pierwszy zapis", need: "Zapisz ciężary 1 raz" },
  { id: "s3", label: "Seria 3 tyg.", need: "3 tygodnie z rzędu z treningiem" },
  { id: "g5", label: "+5 kg łącznie", need: "Łączny przyrost 5 kg" },
  { id: "n10", label: "10 zapisów", need: "Zapisz ciężary 10 razy" },
  { id: "g15", label: "+15 kg łącznie", need: "Łączny przyrost 15 kg" },
  { id: "s6", label: "Seria 6 tyg.", need: "6 tygodni z rzędu z treningiem" },
  { id: "s12", label: "Seria 12 tyg.", need: "12 tygodni z rzędu z treningiem" },
  { id: "sessions25", label: "25 sesji", need: "Ukończ 25 treningów na żywo" },
  { id: "sessions50", label: "50 sesji", need: "Ukończ 50 treningów na żywo" },
  { id: "vol10k", label: "10 000 kg", need: "Łączna objętość 10 000 kg ze wszystkich sesji" },
  { id: "perfectMonth", label: "Miesiąc kompletny", need: "4 tygodnie z rzędu z kompletem A·B·C" },
  { id: "nightOwl", label: "Nocna sowa", need: "Trening zaliczony po 21:00" },
];
