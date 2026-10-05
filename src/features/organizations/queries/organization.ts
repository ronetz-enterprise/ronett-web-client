import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/features/authentication";
import type { Membership } from "@/features/memberships";
import type { httpClient } from "@/shared/api/http-client";
import { tenantKeys } from "@/shared/api/query-client";
import { ApiError } from "@/shared/errors/api-error";
import { organizationSchema } from "../types/organization";
export async function readOrganization(
  request: typeof httpClient,
  org: string,
  signal?: AbortSignal,
) {
  const parsed = organizationSchema.safeParse(
    await request(`/api/organizations/${org}`, { signal }),
  );
  if (!parsed.success || parsed.data.id !== org)
    throw new ApiError("invalid-response");
  return parsed.data;
}
export function useOrganization(active: Membership) {
  const { request } = useAuth();
  return useQuery({
    queryKey: tenantKeys.resource(active.organizationId, "detail"),
    staleTime: 0,
    refetchOnWindowFocus: true,
    queryFn: ({ signal }) =>
      readOrganization(request, active.organizationId, signal),
  });
}
