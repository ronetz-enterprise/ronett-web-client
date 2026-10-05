import { PlatformFinance, usePlatformSession } from "@/features/platform-admin";

export default function PlatformFinancePage() {
  const session = usePlatformSession();
  if (!session.data) return null;
  return <PlatformFinance session={session.data} />;
}
