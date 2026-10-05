import { useState } from "react";
import { useSearchParams } from "react-router";
import { useIsFetching, useQueryClient } from "@tanstack/react-query";
import { HugeiconsIcon } from "@hugeicons/react";
import { Calendar03Icon, RefreshIcon } from "@hugeicons/core-free-icons";
import type { Membership } from "@/features/memberships";
import { formatInstant } from "@/features/access";
import { EmptyState, PageHeader } from "@/shared/components/feedback";
import { ConfirmDialog } from "@/shared/components/confirm-dialog";
import { DataTable } from "@/shared/components/page-patterns";
import { AnimatedNumber } from "@/shared/components/animated-number";
import {
  MetricBlock,
  PeriodDelta,
  SideColumnHeader,
  SplitBar,
} from "@/shared/components/analytics-band";
import { StatusDot } from "@/shared/components/status-dot";
import { SuccessMoment } from "@/shared/components/success-moment";
import { Timeline, type TimelineEvent } from "@/shared/components/timeline";
import { formatNumber, formatPercent } from "@/shared/utils/format";
import { tenantKeys } from "@/shared/api/query-client";
import { QueryFailure } from "@/shared/components/query-feedback";
import { ApiError } from "@/shared/errors/api-error";
import { Button } from "@/shared/ui/button";
import { Skeleton } from "@/shared/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table";
import { cn } from "@/shared/utils/cn";
import {
  formatMoney,
  ledgerTypeLabels,
  networkLabels,
  salePaymentId,
  withdrawalStatusLabels,
  type Withdrawal,
} from "../model/finance";
import { dailySales, sum, type SalesMetric } from "../model/sales-report";
import { useSalesReport } from "../queries/sales-report";
import { SalesTrend } from "./sales-trend";
import {
  financeKeys,
  financePermissions,
  useBalance,
  useCancelWithdrawal,
  useLedger,
  useWithdrawals,
} from "../queries/finance";
import { RefundDialog } from "./refund-dialog";
import { WithdrawalDialog } from "./withdrawal-dialog";

type Tab = "transactions" | "withdrawals";

function Pager({
  page,
  totalPages,
  busy,
  onChange,
}: {
  page: number;
  totalPages: number;
  busy: boolean;
  onChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-end gap-2 px-(--page-gutter) py-3">
      <Button
        variant="outline"
        size="sm"
        disabled={page === 0 || busy}
        onClick={() => onChange(page - 1)}
      >
        Précédent
      </Button>
      <span className="text-sm text-muted-foreground" aria-live="polite">
        Page {page + 1} sur {totalPages}
      </span>
      <Button
        variant="outline"
        size="sm"
        disabled={page + 1 >= totalPages || busy}
        onClick={() => onChange(page + 1)}
      >
        Suivant
      </Button>
    </div>
  );
}

