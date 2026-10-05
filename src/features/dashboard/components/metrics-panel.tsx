import type { ReactNode } from "react";
import { Link } from "react-router";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { ToggleGroup, ToggleGroupItem } from "@/shared/ui/toggle-group";
import { cn } from "@/shared/utils/cn";

export type Period = 1 | 7 | 30;
const periods: { value: Period; label: string }[] = [
  { value: 1, label: "Aujourd’hui" },
  { value: 7, label: "7 j" },
  { value: 30, label: "30 j" },
];

/** Choix de la période en boutons groupés, aligné à droite au-dessus du panneau. */
export function PeriodToggle({
  period,
  onPeriod,
}: {
  period: Period;
  onPeriod: (period: Period) => void;
}) {
  return (
    <ToggleGroup
      value={[String(period)]}
      onValueChange={(value) => {
        const next = Number(value[0]) as Period;
        if (next) onPeriod(next);
      }}
      aria-label="Période"
      className="rounded-lg bg-muted p-0.5"
    >
      {periods.map((item) => (
        <ToggleGroupItem
          key={item.value}
          value={String(item.value)}
          className="h-7 rounded-md px-3 text-xs text-muted-foreground aria-pressed:bg-background aria-pressed:text-foreground aria-pressed:shadow-xs"
        >
          {item.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}

export type Bar = { key: string; value: number; title: string };

/** Barres quotidiennes : valeurs réelles, le dernier jour en plein ; un trait si tout est nul. */
export function Bars({ bars, label }: { bars: Bar[]; label: string }) {
  const max = Math.max(...bars.map((bar) => bar.value), 0);
  if (!max)
    return (
      <div className="flex h-14 items-end" aria-hidden="true">
        <div className="h-px w-full bg-border" />
      </div>
    );
  return (
    <div
      className="flex h-14 items-end gap-[3px]"
      role="img"
      aria-label={`${label} par jour`}
    >
      {bars.map((bar, index) => (
        <div
          key={bar.key}
          title={bar.title}
          className="flex h-full min-w-0 flex-1 items-end"
        >
          <div
            className={cn(
              "w-full rounded-t-[2px]",
              bar.value > 0
                ? index === bars.length - 1
                  ? "bg-primary"
                  : "bg-primary/40"
                : "bg-border",
            )}
            style={{
              height:
                bar.value > 0
                  ? `${Math.max((bar.value / max) * 100, 6)}%`
                  : "1px",
            }}
          />
        </div>
      ))}
    </div>
  );
}

/**
 * Case du panneau : libellé (lien vers le détail, avec chevron), valeur, précision, puis un
 * contenu libre (barres, répartition, bouton).
 */
export function PanelCell({
  label,
  value,
  detail,
  to,
  className,
  children,
}: {
  label: string;
  value: ReactNode;
  detail?: ReactNode;
  to?: string;
  className?: string;
  children?: ReactNode;
}) {
  return (
    <div
      className={cn("flex min-w-0 flex-col gap-1 bg-background p-5", className)}
    >
      {to ? (
        <Link
          to={to}
          className="group inline-flex w-fit items-center gap-1 text-sm text-muted-foreground outline-none hover:text-foreground focus-visible:underline"
        >
          {label}
          <HugeiconsIcon
            icon={ArrowRight01Icon}
            strokeWidth={1.75}
            aria-hidden="true"
            className="size-3.5 transition-transform group-hover:translate-x-0.5"
          />
        </Link>
      ) : (
        <p className="text-sm text-muted-foreground">{label}</p>
      )}
      <p className="text-xl font-semibold tracking-tight tabular-nums">
        {value}
      </p>
      {detail && <p className="text-xs text-muted-foreground">{detail}</p>}
      {children && <div className="mt-auto pt-4">{children}</div>}
    </div>
  );
}

/** Panneau unique découpé en cases par des traits d'un pixel, coins arrondis à l'extérieur. */
export function MetricsPanel({ children }: { children: ReactNode }) {
  return (
    <div className="grid gap-px overflow-hidden rounded-xl border bg-border md:grid-cols-3">
      {children}
    </div>
  );
}
