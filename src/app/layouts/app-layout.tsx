import { useEffect, useRef } from "react";
import { Outlet, useParams, useLocation, useNavigation } from "react-router";
import { z } from "zod";
import { AppSidebar } from "./sidebar/app-sidebar";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/shared/ui/sidebar";
import NotFoundPage from "@/pages/public/not-found-page";
import { activeNavigationItem, navigationFor } from "@/app/router/navigation";
import { usePageWidth } from "@/shared/hooks/use-page-width";
import { cn } from "@/shared/utils/cn";
import { useOptionalOrganization } from "@/features/organizations";
import { CreateDialogHost } from "./create-dialog-host";
import { useOnline } from "@/shared/hooks/use-online";
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert";
export function OrganizationShell({
  organizationId,
  permissions,
}: {
  organizationId?: string;
  /** Permissions de la surface courante : celles de l'organisation, ou celles de la plateforme. */
  permissions?: readonly string[];
}) {
  const location = useLocation();
  const navigation = useNavigation();
  const organization = useOptionalOrganization();
  const online = useOnline();
  const width = usePageWidth();
  const section = activeNavigationItem(
    navigationFor(organizationId),
    location.pathname,
  )?.title;
  const title = section ?? "Ronetz";

  // Onglet du navigateur : section, contexte, produit.
  useEffect(() => {
    const context = organizationId
      ? organization?.organizationName
      : "Administration";
    document.title = [section, context, "Ronetz"].filter(Boolean).join(" · ");
  }, [section, organizationId, organization?.organizationName]);

  // Après une navigation (pas au premier rendu), le focus va au titre de la page
  // pour que lecteurs d'écran et clavier repartent du nouveau contenu.
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    const frame = requestAnimationFrame(() => {
      const main = document.getElementById("main-content");
      const heading = main?.querySelector<HTMLElement>("h1");
      (heading ?? main)?.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(frame);
  }, [location.pathname]);
  return (
    <SidebarProvider>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:bg-background focus:p-3"
      >
        Aller au contenu
      </a>
      <AppSidebar organizationId={organizationId} permissions={permissions} />
      <SidebarInset className="@container/main min-w-0">
        {/* Bureau : la barre laterale porte seule la navigation, sans bandeau
            superieur. Mobile : la barre reste necessaire pour l'ouvrir. Le
            point de rupture suit celui de la sidebar (md), pour qu'un seul
            declencheur soit visible a la fois. */}
        <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4 md:hidden">
          <SidebarTrigger className="-ml-1" />
          <span className="truncate text-sm font-semibold">{title}</span>
        </header>
        <div
          id="main-content"
          tabIndex={-1}
          data-page-shell
          data-width={width}
          className={cn(
            "relative mx-auto flex w-full min-w-0 flex-1 flex-col px-(--page-gutter) pb-16 [--page-gutter:1rem] sm:[--page-gutter:1.5rem]",
            // Centré seulement quand le contenu est court ; sinon toute la largeur disponible.
            width === "narrow" && "max-w-3xl",
          )}
        >
          {navigation.state !== "idle" && (
            <p role="status" className="sr-only">
              Chargement de la destination…
            </p>
          )}
          {navigation.state !== "idle" && (
            <span
              aria-hidden="true"
              className="fixed top-0 right-0 left-0 z-50 h-0.5 animate-pulse bg-primary motion-reduce:animate-none"
            />
          )}
          <div key={organizationId ?? "platform"} className="min-w-0 space-y-6">
            <Outlet />
          </div>
          {organizationId && organization && (
            <CreateDialogHost active={organization} />
          )}
          {!online && (
            <Alert
              role="status"
              variant="warning"
              className="fixed right-4 bottom-4 z-40 w-auto max-w-sm shadow-elevated"
            >
              <AlertTitle>Vous êtes hors ligne</AlertTitle>
              <AlertDescription>
                Les données affichées peuvent être anciennes. Les envois sont
                suspendus et reprendront au retour de la connexion.
              </AlertDescription>
            </Alert>
          )}
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
