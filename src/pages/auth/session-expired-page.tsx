import { Link, Navigate, useSearchParams } from "react-router";
import { PageHeader } from "@/shared/components/feedback";
import { safeAuthDestination, useAuth } from "@/features/authentication";
export default function SessionExpiredPage() {
  const [params] = useSearchParams();
  const auth = useAuth();
  const destination = safeAuthDestination(params.get("returnTo"));
  if (auth.status === "authenticated" || auth.status === "refreshing")
    return <Navigate to={destination} replace />;
  return (
    <>
      <PageHeader
        title="Session terminée"
        description="La session n’est plus disponible. Reconnectez-vous pour continuer."
      />
      <Link
        className="underline"
        to={"/auth/login?returnTo=" + encodeURIComponent(destination)}
      >
        Se reconnecter
      </Link>
    </>
  );
}
