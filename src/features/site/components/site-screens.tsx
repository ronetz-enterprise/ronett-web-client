import { useFormDialog } from "@/shared/components/form-dialog-context";
import type { ReactNode } from "react";
import type { Membership } from "@/features/memberships";
import { PageLoading } from "@/shared/components/feedback";
import { DetailTabs } from "@/shared/components/detail-tabs";
import {
  ReadOnlyValue,
  SettingField,
  SettingsBody,
  SettingsSection,
} from "@/shared/components/settings-layout";
import { ApiError } from "@/shared/errors/api-error";
import { formatDate } from "@/shared/utils/format";
import { Alert, AlertTitle, AlertDescription } from "@/shared/ui/alert";
import { siteCapabilities, siteRoutes } from "../model/site";
import { useSite } from "../queries/sites";
import {
  SiteBreadcrumb,
  SiteFailure,
  SitePageHeader,
  SiteStatus,
} from "./site-shared";
import { SiteForm } from "./site-form";
import { SiteManagement } from "./site-actions";
import { SitePortalSection } from "./site-portal";

export function SiteCreate({ active }: { active: Membership }) {
  const dialog = useFormDialog();
  if (!siteCapabilities(active).canCreateSite)
    return <SiteFailure error={new ApiError("http", 403)} />;
  return (
    <div className={dialog ? "space-y-6" : "max-w-2xl space-y-6"}>
      {!dialog && (
        <SitePageHeader
          title="Créer un site"
          description={`Ce site sera rattaché à ${active.organizationName}.`}
          breadcrumb={
            <SiteBreadcrumb
              organizationId={active.organizationId}
              current="Nouveau site"
            />
          }
        />
      )}
      <SiteForm active={active} />
    </div>
  );
}

export type SiteTab = "overview" | "offers" | "settings";

/**
 * Espace d'un site, au gabarit des pages de détail : en-tête avec onglets *Vue d'ensemble ·
 * Offres · Paramètres* pilotés par l'URL. Les routeurs et les accès du site ne sont pas des
 * onglets : la vue d'ensemble renvoie vers les listes globales filtrées sur le site (`metrics`,
 * composé par la page). `summary` s'affiche en tête de la vue d'ensemble ; l'onglet Offres est
 * fourni par la page (`children`).
 */
