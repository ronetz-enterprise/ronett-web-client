import { Outlet } from "react-router";
import { ApiError } from "@/shared/errors/api-error";
import {
  AppLoading,
  EmptyState,
  PageHeader,
} from "@/shared/components/feedback";
import { Button } from "@/shared/ui/button";
import { usePlatformSession } from "@/features/platform-admin";

/**
 * Garde de l'espace plateforme.
 *
 * Le backend reste la référence : la session plateforme répond 403 à un compte
 * non administrateur. L'écran affiche alors un refus, sans rien divulguer du
 * contenu de la plateforme.
 */
export default function PlatformAdminRoute() {
  const session = usePlatformSession();
  if (session.isPending) return <AppLoading />;
  if (session.isError)
    return (
      <PlatformUnavailable
        forbidden={
          session.error instanceof ApiError && session.error.status === 403
        }
        retry={() => void session.refetch()}
      />
    );
  return <Outlet />;
}

function PlatformUnavailable({
  forbidden,
  retry,
}: {
  forbidden: boolean;
  retry: () => void;
}) {
  if (!forbidden)
    return (
      <div className="mx-auto max-w-xl p-6">
        <EmptyState
          title="Console plateforme indisponible"
          description="La plateforme n'a pas confirmé votre session d'administration."
          actions={
            <Button variant="outline" onClick={retry}>
              Réessayer
            </Button>
          }
        />
      </div>
    );
  return (
    <div className="mx-auto max-w-xl space-y-4 p-6">
      <PageHeader
        title="Accès interdit"
        description="Vous n'avez pas accès à cet espace."
      />
      <EmptyState
        title="Aucune permission plateforme"
        description="L'administration de la plateforme exige une permission accordée explicitement. Un rôle de propriétaire d'organisation ne la donne pas."
      />
      <Button variant="outline" onClick={retry}>
        Vérifier à nouveau
      </Button>
    </div>
  );
}
