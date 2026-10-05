import { lazy, Suspense } from "react";
import { cn } from "@/shared/utils/cn";
import { EmptyState } from "@/shared/components/feedback";
import { Skeleton } from "@/shared/ui/skeleton";
import type { SalesDay, SalesMetric } from "../model/sales-report";

const SalesChart = lazy(() => import("./sales-chart"));

/** Graphique d'un montant quotidien, ou état vide honnête s'il n'y a eu aucune vente. */
export function SalesTrend({
  days,
  currency,
  metric = "net",
  emptyDescription = "Le graphique apparaîtra dès la première vente confirmée.",
  fill = false,
}: {
  days: SalesDay[];
  currency: string;
  metric?: SalesMetric;
  emptyDescription?: string;
  /**
   * Occupe toute la hauteur restante de son conteneur flex (au moins 16 rem), au lieu
   * d'une hauteur fixe : le graphique suit la hauteur de la colonne voisine.
   */
  fill?: boolean;
}) {
  if (!days.some((day) => day.count > 0 || day.net !== 0))
    return (
      <div className={cn(fill && "flex min-h-64 flex-1 items-center")}>
        <EmptyState
          objectType="sale"
          title="Aucune vente sur la période"
          description={emptyDescription}
        />
      </div>
    );
  const size = fill ? "absolute inset-0 h-full w-full" : "h-56 w-full";
  const chart = (
    <Suspense fallback={<Skeleton className={size} />}>
      <SalesChart
        days={days}
        currency={currency}
        metric={metric}
        className={size}
        label={`${metricLabels[metric]} par jour sur les ${days.length} derniers jours`}
      />
    </Suspense>
  );
  return fill ? <div className="relative min-h-64 flex-1">{chart}</div> : chart;
}

const metricLabels: Record<SalesMetric, string> = {
  net: "Revenu net",
  gross: "Chiffre d’affaires",
  commission: "Commissions",
};
