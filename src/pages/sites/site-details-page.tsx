import { SiteRouterEntry } from "@/features/router";
import { useParams } from "react-router";
import { useActiveOrganization } from "@/features/organizations";
import { SiteDetails } from "@/features/site";
export default function SiteDetailsPage() {
  const active = useActiveOrganization();
  const { siteId = "" } = useParams();
  return (
    <div className="space-y-6">
      <SiteDetails
        key={`${active.organizationId}/${siteId}`}
        active={active}
        siteId={siteId}
      />
      <SiteRouterEntry active={active} siteId={siteId} />
    </div>
  );
}
