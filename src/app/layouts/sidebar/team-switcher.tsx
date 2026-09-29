import { Link, useNavigate } from "react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useMemberships, isAccessible } from "@/features/memberships";
import { useActiveOrganization } from "@/features/organizations";
import { clearOrganizationCache } from "@/shared/api/query-client";
import { organizationRoutes } from "@/shared/auth/organization-routes";
import { SidebarMenu, SidebarMenuItem } from "@/shared/ui/sidebar";
export function TeamSwitcher() {
  const active = useActiveOrganization();
  const memberships = useMemberships();
  const navigate = useNavigate();
  const client = useQueryClient();
  return (
    <SidebarMenu>
      <SidebarMenuItem className="p-2 group-data-[collapsible=icon]:hidden">
        <label htmlFor="organization-switcher" className="text-xs">
          Organisation active
        </label>
        <select
          id="organization-switcher"
          className="mt-1 w-full min-w-0 rounded-md border bg-sidebar p-2 text-sm"
          value={active.organizationId}
          disabled={memberships.isFetching || memberships.isError}
          onChange={(event) => {
            const target = memberships.data?.find(
              (m) => m.organizationId === event.target.value && isAccessible(m),
            );
            if (!target || target.organizationId === active.organizationId)
              return;
            clearOrganizationCache(client, active.organizationId);
            void navigate(organizationRoutes.dashboard(target.organizationId));
          }}
        >
          {(memberships.data ?? [active]).filter(isAccessible).map((m) => (
            <option key={m.organizationId} value={m.organizationId}>
              {m.organizationName}
            </option>
          ))}
        </select>
        <Link
          className="mt-2 block text-xs underline"
          to={organizationRoutes.create}
        >
          Créer une organisation
        </Link>
        <p className="mt-1 text-xs">{active.role}</p>
        {memberships.isError && <p role="alert">Liste indisponible.</p>}
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
