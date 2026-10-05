import { Link, useLocation } from "react-router";
import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from "@/shared/ui/sidebar";
import {
  isActiveNavigationItem,
  type NavigationItem,
} from "@/app/router/navigation";
export function NavMain({
  items,
  label,
}: {
  items: NavigationItem[];
  label: string;
}) {
  const { pathname } = useLocation();
  const { setOpenMobile } = useSidebar();
  const active = (item: NavigationItem) =>
    isActiveNavigationItem(item, pathname);

  // Entrée active : teinte émeraude de la marque (fond pâle, texte et icône foncés), qui
  // reste au survol ; le survol des autres entrées reste neutre.
  const itemClass =
    "h-9 data-active:bg-sidebar-active data-active:text-sidebar-active-foreground data-active:hover:bg-sidebar-active data-active:hover:text-sidebar-active-foreground";
  const renderItem = (item: NavigationItem) => (
    <SidebarMenuItem key={item.title}>
      {item.url ? (
        <SidebarMenuButton
          isActive={active(item)}
          className={itemClass}
          tooltip={item.title}
          render={
            <Link
              to={item.url}
              aria-current={active(item) ? "page" : undefined}
              onClick={() => setOpenMobile(false)}
            />
          }
        >
          {item.icon}
          <span>{item.title}</span>
        </SidebarMenuButton>
      ) : (
        <SidebarMenuButton
          disabled
          aria-disabled="true"
          className={itemClass}
          tooltip={item.title}
        >
          {item.icon}
          <span>{item.title}</span>
        </SidebarMenuButton>
      )}
    </SidebarMenuItem>
  );

  // Entrées sans groupe en tête, puis une section par groupe, dans l'ordre de déclaration.
  const groups: { name?: string; items: NavigationItem[] }[] = [];
  for (const item of items) {
    const existing = groups.find((group) => group.name === item.group);
    if (existing) existing.items.push(item);
    else groups.push({ name: item.group, items: [item] });
  }

  return (
    <nav aria-label={label}>
      {groups.map((group) => (
        <SidebarGroup key={group.name ?? "root"}>
          <SidebarMenu>{group.items.map(renderItem)}</SidebarMenu>
        </SidebarGroup>
      ))}
    </nav>
  );
}
