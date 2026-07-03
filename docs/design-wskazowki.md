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

## 4. Proponowana kolejność wdrożenia

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
