import { useMemo, useState } from "react";
import { Link } from "react-router";
import type { Membership } from "@/features/memberships";
import { useSites } from "@/features/site";
import { offerRoutes } from "@/features/offer";
import { accessRoutes, formatInstant } from "@/features/access";
import {
  dailySales,
  financeRoutes,
  useBalance,
  useSalesReport,
} from "@/features/finance";
import {
  formatBytes,
  lastDaysFilters,
  networkUsageRoutes,
  useAccessUsageSummary,
  usagePoints,
} from "@/features/network-usage";
import { QueryFailure } from "@/shared/components/query-feedback";
import { Button } from "@/shared/ui/button";
import { Skeleton } from "@/shared/ui/skeleton";
import { formatNumber } from "@/shared/utils/format";
import { cn } from "@/shared/utils/cn";
import { formatMoney } from "../model/overview";
import { canViewOverview, useOverview } from "../queries/overview";
import {
  Bars,
  MetricsPanel,
  PanelCell,
  PeriodToggle,
  type Bar,
  type Period,
} from "./metrics-panel";

function DashboardSkeleton() {
  return (
    <div
      role="status"
      aria-label="Chargement du tableau de bord"
      className="space-y-12 pt-10 lg:pt-14"
    >
      <div className="space-y-3">
        <Skeleton className="h-9 w-72" />
        <Skeleton className="h-4 w-80" />
      </div>
      <Skeleton className="h-80 w-full" />
    </div>
  );
}

const DAY = 24 * 60 * 60 * 1000;

/**
 * Tableau de bord d'un gérant de WiFi :
 * - en tête, le titre « Tableau de bord », l'organisation, la date et les boutons de création ;
 * - le panneau d'activité de la période, découpé en cases (revenu, ventes, connexions,
 *   solde avec « Retirer », données consommées).
 */