function Transactions({
  active,
  page,
  onPage,
}: {
  active: Membership;
  page: number;
  onPage: (p: number) => void;
}) {
  const ledger = useLedger(active, page);
  const canRefund = financePermissions(active).canManageFinance;
  if (ledger.isPending)
    return (
      <div className="p-(--page-gutter)">
        <Skeleton className="h-48 w-full" />
      </div>
    );
  if (ledger.isError)
    return (
      <div className="p-(--page-gutter)">
        <QueryFailure
          error={ledger.error}
          retry={() => void ledger.refetch()}
        />
      </div>
    );
  if (!ledger.data.totalElements)
    return (
      <EmptyState
        objectType="sale"
        title="Aucun mouvement"
        description="Les ventes confirmées, retraits et remboursements apparaîtront ici."
      />
    );
  return (
    <div>
      <DataTable variant="flush">
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Opération</TableHead>
            <TableHead className="text-right">Montant</TableHead>
            <TableHead className="text-right">Commission</TableHead>
            <TableHead className="text-right">Effet sur le solde</TableHead>
            <TableHead>
              <span className="sr-only">Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {ledger.data.content.map((tx) => {
            const meta = ledgerTypeLabels[tx.type] ?? {
              label: tx.type,
              sign: 0 as const,
            };
            const paymentId = salePaymentId(tx);
            const effect = meta.sign === 0 ? null : meta.sign * tx.netAmount;
            return (
              <TableRow key={tx.id}>
                <TableCell className="whitespace-nowrap text-muted-foreground">
                  {formatInstant(tx.createdAt)}
                </TableCell>
                <TableCell className="font-medium">{meta.label}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatMoney(tx.grossAmount, tx.currency)}
                </TableCell>
                <TableCell className="text-right tabular-nums text-muted-foreground">
                  {tx.commissionAmount
                    ? formatMoney(tx.commissionAmount, tx.currency)
                    : "—"}
                </TableCell>
                <TableCell
                  className={cn(
                    "text-right font-medium tabular-nums",
                    effect !== null && effect > 0 && "text-success-foreground",
                    effect !== null && effect < 0 && "text-destructive",
                  )}
                >
                  {effect === null
                    ? "—"
                    : `${effect > 0 ? "+" : "−"}${formatMoney(Math.abs(effect), tx.currency)}`}
                </TableCell>
                <TableCell className="text-right">
                  {canRefund && paymentId && (
                    <RefundDialog
                      active={active}
                      sale={tx}
                      paymentId={paymentId}
                    />
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </DataTable>
      <Pager
        page={page}
        totalPages={ledger.data.totalPages}
        busy={ledger.isFetching}
        onChange={onPage}
      />
    </div>
  );
}

function Withdrawals({
  active,
  page,
  onPage,
}: {
  active: Membership;
  page: number;
  onPage: (p: number) => void;
}) {
  const withdrawals = useWithdrawals(active, page);
  const cancel = useCancelWithdrawal(active);
  if (withdrawals.isPending)
    return (
      <div className="p-(--page-gutter)">
        <Skeleton className="h-48 w-full" />
      </div>
    );
  if (withdrawals.isError)
    return (
      <div className="p-(--page-gutter)">
        <QueryFailure
          error={withdrawals.error}
          retry={() => void withdrawals.refetch()}
        />
      </div>
    );
  if (!withdrawals.data.totalElements)
    return (
      <EmptyState
        objectType="withdrawal"
        title="Aucun retrait"
        description="Retirez vos fonds disponibles vers un portefeuille MTN ou Orange Money."
      />
    );
  return (
    <div>
      <DataTable variant="flush">
        <TableHeader>
          <TableRow>
            <TableHead>Demandé le</TableHead>
            <TableHead className="text-right">Montant</TableHead>
            <TableHead>Bénéficiaire</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead>
              <span className="sr-only">Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {withdrawals.data.content.map((w) => {
            const status = withdrawalStatusLabels[w.status] ?? {
              label: w.status,
              tone: "neutral" as const,
            };
            return (
              <TableRow key={w.id}>
                <TableCell className="whitespace-nowrap text-muted-foreground">
                  {formatInstant(w.requestedAt)}
                </TableCell>
                <TableCell className="text-right font-medium tabular-nums">
                  {formatMoney(w.amount, w.currency)}
                </TableCell>
                <TableCell>
                  <div className="text-sm">{w.recipientName}</div>
                  <div className="text-xs text-muted-foreground">
                    {networkLabels[w.network] ?? w.network} · {w.maskedMsisdn}
                  </div>
                </TableCell>
                <TableCell>
                  <StatusDot
                    label={status.label}
                    tone={status.tone}
                    live={w.status === "PROCESSING"}
                  />
                  {(w.failureReason ||
                    (w.status === "REJECTED" && w.decisionReason)) && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {w.status === "REJECTED"
                        ? w.decisionReason
                        : "Le versement n’a pas abouti ; le montant est de nouveau disponible."}
                    </p>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  {w.status === "PENDING_APPROVAL" && (
                    <ConfirmDialog
                      trigger="Annuler"
                      confirmLabel="Annuler le retrait"
                      destructive
                      title="Annuler ce retrait ?"
                      description={`${formatMoney(w.amount, w.currency)} redeviendront disponibles immédiatement.`}
                      onConfirm={async () => {
                        await cancel.mutateAsync(w.id);
                      }}
                    />
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </DataTable>
      <Pager
        page={page}
        totalPages={withdrawals.data.totalPages}
        busy={withdrawals.isFetching}
        onChange={onPage}
      />
    </div>
  );
}

/**
 * Étapes d'un retrait : demandé → approuvé → versé. Les dates viennent du backend ; une étape
 * non atteinte est en pointillé, un refus ou un échec termine la frise.
 */
export function withdrawalTimeline(w: Withdrawal): TimelineEvent[] {
  const events: TimelineEvent[] = [
    {
      id: "requested",
      title: "Demandé",
      description: `${networkLabels[w.network] ?? w.network} · ${w.maskedMsisdn}`,
      at: w.requestedAt,
    },
  ];
  if (w.status === "CANCELLED")
    return [...events, { id: "cancelled", title: "Annulé", tone: "neutral" }];
  if (w.status === "REJECTED")
    return [
      ...events,
      {
        id: "rejected",
        title: "Refusé",
        description: w.decisionReason ?? undefined,
        at: w.decidedAt,
        tone: "danger",
      },
    ];
  const approved = w.status !== "PENDING_APPROVAL";
  events.push({
    id: "approved",
    title: approved ? "Approuvé" : "En attente d’approbation",
    at: approved ? w.decidedAt : undefined,
    upcoming: !approved,
  });
  if (w.status === "FAILED" || w.status === "REVERSED")
    return [
      ...events,
      {
        id: "failed",
        title: w.status === "FAILED" ? "Versement échoué" : "Versement annulé",
        description: "Le montant est de nouveau disponible.",
        at: w.completedAt,
        tone: "danger",
      },
    ];
  events.push({
    id: "paid",
    title: w.status === "COMPLETED" ? "Versé" : "Versement",
    description:
      w.status === "PROCESSING"
        ? "Transfert en cours chez l’opérateur."
        : undefined,
    at: w.completedAt,
    tone: w.status === "PROCESSING" ? "info" : "success",
    upcoming: w.status !== "COMPLETED",
  });
  return events;
}

const periods = [7, 30, 90] as const;
type Period = (typeof periods)[number];

const metricOptions: { value: SalesMetric; label: string }[] = [
  { value: "net", label: "Revenu net" },
  { value: "gross", label: "Chiffre d’affaires" },
  { value: "commission", label: "Commissions" },
];

/** Évolution par rapport à la période précédente ; rien sans base de comparaison. */
/** Mini-histogramme décoratif : la valeur exacte reste dans le texte voisin. */
function DailyBars({ values }: { values: number[] }) {
  const max = Math.max(...values, 0);
  return (
    <div aria-hidden="true" className="flex h-10 items-end gap-px">
      {values.map((value, index) => (
        <span
          key={index}
          className={cn(
            "min-w-0 flex-1 rounded-[2px]",
            value > 0 ? "bg-chart-3" : "bg-muted",
          )}
          style={{
            height: value > 0 && max > 0 ? `${(value / max) * 100}%` : "2px",
          }}
        />
      ))}
    </div>
  );
}

/** Solde : disponible, réservé (retraits en cours) et total déjà versé. */
function BalanceBlock({ balance }: { balance: ReturnType<typeof useBalance> }) {
  if (balance.isPending)
    return (
      <div className="space-y-3 px-(--page-gutter) py-5 lg:px-5">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-7 w-36" />
        <Skeleton className="h-2 w-full" />
      </div>
    );
  if (balance.isError)
    return (
      <div className="px-(--page-gutter) py-5 lg:px-5">
        <QueryFailure
          error={balance.error}
          retry={() => void balance.refetch()}
        />
      </div>
    );
  const data = balance.data;
  const money = (value: number) => formatMoney(value, data.currency);
  return (
    <MetricBlock
      label="Solde disponible"
      value={<AnimatedNumber value={data.availableAmount} format={money} />}
    >
      <SplitBar
        first={{ label: "Disponible", value: data.availableAmount }}
        second={{ label: "Réservé", value: data.reservedAmount }}
        format={money}
        extra={{ label: "Total versé", value: money(data.paidOutAmount) }}
      />
    </MetricBlock>
  );
}

/**
 * Panneau d'analyse : courbe du montant choisi sur la période à gauche, colonne d'indicateurs
 * (solde, ventes, paiements) à droite. La période précédente sert aux évolutions.
 */
function FinanceAnalytics({
  active,
  period,
  balance,
}: {
  active: Membership;
  period: Period;
  balance: ReturnType<typeof useBalance>;
}) {
  const [metric, setMetric] = useState<SalesMetric>("net");
  const report = useSalesReport(active, period);
  const extended = useSalesReport(active, period * 2);
  const currency = report.data?.currency ?? balance.data?.currency ?? "XAF";
  const days = dailySales(
    extended.data?.series ?? report.data?.series ?? [],
    new Date(),
    period * 2,
  );
  const previous = days.slice(0, period);
  const current = days.slice(period);
  const money = (value: number) => formatMoney(value, currency);
  const label =
    metricOptions.find((option) => option.value === metric)?.label ?? "";
  const confirmed = report.data?.confirmedPayments ?? 0;
  const failed = report.data?.failedPayments ?? 0;
  const attempts = confirmed + failed;

  return (
    <section
      aria-labelledby="finance-analytics"
      className="border-b lg:grid lg:grid-cols-[minmax(0,1fr)_20rem]"
    >
      {/* Colonne en flex : le graphique prend toute la hauteur laissée par l'en-tête. */}
      <div className="flex min-w-0 flex-col gap-6 px-(--page-gutter) py-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <h2
              id="finance-analytics"
              className="text-sm text-muted-foreground"
            >
              {label} · {period} jours
            </h2>
            {report.isPending ? (
              <Skeleton className="h-9 w-44" />
            ) : (
              <p className="text-3xl font-semibold tracking-tight tabular-nums">
                <AnimatedNumber value={sum(current, metric)} format={money} />
              </p>
            )}
            {extended.data !== undefined && (
              <PeriodDelta
                current={sum(current, metric)}
                previous={sum(previous, metric)}
                period={`${period} jours précédents`}
              />
            )}
          </div>
          <Tabs
            value={metric}
            onValueChange={(value) => setMetric(value as SalesMetric)}
          >
            <TabsList aria-label="Montant affiché">
              {metricOptions.map((option) => (
                <TabsTrigger key={option.value} value={option.value}>
                  {option.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
        {report.isPending ? (
          <Skeleton className="min-h-64 w-full flex-1" />
        ) : report.isError ? (
          <QueryFailure
            error={report.error}
            retry={() => void report.refetch()}
          />
        ) : (
          <SalesTrend
            days={current}
            currency={currency}
            metric={metric}
            emptyDescription="Les encaissements des ventes confirmées apparaîtront ici."
            fill
          />
        )}
      </div>
      <aside
        aria-label="Indicateurs"
        className="divide-y border-t lg:border-t-0 lg:border-l"
      >
        <BalanceBlock balance={balance} />
        <MetricBlock
          label={`Ventes · ${period} jours`}
          value={formatNumber(sum(current, "count"))}
        >
          {extended.data !== undefined && (
            <PeriodDelta
              current={sum(current, "count")}
              previous={sum(previous, "count")}
              period={`${period} jours précédents`}
            />
          )}
          <DailyBars values={current.map((day) => day.count)} />
        </MetricBlock>
        <MetricBlock
          label="Paiements réussis"
          value={attempts ? formatPercent(confirmed / attempts) : "—"}
        >
          <p className="text-xs text-muted-foreground">
            {formatNumber(confirmed)} réussis · {formatNumber(failed)} échoués
          </p>
        </MetricBlock>
      </aside>
    </section>
  );
}

function payoutKey(id: string) {
  return `ronetz.finance.payout-seen.${id}`;
}

/** Bandeau de réussite : un versement effectué depuis moins de 7 jours, jusqu'à ce qu'on le ferme. */
function PayoutCelebration({ active }: { active: Membership }) {
  const withdrawals = useWithdrawals(active, 0);
  const latest = withdrawals.data?.content[0];
  const [seen, setSeen] = useState<string | null>(null);
  if (!latest) return null;
  let alreadySeen = seen === latest.id;
  try {
    alreadySeen ||= localStorage.getItem(payoutKey(latest.id)) === "1";
  } catch {
    alreadySeen = true;
  }
  const recent =
    latest.status === "COMPLETED" &&
    !!latest.completedAt &&
    Date.now() - new Date(latest.completedAt).getTime() < 7 * 86_400_000;
  if (!recent || alreadySeen) return null;
  return (
    <div className="border-b px-(--page-gutter) py-4">
      <SuccessMoment
        title="Versement effectué"
        description={`${formatMoney(latest.amount, latest.currency)} versés à ${latest.recipientName}.`}
        actions={
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              try {
                localStorage.setItem(payoutKey(latest.id), "1");
              } catch {
                /* préférence locale seulement */
              }
              setSeen(latest.id);
            }}
          >
            Fermer
          </Button>
        }
      />
    </div>
  );
}

/** Dernier retrait et son avancement, dans la colonne de droite. */
function LatestWithdrawal({
  active,
  onShowAll,
}: {
  active: Membership;
  onShowAll: () => void;
}) {
  const withdrawals = useWithdrawals(active, 0);
  const latest = withdrawals.data?.content[0];
  return (
    <section
      aria-labelledby="latest-withdrawal"
      className="border-t lg:border-t-0 lg:border-l"
    >
      <SideColumnHeader
        id="latest-withdrawal"
        title="Dernier retrait"
        aside={
          latest && (
            <span className="font-medium tabular-nums">
              {formatMoney(latest.amount, latest.currency)}
            </span>
          )
        }
      />
      <div className="space-y-4 px-(--page-gutter) py-5 lg:px-5">
        {withdrawals.isPending ? (
          <Skeleton className="h-32 w-full" />
        ) : latest ? (
          <>
            <Timeline events={withdrawalTimeline(latest)} />
            <Button variant="outline" size="sm" onClick={onShowAll}>
              Voir tous les retraits
            </Button>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            Vos retraits et leur avancement apparaîtront ici.
          </p>
        )}
      </div>
    </section>
  );
}

export function FinanceOverview({ active }: { active: Membership }) {
  const [params, setParams] = useSearchParams();
  const client = useQueryClient();
  const tab: Tab =
    params.get("tab") === "withdrawals" ? "withdrawals" : "transactions";
  const page = /^\d{1,5}$/.test(params.get("page") ?? "")
    ? Number(params.get("page"))
    : 0;
  const period: Period =
    periods.find((value) => String(value) === params.get("period")) ?? 30;
  const balance = useBalance(active);
  const permissions = financePermissions(active);
  const fetching =
    useIsFetching({ queryKey: financeKeys.all(active.organizationId) }) +
    useIsFetching({
      queryKey: tenantKeys.resource(active.organizationId, "reports", "sales"),
    });

  function update(next: { tab?: Tab; page?: number; period?: Period }) {
    const search = new URLSearchParams(params);
    if (next.tab) {
      search.set("tab", next.tab);
      search.delete("page");
    }
    if (next.page !== undefined) {
      if (next.page) search.set("page", String(next.page));
      else search.delete("page");
    }
    if (next.period) {
      if (next.period === 30) search.delete("period");
      else search.set("period", String(next.period));
    }
    setParams(search, { preventScrollReset: true });
  }

  function refresh() {
    void client.invalidateQueries({
      queryKey: financeKeys.all(active.organizationId),
    });
    void client.invalidateQueries({
      queryKey: tenantKeys.resource(active.organizationId, "reports", "sales"),
    });
  }

  if (!permissions.canViewFinance)
    return <QueryFailure error={new ApiError("http", 403)} />;

  return (
    <>
      <PageHeader
        title="Finances"
        actions={
          <>
            <Select
              value={String(period)}
              onValueChange={(value) =>
                update({ period: Number(value) as Period })
              }
            >
              <SelectTrigger aria-label="Période" className="gap-2">
                <HugeiconsIcon
                  icon={Calendar03Icon}
                  strokeWidth={1.75}
                  aria-hidden="true"
                  className="size-4 text-muted-foreground"
                />
                <SelectValue>{`${period} derniers jours`}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {periods.map((value) => (
                  <SelectItem key={value} value={String(value)}>
                    {value} derniers jours
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="icon"
              title="Actualiser"
              disabled={fetching > 0}
              onClick={refresh}
            >
              <HugeiconsIcon
                icon={RefreshIcon}
                strokeWidth={1.75}
                className={cn(
                  fetching > 0 && "animate-spin motion-reduce:animate-none",
                )}
              />
              <span className="sr-only">Actualiser</span>
            </Button>
            {permissions.canManageFinance && balance.data && (
              <WithdrawalDialog active={active} balance={balance.data} />
            )}
          </>
        }
      />

      {/* Collé sous l'en-tête et aux bords de la page : sections séparées par des traits. */}
      <div className="page-bleed -mt-6">
        <PayoutCelebration active={active} />

        <FinanceAnalytics active={active} period={period} balance={balance} />

        <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_20rem]">
          <section aria-label="Historique" className="min-w-0">
            <Tabs
              value={tab}
              onValueChange={(value) => update({ tab: value as Tab })}
            >
              <TabsList variant="line" className="border-b px-(--page-gutter)">
                <TabsTrigger value="transactions">Mouvements</TabsTrigger>
                <TabsTrigger value="withdrawals">Retraits</TabsTrigger>
              </TabsList>
            </Tabs>
            {tab === "transactions" ? (
              <Transactions
                active={active}
                page={page}
                onPage={(p) => update({ page: p })}
              />
            ) : (
              <Withdrawals
                active={active}
                page={page}
                onPage={(p) => update({ page: p })}
              />
            )}
          </section>
          <LatestWithdrawal
            active={active}
            onShowAll={() => update({ tab: "withdrawals" })}
          />
        </div>
      </div>
    </>
  );
}
