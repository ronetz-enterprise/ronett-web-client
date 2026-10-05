import { OrganizationDashboard } from "@/features/dashboard";
import { useActiveOrganization } from "@/features/organizations";

export default function DashboardPage() {
  const active = useActiveOrganization();
  return <OrganizationDashboard key={active.organizationId} active={active} />;
}
