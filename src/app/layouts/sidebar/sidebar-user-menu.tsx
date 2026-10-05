"use client";

import { useState } from "react";
import { useNavigate } from "react-router";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ComputerIcon,
  LogoutIcon,
  Moon02Icon,
  Sun03Icon,
  UnfoldMoreIcon,
  UserCircleIcon,
} from "@hugeicons/core-free-icons";
import { useTheme, type ThemePreference } from "@/app/providers/theme-provider";
import { useAuth } from "@/features/authentication";
import { usePrincipal } from "@/features/identity";
import { Avatar, AvatarFallback } from "@/shared/ui/avatar";
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

/**
 * Pied de barre laterale : compte connecte (profil, deconnexion). Le changement
 * d'organisation est porte par le selecteur en tete de barre.
 * Le nom accessible reprend le libelle visible, suivi d'un suffixe, afin de
 * respecter WCAG 2.5.3 tout en restant adressable par les tests.
 */
export function SidebarUserMenu() {
  const auth = useAuth();
  const principal = usePrincipal();
  const navigate = useNavigate();
  const { isMobile } = useSidebar();
  const { preference, setPreference } = useTheme();
  const [busy, setBusy] = useState(false);

  const userName = principal.data
    ? `${principal.data.firstName} ${principal.data.lastName}`
    : auth.loginEmail
      ? auth.loginEmail.split("@")[0]
      : "Utilisateur";
  const userEmail = principal.data?.email ?? auth.loginEmail ?? "";
  const userInitials = principal.data
    ? `${principal.data.firstName[0]}${principal.data.lastName[0]}`.toUpperCase()
    : userName.slice(0, 2).toUpperCase();

  function handleLogout() {
    if (busy) return;
    setBusy(true);
    void auth.logout().then((result) =>
      navigate("/auth/login", {
        replace: true,
        state: { logout: result.server },
      }),
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <SidebarMenuButton
            size="lg"
            className="aria-expanded:bg-sidebar-accent"
            aria-label={`${userName} — compte utilisateur`}
          />
        }
      >
        {/* Les initiales repetent le nom : masquees pour ne pas le dupliquer. */}
        <Avatar className="size-7 shrink-0 rounded-full" aria-hidden="true">
          <AvatarFallback>{userInitials}</AvatarFallback>
        </Avatar>
        <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
          <span className="truncate font-medium">{userName}</span>
          <span className="truncate text-xs text-muted-foreground">
            {userEmail}
          </span>
        </div>
        <HugeiconsIcon
          icon={UnfoldMoreIcon}
          strokeWidth={1.75}
          className="ml-auto size-4 shrink-0 opacity-60 group-data-[collapsible=icon]:hidden"
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-64"
        side={isMobile ? "top" : "right"}
        align="end"
        sideOffset={8}
      >
        <DropdownMenuGroup>
          <DropdownMenuLabel className="p-0 font-normal">
            <div className="flex items-center gap-2.5 px-1 py-1.5 text-left text-sm">
              <Avatar className="size-8 shrink-0" aria-hidden="true">
                <AvatarFallback>{userInitials}</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{userName}</span>
                <span className="truncate text-xs text-muted-foreground">
                  {userEmail}
                </span>
              </div>
            </div>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => navigate("/account")}>
          <HugeiconsIcon icon={UserCircleIcon} strokeWidth={1.75} />
          Profil
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuLabel>Apparence</DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuRadioGroup
          value={preference}
          onValueChange={(value) =>
            value && setPreference(value as ThemePreference)
          }
        >
          {themeOptions.map((option) => (
            <DropdownMenuRadioItem
              key={option.value}
              value={option.value}
              closeOnClick={false}
            >
              <HugeiconsIcon icon={option.icon} strokeWidth={1.75} />
              {option.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          onClick={handleLogout}
          disabled={busy}
        >
          <HugeiconsIcon icon={LogoutIcon} strokeWidth={1.75} />
          Se déconnecter
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

const themeOptions: {
  value: ThemePreference;
  label: string;
  icon: typeof Sun03Icon;
}[] = [
  { value: "light", label: "Clair", icon: Sun03Icon },
  { value: "dark", label: "Sombre", icon: Moon02Icon },
  { value: "system", label: "Système", icon: ComputerIcon },
];
