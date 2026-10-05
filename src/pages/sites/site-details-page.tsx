import { useParams } from "react-router";
import { SiteNextStep } from "@/features/dashboard";
import { useActiveOrganization } from "@/features/organizations";
import { SiteDetails, SiteShell, useSite } from "@/features/site";
import { SiteMetrics } from "./site-summary";
export default function SiteDetailsPage() {
  const active = useActiveOrganization();
  const { siteId = "" } = useParams();
  const site = useSite(active, siteId).data;
  return (
    <SiteShell className="min-w-0">
      <SiteDetails
        key={`${active.organizationId}/${siteId}`}
        active={active}
        siteId={siteId}
        summary={site && <SiteNextStep active={active} site={site} />}
        metrics={site && <SiteMetrics active={active} site={site} />}
      />
    </SiteShell>
  );
}
