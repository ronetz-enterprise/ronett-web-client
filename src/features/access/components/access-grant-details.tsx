import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Link } from "react-router";
import { HugeiconsIcon } from "@hugeicons/react";
import { Cancel01Icon, RefreshIcon } from "@hugeicons/core-free-icons";
import type { Membership } from "@/features/memberships";
import { useSites } from "@/features/site";
import { PageLoading } from "@/shared/components/feedback";
import {
  ReadOnlyValue,
  SettingField,
  SettingsBody,
  SettingsSection,
} from "@/shared/components/settings-layout";
import { Stepper } from "@/shared/components/stepper";
import { Timeline, type TimelineEvent } from "@/shared/components/timeline";
import { Button } from "@/shared/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import { cn } from "@/shared/utils/cn";
import { ApiError } from "@/shared/errors/api-error";
import { formatInstant, policyLines } from "../formatters/access";
import {
  accessDisplayState,
  accessGrantLabel,
  accessSourceLabels,
  accessSubjectLabels,
  isFailedProjection,
  preparationSteps,
  type AccessGrant,
} from "../model/access-grant";
import { accessPermissions } from "../permissions/access-permissions";
import {
  useAccessGrant,
  useAccessGrantTracking,
} from "../queries/access-grants";
import { AccessCredentialPanel } from "./access-credential-panel";
import { AccessPolicyEnforcement } from "./access-policy-enforcement";
import { AccessTransitions } from "./access-transitions";
import { AccessFailure, AccessProvisioningAlert } from "./access-shared";
import { AccessRemaining, AccessStatusDot } from "./access-grant-table";

/** Jalons datés de l'accès ; l'expiration à venir est en pointillé. */
export function accessMilestones(grant: AccessGrant, now = Date.now()) {
  const events: TimelineEvent[] = [
    { id: "issued", title: "Créé", at: grant.issuedAt },
  ];
  if (grant.activatedAt)
    events.push({ id: "activated", title: "Activé", at: grant.activatedAt });
  if (grant.suspendedAt)
    events.push({
      id: "suspended",
      title: "Suspendu",
      at: grant.suspendedAt,
      tone: "warning",
    });
  if (grant.revokedAt)
    events.push({
      id: "revoked",
      title: "Annulé",
      at: grant.revokedAt,
      tone: "danger",
    });
  if (grant.expiresAt) {
    const upcoming = new Date(grant.expiresAt).getTime() > now;
    events.push({
      id: "expires",
      title: upcoming ? "Fin prévue" : "Terminé",
      at: grant.expiresAt,
      tone: "neutral",
      upcoming,
    });
  }
  return events.sort(
    (a, b) => new Date(a.at ?? 0).getTime() - new Date(b.at ?? 0).getTime(),
  );
}

const stepStates = {
  done: "complete",
  current: "running",
  blocked: "error",
  todo: "upcoming",
} as const;

/** Ce que l'état veut dire pour le client, en une phrase. */
function stateSentence(grant: AccessGrant) {
  const state = accessDisplayState(grant);
  if (state.usable) return "Le client peut se connecter avec cet accès.";
  if (isFailedProjection(grant.projectionStatus))
    return "L’accès n’a pas encore pu être activé sur le réseau du site. Ronetz réessaie automatiquement.";
  if (state.tone === "pending")
    return "L’accès sera utilisable dès qu’il sera activé sur le réseau du site.";
  if (grant.status === "SUSPENDED")
    return "Le client ne peut plus se connecter tant que l’accès est suspendu.";
  return "Cet accès n’est plus utilisable.";
}

/**
 * Détail d'un accès dans le panneau latéral de la liste (pas de page dédiée) : en-tête
 * compact avec fermeture, puis les sections État, Connexion, Conditions, Origine,
 * Historique et Gestion.
 */
