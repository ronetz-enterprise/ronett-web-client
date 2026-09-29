import { useState } from "react";
import { Link } from "react-router";
import type { Membership } from "@/features/memberships";
import { siteRoutes, useSite } from "@/features/site";
import { PageHeader, PageLoading } from "@/shared/components/feedback";
import { SummaryCard } from "@/shared/components/page-patterns";
import { Button } from "@/shared/ui/button";
import { Alert, AlertTitle, AlertDescription } from "@/shared/ui/alert";
import { ApiError } from "@/shared/errors/api-error";
import {
  routerRoutes,
  routerCapabilities,
  type Router,
  type RouterAction,
} from "../model/router";
import { useRouter, useRouterTracking } from "../queries/routers";
import {
  RouterStatus,
  RouterBreadcrumb,
  RouterFailure,
  LastObservation,
  InfrastructureNotice,
  transientRouterError,
} from "./router-shared";
import { RouterRename } from "./router-forms";
import { RouterActions } from "./router-actions";

const nextSteps: Record<Router["provisioningStatus"], string> = {
  NOT_REQUESTED:
    "Le routeur est déclaré. Une demande de provisioning peut être envoyée depuis les commandes.",
  PROVISIONING:
    "La demande est en cours de traitement ou en attente d’exécution. Aucune installation n’est encore confirmée.",
  PENDING_ENROLLMENT:
    "Le backend attend l’enrôlement. La génération d’un artefact ne prouve pas qu’il a été appliqué.",
  REGISTERED:
    "L’enregistrement est confirmé par le backend. Consultez séparément la connectivité et la date de son observation.",
  REVOKING:
    "La révocation est en cours. L’accès métier est suspendu, mais la révocation technique n’est pas encore confirmée.",
  FAILED:
    "Le backend a confirmé un échec. Consultez la cause ci-dessous et les commandes autorisées avant une nouvelle tentative.",
};
const failureLabels: Record<string, string> = {
  REMOTE_FAILURE: "L’opération technique a échoué.",
  REMOTE_CONFLICT:
    "L’infrastructure signale un conflit. Vérifiez la situation avec l’exploitation réseau.",
  REMOTE_REJECTED:
    "L’infrastructure a refusé l’opération. Une intervention de l’exploitation peut être nécessaire.",
  INVALID_RESPONSE: "Le résultat technique reçu n’a pas pu être validé.",
  ORGANIZATION_INACTIVE:
    "L’organisation ou le site n’est plus disponible pour cette opération.",
};
function ProvisioningPanel({
  active,
  router,
  expectedSite,
  watch,
}: {
  active: Membership;
  router: Router;
  expectedSite?: string;
  watch?: { action: RouterAction; before: Router };
}) {
  const tracking = useRouterTracking(active, router, expectedSite, watch);
  return (
    <SummaryCard
      title="Provisioning"
      description="État déclaré par le backend Ronetz."
    >
      <div className="space-y-4">
        <RouterStatus router={router} dimension="provisioning" />
        <p className="text-sm">{nextSteps[router.provisioningStatus]}</p>
        {watch && (
          <Alert>
            <AlertTitle>Demande acceptée</AlertTitle>
            <AlertDescription>
              {watch.action === "suspend"
                ? "Le cycle suspendu confirme le blocage métier. Le contrat public ne permet pas de confirmer séparément l’application technique de la suspension."
                : "L’acceptation de la demande ne constitue pas une preuve d’exécution. Les états ci-dessus restent l’autorité."}
            </AlertDescription>
          </Alert>
        )}
        {router.failureCode && (
          <Alert variant="destructive">
            <AlertTitle>Échec technique</AlertTitle>
            <AlertDescription>
              {failureLabels[router.failureCode] ??
                "Une opération technique a échoué. Contactez l’exploitation avec la référence de la demande."}
            </AlertDescription>
          </Alert>
        )}
        {tracking.isError && <RouterFailure error={tracking.error} />}
        <p role="status" className="text-sm text-muted-foreground">
          {tracking.isFetching
            ? "Consultation du résultat…"
            : tracking.tracking
              ? "Suivi automatique actif, pendant cinq minutes au maximum. Il est suspendu lorsque cet onglet est inactif."
              : "Suivi automatique arrêté ou non nécessaire. Ce n’est pas une confirmation d’échec. Vous pouvez actualiser l’état."}
        </p>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            disabled={tracking.isFetching}
            onClick={tracking.refresh}
          >
            Actualiser le résultat
          </Button>
          {tracking.tracking && (
            <Button variant="ghost" onClick={tracking.pause}>
              Arrêter le suivi
            </Button>
          )}
        </div>
        {router.provisioningOperationId && (
          <p className="text-sm">
            Référence d’opération :{" "}
            <code className="break-all">{router.provisioningOperationId}</code>
          </p>
        )}
        {router.configurationArtifactId && (
          <Alert>
            <AlertTitle>Artefact référencé</AlertTitle>
            <AlertDescription>
              <code className="break-all">
                {router.configurationArtifactId}
              </code>
              <p>
                Le backend n’expose pas le contenu, la compatibilité, la date de
                génération ou l’expiration du script. Sa copie et son
                téléchargement ne sont pas disponibles.
              </p>
            </AlertDescription>
          </Alert>
        )}
        <InfrastructureNotice />
      </div>
    </SummaryCard>
  );
}
export function RouterDetails({
  active,
  routerId,
  expectedSite,
  editing = false,
}: {
  active: Membership;
  routerId: string;
  expectedSite?: string;
  editing?: boolean;
}) {
  const query = useRouter(active, routerId, expectedSite);
  const [watch, setWatch] = useState<
    { action: RouterAction; before: Router } | undefined
  >();
  if (!routerCapabilities(active).canViewRouters)
    return <RouterFailure error={new ApiError("http", 403)} />;
  if (query.isPending) return <PageLoading />;
  if (!query.data || (query.isError && !transientRouterError(query.error)))
    return (
      <RouterFailure error={query.error} retry={() => void query.refetch()} />
    );
  const { router, site } = query.data,
    caps = routerCapabilities(active, router, site);
  return (
    <div className="max-w-5xl space-y-6">
      <PageHeader
        title={editing ? "Modifier le routeur" : router.name}
        description={
          site
            ? `${site.name} · ${site.city}`
            : "Ce routeur n’a pas de site rattaché."
        }
        status={<RouterStatus router={router} dimension="lifecycle" />}
        breadcrumb={
          <RouterBreadcrumb
            org={active.organizationId}
            current={editing ? "Paramètres" : "Détail du routeur"}
            router={editing ? router : undefined}
          />
        }
        actions={
          !editing && caps.canEditRouter ? (
            <Button
              render={
                <Link
                  to={routerRoutes.settings(
                    active.organizationId,
                    router.id,
                    expectedSite,
                  )}
                />
              }
            >
              Modifier le nom
            </Button>
          ) : undefined
        }
      />
      {query.isError && (
        <RouterFailure error={query.error} retry={() => void query.refetch()} />
      )}
      {query.isFetching && (
        <p role="status" className="text-sm text-muted-foreground">
          Actualisation des informations…
        </p>
      )}
      {editing ? (
        caps.canEditRouter ? (
          <RouterRename
            active={active}
            router={router}
            expectedSite={expectedSite}
          />
        ) : (
          <Alert>
            <AlertTitle>Modification indisponible</AlertTitle>
            <AlertDescription>
              Ce routeur est révoqué ou vos droits ne permettent pas sa
              modification.
            </AlertDescription>
          </Alert>
        )
      ) : (
        <>
          <RouterActions
            active={active}
            router={router}
            site={site}
            expectedSite={expectedSite}
            onAccepted={(action, before) => setWatch({ action, before })}
          />
          <div className="grid gap-4 md:grid-cols-2">
            <SummaryCard title="Équipement">
              <dl className="space-y-4">
                {[
                  ["Constructeur", router.vendor],
                  ["Modèle", router.model],
                  ["Identifiant", router.id],
                ].map(([label, value]) => (
                  <div key={label}>
                    <dt className="text-muted-foreground">{label}</dt>
                    <dd className="break-words">{value}</dd>
                  </div>
                ))}
                <div>
                  <dt className="text-muted-foreground">Site</dt>
                  <dd>
                    {site ? (
                      <Link
                        className="underline"
                        to={siteRoutes.detail(active.organizationId, site.id)}
                      >
                        {site.name}
                      </Link>
                    ) : (
                      "Non rattaché"
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Créé le</dt>
                  <dd>{new Date(router.createdAt).toLocaleString("fr-FR")}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Mis à jour le</dt>
                  <dd>{new Date(router.updatedAt).toLocaleString("fr-FR")}</dd>
                </div>
              </dl>
            </SummaryCard>
            <SummaryCard
              title="Connectivité"
              description="Dernière observation connue, sans garantie de temps réel."
            >
              <div className="space-y-4">
                <RouterStatus router={router} dimension="connectivity" />
                <div>
                  <p className="text-sm text-muted-foreground">
                    Dernière observation
                  </p>
                  <LastObservation
                    at={router.lastSeenAt}
                    timezone={site?.timezone}
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  Une observation « en ligne » ne prouve pas le fonctionnement
                  de RADIUS. Aucun seuil de péremption n’est fourni par le
                  backend.
                </p>
              </div>
            </SummaryCard>
          </div>
          <ProvisioningPanel
            key={
              watch ? `${watch.action}/${watch.before.updatedAt}` : "initial"
            }
            active={active}
            router={router}
            expectedSite={expectedSite}
            watch={watch}
          />
        </>
      )}
    </div>
  );
}
export function SiteRouterEntry({
  active,
  siteId,
}: {
  active: Membership;
  siteId: string;
}) {
  const query = useSite(active, siteId);
  if (!query.isSuccess) return null;
  return (
    <SummaryCard
      title="Routeurs du site"
      description="Le backend ne propose pas encore de liste filtrée par site. La liste générale affiche les équipements de toute l’organisation."
    >
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          render={<Link to={routerRoutes.list(active.organizationId)} />}
        >
          Tous les routeurs de l’organisation
        </Button>
        {query.data.status === "ACTIVE" &&
          routerCapabilities(active).canCreateRouter && (
            <Button
              render={
                <Link to={routerRoutes.create(active.organizationId, siteId)} />
              }
            >
              Déclarer un routeur sur ce site
            </Button>
          )}
      </div>
    </SummaryCard>
  );
}
