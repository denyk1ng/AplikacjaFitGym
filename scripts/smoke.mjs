// Smoke test przed deployem: serwuje świeży build (vite preview) i sprawdza
// w headless Chromium, że appka startuje bez błędów strony i renderuje
// kluczowe elementy (kartę hero + dolną nawigację). Pada => deploy nie leci.
import { spawn } from "node:child_process";
import { chromium } from "playwright";

const PORT = 4173;
const URL = `http://127.0.0.1:${PORT}/AplikacjaFitGym/`;

const preview = spawn("npx", ["vite", "preview", "--port", String(PORT), "--host"], { stdio: "pipe" });
const kill = () => { try { preview.kill(); } catch {} };
process.on("exit", kill);

// czekaj aż serwer wstanie
for (let i = 0; i < 40; i++) {
  try {
    const r = await fetch(URL);
    if (r.ok) break;
  } catch {}
  await new Promise((r) => setTimeout(r, 500));
  if (i === 39) { console.error("preview nie wstał"); process.exit(1); }
}

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
const errors = [];
page.on("pageerror", (e) => errors.push(String(e)));

await page.addInitScript(() => {
  localStorage.setItem("forma_onboarded", "1");
  localStorage.setItem("profile", JSON.stringify({ goal: "muscle", height: 180 }));
});
await page.goto(URL);
await page.waitForTimeout(3000); // splash

const heroOk = await page.locator("text=Zacznij trening, text=Zobacz kalendarz").first().count()
  || await page.evaluate(() => /Zacznij trening|Zobacz kalendarz/.test(document.body.textContent));
const navOk = await page.locator('button[title="Statystyki"]').count();

await browser.close();
kill();

if (errors.length) { console.error("Błędy strony:", errors); process.exit(1); }
if (!heroOk || !navOk) { console.error(`Brak kluczowych elementów: hero=${heroOk} nav=${navOk}`); process.exit(1); }
console.log("SMOKE OK — hero i nawigacja renderują się, zero błędów strony");
process.exit(0);