export function AccessGrantPanel({
  active,
  accessGrantId,
  onClose,
}: {
  active: Membership;
  accessGrantId: string;
  onClose: () => void;
}) {
  const query = useAccessGrant(active, accessGrantId);
  if (!accessPermissions(active).canViewAccessDetails)
    return (
      <PanelFrame title="Détail de l’accès" onClose={onClose}>
        <AccessFailure error={new ApiError("http", 403)} />
      </PanelFrame>
    );
  if (query.isPending)
    return (
      <PanelFrame title="Détail de l’accès" onClose={onClose}>
        <PageLoading variant="detail" />
      </PanelFrame>
    );
  const transient =
    query.error instanceof ApiError &&
    (["network", "timeout", "aborted"].includes(query.error.kind) ||
      query.error.status >= 500 ||
      query.error.status === 429);
  if (!query.data || (query.isError && !transient))
    return (
      <PanelFrame title="Détail de l’accès" onClose={onClose}>
        <AccessFailure error={query.error} retry={() => void query.refetch()} />
      </PanelFrame>
    );
  return (
    <AccessGrantBody
      key={`${active.organizationId}/${accessGrantId}`}
      active={active}
      grant={query.data}
      onClose={onClose}
    />
  );
}

/** Cadre du panneau : en-tête collé en haut (titre, état, actions, fermeture), contenu défilant. */
function PanelFrame({
  title,
  status,
  actions,
  tabs,
  onClose,
  children,
}: {
  title: string;
  status?: ReactNode;
  actions?: ReactNode;
  /** Onglets posés sous l'en-tête, sur son trait. */
  tabs?: ReactNode;
  onClose: () => void;
  children: ReactNode;
}) {
  const heading = useRef<HTMLHeadingElement>(null);
  // À l'ouverture du panneau, le focus va au titre : clavier et lecteur d'écran y repartent.
  useEffect(() => {
    const timer = window.setTimeout(() => heading.current?.focus(), 50);
    return () => window.clearTimeout(timer);
  }, []);
  return (
    <div className="flex h-full min-h-0 flex-1 flex-col">
      <div
        className={cn(
          "flex items-start gap-2 px-5 pt-3",
          tabs ? "pb-1" : "border-b pb-3",
        )}
      >
        <div className="min-w-0 flex-1 space-y-0.5">
          <h2
            ref={heading}
            id="access-panel-title"
            tabIndex={-1}
            className="font-heading text-base font-semibold break-words outline-none"
          >
            {title}
          </h2>
          {status}
        </div>
        {actions}
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Fermer le détail"
          onClick={onClose}
        >
          <HugeiconsIcon icon={Cancel01Icon} strokeWidth={1.75} />
        </Button>
      </div>
      {tabs}
      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-6">{children}</div>
    </div>
  );
}

