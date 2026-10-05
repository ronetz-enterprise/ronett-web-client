import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { usePrincipal } from "@/features/identity";
import { CopyableId } from "@/shared/components/copyable-id";
import { KeyValueList } from "@/shared/components/key-value-list";
import { QueryFailure } from "@/shared/components/query-feedback";
import { StatusDot } from "@/shared/components/status-dot";
import { organizationRoutes } from "@/shared/auth/organization-routes";
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert";
import { Avatar, AvatarFallback } from "@/shared/ui/avatar";
import { Button } from "@/shared/ui/button";
import { Skeleton } from "@/shared/ui/skeleton";
import { useAuth } from "../hooks/auth-provider";

/**
 * Compte : identité vérifiée par le serveur et session courante. Le backend n'expose ni la
 * liste des sessions ni la déconnexion des autres appareils : l'écran le dit au lieu de simuler.
 */
export function AccountOverview() {
  const auth = useAuth();
  const principal = usePrincipal();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  function logout() {
    if (busy) return;
    setBusy(true);
    void auth.logout().then((result) =>
      navigate("/auth/login", {
        replace: true,
        state: { logout: result.server },
      }),
    );
  }
  if (principal.isPending) return <Skeleton className="h-40 w-full" />;
  if (principal.isError)
    return (
      <QueryFailure
        error={principal.error}
        retry={() => void principal.refetch()}
      />
    );
  const me = principal.data;
  const name = `${me.firstName} ${me.lastName}`.trim();
  return (
    <div className="space-y-6">
      <section aria-labelledby="account-identity" className="space-y-3">
        <div className="flex items-center gap-3">
          <Avatar size="lg" aria-hidden="true">
            <AvatarFallback className="bg-primary/10 font-medium text-primary">
              {`${me.firstName.charAt(0)}${me.lastName.charAt(0)}`.toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <h2
              id="account-identity"
              className="font-heading text-base font-semibold break-words"
            >
              {name || me.email}
            </h2>
            <p className="text-sm break-all text-muted-foreground">
              {me.email}
            </p>
          </div>
        </div>
        <KeyValueList
          items={[
            {
              label: "Statut",
              value: <StatusDot label="Compte actif" tone="success" />,
            },
            ...(me.platformAdmin
              ? [{ label: "Rôle", value: "Administration Ronetz" }]
              : []),
            {
              label: "Identifiant",
              value: (
                <CopyableId value={me.userId} label="identifiant utilisateur" />
              ),
              hint: "À communiquer à un propriétaire pour être ajouté à son organisation.",
            },
          ]}
        />
      </section>

      <section aria-labelledby="account-sessions" className="space-y-3">
        <h2
          id="account-sessions"
          className="font-heading text-sm font-semibold"
        >
          Sessions
        </h2>
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3">
          <div className="space-y-0.5">
            <StatusDot label="Cet appareil" tone="success" live />
            <p className="text-xs text-muted-foreground">
              Session en cours, vérifiée auprès du serveur.
            </p>
          </div>
          <Button variant="outline" size="sm" disabled={busy} onClick={logout}>
            {busy ? "Déconnexion…" : "Se déconnecter"}
          </Button>
        </div>
        <Alert>
          <AlertTitle>Autres appareils</AlertTitle>
          <AlertDescription>
            La liste des sessions ouvertes et la déconnexion des autres
            appareils ne sont pas encore disponibles.
          </AlertDescription>
        </Alert>
      </section>

      <Link
        className="inline-block text-sm underline underline-offset-4"
        to={organizationRoutes.select}
      >
        Mes organisations
      </Link>
    </div>
  );
}
