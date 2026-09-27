import { Link } from "react-router";
import { PageHeader } from "@/shared/components/feedback";
export default function HomePage() {
  return (
    <>
      <PageHeader
        title="Bienvenue sur Ronet"
        description="Le socle de votre espace de gestion Wi-Fi."
      />
      <nav aria-label="Accueil" className="flex flex-col gap-4">
        <Link to="/auth/login" className="underline">
          Connexion
        </Link>
        <Link to="/public" className="underline">
          Portail public
        </Link>
        <Link
          to="/app/00000000-0000-4000-8000-000000000001"
          className="underline"
        >
          Aperçu de l’espace organisation
        </Link>
      </nav>
    </>
  );
}
