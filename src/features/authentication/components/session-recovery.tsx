import { Button } from "@/shared/ui/button";
import { useAuth } from "../hooks/auth-provider";
export function SessionRecovery() {
  const auth = useAuth();
  return (
    <section className="mx-auto max-w-xl space-y-4 p-6">
      <h1 className="text-2xl font-semibold">
        Session momentanément indisponible
      </h1>
      <p role="alert">
        La session n’a pas pu être vérifiée. Réessayez lorsque la connexion est
        rétablie.
      </p>
      <Button onClick={() => void auth.restore().catch(() => {})}>
        Réessayer
      </Button>
    </section>
  );
}
