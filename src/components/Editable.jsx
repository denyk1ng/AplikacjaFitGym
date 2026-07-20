import { useEffect, useRef, useState } from "react";
import { T } from "../theme.js";

const inputStyle = {
  background: T.card2,
  border: `1px solid ${T.accent}`,
  borderRadius: 8,
  color: T.accent,
  padding: "2px 6px",
  fontSize: 15,
  fontWeight: 700,
  fontFamily: "inherit",
  outline: "none",
  textAlign: "center",
};

const displayStyle = {
  color: T.accent,
  fontWeight: 700,
  borderBottom: `1px dashed ${T.faint}`,
  cursor: "pointer",
  padding: "1px 2px",
  fontSize: 15,
};

// min/max chronią przed bezsensownymi wartościami (ujemny ciężar psuł
// objętość, 1RM i wykresy) — wartość spoza zakresu jest odrzucana bez zapisu
export function EditNum({ value, unit, onChange, min = 0, max = 999 }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(String(value));
  const ref = useRef(null);
  useEffect(() => {
    setVal(String(value));
  }, [value]);
  useEffect(() => {
    if (editing && ref.current) ref.current.focus();
  }, [editing]);
  const commit = () => {
    setEditing(false);
    const n = parseFloat(String(val).replace(",", "."));
    if (!isNaN(n) && n >= min && n <= max && n !== value) onChange(n);
    else setVal(String(value));
  };
  if (editing)
    return (
      <input
        ref={ref}
        value={val}
        inputMode="decimal"
        onChange={(e) => setVal(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
          if (e.key === "Escape") {
            setEditing(false);
            setVal(String(value));
          }
        }}
        style={{ ...inputStyle, width: 62 }}
      />
    );
  return (
    <span onClick={() => setEditing(true)} title="Kliknij aby edytować" style={displayStyle}>
      {String(value).replace(".", ",")}
      {unit ? ` ${unit}` : ""}
    </span>
  );
}

// domyślna walidacja powtórzeń: musi zawierać cyfrę i mieć sensowną długość
// (przyjmie "8", "8-10", "8 +AMRAP", "30s"; odrzuci pusty tekst i "banan")
const defaultValidate = (v) => /\d/.test(v) && v.trim().length > 0 && v.trim().length <= 14;

export function EditStr({ value, onChange, validate = defaultValidate, width = 70, align = "center" }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(value);
  const ref = useRef(null);
  useEffect(() => {
    setVal(value);
  }, [value]);
  useEffect(() => {
    if (editing && ref.current) ref.current.focus();
  }, [editing]);
  const commit = () => {
    setEditing(false);
    if (val !== value && validate(val)) onChange(val.trim());
    else setVal(value);
  };
  if (editing)
    return (
      <input
        ref={ref}
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
          if (e.key === "Escape") {
            setEditing(false);
            setVal(value);
          }
        }}
        style={{ ...inputStyle, width, textAlign: align }}
      />
    );
  return (
    <span onClick={() => setEditing(true)} title="Kliknij aby edytować" style={displayStyle}>
      {value}
    </span>
  );
}
