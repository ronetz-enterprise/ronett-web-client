import { Link } from "react-router";
import type { Membership } from "@/features/memberships";
import { PageHeader, PageLoading } from "@/shared/components/feedback";
import { SummaryCard } from "@/shared/components/page-patterns";
import { ApiError } from "@/shared/errors/api-error";
import { Button } from "@/shared/ui/button";
import { Alert, AlertTitle, AlertDescription } from "@/shared/ui/alert";
import { siteCapabilities, siteRoutes } from "../model/site";
import { useSite } from "../queries/sites";
import { SiteBreadcrumb, SiteFailure, SiteStatus } from "./site-shared";
import { SiteForm } from "./site-form";
import { SiteActions } from "./site-actions";

export function SiteCreate({ active }: { active: Membership }) {
  if (!siteCapabilities(active).canCreateSite)
    return <SiteFailure error={new ApiError("http", 403)} />;
  return (
    <div className="max-w-3xl space-y-6">
      <PageHeader
        title="Créer un site"
        description={`Ce site sera rattaché à ${active.organizationName}.`}
        breadcrumb={
          <SiteBreadcrumb
            organizationId={active.organizationId}
            current="Nouveau site"
          />
        }
      />
      <SummaryCard title="Informations du site">
        <SiteForm active={active} />
      </SummaryCard>
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
    <div className="max-w-4xl space-y-6">
      <PageHeader
        title={editing ? "Modifier le site" : site.name}
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
                  Modifier le site
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
          <SummaryCard title="Informations du site">
            <SiteForm key={site.id} active={active} site={site} />
          </SummaryCard>
        ) : (
          <Alert>
            <AlertTitle>Modification indisponible</AlertTitle>
            <AlertDescription>
              Ce site est fermé ou vos droits ne permettent plus de le modifier.{" "}
              <Link
                className="underline"
                to={siteRoutes.detail(active.organizationId, site.id)}
              >
                Revenir au détail
              </Link>
            </AlertDescription>
          </Alert>
        )
      ) : (
        <>
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
          <div className="grid gap-4 md:grid-cols-2">
            <SummaryCard title="Emplacement">
              <dl className="space-y-4">
                {[
                  ["Ville", site.city],
                  ["Quartier", site.district],
                  ["Adresse", site.addressDetails],
                  ["Fuseau horaire", site.timezone],
                ].map(([label, value]) => (
                  <div key={label}>
                    <dt className="text-muted-foreground">{label}</dt>
                    <dd className="break-words">{value || "Non renseigné"}</dd>
                  </div>
                ))}
              </dl>
            </SummaryCard>
            <SummaryCard title="Informations complémentaires">
              <dl className="space-y-4">
                <div>
                  <dt className="text-muted-foreground">Description</dt>
                  <dd className="break-words whitespace-pre-wrap">
                    {site.description || "Non renseignée"}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Créé le</dt>
                  <dd>{new Date(site.createdAt).toLocaleString("fr-FR")}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">
                    Dernière modification
                  </dt>
                  <dd>{new Date(site.updatedAt).toLocaleString("fr-FR")}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Identifiant du site</dt>
                  <dd className="break-all text-xs">{site.id}</dd>
                </div>
              </dl>
            </SummaryCard>
          </div>
          <Button
            variant="outline"
            disabled={query.isFetching}
            onClick={() => void query.refetch()}
          >
            Actualiser le site
          </Button>
        </>
      )}
    </div>
  );
}
