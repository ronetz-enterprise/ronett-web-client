import { Link, Navigate } from "react-router";
import {
  useMemberships,
  selectionTarget,
  isAccessible,
} from "@/features/memberships";
import { organizationRoutes } from "@/shared/auth/organization-routes";
import { PageLoading } from "@/shared/components/feedback";
import { Button } from "@/shared/ui/button";
import { toUserMessage } from "@/shared/errors/api-error";
export function OrganizationSelection() {
  const query = useMemberships();
  if (query.isPending || query.isFetching) return <PageLoading />;
  if (query.isError)
    return (
      <div role="alert">
        <p>{toUserMessage(query.error)}</p>
        <Button onClick={() => void query.refetch()}>Réessayer</Button>
      </div>
    );
  const target = selectionTarget(query.data);
  if (target === "create")
    return <Navigate replace to={organizationRoutes.create} />;
  if (target !== "select")
    return <Navigate replace to={organizationRoutes.dashboard(target)} />;
  return (
    <ul className="space-y-3">
      {query.data.map((m) => (
        <li key={m.organizationId} className="rounded-lg border p-4">
          {isAccessible(m) ? (
            <Link
              className="underline"
              to={organizationRoutes.dashboard(m.organizationId)}
            >
              {m.organizationName}
            </Link>
          ) : (
            <>
              <span>{m.organizationName}</span>
              <p>
                Accès indisponible —{" "}
                {m.membershipStatus !== "ACTIVE"
                  ? m.membershipStatus
                  : m.organizationStatus}
              </p>
            </>
          )}
        </li>
      ))}
    </ul>
  );
}
