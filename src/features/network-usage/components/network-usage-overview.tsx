import { lazy, Suspense, useId, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { HugeiconsIcon } from "@hugeicons/react";
import { Calendar03Icon, RefreshIcon } from "@hugeicons/core-free-icons";
import type { Membership } from "@/features/memberships";
import { useSites } from "@/features/site";
import { formatInstant } from "@/features/access";
import {
  EmptyState,
  PageHeader,
  PageLoading,
} from "@/shared/components/feedback";
import { DataTable } from "@/shared/components/page-patterns";
import { AnimatedNumber } from "@/shared/components/animated-number";
import {
  MetricBlock,
  PeriodDelta,
  SideColumnHeader,
  SplitBar,
} from "@/shared/components/analytics-band";
import { IconTile } from "@/shared/components/icon-tile";
import { RelativeTime } from "@/shared/components/relative-time";
import { StatusDot } from "@/shared/components/status-dot";
import { Skeleton } from "@/shared/ui/skeleton";
import { formatPercent } from "@/shared/utils/format";
import { cn } from "@/shared/utils/cn";
import { QueryFailure } from "@/shared/components/query-feedback";
import { ApiError } from "@/shared/errors/api-error";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table";
import {
  defaultUsageFilters,
  lastDaysFilters,
  periodDays,
  periodError,
  previousPeriod,
  ROUTER_PAGE_SIZE,
  usagePoints,
  type AccessReport,
  type UsageFilters,
} from "../model/network-usage";
import {
  networkUsageKeys,
  networkUsagePermissions,
  useAccessUsageSummary,
  useRouterUsage,
  useSitePerformance,
} from "../queries/network-usage";
import {
  formatBytes,
  formatCount,
  formatDay,
  successRate,
} from "../formatters/units";

const UsageChart = lazy(() => import("./usage-chart"));

type Preset = "7" | "30" | "90" | "custom";
const presets: { value: Preset; label: string }[] = [
  { value: "7", label: "7 derniers jours" },
  { value: "30", label: "30 derniers jours" },
  { value: "90", label: "90 derniers jours" },
  { value: "custom", label: "Période personnalisée" },
];

/** Sessions par jour, sur toute la hauteur laissée libre ; état vide honnête sans série. */
function SessionsTrend({ report }: { report: AccessReport }) {
  const points = usagePoints(report);
  if (points.length < 2)
    return (
      <div className="flex min-h-64 flex-1 items-center">
        <EmptyState
          objectType="usage"
          title="Évolution pas encore disponible"
          description="Le backend ne fournit pas encore la série quotidienne des sessions pour cette période. Le graphique apparaîtra dès qu’elle sera publiée."
        />
      </div>
    );
  return (
    <div className="relative min-h-64 flex-1">
      <Suspense
        fallback={<Skeleton className="absolute inset-0 h-full w-full" />}
      >
        <UsageChart
          points={points}
          className="absolute inset-0 h-full w-full"
        />
      </Suspense>
    </div>
  );
}

/** Bornes libres de la période, sur une bande sous l'en-tête. */
function CustomPeriod({
  filters,
  onChange,
}: {
  filters: UsageFilters;
  onChange: (next: UsageFilters) => void;
}) {
  const id = useId();
  const error = periodError(filters);
  return (
    <div className="space-y-2 border-b px-(--page-gutter) py-3">
      <div className="flex flex-wrap items-center gap-3">
        <label htmlFor={`${id}-from`} className="text-sm text-muted-foreground">
          Du
        </label>
        <Input
          id={`${id}-from`}
          type="date"
          className="w-auto"
          value={filters.from}
          max={filters.to}
          aria-invalid={error !== null}
          onChange={(event) =>
            onChange({ ...filters, from: event.target.value })
          }
        />
        <label htmlFor={`${id}-to`} className="text-sm text-muted-foreground">
          au
        </label>
        <Input
          id={`${id}-to`}
          type="date"
          className="w-auto"
          value={filters.to}
          min={filters.from}
          aria-invalid={error !== null}
          onChange={(event) => onChange({ ...filters, to: event.target.value })}
        />
      </div>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

/**
 * Bande d'analyse : sessions de la période et leur courbe à gauche ; volume,
 * authentifications et accès dans la colonne de droite.
 */
function UsageAnalytics({
  report,
  previous,
  days,
  loading,
}: {
  report: AccessReport;
  previous?: AccessReport;
  days: number;
  loading: boolean;
}) {
  const comparedTo = `${days} jours précédents`;
  const attempts =
    report.authenticationSuccesses + report.authenticationFailures;
  const volume = report.inputBytes + report.outputBytes;
  return (
    <section
      aria-labelledby="usage-analytics"
      aria-busy={loading}
      className="border-b lg:grid lg:grid-cols-[minmax(0,1fr)_20rem]"
    >
      <div className="flex min-w-0 flex-col gap-6 px-(--page-gutter) py-6">
        <div className="space-y-1">
          <h2 id="usage-analytics" className="text-sm text-muted-foreground">
            Sessions · {days} jours
            {loading && (
              <span role="status" className="ml-2">
                · actualisation…
              </span>
            )}
          </h2>
          <p className="text-3xl font-semibold tracking-tight tabular-nums">
            <AnimatedNumber value={report.sessions} format={formatCount} />
          </p>
          {previous && (
            <PeriodDelta
              current={report.sessions}
              previous={previous.sessions}
              period={comparedTo}
            />
          )}
        </div>
        <SessionsTrend report={report} />
      </div>
      <aside
        aria-label="Indicateurs"
        className="divide-y border-t lg:border-t-0 lg:border-l"
      >
        <MetricBlock
          label="Volume de données"
          value={<AnimatedNumber value={volume} format={formatBytes} />}
        >
          {previous && (
            <PeriodDelta
              current={volume}
              previous={previous.inputBytes + previous.outputBytes}
              period={comparedTo}
            />
          )}
          <SplitBar
            first={{ label: "Reçus", value: report.outputBytes }}
            second={{ label: "Envoyés", value: report.inputBytes }}
            format={formatBytes}
          />
        </MetricBlock>
        <MetricBlock
          label="Authentifications réussies"
          value={
            attempts
              ? formatPercent(report.authenticationSuccesses / attempts, 1)
              : "—"
          }
        >
          <p className="text-xs text-muted-foreground">
            {formatCount(report.authenticationSuccesses)} succès ·{" "}
            {formatCount(report.authenticationFailures)} échecs
          </p>
        </MetricBlock>
        <MetricBlock label="Accès actifs" value={formatCount(report.active)}>
          <dl className="space-y-1.5 text-xs">
            {(
              [
                ["Créés", report.created],
                ["Délivrés", report.provisioned],
                ["Expirés", report.expired],
                ["Suspendus", report.suspended],
                ["Révoqués", report.revoked],
              ] as const
            ).map(([label, value]) => (
              <div
                key={label}
                className="flex items-center justify-between gap-2"
              >
                <dt className="text-muted-foreground">{label}</dt>
                <dd className="tabular-nums">{formatCount(value)}</dd>
              </div>
            ))}
          </dl>
        </MetricBlock>
      </aside>
    </section>
  );
}

/** Instantané par site : routeurs, offres, ventes et accès. */
function SiteUsageTable({
  active,
  siteNames,
}: {
  active: Membership;
  siteNames: Map<string, string>;
}) {
  const query = useSitePerformance(active);
  if (query.isPending)
    return (
      <div className="p-(--page-gutter)">
        <Skeleton className="h-48 w-full" />
      </div>
    );
  if (query.isError)
    return (
      <div className="p-(--page-gutter)">
        <QueryFailure error={query.error} retry={() => void query.refetch()} />
      </div>
    );
  const rows = [...query.data.values()];
  if (!rows.length)
    return (
      <EmptyState
        objectType="site"
        title="Aucun site mesuré"
        description="Les indicateurs par site apparaîtront dès leur première agrégation."
      />
    );
  return (
    <DataTable variant="flush">
      <TableHeader>
        <TableRow>
          <TableHead>Site</TableHead>
          <TableHead>Routeurs en ligne</TableHead>
          <TableHead className="text-right">Offres actives</TableHead>
          <TableHead className="text-right">Achats</TableHead>
          <TableHead className="text-right">Paiements réussis</TableHead>
          <TableHead className="text-right">Accès</TableHead>
          <TableHead>Mis à jour</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.siteId}>
            <TableCell className="font-medium">
              <span className="flex items-center gap-2.5">
                <IconTile type="site" size="sm" />
                {row.siteName ?? siteNames.get(row.siteId) ?? "Site sans nom"}
              </span>
            </TableCell>
            <TableCell>
              <ShareBar
                label={`Routeurs en ligne sur ${row.siteName ?? "ce site"}`}
                ratio={
                  row.routerCount
                    ? row.onlineRouterCount / row.routerCount
                    : null
                }
                text={`${formatCount(row.onlineRouterCount)} / ${formatCount(row.routerCount)}`}
              />
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {formatCount(row.activeOfferCount)}
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {formatCount(row.purchaseCount)}
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {formatCount(row.successfulPaymentCount)}
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {formatCount(row.accessCount)}
            </TableCell>
            <TableCell className="text-muted-foreground">
              <RelativeTime value={row.lastUpdatedAt} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </DataTable>
  );
}

/** Contexte des chiffres, dans la colonne de droite. */
function AboutData({ report }: { report?: AccessReport }) {
  return (
    <section
      aria-labelledby="usage-about"
      className="border-t lg:border-t-0 lg:border-l"
    >
      <SideColumnHeader id="usage-about" title="À propos des données" />
      <div className="space-y-4 px-(--page-gutter) py-5 text-sm text-muted-foreground lg:px-5">
        {report && (
          <p>
            Du {formatDay(report.period.from)} au {formatDay(report.period.to)}{" "}
            ({report.period.timeZone}), rapport généré le{" "}
            {formatInstant(report.generatedAt)}. Calculé à partir des synthèses
            quotidiennes : l’activité du jour peut ne pas encore y figurer.
          </p>
        )}
        <p>
          Les tableaux par routeur et par site sont des cumuls, indépendants de
          la période choisie. Aucune donnée individuelle de session n’est
          affichée.
        </p>
        <p>
          Pas encore disponibles : liste et déconnexion des sessions en cours,
          export, répartition horaire.
        </p>
      </div>
    </section>
  );
}

/** Jauge compacte de tableau : barre courte et valeur, sans libellé visible. */
function ShareBar({
  ratio,
  label,
  text,
}: {
  ratio: number | null;
  label: string;
  /** Texte affiché ; par défaut le pourcentage. */
  text?: string;
}) {
  const value = ratio ?? 0;
  return (
    <div className="flex items-center gap-2">
      <div
        role="meter"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(value * 100)}
        aria-valuetext={text ?? formatPercent(value)}
        className="h-1.5 w-16 overflow-hidden rounded-full bg-muted"
      >
        <div
          className="h-full rounded-full bg-chart-3 transition-[width] duration-300"
          style={{ width: `${value * 100}%` }}
        />
      </div>
      <span className="text-xs text-muted-foreground tabular-nums">
        {ratio === null ? "—" : (text ?? formatPercent(value))}
      </span>
    </div>
  );
}

const routerStatusLabels: Record<string, string> = {
  ONLINE: "En ligne",
  OFFLINE: "Hors ligne",
  UNKNOWN: "Inconnue",
};
function routerStatusLabel(status: string | null) {
  return status ? (routerStatusLabels[status] ?? status) : "Inconnue";
}

function RouterUsageTable({
  active,
  siteNames,
}: {
  active: Membership;
  siteNames: Map<string, string>;
}) {
  const [page, setPage] = useState(0);
  const query = useRouterUsage(active, page, ROUTER_PAGE_SIZE);
  if (query.isPending)
    return (
      <div className="p-(--page-gutter)">
        <Skeleton className="h-48 w-full" />
      </div>
    );
  if (query.isError && !query.data)
    return (
      <div className="p-(--page-gutter)">
        <QueryFailure error={query.error} retry={() => void query.refetch()} />
      </div>
    );
  const rows = query.data ?? [];
  const pageVolume = rows.reduce(
    (sum, row) => sum + row.totalInputBytes + row.totalOutputBytes,
    0,
  );
  if (!rows.length && page === 0)
    return (
      <EmptyState
        objectType="router"
        title="Aucun routeur mesuré"
        description="Aucune consommation n’a encore été agrégée pour vos routeurs."
      />
    );
  return (
    <div>
      <DataTable variant="flush">
        <TableHeader>
          <TableRow>
            <TableHead>Routeur</TableHead>
            <TableHead>Site</TableHead>
            <TableHead>État</TableHead>
            <TableHead className="text-right">Sessions</TableHead>
            <TableHead className="text-right">Volume</TableHead>
            <TableHead>Part du volume</TableHead>
            <TableHead className="text-right">Auth. réussies</TableHead>
            <TableHead>Mis à jour</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.routerId}>
              <TableCell className="font-medium">
                <span className="flex items-center gap-2.5">
                  <IconTile type="router" size="sm" />
                  {row.routerName ?? "Routeur sans nom"}
                </span>
              </TableCell>
              <TableCell>
                {(row.siteId && siteNames.get(row.siteId)) ?? "—"}
              </TableCell>
              <TableCell>
                <StatusDot
                  label={routerStatusLabel(row.status)}
                  tone={
                    row.status === "ONLINE"
                      ? "success"
                      : row.status === "OFFLINE"
                        ? "warning"
                        : "neutral"
                  }
                  live={row.status === "ONLINE"}
                />
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {formatCount(row.totalSessionCount)}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {formatBytes(row.totalInputBytes + row.totalOutputBytes)}
              </TableCell>
              <TableCell>
                <ShareBar
                  label={`Part du volume de la page pour ${row.routerName ?? "ce routeur"}`}
                  ratio={
                    pageVolume
                      ? (row.totalInputBytes + row.totalOutputBytes) /
                        pageVolume
                      : null
                  }
                />
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {successRate(
                  row.authenticationSuccessCount,
                  row.authenticationFailureCount,
                ) ?? "—"}
              </TableCell>
              <TableCell className="text-muted-foreground">
                <RelativeTime value={row.lastUpdatedAt} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </DataTable>
      <div className="flex items-center justify-end gap-2 px-(--page-gutter) py-3">
        <Button
          variant="outline"
          size="sm"
          disabled={page === 0 || query.isFetching}
          onClick={() => setPage((current) => Math.max(0, current - 1))}
        >
          Précédent
        </Button>
        <span className="text-sm text-muted-foreground">Page {page + 1}</span>
        <Button
          variant="outline"
          size="sm"
          // Le backend renvoie une liste sans total : une page pleine suggère une suite.
          disabled={rows.length < ROUTER_PAGE_SIZE || query.isFetching}
          onClick={() => setPage((current) => current + 1)}
        >
          Suivant
        </Button>
      </div>
    </div>
  );
}

