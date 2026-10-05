import { usePlatformSession, PlatformNetwork } from "@/features/platform-admin";

export default function PlatformNetworkPage() {
  const session = usePlatformSession();
  if (!session.data) return null;
  return <PlatformNetwork session={session.data} />;
}
