import { useActiveOrganization } from "@/features/organizations";
import { Link } from "react-router";
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/shared/ui/sidebar";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  SidebarTrigger,
} from "@/shared/ui/sidebar";
import { NavMain } from "./nav-main";
import { navigationFor } from "@/app/router/navigation";
export function AppSidebar({ organizationId }: { organizationId?: string }) {
  const active = useActiveOrganization();
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b py-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              aria-label="Ronetz"
              render={
                <Link to={organizationId ? `/app/${organizationId}` : "/"} />
              }
            >
              <span
                aria-hidden="true"
                className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary font-heading text-base font-semibold text-primary-foreground"
              >
                R
              </span>
              <span className="font-heading text-base font-semibold group-data-[collapsible=icon]:hidden">
                Ronetz
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain
          label={
            organizationId ? "Espace organisation" : "Administration plateforme"
          }
          items={navigationFor(organizationId).filter(
            (item) =>
              !item.permission || active.permissions.includes(item.permission),
          )}
        />
      </SidebarContent>
      <SidebarFooter>
        <div className="border-t pt-2">
          <SidebarTrigger
            className="w-full justify-center bg-transparent text-sidebar-foreground hover:bg-sidebar-accent"
            aria-label="Replier ou déplier la barre latérale"
          />
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
