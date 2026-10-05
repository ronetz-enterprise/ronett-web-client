import { useState, type ReactNode } from "react";
import { Link } from "react-router";
import type { Membership } from "@/features/memberships";
import { siteRoutes, type Site } from "@/features/site";
import { PageHeader, PageLoading } from "@/shared/components/feedback";
import {
  ReadOnlyValue,
  SettingField,
  SettingsBody,
  SettingsSection,
} from "@/shared/components/settings-layout";
import { DetailTabs } from "@/shared/components/detail-tabs";
import { RelativeTime } from "@/shared/components/relative-time";
import { Stepper, type Step } from "@/shared/components/stepper";
import { Button } from "@/shared/ui/button";
import { Alert, AlertTitle, AlertDescription } from "@/shared/ui/alert";
import { ApiError } from "@/shared/errors/api-error";
import {
  routerRoutes,
  routerCapabilities,
  pendingActionLabels,
  setupComplete,
  type Router,
  type RouterAction,
} from "../model/router";
import { useRouter, useRouterTracking } from "../queries/routers";
import {
  RouterStatus,
  RouterConnectivity,
  RouterBreadcrumb,
  RouterFailure,
  LastObservation,
  InfrastructureNotice,
  transientRouterError,
} from "./router-shared";
import { RouterNameField } from "./router-forms";
import { useRouterActions } from "./router-actions";

const nextSteps: Record<Router["provisioningStatus"], string> = {
  NOT_REQUESTED:
    "Le routeur est ajouté. Prochaine étape : générer son script d’installation.",
  PROVISIONING:
    "Le script d’installation est en préparation. Cette page se met à jour dès qu’il est prêt.",
  PENDING_ENROLLMENT:
    "Le script est prêt. Installez-le sur le routeur : il se signalera ensuite à Ronetz.",
  REGISTERED:
    "Le routeur est enregistré auprès de Ronetz. Sa connexion est suivie ci-contre.",
  REVOKING:
    "La révocation est en cours. Le routeur ne sert déjà plus vos clients.",
  FAILED:
    "La préparation du routeur a échoué. Vous pouvez relancer la génération du script.",
};
const failureLabels: Record<string, string> = {
  REMOTE_FAILURE: "La préparation du routeur a échoué.",
  REMOTE_CONFLICT:
    "Un conflit empêche la préparation du routeur. Contactez le support.",
  REMOTE_REJECTED:
    "La préparation du routeur a été refusée. Contactez le support.",
  INVALID_RESPONSE: "Le résultat reçu n’a pas pu être vérifié. Réessayez.",
  ORGANIZATION_INACTIVE:
    "L’organisation ou le site n’est plus actif pour cette opération.",
};
const progress: Record<Router["provisioningStatus"], number> = {
  NOT_REQUESTED: 0,
  PROVISIONING: 1,
  PENDING_ENROLLMENT: 2,
  REGISTERED: 3,
  REVOKING: 3,
  FAILED: 0,
};

/**
 * Étapes de mise en service : ajouté → script préparé → script installé → enregistré →
 * en ligne. Seuls l'ajout et la dernière observation sont datés par le backend.
 */
