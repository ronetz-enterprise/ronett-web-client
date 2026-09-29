import { Link } from "react-router";
import { StatusBadge } from "@/shared/components/feedback";
import { QueryFailure } from "@/shared/components/query-feedback";
import { ApiError } from "@/shared/errors/api-error";
import { Alert, AlertTitle, AlertDescription } from "@/shared/ui/alert";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/ui/tooltip";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from "@/shared/ui/breadcrumb";
import {
  routerRoutes,
  lifecycleLabels,
  provisioningLabels,
  connectivityLabels,
  type Router,
} from "../model/router";

export function RouterStatus({
  router,
  dimension,
}: {
  router: Router;
  dimension: "lifecycle" | "provisioning" | "connectivity";
}) {
  if (dimension === "lifecycle")
    return (
      <StatusBadge
        label={lifecycleLabels[router.lifecycleStatus]}
        tone={
          router.lifecycleStatus === "ACTIVE"
            ? "success"
            : router.lifecycleStatus === "SUSPENDED"
              ? "warning"
              : "neutral"
        }
      />
    );
  if (dimension === "connectivity")
    return (
      <StatusBadge
        label={connectivityLabels[router.connectivityStatus]}
        tone={
          router.connectivityStatus === "ONLINE"
            ? "success"
            : router.connectivityStatus === "OFFLINE"
              ? "warning"
              : "neutral"
        }
      />
    );
  return (
    <StatusBadge
      label={provisioningLabels[router.provisioningStatus]}
      tone={
        router.provisioningStatus === "FAILED"
          ? "danger"
          : router.provisioningStatus === "REGISTERED"
            ? "success"
            : router.provisioningStatus === "NOT_REQUESTED"
              ? "neutral"
              : "info"
      }
    />
  );
}
export function RouterBreadcrumb({
  org,
  current,
  router,
}: {
  org: string;
  current: string;
  router?: Router;
}) {
  return (
    <Breadcrumb aria-label="Fil d’Ariane des routeurs">
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink render={<Link to={routerRoutes.list(org)} />}>
            Routeurs
          </BreadcrumbLink>
        </BreadcrumbItem>
        {router && (
          <>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink
                render={<Link to={routerRoutes.detail(org, router.id)} />}
              >
                {router.name}
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
export function LastObservation({
  at,
  timezone,
}: {
  at: string | null;
  timezone?: string;
}) {
  if (!at)
    return (
      <span className="text-sm text-muted-foreground">
        Aucune observation reçue
      </span>
    );
  const date = new Date(at),
    seconds = Math.round((date.getTime() - Date.now()) / 1000);
  const [value, unit]: [number, Intl.RelativeTimeFormatUnit] =
    Math.abs(seconds) < 60
      ? [seconds, "second"]
      : Math.abs(seconds) < 3600
        ? [Math.round(seconds / 60), "minute"]
        : Math.abs(seconds) < 86400
          ? [Math.round(seconds / 3600), "hour"]
          : [Math.round(seconds / 86400), "day"];
  let exact: string;
  try {
    exact = new Intl.DateTimeFormat("fr-FR", {
      dateStyle: "long",
      timeStyle: "long",
      timeZone: timezone,
    }).format(date);
  } catch {
    exact = date.toISOString();
  }
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <button
            type="button"
            className="text-left text-sm underline decoration-dotted underline-offset-4"
          />
        }
        aria-label={`Dernière observation : ${exact}`}
      >
        <time dateTime={at}>
          {new Intl.RelativeTimeFormat("fr", { numeric: "auto" }).format(
            value,
            unit,
          )}
        </time>
      </TooltipTrigger>
      <TooltipContent>
        {exact}
        {timezone ? ` · ${timezone}` : " · fuseau du navigateur"}
      </TooltipContent>
    </Tooltip>
  );
}
export const transientRouterError = (error: unknown) =>
  error instanceof ApiError &&
  (["network", "timeout", "aborted"].includes(error.kind) ||
    error.status >= 500 ||
    error.status === 429);
export function RouterFailure({
  error,
  retry,
}: {
  error: unknown;
  retry?: () => void;
}) {
  return (
    <div className="space-y-3">
      <QueryFailure error={error} retry={retry} />
      {error instanceof ApiError && error.status === 409 && (
        <p className="text-sm text-muted-foreground">
          Une commande peut déjà être en attente ou l’état du routeur ou du site
          a changé. Consultez l’état actuel avant une nouvelle intention.
        </p>
      )}
      {transientRouterError(error) && (
        <p className="text-sm text-muted-foreground">
          Le résultat technique n’est pas confirmé. Une indisponibilité ne
          signifie pas que la commande a échoué. Si la réponse d’une commande a
          été perdue, rejouez la même demande.
        </p>
      )}
    </div>
  );
}
export function InfrastructureNotice() {
  return (
    <Alert>
      <AlertTitle>Exécution réseau non raccordée</AlertTitle>
      <AlertDescription>
        Le backend peut enregistrer les demandes. L’intégration réseau
        disponible dans cette version ne permet pas encore de garantir leur
        exécution sur l’équipement. Une demande acceptée ne confirme ni une
        installation ni une connexion.
      </AlertDescription>
    </Alert>
  );
}
