import { Link } from "react-router";
import {
  PageHeader,
  EmptyState,
  StatusBadge,
} from "@/shared/components/feedback";
import { PageSection } from "@/shared/components/page-patterns";
import { Alert, AlertTitle, AlertDescription } from "@/shared/ui/alert";
import { Button } from "@/shared/ui/button";
import { useActiveOrganization } from "@/features/organizations";
import { organizationRoutes } from "@/shared/auth/organization-routes";
export default function DashboardPage() {
  const active = useActiveOrganization();
  return (
    <>
      <PageHeader
        title="Tableau de bord"
        description={active.organizationName + " · " + active.role}
        status={<StatusBadge label="Aperçu" tone="info" />}
      />
      <Alert>
        <AlertTitle>Votre espace organisation est prêt</AlertTitle>
        <AlertDescription>
          La gestion des sites, routeurs et accès WiFi sera disponible
          prochainement. Aucun indicateur opérationnel n’est encore collecté.
        </AlertDescription>
      </Alert>
      <PageSection
        title="Infrastructure"
        description="Disponibilité des services de votre organisation."
      >
        <div className="divide-y rounded-lg border">
          {[
            ["Sites", "Vos lieux de déploiement WiFi."],
            ["Routeurs", "Vos équipements et leur connectivité."],
            ["Accès", "Les droits de connexion de vos utilisateurs."],
          ].map(([title, description]) => (
            <div
              key={title}
              className="flex flex-wrap items-center justify-between gap-3 p-4"
            >
              <div className="space-y-1">
                <h3 className="font-medium">{title}</h3>
                <p className="text-sm text-muted-foreground">{description}</p>
              </div>
              <StatusBadge label="À venir" tone="pending" />
            </div>
          ))}
        </div>
      </PageSection>
      <PageSection title="Activité récente">
        <EmptyState
          title="Aucune activité disponible"
          description="L’historique apparaîtra ici lorsque les services opérationnels seront disponibles."
        />
      </PageSection>
      <PageSection
        title="Votre organisation"
        description="Consultez le contexte de travail et les accès disponibles."
      >
        <Button
          variant="outline"
          nativeButton={false}
          role="link"
          render={
            <Link to={organizationRoutes.overview(active.organizationId)} />
          }
        >
          Voir l’organisation
        </Button>
      </PageSection>
    </>
  );
}