export function SiteDetails({
  active,
  siteId,
  editing = false,
  tab = editing ? "settings" : "overview",
  summary,
  metrics,
  children,
}: {
  active: Membership;
  siteId: string;
  editing?: boolean;
  tab?: SiteTab;
  summary?: ReactNode;
  metrics?: ReactNode;
  children?: ReactNode;
}) {
  const query = useSite(active, siteId);
  if (!siteCapabilities(active).canViewSites)
    return <SiteFailure error={new ApiError("http", 403)} />;
  if (query.isPending) return <PageLoading variant="detail" />;
  const transientFailure =
    query.error instanceof ApiError &&
    (["network", "timeout", "aborted"].includes(query.error.kind) ||
      query.error.status >= 500 ||
      query.error.status === 429);
  if (!query.data || (query.isError && !transientFailure))
    return (
      <SiteFailure error={query.error} retry={() => void query.refetch()} />
    );
  const site = query.data;
  const caps = siteCapabilities(active, site);
  const org = active.organizationId;
  return (
    <>
      <SitePageHeader
        title={site.name}
        status={<SiteStatus site={site} />}
        breadcrumb={<SiteBreadcrumb organizationId={org} current={site.name} />}
        tabs={
          <DetailTabs
            label={`Sections du site ${site.name}`}
            tabs={[
              { label: "Vue d’ensemble", to: siteRoutes.detail(org, site.id) },
              { label: "Offres", to: siteRoutes.offers(org, site.id) },
              { label: "Paramètres", to: siteRoutes.settings(org, site.id) },
            ]}
          />
        }
      />
      {(query.isError || site.status !== "ACTIVE") && (
        <div className="max-w-3xl space-y-3">
          {query.isError && (
            <SiteFailure
              error={query.error}
              retry={() => void query.refetch()}
            />
          )}
          {site.status !== "ACTIVE" && (
            <Alert>
              <AlertTitle>
                {site.status === "CLOSED" ? "Site fermé" : "Site suspendu"}
              </AlertTitle>
              <AlertDescription>
                {site.status === "CLOSED"
                  ? "Ce site reste consultable, mais ne peut plus être modifié ni réactivé."
                  : "Son portail ne vend plus d’accès. Vous pouvez le réactiver depuis l’onglet Paramètres."}
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}
      {query.isFetching && (
        <p role="status" className="sr-only">
          Actualisation du site…
        </p>
      )}
      {tab === "settings" ? (
        <SettingsBody>
          {caps.canEditSite ? (
            <SettingsSection
              id="details"
              title="Détails"
              description="Nom, adresse et description du site."
            >
              <div className="max-w-xl">
                <SiteForm key={site.id} active={active} site={site} />
              </div>
            </SettingsSection>
          ) : (
            <SettingsSection id="details" title="Détails">
              <p className="text-sm text-muted-foreground">
                Ce site est fermé ou vos droits ne permettent pas de le
                modifier.
              </p>
            </SettingsSection>
          )}
          <SettingsSection
            id="references"
            title="Références pour le support"
            description="À communiquer au support en cas de problème."
          >
            <div className="space-y-6">
              <SettingField label="Référence du site">
                <ReadOnlyValue
                  mono
                  copy={{ value: site.id, label: "la référence du site" }}
                >
                  {site.id}
                </ReadOnlyValue>
              </SettingField>
              <div className="grid max-w-sm gap-6 sm:grid-cols-2">
                <SettingField label="Créé le">
                  <ReadOnlyValue>{formatDate(site.createdAt)}</ReadOnlyValue>
                </SettingField>
                <SettingField label="Modifié le">
                  <ReadOnlyValue>{formatDate(site.updatedAt)}</ReadOnlyValue>
                </SettingField>
              </div>
            </div>
          </SettingsSection>
          <SiteManagement active={active} site={site} />
        </SettingsBody>
      ) : tab === "overview" ? (
        <>
          {summary && <div className="max-w-3xl">{summary}</div>}
          <SettingsBody>
            {metrics && (
              <SettingsSection
                id="en-bref"
                title="En bref"
                description="L’activité de ce site en ce moment."
              >
                {metrics}
              </SettingsSection>
            )}
            <SitePortalSection site={site} />
            <SettingsSection
              id="adresse"
              title="Adresse"
              description="Où se trouve le site."
            >
              <div className="space-y-6">
                <div className="grid max-w-xl gap-6 sm:grid-cols-2">
                  <SettingField label="Ville">
                    <ReadOnlyValue>
                      {site.city || "Non renseignée"}
                    </ReadOnlyValue>
                  </SettingField>
                  <SettingField label="Quartier">
                    <ReadOnlyValue>
                      {site.district || "Non renseigné"}
                    </ReadOnlyValue>
                  </SettingField>
                </div>
                <SettingField label="Précisions d’adresse">
                  <ReadOnlyValue>
                    {site.addressDetails || "Non renseignées"}
                  </ReadOnlyValue>
                </SettingField>
                <SettingField label="Description">
                  <ReadOnlyValue>
                    <span className="whitespace-pre-wrap">
                      {site.description || "Non renseignée"}
                    </span>
                  </ReadOnlyValue>
                </SettingField>
                <SettingField
                  label="Heure locale"
                  description="Sert à dater les connexions et les ventes du site."
                >
                  <ReadOnlyValue>{site.timezone}</ReadOnlyValue>
                </SettingField>
              </div>
            </SettingsSection>
          </SettingsBody>
        </>
      ) : (
        children
      )}
    </>
  );
}
