import { Link } from "react-router";
import { PageHeader, EmptyState } from "@/shared/components/feedback";
export default function RegisterPage() {
  return (
    <>
      <PageHeader title="Inscription" />
      <EmptyState title="Inscription en préparation" />
      <Link to="/auth/login" className="underline">
        Connexion
      </Link>
    </>
  );
}
