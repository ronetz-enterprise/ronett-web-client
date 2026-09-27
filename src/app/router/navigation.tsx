import { HugeiconsIcon } from "@hugeicons/react";
import {
  LayoutBottomIcon,
  Settings05Icon,
  MapsIcon,
} from "@hugeicons/core-free-icons";
export type NavigationItem = {
  title: string;
  url?: string;
  icon: React.ReactNode;
  permission?: string;
};
export function navigationFor(organizationId?: string): NavigationItem[] {
  return organizationId
    ? [
        {
          title: "Tableau de bord",
          url: `/app/${encodeURIComponent(organizationId)}`,
          icon: <HugeiconsIcon icon={LayoutBottomIcon} />,
        },
        {
          title: "Organisation",
          url: `/app/${encodeURIComponent(organizationId)}/organization`,
          icon: <HugeiconsIcon icon={Settings05Icon} />,
        },
        {
          title: "Sites — prochain sprint",
          icon: <HugeiconsIcon icon={MapsIcon} />,
        },
      ]
    : [
        {
          title: "Vue plateforme",
          url: "/platform-admin",
          icon: <HugeiconsIcon icon={LayoutBottomIcon} />,
        },
      ];
}
