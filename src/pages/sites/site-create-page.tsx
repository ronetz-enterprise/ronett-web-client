import { useActiveOrganization } from "@/features/organizations";
import { SiteCreate } from "@/features/site";
export default function SiteCreatePage() {
  const active = useActiveOrganization();
  return <SiteCreate key={active.organizationId} active={active} />;
}
