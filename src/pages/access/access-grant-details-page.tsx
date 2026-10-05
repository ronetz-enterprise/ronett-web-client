import { Navigate, useParams } from "react-router";
import { accessRoutes } from "@/features/access";
import { useActiveOrganization } from "@/features/organizations";

/** Le détail d'un accès s'ouvre dans le panneau de la liste : l'ancienne adresse y renvoie. */
export default function AccessGrantDetailsPage() {
  const active = useActiveOrganization();
  const { accessGrantId = "" } = useParams();
  return (
    <Navigate
      replace
      to={`${accessRoutes.list(active.organizationId)}?access=${encodeURIComponent(accessGrantId)}`}
    />
  );
}
