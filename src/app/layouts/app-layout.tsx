import { useEffect } from "react";
import { Outlet, useParams, useLocation, useNavigation } from "react-router";
import { useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { AppSidebar } from "./sidebar/app-sidebar";
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
import { PageLoading } from "@/shared/components/feedback";
import { clearOrganizationCache } from "@/shared/api/query-client";
import type { OrganizationContext } from "@/shared/auth/organization-context";
import NotFoundPage from "@/pages/public/not-found-page";
import { navigationFor } from "@/app/router/navigation";
export function OrganizationShell({
  organizationId,
}: {
  organizationId?: string;
}) {
  const client = useQueryClient();
  const location = useLocation();
  const navigation = useNavigation();
  useEffect(
    () => () => {
      if (organizationId) clearOrganizationCache(client, organizationId);
    },
    [client, organizationId],
  );
  const title =
    navigationFor(organizationId).find((item) => item.url === location.pathname)
      ?.title ?? "Ronet";
  const context: OrganizationContext | undefined = organizationId
    ? { organizationId, provisional: true }
    : undefined;
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
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <div className="flex min-w-0 items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-vertical:h-4 data-vertical:self-auto"
            />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbPage>{title}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div
          id="main-content"
          tabIndex={-1}
          className="flex min-w-0 flex-1 flex-col gap-4 p-4 pt-0"
        >
          <p className="rounded-lg bg-muted px-3 py-2 text-xs">
            Aperçu structurel — authentification et permissions non activées.
          </p>
          {navigation.state !== "idle" && <PageLoading />}
          <div key={organizationId ?? "platform"} className="space-y-6">
            <Outlet context={context} />
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
