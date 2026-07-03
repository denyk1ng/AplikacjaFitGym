// Krótki sygnał dźwiękowy przez Web Audio (bez plików audio).
let ctx = null;

function getCtx() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}

export function playBeep(times = 3) {
  try {
    const ac = getCtx();
    const now = ac.currentTime;
    for (let i = 0; i < times; i++) {
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.type = "sine";
      osc.frequency.value = i === times - 1 ? 1320 : 880;
      const t = now + i * 0.32;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.35, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.26);
      osc.connect(gain).connect(ac.destination);
      osc.start(t);
      osc.stop(t + 0.28);
    }
    if (navigator.vibrate) navigator.vibrate([180, 90, 180]);
  } catch (e) {
    // brak wsparcia audio — ignorujemy
  }
}
