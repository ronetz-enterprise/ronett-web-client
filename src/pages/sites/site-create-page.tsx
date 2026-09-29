import { useActiveOrganization } from "@/features/organizations";
import { SiteCreate, SiteShell } from "@/features/site";
export default function SiteCreatePage() {
  const active = useActiveOrganization();
  return (
    <SiteShell className="min-w-0">
      <SiteCreate key={active.organizationId} active={active} />
    </SiteShell>
  );
}
