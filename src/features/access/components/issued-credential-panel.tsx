import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Copy01Icon, ShieldCheckIcon } from "@hugeicons/core-free-icons";
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert";
import { Button } from "@/shared/ui/button";
import { formatInstant } from "../formatters/access";
import type { IssuedCredential } from "../model/manual-access";

/**
 * Identifiants d'un accès qui vient d'être créé, affichés une seule fois.
 *
 * Le secret n'est jamais écrit dans une query TanStack, un store, une URL, un
 * `localStorage`/`sessionStorage` ou un log : il vit dans l'état de ce
 * composant et disparaît au démontage ou à la navigation. La copie est
 * explicite, séparée et annoncée ; aucun effacement du presse-papiers n'est
 * promis, car il n'est pas fiable sur tous les appareils.
 */
export function IssuedCredentialPanel({
  credential,
  onAcknowledge,
}: {
  credential: IssuedCredential;
  onAcknowledge?: () => void;
}) {
  const [revealed, setRevealed] = useState(false);
  const [message, setMessage] = useState("");
  async function copy(value: string, what: string) {
    try {
      await navigator.clipboard.writeText(value);
      setMessage(`${what} copié dans le presse-papiers.`);
    } catch {
      setMessage(
        `Copie indisponible. Sélectionnez la valeur et copiez-la manuellement.`,
      );
    }
  }
  return (
    <div className="space-y-4">
      <Alert>
        <HugeiconsIcon icon={ShieldCheckIcon} strokeWidth={1.75} />
        <AlertTitle>Notez le mot de passe maintenant</AlertTitle>
        <AlertDescription>
          <p>
            Il ne sera plus affiché ensuite, ni pour vous ni pour votre équipe.
            Donnez-le au client en main propre ou par un message privé.
          </p>
        </AlertDescription>
      </Alert>

      <div className="space-y-4">
        <Field
          label="Identifiant de connexion"
          value={credential.username}
          onCopy={() => void copy(credential.username, "Identifiant")}
        />
        <Field
          label="Mot de passe"
          value={revealed ? credential.clearTextPassword : "•".repeat(16)}
          secret
          onCopy={() => {
            if (!revealed) {
              setMessage("Affichez d’abord le mot de passe pour le copier.");
              return;
            }
            void copy(credential.clearTextPassword, "Mot de passe");
          }}
          actions={
            <Button
              variant="outline"
              size="sm"
              aria-pressed={revealed}
              onClick={() => setRevealed((value) => !value)}
            >
              {revealed ? "Masquer" : "Afficher"}
            </Button>
          }
        />
        <p className="text-sm text-muted-foreground">
          Valable jusqu’au {formatInstant(credential.expiresAt)}
        </p>
      </div>

      <p
        role="status"
        aria-live="polite"
        className="text-sm text-muted-foreground"
      >
        {message}
      </p>

      {onAcknowledge && (
        <Button onClick={onAcknowledge}>J’ai noté les identifiants</Button>
      )}
    </div>
  );
}

function Field({
  label,
  value,
  secret = false,
  onCopy,
  actions,
}: {
  label: string;
  value: string;
  secret?: boolean;
  onCopy: () => void;
  actions?: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p
        className="font-mono text-sm break-all select-all"
        // Le secret masqué n'est jamais lu par un lecteur d'écran.
        aria-label={secret ? `${label} masqué` : label}
      >
        {value}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onCopy}
          aria-label={`Copier : ${label.toLowerCase()}`}
        >
          <HugeiconsIcon
            icon={Copy01Icon}
            data-icon="inline-start"
            strokeWidth={1.75}
            aria-hidden="true"
          />
          Copier
        </Button>
        {actions}
      </div>
    </div>
  );
}
