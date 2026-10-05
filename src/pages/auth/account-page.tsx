import { PageHeader } from "@/shared/components/feedback";
import { AccountOverview } from "@/features/authentication";
export default function AccountPage() {
  return (
    <>
      <PageHeader title="Mon compte" />
      <AccountOverview />
    </>
  );
}
