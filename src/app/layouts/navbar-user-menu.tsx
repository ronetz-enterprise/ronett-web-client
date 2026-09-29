"use client";

import { useNavigate } from "react-router";
import { useState } from "react";
import { Avatar, AvatarFallback } from "@/shared/ui/avatar";
import { Button } from "@/shared/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import { useAuth } from "@/features/authentication";
import { usePrincipal } from "@/features/identity";
import { HugeiconsIcon } from "@hugeicons/react";
import { LogoutIcon, UserCircleIcon } from "@hugeicons/core-free-icons";

export function NavbarUserMenu() {
  const auth = useAuth();
  const principal = usePrincipal();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);

  const userName = principal.data
    ? `${principal.data.firstName} ${principal.data.lastName}`
    : auth.loginEmail
      ? auth.loginEmail.split("@")[0]
      : "Utilisateur";

  const userInitials = principal.data
    ? `${principal.data.firstName[0]}${principal.data.lastName[0]}`.toUpperCase()
    : userName.slice(0, 2).toUpperCase();

  const handleLogout = () => {
    if (busy) return;
    setBusy(true);
    void auth.logout().then((result) =>
      navigate("/auth/login", {
        replace: true,
        state: { logout: result.server },
      }),
    );
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="size-10 shrink-0 rounded-full"
            aria-label="Menu utilisateur"
          >
            <Avatar className="size-8">
              <AvatarFallback>{userInitials}</AvatarFallback>
            </Avatar>
          </Button>
        }
      />
      <DropdownMenuContent align="end" sideOffset={4} className="w-56">
        <div className="space-y-1 px-2 py-2">
          <p className="truncate text-sm font-medium">{userName}</p>
          <p className="break-all text-xs text-muted-foreground">
            {principal.data?.email ?? auth.loginEmail}
          </p>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={() => navigate("/account")}>
            <HugeiconsIcon
              icon={UserCircleIcon}
              strokeWidth={2}
              className="size-4"
            />
            Profil
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={handleLogout} disabled={busy}>
            <HugeiconsIcon
              icon={LogoutIcon}
              strokeWidth={2}
              className="size-4"
            />
            Se déconnecter
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
