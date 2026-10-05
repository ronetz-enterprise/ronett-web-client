import { useId } from "react";
import { cn } from "@/shared/utils/cn";

/**
 * Mini-courbe décorative (64×24 par défaut) en `chart-4`, aire à 15 %. Sans axe ni valeur :
 * l'information exacte reste dans le texte voisin, la courbe ne donne que la tendance.
 */
export function Sparkline({
  values,
  width = 64,
  height = 24,
  className,
}: {
  values: number[];
  width?: number;
  height?: number;
  className?: string;
}) {
  const id = useId();
  if (values.length < 2) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const points = values.map((value, index) => [
    (index / (values.length - 1)) * width,
    height - 2 - ((value - min) / span) * (height - 4),
  ]);
  const line = points
    .map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`)
    .join(" ");
  const area = `0,${height} ${line} ${width},${height}`;
  return (
    <svg
      aria-hidden="true"
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      className={cn("overflow-visible", className)}
    >
      <defs>
        <linearGradient id={id} x1="0" x2="0" y1="0" y2="1">
          <stop
            offset="0%"
            className="[stop-color:var(--color-chart-4)]"
            stopOpacity={0.25}
          />
          <stop
            offset="100%"
            className="[stop-color:var(--color-chart-4)]"
            stopOpacity={0}
          />
        </linearGradient>
      </defs>
      <polygon points={area} fill={`url(#${id})`} />
      <polyline
        points={line}
        fill="none"
        className="stroke-chart-4"
        strokeWidth={1.5}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}
