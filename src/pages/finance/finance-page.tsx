import { FinanceOverview } from "@/features/finance";
import { useActiveOrganization } from "@/features/organizations";

export default function FinancePage() {
  const active = useActiveOrganization();
  return <FinanceOverview key={active.organizationId} active={active} />;
}
