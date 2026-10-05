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
import { StatusDot } from "@/shared/components/status-dot";
import { businessStatusTone } from "@/shared/components/status";
import { RelativeTime } from "@/shared/components/relative-time";
import {
  ReadOnlyValue,
  SettingField,
  SettingsSection,
} from "@/shared/components/settings-layout";
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
    <div className="max-w-3xl space-y-10">
      <SettingsSection title="Détails">
        <div className="space-y-6">
          <SettingField
            label="Nom de l’organisation"
            description="Nom de votre organisation dans Ronetz."
          >
            <ReadOnlyValue>{organization.name}</ReadOnlyValue>
          </SettingField>
          <SettingField
            label="Identifiant de l’organisation"
            description="Référence à communiquer au support."
          >
            <ReadOnlyValue
              mono
              copy={{
                value: organization.id,
                label: "l’identifiant de l’organisation",
              }}
            >
              {organization.id}
            </ReadOnlyValue>
          </SettingField>
          <SettingField
            label="Devise"
            description="Utilisée pour les prix des offres et les retraits."
          >
            <ReadOnlyValue>{organization.currency}</ReadOnlyValue>
          </SettingField>
          <SettingField
            label="Statut"
            description="État de l’organisation dans Ronetz."
          >
            <StatusDot
              label={statusLabels[organization.status] ?? organization.status}
              tone={businessStatusTone[organization.status] ?? "neutral"}
            />
          </SettingField>
          <div className="grid max-w-sm gap-6 sm:grid-cols-2">
            <SettingField label="Créée">
              <ReadOnlyValue>
                <RelativeTime value={organization.createdAt} />
              </ReadOnlyValue>
            </SettingField>
            <SettingField label="Dernière modification">
              <ReadOnlyValue>
                <RelativeTime value={organization.updatedAt} />
              </ReadOnlyValue>
            </SettingField>
          </div>
          <p className="text-sm text-muted-foreground">
            <strong className="font-medium text-foreground">
              Consultation uniquement
            </strong>{" "}
            : la modification du nom et de la devise n’est pas encore
            disponible.
          </p>
        </div>
      </SettingsSection>
    </div>
  );
}

const statusLabels: Record<string, string> = {
  ACTIVE: "Active",
  SUSPENDED: "Suspendue",
  CLOSED: "Fermée",
};
