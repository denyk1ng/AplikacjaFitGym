// Generuje obrazek podsumowania treningu (canvas, bez zewnętrznych bibliotek)
// i udostępnia go przez Web Share API — z fallbackiem do pobrania pliku,
// gdy przeglądarka nie wspiera udostępniania plików (np. desktop).

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawCard({ label, desc, time, sets, volume, record }) {
  const W = 1080;
  const H = 1350;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");

  // tło — ciemne z limonkową poświatą, jak reszta appki
  ctx.fillStyle = "#0f1012";
  ctx.fillRect(0, 0, W, H);
  const glow = ctx.createRadialGradient(W / 2, 60, 40, W / 2, 60, 900);
  glow.addColorStop(0, "rgba(178,238,55,0.16)");
  glow.addColorStop(1, "rgba(178,238,55,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  // wordmark FORMA
  ctx.font = "800 34px -apple-system, Segoe UI, Roboto, sans-serif";
  ctx.fillStyle = "#7c7c74";
  ctx.textBaseline = "top";
  ctx.fillText("FOR", 80, 90);
  const forWidth = ctx.measureText("FOR").width;
  ctx.fillStyle = "#b2ee37";
  ctx.fillText("MA", 80 + forWidth, 90);

  // trofeum
  ctx.fillStyle = "#b2ee37";
  ctx.beginPath();
  ctx.arc(W / 2, 260, 64, 0, Math.PI * 2);
  ctx.fill();
  ctx.font = "800 56px -apple-system, Segoe UI, Roboto, sans-serif";
  ctx.fillStyle = "#000";
  ctx.textAlign = "center";
  ctx.fillText("\u{1F3C6}", W / 2, 226);
  ctx.textAlign = "left";

  // tytuł
  ctx.textAlign = "center";
  ctx.font = "800 56px -apple-system, Segoe UI, Roboto, sans-serif";
  ctx.fillStyle = "#ffffff";
  ctx.fillText(`${label} ukończony!`, W / 2, 372);

  ctx.font = "500 30px -apple-system, Segoe UI, Roboto, sans-serif";
  ctx.fillStyle = "#7c7c74";
  ctx.fillText(desc, W / 2, 448);
  ctx.textAlign = "left";

  // statystyki — 3 kafelki
  const stats = [
    { v: time, l: "czas" },
    { v: String(sets), l: "serie" },
    { v: volume, l: "kg objętości" },
  ];
  const tileW = 300;
  const tileH = 180;
  const gap = 24;
  const totalW = tileW * 3 + gap * 2;
  const startX = (W - totalW) / 2;
  const tileY = 540;
  stats.forEach((s, i) => {
    const x = startX + i * (tileW + gap);
    ctx.fillStyle = "#1b1c19";
    roundRect(ctx, x, tileY, tileW, tileH, 24);
    ctx.fill();
    ctx.strokeStyle = "#2f302e";
    ctx.lineWidth = 2;
    roundRect(ctx, x, tileY, tileW, tileH, 24);
    ctx.stroke();

    ctx.textAlign = "center";
    ctx.font = "800 52px -apple-system, Segoe UI, Roboto, sans-serif";
    ctx.fillStyle = "#ffffff";
    ctx.fillText(s.v, x + tileW / 2, tileY + 46);
    ctx.font = "700 24px -apple-system, Segoe UI, Roboto, sans-serif";
    ctx.fillStyle = "#7c7c74";
    ctx.fillText(s.l, x + tileW / 2, tileY + 116);
    ctx.textAlign = "left";
  });

  // rekord (opcjonalnie)
  let y = tileY + tileH + 60;
  if (record) {
    const boxW = totalW;
    const boxH = 100;
    ctx.fillStyle = "rgba(178,238,55,0.09)";
    roundRect(ctx, startX, y, boxW, boxH, 20);
    ctx.fill();
    ctx.strokeStyle = "rgba(178,238,55,0.3)";
    ctx.lineWidth = 2;
    roundRect(ctx, startX, y, boxW, boxH, 20);
    ctx.stroke();
    ctx.font = "700 32px -apple-system, Segoe UI, Roboto, sans-serif";
    ctx.fillStyle = "#b2ee37";
    ctx.textAlign = "center";
    ctx.fillText(`\u{1F3C5} Nowy rekord — ${record}`, W / 2, y + 34);
    ctx.textAlign = "left";
    y += boxH + 50;
  }

  // stopka — data
  const dateStr = new Date().toLocaleDateString("pl-PL", { day: "numeric", month: "long", year: "numeric" });
  ctx.font = "600 26px -apple-system, Segoe UI, Roboto, sans-serif";
  ctx.fillStyle = "#4d4f49";
  ctx.textAlign = "center";
  ctx.fillText(dateStr, W / 2, H - 90);
  ctx.textAlign = "left";

  return canvas;
}

// wspólny finał: canvas -> plik -> Web Share albo pobranie
async function shareCanvas(canvas, filename, text) {
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
  if (!blob) throw new Error("Nie udało się wygenerować obrazka.");

  const file = new File([blob], filename, { type: "image/png" });
  const shareData = { files: [file], title: "FORMA", text };

  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    await navigator.share(shareData);
    return "shared";
  }

  // fallback — pobranie pliku (desktop / brak wsparcia Web Share z plikami)
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = file.name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  return "downloaded";
}

