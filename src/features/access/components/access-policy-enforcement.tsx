import { HugeiconsIcon } from "@hugeicons/react";
import { InformationCircleIcon } from "@hugeicons/core-free-icons";
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert";

/**
 * Réserve sur les conditions : seule l'expiration est imposée par le réseau du site. La
 * projection RADIUS n'écrit ni débit, ni quota, ni limite d'appareils
 * (`platform/docs/access.md`, « Projection implémentée ») ; aucune garantie n'est affirmée.
 */
export function AccessPolicyEnforcement() {
  return (
    <Alert className="max-w-xl">
      <HugeiconsIcon icon={InformationCircleIcon} strokeWidth={1.75} />
      <AlertTitle>Seule la durée est contrôlée pour l’instant</AlertTitle>
      <AlertDescription>
        Le volume de données, les vitesses et le nombre d’appareils sont
        enregistrés avec l’accès, mais le réseau ne les limite pas encore.
        Évitez de les présenter comme garantis à vos clients.
      </AlertDescription>
    </Alert>
  );
}
