import { useOptionalOrganization } from "@/features/organizations";
import { Link, useLocation } from "react-router";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft01Icon } from "@hugeicons/core-free-icons";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
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
import { SidebarUserMenu } from "./sidebar-user-menu";
import { OrganizationSwitcher } from "./organization-switcher";
import {
  isSettingsPath,
  navigationFor,
  settingsNavigationFor,
} from "@/app/router/navigation";
import { organizationRoutes } from "@/shared/auth/organization-routes";
export function AppSidebar({
  organizationId,
  permissions,
}: {
  organizationId?: string;
  permissions?: readonly string[];
}) {
  // Hors organisation, seule la navigation plateforme s'affiche : la sidebar
  // n'invente pas de permissions qu'aucun contexte ne lui aurait données.
  const active = useOptionalOrganization();
  const granted = permissions ?? active?.permissions ?? [];
  const { state, setOpenMobile } = useSidebar();
  const { pathname } = useLocation();
  // Dans les paramètres, la barre ne montre que leurs sections, comme des onglets.
  const settings = isSettingsPath(organizationId, pathname);
  const allowed = (item: { permission?: string }) =>
    !item.permission || granted.includes(item.permission);
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="gap-3 px-3 pt-4 pb-2 group-data-[collapsible=icon]:px-2">
        {organizationId && settings ? (
          // Paramètres (modèle OpenAI) : retour à l'espace à la place de la marque et du
          // sélecteur d'organisation.
          <SidebarMenu>
            <SidebarMenuItem className="flex items-center gap-1">
              {state === "expanded" && (
                <SidebarMenuButton
                  className="h-8 flex-1"
                  render={
                    <Link
                      to={organizationRoutes.dashboard(organizationId)}
                      onClick={() => setOpenMobile(false)}
                    />
                  }
                >
                  <HugeiconsIcon
                    icon={ArrowLeft01Icon}
                    strokeWidth={1.75}
                    aria-hidden="true"
                  />
                  <span>Retour à l’espace</span>
                </SidebarMenuButton>
              )}
              <SidebarTrigger
                className={
                  state === "expanded"
                    ? "size-8 text-muted-foreground"
                    : "size-8"
                }
              />
            </SidebarMenuItem>
          </SidebarMenu>
        ) : (
          <>
            <SidebarMenu>
              <SidebarMenuItem className="flex items-center">
                {/* Replie : la marque laisse la place au declencheur, sans quoi il
                  n'y aurait plus moyen de redeployer la barre depuis l'en-tete. */}
                {state === "expanded" && (
                  <Link
                    to={organizationId ? `/app/${organizationId}` : "/"}
                    aria-label="Ronetz"
                    className="flex h-8 items-center gap-2 rounded-lg px-1.5 font-heading text-[0.9375rem] font-semibold tracking-tight"
                  >
                    <img src="/logo.png" alt="Ronetz" className="w-9" />
                    Ronetz
                  </Link>
                )}
                <SidebarTrigger
                  className={
                    state === "expanded"
                      ? "ml-auto size-8 text-muted-foreground"
                      : "size-8"
                  }
                />
              </SidebarMenuItem>
            </SidebarMenu>
            {organizationId ? (
              <SidebarMenu>
                <SidebarMenuItem>
                  <OrganizationSwitcher />
                </SidebarMenuItem>
              </SidebarMenu>
            ) : (
              // Repère permanent : on ne doit jamais agir sur la plateforme en croyant être dans une organisation.
              state === "expanded" && (
                <p className="rounded-lg bg-sidebar-accent px-2.5 py-2 text-sm font-medium text-sidebar-accent-foreground">
                  Administration Ronetz
                </p>
              )
            )}
          </>
        )}
      </SidebarHeader>
      <SidebarContent className="pt-1">
        {organizationId && settings ? (
          <NavMain
            label="Paramètres de l’organisation"
            items={settingsNavigationFor(organizationId).filter(allowed)}
          />
        ) : (
          <NavMain
            label={
              organizationId
                ? "Espace organisation"
                : "Administration plateforme"
            }
            items={navigationFor(organizationId).filter(allowed)}
          />
        )}
      </SidebarContent>
      <SidebarFooter className="px-3 pb-3 group-data-[collapsible=icon]:px-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarUserMenu />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
