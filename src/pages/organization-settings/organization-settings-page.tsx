import {
  OrganizationSettings,
  useActiveOrganization,
} from "@/features/organizations";
import { PageHeader } from "@/shared/components/feedback";
export default function OrganizationSettingsPage() {
  const active = useActiveOrganization();
  return (
    <>
      <PageHeader title="Paramètres de l’organisation" />
      <OrganizationSettings active={active} />
    </>
  );
}
