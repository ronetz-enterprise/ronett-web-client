import { Link, useNavigate } from "react-router";
import { StatusBadge } from "@/shared/components/feedback";
import { QueryFailure } from "@/shared/components/query-feedback";
import { ApiError } from "@/shared/errors/api-error";
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert";
import { Tabs, TabsList, TabsTrigger } from "@/shared/ui/tabs";
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
export function SitePageHeader({
  title,
  description,
  status,
  actions,
  breadcrumb,
}: {
  title: string;
  description?: string;
  status?: React.ReactNode;
  actions?: React.ReactNode;
  breadcrumb?: React.ReactNode;
}) {
  return (
    <header className="space-y-4 border-b pb-5">
      {breadcrumb}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-1.5">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="font-heading text-2xl font-semibold tracking-tight break-words">
              {title}
            </h1>
            {status}
          </div>
          {description && (
            <p className="max-w-prose text-sm text-muted-foreground">
              {description}
            </p>
          )}
        </div>
        {actions && (
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {actions}
          </div>
        )}
      </div>
    </header>
  );
}

/**
 * Onglets de navigation du detail, soulignes comme sur la console de
 * reference. La valeur suit la route : un onglet declenche une navigation,
 * aucun etat local a synchroniser.
 */
export function SiteDetailTabs({
  organizationId,
  site,
  editing,
  canEdit,
}: {
  organizationId: string;
  site: Site;
  editing: boolean;
  canEdit: boolean;
}) {
  const navigate = useNavigate();
  return (
    <Tabs
      value={editing ? "settings" : "overview"}
      onValueChange={(value) =>
        navigate(
          value === "settings"
            ? siteRoutes.settings(organizationId, site.id)
            : siteRoutes.detail(organizationId, site.id),
        )
      }
    >
      <TabsList
        variant="line"
        className="h-auto w-full justify-start gap-6 rounded-none"
      >
        <TabsTrigger
          value="overview"
          className="h-auto flex-none rounded-none px-0 pt-2 pb-3 text-sm after:bottom-0"
        >
          Informations
        </TabsTrigger>
        {canEdit && (
          <TabsTrigger
            value="settings"
            className="h-auto flex-none rounded-none px-0 pt-2 pb-3 text-sm after:bottom-0"
          >
            Paramètres
          </TabsTrigger>
        )}
      </TabsList>
    </Tabs>
  );
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