export function provisioningSteps(router: Router): Step[] {
  const status = router.provisioningStatus;
  const reached = progress[status];
  const failed = status === "FAILED";
  const preparing =
    status === "PROVISIONING" || router.pendingAction === "PROVISION";
  const online =
    status === "REGISTERED" && router.connectivityStatus === "ONLINE";
  const steps: Step[] = [
    {
      id: "declared",
      title: "Ajouté",
      description: `${router.vendor} · ${router.model}`,
      at: router.createdAt,
      state: "complete",
    },
    {
      id: "provisioning",
      title: "Script préparé",
      description: preparing
        ? "Préparation en cours."
        : failed
          ? "La préparation a échoué : vous pouvez réessayer."
          : reached >= 2
            ? "Script d’installation généré par Ronetz."
            : "Ronetz génère un script propre à ce routeur.",
      state: preparing
        ? "running"
        : failed
          ? "error"
          : reached >= 2
            ? "complete"
            : "current",
    },
    {
      id: "enrollment",
      title: "Script installé",
      description: "Le script est appliqué sur le routeur.",
      state:
        reached >= 3
          ? "complete"
          : status === "PENDING_ENROLLMENT"
            ? "current"
            : "upcoming",
    },
    {
      id: "registered",
      title: "Enregistré",
      description: "Le routeur s’est identifié auprès de Ronetz.",
      state: reached >= 3 ? "complete" : "upcoming",
    },
    {
      id: "online",
      title: "En ligne",
      description: online
        ? "Le routeur communique avec Ronetz."
        : "Aucun signal reçu pour l’instant.",
      at: online ? router.lastSeenAt : undefined,
      state: online
        ? "complete"
        : status === "REGISTERED" && router.lifecycleStatus === "ACTIVE"
          ? "current"
          : "upcoming",
    },
  ];
  if (status === "REVOKING" || router.lifecycleStatus === "REVOKED")
    steps.push({
      id: "revoked",
      title:
        router.lifecycleStatus === "REVOKED"
          ? "Révoqué"
          : "Révocation en cours",
      at: router.lifecycleStatus === "REVOKED" ? router.updatedAt : undefined,
      state: router.lifecycleStatus === "REVOKED" ? "complete" : "running",
    });
  return steps;
}

/**
 * Section « Mise en service », tant que le routeur n'est pas opérationnel : la progression
 * en cinq étapes et, sous l'étape en cours, ce qu'il reste à faire (`guide`).
 */
function SetupSection({ router, guide }: { router: Router; guide: ReactNode }) {
  const steps = provisioningSteps(router);
  const current = steps.findIndex((step) =>
    ["current", "running", "error"].includes(step.state),
  );
  if (guide && current >= 0)
    steps[current] = { ...steps[current], detail: guide };
  return (
    <SettingsSection
      id="mise-en-service"
      title="Mise en service"
      description="Progression depuis l’ajout du routeur et ce qu’il reste à faire."
    >
      <div className="max-w-2xl space-y-5">
        <Stepper label="Étapes de mise en service" steps={steps} />
        {/* Sans guide (routeur suspendu, révocation…), une phrase dit où en est le routeur. */}
        {!guide && (
          <p className="text-sm">{nextSteps[router.provisioningStatus]}</p>
        )}
        <InfrastructureNotice />
      </div>
    </SettingsSection>
  );
}

type Tracking = ReturnType<typeof useRouterTracking>;

/** Suivi automatique après une demande ; remis à zéro à chaque nouvelle demande. */
function TrackingScope({
  active,
  router,
  expectedSite,
  watch,
  children,
}: {
  active: Membership;
  router: Router;
  expectedSite?: string;
  watch?: { action: RouterAction; before: Router };
  children: (tracking: Tracking) => ReactNode;
}) {
  return children(useRouterTracking(active, router, expectedSite, watch));
}

/** Section « Connexion » : état observé du routeur et actualisation. */
function ConnectionSection({
  router,
  site,
  tracking,
}: {
  router: Router;
  site: Site | null;
  tracking: Tracking;
}) {
  return (
    <SettingsSection
      id="connexion"
      title="Connexion"
      description="État observé du routeur et dernier contact avec Ronetz."
    >
      <div className="space-y-6">
        <SettingField
          label="Connexion à Ronetz"
          description="« En ligne » : le routeur contacte Ronetz. La connexion de vos clients n’est pas encore vérifiée."
        >
          <RouterConnectivity router={router} />
        </SettingField>
        <SettingField label="Dernier signal" description="Heure du site.">
          <LastObservation at={router.lastSeenAt} timezone={site?.timezone} />
        </SettingField>
        <SettingField
          label="Installation"
          description="Avancement de la mise en service."
        >
          <RouterStatus router={router} dimension="provisioning" />
        </SettingField>
        <SettingField
          label="Cycle de vie"
          description="Un routeur suspendu ne sert plus vos clients."
        >
          <RouterStatus router={router} dimension="lifecycle" />
        </SettingField>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            disabled={tracking.isFetching}
            onClick={tracking.refresh}
          >
            Actualiser
          </Button>
          {tracking.tracking && (
            <Button variant="ghost" size="sm" onClick={tracking.pause}>
              Arrêter la mise à jour
            </Button>
          )}
          <p role="status" className="text-xs text-muted-foreground">
            {tracking.isFetching
              ? "Vérification…"
              : tracking.tracking
                ? "Mise à jour automatique pendant quelques minutes."
                : "Actualisez pour voir le dernier état."}
          </p>
        </div>
        {tracking.isError && <RouterFailure error={tracking.error} />}
      </div>
    </SettingsSection>
  );
}

