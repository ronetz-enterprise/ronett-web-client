import { PageHeader } from "@/shared/components/feedback";
import { useActiveOrganization } from "@/features/organizations";
import { OrganizationMembers } from "@/features/memberships";
export default function OrganizationMembersPage() {
  const active = useActiveOrganization();
  return (
    <>
      <PageHeader title="Membres" />
      <OrganizationMembers key={active.organizationId} active={active} />
    </>
  );
}
