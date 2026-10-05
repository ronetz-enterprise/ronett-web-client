import { Navigate, useParams } from "react-router";
import { useActiveOrganization } from "@/features/organizations";
import { routerRoutes } from "@/features/router";

/** Les routeurs d'un site ne sont plus un onglet : la liste des routeurs, filtrée sur le site. */
export default function SiteRoutersPage() {
  const active = useActiveOrganization();
  const { siteId = "" } = useParams();
  return (
    <Navigate
      replace
      to={`${routerRoutes.list(active.organizationId)}?site=${encodeURIComponent(siteId)}`}
    />
  );
}
