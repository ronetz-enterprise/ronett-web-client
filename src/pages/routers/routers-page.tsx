import { useActiveOrganization } from "@/features/organizations";
import { RouterList } from "@/features/router";
export default function RoutersPage() {
  const active = useActiveOrganization();
  return <RouterList key={active.organizationId} active={active} />;
}
