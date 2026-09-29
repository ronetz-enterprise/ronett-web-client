import { useEffect } from "react";
import { Outlet, useParams } from "react-router";
import { useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { useMembershipAccess, useMemberships } from "@/features/memberships";
import {
  OrganizationAccessNotice,
  OrganizationContext,
} from "@/features/organizations";
import { PageLoading } from "@/shared/components/feedback";
import { clearOrganizationCache, tenantKeys } from "@/shared/api/query-client";
import NotFoundPage from "@/pages/public/not-found-page";
export default function OrganizationRoute() {
  const { organizationId } = useParams();
  return z.uuid().safeParse(organizationId).success ? (
    <ValidatedOrganization key={organizationId} id={organizationId!} />
  ) : (
    <NotFoundPage />
  );
}
function ValidatedOrganization({ id }: { id: string }) {
  const client = useQueryClient();
  const list = useMemberships();
  const access = useMembershipAccess(id, list.isSuccess);
  useEffect(() => () => clearOrganizationCache(client, id), [client, id]);
  useEffect(() => {
    if (!access.isError) return;
    const filters = {
      queryKey: tenantKeys.all(id),
      predicate: (q: { queryKey: readonly unknown[] }) =>
        q.queryKey[2] !== "access",
    };
    void client.cancelQueries(filters);
    client.removeQueries(filters);
  }, [access.isError, client, id]);
  if (list.isError || access.isError)
    return (
      <main className="mx-auto max-w-xl p-6">
        <OrganizationAccessNotice
          error={list.error || access.error}
          retry={() => {
            void list.refetch();
            void access.refetch();
          }}
        />
      </main>
    );
  if (list.isPending || access.isPending || access.isFetching)
    return <PageLoading />;
  return (
    <OrganizationContext.Provider value={access.data}>
      <Outlet />
    </OrganizationContext.Provider>
  );
}
