import { useEffect } from "react";
import { Navigate } from "react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useMembershipAccess, membershipKeys } from "@/features/memberships";
import { OrganizationAccessNotice } from "@/features/organizations";
import {
  CorrelationIdDisplay,
  PageHeader,
  PageLoading,
} from "@/shared/components/feedback";
import { Button } from "@/shared/ui/button";
import { ApiError } from "@/shared/errors/api-error";
import { organizationRoutes } from "@/shared/auth/organization-routes";
import { useCreationAttempt } from "../hooks/onboarding-provider";
export function CreationResult() {
  const attempt = useCreationAttempt();
  if (attempt.status === "created" && attempt.organization)
    return <ConfirmOwner id={attempt.organization.id} />;
  if (attempt.status === "creating")
    return (
      <>
        <PageHeader title="Vérification de la création en cours" />
        <PageLoading />
      </>
    );
  const code =
    attempt.error instanceof ApiError ? attempt.error.problem?.code : undefined;
  const terminal =
    code === "IDEMPOTENCY_CONFLICT" ||
    code === "IDEMPOTENCY_KEY_EXPIRED" ||
    !attempt.intention;
  return (
    <section className="space-y-4">
      <PageHeader title="Résultat de création inconnu" />
      <p role="alert">
        {terminal
          ? "La création nécessite une vérification auprès de votre administrateur. Ne créez pas de nouvelle demande pour la même organisation."
          : "La demande a peut-être abouti. Vérifiez son résultat sans créer de doublon."}
      </p>
      {!terminal && (
        <Button onClick={() => void attempt.recover()}>
          Réessayer la vérification
        </Button>
      )}
      {attempt.storageUnavailable && (
        <p role="alert">
          La reprise après fermeture du navigateur n’a pas pu être enregistrée.
          Gardez cette page ouverte et contactez votre administrateur si
          nécessaire.
        </p>
      )}
      {attempt.error instanceof ApiError && attempt.error.correlationId && (
        <CorrelationIdDisplay correlationId={attempt.error.correlationId} />
      )}
    </section>
  );
}
function ConfirmOwner({ id }: { id: string }) {
  const query = useMembershipAccess(id);
  const client = useQueryClient();
  useEffect(() => {
    if (query.isSuccess && !query.isFetching)
      void client.invalidateQueries({ queryKey: membershipKeys.mine });
  }, [query.isSuccess, query.isFetching, client]);
  if (query.isPending || query.isFetching) return <PageLoading />;
  if (query.isError)
    return (
      <OrganizationAccessNotice
        error={query.error}
        retry={() => void query.refetch()}
      />
    );
  if (query.data.role !== "OWNER") return <OrganizationAccessNotice />;
  return <Navigate replace to={organizationRoutes.dashboard(id)} />;
}
