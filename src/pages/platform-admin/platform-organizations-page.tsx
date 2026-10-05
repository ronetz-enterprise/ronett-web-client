import {
  usePlatformSession,
  PlatformOrganizations,
} from "@/features/platform-admin";

export default function PlatformOrganizationsPage() {
  const session = usePlatformSession();
  if (!session.data) return null;
  return <PlatformOrganizations session={session.data} />;
}
