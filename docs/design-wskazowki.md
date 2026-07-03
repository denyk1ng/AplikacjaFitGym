# Wskazówki projektowe (design process) — do wdrożenia

Źródło: plansze design process dostarczone przez właściciela projektu (proces w stylu
Empathize → Define → Ideate → Prototype → Test, case study aplikacji fitness w palecie
czerń `#060910` + pomarańcz `#FF4D00` — zgodnej z naszą obecną).

## 1. Persona / problemy użytkownika (Empathize)

**Frustracje:**
- nie wie, co robić na siłowni
- nie jest pewien, czy ćwiczy poprawną techniką
- boi się kontuzji
- zaczyna mocno, po kilku tygodniach odpuszcza

**Cele:**
- zbudować mięśnie i pewność siebie
- wiedzieć dokładnie, co robić każdego dnia
- utrzymać systematyczność, nie rzucać

**Potrzeby:**
- prosty, gotowy plan ✅ *(mamy: plan A/B/C)*
- prowadzenie krok po kroku dla początkującego ⚠️ *(mamy technikę tekstem — do rozbudowy na kroki)*
- przypomnienia i serie (streaks), żeby nie odpuścić ✅ *(mamy: kalendarz tygodnia, zaległe treningi, seria tygodni)*
- widoczny realny progres ✅ *(mamy: statystyki ciężarów, wykresy, waga ciała)*

**Empathy map (Say / Think / Does / Feels):** „nie wiem co robić na siłowni",
„czy robię to dobrze?", „zapłaciłem za siłownię i nie widzę efektów" → aplikacja ma
dawać: gotowy plan, przypomnienia + streaki, śledzenie progresu i poczucie
„w końcu wiem dokładnie, co robić, gdy wchodzę na siłownię".

## 2. Pomysły kluczowe (Brainstorming)

1. **Wyzwanie 30 dni dla początkującego** (30-day beginner challenge) — do wdrożenia
2. **Odznaki osiągnięć + poziomy** (achievement badges + levels) — częściowo mamy
   odznaki; do rozbudowy o poziomy/XP
3. **Instrukcje ćwiczeń krok po kroku / wideo** — mamy notatki techniczne; do
   rozbudowy na numerowane kroki (ew. linki do wideo)

## 3. User flow (docelowy przepływ ekranów)

```
Splash Screen → Welcome → [Log in | Sign up]
Sign up → Onboarding → Building Plan → Plan Ready → Home
Home → Workout | Community | Profile
Profile → Edit Profile | Progress | Settings | My Post
```

**Mapowanie na naszą aplikację (stan obecny):**

