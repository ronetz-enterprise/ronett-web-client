import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert";
import { Spinner } from "@/shared/ui/spinner";
import { toUserMessage } from "@/shared/errors/api-error";
import { useRemoteCredentialDelivery } from "../mutations/remote-credential-delivery";
import { IssuedCredentialPanel } from "./issued-credential-panel";

/**
 * Identifiants d'un accès créé sur un site servi par un nœud : le mot de passe n'est remis
 * qu'une fois l'accès activé sur le réseau du site, ce qui prend quelques secondes.
 */
export function RemoteCredentialPanel({
  accessGrantId,
  retrievalToken,
  onAcknowledge,
}: {
  accessGrantId: string;
  retrievalToken: string;
  onAcknowledge: () => void;
}) {
  const state = useRemoteCredentialDelivery(accessGrantId, retrievalToken);
  if (state.status === "ready")
    return (
      <IssuedCredentialPanel
        credential={state.credential}
        onAcknowledge={onAcknowledge}
      />
    );
  if (state.status === "waiting")
    return (
      <div
        role="status"
        aria-live="polite"
        className="flex items-center gap-3 text-sm text-muted-foreground"
      >
        <Spinner role="presentation" aria-hidden="true" />
        Activation de l’accès sur le réseau du site… Les identifiants
        s’affichent dès qu’il est prêt.
      </div>
    );
  return (
    <Alert>
      <AlertTitle>Le mot de passe ne peut pas être affiché</AlertTitle>
      <AlertDescription>
        {state.status === "expired"
          ? "Le délai d’affichage est dépassé. L’accès reste valable : révoquez-le et créez-en un nouveau si vous n’avez pas noté le mot de passe."
          : `L’accès est créé, mais son activation sur le réseau du site n’a pas été confirmée. ${toUserMessage(state.error)}`}
      </AlertDescription>
    </Alert>
  );
}
