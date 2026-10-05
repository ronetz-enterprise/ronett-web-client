import { useState } from "react";
import { Link, useSearchParams } from "react-router";
import { PageLoading, EmptyState } from "@/shared/components/feedback";
import { CopyableId } from "@/shared/components/copyable-id";
import { RelativeTime } from "@/shared/components/relative-time";
import { StatusDot } from "@/shared/components/status-dot";
import { Timeline, type TimelineEvent } from "@/shared/components/timeline";
import { Button } from "@/shared/ui/button";
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
import { formatDateTime, formatMoney } from "../formatters/platform";
import {
  anomalyStatusLabels,
  platformCapabilities,
  platformLabel,
  platformRoutes,
  withdrawalStatusLabels,
  withdrawalStatusOptions,
  withdrawalStatusTones,
  type AnomalyAction,
  type PaymentAnomaly,
  type PlatformSession,
  type PlatformWithdrawal,
  type WithdrawalDecision,
} from "../model/platform";
import {
  useAnomalyAction,
  usePaymentAnomalies,
  usePlatformWithdrawals,
  useWithdrawalDecision,
} from "../queries/platform";
import { DecisionDialog } from "./decision-dialog";
import {
  PlatformFailure,
  PlatformPageHeader,
  PlatformPagination,
  PlatformSection,
  PlatformTable,
} from "./platform-shared";

const networkLabels: Record<string, string> = {
  MTN: "MTN Mobile Money",
  ORANGEMONEY: "Orange Money",
};

/** Ancienneté en jours : une demande de plus de 2 jours est signalée. */
function ageInDays(requestedAt: string) {
  return Math.floor(
    (Date.now() - new Date(requestedAt).getTime()) / 86_400_000,
  );
}