export function OrganizationDashboard({ active }: { active: Membership }) {
  const org = active.organizationId;
  const sites = useSites(active);
  const overview = useOverview(active);
  const owner = canViewOverview(active);
  const salesReport = useSalesReport(active, 60);
  const balance = useBalance(active);
  const [period, setPeriod] = useState<Period>(7);
  // Les barres couvrent au moins une semaine, même pour « Aujourd’hui ».
  const span = Math.max(period, 7);
  const usagePeriod = useMemo(() => lastDaysFilters(period, null), [period]);
  const usageSpan = useMemo(() => lastDaysFilters(span, null), [span]);
  const usage = useAccessUsageSummary(active, usagePeriod);
  const usageChart = useAccessUsageSummary(active, usageSpan);

  const loading = sites.isPending || (owner && overview.isPending);
  if (loading) return <DashboardSkeleton />;

  const data = overview.data ?? null;
  const siteList = sites.data ?? [];
  const firstActiveSite = siteList.find((site) => site.status === "ACTIVE");
  const currency =
    salesReport.data?.currency ??
    balance.data?.currency ??
    data?.currency ??
    "XAF";

  const series = salesReport.data?.series ?? null;
  const now = Date.now();

  const updatedAt = data ? new Date(data.dataLastUpdatedAt).getTime() : null;
  const stale = !!(data && updatedAt && now - updatedAt > DAY);
  const available = balance.data?.availableAmount ?? data?.availableBalance;

  // Période : ventes, revenus, connexions jour par jour.
  const days = series ? dailySales(series, new Date(), span) : null;
  const inPeriod = days ? days.slice(-period) : null;
  const net = inPeriod?.reduce((t, d) => t + d.net, 0) ?? 0;
  const count = inPeriod?.reduce((t, d) => t + d.count, 0) ?? 0;
  const commission = inPeriod?.reduce((t, d) => t + d.commission, 0) ?? 0;
  const dayLabel = (day: string) =>
    new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short" }).format(
      new Date(`${day}T12:00:00`),
    );
  const bars = (
    pick: (day: { net: number; count: number }) => number,
    unit: (value: number) => string,
  ): Bar[] =>
    (days ?? []).map((d) => ({
      key: d.day,
      value: pick(d),
      title: `${dayLabel(d.day)} · ${unit(pick(d))}`,
    }));
  const report = usage.data;
  const usageBars: Bar[] = usageChart.data
    ? usagePoints(usageChart.data).map((p) => ({
        key: p.periodStart,
        value: p.count,
        title: `${dayLabel(p.periodStart)} · ${formatNumber(p.count)}`,
      }))
    : [];
  const downloaded = report?.outputBytes ?? 0,
    uploaded = report?.inputBytes ?? 0;

  return (
    <div className="space-y-12 pt-10 lg:pt-14">
      {/* En-tête : le titre de la page en grand, l'organisation et la date dessous. */}
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2">
          <h1
            tabIndex={-1}
            className="font-heading text-3xl font-semibold tracking-tight outline-none"
          >
            Tableau de bord
          </h1>
          <p className="text-sm text-muted-foreground">
            {active.organizationName} ·{" "}
            {new Intl.DateTimeFormat("fr-FR", {
              weekday: "long",
              day: "numeric",
              month: "long",
            }).format(new Date())}
            {data && (
              <span className={cn(stale && "text-warning-foreground")}>
                {" · "}
                {stale ? "chiffres non recalculés depuis le " : "chiffres du "}
                {formatInstant(data.dataLastUpdatedAt)}
              </span>
            )}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            nativeButton={false}
            render={<Link to={offerRoutes.create(org, firstActiveSite?.id)} />}
          >
            Créer une offre
          </Button>
          <Button
            size="sm"
            nativeButton={false}
            render={<Link to={accessRoutes.create()} />}
          >
            Créer un accès
          </Button>
        </div>
      </header>

      {[sites, overview, salesReport].map(
        (query, index) =>
          query.isError && (
            <QueryFailure
              key={index}
              error={query.error}
              retry={() => void query.refetch()}
            />
          ),
      )}

      <div className="min-w-0">
        {/* Panneau de la période (OpenAI) : une seule surface découpée en cases. */}
        {salesReport.data && (
          <section aria-labelledby="period-title" className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2
                id="period-title"
                className="font-heading text-lg font-semibold tracking-tight"
              >
                Activité
              </h2>
              <PeriodToggle period={period} onPeriod={setPeriod} />
            </div>
            <MetricsPanel>
              <PanelCell
                label="Revenu net"
                value={formatMoney(net, currency)}
                detail={`après ${formatMoney(commission, currency)} de commission`}
                to={financeRoutes.overview(org)}
              >
                <Bars
                  label="Revenu net"
                  bars={bars(
                    (d) => d.net,
                    (v) => formatMoney(v, currency),
                  )}
                />
              </PanelCell>
              <PanelCell
                label="Ventes"
                value={formatNumber(count)}
                detail={
                  count
                    ? `panier moyen ${formatMoney(net / count, currency)}`
                    : "aucune vente sur la période"
                }
              >
                <Bars
                  label="Ventes"
                  bars={bars(
                    (d) => d.count,
                    (v) => `${v} vente${v > 1 ? "s" : ""}`,
                  )}
                />
              </PanelCell>
              <PanelCell
                label="Connexions"
                value={report ? formatNumber(report.sessions) : "—"}
                detail={
                  report?.authenticationFailures
                    ? `${formatNumber(report.authenticationFailures)} refusée${report.authenticationFailures > 1 ? "s" : ""}`
                    : "sessions ouvertes par vos clients"
                }
                to={networkUsageRoutes.overview(org)}
              >
                <Bars label="Connexions" bars={usageBars} />
              </PanelCell>
              {available !== undefined && (
                <PanelCell
                  className="bg-[color-mix(in_oklab,var(--color-primary)_7%,var(--color-background))]"
                  label="Solde disponible"
                  value={formatMoney(available, currency)}
                  detail={
                    balance.data?.reservedAmount
                      ? `${formatMoney(balance.data.reservedAmount, currency)} réservés pour un retrait`
                      : "disponible au retrait"
                  }
                >
                  <Button
                    size="sm"
                    nativeButton={false}
                    render={<Link to={financeRoutes.overview(org)} />}
                  >
                    Retirer vers mobile money
                  </Button>
                </PanelCell>
              )}
              <PanelCell
                label="Données consommées"
                value={report ? formatBytes(downloaded + uploaded) : "—"}
                detail="téléchargé et envoyé par vos clients"
                className={
                  available !== undefined ? "md:col-span-2" : "md:col-span-3"
                }
              >
                {report && downloaded + uploaded > 0 && (
                  <div className="space-y-3">
                    <div className="flex h-2 overflow-hidden rounded-full bg-muted">
                      <span
                        className="bg-primary"
                        style={{
                          width: `${(downloaded / (downloaded + uploaded)) * 100}%`,
                        }}
                      />
                      <span className="flex-1 bg-primary/35" />
                    </div>
                    <dl className="flex flex-wrap gap-x-6 gap-y-1 text-xs">
                      <div className="flex items-center gap-1.5">
                        <span
                          aria-hidden="true"
                          className="size-2 rounded-full bg-primary"
                        />
                        <dt className="text-muted-foreground">Téléchargé</dt>
                        <dd className="font-medium tabular-nums">
                          {formatBytes(downloaded)}
                        </dd>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span
                          aria-hidden="true"
                          className="size-2 rounded-full bg-primary/35"
                        />
                        <dt className="text-muted-foreground">Envoyé</dt>
                        <dd className="font-medium tabular-nums">
                          {formatBytes(uploaded)}
                        </dd>
                      </div>
                    </dl>
                  </div>
                )}
              </PanelCell>
            </MetricsPanel>
          </section>
        )}
      </div>
    </div>
  );
}
