import { useEffect, useState } from "react";

export function useCountUp(target, dur) {
  const duration = dur || 900;
  const [val, setVal] = useState(0);
  useEffect(() => {
    let start = null;
    let raf;
    const step = (ts) => {
      if (start === null) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(target * eased);
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target]);
  return val;
}
