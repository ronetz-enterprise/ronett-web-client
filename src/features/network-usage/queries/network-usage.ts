import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { useAuth } from "@/features/authentication";
import type { Membership } from "@/features/memberships";
import { tenantKeys } from "@/shared/api/query-client";
import { ApiError } from "@/shared/errors/api-error";
import { networkUsageEndpoints } from "../api/network-usage-endpoints";
import {
  accessReportSchema,
  periodError,
  routerUsageSchema,
  sitePerformanceSchema,
  SITE_REPORT_SIZE,
  type UsageFilters,
} from "../model/network-usage";

export const networkUsageKeys = {
  sites: (organizationId: string) =>
    tenantKeys.resource(organizationId, "network-usage", "sites"),
  all: (organizationId: string) =>
    tenantKeys.resource(organizationId, "network-usage"),
  summary: (organizationId: string, filters: UsageFilters) =>
    tenantKeys.resource(organizationId, "network-usage", "summary", filters),
  routers: (organizationId: string, page: number, size: number) =>
    tenantKeys.resource(organizationId, "network-usage", "routers", {
      page,
      size,
    }),
};

/** Le contrat `reporting` exige une membership active et le rôle OWNER. */
export function networkUsagePermissions(active: Membership) {
  const owner =
    active.membershipStatus === "ACTIVE" &&
    active.organizationStatus === "ACTIVE" &&
    active.role === "OWNER";
  return { canViewNetworkUsage: owner };
}

export function useAccessUsageSummary(
  active: Membership,
  filters: UsageFilters,
) {
  const { request } = useAuth();
  return useQuery({
    queryKey: networkUsageKeys.summary(active.organizationId, filters),
    enabled:
      networkUsagePermissions(active).canViewNetworkUsage &&
      periodError(filters) === null,
    placeholderData: keepPreviousData,
    staleTime: 60_000,
    queryFn: async ({ signal }) => {
      const query: Record<string, string> = {
        from: filters.from,
        to: filters.to,
      };
      if (filters.siteId) query.siteId = filters.siteId;
      const result = accessReportSchema.safeParse(
        await request(
          networkUsageEndpoints.accessReport(active.organizationId),
          {
            signal,
            query,
          },
        ),
      );
      // Un agrégat d'une autre organisation ou d'une autre période est rejeté.
      if (
        !result.success ||
        result.data.organizationId !== active.organizationId ||
        result.data.period.from !== filters.from ||
        result.data.period.to !== filters.to
      )
        throw new ApiError("invalid-response");
      return result.data;
    },
  });
}

export function useRouterUsage(active: Membership, page: number, size: number) {
  const { request } = useAuth();
  return useQuery({
    queryKey: networkUsageKeys.routers(active.organizationId, page, size),
    enabled: networkUsagePermissions(active).canViewNetworkUsage,
    placeholderData: keepPreviousData,
    staleTime: 60_000,
    queryFn: async ({ signal }) => {
      const result = z.array(routerUsageSchema).safeParse(
        await request(
          networkUsageEndpoints.routerReport(active.organizationId),
          {
            signal,
            query: { page: String(page), size: String(size) },
          },
        ),
      );
      if (
        !result.success ||
        result.data.length > size ||
        result.data.some((row) => row.organizationId !== active.organizationId)
      )
        throw new ApiError("invalid-response");
      return result.data;
    },
  });
}

/**
 * Instantané par site, indexé par identifiant. Réservé au propriétaire : pour les autres rôles
 * la requête est désactivée et les écrans masquent simplement les mini-statistiques.
 */
export function useSitePerformance(active: Membership) {
  const { request } = useAuth();
  return useQuery({
    queryKey: networkUsageKeys.sites(active.organizationId),
    enabled: networkUsagePermissions(active).canViewNetworkUsage,
    staleTime: 60_000,
    queryFn: async ({ signal }) => {
      const result = z.array(sitePerformanceSchema).safeParse(
        await request(networkUsageEndpoints.siteReport(active.organizationId), {
          signal,
          query: { page: "0", size: String(SITE_REPORT_SIZE) },
        }),
      );
      if (
        !result.success ||
        result.data.some((row) => row.organizationId !== active.organizationId)
      )
        throw new ApiError("invalid-response");
      return new Map(result.data.map((row) => [row.siteId, row]));
    },
  });
}
