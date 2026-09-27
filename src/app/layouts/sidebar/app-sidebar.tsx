import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/shared/ui/sidebar";
import { NavMain } from "./nav-main";
import { TeamSwitcher } from "./team-switcher";
import { navigationFor } from "@/app/router/navigation";
export function AppSidebar({ organizationId }: { organizationId?: string }) {
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <TeamSwitcher organizationId={organizationId} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain
          label={
            organizationId ? "Espace organisation" : "Administration plateforme"
          }
          items={navigationFor(organizationId)}
        />
      </SidebarContent>
      <SidebarFooter>
        <span className="p-2 text-xs text-muted-foreground group-data-[collapsible=icon]:sr-only">
          Aperçu du socle · Sans session
        </span>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
