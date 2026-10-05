import { accessRoutes } from "@/features/access";
import { networkUsageRoutes } from "@/features/network-usage";
import { financeRoutes } from "@/features/finance";
import { organizationRoutes } from "@/shared/auth/organization-routes";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  LayoutBottomIcon,
  Settings05Icon,
  MapsIcon,
  RouterIcon,
  Building03Icon,
  Wifi01Icon,
  Analytics01Icon,
  ShieldCheckIcon,
  ChartLineData01Icon,
  Wallet01Icon,
  UserGroupIcon,
  Tag01Icon,
} from "@hugeicons/core-free-icons";
import { siteRoutes } from "@/features/site";
import { offerRoutes } from "@/features/offer";
import { routerRoutes } from "@/features/router";
import { platformPermissions, platformRoutes } from "@/features/platform-admin";
export type NavigationItem = {
  title: string;
  /** Section de la barre latérale ; sans groupe, l'entrée est affichée en tête. */
  group?: string;
  url?: string;
  icon: React.ReactNode;
  permission?: string;
  matchChildren?: boolean;
  /** Préfixe d'URL qui rend l'entrée active (sous-pages hors de `url`). */
  activePrefix?: string;
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
              strokeWidth={1.75}
              aria-hidden="true"
            />
          ),
        },
        {
          title: "Sites",
          group: "Exploitation",
          url: siteRoutes.list(organizationId),
          matchChildren: true,
          icon: (
            <HugeiconsIcon
              icon={MapsIcon}
              strokeWidth={1.75}
              aria-hidden="true"
            />
          ),
        },
        {
          title: "Routeurs",
          group: "Exploitation",
          url: routerRoutes.list(organizationId),
          matchChildren: true,
          icon: (
            <HugeiconsIcon
              icon={RouterIcon}
              strokeWidth={1.75}
              aria-hidden="true"
            />
          ),
        },
        {
          title: "Offres",
          group: "Exploitation",
          url: offerRoutes.home(organizationId),
          matchChildren: true,
          icon: (
            <HugeiconsIcon
              icon={Tag01Icon}
              strokeWidth={1.75}
              aria-hidden="true"
            />
          ),
        },
        {
          title: "Accès Internet",
          group: "Exploitation",
          url: accessRoutes.list(organizationId),
          matchChildren: true,
          icon: (
            <HugeiconsIcon
              icon={Wifi01Icon}
              strokeWidth={1.75}
              aria-hidden="true"
            />
          ),
        },
        {
          title: "Consommation",
          group: "Exploitation",
          url: networkUsageRoutes.overview(organizationId),
          icon: (
            <HugeiconsIcon
              icon={ChartLineData01Icon}
              strokeWidth={1.75}
              aria-hidden="true"
            />
          ),
        },
        {
          title: "Finances",
          group: "Exploitation",
          url: financeRoutes.overview(organizationId),
          icon: (
            <HugeiconsIcon
              icon={Wallet01Icon}
              strokeWidth={1.75}
              aria-hidden="true"
            />
          ),
        },
        {
          title: "Paramètres",
          group: "Organisation",
          url: organizationRoutes.settings(organizationId),
          // Membres est un onglet des paramètres : l'entrée reste active.
          activePrefix: organizationRoutes
            .settings(organizationId)
            .replace(/\/general$/, ""),
          icon: (
            <HugeiconsIcon
              icon={Settings05Icon}
              strokeWidth={1.75}
              aria-hidden="true"
            />
          ),
          permission: "ORGANIZATION_READ",
        },
      ]
    : [
        {
          title: "Vue d'ensemble",
          url: platformRoutes.dashboard,
          icon: (
            <HugeiconsIcon
              icon={Analytics01Icon}
              strokeWidth={1.75}
              aria-hidden="true"
            />
          ),
          permission: platformPermissions.read,
        },
        {
          title: "Organisations",
          url: platformRoutes.organizations,
          matchChildren: true,
          icon: (
            <HugeiconsIcon
              icon={Building03Icon}
              strokeWidth={1.75}
              aria-hidden="true"
            />
          ),
          permission: platformPermissions.organizationRead,
        },
        {
          title: "Réseau",
          url: platformRoutes.network,
          icon: (
            <HugeiconsIcon
              icon={RouterIcon}
              strokeWidth={1.75}
              aria-hidden="true"
            />
          ),
          permission: platformPermissions.networkRead,
        },
        {
          title: "Opérations financières",
          url: platformRoutes.finance,
          icon: (
            <HugeiconsIcon
              icon={Wallet01Icon}
              strokeWidth={1.75}
              aria-hidden="true"
            />
          ),
          permission: platformPermissions.read,
        },
        {
          title: "Journal d'audit",
          url: platformRoutes.audit,
          icon: (
            <HugeiconsIcon
              icon={ShieldCheckIcon}
              strokeWidth={1.75}
              aria-hidden="true"
            />
          ),
          permission: platformPermissions.auditRead,
        },
      ];
}

/** Racine des paramètres d'organisation : la barre latérale y affiche leurs seules sections. */
export function settingsRoot(organizationId: string) {
  return organizationRoutes.settings(organizationId).replace(/\/general$/, "");
}
export function isSettingsPath(
  organizationId: string | undefined,
  pathname: string,
) {
  if (!organizationId) return false;
  const root = settingsRoot(organizationId);
  return pathname === root || pathname.startsWith(root + "/");
}
/** Sections des paramètres, présentées comme des onglets dans la barre latérale. */
export function settingsNavigationFor(
  organizationId: string,
): NavigationItem[] {
  return [
    {
      title: "Général",
      url: organizationRoutes.settings(organizationId),
      icon: (
        <HugeiconsIcon
          icon={Building03Icon}
          strokeWidth={1.75}
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
          strokeWidth={1.75}
          aria-hidden="true"
        />
      ),
      permission: "MEMBERSHIP_READ",
    },
  ];
}

/** Entrée de menu correspondant à l'URL, y compris pour les pages de détail. */
export function isActiveNavigationItem(item: NavigationItem, pathname: string) {
  if (!item.url) return false;
  return (
    pathname === item.url ||
    (!!item.matchChildren && pathname.startsWith(item.url + "/")) ||
    (!!item.activePrefix &&
      (pathname === item.activePrefix ||
        pathname.startsWith(item.activePrefix + "/")))
  );
}

export function activeNavigationItem(
  items: NavigationItem[],
  pathname: string,
) {
  return items.find((item) => isActiveNavigationItem(item, pathname));
}
