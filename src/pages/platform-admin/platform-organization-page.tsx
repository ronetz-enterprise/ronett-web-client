import {
  usePlatformSession,
  PlatformOrganizationDetails,
} from "@/features/platform-admin";

export default function PlatformOrganizationPage() {
  const session = usePlatformSession();
  if (!session.data) return null;
  return <PlatformOrganizationDetails session={session.data} />;
}
