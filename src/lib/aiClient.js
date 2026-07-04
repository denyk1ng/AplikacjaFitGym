// Bezpośrednie wywołanie Anthropic Messages API z przeglądarki, kluczem użytkownika
// wpisanym w ustawieniach i trzymanym wyłącznie w localStorage na tym urządzeniu.
// Appka nie ma backendu (GitHub Pages), więc to jedyny sposób na realny czat bez serwera.

const MODEL = "claude-sonnet-5";

export async function sendCoachMessage({ apiKey, systemPrompt, messages }) {
  let res;
  try {
    res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1024,
        system: systemPrompt,
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
      }),
    });
  } catch (e) {
    throw new Error("Brak połączenia z API — sprawdź internet i spróbuj ponownie.");
  }

  if (!res.ok) {
    if (res.status === 401) throw new Error("Nieprawidłowy klucz API — sprawdź go w ustawieniach.");
    if (res.status === 429) throw new Error("Za dużo zapytań naraz — poczekaj chwilę i spróbuj ponownie.");
    let msg = `Błąd API (${res.status})`;
    try {
      const j = await res.json();
      if (j?.error?.message) msg = j.error.message;
    } catch (e) {}
    throw new Error(msg);
  }

  const data = await res.json();
  return (data.content || [])
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("\n");
}
