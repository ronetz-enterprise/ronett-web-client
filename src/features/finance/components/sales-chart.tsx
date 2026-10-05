import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/shared/ui/chart";
import { useReducedMotion } from "@/shared/hooks/use-reduced-motion";
import { formatMoney } from "../model/finance";
import type { SalesDay, SalesMetric } from "../model/sales-report";

const config = {
  net: { label: "Revenu net", color: "var(--chart-4)" },
  gross: { label: "Chiffre d’affaires", color: "var(--chart-4)" },
  commission: { label: "Commissions", color: "var(--chart-4)" },
} satisfies ChartConfig;

const shortDay = (value: string) =>
  new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short" }).format(
    new Date(`${value}T00:00:00`),
  );

/** Aire quotidienne d'un montant (`chart-4`), revenu net par défaut. Chargé à la demande avec Recharts. */
export default function SalesChart({
  days,
  currency,
  label,
  metric = "net",
  className = "h-56 w-full",
}: {
  days: SalesDay[];
  currency: string;
  label: string;
  metric?: SalesMetric;
  /** Dimensions du graphique ; hauteur fixe par défaut. */
  className?: string;
}) {
  const reduced = useReducedMotion();
  return (
    <ChartContainer
      config={config}
      className={className}
      role="img"
      aria-label={label}
    >
      <AreaChart data={days} margin={{ left: 0, right: 8 }}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="day"
          tickLine={false}
          axisLine={false}
          minTickGap={24}
          tickFormatter={shortDay}
        />
        <YAxis
          width={56}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value: number) =>
            new Intl.NumberFormat("fr-FR", { notation: "compact" }).format(
              value,
            )
          }
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              labelFormatter={(value) => shortDay(String(value))}
              formatter={(value) => formatMoney(Number(value), currency)}
            />
          }
        />
        <Area
          dataKey={metric}
          type="monotone"
          fill={`var(--color-${metric})`}
          fillOpacity={0.15}
          stroke={`var(--color-${metric})`}
          strokeWidth={1.75}
          isAnimationActive={!reduced}
        />
      </AreaChart>
    </ChartContainer>
  );
}
