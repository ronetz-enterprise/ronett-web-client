import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/shared/ui/chart";
import { useReducedMotion } from "@/shared/hooks/use-reduced-motion";
import type { UsagePoint } from "../model/network-usage";
import { formatCount, formatDay } from "../formatters/units";

const config = {
  count: { label: "Sessions", color: "var(--chart-4)" },
} satisfies ChartConfig;

/** Aire des sessions par jour (`chart-4`). Chargé à la demande avec Recharts. */
export default function UsageChart({
  points,
  className = "h-56 w-full",
}: {
  points: UsagePoint[];
  /** Dimensions du graphique ; hauteur fixe par défaut. */
  className?: string;
}) {
  const reduced = useReducedMotion();
  return (
    <ChartContainer
      config={config}
      className={className}
      role="img"
      aria-label={`Sessions par jour, du ${formatDay(points[0].periodStart)} au ${formatDay(points[points.length - 1].periodStart)}`}
    >
      <AreaChart data={points} margin={{ left: 0, right: 8 }}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="periodStart"
          tickLine={false}
          axisLine={false}
          minTickGap={24}
          tickFormatter={(value: string) =>
            new Intl.DateTimeFormat("fr-FR", {
              day: "numeric",
              month: "short",
            }).format(new Date(`${value}T00:00:00`))
          }
        />
        <YAxis
          width={40}
          tickLine={false}
          axisLine={false}
          allowDecimals={false}
          tickFormatter={(value: number) => formatCount(value)}
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              labelFormatter={(value) => formatDay(String(value))}
            />
          }
        />
        <Area
          dataKey="count"
          type="monotone"
          fill="var(--color-count)"
          fillOpacity={0.15}
          stroke="var(--color-count)"
          strokeWidth={1.75}
          isAnimationActive={!reduced}
        />
      </AreaChart>
    </ChartContainer>
  );
}
