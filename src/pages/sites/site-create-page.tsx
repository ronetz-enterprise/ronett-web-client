import { Navigate } from "react-router";
import { useActiveOrganization } from "@/features/organizations";
import { siteRoutes } from "@/features/site";

/** Ancienne adresse : la création se fait désormais dans une modale, sur la liste des sites. */
export default function SiteCreatePage() {
  const active = useActiveOrganization();
  return (
    <Navigate
      replace
      to={`${siteRoutes.list(active.organizationId)}?create=site`}
    />
  );
}
