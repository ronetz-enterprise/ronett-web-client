"use client";

import { useNavigate } from "react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useMemberships, isAccessible } from "@/features/memberships";
import { useActiveOrganization } from "@/features/organizations";
import { clearOrganizationCache } from "@/shared/api/query-client";
import { organizationRoutes } from "@/shared/auth/organization-routes";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectSeparator,
} from "@/shared/ui/select";
import { HugeiconsIcon } from "@hugeicons/react";
import { AddCircleIcon } from "@hugeicons/core-free-icons";

export function NavbarOrganizationSelect() {
  const active = useActiveOrganization();
  const memberships = useMemberships();
  const navigate = useNavigate();
  const client = useQueryClient();

  const accessibleMemberships = (memberships.data ?? []).filter(isAccessible);
  const currentMembership = accessibleMemberships.find(
    (m) => m.organizationId === active.organizationId,
  );
  const displayName =
    currentMembership?.organizationName ?? "Aucune organisation";

  const handleChange = (value: string | null) => {
    if (!value) return;
    if (value === "__create") {
      void navigate(organizationRoutes.create);
      return;
    }
    const target = accessibleMemberships.find(
      (m) => m.organizationId === value,
    );
    if (!target || target.organizationId === active.organizationId) return;
    clearOrganizationCache(client, active.organizationId);
    void navigate(organizationRoutes.dashboard(target.organizationId));
  };

  const isLoading = memberships.isFetching;
  const isError = memberships.isError;
  const isDisabled = isLoading || isError;

  return (
    <div className="flex min-w-0 max-w-full flex-1 flex-wrap items-center justify-end gap-2 sm:max-w-72">
      <Select
        value={active.organizationId}
        onValueChange={handleChange}
        disabled={isDisabled}
      >
        <SelectTrigger
          data-context="organization"
          size="sm"
          className="min-w-0 max-w-full border-transparent bg-muted/50 text-foreground shadow-none"
          aria-label="Organisation active"
        >
          <SelectValue
            className="min-w-0 truncate"
            placeholder="Sélectionner une organisation"
          >
            {isLoading ? "Chargement…" : displayName}
          </SelectValue>
        </SelectTrigger>
        <SelectContent sideOffset={4} align="end">
          <SelectGroup>
            {accessibleMemberships.map((m) => (
              <SelectItem key={m.organizationId} value={m.organizationId}>
                {m.organizationName}
              </SelectItem>
            ))}
          </SelectGroup>
          {accessibleMemberships.length > 0 && (
            <>
              <SelectSeparator />
              <SelectItem value="__create" disabled={false}>
                <HugeiconsIcon
                  icon={AddCircleIcon}
                  strokeWidth={2}
                  className="size-3.5 mr-2"
                />
                Créer une organisation
              </SelectItem>
            </>
          )}
        </SelectContent>
      </Select>
      {isError && (
        <span className="text-xs text-destructive" role="alert">
          Liste indisponible
        </span>
      )}
      {!currentMembership && accessibleMemberships.length > 0 && (
        <span className="text-xs text-muted-foreground">
          Rôle: {active.role}
        </span>
      )}
    </div>
  );
}
