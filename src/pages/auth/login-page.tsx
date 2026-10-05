import { Link, useLocation, useNavigate, useSearchParams } from "react-router";
import { PageHeader } from "@/shared/components/feedback";
import { LoginForm, safeAuthDestination } from "@/features/authentication";
export default function LoginPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const location = useLocation();
  const state = location.state as {
    registered?: boolean;
    logout?: string;
  } | null;
  return (
    <>
      <PageHeader
        title="Connexion"
        description="Retrouvez vos organisations et votre espace de gestion."
      />
      {state?.registered && (
        <p role="status">Compte créé. Connectez-vous pour continuer.</p>
      )}
      {state?.logout === "unconfirmed" && (
        <p role="alert">
          Déconnexion locale effectuée. La révocation de la session serveur n’a
          pas pu être confirmée.
        </p>
      )}
      {state?.logout === "revoked" && (
        <p role="status">Session serveur révoquée.</p>
      )}
      <LoginForm
        onSuccess={() =>
          navigate(safeAuthDestination(params.get("returnTo")), {
            replace: true,
          })
        }
      />
      <p className="text-sm text-muted-foreground">
        Pour votre sécurité, cette session reste en mémoire. Actualiser la page
        nécessite une nouvelle connexion.
      </p>
      <Link
        to={
          "/auth/register" +
          (params.get("returnTo")
            ? "?returnTo=" +
              encodeURIComponent(safeAuthDestination(params.get("returnTo")))
            : "")
        }
        className="inline-block text-sm underline underline-offset-4"
      >
        Pas encore de compte ? Créer un compte
      </Link>
    </>
  );
}
