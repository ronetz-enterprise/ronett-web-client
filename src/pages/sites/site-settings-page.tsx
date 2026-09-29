import { useParams } from "react-router";
import { useActiveOrganization } from "@/features/organizations";
import { SiteDetails } from "@/features/site";
export default function SiteSettingsPage() {
  const active = useActiveOrganization();
  const { siteId = "" } = useParams();
  return (
    <SiteDetails
      key={`${active.organizationId}/${siteId}`}
      active={active}
      siteId={siteId}
      editing
    />
  );
}
