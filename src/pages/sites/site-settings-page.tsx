import { useParams } from "react-router";
import { useActiveOrganization } from "@/features/organizations";
import { SiteDetails, SiteShell } from "@/features/site";
export default function SiteSettingsPage() {
  const active = useActiveOrganization();
  const { siteId = "" } = useParams();
  return (
    <SiteShell className="min-w-0">
      <SiteDetails
        key={`${active.organizationId}/${siteId}`}
        active={active}
        siteId={siteId}
        editing
      />
    </SiteShell>
  );
}
