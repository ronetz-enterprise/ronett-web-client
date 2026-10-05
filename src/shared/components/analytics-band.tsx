import type { ReactNode } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowDown01Icon, ArrowUp01Icon } from "@hugeicons/core-free-icons";
import { cn } from "@/shared/utils/cn";
import { formatPercent } from "@/shared/utils/format";

/*
 * Briques des pages d'analyse bord à bord (Finances, Consommation) : une bande collée sous
 * l'en-tête, la courbe à gauche, une colonne d'indicateurs à droite séparée par un trait.
 */

/** Bloc de la colonne d'indicateurs : libellé, valeur, détail. */
export function MetricBlock({
  label,
  value,
  children,
}: {
  label: string;
  value: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="space-y-3 px-(--page-gutter) py-5 lg:px-5">
      <div className="space-y-1">
        <h3 className="text-sm text-muted-foreground">{label}</h3>
        <p className="text-2xl font-semibold tracking-tight tabular-nums">
          {value}
        </p>
      </div>
      {children}
    </div>
  );
}

/**
 * Évolution par rapport à la période précédente. Sans base de comparaison, le dit plutôt que
 * d'afficher un pourcentage trompeur ; une égalité est annoncée comme stable.
 */
export function PeriodDelta({
  current,
  previous,
  period,
  higherIsBetter = true,
}: {
  current: number;
  previous: number;
  /** Libellé de la période précédente : « 30 jours précédents ». */
  period: string;
  higherIsBetter?: boolean;
}) {
  if (!previous)
    return (
      <p className="text-xs text-muted-foreground">
        Pas de comparaison avec les {period}
      </p>
    );
  const change = (current - previous) / previous;
  if (change === 0)
    return (
      <p className="text-xs text-muted-foreground">
        Stable par rapport aux {period}
      </p>
    );
  const up = change > 0;
  return (
    <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
      <span
        className={cn(
          "inline-flex items-center gap-0.5 font-medium",
          up === higherIsBetter
            ? "text-success-foreground"
            : "text-danger-foreground",
        )}
      >
        <HugeiconsIcon
          icon={up ? ArrowUp01Icon : ArrowDown01Icon}
          strokeWidth={1.75}
          className="size-3.5"
          aria-hidden="true"
        />
        {formatPercent(Math.abs(change))}
        <span className="sr-only">{up ? " en hausse" : " en baisse"}</span>
      </span>
      vs {period}
    </p>
  );
}

/** Barre de répartition en deux parts (`chart-4` / `chart-2`) et sa légende. */
export function SplitBar({
  first,
  second,
  format,
  extra,
}: {
  first: { label: string; value: number };
  second: { label: string; value: number };
  format: (value: number) => string;
  /** Ligne supplémentaire de la légende, sans pastille (« Total versé »). */
  extra?: { label: string; value: string };
}) {
  const total = first.value + second.value;
  const share = total > 0 ? first.value / total : 1;
  return (
    <>
      <div
        role="img"
        aria-label={`${first.label} ${format(first.value)}, ${second.label.toLowerCase()} ${format(second.value)}`}
        className="flex h-1.5 overflow-hidden rounded-full bg-muted"
      >
        {total > 0 && (
          <>
            <div
              className="h-full bg-chart-4 transition-[width] duration-300"
              style={{ width: `${share * 100}%` }}
            />
            <div
              className="h-full bg-chart-2 transition-[width] duration-300"
              style={{ width: `${(1 - share) * 100}%` }}
            />
          </>
        )}
      </div>
      <dl className="space-y-1.5 text-xs">
        {[
          { ...first, tone: "bg-chart-4" },
          { ...second, tone: "bg-chart-2" },
        ].map((part) => (
          <div
            key={part.label}
            className="flex items-center justify-between gap-2"
          >
            <dt className="flex items-center gap-1.5 text-muted-foreground">
              <span
                aria-hidden="true"
                className={cn("size-2 rounded-full", part.tone)}
              />
              {part.label}
            </dt>
            <dd className="tabular-nums">{format(part.value)}</dd>
          </div>
        ))}
        {extra && (
          <div className="flex items-center justify-between gap-2">
            <dt className="pl-3.5 text-muted-foreground">{extra.label}</dt>
            <dd className="tabular-nums">{extra.value}</dd>
          </div>
        )}
      </dl>
    </>
  );
}

/** Titre d'une colonne latérale, à la hauteur d'une barre d'onglets voisine (les traits s'alignent). */
export function SideColumnHeader({
  id,
  title,
  aside,
}: {
  id: string;
  title: string;
  aside?: ReactNode;
}) {
  return (
    <div className="flex h-10 items-center justify-between gap-2 border-b px-(--page-gutter) text-sm lg:px-5">
      <h2 id={id} className="font-medium">
        {title}
      </h2>
      {aside}
    </div>
  );
}
