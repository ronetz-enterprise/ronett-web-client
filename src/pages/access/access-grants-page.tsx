import { AccessGrantList } from "@/features/access";
import { useActiveOrganization } from "@/features/organizations";

export default function AccessGrantsPage() {
  const active = useActiveOrganization();
  return <AccessGrantList key={active.organizationId} active={active} />;
}
