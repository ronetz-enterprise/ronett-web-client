import { useParams, useSearchParams } from "react-router";
import { useActiveOrganization } from "@/features/organizations";
import { RouterDetails } from "@/features/router";
export default function RouterSettingsPage() {
  const active = useActiveOrganization();
  const { routerId = "" } = useParams();
  const [params] = useSearchParams();
  const expectedSite = params.get("siteId") ?? undefined;
  return (
    <RouterDetails
      key={`${active.organizationId}/${routerId}/${expectedSite ?? ""}`}
      active={active}
      routerId={routerId}
      expectedSite={expectedSite}
      tab="settings"
    />
  );
}
