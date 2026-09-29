import { useEffect, useRef, useState } from "react";
import {
  useIsMutating,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { z } from "zod";
import { useAuth } from "@/features/authentication";
import { membershipKeys, type Membership } from "@/features/memberships";
import { readSite } from "@/features/site";
import type { httpClient } from "@/shared/api/http-client";
import { tenantKeys } from "@/shared/api/query-client";
import { ApiError } from "@/shared/errors/api-error";
import {
  routerSchema,
  routerPageSchema,
  routerCapabilities,
  routerCreateSchema,
  routerNameSchema,
  isTrackingState,
  type Router,
  type RouterAction,
  type RouterCreateValues,
} from "../model/router";

export const routerKeys = {
  all: (org: string) => tenantKeys.resource(org, "routers"),
  list: (org: string, page: number, size: number) =>
    tenantKeys.resource(org, "routers", "list", { page, size }),
  detail: (org: string, id: string, siteId?: string) =>
    tenantKeys.resource(org, "routers", "detail", id, siteId ?? null),
  status: (org: string, id: string, siteId?: string) =>
    tenantKeys.resource(org, "routers", "status", id, siteId ?? null),
  mutation: (org: string) => tenantKeys.resource(org, "router-mutation"),
};
const path = (id: string) => `/api/routers/${z.uuid().parse(id)}`;
function parsedRouter(
  value: unknown,
  org: string,
  id?: string,
  expectedSite?: string,
) {
  const result = routerSchema.safeParse(value);
  if (!result.success) throw new ApiError("invalid-response");
  if (
    result.data.organizationId !== org ||
    (id && result.data.id !== id) ||
    (expectedSite && result.data.siteId !== expectedSite)
  )
    throw new ApiError("http", 404);
  return result.data;
}
async function readContext(
  request: typeof httpClient,
  org: string,
  id: string,
  expectedSite?: string,
  signal?: AbortSignal,
) {
  if (
    !z.uuid().safeParse(id).success ||
    (expectedSite && !z.uuid().safeParse(expectedSite).success)
  )
    throw new ApiError("http", 404);
  const router = parsedRouter(
    await request(path(id), { signal }),
    org,
    id,
    expectedSite,
  );
  const site = router.siteId
    ? await readSite(request, org, router.siteId, signal)
    : null;
  return { router, site };
}
export function useRouterList(active: Membership, page: number, size: number) {
  const { request } = useAuth();
  const client = useQueryClient();
  return useQuery({
    queryKey: routerKeys.list(active.organizationId, page, size),
    enabled: routerCapabilities(active).canViewRouters,
    staleTime: 0,
    refetchOnWindowFocus: true,
    queryFn: async ({ signal }) => {
      try {
        const result = routerPageSchema.safeParse(
          await request(
            `/api/organizations/${active.organizationId}/routers?page=${page}&size=${size}`,
            { signal },
          ),
        );
        if (
          !result.success ||
          result.data.page !== page ||
          result.data.size !== size ||
          result.data.content.length > size ||
          result.data.content.some(
            (r) => r.organizationId !== active.organizationId,
          ) ||
          new Set(result.data.content.map((r) => r.id)).size !==
            result.data.content.length
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
export function useRouter(
  active: Membership,
  id: string,
  expectedSite?: string,
) {
  const { request } = useAuth();
  const client = useQueryClient();
  return useQuery({
    queryKey: routerKeys.detail(active.organizationId, id, expectedSite),
    enabled: routerCapabilities(active).canViewRouters,
    staleTime: 0,
    refetchOnWindowFocus: true,
    queryFn: async ({ signal }) => {
      try {
        return await readContext(
          request,
          active.organizationId,
          id,
          expectedSite,
          signal,
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
// UI observation policy, not a backend timeout: 5 s, then 15 s after errors,
// maximum five minutes, no background polling and no automatic mutation retry.
export function useRouterTracking(
  active: Membership,
  router: Router,
  expectedSite?: string,
  watch?: { action: RouterAction; before: Router },
) {
  const { request } = useAuth();
  const client = useQueryClient();
  const [deadline, setDeadline] = useState(() => Date.now() + 300_000);
  const [enabled, setEnabled] = useState(true);
  const awaiting = (current: Router) => {
    if (
      current.lifecycleStatus === "REVOKED" ||
      current.failureCode ||
      current.provisioningStatus === "FAILED"
    )
      return false;
    if (watch?.action === "resume") return current.lifecycleStatus !== "ACTIVE";
    if (watch?.action === "artifact")
      return (
        current.configurationArtifactId === watch.before.configurationArtifactId
      );
    return isTrackingState(current);
  };
  const query = useQuery<Awaited<ReturnType<typeof readContext>>>({
    queryKey: routerKeys.status(active.organizationId, router.id, expectedSite),
    enabled,
    retry: false,
    staleTime: 0,
    refetchOnWindowFocus: false,
    refetchIntervalInBackground: false,
    refetchInterval: (q) => {
      if (Date.now() >= deadline || !awaiting(q.state.data?.router ?? router))
        return false;
      if (
        q.state.error instanceof ApiError &&
        [401, 403, 404].includes(q.state.error.status)
      )
        return false;
      return q.state.error ? 15_000 : 5_000;
    },
    queryFn: async ({ signal }) => {
      try {
        const context = await readContext(
          request,
          active.organizationId,
          router.id,
          expectedSite,
          signal,
        );
        const result = parsedRouter(
          await request(path(router.id) + "/provisioning", { signal }),
          active.organizationId,
          router.id,
          expectedSite,
        );
        if (result.siteId !== context.router.siteId)
          throw new ApiError("invalid-response");
        const next = { ...context, router: result };
        if (!signal.aborted)
          client.setQueryData(
            routerKeys.detail(active.organizationId, router.id, expectedSite),
            next,
          );
        return next;
      } catch (error) {
        if (
          error instanceof ApiError &&
          [401, 403, 404].includes(error.status)
        ) {
          client.removeQueries({
            queryKey: routerKeys.detail(
              active.organizationId,
              router.id,
              expectedSite,
            ),
            exact: true,
          });
          void client.invalidateQueries({
            queryKey: membershipKeys.access(active.organizationId),
          });
        }
        throw error;
      }
    },
  });
  return {
    ...query,
    tracking: enabled && Date.now() < deadline && awaiting(router),
    pause: () => setEnabled(false),
    refresh: () => {
      setDeadline(Date.now() + 300_000);
      setEnabled(true);
      if (!query.isFetching) void query.refetch();
    },
  };
}
export type RouterChange =
  | { action: "create"; values: RouterCreateValues }
  | { action: "rename"; router: Router; name: string; expectedSite?: string }
  | {
      action: RouterAction;
      router: Router;
      key: string;
      expectedSite?: string;
    };
export function useRouterChange(active: Membership) {
  const { request } = useAuth();
  const client = useQueryClient();
  const mounted = useRef(true),
    lock = useRef(false);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  const mutationKey = routerKeys.mutation(active.organizationId);
  const busy = useIsMutating({ mutationKey }) > 0;
  const mutation = useMutation({
    mutationKey,
    retry: false,
    mutationFn: async (change: RouterChange) => {
      if (change.action === "create") {
        if (!routerCapabilities(active).canCreateRouter)
          throw new ApiError("http", 403);
        const values = routerCreateSchema.parse(change.values);
        const site = await readSite(
          request,
          active.organizationId,
          values.siteId,
        );
        if (site.status !== "ACTIVE") throw new ApiError("http", 409);
        if (!mounted.current) throw new ApiError("aborted");
        return parsedRouter(
          await request("/api/routers", {
            method: "POST",
            body: { ...values, organizationId: active.organizationId },
          }),
          active.organizationId,
          undefined,
          site.id,
        );
      }
      const current = await readContext(
        request,
        active.organizationId,
        change.router.id,
        change.expectedSite,
      );
      const caps = routerCapabilities(active, current.router, current.site);
      // The server remains authoritative for non-public pendingAction and idempotent replay.
      if (
        change.action === "rename" ? !caps.canEditRouter : !caps.canCreateRouter
      )
        throw new ApiError("http", 403);
      if (!mounted.current) throw new ApiError("aborted");
      if (change.action === "rename")
        return parsedRouter(
          await request(path(current.router.id) + "/name", {
            method: "PATCH",
            body: routerNameSchema.parse({ name: change.name }),
          }),
          active.organizationId,
          current.router.id,
          change.expectedSite,
        );
      const routes: Record<RouterAction, [string, string]> = {
        provision: ["POST", "/provisioning"],
        artifact: ["POST", "/configuration-artifacts"],
        suspend: ["POST", "/suspension"],
        resume: ["DELETE", "/suspension"],
        revoke: ["POST", "/revocation"],
      };
      const [method, suffix] = routes[change.action];
      return parsedRouter(
        await request(path(current.router.id) + suffix, {
          method,
          headers: { "Idempotency-Key": z.uuid().parse(change.key) },
        }),
        active.organizationId,
        current.router.id,
        change.expectedSite,
      );
    },
    onSettled: async (_data, error) => {
      if (!mounted.current) return;
      await client.invalidateQueries({
        queryKey: routerKeys.all(active.organizationId),
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
    change: async (value: RouterChange) => {
      if (lock.current || client.isMutating({ mutationKey })) return undefined;
      lock.current = true;
      try {
        const result = await mutation.mutateAsync(value);
        return mounted.current ? result : undefined;
      } finally {
        lock.current = false;
      }
    },
  };
}
