import { z } from "zod";

const amount = z.number();
const day = z.iso.date();

/** `TimeSeriesPointView` : une ligne par jour ayant eu au moins une vente. */
export const salesPointSchema = z.object({
  periodStart: day,
  count: z.number().int().nonnegative(),
  grossAmount: amount,
  commissionAmount: amount,
  netAmount: amount,
  refundedAmount: amount,
});
export type SalesPoint = z.infer<typeof salesPointSchema>;

/** `SalesReportView` (`/reports/sales`, granularité jour). */
export const salesReportSchema = z.object({
  organizationId: z.uuid(),
  currency: z.string().length(3),
  salesCount: z.number().int().nonnegative(),
  confirmedPayments: z.number().int().nonnegative(),
  failedPayments: z.number().int().nonnegative(),
  grossRevenue: amount,
  commissionAmount: amount,
  netRevenue: amount,
  series: z.array(salesPointSchema),
  generatedAt: z.iso.datetime({ offset: true }),
});
export type SalesReport = z.infer<typeof salesReportSchema>;

export type SalesDay = {
  day: string;
  count: number;
  net: number;
  gross: number;
  commission: number;
};

/** Montant tracé par le graphique des ventes. */
export type SalesMetric = "net" | "gross" | "commission";

/** Date locale `AAAA-MM-JJ`, comme `LocalDate` côté serveur. */
export function isoDay(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function daysBefore(now: Date, days: number) {
  const date = new Date(now);
  date.setDate(date.getDate() - days);
  return date;
}

/**
 * Série continue jour par jour : le backend omet les jours sans vente, qui valent zéro.
 * `days` jours se terminant à `end` inclus.
 */
export function dailySales(
  series: SalesPoint[],
  end: Date,
  days: number,
): SalesDay[] {
  const byDay = new Map(series.map((point) => [point.periodStart, point]));
  return Array.from({ length: days }, (_, index) => {
    const day = isoDay(daysBefore(end, days - 1 - index));
    const point = byDay.get(day);
    return {
      day,
      count: point?.count ?? 0,
      net: point?.netAmount ?? 0,
      gross: point?.grossAmount ?? 0,
      commission: point?.commissionAmount ?? 0,
    };
  });
}

/** Évolution relative entre deux totaux ; `null` sans base de comparaison. */
export function relativeChange(current: number, previous: number) {
  if (!previous) return null;
  return (current - previous) / previous;
}

export function sum(days: SalesDay[], key: "count" | SalesMetric) {
  return days.reduce((total, day) => total + day[key], 0);
}