export function NetworkUsageOverview({ active }: { active: Membership }) {
  const client = useQueryClient();
  const [preset, setPreset] = useState<Preset>("30");
  const [filters, setFilters] = useState<UsageFilters>(() =>
    defaultUsageFilters(),
  );
  const [tab, setTab] = useState<"routers" | "sites">("routers");
  const sites = useSites(active);
  const valid = periodError(filters) === null;
  const summary = useAccessUsageSummary(active, filters);
  const previous = useAccessUsageSummary(
    active,
    valid ? previousPeriod(filters) : filters,
  );
  const siteNames = useMemo(
    () => new Map((sites.data ?? []).map((site) => [site.id, site.name])),
    [sites.data],
  );

  if (!networkUsagePermissions(active).canViewNetworkUsage)
    return <QueryFailure error={new ApiError("http", 403)} />;
  if (sites.isPending) return <PageLoading variant="overview" />;

  function choosePreset(next: Preset) {
    setPreset(next);
    if (next !== "custom")
      setFilters(lastDaysFilters(Number(next), filters.siteId));
  }

  const fetching = summary.isFetching || previous.isFetching;

  return (
    <>
      <PageHeader
        title="Consommation réseau"
        actions={
          <>
            <Select
              value={filters.siteId ?? "ALL"}
              onValueChange={(value) =>
                setFilters({
                  ...filters,
                  siteId: !value || value === "ALL" ? null : value,
                })
              }
            >
              <SelectTrigger aria-label="Site" className="max-w-56">
                <SelectValue>
                  {() =>
                    (sites.data ?? []).find(
                      (site) => site.id === filters.siteId,
                    )?.name ?? "Tous les sites"
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tous les sites</SelectItem>
                {(sites.data ?? []).map((site) => (
                  <SelectItem key={site.id} value={site.id}>
                    {site.name}
                    {site.status !== "ACTIVE" ? " · Inactif" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={preset}
              onValueChange={(value) => value && choosePreset(value as Preset)}
            >
              <SelectTrigger aria-label="Période" className="gap-2">
                <HugeiconsIcon
                  icon={Calendar03Icon}
                  strokeWidth={1.75}
                  aria-hidden="true"
                  className="size-4 text-muted-foreground"
                />
                <SelectValue>
                  {() => presets.find((p) => p.value === preset)?.label}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {presets.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="icon"
              title="Actualiser"
              disabled={fetching || !valid}
              onClick={() =>
                void client.invalidateQueries({
                  queryKey: networkUsageKeys.all(active.organizationId),
                })
              }
            >
              <HugeiconsIcon
                icon={RefreshIcon}
                strokeWidth={1.75}
                className={cn(
                  fetching && "animate-spin motion-reduce:animate-none",
                )}
              />
              <span className="sr-only">Actualiser</span>
            </Button>
          </>
        }
      />

      {/* Collé sous l'en-tête et aux bords de la page : bandes séparées par des traits. */}
      <div className="page-bleed -mt-6">
        {preset === "custom" && (
          <CustomPeriod filters={filters} onChange={setFilters} />
        )}

        {summary.isPending && valid ? (
          <div className="border-b px-(--page-gutter) py-6">
            <PageLoading variant="overview" />
          </div>
        ) : summary.isError && !summary.data ? (
          <div className="border-b px-(--page-gutter) py-6">
            <QueryFailure
              error={summary.error}
              retry={() => void summary.refetch()}
            />
          </div>
        ) : summary.data ? (
          <UsageAnalytics
            report={summary.data}
            previous={
              valid && !previous.isPlaceholderData ? previous.data : undefined
            }
            days={periodDays(summary.data.period)}
            loading={summary.isPlaceholderData}
          />
        ) : null}

        <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_20rem]">
          <section aria-label="Détail" className="min-w-0">
            <Tabs
              value={tab}
              onValueChange={(value) => setTab(value as "routers" | "sites")}
            >
              <TabsList variant="line" className="border-b px-(--page-gutter)">
                <TabsTrigger value="routers">Par routeur</TabsTrigger>
                <TabsTrigger value="sites">Par site</TabsTrigger>
              </TabsList>
            </Tabs>
            {tab === "routers" ? (
              <RouterUsageTable active={active} siteNames={siteNames} />
            ) : (
              <SiteUsageTable active={active} siteNames={siteNames} />
            )}
          </section>
          <AboutData report={summary.data} />
        </div>
      </div>
    </>
  );
}
