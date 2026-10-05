import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { useAuth } from "@/features/authentication";
import type { Membership } from "@/features/memberships";
import { tenantKeys } from "@/shared/api/query-client";
import { ApiError } from "@/shared/errors/api-error";
import { overviewSchema } from "../model/overview";

export const dashboardKeys = {
  overview: (organizationId: string) =>
    tenantKeys.resource(organizationId, "dashboard", "overview"),
};

/** Le rapport est réservé à l'OWNER ; il n'existe pas encore pour une organisation sans activité. */
export function canViewOverview(active: Membership) {
  return (
    active.membershipStatus === "ACTIVE" &&
    active.organizationStatus === "ACTIVE" &&
    active.role === "OWNER"
  );
}

/**
 * Vue d'ensemble de l'organisation. `null` signifie « rapport pas encore calculé » (404
 * du backend) : ce n'est pas une erreur, la page s'appuie alors sur les listes.
 */
export function useOverview(active: Membership) {
  const { request } = useAuth();
  return useQuery({
    queryKey: dashboardKeys.overview(active.organizationId),
    enabled: canViewOverview(active),
    staleTime: 60_000,
    retry: (failures, error) =>
      !(error instanceof ApiError && error.status === 404) && failures < 2,
    queryFn: async ({ signal }) => {
      try {
        const result = overviewSchema.safeParse(
          await request(
            `/api/organizations/${z.uuid().parse(active.organizationId)}/reports/overview`,
            { signal },
          ),
        );
        if (
          !result.success ||
          result.data.organizationId !== active.organizationId
        )
          throw new ApiError("invalid-response");
        return result.data;
      } catch (error) {
        if (error instanceof ApiError && error.status === 404) return null;
        throw error;
      }
    },
  });
}
