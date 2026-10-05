import type { Membership } from "@/features/memberships";
import { useRouterList } from "../queries/routers";
import { ROUTER_SCAN_SIZE } from "./router-directory";

/** Synthèse par site (en ligne / total), calculée sur la plus grande page de routeurs. */
export function useRouterSummary(active: Membership) {
  const query = useRouterList(active, 0, ROUTER_SCAN_SIZE);
  const bySite = new Map<string, { online: number; total: number }>();
  for (const router of query.data?.content ?? []) {
    if (!router.siteId || router.lifecycleStatus === "REVOKED") continue;
    const entry = bySite.get(router.siteId) ?? { online: 0, total: 0 };
    entry.total += 1;
    if (router.connectivityStatus === "ONLINE") entry.online += 1;
    bySite.set(router.siteId, entry);
  }
  return {
    isSuccess: query.isSuccess,
    partial: (query.data?.totalElements ?? 0) > ROUTER_SCAN_SIZE,
    forSite: (siteId: string) => bySite.get(siteId) ?? { online: 0, total: 0 },
  };
}
