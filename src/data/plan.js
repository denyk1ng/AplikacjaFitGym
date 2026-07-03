import { T } from "../theme.js";

// Prawdziwy plan treningowy — dane użytkownika (ciężary robocze, serie, powtórzenia, przerwy)
export const EXERCISES_DATA = {
  A: {
    label: "Trening A", color: T.blue, day: "Poniedziałek", desc: "Klatka (priorytet) + Plecy + Barki + Ramiona",
    exercises: [
      { id: "a1", cat: "KLATKA", catColor: T.danger, name: "Wyciskanie sztangi — ławka skośna", sets: 4, reps: "8 +amrap", weight: 45, unit: "kg", rest: 180, note: "Chwyt na szerokość barków · łokcie 45°", tech: "Łopatki ściągnięte i dociśnięte do ławki. Sztanga schodzi do górnej części klatki, łokcie pod kątem 45°. Nie odbijaj od klatki." },
      { id: "a2", cat: "KLATKA", catColor: T.danger, name: "Wyciskanie sztangi — ławka płaska", sets: 4, reps: "8", weight: 65, unit: "kg", rest: 180, note: "Pełny zakres · łokcie 45°", tech: "Stopy wbite w podłogę, lekki mostek w lędźwiach. Sztanga dotyka klatki na wysokości sutków. Wyciskaj po lekkim łuku w stronę twarzy." },
      { id: "a3", cat: "PLECY", catColor: T.blue, name: "Wiosłowanie sztangą leżąc (Seal Row)", sets: 4, reps: "8 +amrap", weight: 37.5, unit: "kg", rest: 90, note: "" },
      { id: "a4", cat: "PLECY", catColor: T.blue, name: "Ściąganie drążka szerokim chwytem", sets: 4, reps: "8", weight: 52, unit: "kg", rest: 90, note: "Łokcie w dół i do tyłu" },
      { id: "a5", cat: "BARKI", catColor: T.yellow, name: "Wyciskanie hantli nad głowę siedząc", sets: 8, reps: "8", weight: 17.5, unit: "kg", rest: 90, note: "" },
      { id: "a6", cat: "BICEPS", catColor: T.purple, name: "Uginanie hantli stojąc", sets: 3, reps: "10", weight: 14, unit: "kg", rest: 90, note: "" },
      { id: "a7", cat: "TRICEPS", catColor: T.purple, name: "Ściąganie linki górnej (pushdown)", sets: 3, reps: "12", weight: 20, unit: "kg", rest: 90, note: "Łokcie przy ciele" },
    ],
  },
  B: {
    label: "Trening B", color: T.orange, day: "Środa", desc: "Klatka (lżej) + Plecy + Nogi + Brzuch",
    exercises: [
      { id: "b1", cat: "KLATKA", catColor: T.danger, name: "Rozpiętki na maszynie", sets: 3, reps: "12", weight: 20, unit: "kg", rest: 120, note: "Wolno — czujesz rozciągnięcie" },
      { id: "b2", cat: "KLATKA", catColor: T.danger, name: "Wyciskanie hantli — ławka płaska", sets: 2, reps: "12", weight: 20, unit: "kg", rest: 120, note: "Lżejszy dzień" },
      { id: "b3", cat: "PLECY", catColor: T.blue, name: "Wiosłowanie siedząc — maszyna Atlas", sets: 4, reps: "10", weight: 40, unit: "kg", rest: 120, note: "Ściśnij łopatki na końcu", tech: "Klatka oparta o poduszkę, plecy proste. Ciągnij łokciami do tyłu, na końcu ruchu zatrzymaj 1 sekundę ze ściśniętymi łopatkami." },
      { id: "b4", cat: "PLECY", catColor: T.blue, name: "Face pull z rotacją zewnętrzną", sets: 3, reps: "12", weight: 15, unit: "kg", rest: 120, note: "Łokcie w górę · obracaj nadgarstki" },
      { id: "b5", cat: "NOGI", catColor: T.orange, name: "Przysiad ze sztangą (z tyłu)", sets: 4, reps: "6", weight: 67.5, unit: "kg", rest: 150, note: "Kolana w kierunku palców", tech: "Sztanga na czworobocznym, łokcie pod sztangę. Biodra w dół i do tyłu, kolana podążają za palcami stóp. Zejdź minimum do równoległości ud." },
      { id: "b6", cat: "NOGI", catColor: T.orange, name: "Wykrok bułgarski z hantlami", sets: 3, reps: "8", weight: 7, unit: "kg/h", rest: 90, note: "Wąski rozstaw stóp" },
      { id: "b7", cat: "NOGI", catColor: T.orange, name: "Uginanie nóg leżąc", sets: 3, reps: "10", weight: 45, unit: "kg", rest: 90, note: "" },
      { id: "b8", cat: "BRZUCH", catColor: T.ok, name: "Kółko do ćwiczeń brzucha z gumą", sets: 3, reps: "8", weight: 0, unit: "", rest: 90, note: "Kontroluj powrót" },
      { id: "b9", cat: "BRZUCH", catColor: T.ok, name: "Mountain climbers", sets: 3, reps: "30s", weight: 0, unit: "", rest: 45, note: "" },
    ],
  },
  C: {
    label: "Trening C", color: T.purple, day: "Piątek", desc: "Klatka (uzupeł.) + Plecy + Barki + Ramiona",
    exercises: [
      { id: "c1", cat: "KLATKA", catColor: T.danger, name: "Rozpiętki na maszynie", sets: 3, reps: "12", weight: 22.5, unit: "kg", rest: 120, note: "Skupiasz się na skurczu" },
      { id: "c2", cat: "PLECY", catColor: T.blue, name: "Martwy ciąg", sets: 4, reps: "6", weight: 80, unit: "kg", rest: 180, note: "", tech: "Sztanga nad środkiem stopy. Plecy proste, klatka wypchnięta. Napnij brzuch, zaciągnij biodrami — sztanga sunie blisko nóg przez cały ruch." },
      { id: "c3", cat: "PLECY", catColor: T.blue, name: "Ściąganie drążka klęcząc (wąski chwyt)", sets: 3, reps: "10", weight: 20, unit: "kg", rest: 75, note: "" },
      { id: "c4", cat: "BARKI", catColor: T.yellow, name: "Wyciskanie żołnierskie sztangą", sets: 4, reps: "6", weight: 24, unit: "kg", rest: 120, note: "Wypchnij klatkę · łokcie przed sztangą", tech: "Sztanga na wysokości obojczyków, przedramiona pionowo. Wypchnij klatkę, napnij pośladki. Wyciskaj po prostej — głowa lekko cofa się z drogi sztangi." },
      { id: "c5", cat: "BARKI", catColor: T.yellow, name: "Unoszenie hantli bokiem", sets: 4, reps: "12", weight: 6, unit: "kg", rest: 60, note: "Łokcie lekko ugięte" },
      { id: "c6", cat: "BICEPS", catColor: T.purple, name: "Uginanie EZ na modlitewniku", sets: 3, reps: "10", weight: 8.75, unit: "kg/str", rest: 120, note: "Czysty ruch bicepsa" },
      { id: "c7", cat: "TRICEPS", catColor: T.purple, name: "Ściąganie linki górnej (pushdown)", sets: 3, reps: "12", weight: 20, unit: "kg", rest: 90, note: "Łokcie przy ciele" },
    ],
  },
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
  A: {
    label: "Trening A", iconKey: "a", sublabel: "Aktywacja — klatka + plecy + ramiona", color: T.blue,
    items: [
      { name: "Banded No Money", sets: "2 × 15", desc: "Guma między dłońmi, łokcie 90° przy ciele — rotujesz przedramiona na zewnątrz. Aktywuje rotatory barku — kluczowe przed wyciskaniem." },
      { name: "Banded Pull-Apart", sets: "2 × 15", desc: "Trzymasz gumę przed sobą na wyprostowanych rękach, rozciągasz poziomo. Aktywuje tylne barki i ściąga łopatki." },
      { name: "Pompki do ściany (wall push-up)", sets: "2 × 10 wolno", desc: "Ręce na ścianie, 3 sekundy w dół — 1 sek w górę. Rozgrzewa klatkę, triceps i bark." },
      { name: "Serie rozgrzewkowe wyciskania", sets: "2 × 8 z 50% ciężaru", desc: "Zanim wejdziesz z 45 kg — zrób 2 serie z ok. 22 kg. Utrwala wzorzec ruchu." },
    ],
  },
  B: {
    label: "Trening B", iconKey: "b", sublabel: "Aktywacja — nogi + biodra + brzuch", color: T.orange,
    items: [
      { name: "Hip circle z gumą", sets: "2 × 10 w każdą stronę", desc: "Guma powyżej kolan — zakreślasz biodrem duże koła. Aktywuje pośladki i otwiera staw biodrowy. Niezbędne przed przysiadem." },
      { name: "Glute bridge (mostek biodrowy)", sets: "2 × 12", desc: "Leżysz na plecach, kolana ugięte — unosisz biodra i ściskasz pośladki na górze przez 1 sek." },
      { name: "Wykrok z rotacją tułowia", sets: "2 × 8 każda noga", desc: "Wykrok do przodu — obracasz tułów w stronę nogi przedniej. Rozgrzewa biodra i kręgosłup." },
      { name: "Przysiad do ściany (wall squat)", sets: "1 × 10 wolno", desc: "Stój twarzą do ściany, stopy 15 cm od ściany — kucasz nie dotykając ściany kolanami." },
      { name: "Serie rozgrzewkowe przysiadu", sets: "2 × 5 z 50% ciężaru", desc: "2 serie z ok. 35 kg zanim wejdziesz z 67,5 kg." },
    ],
  },
  C: {
    label: "Trening C", iconKey: "c", sublabel: "Aktywacja — barki + plecy góra + lędźwie", color: T.purple,
    items: [
      { name: "YTI Raise leżąc przodem", sets: "1 × 8 każda litera", desc: "Leżysz na brzuchu, unosisz ręce w kształt Y, T, I. Bez obciążenia lub 1–2 kg. Aktywuje czworoboczny — stabilizuje łopatki przed military press." },
      { name: "Banded No Money", sets: "2 × 15", desc: "Rotacja zewnętrzna z gumą, łokcie przy ciele. Ważne przed military press — ochrania bark." },
      { name: "Cat-Cow (ruch kota)", sets: "10 powtórzeń wolno", desc: "Na czworakach — wdech wygięcie w dół (krowa), wydech zaokrąglenie w górę (kot). Mobilizuje kręgosłup przed martwym ciągiem." },
      { name: "Deadbug", sets: "2 × 8 każda strona", desc: "Leżysz na plecach, nogi pod 90° — opuszczasz przeciwną rękę i nogę. Aktywuje głęboki brzuch przed martwym ciągiem." },
      { name: "Serie rozgrzewkowe martwego ciągu", sets: "2 × 5 z 40 kg", desc: "2 serie z połową ciężaru zanim wejdziesz z 80 kg." },
    ],
  },
};

export const BADGES = [
  { id: "first", icon: "🎯", label: "Pierwszy zapis", need: "Zapisz ciężary 1 raz" },
  { id: "s3", icon: "🔥", label: "Seria 3 tyg.", need: "3 tygodnie z rzędu z zapisem" },
  { id: "g5", icon: "💪", label: "+5 kg łącznie", need: "Łączny przyrost 5 kg" },
  { id: "n10", icon: "🏋️", label: "10 zapisów", need: "Zapisz ciężary 10 razy" },
  { id: "g15", icon: "📈", label: "+15 kg łącznie", need: "Łączny przyrost 15 kg" },
  { id: "s6", icon: "👑", label: "Seria 6 tyg.", need: "6 tygodni z rzędu z zapisem" },
];
