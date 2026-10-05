import { Navigate, useParams } from "react-router";
import { useActiveOrganization } from "@/features/organizations";

/** Ancienne adresse : la création se fait désormais dans une modale, sur la page Offres. */
export default function Page() {
  const active = useActiveOrganization();
  const { siteId = "" } = useParams();
  const search = new URLSearchParams({ site: siteId, create: "offer" });
  return (
    <Navigate replace to={`/app/${active.organizationId}/offers?${search}`} />
  );
}
