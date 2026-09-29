import { useEffect, useRef } from "react";
import {
  useMutation,
  useQuery,
  useQueryClient,
  useIsMutating,
} from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { z } from "zod";
import { useAuth } from "@/features/authentication";
import { ApiError } from "@/shared/errors/api-error";
import { tenantKeys, clearOrganizationCache } from "@/shared/api/query-client";
import { organizationRoutes } from "@/shared/auth/organization-routes";
import { notificationManager } from "@/shared/components/notifications";
import {
  memberSchema,
  organizationCapabilities,
  type MemberAction,
} from "../model/member";
import { membershipKeys, type Membership } from "./current-memberships";
export const organizationMemberKeys = {
  list: (id: string) => tenantKeys.resource(id, "memberships"),
  mutation: (id: string) => tenantKeys.resource(id, "membership-mutation"),
};
export function useOrganizationMembers(active: Membership) {
  const { request } = useAuth();
  const client = useQueryClient();
  return useQuery({
    queryKey: organizationMemberKeys.list(active.organizationId),
    enabled: organizationCapabilities(active).canViewMembers,
    staleTime: 0,
    retry: false,
    retryOnMount: false,
    refetchOnWindowFocus: true,
    queryFn: async ({ signal }) => {
      try {
        const result = z
          .array(memberSchema)
          .safeParse(
            await request(
              "/api/organizations/" + active.organizationId + "/memberships",
              { signal },
            ),
          );
        if (
          !result.success ||
          result.data.some((m) => m.organizationId !== active.organizationId) ||
          new Set(result.data.map((m) => m.id)).size !== result.data.length
        )
          throw new ApiError("invalid-response");
        return result.data;
      } catch (error) {
        if (error instanceof ApiError && error.status === 403)
          void client.invalidateQueries({
            queryKey: membershipKeys.access(active.organizationId),
          });
        throw error;
      }
    },
  });
}
type Change = { action: MemberAction | "add"; userId: string };
export function useMemberChange(active: Membership, currentUserId?: string) {
  const { request } = useAuth();
  const client = useQueryClient();
  const navigate = useNavigate();
  const mounted = useRef(true);
  const lock = useRef(false);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  const key = organizationMemberKeys.mutation(active.organizationId);
  const pending = useIsMutating({ mutationKey: key }) > 0;
  const mutation = useMutation({
    mutationKey: key,
    retry: false,
    mutationFn: async (change: Change) => {
      if (!organizationCapabilities(active).canManageMembers)
        throw new ApiError("http", 403);
      const userId = z.uuid().parse(change.userId);
      const base =
        "/api/organizations/" + active.organizationId + "/memberships";
      if (change.action === "add") {
        const parsed = memberSchema.safeParse(
          await request(base, {
            method: "POST",
            body: { userId, role: "OWNER" },
          }),
        );
        if (
          !parsed.success ||
          parsed.data.organizationId !== active.organizationId ||
          parsed.data.userId !== userId
        )
          throw new ApiError("invalid-response");
      } else {
        const suffix =
          change.action === "suspend"
            ? "/suspension"
            : change.action === "reactivate"
              ? "/reactivation"
              : "";
        await request(base + "/" + userId + suffix, {
          method: change.action === "revoke" ? "DELETE" : "PATCH",
        });
      }
    },
    onSuccess: async (_result, change) => {
      if (!mounted.current) return;
      notificationManager.add({
        title: "Appartenance mise à jour",
        description:
          "Les droits et la liste des membres sont vérifiés à nouveau.",
      });
      const ownLoss =
        change.userId === currentUserId &&
        ["suspend", "revoke"].includes(change.action);
      if (ownLoss) {
        void navigate(organizationRoutes.select, { replace: true });
        clearOrganizationCache(client, active.organizationId);
        await client.invalidateQueries({ queryKey: membershipKeys.mine });
      } else {
        await client.invalidateQueries({
          queryKey: organizationMemberKeys.list(active.organizationId),
        });
        await Promise.all([
          client.invalidateQueries({ queryKey: membershipKeys.mine }),
          client.invalidateQueries({
            queryKey: membershipKeys.access(active.organizationId),
          }),
        ]);
      }
    },
    onError: async (error) => {
      if (!mounted.current) return;
      await client.invalidateQueries({
        queryKey: organizationMemberKeys.list(active.organizationId),
      });
      if (error instanceof ApiError && [401, 403].includes(error.status))
        await client.invalidateQueries({
          queryKey: membershipKeys.access(active.organizationId),
        });
    },
  });
  return {
    ...mutation,
    pending: pending || mutation.isPending,
    change: async (value: Change) => {
      if (lock.current || client.isMutating({ mutationKey: key }) > 0)
        return false;
      lock.current = true;
      try {
        await mutation.mutateAsync(value);
        return true;
      } finally {
        lock.current = false;
      }
    },
  };
}
