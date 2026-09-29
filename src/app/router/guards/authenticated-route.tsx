import { Navigate, Outlet, useLocation } from "react-router";
import {
  useAuth,
  safeAuthDestination,
  SessionRecovery,
} from "@/features/authentication";
import { AppLoading } from "@/shared/components/feedback";
import { usePrincipal } from "@/features/identity";
import { OrganizationAccessNotice } from "@/features/organizations";
export default function AuthenticatedRoute() {
  const auth = useAuth();
  const principal = usePrincipal();
  const location = useLocation();
  if (auth.status === "unavailable") return <SessionRecovery />;
  if (auth.status === "initializing") return <AppLoading />;
  if (auth.status === "authenticated" || auth.status === "refreshing") {
    if (principal.isPending) return <AppLoading />;
    if (principal.isError)
      return (
        <OrganizationAccessNotice
          error={principal.error}
          retry={() => void principal.refetch()}
        />
      );
    return <Outlet />;
  }
  const target =
    auth.status === "expired" ? "/auth/session-expired" : "/auth/login";
  return (
    <Navigate
      replace
      to={
        target +
        "?returnTo=" +
        encodeURIComponent(safeAuthDestination(location.pathname))
      }
    />
  );
}