/** Demande en attente, envoyée ou en échec : bandeaux au-dessus du contenu. */
function RequestNotices({
  router,
  watch,
}: {
  router: Router;
  watch?: { action: RouterAction; before: Router };
}) {
  return (
    <>
      {router.pendingAction && (
        <Alert>
          <AlertTitle>Demande en cours de traitement</AlertTitle>
          <AlertDescription>
            Demande de {pendingActionLabels[router.pendingAction]} en cours de
            traitement. Les autres actions seront de nouveau disponibles une
            fois cette demande traitée.
          </AlertDescription>
        </Alert>
      )}
      {watch && (
        <Alert>
          <AlertTitle>Demande envoyée</AlertTitle>
          <AlertDescription>
            {watch.action === "suspend"
              ? "Le routeur ne sert plus vos clients. La suspension sera complète une fois la demande traitée."
              : "Le résultat s’affichera ici dès que la demande sera traitée."}
          </AlertDescription>
        </Alert>
      )}
      {router.failureCode && (
        <Alert variant="destructive">
          <AlertTitle>Échec</AlertTitle>
          <AlertDescription>
            {failureLabels[router.failureCode] ??
              "L’opération a échoué. Contactez le support avec les références du routeur."}
          </AlertDescription>
        </Alert>
      )}
    </>
  );
}

