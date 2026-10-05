import { AppLoading } from "@/shared/components/feedback";
import {
  PlatformCommandPalette,
  usePlatformSession,
} from "@/features/platform-admin";
import { OrganizationShell } from "./app-layout";

/**
 * Coquille de l'administration plateforme.
 *
 * Même coquille visuelle que l'espace organisation, mais sans contexte
 * organisation : la navigation affichée est celle des permissions plateforme
 * effectivement accordées. La route enfant est rendue par la coquille, et la
 * palette `Ctrl K` y est disponible partout.
 */
export default function PlatformAdminLayout() {
  const session = usePlatformSession();
  if (session.isPending) return <AppLoading />;
  return (
    <>
      <OrganizationShell permissions={session.data?.permissions ?? []} />
      {session.data && <PlatformCommandPalette session={session.data} />}
    </>
  );
}
