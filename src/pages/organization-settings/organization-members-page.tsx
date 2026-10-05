import { useActiveOrganization } from "@/features/organizations";
import { OrganizationMembers } from "@/features/memberships";
import { PageHeader } from "@/shared/components/feedback";
export default function OrganizationMembersPage() {
  const active = useActiveOrganization();
  return (
    <>
      <PageHeader title="Membres" />
      <OrganizationMembers key={active.organizationId} active={active} />
    </>
  );
}
