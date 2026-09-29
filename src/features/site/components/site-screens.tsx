import type { ReactNode } from "react";
import { Link } from "react-router";
import { HugeiconsIcon } from "@hugeicons/react";
import { Edit02Icon } from "@hugeicons/core-free-icons";
import type { Membership } from "@/features/memberships";
import { PageLoading } from "@/shared/components/feedback";
import { ApiError } from "@/shared/errors/api-error";
import { Button } from "@/shared/ui/button";
import { Alert, AlertTitle, AlertDescription } from "@/shared/ui/alert";
import { cn } from "cn";
import { siteCapabilities, siteRoutes } from "../model/site";
import { useSite } from "../queries/sites";
import {
  SiteBreadcrumb,
  SiteDetailTabs,
  SiteFailure,
  SitePageHeader,
  SiteStatus,
} from "./site-shared";
import { SiteForm } from "./site-form";
import { SiteActions } from "./site-actions";

/** Panneau plat : titre sur fond gris, contenu sur fond blanc, trait 1px. */
function SitePanel({
  title,
  children,
  className,
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "min-w-0 overflow-hidden rounded-xl border bg-card",
        className,
      )}
    >
      <h2 className="border-b bg-muted/60 px-5 py-3 font-heading text-sm font-semibold">
        {title}
      </h2>
      <div className="px-5 py-4">{children}</div>
    </section>
  );
}

/** Paire libelle/valeur empilee, alignee sur les blocs de la console. */
function SiteField({
  label,
  value,
  className,
}: {
  label: string;
  value: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("min-w-0 space-y-1", className)}>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-sm break-words whitespace-pre-wrap">{value}</dd>
    </div>
  );
}

export function SiteCreate({ active }: { active: Membership }) {
  if (!siteCapabilities(active).canCreateSite)
    return <SiteFailure error={new ApiError("http", 403)} />;
  return (
    <div className="max-w-3xl space-y-6">
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
      <SitePanel title="Informations du site">
        <SiteForm active={active} />
      </SitePanel>
    </div>
  );
}

export function SiteDetails({
  active,
  siteId,
  editing = false,
}: {
  active: Membership;
  siteId: string;
  editing?: boolean;
}) {
  const query = useSite(active, siteId);
  if (!siteCapabilities(active).canViewSites)
    return <SiteFailure error={new ApiError("http", 403)} />;
  if (query.isPending) return <PageLoading />;
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
  return (
    <div className="max-w-5xl space-y-5">
      <SitePageHeader
        title={editing ? "Paramètres du site" : site.name}
        status={<SiteStatus site={site} />}
        breadcrumb={
          <SiteBreadcrumb
            organizationId={active.organizationId}
            site={editing ? site : undefined}
            current={editing ? "Paramètres" : "Détail du site"}
          />
        }
        description={
          editing
            ? site.name
            : `${site.city}${site.district ? " · " + site.district : ""}`
        }
        actions={
          !editing && (
            <>
              {caps.canEditSite && (
                <Button
                  render={
                    <Link
                      to={siteRoutes.settings(active.organizationId, site.id)}
                    />
                  }
                >
                  <HugeiconsIcon
                    icon={Edit02Icon}
                    strokeWidth={2}
                    data-icon="inline-start"
                  />
                  Modifier
                </Button>
              )}
              <SiteActions active={active} site={site} />
            </>
          )
        }
      />
      {query.isError && (
        <SiteFailure error={query.error} retry={() => void query.refetch()} />
      )}
      {query.isFetching && (
        <p role="status" className="text-sm text-muted-foreground">
          Actualisation du site…
        </p>
      )}
      {editing ? (
        caps.canEditSite ? (
          <div className="space-y-5">
            <SiteDetailTabs
              organizationId={active.organizationId}
              site={site}
              editing
              canEdit={caps.canEditSite}
            />
            <SitePanel title="Informations du site">
              <SiteForm key={site.id} active={active} site={site} />
            </SitePanel>
          </div>
        ) : (
          <Alert>
            <AlertTitle>Modification indisponible</AlertTitle>
            <AlertDescription>
              Ce site est fermé ou vos droits ne permettent plus de le modifier.{" "}
              <Link
                className="underline underline-offset-4"
                to={siteRoutes.detail(active.organizationId, site.id)}
              >
                Revenir au détail
              </Link>
            </AlertDescription>
          </Alert>
        )
      ) : (
        <>
          <SiteDetailTabs
            organizationId={active.organizationId}
            site={site}
            editing={false}
            canEdit={caps.canEditSite}
          />
          {site.status !== "ACTIVE" && (
            <Alert>
              <AlertTitle>
                {site.status === "CLOSED"
                  ? "Site fermé définitivement"
                  : "Site suspendu"}
              </AlertTitle>
              <AlertDescription>
                {site.status === "CLOSED"
                  ? "Ce site reste consultable, mais ne peut plus être modifié ou réactivé."
                  : "Les opérations exigeant un site actif sont indisponibles jusqu’à sa réactivation."}
              </AlertDescription>
            </Alert>
          )}
          <div className="grid gap-4 lg:grid-cols-2">
            <SitePanel title="Emplacement">
              <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
                <SiteField
                  label="Ville"
                  value={site.city || "Non renseignée"}
                />
                <SiteField
                  label="Quartier"
                  value={site.district || "Non renseigné"}
                />
                <SiteField
                  label="Adresse"
                  value={site.addressDetails || "Non renseignée"}
                  className="sm:col-span-2"
                />
                <SiteField
                  label="Fuseau horaire"
                  value={site.timezone}
                  className="sm:col-span-2"
                />
              </dl>
            </SitePanel>
            <SitePanel title="Informations complémentaires">
              <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
                <SiteField
                  label="Description"
                  value={site.description || "Non renseignée"}
                  className="sm:col-span-2"
                />
                <SiteField
                  label="Créé le"
                  value={new Date(site.createdAt).toLocaleString("fr-FR")}
                />
                <SiteField
                  label="Dernière modification"
                  value={new Date(site.updatedAt).toLocaleString("fr-FR")}
                />
                <SiteField
                  label="Identifiant du site"
                  value={site.id}
                  className="sm:col-span-2"
                />
              </dl>
            </SitePanel>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              className="rounded-full"
              disabled={query.isFetching}
              onClick={() => void query.refetch()}
            >
              Actualiser le site
            </Button>
            <span aria-live="polite" className="sr-only">
              {query.isFetching ? "Actualisation en cours" : ""}
            </span>
          </div>
        </>
      )}
    </div>
  );
}
