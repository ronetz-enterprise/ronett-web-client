import { Link } from "react-router";
import { ApiError, toUserMessage } from "@/shared/errors/api-error";
import { Button } from "@/shared/ui/button";
import { CorrelationIdDisplay } from "@/shared/components/feedback";
const labels: Record<string, string> = {
  MEMBERSHIP_SUSPENDED: "Votre accès est suspendu.",
  MEMBERSHIP_REVOKED: "Votre accès a été retiré.",
  ORGANIZATION_SUSPENDED: "Cette organisation est suspendue.",
  ORGANIZATION_CLOSED: "Cette organisation est fermée.",
};
export function OrganizationAccessNotice({
  error,
  retry,
}: {
  error?: unknown;
  retry?: () => void;
}) {
  const denied = error instanceof ApiError && [403, 404].includes(error.status);
  const code = error instanceof ApiError ? error.problem?.code : undefined;
  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold">
        {denied ? "Accès non autorisé" : "Accès non vérifié"}
      </h1>
      <p role="alert">
        {denied
          ? (code && labels[code]) ||
            "Cet espace n’est pas accessible avec votre compte."
          : toUserMessage(error)}
      </p>
      {retry && <Button onClick={retry}>Vérifier à nouveau</Button>}
      {error instanceof ApiError && error.correlationId && (
        <CorrelationIdDisplay correlationId={error.correlationId} />
      )}
      <Link className="block underline" to="/organizations/select">
        Mes organisations
      </Link>
      <Link className="block underline" to="/account">
        Ma session
      </Link>
    </section>
  );
}
