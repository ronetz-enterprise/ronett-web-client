import { PageHeader, EmptyState } from "@/shared/components/feedback";
import { useOrganizationContext } from "@/shared/auth/organization-context";
export default function OrganizationPage() {
  const { organizationId } = useOrganizationContext();
  return (
    <>
      <PageHeader
        title="Organisation"
        description="Le contexte est défini par l’adresse de cet espace."
      />
      <p className="break-all text-sm">Identifiant : {organizationId}</p>
      <EmptyState
        title="Informations en préparation"
        description="Le sélecteur sera activé lorsque le contrat des organisations accessibles sera disponible."
      />
    </>
  );
}