| Ekran z flow      | U nas                                    | Status |
|-------------------|------------------------------------------|--------|
| Splash Screen     | brak                                     | do zrobienia |
| Welcome           | Onboarding (zdjęcie + „Zaczynamy")       | ✅ jest, do rozbudowy |
| Log in / Sign up  | brak (dane lokalnie, bez kont)           | opcjonalne — wymaga backendu |
| Onboarding (dane) | brak (imię tylko w profilu)              | do zrobienia: imię, wzrost, waga, cel |
| Building Plan     | brak                                     | do zrobienia (ekran „buduję Twój plan…") |
| Plan Ready        | brak                                     | do zrobienia |
| Home              | Dom                                      | ✅ |
| Workout           | Trening (A/B/C + rozgrzewka + timer)     | ✅ |
| Community         | brak                                     | później — wymaga backendu |
| Profile           | Profil (waga, BMI, cel, gauge)           | ✅ |
| Edit Profile      | częściowo (imię, wzrost, cel wagi)       | do rozbudowy |
| Progress          | Statystyki                               | ✅ |
| Settings          | brak                                     | do zrobienia (reset danych itd.) |
| My Post           | brak                                     | później — razem z Community |

## 4. System projektowy (design system)

### Siatka (grid)
- Ekran referencyjny: **430 px** szerokości (duże telefony)
- **4 kolumny**, marginesy boczne **18 px**, odstęp między kolumnami (gutter) **16 px**
- Karty, przyciski i listy dopinają się do tej samej siatki — spójne odstępy na każdym ekranie

### Typografia
- **Urbanist** — font główny (UI, nagłówki, teksty)
  - H1: Semi Bold, 24 px, line-height 150%, letter-spacing +2%
- **Doto** — font ekspozycyjny (cyfrowo-kropkowany, "matrycowy") do LICZB
  - H1: Bold, 32 px, line-height 150%, letter-spacing −1%
  - zastosowanie: duże wartości liczbowe w statystykach (serie, objętość, czas — np. "06", "18", "45 min")
- Oba fonty dostępne na Google Fonts → do podmiany: Urbanist zamiast DM Sans/Space Grotesk,
  Doto dla liczb w kafelkach statystyk i timerze

### Komponenty (wzorce z planszy COMPONENT)
- **Dolny pasek nawigacji**: ciemna pastylka, ikony w kółkach, pomarańczowy okrągły FAB "+"
  z wgłębieniem — ✅ już wdrożony u nas 1:1
- **Przyciski strzałek**: kwadratowe, zaokrąglone, ciemne tło / kontur
- **Wiersz ćwiczenia (lista)**: miniatura zdjęcia po lewej, nazwa, metadane
  "3 SETS · 10 REPS · 40 KG" drobnym drukiem, po prawej okrągły przycisk serca (ulubione)
- **Pasek statystyk treningu**: 3 segmenty w jednej karcie — Sets / Volume / Time,
  pomarańczowe mini-ikony, liczby fontem **Doto**, podpisy szare pod spodem
- **Przyciski CTA "Continue"**: pomarańczowa pełna pastylka (biały/czarny tekst) +
  wariant ciemny z konturem; ikonki po bokach
- **Toggle/przełącznik**: pastylka, aktywny pomarańczowy z białą kropką
- **Karta posta Community**: avatar + nazwa + "Completed Lower body · 2h", zdjęcie,
  pasek reakcji (serce/komentarz/udostępnij/zakładka), licznik polubień — *na później (backend)*

### Panel analityczny (desktop)
Plansza dashboardu (Active users, Workout completion %, Engagement radar, Workouts logged,
Subscription plans) to inspiracja pod **wersję webową/admin** — poza zakresem aplikacji
mobilnej na teraz; wykres "Workout completion" z procentem w ringu można przenieść do
statystyk w aplikacji.

## 5. Ekrany wzorcowe (screeny aplikacji Fuerza)

### Progress tracking (statystyki)
- Duży ring z procentem (np. "Volume 54%" — liczba fontem Doto w środku ringu)
- Kafelki metryk: Sets (802), Exercises (54) — wartości Doto, podpisy szare
- Wykres słupkowy "Workout volume" (pionowe słupki, aktywny pomarańczowy)

### Daily Progress (ekran główny)
- Karta "Daily Progress": wielka liczba **84** (Doto) + "+2%" + pasek postępu pomarańczowy
- Sekcja "Today's workout": karty ze zdjęciami obok siebie
- Lista "Recent workout" pod spodem

### ⭐ Ekran szczegółów treningu — POTWIERDZONY DO WDROŻENIA
(właściciel: "super opcja, wygląda fenomenalnie")
- Hero: zdjęcie na górze (ok. 40% wysokości), strzałka wstecz i zakładka w rogach
- Tytuł: "Upper body – Day 1" (część po myślniku pomarańczowa) + podtytuł
  "Push & pull focus · Chest, shoulders, back"
- **Pasek statystyk**: 3 segmenty — Sets 06 / Volume 18 / Time 45min — ikony
  pomarańczowe, liczby fontem **Doto**, podpisy Exercises / Total sets / Duration
- Sekcja "EXERCISES" (+ licznik "6 total"): wiersze ćwiczeń — miniatura zdjęcia,
  nazwa, metadane "3 SETS · 10 REPS · 40 KG", serce (ulubione) po prawej
- Przyklejony na dole pomarańczowy przycisk **Continue** (pełna pastylka)
- Mapowanie na nas: nowy widok dnia treningowego (A/B/C) — hero zdjęcie,
  pasek Serie/Objętość/Czas liczony z planu, lista ćwiczeń w tym wzorcu

### ⭐ Splash screen + NOWE LOGO — POTWIERDZONE DO ZROBIENIA
- Splash: czysta czerń, wyśrodkowany pomarańczowy znak logo, nic więcej
- Logo wzorcowe (Fuerza): abstrakcyjny, geometryczny znak z ostrych trójkątów,
  dynamiczny (sugeruje ruch/sylwetkę sprintera), jednokolorowy pomarańcz #FF4D00
- Zadanie: zaprojektować WŁASNY znak FORMA w tym stylu (SVG) — ostre kąty,
  geometria, ruch; do użycia w splash, headerze i jako ikona aplikacji

### Intro carousel (po splashu)
- 3 slajdy sprzedające obietnicę aplikacji: zdjęcie na pełen ekran, ciemny gradient,
  duży tytuł (np. "Build streaks, not excuses"), drobny opis, kropki postępu,
  pomarańczowy przycisk "Next"
- Nasze hasła do slajdów (propozycja): "Wiesz dokładnie, co robić", 
  "Buduj serie, nie wymówki", "Zobacz realny progres"

### Kreator onboardingu — 5 kroków ("We'll build your plan around this")
Wspólny szkielet każdego kroku: strzałka wstecz + tytuł pytania + szary podtytuł,
pomarańczowy pasek postępu z licznikiem "x/5", treść, pomarańczowy przycisk "Next"
przyklejony na dole (ostatni krok: "Build my plan" / "Zbuduj mój plan").

1. **Cel** (1/5, "What's your goal?") — lista opcji-radio: Budowa mięśni / Redukcja /
   Forma i zdrowie / Siła. Wybrana opcja: przyciemnione pomarańczowe tło, pomarańczowa
   ramka i znacznik ✓ w kółku po prawej; niewybrane: ciemne karty z pustym kółkiem.
2. **Poziom zaawansowania** (2/5, "Your fitness level?") — Początkujący ("nowy lub
   wracający"), Średniozaawansowany ("6+ miesięcy"), Zaawansowany ("2+ lata,
   systematycznie") — karty z podpisem, ten sam wzorzec zaznaczenia.
3. **O Tobie** (3/5, "Tell us about yourself") — płeć: dwie duże karty obok siebie
   (ikona ♀/♂ + podpis), wybrana pomarańczowo tintowana; drobna informacja pod spodem.
4. **Ile dni w tygodniu** (4/5) — rząd kółek 1–7, wybrane pełne pomarańczowe;
   pod spodem karta z podpowiedzią np. "3 dni / tydzień — świetne dla początkujących"
   (u nas: 3 dni = nasz plan A/B/C ✓).
5. **Szczegóły** (5/5, "A few details") — pola: Wiek, Wzrost (cm), Waga (kg) —
   ciemne inputy z ikonami; CTA "Zbuduj mój plan" → ekran Building Plan → Plan Ready.

Mapowanie na nas: dane trafiają do profilu (wiek/wzrost/waga zasilają BMI i wagę
startową), cel i poziom zapisujemy w profilu (postawa pod przyszłe warianty planu),
liczba dni — na razie informacyjnie (nasz plan to 3 dni siłowe + 2 cardio).

### Building your plan (ekran przejściowy po kreatorze)
- Pomarańczowy spinner (łamany ring), tytuł "Budowanie planu…", szary podtytuł
- **Animowana checklista na żywo**: kolejne pozycje odhaczają się pomarańczowym ✓
  ("Cel: budowa mięśni" → "3 dni / tydzień" → "Dobieranie ćwiczeń…")

### Plan is ready (podsumowanie planu)
- Duże pomarańczowe kółko z ✓, "Twój plan jest gotowy!", podtytuł
- Nazwa planu ("Beginner Build Muscle · Personalized Plan")
- 3 kafelki statystyk planu (liczby fontem **Doto**): 03 Days / 17 exercises / 45 min avg
  → u nas: 3 dni / 23 ćwiczenia / ~60 min
- Zdjęcie na dole + pomarańczowy CTA "Start training"

### Home wg Fuerzy (docelowa iteracja ekranu głównego)
- Nagłówek: "Welcome Back / Alex Carry" + ikony (szukaj, korona/premium)
- **Karta Daily Progress**: ikona w kółku + tytuł + pomarańczowe kółko ze strzałką;
  wielka liczba **84** (Doto) + "+2%"; pasek postępu; stopka "Day 1 · 28 min today ·
  Exercise 3/6 Completed"
- "Today's workout": karty ze zdjęciem i przyciskiem "Continue" (pill + strzałka)
- "Recent workout": wiersz z ringiem "3/5", tekst "2 more to hit your weekly goal",
  kropki postępu

### ⭐ Ekran szczegółów ĆWICZENIA — POTWIERDZONY DO WDROŻENIA (dla każdego ćwiczenia)
(właściciel: "możesz dodać jakieś ćwiczenie pokazane, zrób coś podobnego dla każdego")
- Góra: **wideo z pokazem ćwiczenia** (player: play, pasek postępu, czas, głośność,
  fullscreen) — u nas: osadzone wideo YouTube per ćwiczenie (kuratorowane linki
  do dobrych pokazów techniki) lub miniatura → otwarcie wideo
- Tytuł ćwiczenia + **tagi**: partia mięśniowa / sprzęt / poziom
  (np. "Klatka · Sztanga · Początkujący")
- **Zakładki: How To | History | Records**
  - How To: technika krok po kroku (mamy teksty `tech` — rozpisać na kroki)
  - History: historia ciężarów tego ćwiczenia (mamy w snapshots)
  - Records: rekordy (max ciężar, najlepsza seria)
- **"Your progress · last 7 sessions"**: wykres słupkowy S1–S7 (ostatnie sesje,
  aktualna wyróżniona pomarańczem) — dane z zapisów ciężarów
- Wejście: tap w wiersz ćwiczenia na ekranie szczegółów treningu

### ⭐ Live Session (aktywna sesja treningowa — tryb "w trakcie ćwiczenia")
- Nagłówek: X (wyjście) · nazwa ćwiczenia + tagi ("Bench press / Chest Barbell") ·
  pomarańczowy link "Finish" po prawej
- **Karta Rest timer**: półkolisty zegar z kresek (jak gauge), odliczanie fontem
  **Doto** (np. "65"), podpis "Auto between sets", link "Skip" — nasz timer przerwy
  do przeprojektowania na ten wzorzec
- Czas sesji na środku ("12.45 / Day 1 Upper body")
- 3 kafelki statystyk sesji na żywo (Doto): czas / serie / objętość kg (np. 1.2k)
- Dolne przyciski: ciemny pill "**+ Add set**" + pomarańczowy "**Next exercise**"
- Mapowanie: nowy pełnoekranowy tryb sesji — prowadzenie przez ćwiczenia po kolei,
  automatyczna przerwa między seriami, licznik czasu sesji i objętości na żywo

### ⭐ Session Summary (podsumowanie po treningu)
- Pomarańczowe kółko z trofeum, "Workout complete!", podtytuł
- 3 kafelki (Doto): czas / serie / kg łącznie
- **Badge "New record — Bench press"** gdy padł rekord ciężaru
- Lista EXERCISES: nazwa + "3 sets · 40 kg" per ćwiczenie
- Toggle udostępnienia (na później — Community), pomarańczowy CTA "Save"
- Mapowanie: po "Finish" w sesji → podsumowanie → zapis = nasz snapshot ciężarów
  + oznaczenie treningu w kalendarzu tygodnia (automatyzacja odhaczania!)

### Progress (rozbudowane statystyki)
- Karta "Your Streak": rząd dni S–N w kółkach (zrobione białe, dziś pomarańczowe),
  data po prawej, link "View Calendar" → nasz Kalendarz
- "Current status": duży ring **Volume 54% of goal** (Doto, "802/1546 kcal"),
  kafelki Sets **802** i Exercises **54 min**
- "Workout volume" — słupki tygodnia (S–N, kg lifted, dzisiejszy pomarańczowy)
- Mapowanie: nasza zakładka Statystyki dostaje sekcję "bieżący status" z ringiem
  celu tygodniowego i wykresem objętości (kg podniesione = suma serie×powt.×ciężar)

### Settings (ustawienia)
- Grupy: SECURITY (Account, Notifications) / PREFERENCES (Women's mode toggle,
  Language, Units — kg) / OTHERS (Premium, Help & support)
- Wiersze: ikona + nazwa + chevron/toggle/wartość po prawej; CTA "Log Out" na dole
- Mapowanie: sekcja Ustawienia w Profilu — język, jednostki, reset danych,
  eksport/backup (zamiast konta)

### Notifications (powiadomienia)
- Grupy toggli: przypomnienia o treningu / alerty o serii (streak) / przypomnienia
  o dniu wolnym / (community — później) / porady
- Mapowanie: przełączniki lokalne; realne push-e wymagają PWA + zgody — etap PWA

### Log out / arkusz potwierdzenia (bottom sheet)
- Wzorzec potwierdzeń akcji: zaokrąglony arkusz od dołu na tle przyciemnionego zdjęcia,
  okrągła ikona (czerwona przy akcjach destrukcyjnych), pytanie ("Log out?"),
  szary podtytuł, pomarańczowy CTA + ciemny "Cancel"
- Mapowanie: użyjemy przy resecie danych, cofaniu treningu, wyjściu z sesji live

### Create account (logowanie)
- Telefon + kod SMS, opcje Google/Apple, "Welcome back" na zdjęciu
- Wymaga backendu — na później; w wersji lokalnej zastępujemy onboardingiem
  z danymi użytkownika (bez konta)

## 6. Proponowana kolejność wdrożenia

1. **Splash + pełny flow powitalny**: Splash → Welcome → Onboarding z danymi
   (imię, wzrost, waga, cel) → „Building Plan" (animacja) → „Plan Ready" → Home.
   Bez kont — dane lokalnie.
2. **Poziomy + odznaki**: rozbudowa systemu odznak o poziomy (XP za treningi,
   serie tygodni, progres ciężarów).
3. **Ćwiczenia krok po kroku**: technika jako numerowane kroki; opcjonalnie
   pole na link wideo.
4. **Wyzwanie 30 dni**: osobny tracker wyzwania dla systematyczności.
5. **Ustawienia**: w profilu (reset danych, edycja planu, preferencje).
6. *(później / wymaga backendu)*: konta, Community, My Post.
