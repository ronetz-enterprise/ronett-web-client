import { Link } from "react-router";
import { PageHeader, EmptyState } from "@/shared/components/feedback";
export default function LoginPage() {
  return (
    <>
      <PageHeader title="Connexion" />
      <EmptyState
        title="Connexion en préparation"
        description="Aucun identifiant n’est demandé pendant ce sprint."
      />
      <Link to="/auth/register" className="underline">
        Inscription
      </Link>
    </>
  );
}
