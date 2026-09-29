import { useActiveOrganization } from "@/features/organizations";
import { SitesList } from "@/features/site";
export default function SitesPage() {
  const active = useActiveOrganization();
  return <SitesList key={active.organizationId} active={active} />;
}
