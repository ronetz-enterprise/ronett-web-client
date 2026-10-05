import { usePlatformSession, PlatformAudit } from "@/features/platform-admin";

export default function PlatformAuditPage() {
  const session = usePlatformSession();
  if (!session.data) return null;
  return <PlatformAudit session={session.data} />;
}
