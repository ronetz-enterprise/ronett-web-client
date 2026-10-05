import { useActiveOrganization } from "@/features/organizations";
import { useRouterSummary } from "@/features/router";
import { SiteShell, SitesList } from "@/features/site";
import { SiteRoutersCell } from "./site-summary";
export default function SitesPage() {
  const active = useActiveOrganization();
  const routers = useRouterSummary(active);
  return (
    <SiteShell className="min-w-0">
      <SitesList
        key={active.organizationId}
        active={active}
        renderRouters={(site) => (
          <SiteRoutersCell site={site} routers={routers} />
        )}
      />
    </SiteShell>
  );
}
