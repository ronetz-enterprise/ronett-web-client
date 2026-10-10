import { Link } from "react-router";
import { HugeiconsIcon } from "@hugeicons/react";
import { AlertCircleIcon } from "@hugeicons/core-free-icons";
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
import {
  accessDisplayState,
  accessRoutes,
  isFailedProjection,
  type AccessGrant,
} from "../model/access-grant";

export function AccessBreadcrumb({
  organizationId,
  grant,
  current,
}: {
  organizationId: string;
  grant?: AccessGrant;
  current: string;
}) {
  return (
    <Breadcrumb aria-label="Fil d’Ariane des accès">
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink
            render={<Link to={accessRoutes.list(organizationId)} />}
          >
            Accès Internet
          </BreadcrumbLink>
        </BreadcrumbItem>
        {grant && (
          <>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink
                render={
                  <Link
                    to={accessRoutes.detail(
                      organizationId,
                      grant.accessGrantId,
                    )}
                  />
                }
              >
                {grant.username ?? `Accès ${grant.accessGrantId.slice(0, 8)}`}
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

/** Erreurs d'accès : un message sûr et la référence de corrélation, sans détail technique. */
export function AccessFailure({
  error,
  retry,
}: {
  error: unknown;
  retry?: () => void;
}) {
  const status = error instanceof ApiError ? error.status : 0;
  return (
    <div className="space-y-3">
      <QueryFailure error={error} retry={retry} />
      {status === 403 && (
        <Alert>
          <AlertTitle>Action non autorisée</AlertTitle>
          <AlertDescription>
            Seuls les propriétaires de l’organisation peuvent consulter et gérer
            les accès.
          </AlertDescription>
        </Alert>
      )}
      {status === 404 && (
        <Alert>
          <AlertTitle>Accès introuvable</AlertTitle>
          <AlertDescription>
            Cet accès n’existe pas ou n’appartient pas à cette organisation.
          </AlertDescription>
        </Alert>
      )}
      {error instanceof ApiError &&
      ["network", "timeout", "invalid-response"].includes(error.kind) ? (
        <p className="text-sm text-muted-foreground">
          L’état affiché n’est peut-être pas à jour. Vérifiez votre connexion
          puis actualisez.
        </p>
      ) : null}
    </div>
  );
}

export function AccessProvisioningAlert({ grant }: { grant: AccessGrant }) {
  if (!isFailedProjection(grant.projectionStatus)) return null;
  // Le réseau applique lui-même l'expiration : rien à signaler au gérant.
  if (grant.status === "EXPIRED") return null;
  if (accessDisplayState(grant).tone === "warning")
    return (
      <Alert variant="destructive">
        <HugeiconsIcon icon={AlertCircleIcon} strokeWidth={1.75} />
        <AlertTitle>Le réseau du site n’est pas encore à jour</AlertTitle>
        <AlertDescription>
          <p>
            Votre demande est enregistrée, mais le client peut encore se
            connecter tant que le réseau n’est pas mis à jour.
          </p>
          <p>
            Ronetz réessaie automatiquement. Depuis « Gestion de l’accès », vous
            pouvez relancer la mise à jour ou annuler l’accès.
          </p>
        </AlertDescription>
      </Alert>
    );
  return (
    <Alert variant="destructive">
      <HugeiconsIcon icon={AlertCircleIcon} strokeWidth={1.75} />
      <AlertTitle>L’accès n’a pas encore pu être activé</AlertTitle>
      <AlertDescription>
        <p>
          L’accès est bien enregistré et l’achat du client n’est pas remis en
          cause, mais le réseau du site n’a pas pu être mis à jour.
        </p>
        <p>
          Ronetz réessaie automatiquement. Vous pouvez aussi relancer
          l’activation depuis « Gestion de l’accès », puis actualiser.
        </p>
      </AlertDescription>
    </Alert>
  );
}
