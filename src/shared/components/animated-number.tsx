import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "@/shared/hooks/use-reduced-motion";

/**
 * Fait défiler une valeur numérique vers sa nouvelle valeur (400 ms, ease-out). Sans
 * animation si l'utilisateur la refuse. Le texte final est toujours `format(value)`.
 */
export function AnimatedNumber({
  value,
  format,
  duration = 400,
}: {
  value: number;
  format: (value: number) => string;
  duration?: number;
}) {
  const reduced = useReducedMotion();
  const [shown, setShown] = useState(value);
  const from = useRef(value);

  useEffect(() => {
    if (reduced || from.current === value) {
      from.current = value;
      setShown(value);
      return;
    }
    const start = performance.now();
    const origin = from.current;
    let frame = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - (1 - t) ** 3;
      setShown(origin + (value - origin) * eased);
      if (t < 1) frame = requestAnimationFrame(tick);
      else from.current = value;
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, reduced, duration]);

  return (
    <>
      <span aria-hidden="true">{format(shown)}</span>
      <span className="sr-only">{format(value)}</span>
    </>
  );
}
