import { Link } from "react-router";
import { PageHeader, StatusBadge } from "@/shared/components/feedback";
import { QueryFailure } from "@/shared/components/query-feedback";
import { ApiError } from "@/shared/errors/api-error";
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from "@/shared/ui/breadcrumb";
import { siteRoutes, siteStatusLabels, type Site } from "../model/site";

/**
 * En-tete de page plat : titre, description et actions alignees a droite,
 * separes du contenu par un trait horizontal. Remplace PageHeader, dont la
 * composition serree ne correspond pas a la reference.
 */
/** En-tête des pages sites : alias du `PageHeader` unique, conservé pour les appels existants. */
export function SitePageHeader(props: React.ComponentProps<typeof PageHeader>) {
  return <PageHeader {...props} />;
}

export function SiteStatus({ site }: { site: Site }) {
  return (
    <StatusBadge
      label={siteStatusLabels[site.status]}
      tone={
        site.status === "ACTIVE"
          ? "success"
          : site.status === "SUSPENDED"
            ? "warning"
            : "neutral"
      }
    />
  );
}

export function SiteBreadcrumb({
  organizationId,
  site,
  current,
}: {
  organizationId: string;
  site?: Site;
  current: string;
}) {
  return (
    <Breadcrumb aria-label="Fil d’Ariane des sites">
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink
            render={<Link to={siteRoutes.list(organizationId)} />}
          >
            Sites
          </BreadcrumbLink>
        </BreadcrumbItem>
        {site && (
          <>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink
                className="max-w-64 truncate"
                render={
                  <Link to={siteRoutes.detail(organizationId, site.id)} />
                }
              >
                {site.name}
              </BreadcrumbLink>
            </BreadcrumbItem>
          </>
        )}
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage role={undefined} aria-disabled={undefined}>
            {current}
          </BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}

export function SiteFailure({
  error,
  retry,
}: {
  error: unknown;
  retry?: () => void;
}) {
  const type =
    error instanceof ApiError
      ? error.problem?.type?.split("/").pop()
      : undefined;
  return (
    <div className="space-y-3">
      <QueryFailure error={error} retry={retry} />
      {error instanceof ApiError && error.status === 409 && (
        <Alert>
          <AlertTitle>Vérifiez les informations actuelles</AlertTitle>
          <AlertDescription>
            {type === "duplicate-site-name"
              ? "Ce nom est déjà utilisé dans cette organisation, éventuellement par un site fermé. Choisissez un autre nom."
              : "Le site a pu changer d’état. Rechargez ses informations avant de renouveler l’action. Votre saisie est conservée tant que vous ne quittez pas le formulaire."}
          </AlertDescription>
        </Alert>
      )}
      {error instanceof ApiError &&
        ["network", "timeout", "invalid-response"].includes(error.kind) && (
          <p className="text-sm text-muted-foreground">
            Le résultat de la demande peut être incertain. Consultez les
            informations actualisées avant de renouveler une création ou une
            modification.
          </p>
        )}
    </div>
  );
}
