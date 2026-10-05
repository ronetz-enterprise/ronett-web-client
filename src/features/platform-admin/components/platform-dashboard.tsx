import { Link } from "react-router";
import { Button } from "@/shared/ui/button";
import { PageLoading, EmptyState } from "@/shared/components/feedback";
import { StatTile } from "@/shared/components/stat-tile";
import { Timeline } from "@/shared/components/timeline";
import { formatNumber, formatPercent } from "@/shared/utils/format";
import { formatDateTime, formatMoney, freshness } from "../formatters/platform";
import {
  actionStatusTones,
  actionTypeLabels,
  platformCapabilities,
  platformLabel,
  platformRoutes,
  type AdministrativeAction,
  type PlatformSession,
} from "../model/platform";
import {
  usePaymentAnomalies,
  usePlatformDashboard,
  usePlatformWithdrawals,
} from "../queries/platform";
import {
  PlatformFailure,
  PlatformPageHeader,
  PlatformSection,
} from "./platform-shared";

type Segment = { label: string; value: number; className: string };

/** Répartition en barre segmentée (rampe `chart-*` et tons de statut), avec légende chiffrée. */
function Distribution({
  title,
  segments,
}: {
  title: string;
  segments: Segment[];
}) {
  const total = segments.reduce((sum, segment) => sum + segment.value, 0);
  return (
    <div className="space-y-3 rounded-xl border bg-card p-4">
      <p className="flex items-baseline justify-between gap-2 text-sm">
        <span className="font-medium">{title}</span>
        <span className="text-muted-foreground tabular-nums">
          {formatNumber(total)}
        </span>
      </p>
      <div
        role="img"
        aria-label={`${title} : ${segments.map((s) => `${s.label} ${s.value}`).join(", ")}`}
        className="flex h-2.5 overflow-hidden rounded-full bg-muted"
      >
        {total > 0 &&
          segments.map((segment) => (
            <div
              key={segment.label}
              className={`h-full ${segment.className}`}
              style={{ width: `${(segment.value / total) * 100}%` }}
            />
          ))}
      </div>
      <dl className="flex flex-wrap gap-x-5 gap-y-2 text-xs">
        {segments.map((segment) => (
          <div key={segment.label} className="flex items-center gap-1.5">
            <span
              aria-hidden="true"
              className={`size-2 rounded-full ${segment.className}`}
            />
            <dt className="text-muted-foreground">{segment.label}</dt>
            <dd className="font-medium tabular-nums">
              {formatNumber(segment.value)}
              {total > 0 && (
                <span className="ml-1 font-normal text-muted-foreground">
                  {formatPercent(segment.value / total)}
                </span>
              )}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function actionEvents(actions: AdministrativeAction[]) {
  return actions.map((action) => ({
    id: action.id,
    title: platformLabel(actionTypeLabels, action.actionType),
    description: (
      <>
        {action.reason ?? "Sans motif"}
        {action.organizationId && (
          <>
            {" · "}
            <Link
              className="underline underline-offset-4"
              to={platformRoutes.organization(action.organizationId)}
            >
              organisation {action.organizationId.slice(0, 8)}
            </Link>
          </>
        )}
      </>
    ),
    at: action.requestedAt,
    tone: actionStatusTones[action.status] ?? "neutral",
  }));
}

/** Ce qui attend une décision : retraits à approuver, anomalies ouvertes. */
function ToReview({ session }: { session: PlatformSession }) {
  const withdrawals = usePlatformWithdrawals(session, "PENDING_APPROVAL", 0);
  const anomalies = usePaymentAnomalies(session);
  const pending = withdrawals.data?.totalElements;
  const open = anomalies.data?.length;
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <StatTile
        label="Retraits à approuver"
        icon="withdrawal"
        value={pending ?? 0}
        format={(value) => (pending === undefined ? "—" : formatNumber(value))}
        context={
          pending ? "En attente de décision" : "Aucune demande en attente"
        }
        to={platformRoutes.finance}
      />
      <StatTile
        label="Anomalies de paiement"
        icon="sale"
        value={open ?? 0}
        format={(value) => (open === undefined ? "—" : formatNumber(value))}
        context={open ? "Non résolues" : "Aucune anomalie ouverte"}
        to={platformRoutes.finance}
      />
    </div>
  );
}

/**
 * Tableau de bord plateforme.
 *
 * Deux familles de totaux, jamais mélangées : les totaux en direct sont lus chez
 * le module propriétaire, les totaux projetés portent leur date de fraîcheur.
 */
export function PlatformDashboard({ session }: { session: PlatformSession }) {
  const capabilities = platformCapabilities(session);
  const dashboard = usePlatformDashboard(capabilities.canViewPlatform);

  if (!capabilities.canViewPlatform) return <PlatformForbiddenDashboard />;
  if (dashboard.isPending) return <PageLoading variant="overview" />;
  if (dashboard.isError || !dashboard.data)
    return (
      <PlatformFailure
        error={dashboard.error}
        retry={() => void dashboard.refetch()}
      />
    );

  const { live, projected, recentActions, generatedAt } = dashboard.data;
  const mixedCurrencies = projected.mixedCurrencies ?? [];
  const revenueComparable = projected.grossRevenue !== null;

  return (
    <div className="space-y-8">
      <PlatformPageHeader
        title="Administration plateforme"
        description="Vue d'ensemble de la plateforme, distincte des espaces organisations."
        status={
          <span className="text-xs text-muted-foreground">
            Lecture du {formatDateTime(generatedAt)}
          </span>
        }
        actions={
          capabilities.canReadAudit ? (
            <Button
              variant="outline"
              nativeButton={false}
              role="link"
              render={<Link to={platformRoutes.audit} />}
            >
              Journal d'audit
            </Button>
          ) : null
        }
      />

      <PlatformSection title="À traiter">
        <ToReview session={session} />
      </PlatformSection>

      <PlatformSection
        title="En direct"
        description="Comptés à l'instant de la lecture, module par module."
      >
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatTile
            label="Organisations actives"
            icon="organization"
            value={live.activeOrganizations}
            format={formatNumber}
            context={`sur ${formatNumber(live.organizations)}`}
            to={
              capabilities.canReadOrganizations
                ? platformRoutes.organizations
                : undefined
            }
          />
          <StatTile
            label="Sites actifs"
            icon="site"
            value={live.activeSites}
            format={formatNumber}
            context={`sur ${formatNumber(live.sites)}`}
          />
          <StatTile
            label="Routeurs en ligne"
            icon="router"
            value={live.routersOnline}
            format={formatNumber}
            context={`sur ${formatNumber(live.routers)} déclarés`}
            to={
              capabilities.canReadNetwork ? platformRoutes.network : undefined
            }
          />
          <StatTile
            label="Accès actifs"
            icon="access"
            value={projected.activeAccesses}
            format={formatNumber}
            context={freshness(projected.dataLastUpdatedAt)}
          />
        </div>
        <div className="grid gap-3 lg:grid-cols-2">
          <Distribution
            title="Organisations"
            segments={[
              {
                label: "Actives",
                value: live.activeOrganizations,
                className: "bg-chart-4",
              },
              {
                label: "Suspendues",
                value: live.suspendedOrganizations,
                className: "bg-warning-foreground",
              },
              {
                label: "Fermées",
                value: live.closedOrganizations,
                className: "bg-muted-foreground/40",
              },
            ]}
          />
          <Distribution
            title="Routeurs"
            segments={[
              {
                label: "En ligne",
                value: live.routersOnline,
                className: "bg-chart-4",
              },
              {
                label: "Hors ligne",
                value: live.routersOffline,
                className: "bg-danger-foreground",
              },
              {
                label: "Inconnue",
                value: live.routersUnknownConnectivity,
                className: "bg-muted-foreground/40",
              },
            ]}
          />
        </div>
      </PlatformSection>

      <PlatformSection
        title="Activité commerciale"
        description="Totaux reconstruits par événements : leur date de fraîcheur est propre."
        actions={
          <span className="text-xs text-muted-foreground">
            {freshness(projected.dataLastUpdatedAt)}
          </span>
        }
      >
        <div className="grid gap-3 sm:grid-cols-3">
          <StatTile
            label="Recettes cumulées"
            icon="finance"
            value={projected.grossRevenue ?? 0}
            format={(value) =>
              revenueComparable
                ? formatMoney(value, projected.currency)
                : "Non comparable"
            }
            context={
              revenueComparable
                ? `Devise unique : ${projected.currency}`
                : mixedCurrencies.length > 0
                  ? `Devises mélangées (${mixedCurrencies.join(", ")})`
                  : "Aucune recette projetée"
            }
          />
          <StatTile
            label="Achats"
            icon="offer"
            value={projected.purchases}
            format={formatNumber}
            context={`${formatNumber(projected.confirmedPayments)} paiements confirmés`}
          />
          <StatTile
            label="Taux de confirmation"
            icon="credential"
            value={
              projected.purchases
                ? projected.confirmedPayments / projected.purchases
                : 0
            }
            format={(value) =>
              projected.purchases ? formatPercent(value) : "—"
            }
            context="Paiements confirmés / achats"
          />
        </div>
        {mixedCurrencies.length > 0 && (
          <p className="text-xs text-muted-foreground">
            Les organisations ne sont pas toutes dans la même devise : le
            montant n'est volontairement pas sommé. Le backend n'expose pas
            encore d'évolution temporelle des recettes plateforme.
          </p>
        )}
      </PlatformSection>

      <PlatformSection
        title="Actions administratives récentes"
        description="Toute action plateforme est journalisée, y compris son motif."
        actions={
          capabilities.canReadAudit ? (
            <Button
              variant="ghost"
              nativeButton={false}
              role="link"
              render={<Link to={platformRoutes.audit} />}
            >
              Voir le journal
            </Button>
          ) : null
        }
      >
        {recentActions.length === 0 ? (
          <EmptyState
            objectType="organization"
            title="Aucune action récente"
            description="Les actions d'administration apparaîtront ici dès qu'elles seront exécutées."
          />
        ) : (
          <Timeline events={actionEvents(recentActions)} />
        )}
      </PlatformSection>
    </div>
  );
}

function PlatformForbiddenDashboard() {
  return (
    <div className="space-y-6">
      <PlatformPageHeader
        title="Administration plateforme"
        description="Vue d'ensemble de la plateforme, distincte des espaces organisations."
      />
      <EmptyState
        title="Console non accessible"
        description="Votre compte ne dispose d'aucune permission plateforme."
      />
    </div>
  );
}
