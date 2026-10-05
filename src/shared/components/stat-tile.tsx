import { Link } from "react-router";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowDown01Icon, ArrowUp01Icon } from "@hugeicons/core-free-icons";
import { Card, CardContent, CardHeader } from "@/shared/ui/card";
import { cn } from "@/shared/utils/cn";
import { formatPercent } from "@/shared/utils/format";
import { AnimatedNumber } from "./animated-number";
import { IconTile } from "./icon-tile";
import type { ObjectType } from "./object-icons";
import { Sparkline } from "./sparkline";

/**
 * Chiffre mis en scène : libellé, valeur animée, évolution, tendance. N'afficher qu'une donnée
 * réellement fournie par le backend ; `delta` et `trend` sont facultatifs.
 */
export function StatTile({
  label,
  value,
  format,
  context,
  delta,
  higherIsBetter = true,
  trend,
  icon,
  to,
  className,
}: {
  label: string;
  value: number;
  format: (value: number) => string;
  context?: string;
  /** Évolution relative (0,12 = +12 %) par rapport à la période précédente. */
  delta?: number | null;
  higherIsBetter?: boolean;
  trend?: number[];
  icon?: ObjectType;
  /** Rend la tuile cliquable (lien couvrant). */
  to?: string;
  className?: string;
}) {
  const good =
    delta == null || delta === 0 ? null : delta > 0 === higherIsBetter;
  return (
    <Card
      size="sm"
      className={cn(
        "relative",
        to &&
          "transition-[background-color,box-shadow] hover:bg-muted/30 hover:shadow-xs has-focus-visible:ring-3 has-focus-visible:ring-primary/20",
        className,
      )}
    >
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <h3 className="text-sm text-muted-foreground">
          {to ? (
            <Link to={to} className="outline-none after:absolute after:inset-0">
              {label}
            </Link>
          ) : (
            label
          )}
        </h3>
        {icon && <IconTile type={icon} size="sm" />}
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-end justify-between gap-3">
          <p className="font-heading text-[1.625rem] leading-8 font-semibold tracking-tight tabular-nums">
            <AnimatedNumber value={value} format={format} />
          </p>
          {trend && <Sparkline values={trend} />}
        </div>
        <p className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
          {delta != null && delta !== 0 && (
            <span
              className={cn(
                "inline-flex items-center gap-0.5 font-medium",
                good ? "text-success-foreground" : "text-danger-foreground",
              )}
            >
              <HugeiconsIcon
                icon={delta > 0 ? ArrowUp01Icon : ArrowDown01Icon}
                strokeWidth={1.75}
                className="size-3.5"
                aria-hidden="true"
              />
              {formatPercent(Math.abs(delta))}
              <span className="sr-only">
                {delta > 0 ? " en hausse" : " en baisse"}
              </span>
            </span>
          )}
          {context}
        </p>
      </CardContent>
    </Card>
  );
}
