import { useParams } from "react-router";
import { useActiveOrganization } from "@/features/organizations";
import { OffersList } from "@/features/offer";
import { SiteDetails, SiteShell } from "@/features/site";
export default function Page() {
  const active = useActiveOrganization();
  const { siteId = "" } = useParams();
  return (
    <SiteShell className="min-w-0">
      <SiteDetails
        key={`${active.organizationId}/${siteId}`}
        active={active}
        siteId={siteId}
        tab="offers"
      >
        <OffersList active={active} siteId={siteId} />
      </SiteDetails>
    </SiteShell>
  );
}
