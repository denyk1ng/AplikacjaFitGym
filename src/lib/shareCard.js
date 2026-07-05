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
  ctx.fillStyle = "#171717";
  ctx.fillRect(0, 0, W, H);
  const glow = ctx.createRadialGradient(W / 2, 60, 40, W / 2, 60, 900);
  glow.addColorStop(0, "rgba(188,255,49,0.16)");
  glow.addColorStop(1, "rgba(188,255,49,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  // wordmark FORMA
  ctx.font = "800 34px -apple-system, Segoe UI, Roboto, sans-serif";
  ctx.fillStyle = "#94978f";
  ctx.textBaseline = "top";
  ctx.fillText("FOR", 80, 90);
  const forWidth = ctx.measureText("FOR").width;
  ctx.fillStyle = "#bcff31";
  ctx.fillText("MA", 80 + forWidth, 90);

  // trofeum
  ctx.fillStyle = "#bcff31";
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
  ctx.fillStyle = "#94978f";
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
    ctx.fillStyle = "#94978f";
    ctx.fillText(s.l, x + tileW / 2, tileY + 116);
    ctx.textAlign = "left";
  });

  // rekord (opcjonalnie)
  let y = tileY + tileH + 60;
  if (record) {
    const boxW = totalW;
    const boxH = 100;
    ctx.fillStyle = "rgba(188,255,49,0.09)";
    roundRect(ctx, startX, y, boxW, boxH, 20);
    ctx.fill();
    ctx.strokeStyle = "rgba(188,255,49,0.3)";
    ctx.lineWidth = 2;
    roundRect(ctx, startX, y, boxW, boxH, 20);
    ctx.stroke();
    ctx.font = "700 32px -apple-system, Segoe UI, Roboto, sans-serif";
    ctx.fillStyle = "#bcff31";
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

export async function shareWorkoutImage(data) {
  const canvas = drawCard(data);
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
  if (!blob) throw new Error("Nie udało się wygenerować obrazka.");

  const file = new File([blob], `forma-${data.label.toLowerCase().replace(/\s+/g, "-")}.png`, { type: "image/png" });
  const shareData = { files: [file], title: "FORMA", text: `Zrobiłem ${data.label} — ${data.sets} serii, ${data.volume} kg objętości` };

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
