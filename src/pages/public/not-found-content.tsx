import { Link } from "react-router";
import { PageHeader } from "@/shared/components/feedback";
export function NotFoundContent() {
  return (
    <section className="space-y-4 p-4">
      <PageHeader
        title="Page introuvable"
        description="Cette adresse ne correspond à aucune page."
      />
      <Link to="/" className="underline">
        Retour à l’accueil
      </Link>
    </section>
  );
}
