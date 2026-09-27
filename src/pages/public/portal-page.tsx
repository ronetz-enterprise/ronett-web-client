import { PageHeader, EmptyState } from "@/shared/components/feedback";
export default function PortalPage() {
  return (
    <>
      <PageHeader
        title="Portail Wi-Fi"
        description="Bienvenue dans votre espace public."
      />
      <EmptyState
        title="Portail en préparation"
        description="Les offres seront disponibles dans un prochain sprint."
      />
    </>
  );
}
