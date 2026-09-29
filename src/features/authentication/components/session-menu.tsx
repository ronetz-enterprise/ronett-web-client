import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { Button } from "@/shared/ui/button";
import { useAuth } from "../hooks/auth-provider";
import { usePrincipal } from "@/features/identity";
export function SessionMenu() {
  const auth = useAuth();
  const principal = usePrincipal();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  return (
    <div className="min-w-0 space-y-2 text-sm group-data-[collapsible=icon]:hidden">
      <p className="break-all">{principal.data?.email ?? auth.loginEmail}</p>
      <Link className="block underline" to="/account">
        Ma session
      </Link>
      <Button
        variant="outline"
        className="text-foreground"
        disabled={busy}
        onClick={() => {
          if (busy) return;
          setBusy(true);
          void auth.logout().then((result) =>
            navigate("/auth/login", {
              replace: true,
              state: { logout: result.server },
            }),
          );
        }}
      >
        Se déconnecter
      </Button>
    </div>
  );
}
