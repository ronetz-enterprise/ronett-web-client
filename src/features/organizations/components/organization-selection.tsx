import { Link, Navigate } from "react-router";
import {
  useMemberships,
  selectionTarget,
  isAccessible,
} from "@/features/memberships";
import { organizationRoutes } from "@/shared/auth/organization-routes";
import { PageLoading } from "@/shared/components/feedback";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowRight02Icon } from "@hugeicons/core-free-icons";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { cn } from "@/shared/utils/cn";
import { initials, tintFor } from "@/shared/utils/tint";
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
    <ul className="space-y-2" aria-label="Mes organisations">
      {query.data.map((m) => {
        const accessible = isAccessible(m);
        const reason =
          m.membershipStatus !== "ACTIVE"
            ? membershipReasons[m.membershipStatus]
            : organizationReasons[m.organizationStatus];
        return (
          <li
            key={m.organizationId}
            className={cn(
              "group relative flex items-center gap-3 rounded-lg border p-3",
              accessible
                ? "transition-colors hover:bg-muted/50 has-focus-visible:ring-[3px] has-focus-visible:ring-ring/50"
                : "bg-muted/40",
            )}
          >
            <span
              aria-hidden="true"
              className={cn(
                "flex size-9 shrink-0 items-center justify-center rounded-lg font-heading text-sm font-semibold",
                tintFor(m.organizationId),
                !accessible && "opacity-50",
              )}
            >
              {initials(m.organizationName)}
            </span>
            <div className="min-w-0 flex-1">
              {accessible ? (
                <Link
                  className="font-medium break-words outline-none after:absolute after:inset-0"
                  to={organizationRoutes.dashboard(m.organizationId)}
                >
                  {m.organizationName}
                </Link>
              ) : (
                <span className="font-medium break-words text-muted-foreground">
                  {m.organizationName}
                </span>
              )}
              <p className="text-xs text-muted-foreground">
                {accessible
                  ? "Accès disponible"
                  : `Accès indisponible · ${reason}`}
              </p>
            </div>
            <Badge variant="secondary">
              {m.role === "OWNER" ? "Propriétaire" : m.role}
            </Badge>
            {accessible && (
              <HugeiconsIcon
                icon={ArrowRight02Icon}
                strokeWidth={1.75}
                aria-hidden="true"
                className="size-4 text-muted-foreground transition-transform duration-150 group-hover:translate-x-0.5"
              />
            )}
          </li>
        );
      })}
    </ul>
  );
}

const membershipReasons: Record<string, string> = {
  SUSPENDED: "appartenance suspendue",
  REVOKED: "appartenance révoquée",
};
const organizationReasons: Record<string, string> = {
  SUSPENDED: "organisation suspendue",
  CLOSED: "organisation fermée",
  ACTIVE: "droits insuffisants",
};
