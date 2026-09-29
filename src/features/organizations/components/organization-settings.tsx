import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/features/authentication";
import {
  membershipKeys,
  type Membership,
  organizationCapabilities,
} from "@/features/memberships";
import { tenantKeys } from "@/shared/api/query-client";
import { ApiError } from "@/shared/errors/api-error";
import {
  ContentSkeleton,
  QueryFailure,
} from "@/shared/components/query-feedback";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/shared/ui/card";
import { StatusBadge } from "@/shared/components/feedback";
import { businessStatusTone } from "@/shared/components/status";
import { Alert, AlertTitle, AlertDescription } from "@/shared/ui/alert";
import { organizationSchema } from "../types/organization";
export function OrganizationSettings({ active }: { active: Membership }) {
  const { request } = useAuth();
  const client = useQueryClient();
  const query = useQuery({
    queryKey: tenantKeys.resource(active.organizationId, "detail"),
    retry: false,
    retryOnMount: false,
    enabled: organizationCapabilities(active).canViewOrganization,
    queryFn: async ({ signal }) => {
      try {
        const result = organizationSchema.safeParse(
          await request("/api/organizations/" + active.organizationId, {
            signal,
          }),
        );
        if (!result.success || result.data.id !== active.organizationId)
          throw new ApiError("invalid-response");
        return result.data;
      } catch (error) {
        if (error instanceof ApiError && error.status === 403)
          void client.invalidateQueries({
            queryKey: membershipKeys.access(active.organizationId),
          });
        throw error;
      }
    },
  });
  if (!organizationCapabilities(active).canViewOrganization)
    return <QueryFailure error={new ApiError("http", 403)} />;
  if (query.isPending) return <ContentSkeleton />;
  if (query.isError)
    return (
      <QueryFailure error={query.error} retry={() => void query.refetch()} />
    );
  const organization = query.data;
  return (
    <div className="max-w-4xl space-y-6">
      <Card className="text-sm">
        <CardHeader>
          <CardTitle>
            <h2>Informations générales</h2>
          </CardTitle>
          <CardDescription>Organisation active vérifiée.</CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-muted-foreground">Nom</dt>
              <dd className="break-words">{organization.name}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Devise</dt>
              <dd>{organization.currency}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Statut</dt>
              <dd>
                <StatusBadge
                  label={organization.status}
                  tone={businessStatusTone[organization.status] ?? "neutral"}
                />
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Identifiant</dt>
              <dd className="break-all">{organization.id}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Créée le</dt>
              <dd>
                {new Date(organization.createdAt).toLocaleDateString("fr-FR")}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Mise à jour le</dt>
              <dd>
                {new Date(organization.updatedAt).toLocaleDateString("fr-FR")}
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>
      <Alert>
        <AlertTitle>Consultation uniquement</AlertTitle>
        <AlertDescription>
          La modification du nom et de la devise n’est pas encore disponible.
        </AlertDescription>
      </Alert>
    </div>
  );
}
