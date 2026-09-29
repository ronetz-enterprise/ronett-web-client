import { Outlet, useParams, useLocation, useNavigation } from "react-router";
import { z } from "zod";
import { AppSidebar } from "./sidebar/app-sidebar";
import { NavbarOrganizationSelect } from "./navbar-organization-select";
import { NavbarUserMenu } from "./navbar-user-menu";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/shared/ui/sidebar";
import { Separator } from "@/shared/ui/separator";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbPage,
} from "@/shared/ui/breadcrumb";
import NotFoundPage from "@/pages/public/not-found-page";
import { navigationFor } from "@/app/router/navigation";
export function OrganizationShell({
  organizationId,
}: {
  organizationId?: string;
}) {
  const location = useLocation();
  const navigation = useNavigation();
  const title =
    navigationFor(organizationId).find((item) => item.url === location.pathname)
      ?.title ?? "Ronetz";
  return (
    <SidebarProvider>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:bg-background focus:p-3"
      >
        Aller au contenu
      </a>
      <AppSidebar organizationId={organizationId} />
      <SidebarInset className="min-w-0">
        <header className="flex min-h-14 shrink-0 flex-wrap items-center gap-2 border-b px-2 py-2 sm:px-4">
          <div className="flex min-w-0 items-center gap-2">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="hidden sm:block mr-2 data-vertical:h-4 data-vertical:self-auto"
            />
            <Breadcrumb className="hidden md:block">
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbPage role={undefined} aria-disabled={undefined}>
                    {title}
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <div className="flex min-w-0 max-w-full flex-1 items-center justify-end gap-2">
            <NavbarOrganizationSelect />
            <NavbarUserMenu />
          </div>
        </header>
        <div
          id="main-content"
          tabIndex={-1}
          className="relative mx-auto flex w-full min-w-0 max-w-screen-2xl flex-1 flex-col gap-6 p-4 sm:p-6 lg:p-8"
        >
          {navigation.state !== "idle" && (
            <p role="status" className="text-xs text-muted-foreground">
              Chargement de la destination…
            </p>
          )}
          <div key={organizationId ?? "platform"} className="min-w-0 space-y-8">
            <Outlet />
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
export default function AppLayout() {
  const { organizationId } = useParams();
  if (!z.uuid().safeParse(organizationId).success) return <NotFoundPage />;
  return <OrganizationShell organizationId={organizationId} />;
}
