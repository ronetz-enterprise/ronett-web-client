import { Outlet } from "react-router";
import { AuthShell } from "./auth-shell";

/** Parcours de compte hors organisation : même carte que la connexion, centrée. */
export default function AccountLayout() {
  return (
    <AuthShell>
      <Outlet />
    </AuthShell>
  );
}
