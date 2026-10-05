import { Navigate, useSearchParams } from "react-router";
import { useActiveOrganization } from "@/features/organizations";
import { routerRoutes } from "@/features/router";

/** Ancienne adresse : la création se fait désormais dans une modale, sur la liste des routeurs. */
export default function RouterCreatePage() {
  const active = useActiveOrganization();
  const [params] = useSearchParams();
  const siteId = params.get("siteId");
  const search = new URLSearchParams({ create: "router" });
  if (siteId) search.set("siteId", siteId);
  return (
    <Navigate
      replace
      to={`${routerRoutes.list(active.organizationId)}?${search}`}
    />
  );
}
