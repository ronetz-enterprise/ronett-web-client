import { z } from "zod";

const count = z.number().int().nonnegative();
const money = z.number();

/** `OrganizationOverviewView` : projection de reporting, recalculée par événements. */
export const overviewSchema = z.object({
  organizationId: z.uuid(),
  organizationName: z.string().nullable(),
  currency: z.string().min(3).max(3),
  totalSites: count,
  activeSites: count,
  totalRouters: count,
  onlineRouters: count,
  totalOffers: count,
  activeOffers: count,
  totalPurchases: count,
  successfulPayments: count,
  failedPayments: count,
  provisionedAccesses: count,
  activeAccesses: count,
  grossRevenue: money,
  netRevenue: money,
  availableBalance: money,
  dataLastUpdatedAt: z.iso.datetime({ offset: true }),
});
export type Overview = z.infer<typeof overviewSchema>;

export function formatMoney(value: number, currency: string) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency,
    maximumFractionDigits: currency === "XAF" || currency === "XOF" ? 0 : 2,
  }).format(value);
}

export function successRate(succeeded: number, failed: number) {
  const total = succeeded + failed;
  if (!total) return null;
  return new Intl.NumberFormat("fr-FR", {
    style: "percent",
    maximumFractionDigits: 0,
  }).format(succeeded / total);
}
