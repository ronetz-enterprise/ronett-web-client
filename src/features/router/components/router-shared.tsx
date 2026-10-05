import { Link } from "react-router";
import { StatusBadge } from "@/shared/components/feedback";
import { StatusDot } from "@/shared/components/status-dot";
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
/** Connectivité en point de statut ; « en ligne » porte le halo vivant. */
export function RouterConnectivity({ router }: { router: Router }) {
  return (
    <StatusDot
      label={connectivityLabels[router.connectivityStatus]}
      tone={
        router.connectivityStatus === "ONLINE"
          ? "success"
          : router.connectivityStatus === "OFFLINE"
            ? "warning"
            : "neutral"
      }
      live={
        router.connectivityStatus === "ONLINE" &&
        router.lifecycleStatus === "ACTIVE"
      }
    />
  );
}
export function RouterBreadcrumb({
  org,
  current,
}: {
  org: string;
  current: string;
}) {
  return (
    <Breadcrumb aria-label="Fil d’Ariane des routeurs">
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink render={<Link to={routerRoutes.list(org)} />}>
            Routeurs
          </BreadcrumbLink>
        </BreadcrumbItem>
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
      <span className="text-sm text-muted-foreground">Aucun signal reçu</span>
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
        aria-label={`Dernier signal : ${exact}`}
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
  creating = false,
}: {
  error: unknown;
  retry?: () => void;
  /** Ajout d'un routeur : pas d'idempotence, renvoyer pourrait créer un doublon. */
  creating?: boolean;
}) {
  return (
    <div className="space-y-3">
      <QueryFailure error={error} retry={retry} />
      {error instanceof ApiError && error.status === 409 && (
        <p className="text-sm text-muted-foreground">
          {creating
            ? "Ce site n’est plus actif. Choisissez un autre site."
            : "Une autre demande est déjà en cours, ou l’état du routeur a changé. Actualisez la page avant de réessayer."}
        </p>
      )}
      {transientRouterError(error) && (
        <p className="text-sm text-muted-foreground">
          {creating
            ? "Le service n’a pas répondu. Le routeur a peut-être été ajouté : vérifiez la liste des routeurs avant de réessayer."
            : "Le service n’a pas répondu. Votre demande a peut-être été prise en compte : actualisez la page avant de la renvoyer."}
        </p>
      )}
    </div>
  );
}
export function InfrastructureNotice() {
  return (
    <Alert>
      <AlertTitle>
        Mise en service automatique en cours de déploiement
      </AlertTitle>
      <AlertDescription>
        Ronetz enregistre vos demandes, mais leur exécution automatique sur le
        routeur n’est pas encore active dans cette version. Si une étape reste
        bloquée, contactez le support en indiquant l’identifiant du routeur.
      </AlertDescription>
    </Alert>
  );
}
