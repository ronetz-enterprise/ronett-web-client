import { PageHeader, EmptyState } from "@/shared/components/feedback";
export default function DashboardPage() {
  return (
    <>
      <PageHeader
        title="Tableau de bord"
        description="Votre espace de gestion Wi-Fi."
      />
      <div className="grid auto-rows-min gap-4 md:grid-cols-3">
        {["Sites", "Routeurs", "Accès"].map((title) => (
          <EmptyState
            key={title}
            title={title}
            description="Disponible dans un prochain sprint."
          />
        ))}
      </div>
      <EmptyState
        title="Votre activité"
        description="Aucune donnée métier n’est chargée dans cet aperçu."
      />
    </>
  );
}