export async function shareWorkoutImage(data) {
  const canvas = drawCard(data);
  return shareCanvas(canvas, `forma-${data.label.toLowerCase().replace(/\s+/g, "-")}.png`, `Zrobiłem ${data.label} — ${data.sets} serii, ${data.volume} kg objętości`);
}

// Obrazek progresu ciężaru jednego ćwiczenia (wykres liniowy + start/teraz/
// przyrost) — udostępniany z zakładki Statystyki
function drawProgressCard({ name, unit, history }) {
  const W = 1080;
  const H = 1350;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#0f1012";
  ctx.fillRect(0, 0, W, H);
  const glow = ctx.createRadialGradient(W / 2, 60, 40, W / 2, 60, 900);
  glow.addColorStop(0, "rgba(178,238,55,0.16)");
  glow.addColorStop(1, "rgba(178,238,55,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  // wordmark FORMA
  ctx.font = "800 34px -apple-system, Segoe UI, Roboto, sans-serif";
  ctx.fillStyle = "#7c7c74";
  ctx.textBaseline = "top";
  ctx.fillText("FOR", 80, 90);
  const forWidth = ctx.measureText("FOR").width;
  ctx.fillStyle = "#b2ee37";
  ctx.fillText("MA", 80 + forWidth, 90);

  // tytuł + nazwa ćwiczenia
  ctx.textAlign = "center";
  ctx.font = "800 54px -apple-system, Segoe UI, Roboto, sans-serif";
  ctx.fillStyle = "#ffffff";
  ctx.fillText("Mój progres", W / 2, 210);
  ctx.font = "600 32px -apple-system, Segoe UI, Roboto, sans-serif";
  ctx.fillStyle = "#7c7c74";
  ctx.fillText(name, W / 2, 286);
  ctx.textAlign = "left";

  // wykres liniowy
  const chartX = 110;
  const chartY = 400;
  const chartW = W - 2 * chartX;
  const chartH = 420;
  const ws = history.map((h) => h.weight);
  const minW = Math.min(...ws);
  const maxW = Math.max(...ws);
  const span = maxW - minW || 1;
  const px = (i) => chartX + (history.length === 1 ? chartW / 2 : (i / (history.length - 1)) * chartW);
  const py = (w) => chartY + chartH - ((w - minW) / span) * (chartH - 60) - 30;

  // tło wykresu
  ctx.fillStyle = "#1b1c19";
  roundRect(ctx, chartX - 40, chartY - 40, chartW + 80, chartH + 80, 28);
  ctx.fill();
  ctx.strokeStyle = "#2f302e";
  ctx.lineWidth = 2;
  roundRect(ctx, chartX - 40, chartY - 40, chartW + 80, chartH + 80, 28);
  ctx.stroke();

  // wypełnienie pod linią
  ctx.beginPath();
  history.forEach((h, i) => (i === 0 ? ctx.moveTo(px(i), py(h.weight)) : ctx.lineTo(px(i), py(h.weight))));
  ctx.lineTo(px(history.length - 1), chartY + chartH);
  ctx.lineTo(px(0), chartY + chartH);
  ctx.closePath();
  const fillGrad = ctx.createLinearGradient(0, chartY, 0, chartY + chartH);
  fillGrad.addColorStop(0, "rgba(178,238,55,0.28)");
  fillGrad.addColorStop(1, "rgba(178,238,55,0)");
  ctx.fillStyle = fillGrad;
  ctx.fill();

  // linia
  ctx.beginPath();
  history.forEach((h, i) => (i === 0 ? ctx.moveTo(px(i), py(h.weight)) : ctx.lineTo(px(i), py(h.weight))));
  ctx.strokeStyle = "#b2ee37";
  ctx.lineWidth = 6;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.stroke();

  // punkty + etykiety skrajne
  history.forEach((h, i) => {
    ctx.beginPath();
    ctx.arc(px(i), py(h.weight), i === history.length - 1 ? 12 : 7, 0, Math.PI * 2);
    ctx.fillStyle = "#b2ee37";
    ctx.fill();
  });
  ctx.font = "700 26px -apple-system, Segoe UI, Roboto, sans-serif";
  ctx.fillStyle = "#7c7c74";
  ctx.textAlign = "left";
  ctx.fillText(history[0].dateShort, chartX - 10, chartY + chartH + 6);
  ctx.textAlign = "right";
  ctx.fillText(history[history.length - 1].dateShort, chartX + chartW + 10, chartY + chartH + 6);
  ctx.textAlign = "left";

  // kafelki: start / teraz / przyrost
  const start = history[0].weight;
  const now = history[history.length - 1].weight;
  const gain = Math.round((now - start) * 100) / 100;
  const fmt = (v) => `${String(v).replace(".", ",")} ${unit}`;
  const stats = [
    { v: fmt(start), l: "start" },
    { v: fmt(now), l: "teraz" },
    { v: `${gain >= 0 ? "+" : ""}${String(gain).replace(".", ",")} ${unit}`, l: "przyrost" },
  ];
  const tileW = 300;
  const tileH = 170;
  const gap = 24;
  const totalW = tileW * 3 + gap * 2;
  const startX = (W - totalW) / 2;
  const tileY = 960;
  stats.forEach((s, i) => {
    const x = startX + i * (tileW + gap);
    ctx.fillStyle = "#1b1c19";
    roundRect(ctx, x, tileY, tileW, tileH, 24);
    ctx.fill();
    ctx.strokeStyle = "#2f302e";
    ctx.lineWidth = 2;
    roundRect(ctx, x, tileY, tileW, tileH, 24);
    ctx.stroke();
    ctx.textAlign = "center";
    ctx.font = "800 44px -apple-system, Segoe UI, Roboto, sans-serif";
    ctx.fillStyle = i === 2 ? "#b2ee37" : "#ffffff";
    ctx.fillText(s.v, x + tileW / 2, tileY + 44);
    ctx.font = "700 24px -apple-system, Segoe UI, Roboto, sans-serif";
    ctx.fillStyle = "#7c7c74";
    ctx.fillText(s.l, x + tileW / 2, tileY + 110);
    ctx.textAlign = "left";
  });

  const dateStr = new Date().toLocaleDateString("pl-PL", { day: "numeric", month: "long", year: "numeric" });
  ctx.font = "600 26px -apple-system, Segoe UI, Roboto, sans-serif";
  ctx.fillStyle = "#4d4f49";
  ctx.textAlign = "center";
  ctx.fillText(dateStr, W / 2, H - 90);
  ctx.textAlign = "left";

  return canvas;
}

export async function shareProgressImage({ name, unit, history }) {
  const canvas = drawProgressCard({ name, unit, history });
  const gain = Math.round((history[history.length - 1].weight - history[0].weight) * 100) / 100;
  return shareCanvas(canvas, "forma-progres.png", `Mój progres w ${name}: ${gain >= 0 ? "+" : ""}${gain} ${unit}`);
}
