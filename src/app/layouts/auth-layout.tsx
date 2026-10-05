import { Outlet } from "react-router";
import { AuthShell } from "./auth-shell";

export default function AuthLayout() {
  return (
    <AuthShell align="end">
      <Outlet />
    </AuthShell>
  );
}
