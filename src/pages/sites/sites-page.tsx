import { useActiveOrganization } from "@/features/organizations";
import { SiteShell, SitesList } from "@/features/site";
export default function SitesPage() {
  const active = useActiveOrganization();
  return (
    <SiteShell className="min-w-0">
      <SitesList key={active.organizationId} active={active} />
    </SiteShell>
  );
}
