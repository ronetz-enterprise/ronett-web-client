import { Navigate } from "react-router";
import { useActiveOrganization } from "@/features/organizations";
import { organizationRoutes } from "@/shared/auth/organization-routes";

/** Ancienne page « Organisation » : son contenu vit dans Paramètres › Général. */
export default function OrganizationPage() {
  const active = useActiveOrganization();
  return (
    <Navigate replace to={organizationRoutes.settings(active.organizationId)} />
  );
}
