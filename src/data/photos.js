// Zdjęcia (Unsplash, wolne licencje) zbundlowane lokalnie — appka działa offline
import workoutA from "../assets/workout-a.jpg";
import workoutB from "../assets/workout-b.jpg";
import workoutC from "../assets/workout-c.jpg";
import cardio from "../assets/cardio.jpg";
import food from "../assets/food.jpg";
import stretch from "../assets/stretch.jpg";
import hero from "../assets/hero.jpg";
import warmupA from "../assets/warmup-a.jpg";
import warmupB from "../assets/warmup-b.jpg";
import warmupC from "../assets/warmup-c.jpg";

export const PHOTOS = {
  A: workoutA,
  B: workoutC, // dzień nóg — sztanga z podłogi
  C: workoutB, // martwy ciąg / wyciskanie nad głowę
  cardio,
  food,
  stretch,
  hero,
};

// osobne zdjęcia dla kafelków Rozgrzewki — inne niż Trening A/B/C, żeby się nie powielały
export const WARMUP_PHOTOS = { A: warmupA, B: warmupB, C: warmupC };