function RouterView({
  active,
  router,
  site,
  expectedSite,
  tab,
  refreshing,
  failure,
}: {
  active: Membership;
  router: Router;
  site: Site | null;
  expectedSite?: string;
  tab: RouterTab;
  refreshing: boolean;
  failure: ReactNode;
}) {
  const [watch, setWatch] = useState<
    { action: RouterAction; before: Router } | undefined
  >();
  const caps = routerCapabilities(active, router, site);
  const parts = useRouterActions({
    active,
    router,
    site,
    expectedSite,
    onAccepted: (action, before) => setWatch({ action, before }),
  });
  const references = [
    router.provisioningOperationId && {
      label: "Opération",
      description: "Dernière opération de mise en service.",
      value: router.provisioningOperationId,
      copy: "la référence d’opération",
    },
    router.configurationArtifactId && {
      label: "Script d’installation",
      description:
        "Script courant, téléchargeable 15 minutes après sa génération.",
      value: router.configurationArtifactId,
      copy: "la référence du script",
    },
  ].filter((value) => !!value);
  return (
    <>
      <PageHeader
        title={router.name}
        status={<RouterStatus router={router} dimension="lifecycle" />}
        breadcrumb={
          <RouterBreadcrumb org={active.organizationId} current={router.name} />
        }
        tabs={
          <DetailTabs
            label={`Sections du routeur ${router.name}`}
            tabs={[
              {
                label: "État",
                to: routerRoutes.detail(active.organizationId, router.id),
              },
              {
                label: "Paramètres",
                to: routerRoutes.settings(active.organizationId, router.id),
              },
            ]}
          />
        }
      />
      {/* Gabarit des paramètres d'organisation : contenu aligné à gauche. */}
      <div className="max-w-3xl space-y-3 empty:hidden">
        {failure}
        {refreshing && (
          <p role="status" className="text-sm text-muted-foreground">
            Actualisation des informations…
          </p>
        )}
        <RequestNotices router={router} watch={watch} />
        {parts.notices}
      </div>
      <TrackingScope
        key={watch ? `${watch.action}/${watch.before.updatedAt}` : "initial"}
        active={active}
        router={router}
        expectedSite={expectedSite}
        watch={watch}
      >
        {(tracking) =>
          tab === "state" ? (
            <SettingsBody>
              {!setupComplete(router) && (
                <SetupSection router={router} guide={parts.guide} />
              )}
              <ConnectionSection
                router={router}
                site={site}
                tracking={tracking}
              />
              {references.length > 0 && (
                <SettingsSection
                  id="references"
                  title="Références pour le support"
                  description="À communiquer au support en cas de problème."
                >
                  <div className="space-y-6">
                    {references.map((reference) => (
                      <SettingField
                        key={reference.label}
                        label={reference.label}
                        description={reference.description}
                      >
                        <ReadOnlyValue
                          mono
                          copy={{
                            value: reference.value,
                            label: reference.copy,
                          }}
                        >
                          {reference.value}
                        </ReadOnlyValue>
                      </SettingField>
                    ))}
                  </div>
                </SettingsSection>
              )}
            </SettingsBody>
          ) : (
            <SettingsBody>
              <SettingsSection
                id="details"
                title="Détails"
                description="Nom, identifiant et rattachement du routeur."
              >
                <div className="space-y-6">
                  <RouterNameField
                    key={router.name}
                    active={active}
                    router={router}
                    expectedSite={expectedSite}
                    editable={caps.canEditRouter}
                  />
                  <SettingField
                    label="Identifiant du routeur"
                    description="Référence à communiquer au support."
                  >
                    <ReadOnlyValue
                      mono
                      copy={{
                        value: router.id,
                        label: "l’identifiant du routeur",
                      }}
                    >
                      {router.id}
                    </ReadOnlyValue>
                  </SettingField>
                  <SettingField
                    label="Équipement"
                    description="Constructeur et modèle déclarés à l’ajout ; non modifiables."
                  >
                    <ReadOnlyValue>
                      {router.vendor} · {router.model}
                    </ReadOnlyValue>
                  </SettingField>
                  <SettingField
                    label="Site"
                    description="Lieu où ce routeur diffuse votre WiFi."
                  >
                    <ReadOnlyValue>
                      {site ? (
                        <Link
                          className="underline underline-offset-4"
                          to={siteRoutes.detail(active.organizationId, site.id)}
                        >
                          {site.name}
                        </Link>
                      ) : (
                        <span className="text-muted-foreground">
                          Non rattaché
                        </span>
                      )}
                    </ReadOnlyValue>
                  </SettingField>
                  <div className="grid max-w-sm gap-6 sm:grid-cols-2">
                    <SettingField label="Ajouté">
                      <ReadOnlyValue>
                        <RelativeTime value={router.createdAt} />
                      </ReadOnlyValue>
                    </SettingField>
                    <SettingField label="Mis à jour">
                      <ReadOnlyValue>
                        <RelativeTime value={router.updatedAt} />
                      </ReadOnlyValue>
                    </SettingField>
                  </div>
                </div>
              </SettingsSection>
              {parts.manage}
            </SettingsBody>
          )
        }
      </TrackingScope>
    </>
  );
}

export type RouterTab = "state" | "settings";

export function RouterDetails({
  active,
  routerId,
  expectedSite,
  tab = "state",
}: {
  active: Membership;
  routerId: string;
  expectedSite?: string;
  /** Onglet ouvert : « État » (détail) ou « Paramètres » (`/settings`). */
  tab?: RouterTab;
}) {
  const query = useRouter(active, routerId, expectedSite);
  if (!routerCapabilities(active).canViewRouters)
    return <RouterFailure error={new ApiError("http", 403)} />;
  if (query.isPending) return <PageLoading variant="detail" />;
  if (!query.data || (query.isError && !transientRouterError(query.error)))
    return (
      <RouterFailure error={query.error} retry={() => void query.refetch()} />
    );
  return (
    <RouterView
      active={active}
      router={query.data.router}
      site={query.data.site}
      expectedSite={expectedSite}
      tab={tab}
      refreshing={query.isFetching}
      failure={
        query.isError && (
          <RouterFailure
            error={query.error}
            retry={() => void query.refetch()}
          />
        )
      }
    />
  );
}
