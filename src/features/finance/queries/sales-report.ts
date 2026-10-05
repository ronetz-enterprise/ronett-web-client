import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { useAuth } from "@/features/authentication";
import type { Membership } from "@/features/memberships";
import { tenantKeys } from "@/shared/api/query-client";
import { ApiError } from "@/shared/errors/api-error";
import { daysBefore, isoDay, salesReportSchema } from "../model/sales-report";
import { financePermissions } from "./finance";

/**
 * Ventes quotidiennes des `days` derniers jours (aujourd'hui inclus), dans le fuseau du
 * navigateur. Réservé à l'OWNER, comme les autres rapports.
 */
export function useSalesReport(active: Membership, days: number) {
  const { request } = useAuth();
  const now = new Date();
  const to = isoDay(now);
  const from = isoDay(daysBefore(now, days - 1));
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return useQuery({
    queryKey: tenantKeys.resource(active.organizationId, "reports", "sales", {
      from,
      to,
      timeZone,
    }),
    enabled: financePermissions(active).canViewFinance,
    staleTime: 60_000,
    retry: (failures, error) =>
      !(error instanceof ApiError && error.status === 404) && failures < 2,
    queryFn: async ({ signal }) => {
      try {
        const result = salesReportSchema.safeParse(
          await request(
            `/api/organizations/${z.uuid().parse(active.organizationId)}/reports/sales`,
            { signal, query: { from, to, timeZone, granularity: "DAY" } },
          ),
        );
        if (
          !result.success ||
          result.data.organizationId !== active.organizationId
        )
          throw new ApiError("invalid-response");
        return result.data;
      } catch (error) {
        // Rapport pas encore calculé : aucune vente à montrer, pas une erreur.
        if (error instanceof ApiError && error.status === 404) return null;
        throw error;
      }
    },
  });
}
