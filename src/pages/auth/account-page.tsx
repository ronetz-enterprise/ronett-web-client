import { PageHeader } from "@/shared/components/feedback";
import { SessionMenu } from "@/features/authentication";
export default function AccountPage() {
  return (
    <>
      <PageHeader title="Ma session" />
      <p>Votre identité est vérifiée auprès du serveur.</p>
      <SessionMenu />
    </>
  );
}