function AccessGrantBody({
  active,
  grant: initial,
  onClose,
}: {
  active: Membership;
  grant: AccessGrant;
  onClose: () => void;
}) {
  const tracking = useAccessGrantTracking(active, initial);
  const sites = useSites(active);
  const grant = tracking.grant;
  const state = accessDisplayState(grant);
  const site = useMemo(
    () =>
      sites.data?.find((candidate) => candidate.id === grant.siteId) ?? null,
    [sites.data, grant.siteId],
  );
  const preparing =
    !state.usable &&
    (grant.status === "ACTIVE" || grant.status === "PENDING_PROVISIONING");

  const permissions = accessPermissions(active, grant);
  const manageable =
    permissions.canSuspendAccess ||
    permissions.canResumeAccess ||
    permissions.canRevokeAccess ||
    permissions.canRetryProvisioning;
  const [tab, setTab] = useState("state");
  // Plus aucune action possible (accès annulé, par exemple) : retour sur l'onglet État.
  const current = tab === "manage" && !manageable ? "state" : tab;

  return (
    <Tabs
      value={current}
      onValueChange={(value) => setTab(String(value))}
      className="h-full gap-0"
    >
      <PanelFrame
        title={grant.username ?? `Accès ${grant.accessGrantId.slice(0, 8)}`}
        status={<AccessStatusDot grant={grant} />}
        onClose={onClose}
        actions={
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Actualiser l’accès"
            onClick={tracking.refresh}
            disabled={tracking.isFetching}
          >
            <HugeiconsIcon icon={RefreshIcon} strokeWidth={1.75} />
          </Button>
        }
        tabs={
          <TabsList
            variant="line"
            aria-label="Sections de l’accès"
            className="px-5"
          >
            <TabsTrigger value="state">État</TabsTrigger>
            <TabsTrigger value="conditions">Conditions</TabsTrigger>
            <TabsTrigger value="origin">Origine</TabsTrigger>
            {manageable && <TabsTrigger value="manage">Gestion</TabsTrigger>}
          </TabsList>
        }
      >
        <TabsContent value="state">
          <div className="mb-6 empty:hidden">
            <AccessProvisioningAlert grant={grant} />
          </div>
          <SettingsBody>
            <SettingsSection
              id="etat"
              title="État"
              description="Ce que le client peut faire en ce moment."
            >
              <div className="space-y-6">
                <SettingField label="État de l’accès">
                  <div className="space-y-1.5">
                    <AccessStatusDot grant={grant} />
                    <p className="text-sm text-muted-foreground">
                      {stateSentence(grant)}
                    </p>
                  </div>
                </SettingField>
                {preparing && (
                  <Stepper
                    label="Préparation de l’accès"
                    steps={preparationSteps(grant).map((step) => ({
                      id: step.key,
                      title: step.label,
                      state: stepStates[step.state],
                    }))}
                  />
                )}
                <SettingField
                  label="Temps restant"
                  description="Le décompte commence à l’activation de l’accès."
                >
                  <AccessRemaining grant={grant} />
                </SettingField>
                <div className="grid max-w-sm gap-6 sm:grid-cols-2">
                  <SettingField label="Activé le">
                    <ReadOnlyValue>
                      {grant.activatedAt
                        ? formatInstant(grant.activatedAt)
                        : "Pas encore"}
                    </ReadOnlyValue>
                  </SettingField>
                  <SettingField label="Fin prévue le">
                    <ReadOnlyValue>
                      {formatInstant(grant.expiresAt)}
                    </ReadOnlyValue>
                  </SettingField>
                </div>
                <p aria-live="polite" className="text-xs text-muted-foreground">
                  {tracking.tracking
                    ? "Mise à jour automatique en cours : elle s’arrête dès que l’état ne change plus."
                    : "Actualisez pour voir le dernier état."}
                </p>
              </div>
            </SettingsSection>
            <SettingsSection
              id="connexion"
              title="Connexion du client"
              description="Ce que le client saisit sur le portail WiFi du site."
            >
              <AccessCredentialPanel grant={grant} />
            </SettingsSection>
          </SettingsBody>
        </TabsContent>
        <TabsContent value="conditions">
          <SettingsBody>
            <SettingsSection
              id="conditions"
              title="Conditions"
              description="Ce que comprend cet accès."
            >
              <div className="space-y-6">
                <div className="grid max-w-xl gap-6 sm:grid-cols-2">
                  {policyLines(grant.policy).map((line) => (
                    <SettingField key={line.label} label={line.label}>
                      <ReadOnlyValue>{line.value}</ReadOnlyValue>
                    </SettingField>
                  ))}
                </div>
                <AccessPolicyEnforcement />
              </div>
            </SettingsSection>
          </SettingsBody>
        </TabsContent>
        <TabsContent value="origin">
          <SettingsBody>
            <SettingsSection
              id="origine"
              title="Origine"
              description="D’où vient cet accès et à qui il est destiné."
            >
              <div className="space-y-6">
                <SettingField label="Site">
                  <ReadOnlyValue>
                    <Link
                      className="underline underline-offset-4"
                      to={`/app/${active.organizationId}/sites/${grant.siteId}`}
                    >
                      {site?.name ?? "Ouvrir le site"}
                    </Link>
                  </ReadOnlyValue>
                </SettingField>
                <SettingField label="Origine">
                  <ReadOnlyValue>
                    {accessGrantLabel(accessSourceLabels, grant.sourceType)}
                  </ReadOnlyValue>
                </SettingField>
                <SettingField label="Utilisé par">
                  <ReadOnlyValue>
                    {accessGrantLabel(accessSubjectLabels, grant.subjectType)}
                  </ReadOnlyValue>
                </SettingField>
                <SettingField
                  label="Référence de l’accès"
                  description="À communiquer au support en cas de problème."
                >
                  <ReadOnlyValue
                    mono
                    copy={{
                      value: grant.accessGrantId,
                      label: "la référence de l’accès",
                    }}
                  >
                    {grant.accessGrantId}
                  </ReadOnlyValue>
                </SettingField>
              </div>
            </SettingsSection>
            <SettingsSection
              id="historique"
              title="Historique"
              description="Dates clés de cet accès."
            >
              <Timeline events={accessMilestones(grant)} />
            </SettingsSection>
          </SettingsBody>
        </TabsContent>
        {manageable && (
          <TabsContent value="manage">
            <SettingsBody>
              <AccessTransitions active={active} grant={grant} site={site} />
            </SettingsBody>
          </TabsContent>
        )}
      </PanelFrame>
    </Tabs>
  );
}
