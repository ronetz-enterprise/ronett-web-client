import {
  usePlatformSession,
  PlatformDashboard,
} from "@/features/platform-admin";

export default function PlatformDashboardPage() {
  const session = usePlatformSession();
  // Le garde a déjà refusé l'absence de permission : le rendu n'affiche jamais
  // de données plateforme à un compte non autorisé.
  if (!session.data) return null;
  return <PlatformDashboard session={session.data} />;
}
