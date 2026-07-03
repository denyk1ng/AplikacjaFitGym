# FORMA — aplikacja treningowa

Osobista aplikacja do prowadzenia treningów na siłowni. Zawiera realny plan treningowy
(A / B / C + cardio + regeneracja), rozgrzewki, licznik serii, timer przerw, zapis progresu
ciężarów i statystyki z wykresami.

## Stos

- React 18 + Vite
- Recharts (wykresy progresu)
- lucide-react (ikony)
- Zapis danych: `localStorage` (ciężary, zapisy progresu, onboarding)

## Uruchomienie

```bash
npm install
npm run dev      # tryb deweloperski
npm run build    # build produkcyjny do dist/
npm run preview  # podgląd builda
```

## Struktura

```
src/
  data/plan.js          # plan treningowy A/B/C, rozgrzewki, odznaki (realne dane)
  theme.js              # motyw: ciemna oliwkowa zieleń + limonkowy akcent
  lib/storage.js        # trwały zapis w localStorage
  lib/utils.js          # streak tygodni, łączny przyrost, odznaki
  hooks/useCountUp.js   # animowane liczniki
  components/           # Dashboard, Trening, Statystyki, Rozgrzewka, nawigacja
  App.jsx               # stan aplikacji, zapisy, routing zakładek
```

## Plan tygodnia

| Dzień | Trening |
|---|---|
| Poniedziałek | Trening A — klatka (priorytet) + plecy + barki + ramiona |
| Wtorek | Cardio + sauna (bieżnia 12% / 3,5 km/h / 50 min) |
| Środa | Trening B — klatka (lżej) + plecy + nogi + brzuch |
| Czwartek | Cardio + sauna |
| Piątek | Trening C — klatka (uzup.) + plecy + barki + ramiona |
| Sobota / Niedziela | Regeneracja |
