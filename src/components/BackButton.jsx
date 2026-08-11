import { createPortal } from "react-dom";
import { ArrowLeft } from "lucide-react";

// Przycisk "wstecz" leżący na zdjęciu hero — przyklejony do okna, nie do
// zdjęcia. Wcześniej siedział wewnątrz hero (position: absolute), więc przy
// przewijaniu odjeżdżał razem z nim: po zjechaniu do dolnych ćwiczeń lądował
// ponad 500 px nad krawędzią ekranu i żeby wrócić, trzeba było najpierw
// przewinąć na samą górę.
//
// Samo `position: fixed` tu nie wystarcza. Kontener zakładki ma animację
// wejścia `.fu`, a ta z `fill-mode: both` zostawia po sobie computed
// `transform: matrix(1, 0, 0, 1, 0, 0)` — macierz jednostkowa, która niczego
// nie przesuwa, ale wystarcza, żeby element przejął rolę układu odniesienia
// dla position: fixed. Dlatego przycisk ląduje przez portal w <body>, tym
// samym sposobem co arkusze dolne (patrz ConfirmSheet/QuickAddSheet).
export function BackButton({ onClick, label = "Wstecz" }) {
  if (typeof document === "undefined") return null;
  return createPortal(
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      className="backfab tap"
      style={{
        width: 40,
        height: 40,
        borderRadius: 13,
        background: "rgba(23,23,23,0.65)",
        backdropFilter: "blur(8px)",
        border: "none",
        color: "#fff",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 0,
      }}
    >
      <ArrowLeft size={18} strokeWidth={2.2} />
    </button>,
    document.body
  );
}
