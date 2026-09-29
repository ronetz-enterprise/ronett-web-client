import { Link, useNavigate, useSearchParams } from "react-router";
import { PageHeader } from "@/shared/components/feedback";
import { RegisterForm, safeAuthDestination } from "@/features/authentication";
export default function RegisterPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const login =
    "/auth/login?returnTo=" +
    encodeURIComponent(safeAuthDestination(params.get("returnTo")));
  return (
    <>
      <PageHeader
        title="Inscription"
        description="Créez votre compte pour rejoindre ou gérer une organisation."
      />
      <RegisterForm
        onSuccess={() =>
          navigate(login, { replace: true, state: { registered: true } })
        }
      />
      <Link
        to={login}
        className="inline-block text-sm underline underline-offset-4"
      >
        Déjà un compte ? Connexion
      </Link>
    </>
  );
}
