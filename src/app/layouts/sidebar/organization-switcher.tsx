import { useNavigate } from "react-router";
import { useQueryClient } from "@tanstack/react-query";
import { HugeiconsIcon } from "@hugeicons/react";
import { AddCircleIcon, UnfoldMoreIcon } from "@hugeicons/core-free-icons";
import { isAccessible, useMemberships } from "@/features/memberships";
import { useOptionalOrganization } from "@/features/organizations";
import { clearOrganizationCache } from "@/shared/api/query-client";
import { organizationRoutes } from "@/shared/auth/organization-routes";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import { SidebarMenuButton, useSidebar } from "@/shared/ui/sidebar";
import { cn } from "@/shared/utils/cn";
import { initials, tintFor } from "@/shared/utils/tint";

function OrganizationMark({ id, name }: { id: string; name: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex size-6 shrink-0 items-center justify-center rounded-md text-[0.6875rem] font-semibold",
        tintFor(id),
      )}
    >
      {initials(name)}
    </span>
  );
}

/**
 * Sélecteur d'organisation en tête de barre latérale : l'organisation active, toujours
 * visible, et la bascule vers une autre. Changer d'organisation vide le cache de l'ancienne.
 */
export function OrganizationSwitcher() {
  const active = useOptionalOrganization();
  const memberships = useMemberships();
  const navigate = useNavigate();
  const client = useQueryClient();
  const { setOpenMobile } = useSidebar();
  if (!active) return null;
  const accessible = (memberships.data ?? []).filter(isAccessible);

  function switchOrganization(organizationId: string) {
    const target = accessible.find(
      (membership) => membership.organizationId === organizationId,
    );
    if (!target || !active || target.organizationId === active.organizationId)
      return;
    clearOrganizationCache(client, active.organizationId);
    setOpenMobile(false);
    void navigate(organizationRoutes.dashboard(target.organizationId));
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <SidebarMenuButton
            className="h-9 aria-expanded:bg-sidebar-accent"
            aria-label={`${active.organizationName} — changer d'organisation`}
          />
        }
      >
        <OrganizationMark
          id={active.organizationId}
          name={active.organizationName}
        />
        <span className="truncate font-medium text-foreground">
          {active.organizationName}
        </span>
        <HugeiconsIcon
          icon={UnfoldMoreIcon}
          strokeWidth={1.75}
          className="ml-auto size-4 shrink-0 opacity-60 group-data-[collapsible=icon]:hidden"
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-64"
        side="bottom"
        align="start"
        sideOffset={6}
      >
        <DropdownMenuGroup>
          <DropdownMenuLabel>Organisations</DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuRadioGroup
          value={active.organizationId}
          onValueChange={(value) => value && switchOrganization(value)}
        >
          {(accessible.length ? accessible : [active]).map((membership) => (
            <DropdownMenuRadioItem
              key={membership.organizationId}
              value={membership.organizationId}
            >
              <OrganizationMark
                id={membership.organizationId}
                name={membership.organizationName}
              />
              <span className="truncate">{membership.organizationName}</span>
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
        {memberships.isError ? (
          <p className="px-2 py-1.5 text-sm text-destructive" role="alert">
            Liste des organisations indisponible.
          </p>
        ) : (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => navigate(organizationRoutes.create)}
            >
              <HugeiconsIcon icon={AddCircleIcon} strokeWidth={1.75} />
              Créer une organisation
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
