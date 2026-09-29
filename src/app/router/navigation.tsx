import { organizationRoutes } from "@/shared/auth/organization-routes";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  LayoutBottomIcon,
  Settings05Icon,
  MapsIcon,
  RouterIcon,
  UserGroupIcon,
  Building03Icon,
} from "@hugeicons/core-free-icons";
import { siteRoutes } from "@/features/site";
import { routerRoutes } from "@/features/router";
export type NavigationItem = {
  title: string;
  url?: string;
  icon: React.ReactNode;
  permission?: string;
  matchChildren?: boolean;
};
export function navigationFor(organizationId?: string): NavigationItem[] {
  return organizationId
    ? [
        {
          title: "Tableau de bord",
          url: organizationRoutes.dashboard(organizationId),
          icon: (
            <HugeiconsIcon
              icon={LayoutBottomIcon}
              strokeWidth={2}
              aria-hidden="true"
            />
          ),
        },
        {
          title: "Organisation",
          url: organizationRoutes.overview(organizationId),
          icon: (
            <HugeiconsIcon
              icon={Building03Icon}
              strokeWidth={2}
              aria-hidden="true"
            />
          ),
        },
        {
          title: "Paramètres",
          url: organizationRoutes.settings(organizationId),
          icon: (
            <HugeiconsIcon
              icon={Settings05Icon}
              strokeWidth={2}
              aria-hidden="true"
            />
          ),
          permission: "ORGANIZATION_READ",
        },
        {
          title: "Membres",
          url: organizationRoutes.members(organizationId),
          icon: (
            <HugeiconsIcon
              icon={UserGroupIcon}
              strokeWidth={2}
              aria-hidden="true"
            />
          ),
          permission: "MEMBERSHIP_READ",
        },
        {
          title: "Routeurs",
          url: routerRoutes.list(organizationId),
          matchChildren: true,
          icon: (
            <HugeiconsIcon
              icon={RouterIcon}
              strokeWidth={2}
              aria-hidden="true"
            />
          ),
        },
        {
          title: "Sites",
          url: siteRoutes.list(organizationId),
          matchChildren: true,
          icon: (
            <HugeiconsIcon icon={MapsIcon} strokeWidth={2} aria-hidden="true" />
          ),
        },
      ]
    : [
        {
          title: "Vue plateforme",
          url: "/platform-admin",
          icon: (
            <HugeiconsIcon
              icon={LayoutBottomIcon}
              strokeWidth={2}
              aria-hidden="true"
            />
          ),
        },
      ];
}
