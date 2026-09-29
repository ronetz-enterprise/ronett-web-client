import { Link } from "react-router";
import { PageHeader } from "@/shared/components/feedback";
import { SessionMenu } from "@/features/authentication";
import { OrganizationSelection } from "@/features/organizations";
import { organizationRoutes } from "@/shared/auth/organization-routes";
export default function SelectOrganizationPage() {
  return (
    <>
      <PageHeader title="Mes organisations" />
      <OrganizationSelection />
      <Link className="block underline" to={organizationRoutes.create}>
        Créer une organisation
      </Link>
      <SessionMenu />
    </>
  );
}
