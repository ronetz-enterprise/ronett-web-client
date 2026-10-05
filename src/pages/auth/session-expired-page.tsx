import { Link, Navigate, useSearchParams } from "react-router";
import { PageHeader } from "@/shared/components/feedback";
import { Button } from "@/shared/ui/button";
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
      <Button
        className="w-full"
        nativeButton={false}
        render={
          <Link
            to={"/auth/login?returnTo=" + encodeURIComponent(destination)}
          />
        }
      >
        Se reconnecter
      </Button>
    </>
  );
}
