import { Alert, AlertTitle, AlertDescription } from "@/shared/ui/alert";
import { Skeleton } from "@/shared/ui/skeleton";
import { Button } from "@/shared/ui/button";
import { ApiError, toUserMessage } from "@/shared/errors/api-error";
import { CorrelationIdDisplay } from "./feedback";
export function ContentSkeleton() {
  return (
    <div role="status" aria-label="Chargement du contenu" className="space-y-3">
      <Skeleton className="h-8 w-1/2" />
      <Skeleton className="h-24 w-full" />
      <span className="sr-only">Chargement…</span>
    </div>
  );
}
export function QueryFailure({
  error,
  retry,
}: {
  error: unknown;
  retry?: () => void;
}) {
  return (
    <Alert variant="destructive">
      <AlertTitle>
        {error instanceof ApiError && error.status === 403
          ? "Accès refusé"
          : "Impossible de terminer la demande"}
      </AlertTitle>
      <AlertDescription>
        <p>{toUserMessage(error)}</p>
        {error instanceof ApiError && error.correlationId && (
          <CorrelationIdDisplay correlationId={error.correlationId} />
        )}{" "}
        {retry && (
          <Button variant="outline" onClick={retry}>
            Réessayer
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
}
