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

export function EditNum({ value, unit, onChange }) {
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
    const n = parseFloat(val);
    if (!isNaN(n) && n !== value) onChange(n);
    else setVal(String(value));
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
            setVal(String(value));
          }
        }}
        style={{ ...inputStyle, width: 62 }}
      />
    );
  return (
    <span onClick={() => setEditing(true)} title="Kliknij aby edytować" style={displayStyle}>
      {value}
      {unit ? ` ${unit}` : ""}
    </span>
  );
}

export function EditStr({ value, onChange }) {
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
    if (val !== value) onChange(val);
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
        style={{ ...inputStyle, width: 70 }}
      />
    );
  return (
    <span onClick={() => setEditing(true)} title="Kliknij aby edytować" style={displayStyle}>
      {value}
    </span>
  );
}
