import { SummaryCard } from "@/shared/components/page-patterns";
import { businessStatusTone } from "@/shared/components/status";
import { PageHeader, StatusBadge } from "@/shared/components/feedback";
import { useActiveOrganization } from "@/features/organizations";
export default function OrganizationPage() {
  const organization = useActiveOrganization();
  return (
    <>
      <PageHeader
        title="Organisation"
        description={organization.organizationName}
      />
      <SummaryCard title="Contexte de l’organisation" className="max-w-4xl">
        <div className="space-y-4">
          <p className="break-all text-sm">
            Identifiant : {organization.organizationId}
          </p>
          <p>Rôle : {organization.role}</p>
          <StatusBadge
            label={organization.organizationStatus}
            tone={
              businessStatusTone[organization.organizationStatus] ?? "neutral"
            }
          />
          <p>
            Les paramètres détaillés seront disponibles dans un prochain sprint.
          </p>
        </div>
      </SummaryCard>
    </>
  );
}
