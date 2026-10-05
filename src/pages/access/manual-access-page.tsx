import { Navigate } from "react-router";
import { accessRoutes } from "@/features/access";
import { useActiveOrganization } from "@/features/organizations";

/** Ancienne adresse : la création se fait désormais dans une modale, sur la liste des accès. */
export default function ManualAccessPage() {
  const active = useActiveOrganization();
  return (
    <Navigate
      replace
      to={`${accessRoutes.list(active.organizationId)}?create=access`}
    />
  );
}