function WithdrawalQueue({ session }: { session: PlatformSession }) {
  const [params, setParams] = useSearchParams();
  const status =
    withdrawalStatusOptions.find((value) => value === params.get("statut")) ??
    "PENDING_APPROVAL";
  const page = /^\d{1,5}$/.test(params.get("page") ?? "")
    ? Number(params.get("page"))
    : 0;
  const query = usePlatformWithdrawals(session, status, page);
  const decision = useWithdrawalDecision();
  const canDecide = platformCapabilities(session).canApproveWithdrawals;
  const [pending, setPending] = useState<{
    withdrawal: PlatformWithdrawal;
    decision: WithdrawalDecision;
  } | null>(null);

  function update(next: Record<string, string | null>) {
    const search = new URLSearchParams(params);
    for (const [key, value] of Object.entries(next))
      if (value) search.set(key, value);
      else search.delete(key);
    setParams(search, { replace: true, preventScrollReset: true });
  }

  return (
    <PlatformSection
      title="File des retraits"
      description="Retraits demandés par les organisations. Le numéro du bénéficiaire reste masqué."
      actions={
        <Select
          value={status}
          onValueChange={(value) =>
            update({
              statut: value && value !== "PENDING_APPROVAL" ? value : null,
              page: null,
            })
          }
        >
          <SelectTrigger aria-label="Statut des retraits" className="h-8 w-52">
            <SelectValue>
              {() => platformLabel(withdrawalStatusLabels, status)}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {withdrawalStatusOptions.map((value) => (
              <SelectItem key={value} value={value}>
                {withdrawalStatusLabels[value]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      }
    >
      {query.isPending ? (
        <PageLoading />
      ) : query.isError ? (
        <PlatformFailure
          error={query.error}
          retry={() => void query.refetch()}
        />
      ) : query.data.content.length === 0 ? (
        <EmptyState
          objectType="withdrawal"
          title={
            status === "PENDING_APPROVAL"
              ? "Aucun retrait à approuver"
              : "Aucun retrait pour ce statut"
          }
          description={
            status === "PENDING_APPROVAL"
              ? "Les demandes au-dessus du seuil d’approbation apparaîtront ici."
              : "Choisissez un autre statut pour consulter l’historique."
          }
        />
      ) : (
        <div className="space-y-3">
          <PlatformTable>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">Montant</TableHead>
                <TableHead>Organisation</TableHead>
                <TableHead>Bénéficiaire</TableHead>
                <TableHead>Ancienneté</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>
                  <span className="sr-only">Décision</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {query.data.content.map((w) => {
                const age = ageInDays(w.requestedAt);
                return (
                  <TableRow key={w.id}>
                    <TableCell className="text-right font-medium tabular-nums">
                      {formatMoney(w.amount, w.currency)}
                    </TableCell>
                    <TableCell>
                      <Link
                        className="font-mono text-xs underline underline-offset-4"
                        to={platformRoutes.organization(w.organizationId)}
                      >
                        {w.organizationId.slice(0, 8)}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{w.recipientName}</div>
                      <div className="text-xs text-muted-foreground">
                        {networkLabels[w.network] ?? w.network} ·{" "}
                        {w.maskedMsisdn}
                      </div>
                    </TableCell>
                    <TableCell
                      className={
                        status === "PENDING_APPROVAL" && age >= 2
                          ? "font-medium text-warning-foreground"
                          : "text-muted-foreground"
                      }
                    >
                      <RelativeTime value={w.requestedAt} />
                    </TableCell>
                    <TableCell>
                      <StatusDot
                        label={platformLabel(withdrawalStatusLabels, w.status)}
                        tone={withdrawalStatusTones[w.status] ?? "neutral"}
                        live={w.status === "PROCESSING"}
                      />
                      {w.decisionReason && (
                        <p className="mt-1 max-w-56 truncate text-xs text-muted-foreground">
                          {w.decisionReason}
                        </p>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {canDecide && w.status === "PENDING_APPROVAL" && (
                        <div className="flex justify-end gap-1.5">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              setPending({ withdrawal: w, decision: "reject" })
                            }
                          >
                            Refuser
                          </Button>
                          <Button
                            size="sm"
                            onClick={() =>
                              setPending({ withdrawal: w, decision: "approve" })
                            }
                          >
                            Approuver
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </PlatformTable>
          <PlatformPagination
            page={page}
            totalElements={query.data.totalElements}
            totalPages={query.data.totalPages}
            label="retraits"
            onChange={(next) => update({ page: next ? String(next) : null })}
          />
        </div>
      )}
      {pending && (
        <DecisionDialog
          title={
            pending.decision === "approve"
              ? "Approuver ce retrait ?"
              : "Refuser ce retrait ?"
          }
          description={
            pending.decision === "approve"
              ? "Le versement vers le portefeuille mobile money sera lancé. Cette décision est journalisée."
              : "Le montant redeviendra disponible pour l’organisation. Le motif lui sera visible."
          }
          summary={
            <dl className="grid grid-cols-2 gap-3 rounded-lg border bg-muted/40 p-3 text-sm">
              <div>
                <dt className="text-xs text-muted-foreground">Montant</dt>
                <dd className="font-heading text-lg font-semibold tabular-nums">
                  {formatMoney(
                    pending.withdrawal.amount,
                    pending.withdrawal.currency,
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Bénéficiaire</dt>
                <dd>{pending.withdrawal.recipientName}</dd>
                <dd className="text-xs text-muted-foreground">
                  {networkLabels[pending.withdrawal.network] ??
                    pending.withdrawal.network}{" "}
                  · {pending.withdrawal.maskedMsisdn}
                </dd>
              </div>
            </dl>
          }
          submitLabel={
            pending.decision === "approve"
              ? "Approuver le retrait"
              : "Refuser le retrait"
          }
          confirmLabel={
            pending.decision === "approve"
              ? "Je confirme avoir vérifié le montant et le bénéficiaire."
              : undefined
          }
          busy={decision.isPending}
          error={decision.error}
          onClose={() => {
            decision.reset();
            setPending(null);
          }}
          onSubmit={(reason) =>
            decision.mutate(
              {
                withdrawalId: pending.withdrawal.id,
                decision: pending.decision,
                reason,
              },
              { onSuccess: () => setPending(null) },
            )
          }
        />
      )}
    </PlatformSection>
  );
}

/** Une anomalie en frise : détection, prise en charge, résolution. */
export function anomalyTimeline(anomaly: PaymentAnomaly): TimelineEvent[] {
  return [
    {
      id: "detected",
      title: "Détectée",
      description: anomaly.code,
      at: anomaly.occurredAt,
      tone: "danger",
    },
    {
      id: "reviewed",
      title: "Prise en charge",
      at: anomaly.reviewedAt,
      tone: "info",
      upcoming: !anomaly.reviewedAt,
    },
    {
      id: "resolved",
      title: "Résolue",
      description: anomaly.resolution ?? undefined,
      at: anomaly.resolvedAt,
      tone: "success",
      upcoming: !anomaly.resolvedAt,
    },
  ];
}

function PaymentAnomalies({ session }: { session: PlatformSession }) {
  const query = usePaymentAnomalies(session);
  const action = useAnomalyAction();
  const canAct = platformCapabilities(session).canReconcilePayments;
  const [pending, setPending] = useState<{
    anomaly: PaymentAnomaly;
    action: AnomalyAction;
  } | null>(null);
  return (
    <PlatformSection
      title="Anomalies de paiement"
      description="Incohérences détectées entre l’opérateur de paiement et la plateforme, non résolues."
    >
      {query.isPending ? (
        <PageLoading />
      ) : query.isError ? (
        <PlatformFailure
          error={query.error}
          retry={() => void query.refetch()}
        />
      ) : query.data.length === 0 ? (
        <EmptyState
          objectType="sale"
          title="Aucune anomalie ouverte"
          description="Les paiements sont cohérents avec l’opérateur."
        />
      ) : (
        <ul className="grid gap-3 lg:grid-cols-2">
          {query.data.map((anomaly) => (
            <li
              key={anomaly.eventId}
              className="space-y-4 rounded-xl border bg-card p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0 space-y-1">
                  <p className="font-mono text-sm font-medium break-all">
                    {anomaly.code}
                  </p>
                  {anomaly.paymentId && (
                    <div className="text-xs text-muted-foreground">
                      Paiement
                      <CopyableId
                        className="flex"
                        value={anomaly.paymentId}
                        label="identifiant du paiement"
                      />
                    </div>
                  )}
                </div>
                <StatusDot
                  label={platformLabel(anomalyStatusLabels, anomaly.status)}
                  tone={anomaly.status === "REVIEWED" ? "info" : "danger"}
                  live={anomaly.status === "OPEN"}
                />
              </div>
              <Timeline events={anomalyTimeline(anomaly)} />
              {canAct && (
                <div className="flex flex-wrap justify-end gap-2">
                  {!anomaly.reviewedAt && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setPending({ anomaly, action: "review" })}
                    >
                      Prendre en charge
                    </Button>
                  )}
                  <Button
                    size="sm"
                    onClick={() => setPending({ anomaly, action: "resolve" })}
                  >
                    Résoudre
                  </Button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
      {pending && (
        <DecisionDialog
          title={
            pending.action === "review"
              ? "Prendre en charge l’anomalie ?"
              : "Résoudre l’anomalie ?"
          }
          description={`${pending.anomaly.code} · détectée le ${formatDateTime(pending.anomaly.occurredAt)}.`}
          submitLabel={
            pending.action === "review" ? "Prendre en charge" : "Résoudre"
          }
          busy={action.isPending}
          error={action.error}
          onClose={() => {
            action.reset();
            setPending(null);
          }}
          onSubmit={(reason) =>
            action.mutate(
              {
                eventId: pending.anomaly.eventId,
                action: pending.action,
                reason,
              },
              { onSuccess: () => setPending(null) },
            )
          }
        />
      )}
    </PlatformSection>
  );
}

/** Opérations financières de la plateforme : décisions de retrait et anomalies de paiement. */
export function PlatformFinance({ session }: { session: PlatformSession }) {
  if (!platformCapabilities(session).canViewPlatform)
    return (
      <EmptyState
        title="Opérations non accessibles"
        description="Votre compte ne dispose pas de la permission de lecture plateforme."
      />
    );
  return (
    <div className="space-y-8">
      <PlatformPageHeader
        title="Opérations financières"
        description="Retraits à décider et anomalies de paiement, pour toutes les organisations."
      />
      <WithdrawalQueue session={session} />
      <PaymentAnomalies session={session} />
    </div>
  );
}
