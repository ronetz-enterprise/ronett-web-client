import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/features/authentication";
import { ApiError } from "@/shared/errors/api-error";
import { tenantKeys } from "@/shared/api/query-client";
export const membershipSchema = z.object({
  membershipId: z.uuid(),
  organizationId: z.uuid(),
  organizationName: z.string().min(1),
  organizationStatus: z.enum(["ACTIVE", "SUSPENDED", "CLOSED"]),
  role: z.literal("OWNER"),
  membershipStatus: z.enum(["ACTIVE", "SUSPENDED", "REVOKED"]),
  permissions: z.array(z.string()),
});
export type Membership = z.infer<typeof membershipSchema>;
export const membershipsSchema = z
  .object({ items: z.array(membershipSchema) })
  .strict();
export const membershipKeys = {
  mine: ["memberships", "current"] as const,
  access: (id: string) => tenantKeys.resource(id, "access"),
};
export const isAccessible = (m: Membership) =>
  m.membershipStatus === "ACTIVE" &&
  m.organizationStatus === "ACTIVE" &&
  m.permissions.includes("ORGANIZATION_READ");
export function selectionTarget(items: Membership[]) {
  const active = items.filter(isAccessible);
  return items.length === 0
    ? "create"
    : active.length === 1
      ? active[0].organizationId
      : "select";
}
export function useMemberships() {
  const auth = useAuth();
  return useQuery({
    queryKey: membershipKeys.mine,
    enabled: auth.status === "authenticated" || auth.status === "refreshing",
    staleTime: 0,
    retry: false,
    refetchOnWindowFocus: true,
    queryFn: async ({ signal }) => {
      const parsed = membershipsSchema.safeParse(
        await auth.request("/api/me/memberships", { signal }),
      );
      if (
        !parsed.success ||
        new Set(parsed.data.items.map((m) => m.organizationId)).size !==
          parsed.data.items.length
      )
        throw new ApiError("invalid-response");
      return parsed.data.items;
    },
  });
}
export function useMembershipAccess(id: string, enabled = true) {
  const auth = useAuth();
  return useQuery({
    queryKey: membershipKeys.access(id),
    enabled:
      enabled &&
      (auth.status === "authenticated" || auth.status === "refreshing"),
    staleTime: 0,
    retry: false,
    refetchOnMount: "always",
    refetchOnWindowFocus: "always",
    //refetchInterval: 30_000,
    queryFn: async ({ signal }) => {
      const parsed = membershipSchema.safeParse(
        await auth.request("/api/me/memberships/" + id, { signal }),
      );
      if (
        !parsed.success ||
        parsed.data.organizationId !== id ||
        !isAccessible(parsed.data)
      )
        throw new ApiError("invalid-response");
      return parsed.data;
    },
  });
}
