import { PageHeader, EmptyState } from "@/shared/components/feedback";
export default function PlatformAdminPage() {
  return (
    <>
      <PageHeader
        title="Administration plateforme"
        description="Contexte plateforme, distinct des organisations."
      />
      <EmptyState title="Administration en préparation" />
    </>
  );
}
