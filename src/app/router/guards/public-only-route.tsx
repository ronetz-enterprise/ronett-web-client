import { Navigate, Outlet, useSearchParams } from "react-router";
import {
  useAuth,
  safeAuthDestination,
  SessionRecovery,
} from "@/features/authentication";
import { AppLoading } from "@/shared/components/feedback";
export default function PublicOnlyRoute() {
  const auth = useAuth();
  const [params] = useSearchParams();
  if (auth.status === "unavailable") return <SessionRecovery />;
  if (auth.status === "initializing") return <AppLoading />;
  if (auth.status === "authenticated" || auth.status === "refreshing")
    return (
      <Navigate replace to={safeAuthDestination(params.get("returnTo"))} />
    );
  return <Outlet />;
}
