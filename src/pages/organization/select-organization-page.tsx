import { Link } from "react-router";
import { HugeiconsIcon } from "@hugeicons/react";
import { Add01Icon } from "@hugeicons/core-free-icons";
import { PageHeader } from "@/shared/components/feedback";
import { OrganizationSelection } from "@/features/organizations";
import { organizationRoutes } from "@/shared/auth/organization-routes";
import { Button } from "@/shared/ui/button";
export default function SelectOrganizationPage() {
  return (
    <>
      <PageHeader
        title="Mes organisations"
        description="Choisissez l’organisation à gérer."
      />
      <OrganizationSelection />
      <Button
        variant="outline"
        className="w-full"
        nativeButton={false}
        render={<Link to={organizationRoutes.create} />}
      >
        <HugeiconsIcon
          icon={Add01Icon}
          strokeWidth={1.75}
          data-icon="inline-start"
        />
        Créer une organisation
      </Button>
    </>
  );
}
