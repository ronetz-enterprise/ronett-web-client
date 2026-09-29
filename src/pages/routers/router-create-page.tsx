import { useSearchParams } from "react-router";
import { useActiveOrganization } from "@/features/organizations";
import { RouterCreate } from "@/features/router";
export default function RouterCreatePage() {
  const active = useActiveOrganization();
  const [params] = useSearchParams();
  const siteId = params.get("siteId") ?? undefined;
  return (
    <RouterCreate
      key={`${active.organizationId}/${siteId ?? ""}`}
      active={active}
      siteId={siteId}
    />
  );
}
