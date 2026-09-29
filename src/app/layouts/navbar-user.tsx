"use client";
import { Button } from "@/shared/ui/button";

import { useNavigate } from "react-router";
import { useState } from "react";
import { Avatar, AvatarFallback } from "@/shared/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import { useAuth } from "@/features/authentication";
import { usePrincipal } from "@/features/identity";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  UnfoldMoreIcon,
  LogoutIcon,
  UserCircleIcon,
} from "@hugeicons/core-free-icons";

export function NavbarUser() {
  const auth = useAuth();
  const principal = usePrincipal();
  const navigate = useNavigate();
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
            aria-label="Profil utilisateur"
            className="flex items-center gap-2"
          />
        }
      >
        <Avatar className="size-8">
          <AvatarFallback>{userInitials}</AvatarFallback>
        </Avatar>
        <HugeiconsIcon
          icon={UnfoldMoreIcon}
          strokeWidth={2}
          className="size-4 text-muted-foreground"
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={4} className="w-48">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="p-0 font-normal">
            <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
              <Avatar className="size-8">
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
