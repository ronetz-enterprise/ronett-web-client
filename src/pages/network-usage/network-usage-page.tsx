import { NetworkUsageOverview } from "@/features/network-usage";
import { useActiveOrganization } from "@/features/organizations";

export default function NetworkUsagePage() {
  const active = useActiveOrganization();
  return <NetworkUsageOverview key={active.organizationId} active={active} />;
}
