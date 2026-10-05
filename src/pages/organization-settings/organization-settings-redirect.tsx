import { Navigate } from "react-router";
import { useActiveOrganization } from "@/features/organizations";
import { organizationRoutes } from "@/shared/auth/organization-routes";

/** `/settings` ouvre la section Général, active dans la barre latérale des paramètres. */
export default function OrganizationSettingsRedirect() {
  const active = useActiveOrganization();
  return (
    <Navigate replace to={organizationRoutes.settings(active.organizationId)} />
  );
}
