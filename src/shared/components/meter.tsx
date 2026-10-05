import { cn } from "@/shared/utils/cn";
import { formatPercent } from "@/shared/utils/format";

/**
 * Jauge de consommation : remplissage `chart-3`, `warning` au-delà de 80 %, `danger` au-delà
 * de 95 %. `value` et `max` sont dans la même unité ; `max` nul ou absent = illimité.
 */
export function Meter({
  value,
  max,
  label,
  valueLabel,
  className,
}: {
  value: number;
  max: number | null | undefined;
  label: string;
  /** Texte affiché à droite (« 1,2 Go sur 5 Go ») ; par défaut le pourcentage. */
  valueLabel?: string;
  className?: string;
}) {
  const unlimited = !max || max <= 0;
  const ratio = unlimited ? 0 : Math.min(1, Math.max(0, value / max));
  const tone =
    ratio >= 0.95
      ? "bg-danger-foreground"
      : ratio >= 0.8
        ? "bg-warning-foreground"
        : "bg-chart-3";
  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-baseline justify-between gap-2 text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="tabular-nums">
          {valueLabel ?? (unlimited ? "Illimité" : formatPercent(ratio))}
        </span>
      </div>
      <div
        role="meter"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={unlimited ? undefined : max}
        aria-valuenow={unlimited ? undefined : value}
        aria-valuetext={valueLabel}
        className="h-1.5 overflow-hidden rounded-full bg-muted"
      >
        {!unlimited && (
          <div
            className={cn(
              "h-full rounded-full transition-[width] duration-300 ease-out",
              tone,
            )}
            style={{ width: `${ratio * 100}%` }}
          />
        )}
      </div>
    </div>
  );
}
