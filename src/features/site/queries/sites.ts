import type { httpClient } from "@/shared/api/http-client";
import { useEffect, useRef } from "react";
import {
  useIsMutating,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { z } from "zod";
import { useAuth } from "@/features/authentication";
import { membershipKeys, type Membership } from "@/features/memberships";
import { tenantKeys } from "@/shared/api/query-client";
import { ApiError } from "@/shared/errors/api-error";
import {
  siteCapabilities,
  siteFormSchema,
  siteSchema,
  type Site,
  type SiteAction,
  type SiteFormValues,
  type UpdateSiteRequest,
} from "../model/site";

export const siteKeys = {
  all: (org: string) => tenantKeys.resource(org, "sites"),
  list: (org: string) => tenantKeys.resource(org, "sites", "list"),
  detail: (org: string, id: string) =>
    tenantKeys.resource(org, "sites", "detail", id),
  mutation: (org: string) => tenantKeys.resource(org, "site-mutation"),
};
const base = (org: string) => `/api/organizations/${z.uuid().parse(org)}/sites`;
function parseSite(value: unknown, org: string, id?: string) {
  const parsed = siteSchema.safeParse(value);
  if (
    !parsed.success ||
    parsed.data.organizationId !== org ||
    (id && parsed.data.id !== id)
  )
    throw new ApiError("invalid-response");
  return parsed.data;
}
export function useSites(active: Membership) {
  const { request } = useAuth();
  const client = useQueryClient();
  return useQuery({
    queryKey: siteKeys.list(active.organizationId),
    enabled: siteCapabilities(active).canViewSites,
    staleTime: 0,
    refetchOnWindowFocus: true,
    queryFn: async ({ signal }) => {
      try {
        const result = z
          .array(siteSchema)
          .safeParse(await request(base(active.organizationId), { signal }));
        if (
          !result.success ||
          result.data.some(
            (site) => site.organizationId !== active.organizationId,
          ) ||
          new Set(result.data.map((site) => site.id)).size !==
            result.data.length
        )
          throw new ApiError("invalid-response");
        return result.data;
      } catch (error) {
        if (error instanceof ApiError && [401, 403].includes(error.status))
          void client.invalidateQueries({
            queryKey: membershipKeys.access(active.organizationId),
          });
        throw error;
      }
    },
  });
}
export function useSite(active: Membership, id: string) {
  const { request } = useAuth();
  const client = useQueryClient();
  return useQuery({
    queryKey: siteKeys.detail(active.organizationId, id),
    enabled: siteCapabilities(active).canViewSites,
    staleTime: 0,
    refetchOnWindowFocus: true,
    queryFn: async ({ signal }) => {
      if (!z.uuid().safeParse(id).success) throw new ApiError("http", 404);
      try {
        return parseSite(
          await request(`${base(active.organizationId)}/${id}`, { signal }),
          active.organizationId,
          id,
        );
      } catch (error) {
        if (error instanceof ApiError && [401, 403].includes(error.status))
          void client.invalidateQueries({
            queryKey: membershipKeys.access(active.organizationId),
          });
        throw error;
      }
    },
  });
}
type Change =
  | { action: "create"; values: SiteFormValues }
  | { action: "update"; site: Site; values: UpdateSiteRequest }
  | { action: SiteAction; site: Site };
export function useSiteChange(active: Membership) {
  const { request } = useAuth();
  const client = useQueryClient();
  const mounted = useRef(true);
  const lock = useRef(false);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  const mutationKey = siteKeys.mutation(active.organizationId);
  const busy = useIsMutating({ mutationKey }) > 0;
  const mutation = useMutation({
    mutationKey,
    retry: false,
    mutationFn: async (change: Change) => {
      const caps = siteCapabilities(
        active,
        "site" in change ? change.site : undefined,
      );
      const allowed =
        change.action === "create"
          ? caps.canCreateSite
          : change.action === "update"
            ? caps.canEditSite
            : caps[change.action];
      if (!allowed) throw new ApiError("http", 403);
      const path = base(active.organizationId);
      if (change.action === "create")
        return parseSite(
          await request(path, {
            method: "POST",
            body: siteFormSchema.parse(change.values),
          }),
          active.organizationId,
        );
      const target = `${path}/${z.uuid().parse(change.site.id)}`;
      if (change.action === "update")
        return parseSite(
          await request(target, {
            method: "PATCH",
            body: siteFormSchema.partial().parse(change.values),
          }),
          active.organizationId,
          change.site.id,
        );
      await request(
        target +
          (change.action === "suspend"
            ? "/suspension"
            : change.action === "reactivate"
              ? "/reactivation"
              : ""),
        { method: change.action === "close" ? "DELETE" : "POST" },
      );
    },
    onSettled: async (_data, error) => {
      // A late response must not repopulate or navigate a departed tenant.
      if (!mounted.current) return;
      await client.invalidateQueries({
        queryKey: siteKeys.all(active.organizationId),
      });
      if (error instanceof ApiError && [401, 403].includes(error.status))
        await client.invalidateQueries({
          queryKey: membershipKeys.access(active.organizationId),
        });
    },
  });
  return {
    ...mutation,
    pending: busy || mutation.isPending,
    change: async (change: Change) => {
      if (lock.current || client.isMutating({ mutationKey }))
        return { applied: false as const };
      lock.current = true;
      try {
        const site = await mutation.mutateAsync(change);
        return { applied: mounted.current, site };
      } finally {
        lock.current = false;
      }
    },
  };
}

// Public site boundary reused by features that must validate a site before mutation.
export async function readSite(
  request: typeof httpClient,
  organizationId: string,
  siteId: string,
  signal?: AbortSignal,
) {
  if (!z.uuid().safeParse(siteId).success) throw new ApiError("http", 404);
  return parseSite(
    await request(`${base(organizationId)}/${siteId}`, { signal }),
    organizationId,
    siteId,
  );
}
